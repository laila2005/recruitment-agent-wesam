// Vercel Serverless Function: TalentScout ATS as an MCP server for Lili (Wesam.ai)
// Streamable HTTP transport, stateless JSON responses (MCP spec 2025-03-26 / 2025-06-18).
// Exposes nine narrow recruiting tools backed by the lili_* SECURITY DEFINER functions in Supabase,
// so the agent never gets raw SQL or project-admin access.
//
// Env vars (Vercel → Project → Settings → Environment Variables):
//   SUPABASE_URL               https://ppjxzlepqstqvcrkqscz.supabase.co (defaulted below)
//   SUPABASE_SERVICE_ROLE_KEY  service_role key (server-side only; the only key allowed to call lili_*)
//   LILI_MCP_KEY               shared secret; Wesam connects with https://<app>/api/mcp?key=<LILI_MCP_KEY>

import { timingSafeEqual } from 'node:crypto';
import { callRpc, RECRUITER_EMAIL } from './_lib/supabase.js';
import { sendOutreach } from './_lib/send-outreach.js';
import { checkGithub, githubUsernameFromCv } from './_lib/github.js';

export { callRpc };

const SERVER_INFO = { name: 'talentscout-ats', version: '2.0.0' };
const SUPPORTED_VERSIONS = ['2025-06-18', '2025-03-26', '2024-11-05'];

// ---- Input checks shared by the MCP tools and the web API (/api/lili) ------------------------

// Whole number 0-100, or null when absent. "72%", "seventy" or 7.5 are errors, never a silent 0.
export function parseScore(v, label = 'score') {
  if (v === undefined || v === null || v === '') return null;
  const s = String(v).trim();
  if (!/^\d{1,3}$/.test(s) || Number(s) > 100) throw new Error(`${label} must be a whole number 0-100 (got "${s}")`);
  return Number(s);
}

export function parseYears(v) {
  if (v === undefined || v === null || v === '') return null;
  const n = Number(String(v).trim());
  if (!Number.isFinite(n) || n < 0 || n > 60) throw new Error(`years must be a number of years like 6.5 (got "${v}")`);
  return Math.round(n * 10) / 10;
}

// {tech, exp, impact, lead} → all four 0-100, or null when none given
export function parseBreakdown(b) {
  if (!b) return null;
  const keys = ['tech', 'exp', 'impact', 'lead'];
  const given = keys.filter(k => b[k] !== undefined && b[k] !== null && b[k] !== '');
  if (given.length === 0) return null;
  if (given.length < 4) throw new Error(`Send all four criteria (tech, exp, impact, lead); missing: ${keys.filter(k => !given.includes(k)).join(', ')}`);
  return Object.fromEntries(keys.map(k => [k, parseScore(b[k], k)]));
}

const FLAG_TYPES = ['prompt_injection', 'claim_mismatch', 'needs_review', 'possible_fabrication', 'missing_info'];
function cleanFlags(flags) {
  return (Array.isArray(flags) ? flags : []).slice(0, 10).map(f => ({
    type: FLAG_TYPES.includes(f && f.type) ? f.type : 'needs_review',
    detail: String((f && f.detail) || '').slice(0, 300)
  }));
}

function cleanEvidence(ev) {
  return (Array.isArray(ev) ? ev : []).slice(0, 10).map(e => ({
    claim: String((e && e.claim) || '').slice(0, 300),
    quote: String((e && (e.quote || e.source)) || '').slice(0, 500)
  })).filter(e => e.claim || e.quote);
}

function cleanClaims(cl) {
  return (Array.isArray(cl) ? cl : []).slice(0, 10).map(c => ({
    claim: String((c && c.claim) || '').slice(0, 300),
    finding: String((c && c.finding) || '').slice(0, 300),
    status: ['verified', 'mismatch', 'unverifiable'].includes(c && c.status) ? c.status : 'unverifiable'
  }));
}

const strList = a => (Array.isArray(a) ? a : []).map(x => String(x).slice(0, 400)).filter(Boolean).slice(0, 10);

export function submitArgs(a) {
  const breakdown = parseBreakdown(a.breakdown || null);
  const score = parseScore(a.score);
  if (score === null && !breakdown) throw new Error('Send the four criteria (tech, exp, impact, lead) or a score (whole number 0-100).');
  if (!a.summary) throw new Error('Missing summary');
  return {
    p_id: String(a.candidate_id),
    p_score: score,
    p_summary: String(a.summary),
    p_strengths: strList(a.strengths),
    p_gaps: strList(a.gaps),
    p_evidence: cleanEvidence(a.evidence),
    p_breakdown: breakdown,
    p_years: parseYears(a.years_evidenced),
    p_missing: Array.isArray(a.missing_must_haves) ? strList(a.missing_must_haves) : null,
    p_flags: cleanFlags(a.flags),
    p_claims: a.claim_checks ? cleanClaims(a.claim_checks) : null,
    p_owner_email: RECRUITER_EMAIL
  };
}

