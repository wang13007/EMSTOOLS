-- Compatibility patch for the current frontend-only custom auth flow.
--
-- Why this is needed:
-- - The app uses a publishable/anon Supabase key directly from the browser.
-- - The app stores its own session in localStorage and does not sign in with Supabase Auth.
-- - Therefore PostgREST sees every request as role "anon", even after app login.
-- - supabase-init.sql revokes anon access and only allows auth.role() = 'authenticated',
--   so reads like public.users select fail with 401 / 42501 permission denied.
--
-- Security note:
-- This opens these application tables to the anon API role. It matches the current
-- architecture, but it is not appropriate for a production system containing
-- sensitive user/password data. The safer long-term fix is to move auth and data
-- access behind Supabase Auth, Edge Functions, or a backend service.

GRANT USAGE ON SCHEMA public TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO anon;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO anon;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT USAGE, SELECT ON SEQUENCES TO anon;

DROP POLICY IF EXISTS p_roles_anon_all ON public.roles;
CREATE POLICY p_roles_anon_all ON public.roles FOR ALL
USING (auth.role() IN ('anon', 'authenticated'))
WITH CHECK (auth.role() IN ('anon', 'authenticated'));

DROP POLICY IF EXISTS p_users_anon_all ON public.users;
CREATE POLICY p_users_anon_all ON public.users FOR ALL
USING (auth.role() IN ('anon', 'authenticated'))
WITH CHECK (auth.role() IN ('anon', 'authenticated'));

DROP POLICY IF EXISTS p_survey_templates_anon_all ON public.survey_templates;
CREATE POLICY p_survey_templates_anon_all ON public.survey_templates FOR ALL
USING (auth.role() IN ('anon', 'authenticated'))
WITH CHECK (auth.role() IN ('anon', 'authenticated'));

DROP POLICY IF EXISTS p_survey_forms_anon_all ON public.survey_forms;
CREATE POLICY p_survey_forms_anon_all ON public.survey_forms FOR ALL
USING (auth.role() IN ('anon', 'authenticated'))
WITH CHECK (auth.role() IN ('anon', 'authenticated'));

DROP POLICY IF EXISTS p_survey_reports_anon_all ON public.survey_reports;
CREATE POLICY p_survey_reports_anon_all ON public.survey_reports FOR ALL
USING (auth.role() IN ('anon', 'authenticated'))
WITH CHECK (auth.role() IN ('anon', 'authenticated'));

DROP POLICY IF EXISTS p_dict_types_anon_all ON public.dict_types;
CREATE POLICY p_dict_types_anon_all ON public.dict_types FOR ALL
USING (auth.role() IN ('anon', 'authenticated'))
WITH CHECK (auth.role() IN ('anon', 'authenticated'));

DROP POLICY IF EXISTS p_dict_items_anon_all ON public.dict_items;
CREATE POLICY p_dict_items_anon_all ON public.dict_items FOR ALL
USING (auth.role() IN ('anon', 'authenticated'))
WITH CHECK (auth.role() IN ('anon', 'authenticated'));

DROP POLICY IF EXISTS p_region_dicts_anon_all ON public.region_dicts;
CREATE POLICY p_region_dicts_anon_all ON public.region_dicts FOR ALL
USING (auth.role() IN ('anon', 'authenticated'))
WITH CHECK (auth.role() IN ('anon', 'authenticated'));

DROP POLICY IF EXISTS p_product_capabilities_anon_all ON public.product_capabilities;
CREATE POLICY p_product_capabilities_anon_all ON public.product_capabilities FOR ALL
USING (auth.role() IN ('anon', 'authenticated'))
WITH CHECK (auth.role() IN ('anon', 'authenticated'));

-- Audit logs are read from the browser but written by the audit-log Edge Function.
-- This keeps anon clients from tampering with production audit trails after
-- supabase-audit-hardening.sql is applied.
REVOKE INSERT, UPDATE, DELETE ON public.system_logs FROM anon;
REVOKE INSERT, UPDATE, DELETE ON public.system_logs FROM authenticated;
GRANT SELECT ON public.system_logs TO anon;
GRANT SELECT ON public.system_logs TO authenticated;

DROP POLICY IF EXISTS p_system_logs_all ON public.system_logs;
DROP POLICY IF EXISTS p_system_logs_anon_all ON public.system_logs;
DROP POLICY IF EXISTS p_system_logs_read ON public.system_logs;
CREATE POLICY p_system_logs_read ON public.system_logs FOR SELECT
USING (auth.role() IN ('anon', 'authenticated'));

DROP POLICY IF EXISTS p_messages_anon_all ON public.messages;
CREATE POLICY p_messages_anon_all ON public.messages FOR ALL
USING (auth.role() IN ('anon', 'authenticated'))
WITH CHECK (auth.role() IN ('anon', 'authenticated'));
