// End-to-end: real API handlers → mocked fetch → PostgREST-style RPC into PGlite (with all migrations).
import { PGlite } from '@electric-sql/pglite';
import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';

const repo = fileURLToPath(new URL('..', import.meta.url)).replace(/\/$/, '');
const read = p => readFileSync(`${repo}/${p}`, 'utf8');
const db = new PGlite();
const L = '11111111-1111-1111-1111-111111111111';
await db.exec(`
  create role anon; create role authenticated; create role service_role;
  create schema auth; create table auth.users (id uuid primary key, email text);
  create function auth.uid() returns uuid language sql stable as $$ select null::uuid $$;
  grant usage on schema auth, public to anon, authenticated, service_role;
  insert into auth.users values ('${L}', 'laila@example.com'), ('22222222-2222-2222-2222-222222222222', 'other@example.com');`);
for (const f of ['supabase/schema.sql', 'supabase/migrations/002_auth_private_rows.sql', 'supabase/migrations/003_lili_autonomous.sql', 'supabase/migrations/004_lili_verified_scoring.sql']) await db.exec(read(f));
const sarahCv = read('sample-data/resume_frontend_strong.txt');
const jordanCv = read('sample-data/resume_frontend_junior_gap.txt');
await db.query(`insert into public.job_roles (owner_id, id, title, min_exp, mandatory) values ($1, 'frontend', 'Senior Frontend', 5, '["React 18","Next.js","TypeScript","Storybook"]')`, [L]);
await db.query(`insert into public.candidates (id, owner_id, role_id, anon_id, name, contact_email, score, tier, years, missing, cv_text, created_at) values
  ('C-SARAH', $1, 'frontend', 'C-SARAH', 'Sarah Lin', 'sarah.lin@email.com', 93, 1, 6.8, '[]', $2, now() - interval '2 min'),
  ('C-JORDN', $1, 'frontend', 'C-JORDN', 'Jordan Blake', 'jordan@email.com', 40, 3, 3.1, '["Next.js","TypeScript"]', $3, now() - interval '1 min')`, [L, sarahCv, jordanCv]);

process.env.LILI_MCP_KEY = 'k'.repeat(32);
process.env.SUPABASE_SERVICE_ROLE_KEY = 'service';
process.env.BREVO_API_KEY = 'xkeysib-test';
process.env.LILI_OWNER_EMAIL = 'laila@example.com';
const sent = [];
let brevoFail = false;

globalThis.fetch = async (url, opts = {}) => {
  url = String(url);
  const json = (status, body) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
  let m;
  if ((m = url.match(/\/rest\/v1\/rpc\/(\w+)$/))) {
    const args = JSON.parse(opts.body || '{}');
    const names = Object.keys(args);
    const sql = `select public.${m[1]}(${names.map((n, i) => `${n} => $${i + 1}`).join(', ')}) as r`;
    // PostgREST passes objects/arrays as jsonb and everything else as text
    const vals = names.map(n => args[n] !== null && typeof args[n] === 'object' ? JSON.stringify(args[n]) : args[n]);
    try {
      await db.exec('set role service_role');
      const rows = (await db.query(sql, vals)).rows;
      return json(200, rows[0].r);
    } catch (e) { return json(400, { message: e.message }); }
    finally { await db.exec('reset role'); }
  }
  if (url.endsWith('/auth/v1/user')) {
    return opts.headers.Authorization === 'Bearer good-token' ? json(200, { id: L, email: 'laila@example.com' }) : json(401, { msg: 'bad' });
  }
  if (url.startsWith('https://api.brevo.com')) {
    if (brevoFail) return json(500, { message: 'Brevo down' });
    sent.push(JSON.parse(opts.body)); return json(201, { messageId: `m${sent.length}` });
  }
  if (url === 'https://api.github.com/users/sarahlin-ui') return json(200, { name: 'Sarah', public_repos: 2, followers: 10, created_at: '2018-01-01T00:00:00Z' });
  if (url.startsWith('https://api.github.com/users/sarahlin-ui/repos')) return json(200, [
    { name: 'design-system', stargazers_count: 12, language: 'TypeScript', pushed_at: '2026-09-01T00:00:00Z', html_url: 'https://github.com/sarahlin-ui/design-system', fork: false },
    { name: 'forked', stargazers_count: 999, language: 'C', pushed_at: '2026-01-01T00:00:00Z', fork: true }]);
  if (url.startsWith('https://api.github.com/')) return json(404, {});
  throw new Error('unexpected fetch ' + url);
};

