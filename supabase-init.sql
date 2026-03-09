-- EMS TOOLS - Supabase schema sync (idempotent)
-- Run in Supabase SQL Editor.

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

ALTER TABLE IF EXISTS public.users DROP CONSTRAINT IF EXISTS users_role_id_fkey;
ALTER TABLE IF EXISTS public.survey_forms DROP CONSTRAINT IF EXISTS survey_forms_template_id_fkey;
ALTER TABLE IF EXISTS public.survey_forms DROP CONSTRAINT IF EXISTS survey_forms_creator_id_fkey;
ALTER TABLE IF EXISTS public.survey_forms DROP CONSTRAINT IF EXISTS survey_forms_submitter_id_fkey;
ALTER TABLE IF EXISTS public.survey_forms DROP CONSTRAINT IF EXISTS survey_forms_pre_sales_responsible_id_fkey;
ALTER TABLE IF EXISTS public.survey_reports DROP CONSTRAINT IF EXISTS survey_reports_form_id_fkey;
ALTER TABLE IF EXISTS public.dict_items DROP CONSTRAINT IF EXISTS dict_items_type_id_fkey;
ALTER TABLE IF EXISTS public.messages DROP CONSTRAINT IF EXISTS messages_target_role_id_fkey;
ALTER TABLE IF EXISTS public.messages DROP CONSTRAINT IF EXISTS messages_target_user_id_fkey;
ALTER TABLE IF EXISTS public.messages DROP CONSTRAINT IF EXISTS messages_project_id_fkey;

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

CREATE OR REPLACE FUNCTION public._safe_uuid_array(value_texts TEXT[])
RETURNS UUID[]
LANGUAGE SQL
IMMUTABLE
AS $$
  SELECT COALESCE(
    ARRAY(
      SELECT public._safe_uuid(item)
      FROM unnest(COALESCE(value_texts, ARRAY[]::text[])) AS t(item)
      WHERE public._safe_uuid(item) IS NOT NULL
    ),
    ARRAY[]::uuid[]
  );
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

-- ---------------------------------------------------------------------
-- 1) Core tables
-- ---------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) NOT NULL UNIQUE,
  description TEXT,
  permissions JSONB NOT NULL DEFAULT '{}'::jsonb,
  type VARCHAR(20) NOT NULL DEFAULT 'internal',
  user_type VARCHAR(20) NOT NULL DEFAULT 'internal',
  status VARCHAR(20) NOT NULL DEFAULT 'enabled',
  create_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  update_time TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.roles ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.roles ADD COLUMN IF NOT EXISTS id UUID DEFAULT gen_random_uuid();
ALTER TABLE public.roles ADD COLUMN IF NOT EXISTS permissions JSONB NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE public.roles ADD COLUMN IF NOT EXISTS type VARCHAR(20) NOT NULL DEFAULT 'internal';
ALTER TABLE public.roles ADD COLUMN IF NOT EXISTS user_type VARCHAR(20) NOT NULL DEFAULT 'internal';
ALTER TABLE public.roles ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'enabled';
ALTER TABLE public.roles ADD COLUMN IF NOT EXISTS create_time TIMESTAMPTZ NOT NULL DEFAULT NOW();
ALTER TABLE public.roles ADD COLUMN IF NOT EXISTS update_time TIMESTAMPTZ NOT NULL DEFAULT NOW();
ALTER TABLE public.roles ALTER COLUMN id DROP DEFAULT;

UPDATE public.roles
SET id = gen_random_uuid()
WHERE id IS NULL;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'roles' AND column_name = 'id' AND data_type <> 'uuid'
  ) THEN
    ALTER TABLE public.roles
      ALTER COLUMN id TYPE UUID USING COALESCE(public._safe_uuid(id::text), gen_random_uuid());
  END IF;
END $$;

ALTER TABLE public.roles ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE public.roles ALTER COLUMN id SET NOT NULL;

UPDATE public.roles
SET type = COALESCE(NULLIF(type, ''), NULLIF(user_type, ''), 'internal'),
    user_type = COALESCE(NULLIF(user_type, ''), NULLIF(type, ''), 'internal');

ALTER TABLE public.roles DROP CONSTRAINT IF EXISTS roles_status_check;
ALTER TABLE public.roles DROP CONSTRAINT IF EXISTS roles_type_check;
ALTER TABLE public.roles DROP CONSTRAINT IF EXISTS roles_user_type_check;
ALTER TABLE public.roles
  ADD CONSTRAINT roles_status_check CHECK (status IN ('enabled', 'disabled'));
ALTER TABLE public.roles
  ADD CONSTRAINT roles_type_check CHECK (type IN ('internal', 'external'));
ALTER TABLE public.roles
  ADD CONSTRAINT roles_user_type_check CHECK (user_type IN ('internal', 'external'));
ALTER TABLE public.roles ALTER COLUMN status SET DEFAULT 'enabled';

CREATE UNIQUE INDEX IF NOT EXISTS ux_roles_id ON public.roles(id);

CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL DEFAULT gen_random_uuid(),
  username VARCHAR(50),
  user_name VARCHAR(50),
  user_realname VARCHAR(100),
  name VARCHAR(100),
  password_hash VARCHAR(255) NOT NULL DEFAULT '1234',
  type VARCHAR(20) NOT NULL DEFAULT 'external',
  user_type VARCHAR(20) NOT NULL DEFAULT 'external',
  role_id UUID,
  role_ids UUID[] NOT NULL DEFAULT '{}'::uuid[],
  phone VARCHAR(20),
  email VARCHAR(100),
  status VARCHAR(20) NOT NULL DEFAULT 'enabled',
  last_login_time TIMESTAMPTZ,
  creator VARCHAR(100),
  create_by VARCHAR(100),
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  create_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  update_time TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.users ADD COLUMN IF NOT EXISTS user_id UUID DEFAULT gen_random_uuid();
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS id UUID DEFAULT gen_random_uuid();
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS username VARCHAR(50);
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS user_name VARCHAR(50);
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS user_realname VARCHAR(100);
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS name VARCHAR(100);
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255);
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS type VARCHAR(20) DEFAULT 'external';
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS user_type VARCHAR(20) DEFAULT 'external';
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS role_id UUID;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS role_ids UUID[] NOT NULL DEFAULT '{}'::uuid[];
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS phone VARCHAR(20);
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS email VARCHAR(100);
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'enabled';
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS last_login_time TIMESTAMPTZ;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS creator VARCHAR(100);
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS create_by VARCHAR(100);
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS create_time TIMESTAMPTZ NOT NULL DEFAULT NOW();
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS update_time TIMESTAMPTZ NOT NULL DEFAULT NOW();
ALTER TABLE public.users ALTER COLUMN id DROP DEFAULT;
ALTER TABLE public.users ALTER COLUMN user_id DROP DEFAULT;
ALTER TABLE public.users ALTER COLUMN role_id DROP DEFAULT;
ALTER TABLE public.users ALTER COLUMN role_ids DROP DEFAULT;

UPDATE public.users
SET id = gen_random_uuid()
WHERE id IS NULL;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'id' AND data_type <> 'uuid'
  ) THEN
    ALTER TABLE public.users
      ALTER COLUMN id TYPE UUID USING COALESCE(public._safe_uuid(id::text), gen_random_uuid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'user_id' AND data_type <> 'uuid'
  ) THEN
    ALTER TABLE public.users
      ALTER COLUMN user_id TYPE UUID USING COALESCE(public._safe_uuid(user_id::text), gen_random_uuid());
  END IF;
END $$;

ALTER TABLE public.users ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE public.users ALTER COLUMN user_id SET DEFAULT gen_random_uuid();
ALTER TABLE public.users ALTER COLUMN role_ids SET DEFAULT '{}'::uuid[];
ALTER TABLE public.users ALTER COLUMN id SET NOT NULL;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'role_id' AND data_type <> 'uuid'
  ) THEN
    ALTER TABLE public.users
      ALTER COLUMN role_id TYPE UUID USING public._safe_uuid(role_id::text);
  END IF;
END $$;

DO $$
DECLARE
  col_data_type TEXT;
  col_udt_name TEXT;
BEGIN
  SELECT data_type, udt_name
  INTO col_data_type, col_udt_name
  FROM information_schema.columns
  WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'role_ids';

  IF col_data_type IS NULL THEN
    RETURN;
  END IF;

  IF col_data_type = 'ARRAY' AND col_udt_name <> '_uuid' THEN
    ALTER TABLE public.users
      ALTER COLUMN role_ids TYPE UUID[] USING public._safe_uuid_array(role_ids::text[]);
  ELSIF col_data_type <> 'ARRAY' THEN
    ALTER TABLE public.users
      ALTER COLUMN role_ids TYPE UUID[] USING public._safe_uuid_array(string_to_array(role_ids::text, ','));
  END IF;
END $$;

UPDATE public.users
SET username = COALESCE(NULLIF(username, ''), NULLIF(user_name, '')),
    user_name = COALESCE(NULLIF(user_name, ''), NULLIF(username, '')),
    name = COALESCE(NULLIF(name, ''), NULLIF(user_realname, ''), NULLIF(user_name, ''), NULLIF(username, '')),
    user_type = COALESCE(NULLIF(user_type, ''), NULLIF(type, ''), 'external'),
    type = COALESCE(NULLIF(type, ''), NULLIF(user_type, ''), 'external'),
    status = COALESCE(NULLIF(status, ''), 'enabled')
WHERE TRUE;

UPDATE public.users
SET user_id = gen_random_uuid()
WHERE user_id IS NULL;

ALTER TABLE public.users ALTER COLUMN password_hash SET DEFAULT '1234';
ALTER TABLE public.users ALTER COLUMN password_hash SET NOT NULL;
ALTER TABLE public.users ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.users ALTER COLUMN status SET DEFAULT 'enabled';
ALTER TABLE public.users ALTER COLUMN status SET NOT NULL;

ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_status_check;
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_type_check;
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_user_type_check;
ALTER TABLE public.users
  ADD CONSTRAINT users_status_check CHECK (status IN ('enabled', 'disabled'));
ALTER TABLE public.users
  ADD CONSTRAINT users_type_check CHECK (type IN ('internal', 'external'));
ALTER TABLE public.users
  ADD CONSTRAINT users_user_type_check CHECK (user_type IN ('internal', 'external'));

UPDATE public.users u
SET role_id = NULL
WHERE role_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.roles r WHERE r.id = u.role_id
  );