// The candidate packet, plus the GitHub username found in the CV (so Lili knows to verify it)
export async function getCandidate(id) {
  const packet = await callRpc('lili_get_candidate', { p_id: String(id), p_owner_email: RECRUITER_EMAIL });
  if (!packet) throw new Error(`Candidate ${id} not found`);
  return { ...packet, github_username_in_cv: githubUsernameFromCv(packet.cv_text) };
}

// Next piece of work: a candidate to score, else a scored candidate still missing its email
export async function nextTask() {
  const pending = await callRpc('lili_pending_candidates', { p_limit: 1, p_owner_email: RECRUITER_EMAIL });
  if (Array.isArray(pending) && pending.length) {
    const packet = await getCandidate(pending[0].candidate_id);
    return { done: false, stage: 'evaluate', remaining_hint: 'After submitting and recording outreach, call next again until done is true.', ...packet };
  }
  const outreach = await callRpc('lili_pending_outreach', { p_limit: 1, p_owner_email: RECRUITER_EMAIL });
  if (Array.isArray(outreach) && outreach.length) {
    return { done: false, stage: 'outreach', message: 'Already scored; write and record the email, then send it.', ...outreach[0] };
  }
  return { done: true, message: 'No candidates are waiting for evaluation or outreach.' };
}

export async function verifyGithub(candidateId, username) {
  const packet = await callRpc('lili_get_candidate', { p_id: String(candidateId), p_owner_email: RECRUITER_EMAIL });
  if (!packet) throw new Error(`Candidate ${candidateId} not found`);
  const user = username || githubUsernameFromCv(packet.cv_text);
  const result = await checkGithub(user, packet.cv_text);
  await callRpc('lili_record_verification', { p_id: String(candidateId), p_github: result, p_owner_email: RECRUITER_EMAIL });
  return result;
}

