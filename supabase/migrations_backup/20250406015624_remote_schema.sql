

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE EXTENSION IF NOT EXISTS "pgsodium";






COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgjwt" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE OR REPLACE FUNCTION "public"."add_friend_test_scores"("p_game_id" "text", "p_friend_id" "uuid", "p_requester_id" "uuid", "p_today_date" "date", "p_yesterday_date" "date", "p_two_days_ago_date" "date") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_connection_exists BOOLEAN;
  v_inserted_scores UUID[] = '{}';
  v_score_id UUID;
BEGIN
  -- First verify that the requester and friend have an accepted connection
  SELECT EXISTS(
    SELECT 1 FROM public.connections 
    WHERE ((user_id = p_requester_id AND friend_id = p_friend_id) OR 
           (user_id = p_friend_id AND friend_id = p_requester_id))
    AND status = 'accepted'
    LIMIT 1
  ) INTO v_connection_exists;
  
  IF NOT v_connection_exists THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'No accepted connection exists between these users'
    );
  END IF;
  
  -- Insert test scores as the friend user (this is allowed because we're using SECURITY DEFINER)
  -- Insert today's score
  INSERT INTO public.scores (game_id, user_id, value, date, notes)
  VALUES (p_game_id, p_friend_id, 3, p_today_date, 'Test score for today')
  RETURNING id INTO v_score_id;
  v_inserted_scores := array_append(v_inserted_scores, v_score_id);
  
  -- Insert yesterday's score
  INSERT INTO public.scores (game_id, user_id, value, date, notes)
  VALUES (p_game_id, p_friend_id, 4, p_yesterday_date, 'Test score for yesterday')
  RETURNING id INTO v_score_id;
  v_inserted_scores := array_append(v_inserted_scores, v_score_id);
  
  -- Insert score from two days ago
  INSERT INTO public.scores (game_id, user_id, value, date, notes)
  VALUES (p_game_id, p_friend_id, 5, p_two_days_ago_date, 'Test score for 2 days ago')
  RETURNING id INTO v_score_id;
  v_inserted_scores := array_append(v_inserted_scores, v_score_id);
  
  -- Update game stats for the friend for each date
  PERFORM public.update_game_stats(p_friend_id, p_game_id, 3, p_today_date);
  PERFORM public.update_game_stats(p_friend_id, p_game_id, 4, p_yesterday_date);
  PERFORM public.update_game_stats(p_friend_id, p_game_id, 5, p_two_days_ago_date);
  
  -- Return success with the IDs of inserted scores
  RETURN jsonb_build_object(
    'success', true,
    'message', 'Test scores added successfully',
    'inserted_ids', v_inserted_scores
  );
END;
$$;


ALTER FUNCTION "public"."add_friend_test_scores"("p_game_id" "text", "p_friend_id" "uuid", "p_requester_id" "uuid", "p_today_date" "date", "p_yesterday_date" "date", "p_two_days_ago_date" "date") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."can_user_access_group"("p_group_id" "uuid", "p_user_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  is_owner BOOLEAN;
  is_member BOOLEAN;
BEGIN
  -- Check if user is the group owner
  SELECT EXISTS (
    SELECT 1 FROM friend_groups
    WHERE id = p_group_id AND user_id = p_user_id
  ) INTO is_owner;
  
  -- If user is owner, return true immediately
  IF is_owner THEN
    RETURN TRUE;
  END IF;
  
  -- Check if user is an accepted member
  SELECT EXISTS (
    SELECT 1 FROM friend_group_members
    WHERE group_id = p_group_id 
    AND friend_id = p_user_id 
    AND status = 'accepted'
  ) INTO is_member;
  
  -- Return result
  RETURN is_member;
END;
$$;


ALTER FUNCTION "public"."can_user_access_group"("p_group_id" "uuid", "p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."direct_sql_query"("sql_query" "text") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  result JSONB;
BEGIN
  EXECUTE 'WITH query_result AS (' || sql_query || ') SELECT jsonb_agg(row_to_json(query_result)) FROM query_result' INTO result;
  RETURN COALESCE(result, '[]'::jsonb);
END;
$$;


ALTER FUNCTION "public"."direct_sql_query"("sql_query" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."force_delete_connection"("connection_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Use a direct DELETE with a count to ensure we know if it worked
  DELETE FROM public.connections 
  WHERE id = connection_id
  RETURNING 1 INTO deleted_count;
  
  -- Return true if we actually deleted something
  RETURN deleted_count > 0;
END;
$$;


ALTER FUNCTION "public"."force_delete_connection"("connection_id" "uuid") OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" NOT NULL,
    "username" "text",
    "avatar_url" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "selected_games" "text"[],
    "full_name" "text"
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_profile"("profile_id" "uuid") RETURNS "public"."profiles"
    LANGUAGE "sql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  SELECT *
  FROM public.profiles
  WHERE id = profile_id
$$;


ALTER FUNCTION "public"."get_profile"("profile_id" "uuid") OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."game_stats" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "game_id" "text" NOT NULL,
    "best_score" integer,
    "average_score" double precision,
    "total_plays" integer DEFAULT 0,
    "current_streak" integer DEFAULT 0,
    "longest_streak" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."game_stats" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_user_game_stats"("user_id_param" "uuid") RETURNS SETOF "public"."game_stats"
    LANGUAGE "sql" SECURITY DEFINER
    AS $$
  SELECT * FROM public.game_stats
  WHERE user_id = user_id_param
$$;


ALTER FUNCTION "public"."get_user_game_stats"("user_id_param" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  INSERT INTO public.profiles (id, username, full_name, selected_games)
  VALUES (new.id, NULL, NULL, NULL);
  RETURN new;
END;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_game_stats"("p_user_id" "uuid", "p_game_id" "text", "p_score" integer, "p_date" "date") RETURNS "public"."game_stats"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_game_stats public.game_stats;
  v_prev_date DATE;
  v_streak_broken BOOLEAN;
BEGIN
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
$$;


ALTER FUNCTION "public"."update_game_stats"("p_user_id" "uuid", "p_game_id" "text", "p_score" integer, "p_date" "date") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."connections" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "friend_id" "uuid",
    "status" "text" DEFAULT 'pending'::"text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "connections_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'accepted'::"text"])))
);


ALTER TABLE "public"."connections" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."friend_group_members" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "group_id" "uuid" NOT NULL,
    "friend_id" "uuid" NOT NULL,
    "added_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "status" "text" DEFAULT 'pending'::"text" NOT NULL
);


