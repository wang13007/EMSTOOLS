BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE OR REPLACE FUNCTION public._safe_uuid(value_text TEXT)
RETURNS UUID
LANGUAGE SQL
IMMUTABLE
AS $$
  SELECT CASE
    WHEN value_text IS NULL OR btrim(value_text) = '' THEN NULL
    WHEN value_text ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$' THEN value_text::uuid
    ELSE NULL
  END;
$$;

-- Ensure legacy trigger function works after users.role_id becomes UUID.
CREATE OR REPLACE FUNCTION public.users_fill_role_id()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  fallback_role_id UUID;
BEGIN
  IF NEW.role_id IS NULL OR btrim(NEW.role_id::text) = '' THEN
    SELECT r.id
    INTO fallback_role_id
    FROM public.roles r
    WHERE r.status = 'enabled'
    ORDER BY r.create_time
    LIMIT 1;

    NEW.role_id := fallback_role_id;
  END IF;

  RETURN NEW;
END;
$$;

ALTER TABLE IF EXISTS public.users ADD COLUMN IF NOT EXISTS id UUID;

UPDATE public.users
SET id = gen_random_uuid()
WHERE id IS NULL;

ALTER TABLE public.users ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE public.users ALTER COLUMN id SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS ux_users_id ON public.users(id);
CREATE UNIQUE INDEX IF NOT EXISTS ux_users_user_id ON public.users(user_id);
CREATE UNIQUE INDEX IF NOT EXISTS ux_roles_id ON public.roles(id);
CREATE UNIQUE INDEX IF NOT EXISTS ux_survey_templates_id ON public.survey_templates(id);
CREATE UNIQUE INDEX IF NOT EXISTS ux_survey_forms_id ON public.survey_forms(id);

ALTER TABLE IF EXISTS public.users DROP CONSTRAINT IF EXISTS users_role_id_fkey;
ALTER TABLE IF EXISTS public.survey_forms DROP CONSTRAINT IF EXISTS survey_forms_template_id_fkey;
ALTER TABLE IF EXISTS public.survey_forms DROP CONSTRAINT IF EXISTS survey_forms_creator_id_fkey;
ALTER TABLE IF EXISTS public.survey_forms DROP CONSTRAINT IF EXISTS survey_forms_submitter_id_fkey;
ALTER TABLE IF EXISTS public.survey_forms DROP CONSTRAINT IF EXISTS survey_forms_pre_sales_responsible_id_fkey;
ALTER TABLE IF EXISTS public.survey_reports DROP CONSTRAINT IF EXISTS survey_reports_form_id_fkey;
ALTER TABLE IF EXISTS public.messages DROP CONSTRAINT IF EXISTS messages_target_role_id_fkey;
ALTER TABLE IF EXISTS public.messages DROP CONSTRAINT IF EXISTS messages_target_user_id_fkey;
ALTER TABLE IF EXISTS public.messages DROP CONSTRAINT IF EXISTS messages_project_id_fkey;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'users'
      AND column_name = 'role_id'
      AND data_type <> 'uuid'
  ) THEN
    ALTER TABLE public.users ALTER COLUMN role_id DROP DEFAULT;
    ALTER TABLE public.users
      ALTER COLUMN role_id TYPE UUID USING public._safe_uuid(role_id::text);
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'survey_forms'
      AND column_name = 'template_id'
      AND data_type <> 'uuid'
  ) THEN
    ALTER TABLE public.survey_forms ALTER COLUMN template_id DROP DEFAULT;
    ALTER TABLE public.survey_forms
      ALTER COLUMN template_id TYPE UUID USING public._safe_uuid(template_id::text);
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'survey_forms'
      AND column_name = 'creator_id'
      AND data_type <> 'uuid'
  ) THEN
    ALTER TABLE public.survey_forms ALTER COLUMN creator_id DROP DEFAULT;
    ALTER TABLE public.survey_forms
      ALTER COLUMN creator_id TYPE UUID USING public._safe_uuid(creator_id::text);
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'survey_forms'
      AND column_name = 'submitter_id'
      AND data_type <> 'uuid'
  ) THEN
    ALTER TABLE public.survey_forms ALTER COLUMN submitter_id DROP DEFAULT;
    ALTER TABLE public.survey_forms
      ALTER COLUMN submitter_id TYPE UUID USING public._safe_uuid(submitter_id::text);
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'survey_forms'
      AND column_name = 'pre_sales_responsible_id'
      AND data_type <> 'uuid'
  ) THEN
    ALTER TABLE public.survey_forms ALTER COLUMN pre_sales_responsible_id DROP DEFAULT;
    ALTER TABLE public.survey_forms
      ALTER COLUMN pre_sales_responsible_id TYPE UUID USING public._safe_uuid(pre_sales_responsible_id::text);
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'survey_reports'
      AND column_name = 'form_id'
      AND data_type <> 'uuid'
  ) THEN
    ALTER TABLE public.survey_reports ALTER COLUMN form_id DROP DEFAULT;
    ALTER TABLE public.survey_reports ALTER COLUMN form_id DROP NOT NULL;
    ALTER TABLE public.survey_reports
      ALTER COLUMN form_id TYPE UUID USING public._safe_uuid(form_id::text);
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'messages'
      AND column_name = 'target_role_id'
      AND data_type <> 'uuid'
  ) THEN
    ALTER TABLE public.messages ALTER COLUMN target_role_id DROP DEFAULT;
    ALTER TABLE public.messages
      ALTER COLUMN target_role_id TYPE UUID USING public._safe_uuid(target_role_id::text);
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'messages'
      AND column_name = 'target_user_id'
      AND data_type <> 'uuid'
  ) THEN
    ALTER TABLE public.messages ALTER COLUMN target_user_id DROP DEFAULT;
    ALTER TABLE public.messages
      ALTER COLUMN target_user_id TYPE UUID USING public._safe_uuid(target_user_id::text);
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'messages'
      AND column_name = 'project_id'
      AND data_type <> 'uuid'
  ) THEN
    ALTER TABLE public.messages ALTER COLUMN project_id DROP DEFAULT;
    ALTER TABLE public.messages
      ALTER COLUMN project_id TYPE UUID USING public._safe_uuid(project_id::text);
  END IF;
