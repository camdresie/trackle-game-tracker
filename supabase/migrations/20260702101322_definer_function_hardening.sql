-- SECURITY DEFINER function hardening
--
-- Follow-up to 20260702084710_rls_hardening. Clears the remaining security
-- advisors on SECURITY DEFINER functions and closes one real integrity hole:
-- update_game_stats accepted an arbitrary p_user_id with no check, so any
-- authenticated caller could overwrite another user's game_stats.
--
-- Idempotent / safe to re-run.

begin;

-- ---------------------------------------------------------------------------
-- 1. Pin a stable search_path on the flagged functions (no body change).
--    ALTER FUNCTION only appends the setting; it does not touch the body.
-- ---------------------------------------------------------------------------
alter function public.can_user_access_group(uuid, uuid) set search_path = public;
alter function public.get_user_game_stats(uuid)          set search_path = public;
alter function public.update_updated_at_column()         set search_path = public;
alter function public.handle_new_user()                  set search_path = public, pg_temp;

-- ---------------------------------------------------------------------------
-- 2. update_game_stats: same body as before, plus a fixed search_path and a
--    guard so a user can only update their own stats. auth.uid() reflects the
--    calling user's JWT even inside a SECURITY DEFINER function; it is NULL for
--    service-role / internal callers, which are allowed through.
-- ---------------------------------------------------------------------------
create or replace function public.update_game_stats(p_user_id uuid, p_game_id text, p_score integer, p_date date)
returns game_stats
language plpgsql
security definer
set search_path = public
as $function$
DECLARE
  v_game_stats public.game_stats;
  v_prev_date DATE;
  v_streak_broken BOOLEAN;
BEGIN
  -- Only allow a user to update their own stats (service role bypasses).
  IF auth.uid() IS NOT NULL AND auth.uid() <> p_user_id THEN
    RAISE EXCEPTION 'Not authorized to update another user''s game stats';
  END IF;

  -- Check if entry exists
  SELECT * INTO v_game_stats
  FROM public.game_stats
  WHERE user_id = p_user_id AND game_id = p_game_id;

  -- Get the most recent play date
  SELECT MAX(date::date) INTO v_prev_date
  FROM public.scores
  WHERE user_id = p_user_id AND game_id = p_game_id;

  -- Check if streak is broken (more than 1 day gap)
  v_streak_broken := v_prev_date IS NOT NULL AND p_date > v_prev_date + INTERVAL '1 day';

  IF v_game_stats.id IS NULL THEN
    -- Insert new record if it doesn't exist
    INSERT INTO public.game_stats (
      user_id,
      game_id,
      best_score,
      average_score,
      total_plays,
      current_streak,
      longest_streak
    ) VALUES (
      p_user_id,
      p_game_id,
      p_score,
      p_score,
      1,
      1,
      1
    )
    RETURNING * INTO v_game_stats;
  ELSE
    -- Update existing record
    UPDATE public.game_stats
    SET
      best_score = CASE
        WHEN p_game_id = 'wordle' OR p_game_id = 'mini-crossword' THEN
          LEAST(COALESCE(best_score, p_score), p_score)
        ELSE
          GREATEST(COALESCE(best_score, p_score), p_score)
        END,
      average_score = (COALESCE(average_score, 0) * total_plays + p_score) / (total_plays + 1),
      total_plays = total_plays + 1,
      current_streak = CASE
        WHEN v_streak_broken THEN 1
        ELSE current_streak + 1
        END,
      longest_streak = CASE
        WHEN v_streak_broken THEN GREATEST(longest_streak, 1)
        ELSE GREATEST(longest_streak, current_streak + 1)
        END,
      updated_at = NOW()
    WHERE user_id = p_user_id AND game_id = p_game_id
    RETURNING * INTO v_game_stats;
  END IF;

  RETURN v_game_stats;
END;
$function$;

-- ---------------------------------------------------------------------------
-- 3. Least privilege: these definer functions are only ever invoked by
--    signed-in users (via RLS policies or direct RPC) or internally. Supabase
--    grants EXECUTE to both PUBLIC and anon, so revoke from both; keep
--    authenticated (required for the RLS policies that call
--    can_user_access_group) and service_role. Trigger functions
--    (handle_new_user, update_updated_at_column) run as part of the trigger
--    regardless of caller grants, so strip all client roles from them.
-- ---------------------------------------------------------------------------
revoke execute on function public.can_user_access_group(uuid, uuid) from public, anon;
grant  execute on function public.can_user_access_group(uuid, uuid) to authenticated, service_role;

revoke execute on function public.get_user_game_stats(uuid) from public, anon;
grant  execute on function public.get_user_game_stats(uuid) to authenticated, service_role;

revoke execute on function public.update_game_stats(uuid, text, integer, date) from public, anon;
grant  execute on function public.update_game_stats(uuid, text, integer, date) to authenticated, service_role;

revoke execute on function public.get_profile(uuid) from public, anon;
grant  execute on function public.get_profile(uuid) to authenticated, service_role;

revoke execute on function public.handle_new_user()          from public, anon, authenticated;
revoke execute on function public.update_updated_at_column() from public, anon, authenticated;

commit;