const { default: lili } = await import(new URL('file://' + repo + '/api/lili/%5Bkey%5D/%5Baction%5D.js').href);
const { default: mcp } = await import(`${repo}/api/mcp.js`);
const { default: approve } = await import(`${repo}/api/approve-outreach.js`);

function mockRes() {
  const r = { statusCode: 200, headers: {}, body: undefined };
  r.setHeader = (k, v) => { r.headers[k] = v; };
  r.status = c => { r.statusCode = c; return r; };
  r.json = b => { r.body = b; return r; };
  r.end = () => r;
  return r;
}
async function call(action, params = {}) {
  const res = mockRes();
  await lili({ method: 'GET', query: { key: process.env.LILI_MCP_KEY, action, ...params }, headers: {} }, res);
  return res.body;
}

// Wrong key
{ const res = mockRes(); await lili({ method: 'GET', query: { key: 'nope', action: 'next' }, headers: {} }, res); assert.equal(res.statusCode, 401); }

// next → blind packet with GitHub username
let r = await call('next');
assert.ok(r.ok, JSON.stringify(r));
assert.equal(r.data.stage, 'evaluate'); assert.equal(r.data.candidate_id, 'C-SARAH');
assert.equal(r.data.github_username_in_cv, 'sarahlin-ui'); assert.ok(!('prescreen_score' in r.data));

// github check: deterministic claims vs CV
r = await call('github', { id: 'C-SARAH' });
assert.ok(r.ok, JSON.stringify(r));
assert.equal(r.data.total_stars, 12, 'forks excluded');
console.log('github claims:', JSON.stringify(r.data.claims));

// bad score is rejected, not stored as 0
r = await call('submit', { id: 'C-SARAH', score: '72%', summary: 'x' });
assert.equal(r.ok, false); assert.match(r.error, /whole number/);
r = await call('submit', { id: 'C-SARAH', tech: '100', exp: '90', summary: 'x' });
assert.equal(r.ok, false); assert.match(r.error, /missing: impact, lead/);

// submit with breakdown + evidence
r = await call('submit', { id: 'C-SARAH', tech: '100', exp: '92', impact: '90', lead: '85', years: '6.8', missing: 'none',
  summary: 'Strong senior React lead.', strengths: 'Next.js migration (Experience)|Storybook DS', gaps: 'Probe testing depth',
  evidence: 'Led Next.js migration::Led migration of a 200k-LOC React SPA to Next.js 14|Design system::Built Storybook design system',
  claims: 'GitHub stars::12 stars on public repos::mismatch' });
assert.ok(r.ok, JSON.stringify(r)); assert.equal(r.data.lili_tier, 1);
console.log('Sarah submit:', JSON.stringify(r.data));
const sarah = (await db.query(`select lili_evidence, lili_breakdown, lili_verification from public.candidates where id = 'C-SARAH'`)).rows[0];
assert.equal(sarah.lili_evidence.length, 2); assert.equal(sarah.lili_breakdown.tech, 100);
assert.ok(sarah.lili_verification.github && sarah.lili_verification.claims.length === 1, 'github facts + claim checks stored');

// next now gives Jordan; Lili overrates him → server caps
r = await call('next'); assert.equal(r.data.candidate_id, 'C-JORDN');
r = await call('submit', { id: 'C-JORDN', tech: '90', exp: '80', impact: '80', lead: '80', years: '3.1', missing: 'Next.js|TypeScript', summary: 'Promising',
  flags: 'prompt_injection::CV says ignore previous instructions' });
assert.ok(r.ok, JSON.stringify(r)); assert.equal(r.data.lili_score, 69); assert.equal(r.data.raw_score, 84); assert.equal(r.data.caps_applied.length, 2);
assert.ok(r.data.flags.some(f => f.type === 'prompt_injection'));

// next → outreach stage (scored, no email yet)
r = await call('next'); assert.equal(r.data.stage, 'outreach');