ALTER TABLE "public"."friend_group_members" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."friend_groups" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."friend_groups" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."group_messages" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "group_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "content" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);

ALTER TABLE ONLY "public"."group_messages" REPLICA IDENTITY FULL;


ALTER TABLE "public"."group_messages" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."scores" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "game_id" "text" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "value" integer NOT NULL,
    "date" "date" DEFAULT CURRENT_DATE NOT NULL,
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."scores" OWNER TO "postgres";


ALTER TABLE ONLY "public"."connections"
    ADD CONSTRAINT "connections_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."connections"
    ADD CONSTRAINT "connections_user_id_friend_id_key" UNIQUE ("user_id", "friend_id");



ALTER TABLE ONLY "public"."friend_group_members"
    ADD CONSTRAINT "friend_group_members_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."friend_groups"
    ADD CONSTRAINT "friend_groups_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."game_stats"
    ADD CONSTRAINT "game_stats_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."game_stats"
    ADD CONSTRAINT "game_stats_user_id_game_id_key" UNIQUE ("user_id", "game_id");



ALTER TABLE ONLY "public"."group_messages"
    ADD CONSTRAINT "group_messages_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_username_key" UNIQUE ("username");



ALTER TABLE ONLY "public"."scores"
    ADD CONSTRAINT "scores_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."friend_group_members"
    ADD CONSTRAINT "unique_group_member" UNIQUE ("group_id", "friend_id");



