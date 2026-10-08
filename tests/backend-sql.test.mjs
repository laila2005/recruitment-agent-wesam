// Runs schema.sql + 002 + 003 + 004 (twice, to prove re-runnable) on PGlite with Supabase stubs, then exercises Lili's functions.
import { PGlite } from '@electric-sql/pglite';
import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';

const repo = fileURLToPath(new URL('..', import.meta.url)).replace(/\/$/, '');
const read = p => readFileSync(`${repo}/${p}`, 'utf8');
const db = new PGlite();

await db.exec(`
  create role anon; create role authenticated; create role service_role;
  create schema auth;
  create table auth.users (id uuid primary key, email text);
  create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('test.uid', true), '')::uuid $$;
  grant usage on schema auth to anon, authenticated, service_role;
  grant usage on schema public to anon, authenticated, service_role;
  grant execute on function auth.uid() to anon, authenticated, service_role;
  insert into auth.users values ('11111111-1111-1111-1111-111111111111', 'laila@example.com'),
                                ('22222222-2222-2222-2222-222222222222', 'judge@example.com');
`);

for (const f of ['supabase/schema.sql', 'supabase/migrations/002_auth_private_rows.sql', 'supabase/migrations/003_lili_autonomous.sql',
                 'supabase/migrations/004_lili_verified_scoring.sql', 'supabase/migrations/004_lili_verified_scoring.sql']) {
  try { await db.exec(read(f)); console.log('ran', f); }
  catch (e) { console.error('FAILED', f, e.message); process.exit(1); }
}
await db.exec(`grant select, insert, update, delete on public.candidates, public.job_roles to service_role;`);

const L = '11111111-1111-1111-1111-111111111111', J = '22222222-2222-2222-2222-222222222222';
await db.exec(`
  insert into public.job_roles (owner_id, id, title, min_exp, mandatory, weights) values
   ('${L}', 'frontend', 'Senior Frontend', 5, '["React 18","Next.js","TypeScript","Storybook"]', '{"tech":40,"exp":25,"impact":20,"lead":15}'),
   ('${J}', 'frontend', 'Judge role', 5, '[]', '{"tech":40,"exp":25,"impact":20,"lead":15}');
  insert into public.candidates (id, owner_id, role_id, anon_id, name, score, tier, years, missing, cv_text, created_at) values
   ('C-SARAH', '${L}', 'frontend', 'C-SARAH', 'Sarah', 93, 1, 6.8, '[]', repeat('sarah cv ', 20), now() - interval '3 min'),
   ('C-JORDN', '${L}', 'frontend', 'C-JORDN', 'Jordan', 40, 3, 3.1, '["Next.js","TypeScript"]', repeat('jordan cv ', 20), now() - interval '2 min'),
   ('C-JUDGE', '${J}', 'frontend', 'C-JUDGE', 'Judge cand', 50, 3, 2, '[]', repeat('judge cv ', 20), now() - interval '4 min');
`);

const q = async (sql, params = []) => (await db.query(sql, params)).rows;
const one = async (sql, params = []) => Object.values((await q(sql, params))[0])[0];
const asService = async fn => { await db.exec('set role service_role'); try { return await fn(); } finally { await db.exec('reset role'); } };
const OWNER = 'laila@example.com';

// Owner scoping
const pending = await asService(() => one(`select public.lili_pending_candidates(10, $1)`, [OWNER]));
assert.deepEqual(pending.map(p => p.candidate_id), ['C-SARAH', 'C-JORDN'], 'judge candidate must not appear in Laila\'s queue');
const legacyAll = await asService(() => one(`select public.lili_pending_candidates(10)`));
assert.equal(legacyAll.length, 3, 'old call (no owner) still works');
const packet = await asService(() => one(`select public.lili_get_candidate('C-SARAH', $1)`, [OWNER]));
assert.ok(!('prescreen_score' in packet) && packet.role.min_years == 5, 'packet is blind and has the role');
assert.equal(await asService(() => one(`select public.lili_get_candidate('C-JUDGE', $1)`, [OWNER])), null, 'cannot read other tenant');

// Breakdown → server-weighted score, no caps
let r = await asService(() => one(`select public.lili_submit_evaluation(p_id => 'C-SARAH', p_summary => 'Strong', p_breakdown => '{"tech":100,"exp":90,"impact":90,"lead":90}', p_years => 6.8, p_missing => '[]', p_evidence => '[{"claim":"Led migration","quote":"Led Next.js migration"}]', p_owner_email => $1)`, [OWNER]));
assert.equal(r.lili_score, 94); assert.equal(r.lili_tier, 1); assert.equal(r.caps_applied.length, 0);
console.log('Sarah', r);

// Lili tries to give Jordan 88 with no facts → prescreen fallback caps at 69 (years) and 74 (missing): final 69, Tier 3
r = await asService(() => one(`select public.lili_submit_evaluation(p_id => 'C-JORDN', p_score => 88, p_summary => 'x', p_owner_email => $1)`, [OWNER]));
assert.equal(r.lili_score, 69); assert.equal(r.raw_score, 88); assert.equal(r.lili_tier, 3); assert.equal(r.caps_applied.length, 2);
assert.ok(!r.flags.some(f => f.type === 'disagreement'), 'same tier and < 30 apart (69 vs 40): no human review needed');

// A blind score that changes the decision (pre-screen Tier 1 → Lili Tier 3) is flagged for a human
await db.exec(`insert into public.candidates (id, owner_id, role_id, anon_id, name, score, tier, years, missing, cv_text)
  values ('C-DISAG', '${L}', 'frontend', 'C-DISAG', 'Disagree', 90, 1, 7, '[]', repeat('x cv ', 30))`);