UPDATE public.users u
SET role_ids = COALESCE(
  ARRAY(
    SELECT rid
    FROM unnest(COALESCE(u.role_ids, ARRAY[]::uuid[])) AS t(rid)
    JOIN public.roles r ON r.id = rid
  ),
  ARRAY[]::uuid[]
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

CREATE UNIQUE INDEX IF NOT EXISTS ux_users_user_id ON public.users(user_id);
CREATE UNIQUE INDEX IF NOT EXISTS ux_users_id ON public.users(id);
CREATE UNIQUE INDEX IF NOT EXISTS ux_users_username ON public.users(username) WHERE username IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS ux_users_user_name ON public.users(user_name) WHERE user_name IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_type ON public.users(type);
CREATE INDEX IF NOT EXISTS idx_users_user_type ON public.users(user_type);
CREATE INDEX IF NOT EXISTS idx_users_status ON public.users(status);

CREATE TABLE IF NOT EXISTS public.survey_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL UNIQUE,
  industry VARCHAR(100) NOT NULL,
  sections JSONB NOT NULL DEFAULT '[]'::jsonb,
  create_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  update_time TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.survey_templates ADD COLUMN IF NOT EXISTS name VARCHAR(100);
ALTER TABLE public.survey_templates ADD COLUMN IF NOT EXISTS id UUID DEFAULT gen_random_uuid();
ALTER TABLE public.survey_templates ADD COLUMN IF NOT EXISTS industry VARCHAR(100);
ALTER TABLE public.survey_templates ADD COLUMN IF NOT EXISTS sections JSONB NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE public.survey_templates ADD COLUMN IF NOT EXISTS create_time TIMESTAMPTZ NOT NULL DEFAULT NOW();
ALTER TABLE public.survey_templates ADD COLUMN IF NOT EXISTS update_time TIMESTAMPTZ NOT NULL DEFAULT NOW();
ALTER TABLE public.survey_templates ALTER COLUMN id DROP DEFAULT;

UPDATE public.survey_templates
SET id = gen_random_uuid()
WHERE id IS NULL;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'survey_templates' AND column_name = 'id' AND data_type <> 'uuid'
  ) THEN
    ALTER TABLE public.survey_templates
      ALTER COLUMN id TYPE UUID USING COALESCE(public._safe_uuid(id::text), gen_random_uuid());
  END IF;
END $$;

ALTER TABLE public.survey_templates ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE public.survey_templates ALTER COLUMN id SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS ux_survey_templates_id ON public.survey_templates(id);

CREATE TABLE IF NOT EXISTS public.survey_forms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(200) NOT NULL,
  customer_name VARCHAR(200) NOT NULL,
  project_name VARCHAR(200) NOT NULL,
  industry VARCHAR(100) NOT NULL,
  region VARCHAR(100) NOT NULL,
  template_id UUID,
  status VARCHAR(20) NOT NULL DEFAULT 'enabled',
  report_status VARCHAR(20) NOT NULL DEFAULT 'pending',
  creator_id UUID,
  submitter_id UUID,
  pre_sales_responsible_id UUID,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  create_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  update_time TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.survey_forms ADD COLUMN IF NOT EXISTS name VARCHAR(200);
ALTER TABLE public.survey_forms ADD COLUMN IF NOT EXISTS id UUID DEFAULT gen_random_uuid();
ALTER TABLE public.survey_forms ADD COLUMN IF NOT EXISTS customer_name VARCHAR(200);
ALTER TABLE public.survey_forms ADD COLUMN IF NOT EXISTS project_name VARCHAR(200);
ALTER TABLE public.survey_forms ADD COLUMN IF NOT EXISTS industry VARCHAR(100);
ALTER TABLE public.survey_forms ADD COLUMN IF NOT EXISTS region VARCHAR(100);
ALTER TABLE public.survey_forms ADD COLUMN IF NOT EXISTS template_id UUID;
ALTER TABLE public.survey_forms ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'draft';
ALTER TABLE public.survey_forms ADD COLUMN IF NOT EXISTS report_status VARCHAR(20) DEFAULT 'pending';
ALTER TABLE public.survey_forms ADD COLUMN IF NOT EXISTS creator_id UUID;
ALTER TABLE public.survey_forms ADD COLUMN IF NOT EXISTS submitter_id UUID;
ALTER TABLE public.survey_forms ADD COLUMN IF NOT EXISTS pre_sales_responsible_id UUID;
ALTER TABLE public.survey_forms ADD COLUMN IF NOT EXISTS data JSONB NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE public.survey_forms ADD COLUMN IF NOT EXISTS create_time TIMESTAMPTZ NOT NULL DEFAULT NOW();
ALTER TABLE public.survey_forms ADD COLUMN IF NOT EXISTS update_time TIMESTAMPTZ NOT NULL DEFAULT NOW();
ALTER TABLE public.survey_forms ALTER COLUMN id DROP DEFAULT;
ALTER TABLE public.survey_forms ALTER COLUMN template_id DROP DEFAULT;
ALTER TABLE public.survey_forms ALTER COLUMN creator_id DROP DEFAULT;
ALTER TABLE public.survey_forms ALTER COLUMN submitter_id DROP DEFAULT;
ALTER TABLE public.survey_forms ALTER COLUMN pre_sales_responsible_id DROP DEFAULT;

UPDATE public.survey_forms
SET id = gen_random_uuid()
WHERE id IS NULL;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'survey_forms' AND column_name = 'id' AND data_type <> 'uuid'
  ) THEN
    ALTER TABLE public.survey_forms
      ALTER COLUMN id TYPE UUID USING COALESCE(public._safe_uuid(id::text), gen_random_uuid());
  END IF;
END $$;

ALTER TABLE public.survey_forms ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE public.survey_forms ALTER COLUMN id SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS ux_survey_forms_id ON public.survey_forms(id);

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'survey_forms' AND column_name = 'template_id' AND data_type <> 'uuid'
  ) THEN
    ALTER TABLE public.survey_forms
      ALTER COLUMN template_id TYPE UUID USING public._safe_uuid(template_id::text);
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'survey_forms' AND column_name = 'creator_id' AND data_type <> 'uuid'
  ) THEN
    ALTER TABLE public.survey_forms
      ALTER COLUMN creator_id TYPE UUID USING public._safe_uuid(creator_id::text);
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'survey_forms' AND column_name = 'submitter_id' AND data_type <> 'uuid'
  ) THEN
    ALTER TABLE public.survey_forms
      ALTER COLUMN submitter_id TYPE UUID USING public._safe_uuid(submitter_id::text);
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'survey_forms' AND column_name = 'pre_sales_responsible_id' AND data_type <> 'uuid'
  ) THEN
    ALTER TABLE public.survey_forms
      ALTER COLUMN pre_sales_responsible_id TYPE UUID USING public._safe_uuid(pre_sales_responsible_id::text);
  END IF;
