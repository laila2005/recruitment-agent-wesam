// Vercel Serverless Function: Lili's ATS over plain GET URLs, for agents that can only "read a web page".
// Same tools and database functions as the MCP server (api/mcp.js), addressed as
//   GET /api/lili/<LILI_MCP_KEY>/<action>?param=value
// Actions: next, pending, candidate, github, submit, outreach, send, roles, ingest, help
// Writes over GET are deliberate (the agent's web reader only issues GETs); every write is idempotent
// or guarded in the database (caps, tier/outreach match, one send per candidate, approval for rejections).

import { callRpc, safeEqual, submitArgs, getCandidate, nextTask, verifyGithub } from '../../mcp.js';
import { sendOutreach } from '../../_lib/send-outreach.js';
import { RECRUITER_EMAIL } from '../../_lib/supabase.js';

const list = v => String(v || '').split('|').map(s => s.trim()).filter(Boolean);
// "claim::quote|claim::quote" → [{claim, quote}]
const pairs = (v, a, b, c) => list(v).map(item => {
  const [x, y, z] = item.split('::').map(s => (s || '').trim());
  return c ? { [a]: x, [b]: y, [c]: z } : { [a]: x, [b]: y };
});

const HELP = {
  usage: 'GET /api/lili/<key>/<action>?params. Responses are JSON. Add &t=<anything> to avoid caches. Lists use | between items and :: between fields.',
  actions: {
    next: 'Your next task. stage=evaluate: a candidate with CV text, role, scoring rules and github_username_in_cv. stage=outreach: a scored candidate still missing its email. {"done":true} when nothing is left.',
    candidate: 'One candidate packet. Params: id.',
    github: 'Verify the GitHub profile linked in the CV (repos, stars, languages, last push, claimed stars and repos) and save it to the dashboard. Params: id, user (optional). Missing profile = unverifiable, never a penalty.',
    submit: 'Save your evaluation. Params: id, tech, exp, impact, lead (each 0-100), years (years shown by dated roles), missing (must-haves not demonstrated, a|b, or "none"), summary, strengths (a|b), gaps (x|y), evidence (claim::verbatim quote|claim::quote), flags (type::detail|…; types: prompt_injection, claim_mismatch, possible_fabrication, missing_info, needs_review), claims (claim::finding::verified|mismatch|unverifiable). The server computes the weighted score, enforces the caps and tier, and returns them.',
    outreach: 'Record the email you wrote. Params: id, type (invite|reject|hold), subject, body. Must match the tier; refuses to overwrite a sent email.',
    send: 'Send the recorded email via Brevo. Params: id. Invites go out now; rejections return awaiting_approval until the recruiter approves them on the dashboard. Repeat-safe.',
    pending: 'List waiting candidates. Params: limit (1-25).',
    roles: 'Open roles for routing emailed applications.',
    ingest: 'Add an emailed applicant. Params: role_id, name, email, ref (Gmail message id), cv (CV text, max 6000 chars).'
  }
};

async function run(action, q) {
  switch (action) {
    case 'help':
      return HELP;
    case 'roles':
      return callRpc('lili_list_roles', { p_owner_email: RECRUITER_EMAIL });
    case 'pending':
      return callRpc('lili_pending_candidates', { p_limit: Math.min(Math.max(parseInt(q.limit, 10) || 10, 1), 25), p_owner_email: RECRUITER_EMAIL });
    case 'next':
      return nextTask();
    case 'candidate':
      if (!q.id) throw new Error('Missing id');
      return getCandidate(q.id);
    case 'github':
      if (!q.id) throw new Error('Missing id');
      return verifyGithub(q.id, q.user);
    case 'submit': {
      if (!q.id || !q.summary) throw new Error('Missing id or summary');
      const hasBreakdown = ['tech', 'exp', 'impact', 'lead'].some(k => q[k] !== undefined);
      const missing = q.missing === undefined ? undefined : /^\s*(none|-)?\s*$/i.test(q.missing) ? [] : list(q.missing);
      return callRpc('lili_submit_evaluation', submitArgs({
        candidate_id: q.id,
        score: q.score,
        breakdown: hasBreakdown ? { tech: q.tech, exp: q.exp, impact: q.impact, lead: q.lead } : null,
        years_evidenced: q.years,
        missing_must_haves: missing,
        summary: q.summary,
        strengths: list(q.strengths),
        gaps: list(q.gaps),
        evidence: pairs(q.evidence, 'claim', 'quote'),
        flags: pairs(q.flags, 'type', 'detail'),
        claim_checks: q.claims ? pairs(q.claims, 'claim', 'finding', 'status') : null
      }));
    }
    case 'outreach':
      if (!q.id || !q.type) throw new Error('Missing id or type');
      return callRpc('lili_record_outreach', {
        p_id: q.id, p_type: q.type, p_subject: q.subject || '', p_body: q.body || '', p_gmail_draft_id: null, p_owner_email: RECRUITER_EMAIL
      });
    case 'send':
      if (!q.id) throw new Error('Missing id');
      return sendOutreach(String(q.id));
    case 'ingest':
      if (!q.role_id || !q.name || !q.cv || !q.ref) throw new Error('Missing role_id, name, cv, or ref');
      return callRpc('lili_ingest_application', {
        p_owner_email: RECRUITER_EMAIL,
        p_role_id: q.role_id,
        p_name: q.name,
        p_email: q.email || null,
        p_cv_text: String(q.cv).slice(0, 6000),
        p_source_ref: q.ref
      });
    default:
      throw new Error(`Unknown action "${action}". Try /help.`);
  }
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  res.setHeader('X-Robots-Tag', 'noindex');

  const { key, action, ...params } = req.query;
  if (!process.env.LILI_MCP_KEY || !safeEqual(String(key || ''), process.env.LILI_MCP_KEY)) {
    console.warn('lili api unauthorized');
    return res.status(401).json({ error: 'Unauthorized' });
  }
  // GET only: HEAD prefetches/link previews must never trigger submit/outreach/ingest
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Use GET' });
  }

  console.log('lili api', action, params.id || '');
  try {
    const data = await run(String(action || 'help'), params);
    return res.status(200).json({ ok: true, action, data });
  } catch (err) {
    // 200 with ok:false so web readers still show the message to the agent
    return res.status(200).json({ ok: false, action, error: err.message });
  }
}
