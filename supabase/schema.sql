-- ==============================================================================
-- TalentScout AI (Agent: Lili) — Supabase Database Schema
-- Project: Lili-HR-agent (https://ppjxzlepqstqvcrkqscz.supabase.co)
-- Fresh install: run this file, then supabase/migrations/002_auth_private_rows.sql.
-- ==============================================================================

-- 1. Create JOB_ROLES table
CREATE TABLE IF NOT EXISTS public.job_roles (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    department TEXT NOT NULL DEFAULT 'Engineering',
    company TEXT DEFAULT 'TalentScout Portfolio',
    min_exp NUMERIC NOT NULL DEFAULT 4.0,
    mandatory JSONB NOT NULL DEFAULT '[]'::jsonb,
    weights JSONB NOT NULL DEFAULT '{"tech": 40, "exp": 25, "impact": 20, "lead": 15}'::jsonb,
    full_text TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Create CANDIDATES table
CREATE TABLE IF NOT EXISTS public.candidates (
    id TEXT PRIMARY KEY,
    role_id TEXT,
    anon_id TEXT NOT NULL,
    name TEXT NOT NULL,
    contact_email TEXT,
    university TEXT DEFAULT 'Verified Degree',
    location TEXT DEFAULT 'Remote / Verified',
    score INTEGER NOT NULL DEFAULT 75,
    tier INTEGER NOT NULL DEFAULT 2, -- 1: Fast-Track, 2: Bench/Review, 3: Does Not Meet Bar
    years NUMERIC NOT NULL DEFAULT 3.0,
    matched JSONB NOT NULL DEFAULT '[]'::jsonb,
    missing JSONB NOT NULL DEFAULT '[]'::jsonb,
    takeaway TEXT,
    breakdown JSONB NOT NULL DEFAULT '[]'::jsonb,
    strengths JSONB NOT NULL DEFAULT '[]'::jsonb,
    gaps JSONB NOT NULL DEFAULT '[]'::jsonb,
    questions JSONB NOT NULL DEFAULT '[]'::jsonb,
    email TEXT,
    status TEXT DEFAULT 'pending', -- 'pending', 'invite', 'feedback', 'sent'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Enable Row Level Security (RLS)
ALTER TABLE public.job_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.candidates ENABLE ROW LEVEL SECURITY;

-- 4. Access policies, ownership, and default roles live in migrations/002_auth_private_rows.sql
--    (owner-only RLS). Do not add anon/public policies here: re-running this file must never
--    reopen candidate data. Default roles are created per recruiter by the dashboard on first sign-in.

-- 6. Enable Realtime Publications
-- Add tables to Supabase's existing publication instead of dropping it
-- (DROP PUBLICATION removes realtime for every other table in the project).
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'job_roles') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.job_roles;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'candidates') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.candidates;
  END IF;
END $$;
