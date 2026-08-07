-- Incremental hardening for the current frontend-only custom auth flow.
--
-- Apply after supabase/sql/supabase-init.sql and supabase/sql/supabase-allow-anon-custom-auth.sql.
-- This does not replace the recommended long-term migration to Supabase Auth
-- or backend/Edge Function guarded writes, but it supports the safer client
-- behavior added in this project revision.

CREATE TABLE IF NOT EXISTS public.message_reads (
  message_id UUID NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  read_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (message_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_message_reads_user_id ON public.message_reads(user_id);
CREATE INDEX IF NOT EXISTS idx_message_reads_message_id ON public.message_reads(message_id);

ALTER TABLE public.message_reads ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.message_reads TO anon;

DROP POLICY IF EXISTS p_message_reads_anon_all ON public.message_reads;
CREATE POLICY p_message_reads_anon_all ON public.message_reads FOR ALL
USING (auth.role() IN ('anon', 'authenticated'))
WITH CHECK (auth.role() IN ('anon', 'authenticated'));

-- Optional cleanup: once all active external links have been regenerated,
-- remove legacy non-token access flags from forms that do not have token records.
-- UPDATE public.survey_forms
-- SET data = jsonb_set(data, '{external_link_enabled}', 'false'::jsonb, true)
-- WHERE COALESCE(jsonb_array_length(data->'external_share_tokens'), 0) = 0
--   AND data->>'external_link_enabled' = 'true';