END $$;

ALTER TABLE public.survey_forms DROP CONSTRAINT IF EXISTS survey_forms_status_check;
ALTER TABLE public.survey_forms DROP CONSTRAINT IF EXISTS survey_forms_report_status_check;

UPDATE public.survey_forms
SET status = CASE
      WHEN status IN ('draft', 'in_progress', 'completed', U&'\\8349\\7A3F', U&'\\586B\\5199\\4E2D', U&'\\5DF2\\5B8C\\6210') THEN status
      ELSE 'draft'
    END,
    report_status = CASE
      WHEN report_status IN ('pending', 'generated', U&'\\672A\\751F\\6210', U&'\\5DF2\\751F\\6210') THEN report_status
      ELSE 'pending'
    END,
    data = COALESCE(data, '{}'::jsonb);

ALTER TABLE public.survey_forms ALTER COLUMN status SET DEFAULT 'draft';
ALTER TABLE public.survey_forms ALTER COLUMN status SET NOT NULL;
ALTER TABLE public.survey_forms ALTER COLUMN report_status SET DEFAULT 'pending';
ALTER TABLE public.survey_forms ALTER COLUMN report_status SET NOT NULL;
ALTER TABLE public.survey_forms ALTER COLUMN data SET DEFAULT '{}'::jsonb;
ALTER TABLE public.survey_forms ALTER COLUMN data SET NOT NULL;

ALTER TABLE public.survey_forms
  ADD CONSTRAINT survey_forms_status_check CHECK (status IN ('draft', 'in_progress', 'completed', U&'\\8349\\7A3F', U&'\\586B\\5199\\4E2D', U&'\\5DF2\\5B8C\\6210'));
ALTER TABLE public.survey_forms
  ADD CONSTRAINT survey_forms_report_status_check CHECK (report_status IN ('pending', 'generated', U&'\\672A\\751F\\6210', U&'\\5DF2\\751F\\6210'));

-- Normalize legacy references before adding foreign keys.
UPDATE public.survey_forms sf
SET creator_id = u.id
FROM public.users u
WHERE sf.creator_id IS NOT NULL
  AND sf.creator_id = u.user_id
  AND NOT EXISTS (
    SELECT 1 FROM public.users ux WHERE ux.id = sf.creator_id
  );

UPDATE public.survey_forms sf
SET submitter_id = u.id
FROM public.users u
WHERE sf.submitter_id IS NOT NULL
  AND sf.submitter_id = u.user_id
  AND NOT EXISTS (
    SELECT 1 FROM public.users ux WHERE ux.id = sf.submitter_id
  );

UPDATE public.survey_forms sf
SET pre_sales_responsible_id = u.id
FROM public.users u
WHERE sf.pre_sales_responsible_id IS NOT NULL
  AND sf.pre_sales_responsible_id = u.user_id
  AND NOT EXISTS (
    SELECT 1 FROM public.users ux WHERE ux.id = sf.pre_sales_responsible_id
  );

UPDATE public.survey_forms sf
SET template_id = NULL
WHERE sf.template_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.survey_templates st WHERE st.id = sf.template_id
  );

UPDATE public.survey_forms sf
SET creator_id = NULL
WHERE sf.creator_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.users u WHERE u.id = sf.creator_id
  );

UPDATE public.survey_forms sf
SET submitter_id = NULL
WHERE sf.submitter_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.users u WHERE u.id = sf.submitter_id
  );

UPDATE public.survey_forms sf
SET pre_sales_responsible_id = NULL
WHERE sf.pre_sales_responsible_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.users u WHERE u.id = sf.pre_sales_responsible_id
  );
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
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
    SELECT 1 FROM pg_constraint
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
    SELECT 1 FROM pg_constraint
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
    SELECT 1 FROM pg_constraint
    WHERE conname = 'survey_forms_pre_sales_responsible_id_fkey'
      AND conrelid = 'public.survey_forms'::regclass
  ) THEN
    ALTER TABLE public.survey_forms
      ADD CONSTRAINT survey_forms_pre_sales_responsible_id_fkey
      FOREIGN KEY (pre_sales_responsible_id) REFERENCES public.users(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_survey_forms_status ON public.survey_forms(status);
CREATE INDEX IF NOT EXISTS idx_survey_forms_creator_id ON public.survey_forms(creator_id);
CREATE INDEX IF NOT EXISTS idx_survey_forms_customer_name ON public.survey_forms(customer_name);
CREATE INDEX IF NOT EXISTS idx_survey_forms_project_name ON public.survey_forms(project_name);

CREATE TABLE IF NOT EXISTS public.survey_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id UUID NOT NULL UNIQUE,
  content TEXT NOT NULL,
  generate_time TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.survey_reports ADD COLUMN IF NOT EXISTS form_id UUID;
ALTER TABLE public.survey_reports ADD COLUMN IF NOT EXISTS id UUID DEFAULT gen_random_uuid();
ALTER TABLE public.survey_reports ADD COLUMN IF NOT EXISTS content TEXT;
ALTER TABLE public.survey_reports ADD COLUMN IF NOT EXISTS generate_time TIMESTAMPTZ NOT NULL DEFAULT NOW();
ALTER TABLE public.survey_reports ALTER COLUMN id DROP DEFAULT;
ALTER TABLE public.survey_reports ALTER COLUMN form_id DROP DEFAULT;

UPDATE public.survey_reports
SET id = gen_random_uuid()
WHERE id IS NULL;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'survey_reports' AND column_name = 'id' AND data_type <> 'uuid'
  ) THEN
    ALTER TABLE public.survey_reports
      ALTER COLUMN id TYPE UUID USING COALESCE(public._safe_uuid(id::text), gen_random_uuid());
  END IF;