END $$;

UPDATE public.users u
SET role_id = NULL
WHERE u.role_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM public.roles r
    WHERE r.id = public._safe_uuid(u.role_id::text)
  );

UPDATE public.survey_forms sf
SET creator_id = u.id
FROM public.users u
WHERE sf.creator_id IS NOT NULL
  AND public._safe_uuid(sf.creator_id::text) = u.user_id
  AND NOT EXISTS (
    SELECT 1
    FROM public.users ux
    WHERE ux.id = public._safe_uuid(sf.creator_id::text)
  );

UPDATE public.survey_forms sf
SET submitter_id = u.id
FROM public.users u
WHERE sf.submitter_id IS NOT NULL
  AND public._safe_uuid(sf.submitter_id::text) = u.user_id
  AND NOT EXISTS (
    SELECT 1
    FROM public.users ux
    WHERE ux.id = public._safe_uuid(sf.submitter_id::text)
  );

UPDATE public.survey_forms sf
SET pre_sales_responsible_id = u.id
FROM public.users u
WHERE sf.pre_sales_responsible_id IS NOT NULL
  AND public._safe_uuid(sf.pre_sales_responsible_id::text) = u.user_id
  AND NOT EXISTS (
    SELECT 1
    FROM public.users ux
    WHERE ux.id = public._safe_uuid(sf.pre_sales_responsible_id::text)
  );

UPDATE public.survey_forms sf
SET template_id = NULL
WHERE sf.template_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM public.survey_templates st
    WHERE st.id = public._safe_uuid(sf.template_id::text)
  );

UPDATE public.survey_forms sf
SET creator_id = NULL
WHERE sf.creator_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM public.users u
    WHERE u.id = public._safe_uuid(sf.creator_id::text)
  );

UPDATE public.survey_forms sf
SET submitter_id = NULL
WHERE sf.submitter_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM public.users u
    WHERE u.id = public._safe_uuid(sf.submitter_id::text)
  );

UPDATE public.survey_forms sf
SET pre_sales_responsible_id = NULL
WHERE sf.pre_sales_responsible_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM public.users u
    WHERE u.id = public._safe_uuid(sf.pre_sales_responsible_id::text)
  );