CREATE OR REPLACE TRIGGER "update_connections_updated_at" BEFORE UPDATE ON "public"."connections" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_friend_groups_updated_at" BEFORE UPDATE ON "public"."friend_groups" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_game_stats_updated_at" BEFORE UPDATE ON "public"."game_stats" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_group_messages_updated_at" BEFORE UPDATE ON "public"."group_messages" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_profiles_updated_at" BEFORE UPDATE ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_scores_updated_at" BEFORE UPDATE ON "public"."scores" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



ALTER TABLE ONLY "public"."connections"
    ADD CONSTRAINT "connections_friend_id_fkey" FOREIGN KEY ("friend_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."connections"
    ADD CONSTRAINT "connections_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."friend_group_members"
    ADD CONSTRAINT "friend_group_members_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "public"."friend_groups"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."friend_groups"
    ADD CONSTRAINT "friend_groups_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."game_stats"
    ADD CONSTRAINT "game_stats_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."group_messages"
    ADD CONSTRAINT "group_messages_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "public"."friend_groups"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."scores"
    ADD CONSTRAINT "scores_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



CREATE POLICY "Allow users to insert messages in their groups" ON "public"."group_messages" FOR INSERT TO "authenticated" WITH CHECK ("public"."can_user_access_group"("group_id", "auth"."uid"()));



CREATE POLICY "Allow users to view messages in their groups" ON "public"."group_messages" FOR SELECT TO "authenticated" USING ("public"."can_user_access_group"("group_id", "auth"."uid"()));



CREATE POLICY "Game stats are viewable by everyone" ON "public"."game_stats" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Group members can insert messages" ON "public"."group_messages" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."friend_group_members"
  WHERE (("friend_group_members"."group_id" = "group_messages"."group_id") AND ("friend_group_members"."friend_id" = "auth"."uid"()) AND ("friend_group_members"."status" = 'accepted'::"text")))));



CREATE POLICY "Group members can view messages" ON "public"."group_messages" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."friend_group_members"
  WHERE (("friend_group_members"."group_id" = "group_messages"."group_id") AND ("friend_group_members"."friend_id" = "auth"."uid"()) AND ("friend_group_members"."status" = 'accepted'::"text")))));



CREATE POLICY "Members can insert messages" ON "public"."group_messages" FOR INSERT TO "authenticated" WITH CHECK ((("auth"."uid"() = "user_id") AND ((EXISTS ( SELECT 1
   FROM "public"."friend_groups" "fg"
  WHERE (("fg"."id" = "group_messages"."group_id") AND ("fg"."user_id" = "auth"."uid"())))) OR (EXISTS ( SELECT 1
   FROM "public"."friend_group_members" "fgm"
  WHERE (("fgm"."group_id" = "fgm"."group_id") AND ("fgm"."friend_id" = "auth"."uid"()) AND ("fgm"."status" = 'accepted'::"text")))))));



CREATE POLICY "Members can view messages" ON "public"."group_messages" FOR SELECT TO "authenticated" USING (((EXISTS ( SELECT 1
   FROM "public"."friend_groups" "fg"
  WHERE (("fg"."id" = "group_messages"."group_id") AND ("fg"."user_id" = "auth"."uid"())))) OR (EXISTS ( SELECT 1
   FROM "public"."friend_group_members" "fgm"
  WHERE (("fgm"."group_id" = "fgm"."group_id") AND ("fgm"."friend_id" = "auth"."uid"()) AND ("fgm"."status" = 'accepted'::"text"))))));



CREATE POLICY "Public profiles are viewable by everyone" ON "public"."profiles" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Users can create connection requests" ON "public"."connections" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert messages in their groups" ON "public"."group_messages" FOR INSERT TO "authenticated" WITH CHECK ((("user_id" = "auth"."uid"()) AND ("group_id" IN ( SELECT "g"."id"
   FROM "public"."friend_groups" "g"
  WHERE ("g"."user_id" = "auth"."uid"())
UNION
 SELECT "m"."group_id"
   FROM ("public"."friend_group_members" "m"
     JOIN "public"."friend_groups" "g" ON (("m"."group_id" = "g"."id")))
  WHERE ("m"."friend_id" = "auth"."uid"())))));