END $$;

ALTER TABLE public.survey_reports ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE public.survey_reports ALTER COLUMN id SET NOT NULL;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'survey_reports' AND column_name = 'form_id' AND data_type <> 'uuid'
  ) THEN
    ALTER TABLE public.survey_reports
      ALTER COLUMN form_id TYPE UUID USING public._safe_uuid(form_id::text);
  END IF;
END $$;

DELETE FROM public.survey_reports sr
WHERE sr.form_id IS NULL
  OR NOT EXISTS (
    SELECT 1 FROM public.survey_forms sf WHERE sf.id = sr.form_id
  );
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'survey_reports_form_id_fkey'
      AND conrelid = 'public.survey_reports'::regclass
  ) THEN
    ALTER TABLE public.survey_reports
      ADD CONSTRAINT survey_reports_form_id_fkey
      FOREIGN KEY (form_id) REFERENCES public.survey_forms(id) ON DELETE CASCADE;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.dict_types (
  type_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type_name VARCHAR(100) NOT NULL,
  type_code VARCHAR(50) NOT NULL UNIQUE,
  description TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'enabled',
  sort_order INTEGER NOT NULL DEFAULT 0,
  create_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  creator_id UUID
);

ALTER TABLE public.dict_types ADD COLUMN IF NOT EXISTS type_name VARCHAR(100);
ALTER TABLE public.dict_types ADD COLUMN IF NOT EXISTS type_code VARCHAR(50);
ALTER TABLE public.dict_types ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.dict_types ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'enabled';
ALTER TABLE public.dict_types ADD COLUMN IF NOT EXISTS sort_order INTEGER NOT NULL DEFAULT 0;
ALTER TABLE public.dict_types ADD COLUMN IF NOT EXISTS create_time TIMESTAMPTZ NOT NULL DEFAULT NOW();
ALTER TABLE public.dict_types ADD COLUMN IF NOT EXISTS creator_id UUID;
ALTER TABLE public.dict_types ALTER COLUMN type_id DROP DEFAULT;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'dict_types' AND column_name = 'type_id' AND data_type <> 'uuid'
  ) THEN
    ALTER TABLE public.dict_types
      ALTER COLUMN type_id TYPE UUID USING COALESCE(public._safe_uuid(type_id::text), gen_random_uuid());
  END IF;
END $$;

ALTER TABLE public.dict_types ALTER COLUMN type_id SET DEFAULT gen_random_uuid();
ALTER TABLE public.dict_types ALTER COLUMN type_id SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS ux_dict_types_type_id ON public.dict_types(type_id);

ALTER TABLE public.dict_types DROP CONSTRAINT IF EXISTS dict_types_status_check;
ALTER TABLE public.dict_types
  ADD CONSTRAINT dict_types_status_check CHECK (status IN ('enabled', 'disabled'));
ALTER TABLE public.dict_types ALTER COLUMN status SET DEFAULT 'enabled';

CREATE TABLE IF NOT EXISTS public.dict_items (
  item_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type_id UUID NOT NULL,
  item_label VARCHAR(100) NOT NULL,
  item_value VARCHAR(100) NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  status VARCHAR(20) NOT NULL DEFAULT 'enabled',
  ext1 VARCHAR(255),
  ext2 VARCHAR(255),
  create_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  creator_id UUID
);

ALTER TABLE public.dict_items ADD COLUMN IF NOT EXISTS type_id UUID;
ALTER TABLE public.dict_items ADD COLUMN IF NOT EXISTS item_label VARCHAR(100);
ALTER TABLE public.dict_items ADD COLUMN IF NOT EXISTS item_value VARCHAR(100);
ALTER TABLE public.dict_items ADD COLUMN IF NOT EXISTS sort_order INTEGER NOT NULL DEFAULT 0;
ALTER TABLE public.dict_items ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'enabled';
ALTER TABLE public.dict_items ADD COLUMN IF NOT EXISTS ext1 VARCHAR(255);
ALTER TABLE public.dict_items ADD COLUMN IF NOT EXISTS ext2 VARCHAR(255);
ALTER TABLE public.dict_items ADD COLUMN IF NOT EXISTS create_time TIMESTAMPTZ NOT NULL DEFAULT NOW();
ALTER TABLE public.dict_items ADD COLUMN IF NOT EXISTS creator_id UUID;
ALTER TABLE public.dict_items ALTER COLUMN item_id DROP DEFAULT;
ALTER TABLE public.dict_items ALTER COLUMN type_id DROP DEFAULT;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'dict_items' AND column_name = 'item_id' AND data_type <> 'uuid'
  ) THEN
    ALTER TABLE public.dict_items
      ALTER COLUMN item_id TYPE UUID USING COALESCE(public._safe_uuid(item_id::text), gen_random_uuid());
  END IF;
END $$;

ALTER TABLE public.dict_items ALTER COLUMN item_id SET DEFAULT gen_random_uuid();
ALTER TABLE public.dict_items ALTER COLUMN item_id SET NOT NULL;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'dict_items' AND column_name = 'type_id' AND data_type <> 'uuid'
  ) THEN
    ALTER TABLE public.dict_items
      ALTER COLUMN type_id TYPE UUID USING public._safe_uuid(type_id::text);
  END IF;
END $$;

ALTER TABLE public.dict_items DROP CONSTRAINT IF EXISTS dict_items_status_check;
ALTER TABLE public.dict_items
  ADD CONSTRAINT dict_items_status_check CHECK (status IN ('enabled', 'disabled'));
