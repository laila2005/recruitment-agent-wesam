-- ==============================================================================
-- TalentScout AI (Lili) — Migration 002: recruiter login, private rows, Lili verdicts
-- Run once in Supabase → SQL Editor on a database created from the original schema.sql.
-- Safe to re-run.
--
-- After running:
--   1. Auth → Providers → Email: turn OFF "Confirm email" (demo) or confirm once by email.
--   2. Auth → URL Configuration → Site URL: https://lili-hr-agent.vercel.app
--   3. Sign up from the dashboard, then (optional) claim rows created before login:
--        update public.candidates set owner_id = '<your auth.users id>' where owner_id is null;
-- ==============================================================================

-- 1. Ownership columns ---------------------------------------------------------
alter table public.candidates add column if not exists owner_id uuid default auth.uid() references auth.users (id) on delete cascade;
alter table public.job_roles  add column if not exists owner_id uuid default auth.uid() references auth.users (id) on delete cascade;

-- The original seed roles (fe_lead, be_senior, ai_eng) have no owner and never matched the app's role IDs.
delete from public.job_roles where owner_id is null;

-- Role IDs such as 'frontend' repeat for every recruiter, so the key is (owner_id, id).
alter table public.job_roles alter column owner_id set not null;
alter table public.job_roles drop constraint if exists job_roles_pkey;
alter table public.job_roles add constraint job_roles_pkey primary key (owner_id, id);

create index if not exists candidates_owner_idx on public.candidates (owner_id);

-- 2. CV text and Lili's deep evaluation ------------------------------------------
alter table public.candidates add column if not exists cv_text text;
alter table public.candidates add column if not exists lili_score integer;
alter table public.candidates add column if not exists lili_tier integer;
alter table public.candidates add column if not exists lili_summary text;
alter table public.candidates add column if not exists lili_strengths jsonb not null default '[]'::jsonb;
alter table public.candidates add column if not exists lili_gaps jsonb not null default '[]'::jsonb;
alter table public.candidates add column if not exists lili_evidence jsonb not null default '[]'::jsonb;
alter table public.candidates add column if not exists lili_evaluated_at timestamptz;

-- 3. Row Level Security: each recruiter sees only their own rows -------------------
alter table public.job_roles enable row level security;
alter table public.candidates enable row level security;

drop policy if exists "Public access for job_roles" on public.job_roles;
drop policy if exists "Public access for candidates" on public.candidates;
drop policy if exists "Owner access for job_roles" on public.job_roles;
drop policy if exists "Owner access for candidates" on public.candidates;

create policy "Owner access for job_roles" on public.job_roles
  for all to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));

create policy "Owner access for candidates" on public.candidates
  for all to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));

revoke all on public.job_roles from anon;
revoke all on public.candidates from anon;
grant select, insert, update, delete on public.job_roles to authenticated;
grant select, insert, update, delete on public.candidates to authenticated;

-- 4. Realtime: full row images so UPDATE/DELETE events carry the keys ---------------
alter table public.candidates replica identity full;
alter table public.job_roles replica identity full;

do $$
begin
  if not exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    create publication supabase_realtime;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'job_roles') then
    alter publication supabase_realtime add table public.job_roles;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'candidates') then
    alter publication supabase_realtime add table public.candidates;
  end if;
end $$;

-- 5. Lili's two tools (called by the Wesam agent through the Supabase MCP server) ----
-- Not executable by anon/authenticated, so a browser cannot forge a "Lili verified" result.

create or replace function public.lili_get_candidate(p_id text)
returns jsonb
language sql
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'candidate_id', c.id,
    'cv_text', c.cv_text,
    'years_detected_by_prescreen', c.years,
    'prescreen_score', c.score,
    'role', jsonb_build_object(
      'id', j.id,
      'title', j.title,
      'company', j.company,
      'min_years', j.min_exp,
      'must_haves', j.mandatory,
      'weights', j.weights,
      'job_description', j.full_text
    ),
    'scoring_rules', jsonb_build_object(
      'tier1_min', 85,
      'tier2_min', 70,
      'under_min_experience_cap', 69,
      'missing_must_have_cap', 74
    )
  )
  from public.candidates c
  left join public.job_roles j on j.id = c.role_id and j.owner_id = c.owner_id
  where c.id = p_id;
$$;

create or replace function public.lili_submit_evaluation(
  p_id text,
  p_score integer,
  p_summary text,
  p_strengths jsonb default '[]'::jsonb,
  p_gaps jsonb default '[]'::jsonb,
  p_evidence jsonb default '[]'::jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_score integer := greatest(0, least(100, coalesce(p_score, 0)));
  v_tier integer := case when v_score >= 85 then 1 when v_score >= 70 then 2 else 3 end;
  v_found text;
begin
  update public.candidates
     set lili_score = v_score,
         lili_tier = v_tier,
         lili_summary = left(coalesce(p_summary, ''), 2000),
         lili_strengths = coalesce(p_strengths, '[]'::jsonb),
         lili_gaps = coalesce(p_gaps, '[]'::jsonb),
         lili_evidence = coalesce(p_evidence, '[]'::jsonb),
         lili_evaluated_at = now()
   where id = p_id
  returning id into v_found;

  if v_found is null then
    raise exception 'Candidate % not found', p_id;
  end if;

  return jsonb_build_object('candidate_id', p_id, 'lili_score', v_score, 'lili_tier', v_tier);
end;
$$;

revoke all on function public.lili_get_candidate(text) from public, anon, authenticated;
revoke all on function public.lili_submit_evaluation(text, integer, text, jsonb, jsonb, jsonb) from public, anon, authenticated;
grant execute on function public.lili_get_candidate(text) to service_role;
grant execute on function public.lili_submit_evaluation(text, integer, text, jsonb, jsonb, jsonb) to service_role;
