-- ==============================================================================
-- TalentScout AI (Agent: Lili) — Supabase Database Schema
-- Project: Lili-HR-agent (https://ppjxzlepqstqvcrkqscz.supabase.co)
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
    role_id TEXT REFERENCES public.job_roles(id) ON DELETE CASCADE,
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

-- 4. Create Public Access Policies (Allow Dashboard CRUD without Auth barriers)
DROP POLICY IF EXISTS "Public access for job_roles" ON public.job_roles;
CREATE POLICY "Public access for job_roles"
    ON public.job_roles
    FOR ALL
    USING (true)
    WITH CHECK (true);

DROP POLICY IF EXISTS "Public access for candidates" ON public.candidates;
CREATE POLICY "Public access for candidates"
    ON public.candidates
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- 5. Seed Initial Default Job Roles
INSERT INTO public.job_roles (id, title, department, company, min_exp, mandatory, weights, full_text)
VALUES
(
    'fe_lead',
    'Frontend Lead Engineer',
    'Frontend / Web',
    'Venture Studio Portfolio',
    5.0,
    '["React", "TypeScript", "Next.js", "State Management", "Tailwind CSS"]'::jsonb,
    '{"tech": 40, "exp": 25, "impact": 20, "lead": 15}'::jsonb,
    'Requirements: 5+ years experience building production React/TypeScript web apps at scale. Strong focus on design systems and cross-functional team leadership.'
),
(
    'be_senior',
    'Senior Backend Engineer',
    'Backend / Platform',
    'Cloud Infrastructure Team',
    5.0,
    '["Python", "FastAPI", "PostgreSQL", "Docker", "RESTful APIs", "Redis"]'::jsonb,
    '{"tech": 40, "exp": 25, "impact": 20, "lead": 15}'::jsonb,
    'Requirements: 5+ years building scalable, high-throughput backend services. Proficiency in Python (FastAPI/Django), relational database optimization, and cloud containers.'
),
(
    'ai_eng',
    'AI / ML Systems Engineer',
    'AI & Automation',
    'Applied AI Labs',
    3.0,
    '["Python", "PyTorch", "LangChain", "Vector DB", "LLM Fine-Tuning"]'::jsonb,
    '{"tech": 45, "exp": 20, "impact": 20, "lead": 15}'::jsonb,
    'Requirements: 3+ years production ML engineering. Hands-on experience deploying LLM pipelines, vector databases (Qdrant/Pinecone), and retrieval-augmented generation.'
)
ON CONFLICT (id) DO UPDATE SET
    title = EXCLUDED.title,
    min_exp = EXCLUDED.min_exp,
    mandatory = EXCLUDED.mandatory,
    weights = EXCLUDED.weights,
    full_text = EXCLUDED.full_text;

-- 6. Enable Realtime Publications
BEGIN;
  DROP PUBLICATION IF EXISTS supabase_realtime;
  CREATE PUBLICATION supabase_realtime FOR TABLE public.job_roles, public.candidates;
COMMIT;