ALTER TABLE public.dict_items ALTER COLUMN status SET DEFAULT 'enabled';

DELETE FROM public.dict_items di
WHERE di.type_id IS NULL
  OR NOT EXISTS (
    SELECT 1 FROM public.dict_types dt WHERE dt.type_id = di.type_id
  );
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'dict_items_type_id_fkey'
      AND conrelid = 'public.dict_items'::regclass
  ) THEN
    ALTER TABLE public.dict_items
      ADD CONSTRAINT dict_items_type_id_fkey
      FOREIGN KEY (type_id) REFERENCES public.dict_types(type_id) ON DELETE CASCADE;
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS ux_dict_types_type_code ON public.dict_types(type_code);
CREATE INDEX IF NOT EXISTS idx_dict_items_type_id ON public.dict_items(type_id);
CREATE UNIQUE INDEX IF NOT EXISTS ux_dict_items_type_value ON public.dict_items(type_id, item_value);

CREATE TABLE IF NOT EXISTS public.region_dicts (
  region_id VARCHAR(64) PRIMARY KEY,
  region_name VARCHAR(100) NOT NULL,
  region_code VARCHAR(50) NOT NULL UNIQUE,
  parent_id VARCHAR(64),
  region_level INTEGER NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  status VARCHAR(20) NOT NULL DEFAULT 'enabled',
  is_system BOOLEAN NOT NULL DEFAULT FALSE,
  create_time TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.region_dicts ADD COLUMN IF NOT EXISTS region_name VARCHAR(100);
ALTER TABLE public.region_dicts ADD COLUMN IF NOT EXISTS region_code VARCHAR(50);
ALTER TABLE public.region_dicts ADD COLUMN IF NOT EXISTS parent_id VARCHAR(64);
ALTER TABLE public.region_dicts ADD COLUMN IF NOT EXISTS region_level INTEGER;
ALTER TABLE public.region_dicts ADD COLUMN IF NOT EXISTS sort_order INTEGER NOT NULL DEFAULT 0;
ALTER TABLE public.region_dicts ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'enabled';
ALTER TABLE public.region_dicts ADD COLUMN IF NOT EXISTS is_system BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE public.region_dicts ADD COLUMN IF NOT EXISTS create_time TIMESTAMPTZ NOT NULL DEFAULT NOW();

CREATE TABLE IF NOT EXISTS public.product_capabilities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL UNIQUE,
  type VARCHAR(20) NOT NULL DEFAULT 'software',
  industries JSONB NOT NULL DEFAULT '[]'::jsonb,
  scenarios JSONB NOT NULL DEFAULT '[]'::jsonb,
  description TEXT NOT NULL DEFAULT '',
  create_time TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.product_capabilities ADD COLUMN IF NOT EXISTS name VARCHAR(100);
ALTER TABLE public.product_capabilities ADD COLUMN IF NOT EXISTS type VARCHAR(20) DEFAULT 'software';
ALTER TABLE public.product_capabilities ADD COLUMN IF NOT EXISTS industries JSONB NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE public.product_capabilities ADD COLUMN IF NOT EXISTS scenarios JSONB NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE public.product_capabilities ADD COLUMN IF NOT EXISTS description TEXT NOT NULL DEFAULT '';
ALTER TABLE public.product_capabilities ADD COLUMN IF NOT EXISTS create_time TIMESTAMPTZ NOT NULL DEFAULT NOW();

ALTER TABLE public.product_capabilities DROP CONSTRAINT IF EXISTS product_capabilities_type_check;

UPDATE public.product_capabilities
SET type = CASE
      WHEN LOWER(type) IN ('software', 'hardware', 'consulting', 'consult', 'retrofit', 'construction', 'retrofit_construction') THEN
        CASE
          WHEN LOWER(type) = 'consult' THEN 'consulting'
          WHEN LOWER(type) IN ('retrofit', 'construction') THEN 'retrofit_construction'
          ELSE LOWER(type)
        END
      ELSE 'software'
    END;

ALTER TABLE public.product_capabilities
  ADD CONSTRAINT product_capabilities_type_check CHECK (type IN ('software', 'hardware', 'consulting', 'retrofit_construction'));
ALTER TABLE public.product_capabilities ALTER COLUMN type SET DEFAULT 'software';

CREATE TABLE IF NOT EXISTS public.system_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  operator_id UUID,
  type VARCHAR(20) NOT NULL,
  content TEXT NOT NULL,
  ip_address VARCHAR(64),
  result VARCHAR(20) NOT NULL DEFAULT '成功',
  create_time TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.system_logs ADD COLUMN IF NOT EXISTS operator_id UUID;
ALTER TABLE public.system_logs ADD COLUMN IF NOT EXISTS id UUID DEFAULT gen_random_uuid();
ALTER TABLE public.system_logs ADD COLUMN IF NOT EXISTS type VARCHAR(20);
ALTER TABLE public.system_logs ADD COLUMN IF NOT EXISTS content TEXT;
ALTER TABLE public.system_logs ADD COLUMN IF NOT EXISTS ip_address VARCHAR(64);
ALTER TABLE public.system_logs ADD COLUMN IF NOT EXISTS result VARCHAR(20) DEFAULT '成功';
ALTER TABLE public.system_logs ADD COLUMN IF NOT EXISTS create_time TIMESTAMPTZ NOT NULL DEFAULT NOW();
ALTER TABLE public.system_logs ALTER COLUMN id DROP DEFAULT;
ALTER TABLE public.system_logs ALTER COLUMN operator_id DROP DEFAULT;

UPDATE public.system_logs
SET id = gen_random_uuid()
WHERE id IS NULL;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'system_logs' AND column_name = 'id' AND data_type <> 'uuid'
  ) THEN
    ALTER TABLE public.system_logs
      ALTER COLUMN id TYPE UUID USING COALESCE(public._safe_uuid(id::text), gen_random_uuid());
  END IF;
