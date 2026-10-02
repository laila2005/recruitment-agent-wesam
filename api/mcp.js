// Vercel Serverless Function: TalentScout ATS as an MCP server for Lili (Wesam.ai)
// Streamable HTTP transport, stateless JSON responses (MCP spec 2025-03-26 / 2025-06-18).
// Exposes six narrow recruiting tools backed by the lili_* SECURITY DEFINER functions in Supabase,
// so the agent never gets raw SQL or project-admin access.
//
// Env vars (Vercel → Project → Settings → Environment Variables):
//   SUPABASE_URL               https://ppjxzlepqstqvcrkqscz.supabase.co (defaulted below)
//   SUPABASE_SERVICE_ROLE_KEY  service_role key (server-side only; the only key allowed to call lili_*)
//   LILI_MCP_KEY               shared secret; Wesam connects with https://<app>/api/mcp?key=<LILI_MCP_KEY>

import { timingSafeEqual } from 'node:crypto';

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://ppjxzlepqstqvcrkqscz.supabase.co';
// The recruiter this key acts for is fixed server-side; the agent cannot choose another tenant
const RECRUITER_EMAIL = process.env.LILI_OWNER_EMAIL || 'laila.mohamed.fikry@gmail.com';
const SERVER_INFO = { name: 'talentscout-ats', version: '1.0.0' };
const SUPPORTED_VERSIONS = ['2025-06-18', '2025-03-26', '2024-11-05'];

const TOOLS = [
  {
    name: 'list_roles',
    rpc: 'lili_list_roles',
    description: "List the recruiter's open job roles (role_id, title, min_years, must_haves). Use it to route an emailed application to the right role.",
    // A non-empty properties object: some agent platforms reject parameterless OBJECT schemas
    inputSchema: {
      type: 'object',
      properties: { note: { type: 'string', description: 'Optional. Why you are listing roles (not used for filtering).' } }
    },
    args: () => ({ p_owner_email: RECRUITER_EMAIL })
  },
  {
    name: 'ingest_application',
    rpc: 'lili_ingest_application',
    description: 'Add a job applicant who applied by email to the pipeline. Idempotent: the same source_ref (Gmail message id) is never added twice. Returns candidate_id.',
    inputSchema: {
      type: 'object',
      required: ['role_id', 'name', 'cv_text', 'source_ref'],
      properties: {
        role_id: { type: 'string', description: 'role_id from list_roles' },
        name: { type: 'string', description: "Applicant's full name" },
        email: { type: 'string', description: "Applicant's email address" },
        cv_text: { type: 'string', description: 'Full plain-text CV (from the attachment or email body), at least 80 characters' },
        source_ref: { type: 'string', description: 'Gmail message id, used to avoid duplicates' }
      }
    },
    args: a => ({
      p_owner_email: RECRUITER_EMAIL,
      p_role_id: a.role_id,
      p_name: a.name,
      p_email: a.email || null,
      p_cv_text: a.cv_text,
      p_source_ref: a.source_ref
    })
  },
  {
    name: 'pending_candidates',
    rpc: 'lili_pending_candidates',
    description: 'List candidates waiting for Lili\'s evaluation (oldest first). Returns [] when there is nothing to do.',
    inputSchema: { type: 'object', properties: { limit: { type: 'integer', description: 'How many to return, 1-25. Use 10 if unsure.' } } },
    args: a => ({ p_limit: Math.min(Math.max(parseInt(a.limit, 10) || 10, 1), 25) })
  },
  {
    name: 'get_candidate',
    rpc: 'lili_get_candidate',
    description: "Get one candidate's CV text, the role's job description, must-haves, weights, minimum years, and the scoring rules (tiers and caps).",
    inputSchema: { type: 'object', required: ['candidate_id'], properties: { candidate_id: { type: 'string', description: 'e.g. C-7K2QX' } } },
    args: a => ({ p_id: a.candidate_id })
  },
  {
    name: 'submit_evaluation',
    rpc: 'lili_submit_evaluation',
    description: "Save Lili's evidence-cited evaluation. The tier is computed from the score (85+ Tier 1, 70-84 Tier 2, <70 Tier 3). Apply caps before submitting: under min years max 69; any missing must-have max 74. Updates the recruiter's dashboard live.",
    inputSchema: {
      type: 'object',
      required: ['candidate_id', 'score', 'summary'],
      properties: {
        candidate_id: { type: 'string' },
        score: { type: 'integer', description: 'Final score 0-100 after caps' },
        summary: { type: 'string', description: '1-2 sentence verdict and main reason' },
        strengths: { type: 'array', items: { type: 'string' }, description: 'Strengths, each with its CV source' },
        gaps: { type: 'array', items: { type: 'string' }, description: 'Gaps or verification questions' },
        evidence: {
          type: 'array',
          description: 'Claims with their CV source',
          items: {
            type: 'object',
            properties: {
              claim: { type: 'string', description: 'What the CV shows' },
              source: { type: 'string', description: 'Where, e.g. Resume, Experience section' }
            }
          }
        }
      }
    },
    args: a => ({
      p_id: a.candidate_id,
      p_score: Math.round(Number(a.score)),
      p_summary: a.summary,
      p_strengths: a.strengths || [],
      p_gaps: a.gaps || [],
      p_evidence: a.evidence || []
    })
  },
  {
    name: 'record_outreach',
    rpc: 'lili_record_outreach',
    description: 'Record the email Lili drafted for a candidate (invite, reject, or hold) so the dashboard shows it. Create the Gmail draft first; never send without the recruiter.',
    inputSchema: {
      type: 'object',
      required: ['candidate_id', 'type'],
      properties: {
        candidate_id: { type: 'string' },
        type: { type: 'string', description: 'One of: invite, reject, hold' },
        subject: { type: 'string' },
        body: { type: 'string' },
        gmail_draft_id: { type: 'string' }
      }
    },
    args: a => ({
      p_id: a.candidate_id,
      p_type: a.type,
      p_subject: a.subject || '',
      p_body: a.body || '',
      p_gmail_draft_id: a.gmail_draft_id || null
    })
  }
];

async function callRpc(fn, params) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${fn}`, {
    method: 'POST',
    headers: {
      apikey: process.env.SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(params)
  });
  const text = await res.text();
  let data;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }
  if (!res.ok) {
    const message = (data && data.message) || `Supabase HTTP ${res.status}`;
    throw new Error(message);
  }
  return data;
}

// Constant-time comparison so response timing doesn't leak how much of the key matched
function safeEqual(a, b) {
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
        instructions: 'TalentScout ATS for Lili. Typical run: list_roles → ingest_application (emailed CVs) → pending_candidates → get_candidate → submit_evaluation → record_outreach.'
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
        const data = await callRpc(tool.rpc, tool.args((msg.params && msg.params.arguments) || {}));
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
