alter table "public"."findings" add column "basecamp_comment_id" text;

alter table "public"."findings" add column "basecamp_comment_url" text;

alter table "public"."qa_runs" add column "recording_progress" jsonb default '{}'::jsonb;

alter table "public"."qa_runs" add column "recording_status" text;

alter table "public"."qa_runs" add column "recording_updated_at" timestamp with time zone;

alter table "public"."qa_runs" add column "recording_video_urls" jsonb default '{}'::jsonb;

alter table "public"."sign_offs" add column "basecamp_message_id" text;

alter table "public"."sign_offs" add column "basecamp_url" text;

alter table "public"."users" add column "basecamp_access_token" text;

alter table "public"."users" add column "basecamp_refresh_token" text;

alter table "public"."users" add column "basecamp_token_expires_at" timestamp with time zone;

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.increment_and_check_completion(run_id_param uuid)
 RETURNS boolean
 LANGUAGE plpgsql
AS $function$
DECLARE
  v_processed integer;
  v_total integer;
  v_status text;
BEGIN
  UPDATE qa_runs
  SET pages_processed = COALESCE(pages_processed, 0) + 1
  WHERE id = run_id_param
  RETURNING pages_processed, pages_total, status INTO v_processed, v_total, v_status;

  IF v_status = 'running' AND v_total > 0 AND v_processed >= v_total THEN
    UPDATE qa_runs
    SET status = 'completed', completed_at = now()
    WHERE id = run_id_param AND status = 'running';
    RETURN true;
  END IF;

  RETURN false;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.merge_qa_run_recording_progress(p_run_id uuid, p_viewport text, p_progress numeric)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  -- We use the || operator to safely merge the new key-value pair.
  -- Since this is a single UPDATE statement, PostgreSQL will acquire a row lock,
  -- ensuring no race condition occurs between concurrent workers.
  UPDATE public.qa_runs
  SET recording_progress = COALESCE(recording_progress, '{}'::jsonb) || jsonb_build_object(p_viewport, p_progress)
  WHERE id = p_run_id;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.merge_qa_run_recording_url(p_run_id uuid, p_viewport text, p_url text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_new_urls jsonb;
BEGIN
  -- Safely merge the URL and return the updated JSONB object
  UPDATE public.qa_runs
  SET recording_video_urls = COALESCE(recording_video_urls, '{}'::jsonb) || jsonb_build_object(p_viewport, p_url)
  WHERE id = p_run_id
  RETURNING recording_video_urls INTO v_new_urls;

  -- If we now have all 4 recordings, mark the status as 'completed'
  -- (Only if it hasn't already errored out)
  IF v_new_urls ? 'desktop' AND v_new_urls ? 'laptop' AND v_new_urls ? 'tablet' AND v_new_urls ? 'mobile' THEN
    UPDATE public.qa_runs
    SET recording_status = 'completed'
    WHERE id = p_run_id AND recording_status != 'error';
  END IF;
END;
$function$
;

grant delete on table "public"."basecamp_user_mappings" to "anon";

grant insert on table "public"."basecamp_user_mappings" to "anon";

grant select on table "public"."basecamp_user_mappings" to "anon";

grant update on table "public"."basecamp_user_mappings" to "anon";

grant delete on table "public"."basecamp_user_mappings" to "authenticated";

grant insert on table "public"."basecamp_user_mappings" to "authenticated";

grant select on table "public"."basecamp_user_mappings" to "authenticated";

grant update on table "public"."basecamp_user_mappings" to "authenticated";

grant delete on table "public"."basecamp_user_mappings" to "service_role";

grant insert on table "public"."basecamp_user_mappings" to "service_role";

grant select on table "public"."basecamp_user_mappings" to "service_role";

grant update on table "public"."basecamp_user_mappings" to "service_role";

grant delete on table "public"."comments" to "anon";

grant insert on table "public"."comments" to "anon";

grant select on table "public"."comments" to "anon";

grant update on table "public"."comments" to "anon";

grant delete on table "public"."comments" to "authenticated";

grant insert on table "public"."comments" to "authenticated";

grant select on table "public"."comments" to "authenticated";

grant update on table "public"."comments" to "authenticated";

grant delete on table "public"."comments" to "service_role";

grant insert on table "public"."comments" to "service_role";

grant select on table "public"."comments" to "service_role";

grant update on table "public"."comments" to "service_role";

grant delete on table "public"."embeddings" to "anon";

grant insert on table "public"."embeddings" to "anon";

grant select on table "public"."embeddings" to "anon";

grant update on table "public"."embeddings" to "anon";

grant delete on table "public"."embeddings" to "authenticated";

grant insert on table "public"."embeddings" to "authenticated";

grant select on table "public"."embeddings" to "authenticated";

grant update on table "public"."embeddings" to "authenticated";

grant delete on table "public"."embeddings" to "service_role";

grant insert on table "public"."embeddings" to "service_role";

grant select on table "public"."embeddings" to "service_role";

grant update on table "public"."embeddings" to "service_role";

grant delete on table "public"."findings" to "anon";

grant insert on table "public"."findings" to "anon";

grant select on table "public"."findings" to "anon";

grant update on table "public"."findings" to "anon";

grant delete on table "public"."findings" to "authenticated";

grant insert on table "public"."findings" to "authenticated";

grant select on table "public"."findings" to "authenticated";

grant update on table "public"."findings" to "authenticated";

grant delete on table "public"."findings" to "service_role";

grant insert on table "public"."findings" to "service_role";

grant select on table "public"."findings" to "service_role";

grant update on table "public"."findings" to "service_role";

grant delete on table "public"."organizations" to "anon";

grant insert on table "public"."organizations" to "anon";

grant select on table "public"."organizations" to "anon";

grant update on table "public"."organizations" to "anon";

grant delete on table "public"."organizations" to "authenticated";

grant insert on table "public"."organizations" to "authenticated";

grant select on table "public"."organizations" to "authenticated";

grant update on table "public"."organizations" to "authenticated";

grant delete on table "public"."organizations" to "service_role";

grant insert on table "public"."organizations" to "service_role";

grant select on table "public"."organizations" to "service_role";

grant update on table "public"."organizations" to "service_role";

grant delete on table "public"."pages" to "anon";

grant insert on table "public"."pages" to "anon";

grant select on table "public"."pages" to "anon";

grant update on table "public"."pages" to "anon";

grant delete on table "public"."pages" to "authenticated";

grant insert on table "public"."pages" to "authenticated";

grant select on table "public"."pages" to "authenticated";

grant update on table "public"."pages" to "authenticated";

grant delete on table "public"."pages" to "service_role";

grant insert on table "public"."pages" to "service_role";

grant select on table "public"."pages" to "service_role";

grant update on table "public"."pages" to "service_role";

grant delete on table "public"."project_members" to "anon";

grant insert on table "public"."project_members" to "anon";

grant select on table "public"."project_members" to "anon";

grant update on table "public"."project_members" to "anon";

grant delete on table "public"."project_members" to "authenticated";

grant insert on table "public"."project_members" to "authenticated";

grant select on table "public"."project_members" to "authenticated";

grant update on table "public"."project_members" to "authenticated";

grant delete on table "public"."project_members" to "service_role";

grant insert on table "public"."project_members" to "service_role";

grant select on table "public"."project_members" to "service_role";

grant update on table "public"."project_members" to "service_role";

grant delete on table "public"."project_settings" to "anon";

grant insert on table "public"."project_settings" to "anon";

grant select on table "public"."project_settings" to "anon";

grant update on table "public"."project_settings" to "anon";

grant delete on table "public"."project_settings" to "authenticated";

grant insert on table "public"."project_settings" to "authenticated";

grant select on table "public"."project_settings" to "authenticated";

grant update on table "public"."project_settings" to "authenticated";

grant delete on table "public"."project_settings" to "service_role";

grant insert on table "public"."project_settings" to "service_role";

grant select on table "public"."project_settings" to "service_role";

grant update on table "public"."project_settings" to "service_role";

grant delete on table "public"."projects" to "anon";

grant insert on table "public"."projects" to "anon";

grant select on table "public"."projects" to "anon";

grant update on table "public"."projects" to "anon";

grant delete on table "public"."projects" to "authenticated";

grant insert on table "public"."projects" to "authenticated";

grant select on table "public"."projects" to "authenticated";

grant update on table "public"."projects" to "authenticated";

grant delete on table "public"."projects" to "service_role";

grant insert on table "public"."projects" to "service_role";

grant select on table "public"."projects" to "service_role";

grant update on table "public"."projects" to "service_role";

grant delete on table "public"."qa_runs" to "anon";

grant insert on table "public"."qa_runs" to "anon";

grant select on table "public"."qa_runs" to "anon";

grant update on table "public"."qa_runs" to "anon";

grant delete on table "public"."qa_runs" to "authenticated";

grant insert on table "public"."qa_runs" to "authenticated";

grant select on table "public"."qa_runs" to "authenticated";

grant update on table "public"."qa_runs" to "authenticated";

grant delete on table "public"."qa_runs" to "service_role";

grant insert on table "public"."qa_runs" to "service_role";

grant select on table "public"."qa_runs" to "service_role";

grant update on table "public"."qa_runs" to "service_role";

grant delete on table "public"."rebuttals" to "anon";

grant insert on table "public"."rebuttals" to "anon";

grant select on table "public"."rebuttals" to "anon";

grant update on table "public"."rebuttals" to "anon";

grant delete on table "public"."rebuttals" to "authenticated";

grant insert on table "public"."rebuttals" to "authenticated";

grant select on table "public"."rebuttals" to "authenticated";

grant update on table "public"."rebuttals" to "authenticated";

grant delete on table "public"."rebuttals" to "service_role";

grant insert on table "public"."rebuttals" to "service_role";

grant select on table "public"."rebuttals" to "service_role";

grant update on table "public"."rebuttals" to "service_role";

grant delete on table "public"."sign_offs" to "anon";

grant insert on table "public"."sign_offs" to "anon";

grant select on table "public"."sign_offs" to "anon";

grant update on table "public"."sign_offs" to "anon";

grant delete on table "public"."sign_offs" to "authenticated";

grant insert on table "public"."sign_offs" to "authenticated";

grant select on table "public"."sign_offs" to "authenticated";

grant update on table "public"."sign_offs" to "authenticated";

grant delete on table "public"."sign_offs" to "service_role";

grant insert on table "public"."sign_offs" to "service_role";

grant select on table "public"."sign_offs" to "service_role";

grant update on table "public"."sign_offs" to "service_role";

grant delete on table "public"."tasks" to "anon";

grant insert on table "public"."tasks" to "anon";

grant select on table "public"."tasks" to "anon";

grant update on table "public"."tasks" to "anon";

grant delete on table "public"."tasks" to "authenticated";

grant insert on table "public"."tasks" to "authenticated";

grant select on table "public"."tasks" to "authenticated";

grant update on table "public"."tasks" to "authenticated";

grant delete on table "public"."tasks" to "service_role";

grant insert on table "public"."tasks" to "service_role";

grant select on table "public"."tasks" to "service_role";

grant update on table "public"."tasks" to "service_role";

grant delete on table "public"."users" to "anon";

grant insert on table "public"."users" to "anon";

grant select on table "public"."users" to "anon";

grant update on table "public"."users" to "anon";

grant delete on table "public"."users" to "authenticated";

grant insert on table "public"."users" to "authenticated";

grant select on table "public"."users" to "authenticated";

grant update on table "public"."users" to "authenticated";

grant delete on table "public"."users" to "service_role";

grant insert on table "public"."users" to "service_role";

grant select on table "public"."users" to "service_role";

grant update on table "public"."users" to "service_role";

grant delete on table "public"."visual_diffs" to "anon";

grant insert on table "public"."visual_diffs" to "anon";

grant select on table "public"."visual_diffs" to "anon";

grant update on table "public"."visual_diffs" to "anon";

grant delete on table "public"."visual_diffs" to "authenticated";

grant insert on table "public"."visual_diffs" to "authenticated";

grant select on table "public"."visual_diffs" to "authenticated";

grant update on table "public"."visual_diffs" to "authenticated";

grant delete on table "public"."visual_diffs" to "service_role";

grant insert on table "public"."visual_diffs" to "service_role";

grant select on table "public"."visual_diffs" to "service_role";

grant update on table "public"."visual_diffs" to "service_role";


