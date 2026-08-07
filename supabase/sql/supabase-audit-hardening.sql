-- Production audit hardening for system_logs.
--
-- Purpose:
-- - Edge Function writes logs with the service role key, not from the browser.
-- - Real client IP is captured from request forwarding headers in the Edge Function.
-- - Each row carries an HMAC-based integrity_hash and previous_hash chain.
--
-- Required Edge Function secret:
--   AUDIT_LOG_HMAC_SECRET=<long random secret>

ALTER TABLE public.system_logs ADD COLUMN IF NOT EXISTS request_id UUID;
ALTER TABLE public.system_logs ADD COLUMN IF NOT EXISTS user_agent TEXT;
ALTER TABLE public.system_logs ADD COLUMN IF NOT EXISTS source VARCHAR(40) NOT NULL DEFAULT 'browser-fallback';
ALTER TABLE public.system_logs ADD COLUMN IF NOT EXISTS metadata JSONB NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE public.system_logs ADD COLUMN IF NOT EXISTS previous_hash TEXT;
ALTER TABLE public.system_logs ADD COLUMN IF NOT EXISTS integrity_hash TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_system_logs_request_id
  ON public.system_logs(request_id)
  WHERE request_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_system_logs_integrity_hash
  ON public.system_logs(integrity_hash)
  WHERE integrity_hash IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_system_logs_source
  ON public.system_logs(source);

REVOKE INSERT, UPDATE, DELETE ON public.system_logs FROM anon;
REVOKE INSERT, UPDATE, DELETE ON public.system_logs FROM authenticated;
GRANT SELECT ON public.system_logs TO anon;
GRANT SELECT ON public.system_logs TO authenticated;

DROP POLICY IF EXISTS p_system_logs_all ON public.system_logs;
DROP POLICY IF EXISTS p_system_logs_anon_all ON public.system_logs;
DROP POLICY IF EXISTS p_system_logs_read ON public.system_logs;
CREATE POLICY p_system_logs_read ON public.system_logs FOR SELECT
USING (auth.role() IN ('anon', 'authenticated'));

COMMENT ON COLUMN public.system_logs.request_id IS 'Server-generated request id for audit event de-duplication and tracing.';
COMMENT ON COLUMN public.system_logs.user_agent IS 'User-Agent captured by the audit Edge Function.';
COMMENT ON COLUMN public.system_logs.source IS 'Audit writer source, e.g. edge-function or browser-fallback.';
COMMENT ON COLUMN public.system_logs.metadata IS 'Structured audit metadata captured server-side and client hints.';
COMMENT ON COLUMN public.system_logs.previous_hash IS 'Previous audit row integrity hash, used to form a hash chain.';
COMMENT ON COLUMN public.system_logs.integrity_hash IS 'HMAC-SHA256 over canonical audit payload, generated server-side.';