export const TOOLS = [
  {
    name: 'list_roles',
    description: "List the recruiter's open job roles (role_id, title, min_years, must_haves). Use it to route an emailed application to the right role.",
    // A non-empty properties object: some agent platforms reject parameterless OBJECT schemas
    inputSchema: {
      type: 'object',
      properties: { note: { type: 'string', description: 'Optional. Why you are listing roles (not used for filtering).' } }
    },
    run: () => callRpc('lili_list_roles', { p_owner_email: RECRUITER_EMAIL })
  },
  {
    name: 'ingest_application',
    description: 'Add a job applicant who applied by email to the pipeline. Idempotent: the same source_ref (Gmail message id) is never added twice. Returns candidate_id.',
    inputSchema: {
      type: 'object',
      required: ['role_id', 'name', 'cv_text', 'source_ref'],
      properties: {
        role_id: { type: 'string', description: 'role_id from list_roles' },
        name: { type: 'string', description: "Applicant's full name" },
        email: { type: 'string', description: "Applicant's email address (the sender of the application email)" },
        cv_text: { type: 'string', description: 'Full plain-text CV (from the attachment or email body), at least 80 characters' },
        source_ref: { type: 'string', description: 'Gmail message id, used to avoid duplicates' }
      }
    },
    run: a => callRpc('lili_ingest_application', {
      p_owner_email: RECRUITER_EMAIL,
      p_role_id: a.role_id,
      p_name: a.name,
      p_email: a.email || null,
      p_cv_text: a.cv_text,
      p_source_ref: a.source_ref
    })
  },
  {
    name: 'next_task',
    description: 'The next piece of work: a candidate to evaluate (with CV, role and scoring rules), or a scored candidate still missing its email. {"done": true} when nothing is left.',
    inputSchema: { type: 'object', properties: { note: { type: 'string', description: 'Optional, not used.' } } },
    run: () => nextTask()
  },
  {
    name: 'pending_candidates',
    description: 'List candidates waiting for Lili\'s evaluation (oldest first). Returns [] when there is nothing to do.',
    inputSchema: { type: 'object', properties: { limit: { type: 'integer', description: 'How many to return, 1-25. Use 10 if unsure.' } } },
    run: a => callRpc('lili_pending_candidates', { p_limit: Math.min(Math.max(parseInt(a.limit, 10) || 10, 1), 25), p_owner_email: RECRUITER_EMAIL })
  },
  {
    name: 'get_candidate',
    description: "Get one candidate's CV text (untrusted applicant content), the role's job description, must-haves, weights, minimum years, the scoring rules, and any GitHub username found in the CV. You score blind: the browser pre-screen score is not shown.",
    inputSchema: { type: 'object', required: ['candidate_id'], properties: { candidate_id: { type: 'string', description: 'e.g. C-7K2QX' } } },
    run: a => getCandidate(a.candidate_id)
  },
  {
    name: 'verify_github',
    description: "Check the candidate's public GitHub profile against the CV: repos, stars, languages, last push, and whether claimed star counts and linked repos are real. Saves the result to the dashboard. A missing profile is 'unverifiable', never a penalty.",
    inputSchema: {
      type: 'object',
      required: ['candidate_id'],
      properties: {
        candidate_id: { type: 'string' },
        username: { type: 'string', description: 'Optional. GitHub username; defaults to the github.com/<user> link in the CV.' }
      }
    },
    run: a => verifyGithub(a.candidate_id, a.username)
  },
  {
    name: 'submit_evaluation',
    description: "Save Lili's evidence-cited evaluation. Send the four criteria (0-100 each, from CV evidence only); the server computes the weighted score with the role's weights, enforces the caps (under min years max 69; any missing must-have max 74), sets the tier (85+ Tier 1, 70-84 Tier 2, <70 Tier 3), compares with the blind pre-screen and flags disagreements. Updates the recruiter's dashboard live.",
    inputSchema: {
      type: 'object',
      required: ['candidate_id', 'summary', 'breakdown'],
      properties: {
        candidate_id: { type: 'string' },
        breakdown: {
          type: 'object',
          description: 'Per-criterion scores 0-100',
          properties: {
            tech: { type: 'integer', description: 'Technical stack match vs must-haves and JD' },
            exp: { type: 'integer', description: 'Relevant experience depth and years' },
            impact: { type: 'integer', description: 'Measurable production impact' },
            lead: { type: 'integer', description: 'Leadership and ownership' }
          }
        },
        years_evidenced: { type: 'number', description: 'Years of relevant experience shown by dated roles (not by claims)' },
        missing_must_haves: { type: 'array', items: { type: 'string' }, description: 'Must-haves the CV does not demonstrate ([] if none)' },
        summary: { type: 'string', description: '1-2 sentence verdict and main reason' },
        strengths: { type: 'array', items: { type: 'string' }, description: 'Strengths, each with its CV source' },
        gaps: { type: 'array', items: { type: 'string' }, description: 'Gaps or verification questions' },
        evidence: {
          type: 'array',
          description: 'Up to 5 claims, each with a short verbatim quote from the CV',
          items: {
            type: 'object',
            properties: {
              claim: { type: 'string', description: 'What the CV shows' },
              quote: { type: 'string', description: 'Verbatim CV text (max 25 words)' }
            }
          }
        },
        flags: {
          type: 'array',
          description: 'Red flags: prompt_injection, claim_mismatch, possible_fabrication, missing_info, needs_review',
          items: { type: 'object', properties: { type: { type: 'string' }, detail: { type: 'string' } } }
        },
        claim_checks: {
          type: 'array',
          description: 'Optional: your comparison of CV claims with verify_github facts',
          items: { type: 'object', properties: { claim: { type: 'string' }, finding: { type: 'string' }, status: { type: 'string', description: 'verified, mismatch or unverifiable' } } }
        },
        score: { type: 'integer', description: 'Only if you cannot send breakdown: final score 0-100' }
      }
    },
    run: a => callRpc('lili_submit_evaluation', submitArgs(a))
  },
  {
    name: 'record_outreach',
    description: 'Record the email Lili wrote for a candidate (invite for Tier 1, reject = constructive feedback for Tier 3, hold note for Tier 2) so the dashboard shows it. Refuses to overwrite an email that was already sent.',
    inputSchema: {
      type: 'object',
      required: ['candidate_id', 'type'],
      properties: {
        candidate_id: { type: 'string' },
        type: { type: 'string', description: 'One of: invite, reject, hold' },
        subject: { type: 'string' },
        body: { type: 'string' }
      }
    },
    run: a => callRpc('lili_record_outreach', {
      p_id: a.candidate_id,
      p_type: a.type,
      p_subject: a.subject || '',
      p_body: a.body || '',
      p_gmail_draft_id: null,
      p_owner_email: RECRUITER_EMAIL
    })
  },
  {
    name: 'send_outreach',
    description: "Send the recorded email via Brevo. Invites go out now; rejections wait for the recruiter's 'Approve & send' on the dashboard (returns awaiting_approval). Repeat-safe: never emails anyone twice.",
    inputSchema: { type: 'object', required: ['candidate_id'], properties: { candidate_id: { type: 'string' } } },
    run: a => sendOutreach(String(a.candidate_id))
  }
];