r = await asService(() => one(`select public.lili_submit_evaluation(p_id => 'C-DISAG', p_score => 60, p_summary => 'x', p_years => 7, p_missing => '[]', p_owner_email => $1)`, [OWNER]));
assert.ok(r.flags.some(f => f.type === 'disagreement' && /Tier 3/.test(f.detail)), 'different tier → disagreement flagged');
console.log('Jordan', JSON.stringify(r));

// Null / bad score is rejected, not turned into 0
await assert.rejects(asService(() => one(`select public.lili_submit_evaluation(p_id => 'C-JORDN', p_score => null, p_summary => 'x', p_owner_email => $1)`, [OWNER])), /score/);
// Can't submit for another tenant
await assert.rejects(asService(() => one(`select public.lili_submit_evaluation(p_id => 'C-JUDGE', p_score => 50, p_summary => 'x', p_owner_email => $1)`, [OWNER])), /not found/);
// Legacy positional-style call (old API) still works
r = await asService(() => one(`select public.lili_submit_evaluation(p_id => 'C-JUDGE', p_score => 72, p_summary => 'legacy', p_strengths => '[]', p_gaps => '[]', p_evidence => '[]')`));
assert.equal(r.lili_score, 69, 'legacy call: judge 2 yrs < 5 → capped by prescreen fallback');

// Outreach: tier guard, approval gate, atomic send, no double send
await assert.rejects(asService(() => one(`select public.lili_record_outreach('C-JORDN', 'invite', 's', 'b', null, $1)`, [OWNER])), /Tier 3/);
await asService(() => one(`select public.lili_record_outreach('C-JORDN', 'reject', 'Your application', 'Thanks…', null, $1)`, [OWNER]));
let claim = await asService(() => one(`select public.lili_claim_send('C-JORDN', $1)`, [OWNER]));
assert.equal(claim.state, 'awaiting_approval');
assert.equal(await one(`select status from public.candidates where id = 'C-JORDN'`), 'Awaiting your approval (Lili)');
await assert.rejects(asService(() => one(`select public.lili_approve_outreach('C-JORDN', $1::uuid, null, null)`, [J])), /not found/, 'other user cannot approve');
await asService(() => one(`select public.lili_approve_outreach('C-JORDN', $1::uuid, 'Edited subject', 'Edited body')`, [L]));
claim = await asService(() => one(`select public.lili_claim_send('C-JORDN', null, 'rejections', $1::uuid)`, [L]));
assert.equal(claim.state, 'claimed'); assert.equal(claim.outreach.body, 'Edited body');
const second = await asService(() => one(`select public.lili_claim_send('C-JORDN', $1)`, [OWNER]));
assert.equal(second.state, 'in_progress', 'concurrent send blocked');
await asService(() => one(`select public.lili_finish_send('C-JORDN', true, 'Feedback Sent ✉️', 'laila@example.com', 'm1', 'demo')`));
assert.equal((await asService(() => one(`select public.lili_claim_send('C-JORDN', $1)`, [OWNER]))).state, 'already_sent');
const rerecord = await asService(() => one(`select public.lili_record_outreach('C-JORDN', 'reject', 'again', 'again', null, $1)`, [OWNER]));
assert.equal(rerecord.already_sent, true, 're-recording after send is refused → no double email');

// Invite auto-sends (no approval needed)
await asService(() => one(`select public.lili_record_outreach('C-SARAH', 'invite', 'Interview', 'Book here', null, $1)`, [OWNER]));
assert.equal((await asService(() => one(`select public.lili_claim_send('C-SARAH', $1)`, [OWNER]))).state, 'claimed');
await asService(() => one(`select public.lili_finish_send('C-SARAH', false, null, null, null, null, 'Brevo down')`));
assert.equal((await asService(() => one(`select public.lili_claim_send('C-SARAH', $1)`, [OWNER]))).state, 'claimed', 'failed send can be retried');

// Browser (authenticated) can't forge lili_* or roll back a sent status
await db.exec(`set test.uid = '${L}'; set role authenticated;`);
await db.exec(`update public.candidates set lili_score = 100, lili_tier = 1, status = 'Feedback drafted by Lili', name = 'Jordan B' where id = 'C-JORDN'`);
await db.exec(`insert into public.candidates (id, owner_id, role_id, anon_id, name, lili_score) values ('C-FORGE', '${L}', 'frontend', 'C-FORGE', 'Forged', 99)`);
await assert.rejects(db.query(`select public.lili_submit_evaluation(p_id => 'C-SARAH', p_score => 1, p_summary => 'x')`), /permission denied/);
await db.exec('reset role');
const jordan = (await q(`select name, lili_score, status from public.candidates where id = 'C-JORDN'`))[0];
assert.deepEqual(jordan, { name: 'Jordan B', lili_score: 69, status: 'Feedback Sent ✉️' });
assert.equal(await one(`select lili_score from public.candidates where id = 'C-FORGE'`), null);

// Pending outreach (scored, nothing recorded)
await asService(() => one(`select public.lili_record_verification('C-JUDGE', '{"username":"x"}', null)`));
const po = await asService(() => one(`select public.lili_pending_outreach(10, null)`));
assert.deepEqual(po.map(p => p.candidate_id).sort(), ['C-DISAG', 'C-JUDGE']);

console.log('ALL SQL TESTS PASSED');