END $$;

ALTER TABLE public.system_logs ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE public.system_logs ALTER COLUMN id SET NOT NULL;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'system_logs' AND column_name = 'operator_id' AND data_type <> 'uuid'
  ) THEN
    ALTER TABLE public.system_logs
      ALTER COLUMN operator_id TYPE UUID USING public._safe_uuid(operator_id::text);
  END IF;
END $$;

UPDATE public.system_logs
SET result = CASE
      WHEN result IN ('成功', '失败') THEN result
      ELSE '成功'
    END;

ALTER TABLE public.system_logs DROP CONSTRAINT IF EXISTS system_logs_type_check;
ALTER TABLE public.system_logs DROP CONSTRAINT IF EXISTS system_logs_result_check;
ALTER TABLE public.system_logs
  ADD CONSTRAINT system_logs_type_check CHECK (type IN ('login', 'survey', 'user', 'system'));
ALTER TABLE public.system_logs
  ADD CONSTRAINT system_logs_result_check CHECK (result IN ('成功', '失败'));

CREATE INDEX IF NOT EXISTS idx_system_logs_operator_id ON public.system_logs(operator_id);
CREATE INDEX IF NOT EXISTS idx_system_logs_type ON public.system_logs(type);
CREATE INDEX IF NOT EXISTS idx_system_logs_create_time ON public.system_logs(create_time DESC);

CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(150) NOT NULL,
  content TEXT NOT NULL,
  type VARCHAR(20) NOT NULL DEFAULT 'system',
  read BOOLEAN NOT NULL DEFAULT FALSE,
  cleared BOOLEAN NOT NULL DEFAULT FALSE,
  target_role_id UUID,
  target_user_id UUID,
  project_id UUID,
  create_time TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS title VARCHAR(150);
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS id UUID DEFAULT gen_random_uuid();
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS content TEXT;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS type VARCHAR(20) NOT NULL DEFAULT 'system';
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS read BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS cleared BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS target_role_id UUID;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS target_user_id UUID;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS project_id UUID;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS create_time TIMESTAMPTZ NOT NULL DEFAULT NOW();
ALTER TABLE public.messages ALTER COLUMN id DROP DEFAULT;
ALTER TABLE public.messages ALTER COLUMN target_role_id DROP DEFAULT;
ALTER TABLE public.messages ALTER COLUMN target_user_id DROP DEFAULT;
ALTER TABLE public.messages ALTER COLUMN project_id DROP DEFAULT;

UPDATE public.messages
SET id = gen_random_uuid()
WHERE id IS NULL;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'messages' AND column_name = 'id' AND data_type <> 'uuid'
  ) THEN
    ALTER TABLE public.messages
      ALTER COLUMN id TYPE UUID USING COALESCE(public._safe_uuid(id::text), gen_random_uuid());
  END IF;
END $$;

ALTER TABLE public.messages ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE public.messages ALTER COLUMN id SET NOT NULL;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'messages' AND column_name = 'target_role_id' AND data_type <> 'uuid'
  ) THEN
    ALTER TABLE public.messages
      ALTER COLUMN target_role_id TYPE UUID USING public._safe_uuid(target_role_id::text);
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'messages' AND column_name = 'target_user_id' AND data_type <> 'uuid'
  ) THEN
    ALTER TABLE public.messages
      ALTER COLUMN target_user_id TYPE UUID USING public._safe_uuid(target_user_id::text);
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'messages' AND column_name = 'project_id' AND data_type <> 'uuid'
  ) THEN
    ALTER TABLE public.messages
      ALTER COLUMN project_id TYPE UUID USING public._safe_uuid(project_id::text);
  END IF;
END $$;

ALTER TABLE public.messages DROP CONSTRAINT IF EXISTS messages_type_check;
ALTER TABLE public.messages
  ADD CONSTRAINT messages_type_check CHECK (type IN ('system', 'report'));

UPDATE public.messages m
SET target_user_id = u.id
FROM public.users u
WHERE m.target_user_id IS NOT NULL
  AND m.target_user_id = u.user_id
  AND NOT EXISTS (
    SELECT 1 FROM public.users ux WHERE ux.id = m.target_user_id
  );

UPDATE public.messages m
SET target_role_id = NULL
WHERE m.target_role_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.roles r WHERE r.id = m.target_role_id
  );

UPDATE public.messages m
SET target_user_id = NULL
WHERE m.target_user_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.users u WHERE u.id = m.target_user_id
  );

UPDATE public.messages m
SET project_id = NULL
WHERE m.project_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.survey_forms sf WHERE sf.id = m.project_id
  );
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
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
    SELECT 1 FROM pg_constraint
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
    SELECT 1 FROM pg_constraint
    WHERE conname = 'messages_project_id_fkey'
      AND conrelid = 'public.messages'::regclass
  ) THEN
    ALTER TABLE public.messages
      ADD CONSTRAINT messages_project_id_fkey
      FOREIGN KEY (project_id) REFERENCES public.survey_forms(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_messages_target_user_id ON public.messages(target_user_id);
CREATE INDEX IF NOT EXISTS idx_messages_target_role_id ON public.messages(target_role_id);
CREATE INDEX IF NOT EXISTS idx_messages_read ON public.messages(read);
CREATE INDEX IF NOT EXISTS idx_messages_create_time ON public.messages(create_time DESC);

-- ---------------------------------------------------------------------
-- 2) Seed / sync baseline data
-- ---------------------------------------------------------------------

