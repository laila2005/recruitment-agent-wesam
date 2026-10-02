// Vercel Serverless Function: Lili's ATS over plain GET URLs, for agents that can only "read a web page".
// Same six tools and database functions as the MCP server (api/mcp.js), addressed as
//   GET /api/lili/<LILI_MCP_KEY>/<action>?param=value
// Actions: next, pending, candidate, submit, outreach, roles, ingest, help
// Writes over GET are deliberate (the agent's web reader only issues GETs); every write is idempotent.

import { TOOLS, callRpc, safeEqual } from '../../mcp.js';

const tool = name => TOOLS.find(t => t.name === name);
const list = v => String(v || '').split('|').map(s => s.trim()).filter(Boolean);

const HELP = {
  usage: 'GET /api/lili/<key>/<action>?params. Responses are JSON. Add &t=<anything> to avoid caches.',
  actions: {
    next: 'The oldest candidate waiting for evaluation, with CV text, role, and scoring rules. {"done":true} when nothing is pending.',
    pending: 'List waiting candidates. Params: limit (1-25).',
    candidate: 'One candidate packet. Params: id.',
    submit: 'Save your evaluation. Params: id, score (0-100 after caps), summary, strengths (items separated by |), gaps (items separated by |).',
    outreach: 'Record the Gmail draft you created. Params: id, type (invite|reject|hold), subject, body, draft_id.',
    roles: 'Open roles for routing emailed applications.',
    ingest: 'Add an emailed applicant. Params: role_id, name, email, ref (Gmail message id), cv (CV text, max 4000 chars).'
  }
};

async function run(action, q) {
  switch (action) {
    case 'help':
      return HELP;
    case 'roles':
      return callRpc('lili_list_roles', tool('list_roles').args({}));
    case 'pending':
      return callRpc('lili_pending_candidates', tool('pending_candidates').args({ limit: q.limit }));
    case 'next': {
      const pending = await callRpc('lili_pending_candidates', { p_limit: 1 });
      if (!Array.isArray(pending) || pending.length === 0) return { done: true, message: 'No candidates are waiting for evaluation.' };
      const packet = await callRpc('lili_get_candidate', { p_id: pending[0].candidate_id });
      return { done: false, remaining_hint: 'After submitting, call next again until done is true.', ...packet };
    }
    case 'candidate':
      if (!q.id) throw new Error('Missing id');
      return callRpc('lili_get_candidate', tool('get_candidate').args({ candidate_id: q.id }));
    case 'submit':
      if (!q.id || q.score === undefined || !q.summary) throw new Error('Missing id, score, or summary');
      return callRpc('lili_submit_evaluation', tool('submit_evaluation').args({
        candidate_id: q.id,
        score: q.score,
        summary: q.summary,
        strengths: list(q.strengths),
        gaps: list(q.gaps),
        evidence: []
      }));
    case 'outreach':
      if (!q.id || !q.type) throw new Error('Missing id or type');
      return callRpc('lili_record_outreach', tool('record_outreach').args({
        candidate_id: q.id, type: q.type, subject: q.subject, body: q.body, gmail_draft_id: q.draft_id
      }));
    case 'ingest':
      if (!q.role_id || !q.name || !q.cv || !q.ref) throw new Error('Missing role_id, name, cv, or ref');
      return callRpc('lili_ingest_application', tool('ingest_application').args({
        role_id: q.role_id, name: q.name, email: q.email, cv_text: String(q.cv).slice(0, 4000), source_ref: q.ref
      }));
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