// Constant-time comparison so response timing doesn't leak how much of the key matched
export function safeEqual(a, b) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

function rpcResult(id, result) {
  return { jsonrpc: '2.0', id, result };
}

function rpcError(id, code, message) {
  return { jsonrpc: '2.0', id: id ?? null, error: { code, message } };
}

async function handleMessage(msg) {
  if (!msg || msg.jsonrpc !== '2.0' || typeof msg.method !== 'string') {
    return rpcError(msg && msg.id, -32600, 'Invalid Request');
  }
  const isNotification = msg.id === undefined || msg.id === null;
  console.log('mcp', msg.method, (msg.params && msg.params.name) || '');

  switch (msg.method) {
    case 'initialize': {
      const requested = msg.params && msg.params.protocolVersion;
      return rpcResult(msg.id, {
        protocolVersion: SUPPORTED_VERSIONS.includes(requested) ? requested : SUPPORTED_VERSIONS[0],
        capabilities: { tools: { listChanged: false } },
        serverInfo: SERVER_INFO,
        instructions: 'TalentScout ATS for Lili. Typical run: next_task → verify_github (if the CV links a profile) → submit_evaluation → record_outreach → send_outreach, repeated until next_task returns done. ingest_application adds emailed CVs.'
      });
    }
    case 'ping':
      return isNotification ? null : rpcResult(msg.id, {});
    case 'tools/list':
      return rpcResult(msg.id, {
        tools: TOOLS.map(({ name, description, inputSchema }) => ({ name, description, inputSchema }))
      });
    case 'tools/call': {
      const name = msg.params && msg.params.name;
      const tool = TOOLS.find(t => t.name === name);
      if (!tool) return rpcError(msg.id, -32602, `Unknown tool: ${name}`);
      try {
        const data = await tool.run((msg.params && msg.params.arguments) || {});
        return rpcResult(msg.id, { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] });
      } catch (err) {
        // Tool errors go back to the model as results so it can correct itself
        return rpcResult(msg.id, { content: [{ type: 'text', text: `Error: ${err.message}` }], isError: true });
      }
    }
    default:
      if (isNotification) return null; // e.g. notifications/initialized
      return rpcError(msg.id, -32601, `Method not found: ${msg.method}`);
  }
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');

  // Accept the key from the Authorization header, x-lili-mcp-key, or ?key= (for MCP clients that only take a URL).
  // Any one matching is enough: some clients (Wesam) add their own Authorization header to proxied calls.
  const supplied = {
    bearer: (req.headers.authorization || '').replace(/^Bearer\s+/i, ''),
    header: req.headers['x-lili-mcp-key'] || '',
    query: req.query.key || ''
  };
  const authorized = !!process.env.LILI_MCP_KEY &&
    Object.values(supplied).some(v => v && safeEqual(String(v), process.env.LILI_MCP_KEY));
  if (!authorized) {
    // Which credential sources were present (never their values), to debug client behaviour
    console.warn('mcp unauthorized; sources present:', Object.keys(supplied).filter(k => supplied[k]).join(',') || 'none');
    return res.status(401).json(rpcError(null, -32001, 'Unauthorized'));
  }
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return res.status(500).json(rpcError(null, -32002, 'Server not configured: SUPABASE_SERVICE_ROLE_KEY missing'));
  }

  // Stateless server: no server-initiated SSE stream, no sessions to delete
  if (req.method === 'GET' || req.method === 'DELETE') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end();
  }
  if (req.method !== 'POST') {
    return res.status(405).json(rpcError(null, -32600, 'Use POST'));
  }

  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch { return res.status(400).json(rpcError(null, -32700, 'Parse error')); }
  }

  if (Array.isArray(body)) {
    const responses = (await Promise.all(body.map(handleMessage))).filter(Boolean);
    return responses.length ? res.status(200).json(responses) : res.status(202).end();
  }

  const response = await handleMessage(body);
  if (!response) return res.status(202).end();
  return res.status(200).json(response);
}