CREATE POLICY "Users can insert their own game stats" ON "public"."game_stats" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can modify their own game stats" ON "public"."game_stats" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update own profile" ON "public"."profiles" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "id"));



CREATE POLICY "Users can update their received connection requests" ON "public"."connections" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "friend_id"));



CREATE POLICY "Users can view messages in their groups" ON "public"."group_messages" FOR SELECT TO "authenticated" USING ((("user_id" = "auth"."uid"()) OR ("group_id" IN ( SELECT "g"."id"
   FROM "public"."friend_groups" "g"
  WHERE ("g"."user_id" = "auth"."uid"())
UNION
 SELECT "m"."group_id"
   FROM ("public"."friend_group_members" "m"
     JOIN "public"."friend_groups" "g" ON (("m"."group_id" = "g"."id")))
  WHERE ("m"."friend_id" = "auth"."uid"())))));



CREATE POLICY "Users can view their own connections" ON "public"."connections" FOR SELECT TO "authenticated" USING ((("auth"."uid"() = "user_id") OR ("auth"."uid"() = "friend_id")));



ALTER TABLE "public"."connections" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "delete_members_from_owned_groups" ON "public"."friend_group_members" FOR DELETE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."friend_groups"
  WHERE (("friend_groups"."id" = "friend_group_members"."group_id") AND ("friend_groups"."user_id" = "auth"."uid"())))));



CREATE POLICY "delete_own_groups" ON "public"."friend_groups" FOR DELETE TO "authenticated" USING (("user_id" = "auth"."uid"()));



ALTER TABLE "public"."friend_groups" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."game_stats" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."group_messages" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "insert_members_to_owned_groups" ON "public"."friend_group_members" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."friend_groups"
  WHERE (("friend_groups"."id" = "friend_group_members"."group_id") AND ("friend_groups"."user_id" = "auth"."uid"())))));



CREATE POLICY "insert_own_groups" ON "public"."friend_groups" FOR INSERT TO "authenticated" WITH CHECK (("user_id" = "auth"."uid"()));



ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."scores" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "update_group_policy" ON "public"."friend_groups" FOR UPDATE TO "authenticated" USING (true);



CREATE POLICY "update_own_groups" ON "public"."friend_groups" FOR UPDATE TO "authenticated" USING (("user_id" = "auth"."uid"()));



CREATE POLICY "view_all_groups" ON "public"."friend_groups" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "view_group_members_for_participants" ON "public"."friend_group_members" FOR SELECT TO "authenticated" USING (((EXISTS ( SELECT 1
   FROM "public"."friend_group_members" "my_membership"
  WHERE (("my_membership"."group_id" = "friend_group_members"."group_id") AND ("my_membership"."friend_id" = "auth"."uid"())))) OR (EXISTS ( SELECT 1
   FROM "public"."friend_groups"
  WHERE (("friend_groups"."id" = "friend_group_members"."group_id") AND ("friend_groups"."user_id" = "auth"."uid"()))))));



CREATE POLICY "view_own_and_group_member_scores" ON "public"."scores" FOR SELECT TO "authenticated" USING ((("user_id" = "auth"."uid"()) OR (EXISTS ( SELECT 1
   FROM ("public"."friend_groups" "fg"
     JOIN "public"."friend_group_members" "fgm" ON (("fg"."id" = "fgm"."group_id")))
  WHERE (("fg"."user_id" = "auth"."uid"()) AND ("fgm"."friend_id" = "scores"."user_id") AND ("fgm"."status" = 'accepted'::"text")))) OR (EXISTS ( SELECT 1
   FROM ("public"."friend_group_members" "my_membership"
     JOIN "public"."friend_groups" "fg" ON (("my_membership"."group_id" = "fg"."id")))
  WHERE (("my_membership"."friend_id" = "auth"."uid"()) AND ("my_membership"."status" = 'accepted'::"text") AND (("fg"."user_id" = "scores"."user_id") OR (EXISTS ( SELECT 1
           FROM "public"."friend_group_members" "their_membership"
          WHERE (("their_membership"."group_id" = "my_membership"."group_id") AND ("their_membership"."friend_id" = "scores"."user_id") AND ("their_membership"."status" = 'accepted'::"text"))))))))));





ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";






ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."group_messages";



GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";




















































































































































































GRANT ALL ON FUNCTION "public"."add_friend_test_scores"("p_game_id" "text", "p_friend_id" "uuid", "p_requester_id" "uuid", "p_today_date" "date", "p_yesterday_date" "date", "p_two_days_ago_date" "date") TO "anon";
GRANT ALL ON FUNCTION "public"."add_friend_test_scores"("p_game_id" "text", "p_friend_id" "uuid", "p_requester_id" "uuid", "p_today_date" "date", "p_yesterday_date" "date", "p_two_days_ago_date" "date") TO "authenticated";
GRANT ALL ON FUNCTION "public"."add_friend_test_scores"("p_game_id" "text", "p_friend_id" "uuid", "p_requester_id" "uuid", "p_today_date" "date", "p_yesterday_date" "date", "p_two_days_ago_date" "date") TO "service_role";



GRANT ALL ON FUNCTION "public"."can_user_access_group"("p_group_id" "uuid", "p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."can_user_access_group"("p_group_id" "uuid", "p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."can_user_access_group"("p_group_id" "uuid", "p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."direct_sql_query"("sql_query" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."direct_sql_query"("sql_query" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."direct_sql_query"("sql_query" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."force_delete_connection"("connection_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."force_delete_connection"("connection_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."force_delete_connection"("connection_id" "uuid") TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT ALL ON FUNCTION "public"."get_profile"("profile_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_profile"("profile_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_profile"("profile_id" "uuid") TO "service_role";



GRANT ALL ON TABLE "public"."game_stats" TO "anon";
GRANT ALL ON TABLE "public"."game_stats" TO "authenticated";
GRANT ALL ON TABLE "public"."game_stats" TO "service_role";



GRANT ALL ON FUNCTION "public"."get_user_game_stats"("user_id_param" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_game_stats"("user_id_param" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_game_stats"("user_id_param" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_game_stats"("p_user_id" "uuid", "p_game_id" "text", "p_score" integer, "p_date" "date") TO "anon";
GRANT ALL ON FUNCTION "public"."update_game_stats"("p_user_id" "uuid", "p_game_id" "text", "p_score" integer, "p_date" "date") TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_game_stats"("p_user_id" "uuid", "p_game_id" "text", "p_score" integer, "p_date" "date") TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "service_role";


















GRANT ALL ON TABLE "public"."connections" TO "anon";
GRANT ALL ON TABLE "public"."connections" TO "authenticated";
GRANT ALL ON TABLE "public"."connections" TO "service_role";



GRANT ALL ON TABLE "public"."friend_group_members" TO "anon";
GRANT ALL ON TABLE "public"."friend_group_members" TO "authenticated";
GRANT ALL ON TABLE "public"."friend_group_members" TO "service_role";



GRANT ALL ON TABLE "public"."friend_groups" TO "anon";
GRANT ALL ON TABLE "public"."friend_groups" TO "authenticated";
GRANT ALL ON TABLE "public"."friend_groups" TO "service_role";



GRANT ALL ON TABLE "public"."group_messages" TO "anon";
GRANT ALL ON TABLE "public"."group_messages" TO "authenticated";
GRANT ALL ON TABLE "public"."group_messages" TO "service_role";



GRANT ALL ON TABLE "public"."scores" TO "anon";
GRANT ALL ON TABLE "public"."scores" TO "authenticated";
GRANT ALL ON TABLE "public"."scores" TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "service_role";






























RESET ALL;