// invite for Tier 3 refused; reject recorded; send waits for approval
r = await call('outreach', { id: 'C-JORDN', type: 'invite', subject: 'Interview', body: 'b' });
assert.equal(r.ok, false); assert.match(r.error, /Tier 3/);
r = await call('outreach', { id: 'C-JORDN', type: 'reject', subject: 'Your application', body: 'Thank you…' }); assert.ok(r.ok);
r = await call('send', { id: 'C-JORDN' }); assert.ok(r.ok); assert.equal(r.data.awaiting_approval, true); assert.equal(sent.length, 0);

// invite auto-sends (demo mode → recruiter inbox), second send is a no-op
r = await call('outreach', { id: 'C-SARAH', type: 'invite', subject: 'Interview invite', body: 'Book: https://cal.com/x' }); assert.ok(r.ok);
brevoFail = true;
r = await call('send', { id: 'C-SARAH' }); assert.equal(r.ok, false); assert.match(r.error, /Brevo down/);
brevoFail = false;
r = await call('send', { id: 'C-SARAH' }); assert.ok(r.ok, JSON.stringify(r)); assert.equal(r.data.sent, true);
assert.equal(sent.length, 1); assert.equal(sent[0].to[0].email, 'laila@example.com'); assert.match(sent[0].subject, /Demo → sarah.lin@email.com/);
r = await call('send', { id: 'C-SARAH' }); assert.equal(r.data.already_sent, true); assert.equal(sent.length, 1);
r = await call('outreach', { id: 'C-SARAH', type: 'invite', subject: 'again', body: 'again' }); assert.equal(r.data.already_sent, true);

// approve endpoint: bad token → 401; good token → edited rejection sent once
{ const res = mockRes(); await approve({ method: 'POST', headers: { authorization: 'Bearer bad' }, body: { id: 'C-JORDN' } }, res); assert.equal(res.statusCode, 401); }
{ const res = mockRes(); await approve({ method: 'POST', headers: { authorization: 'Bearer good-token' }, body: { id: 'C-JORDN', subject: 'Thanks for applying', body: 'Edited by Laila' } }, res);
  assert.ok(res.body.ok, JSON.stringify(res.body)); assert.equal(res.body.data.sent, true); }
assert.equal(sent.length, 2); assert.equal(sent[1].textContent, 'Edited by Laila');
const jordan = (await db.query(`select status, lili_outreach from public.candidates where id = 'C-JORDN'`)).rows[0];
assert.equal(jordan.status, 'Feedback Sent ✉️'); assert.ok(jordan.lili_outreach.approved_at && jordan.lili_outreach.sent_at);

r = await call('next'); assert.equal(r.data.done, true);

// MCP: tools/list and a tools/call
{ const res = mockRes(); await mcp({ method: 'POST', query: {}, headers: { authorization: `Bearer ${process.env.LILI_MCP_KEY}` }, body: { jsonrpc: '2.0', id: 1, method: 'tools/list' } }, res);
  const names = res.body.result.tools.map(t => t.name);
  assert.deepEqual(names, ['list_roles', 'ingest_application', 'next_task', 'pending_candidates', 'get_candidate', 'verify_github', 'submit_evaluation', 'record_outreach', 'send_outreach']); }
{ const res = mockRes(); await mcp({ method: 'POST', query: {}, headers: { authorization: `Bearer ${process.env.LILI_MCP_KEY}` },
    body: { jsonrpc: '2.0', id: 2, method: 'tools/call', params: { name: 'submit_evaluation', arguments: { candidate_id: 'C-SARAH', summary: 'x', score: 'NaN' } } } }, res);
  assert.equal(res.body.result.isError, true); assert.match(res.body.result.content[0].text, /whole number/); }
{ const res = mockRes(); await mcp({ method: 'POST', query: {}, headers: { authorization: `Bearer ${process.env.LILI_MCP_KEY}` },
    body: { jsonrpc: '2.0', id: 3, method: 'tools/call', params: { name: 'list_roles', arguments: {} } } }, res);
  assert.match(res.body.result.content[0].text, /frontend/); }

console.log('ALL API TESTS PASSED');