DELETE FROM public.survey_reports sr
WHERE sr.form_id IS NULL
  OR NOT EXISTS (
    SELECT 1
    FROM public.survey_forms sf
    WHERE sf.id = public._safe_uuid(sr.form_id::text)
  );

ALTER TABLE public.survey_reports ALTER COLUMN form_id SET NOT NULL;

UPDATE public.messages m
SET target_user_id = u.id
FROM public.users u
WHERE m.target_user_id IS NOT NULL
  AND public._safe_uuid(m.target_user_id::text) = u.user_id
  AND NOT EXISTS (
    SELECT 1
    FROM public.users ux
    WHERE ux.id = public._safe_uuid(m.target_user_id::text)
  );

UPDATE public.messages m
SET target_role_id = NULL
WHERE m.target_role_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM public.roles r
    WHERE r.id = public._safe_uuid(m.target_role_id::text)
  );

UPDATE public.messages m
SET target_user_id = NULL
WHERE m.target_user_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM public.users u
    WHERE u.id = public._safe_uuid(m.target_user_id::text)
  );

UPDATE public.messages m
SET project_id = NULL
WHERE m.project_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM public.survey_forms sf
    WHERE sf.id = public._safe_uuid(m.project_id::text)
  );

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'users_role_id_fkey'
      AND conrelid = 'public.users'::regclass
  ) THEN
    ALTER TABLE public.users
      ADD CONSTRAINT users_role_id_fkey
      FOREIGN KEY (role_id) REFERENCES public.roles(id) ON DELETE SET NULL;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'survey_forms_template_id_fkey'
      AND conrelid = 'public.survey_forms'::regclass
  ) THEN
    ALTER TABLE public.survey_forms
      ADD CONSTRAINT survey_forms_template_id_fkey
      FOREIGN KEY (template_id) REFERENCES public.survey_templates(id) ON DELETE SET NULL;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'survey_forms_creator_id_fkey'
      AND conrelid = 'public.survey_forms'::regclass
  ) THEN
    ALTER TABLE public.survey_forms
      ADD CONSTRAINT survey_forms_creator_id_fkey
      FOREIGN KEY (creator_id) REFERENCES public.users(id) ON DELETE SET NULL;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'survey_forms_submitter_id_fkey'
      AND conrelid = 'public.survey_forms'::regclass
  ) THEN
    ALTER TABLE public.survey_forms
      ADD CONSTRAINT survey_forms_submitter_id_fkey
      FOREIGN KEY (submitter_id) REFERENCES public.users(id) ON DELETE SET NULL;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'survey_forms_pre_sales_responsible_id_fkey'
      AND conrelid = 'public.survey_forms'::regclass
  ) THEN
    ALTER TABLE public.survey_forms
      ADD CONSTRAINT survey_forms_pre_sales_responsible_id_fkey
      FOREIGN KEY (pre_sales_responsible_id) REFERENCES public.users(id) ON DELETE SET NULL;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'survey_reports_form_id_fkey'
      AND conrelid = 'public.survey_reports'::regclass
  ) THEN
    ALTER TABLE public.survey_reports
      ADD CONSTRAINT survey_reports_form_id_fkey
      FOREIGN KEY (form_id) REFERENCES public.survey_forms(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'messages_target_role_id_fkey'
      AND conrelid = 'public.messages'::regclass
  ) THEN
    ALTER TABLE public.messages
      ADD CONSTRAINT messages_target_role_id_fkey
      FOREIGN KEY (target_role_id) REFERENCES public.roles(id) ON DELETE SET NULL;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'messages_target_user_id_fkey'
      AND conrelid = 'public.messages'::regclass
  ) THEN
    ALTER TABLE public.messages
      ADD CONSTRAINT messages_target_user_id_fkey
      FOREIGN KEY (target_user_id) REFERENCES public.users(id) ON DELETE SET NULL;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'messages_project_id_fkey'
      AND conrelid = 'public.messages'::regclass
  ) THEN
    ALTER TABLE public.messages
      ADD CONSTRAINT messages_project_id_fkey
      FOREIGN KEY (project_id) REFERENCES public.survey_forms(id) ON DELETE SET NULL;
  END IF;
END $$;

COMMIT;
