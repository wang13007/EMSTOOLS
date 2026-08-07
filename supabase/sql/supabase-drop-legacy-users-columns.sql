-- Drop legacy columns from public.users after code-side compatibility cleanup.
-- Execute in Supabase SQL Editor.

BEGIN;

-- Migrate any display-name leftovers before dropping user_realname.
UPDATE public.users
SET
  user_name = COALESCE(NULLIF(user_name, ''), NULLIF(name, ''), NULLIF(user_realname, ''), NULLIF(username, '')),
  name = COALESCE(NULLIF(name, ''), NULLIF(user_name, ''), NULLIF(user_realname, ''), NULLIF(username, ''))
WHERE TRUE;

ALTER TABLE public.users DROP COLUMN IF EXISTS create_by;
ALTER TABLE public.users DROP COLUMN IF EXISTS user_realname;
ALTER TABLE public.users DROP COLUMN IF EXISTS creator;
ALTER TABLE public.users DROP COLUMN IF EXISTS is_deleted;
ALTER TABLE public.users DROP COLUMN IF EXISTS update_time;

COMMIT;
