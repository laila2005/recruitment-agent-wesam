-- ==============================================================================
-- TalentScout AI (Lili) — Migration 003: Lili works on her own
-- Gives the scheduled Wesam workflow everything it needs to run the pipeline without a human:
--   lili_list_roles        → which open roles a recruiter has (to route emailed CVs)
--   lili_ingest_application → add a candidate who applied by email (idempotent per email message)
--   lili_pending_candidates → candidates waiting for Lili's evaluation
--   lili_record_outreach    → record the invite/rejection Lili drafted in Gmail
-- Same security model as 002: callable by the agent's server-side connection only, never by browsers.
-- Safe to re-run.
-- ==============================================================================

alter table public.candidates add column if not exists source text not null default 'dashboard';
alter table public.candidates add column if not exists source_ref text;
alter table public.candidates add column if not exists lili_outreach jsonb;

-- One candidate per inbound email message, per recruiter (makes repeated workflow runs harmless)
create unique index if not exists candidates_owner_source_ref_key
  on public.candidates (owner_id, source_ref) where source_ref is not null;

create index if not exists candidates_lili_pending_idx
  on public.candidates (created_at) where lili_score is null;

-- Roles a recruiter has open, so Lili can route an emailed application to the right one
create or replace function public.lili_list_roles(p_owner_email text)
returns jsonb
language sql
security definer
set search_path = public
as $$
  select coalesce(jsonb_agg(jsonb_build_object(
           'role_id', j.id,
           'title', j.title,
           'company', j.company,
           'min_years', j.min_exp,
           'must_haves', j.mandatory
         ) order by j.title), '[]'::jsonb)
  from public.job_roles j
  join auth.users u on u.id = j.owner_id
  where lower(u.email) = lower(p_owner_email);
$$;

-- Add an applicant received by email. Returns the candidate id (existing one if this message was already ingested).
create or replace function public.lili_ingest_application(
  p_owner_email text,
  p_role_id text,
  p_name text,
  p_email text,
  p_cv_text text,
  p_source_ref text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_owner uuid;
  v_id text;
  v_existing text;
begin
  select id into v_owner from auth.users where lower(email) = lower(p_owner_email);
  if v_owner is null then
    raise exception 'No recruiter account for %', p_owner_email;
  end if;
  if not exists (select 1 from public.job_roles where owner_id = v_owner and id = p_role_id) then
    raise exception 'Role % not found for %. Call lili_list_roles first.', p_role_id, p_owner_email;
  end if;
  if length(coalesce(p_cv_text, '')) < 80 then
    raise exception 'CV text too short to evaluate (% chars). Ask the applicant for a text-based PDF or DOCX.', length(coalesce(p_cv_text, ''));
  end if;

  select id into v_existing from public.candidates
   where owner_id = v_owner and source_ref = p_source_ref;
  if v_existing is not null then
    return jsonb_build_object('candidate_id', v_existing, 'already_ingested', true);
  end if;

  v_id := 'C-' || upper(substr(md5(random()::text || clock_timestamp()::text), 1, 5));

  insert into public.candidates (
    id, owner_id, role_id, anon_id, name, contact_email, score, tier, years,
    takeaway, status, cv_text, source, source_ref
  ) values (
    v_id, v_owner, p_role_id, v_id, left(coalesce(nullif(trim(p_name), ''), 'Email applicant'), 120),
    nullif(trim(p_email), ''), 0, 3, 0,
    'Applied by email. Lili is evaluating.', 'Received by email', left(p_cv_text, 60000), 'email', p_source_ref
  );

  return jsonb_build_object('candidate_id', v_id, 'already_ingested', false);
end;
$$;

-- Candidates Lili hasn't evaluated yet (oldest first), across all recruiters using the platform
create or replace function public.lili_pending_candidates(p_limit integer default 10)
returns jsonb
language sql
security definer
set search_path = public
as $$
  select coalesce(jsonb_agg(jsonb_build_object(
           'candidate_id', c.id,
           'name', c.name,
           'role_title', j.title,
           'source', c.source
         ) order by c.created_at), '[]'::jsonb)
  from (
    select * from public.candidates
     where lili_score is null
       and length(coalesce(cv_text, '')) >= 80
     order by created_at
     limit greatest(1, least(coalesce(p_limit, 10), 25))
  ) c
  left join public.job_roles j on j.id = c.role_id and j.owner_id = c.owner_id;
$$;

-- Record the email Lili drafted, so the dashboard shows it in the candidate's Outreach tab
create or replace function public.lili_record_outreach(
  p_id text,
  p_type text,
  p_subject text,
  p_body text,
  p_gmail_draft_id text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_found text;
begin
  if p_type not in ('invite', 'reject', 'hold') then
    raise exception 'p_type must be invite, reject or hold';
  end if;

  update public.candidates
     set email = left('Subject: ' || coalesce(p_subject, '') || E'\n\n' || coalesce(p_body, ''), 20000),
         status = case p_type
                    when 'invite' then 'Invite drafted by Lili'
                    when 'reject' then 'Feedback drafted by Lili'
                    else 'On bench (Lili)'
                  end,
         lili_outreach = jsonb_build_object('type', p_type, 'gmail_draft_id', p_gmail_draft_id, 'drafted_at', now())
   where id = p_id
  returning id into v_found;

  if v_found is null then
    raise exception 'Candidate % not found', p_id;
  end if;
  return jsonb_build_object('candidate_id', p_id, 'outreach', p_type);
end;
$$;

revoke all on function public.lili_list_roles(text) from public, anon, authenticated;
revoke all on function public.lili_ingest_application(text, text, text, text, text, text) from public, anon, authenticated;
revoke all on function public.lili_pending_candidates(integer) from public, anon, authenticated;
revoke all on function public.lili_record_outreach(text, text, text, text, text) from public, anon, authenticated;
grant execute on function public.lili_list_roles(text) to service_role;
grant execute on function public.lili_ingest_application(text, text, text, text, text, text) to service_role;
grant execute on function public.lili_pending_candidates(integer) to service_role;
grant execute on function public.lili_record_outreach(text, text, text, text, text) to service_role;
