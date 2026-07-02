-- RLS hardening
--
-- Goal: re-enable Row-Level Security on the tables where it was switched off
-- (scores, friend_groups, friend_group_members) with a policy set that matches
-- how the app actually queries, and remove the SECURITY DEFINER "escape hatch"
-- functions that were added to work around the missing policies.
--
-- Design notes:
--   * scores/game_stats/profiles are readable by any authenticated user because
--     the product has a global "All Players" leaderboard. Writes stay owner-only.
--   * Cross-table membership checks use SECURITY DEFINER helper functions so the
--     policies never recurse through each other's RLS.
--   * This migration is idempotent (safe to re-run).

begin;

-- ---------------------------------------------------------------------------
-- 0. Drop legacy / drifted policies by their historical names. Some of these
--    (notably the "USING (true)" UPDATE on friend_groups and the
--    "WITH CHECK (true)" INSERT on scores) are themselves security holes that
--    let any authenticated user edit any group or forge scores as another user.
--    DROP ... IF EXISTS is a no-op where the name is absent (e.g. production).
-- ---------------------------------------------------------------------------
drop policy if exists "view_all_groups"                     on public.friend_groups;
drop policy if exists "update_group_policy"                 on public.friend_groups;
drop policy if exists "update_own_groups"                   on public.friend_groups;
drop policy if exists "insert_own_groups"                   on public.friend_groups;
drop policy if exists "delete_own_groups"                   on public.friend_groups;

drop policy if exists "view_group_members_for_participants" on public.friend_group_members;
drop policy if exists "insert_members_to_owned_groups"      on public.friend_group_members;
drop policy if exists "delete_members_from_owned_groups"    on public.friend_group_members;

drop policy if exists "Enable read access for all users"    on public.scores;
drop policy if exists "Enable insert for authenticated users only" on public.scores;
drop policy if exists "view_own_and_group_member_scores"    on public.scores;