INSERT INTO public.roles (name, description, permissions, type, user_type, status)
VALUES
  (
    'System Administrator',
    'Full access administrator',
    '{"system:users": true, "system:roles": true, "system:config": true, "system:logs": true, "survey:create": true, "survey:edit": true, "report:generate": true, "product:edit": true}'::jsonb,
    'internal',
    'internal',
    'enabled'
  ),
  (
    'Pre-sales Engineer',
    'Handles surveys and report generation',
    '{"survey:view": true, "survey:create": true, "survey:edit": true, "report:view": true, "report:generate": true, "product:edit": true}'::jsonb,
    'internal',
    'internal',
    'enabled'
  ),
  (
    U&'\\5BA2\\6237\\7528\\6237',
    'External customer with limited access',
    '{"survey:view": true, "report:view": true, "messages:view": true}'::jsonb,
    'external',
    'external',
    'enabled'
  )
ON CONFLICT (name) DO UPDATE
SET description = EXCLUDED.description,
    permissions = EXCLUDED.permissions,
    type = EXCLUDED.type,
    user_type = EXCLUDED.user_type,
    status = EXCLUDED.status;

INSERT INTO public.users (user_id, username, user_name, name, password_hash, type, user_type, role_id, status, creator)
SELECT
  gen_random_uuid(),
  'admin',
  'admin',
  'System Administrator',
  '1234',
  'internal',
  'internal',
  r.id,
  'enabled',
  'system'
FROM public.roles r
WHERE r.name = 'System Administrator'
  AND NOT EXISTS (
    SELECT 1 FROM public.users u WHERE u.username = 'admin' OR u.user_name = 'admin'
  );

INSERT INTO public.dict_types (type_name, type_code, description, status, sort_order)
VALUES
  ('行业类型', 'industry', '用于行业选项', 'enabled', 1),
  ('区域信息', 'region', '用于区域选项', 'enabled', 2),
  ('能力类型', 'capability_type', '用于产品能力类型选项', 'enabled', 3),
  ('场景分类', 'scenario', '用于应用场景选项', 'enabled', 4)
ON CONFLICT (type_code) DO UPDATE
SET type_name = EXCLUDED.type_name,
    description = EXCLUDED.description,
    status = EXCLUDED.status,
    sort_order = EXCLUDED.sort_order;

DELETE FROM public.dict_items
WHERE type_id IN (
  SELECT type_id FROM public.dict_types WHERE type_code IN ('form_status', 'user_status')
);

DELETE FROM public.dict_types
WHERE type_code IN ('form_status', 'user_status');

WITH type_map AS (
  SELECT type_id, type_code
  FROM public.dict_types
  WHERE type_code IN ('industry', 'capability_type', 'scenario')
),
seed_data(type_code, item_label, item_value, sort_order) AS (
  VALUES
    ('industry', '制造业', 'manufacturing', 1),
    ('industry', '商业地产', 'commercial_real_estate', 2),
    ('industry', '园区', 'campus', 3),

    ('capability_type', '软件', 'software', 1),
    ('capability_type', '硬件', 'hardware', 2),
    ('capability_type', 'Retrofit Construction', 'retrofit_construction', 3),
    ('capability_type', '咨询', 'consulting', 4),

    ('scenario', '工业园区', 'industrial_park', 1),
    ('scenario', '单体工业厂房', 'single_industrial_plant', 2),
    ('scenario', '数据中心', 'data_center', 3),
    ('scenario', '商业楼宇', 'commercial_building', 4),
    ('scenario', 'Commercial Complex', 'commercial_complex', 5),
    ('scenario', '酒店', 'hotel', 6)
)
INSERT INTO public.dict_items (type_id, item_label, item_value, sort_order, status)
SELECT tm.type_id, sd.item_label, sd.item_value, sd.sort_order, 'enabled'
FROM seed_data sd
JOIN type_map tm ON tm.type_code = sd.type_code
ON CONFLICT (type_id, item_value) DO UPDATE
SET item_label = EXCLUDED.item_label,
    sort_order = EXCLUDED.sort_order,
    status = EXCLUDED.status;

-- ---------------------------------------------------------------------
-- 3) Permissions + RLS
-- ---------------------------------------------------------------------

REVOKE ALL ON SCHEMA public FROM anon;
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon;
GRANT USAGE ON SCHEMA public TO authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated, service_role;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated, service_role;

ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.survey_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.survey_forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.survey_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dict_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dict_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.region_dicts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_capabilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS p_roles_all ON public.roles;
CREATE POLICY p_roles_all ON public.roles FOR ALL
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS p_users_all ON public.users;
CREATE POLICY p_users_all ON public.users FOR ALL
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS p_survey_templates_all ON public.survey_templates;
CREATE POLICY p_survey_templates_all ON public.survey_templates FOR ALL
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS p_survey_forms_all ON public.survey_forms;
CREATE POLICY p_survey_forms_all ON public.survey_forms FOR ALL
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS p_survey_reports_all ON public.survey_reports;
CREATE POLICY p_survey_reports_all ON public.survey_reports FOR ALL
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS p_dict_types_all ON public.dict_types;
CREATE POLICY p_dict_types_all ON public.dict_types FOR ALL
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS p_dict_items_all ON public.dict_items;
CREATE POLICY p_dict_items_all ON public.dict_items FOR ALL
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS p_region_dicts_all ON public.region_dicts;
CREATE POLICY p_region_dicts_all ON public.region_dicts FOR ALL
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS p_product_capabilities_all ON public.product_capabilities;
CREATE POLICY p_product_capabilities_all ON public.product_capabilities FOR ALL
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS p_system_logs_all ON public.system_logs;
CREATE POLICY p_system_logs_all ON public.system_logs FOR ALL
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS p_messages_all ON public.messages;
CREATE POLICY p_messages_all ON public.messages FOR ALL
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

COMMIT;