-- ---------------------------------------------------------------------------
-- 1. Helper: owner-or-member-or-invitee check (any membership status).
--    SECURITY DEFINER so it bypasses RLS internally and cannot recurse.
--    can_user_access_group() already exists and covers owner + *accepted*
--    members; this variant also returns true for pending invitees so they can
--    see the name of a group they were invited to.
-- ---------------------------------------------------------------------------
create or replace function public.is_group_owner_or_member(p_group_id uuid, p_user_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select
    exists (select 1 from friend_groups where id = p_group_id and user_id = p_user_id)
    or exists (select 1 from friend_group_members where group_id = p_group_id and friend_id = p_user_id);
$$;

-- Supabase's default privileges grant EXECUTE to anon/authenticated on new
-- public functions; revoke everything and grant back only to authenticated
-- (the sole role subject to the policy that calls this) + service_role.
revoke all on function public.is_group_owner_or_member(uuid, uuid) from public, anon, authenticated, service_role;
grant execute on function public.is_group_owner_or_member(uuid, uuid) to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 2. scores: single "authenticated can read" SELECT policy; owner-only writes.
-- ---------------------------------------------------------------------------
drop policy if exists "Users can view scores of users in the same group" on public.scores;
drop policy if exists "Users can view their friends' scores"            on public.scores;
drop policy if exists "Users can view their own scores"                 on public.scores;
drop policy if exists "Authenticated users can view all scores"         on public.scores;

create policy "Authenticated users can view all scores"
  on public.scores for select to authenticated using (true);

-- Recreate write policies defensively (idempotent).
drop policy if exists "Users can insert their own scores" on public.scores;
create policy "Users can insert their own scores"
  on public.scores for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists "Users can update their own scores" on public.scores;
create policy "Users can update their own scores"
  on public.scores for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Users can delete their own scores" on public.scores;
create policy "Users can delete their own scores"
  on public.scores for delete to authenticated using (auth.uid() = user_id);

alter table public.scores enable row level security;

-- ---------------------------------------------------------------------------
-- 3. friend_groups: owner full control + members/invitees can read.
-- ---------------------------------------------------------------------------
drop policy if exists "Members and invitees can view groups" on public.friend_groups;
create policy "Members and invitees can view groups"
  on public.friend_groups for select to authenticated
  using (is_group_owner_or_member(id, auth.uid()));

-- Keep existing owner SELECT policy too (redundant with the above but harmless);
-- ensure owner write policies exist.
drop policy if exists "Users can create their own friend groups" on public.friend_groups;
create policy "Users can create their own friend groups"
  on public.friend_groups for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists "Users can update their own friend groups" on public.friend_groups;
create policy "Users can update their own friend groups"
  on public.friend_groups for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Users can delete their own friend groups" on public.friend_groups;
create policy "Users can delete their own friend groups"
  on public.friend_groups for delete to authenticated using (auth.uid() = user_id);

alter table public.friend_groups enable row level security;

-- ---------------------------------------------------------------------------
-- 4. friend_group_members:
--      SELECT  - my own rows (any status) OR co-members of my groups
--      INSERT  - group owner or accepted member may invite
--      UPDATE  - the invitee may accept their own invitation
--      DELETE  - group owner may remove anyone; a member may remove themselves
-- ---------------------------------------------------------------------------
drop policy if exists "Users can view their own memberships"          on public.friend_group_members;
create policy "Users can view their own memberships"
  on public.friend_group_members for select to authenticated
  using (friend_id = auth.uid());

drop policy if exists "Users can view members of groups they belong to" on public.friend_group_members;
create policy "Users can view members of groups they belong to"
  on public.friend_group_members for select to authenticated
  using (can_user_access_group(group_id, auth.uid()));

-- Replace the old owner-only INSERT with owner-or-member.
drop policy if exists "Users can add members to their own friend groups" on public.friend_group_members;
drop policy if exists "Group owners and members can invite"              on public.friend_group_members;
create policy "Group owners and members can invite"
  on public.friend_group_members for insert to authenticated
  with check (can_user_access_group(group_id, auth.uid()));

drop policy if exists "Invitees can accept their own invitation" on public.friend_group_members;
create policy "Invitees can accept their own invitation"
  on public.friend_group_members for update to authenticated
  using (friend_id = auth.uid()) with check (friend_id = auth.uid());

drop policy if exists "Users can remove members from their own friend groups" on public.friend_group_members;
create policy "Users can remove members from their own friend groups"
  on public.friend_group_members for delete to authenticated
  using (
    exists (
      select 1 from friend_groups
      where friend_groups.id = friend_group_members.group_id
        and friend_groups.user_id = auth.uid()
    )
  );

drop policy if exists "Members can leave or decline" on public.friend_group_members;
create policy "Members can leave or decline"
  on public.friend_group_members for delete to authenticated
  using (friend_id = auth.uid());

alter table public.friend_group_members enable row level security;

-- ---------------------------------------------------------------------------
-- 5. connections: allow either party to delete (remove friend / decline).
--    Previously there was no DELETE policy, which is why removal relied on the
--    force_delete_connection() SECURITY DEFINER function.
-- ---------------------------------------------------------------------------
drop policy if exists "Users can delete their own connections" on public.connections;
create policy "Users can delete their own connections"
  on public.connections for delete to authenticated
  using (auth.uid() = user_id or auth.uid() = friend_id);

-- ---------------------------------------------------------------------------
-- 6. profiles: allow a user to insert their own profile row (used at signup).
-- ---------------------------------------------------------------------------
drop policy if exists "Users can insert their own profile" on public.profiles;
create policy "Users can insert their own profile"
  on public.profiles for insert to authenticated with check (auth.uid() = id);

-- ---------------------------------------------------------------------------
-- 7. Drop the SECURITY DEFINER escape hatches (arbitrary-SQL / ownership-bypass).
--    All were EXECUTE-able by anon, i.e. by anyone holding the public anon key.
-- ---------------------------------------------------------------------------
drop function if exists public.direct_sql_query(text);
drop function if exists public.force_delete_connection(uuid);
drop function if exists public.add_friend_test_scores(text, uuid, uuid, date, date, date);

commit;
