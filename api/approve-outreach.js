// Vercel Serverless Function: the recruiter's "Approve & send" for an email Lili drafted.
// Human in the loop: rejections Lili writes wait here until the recruiter approves (optionally edited).
//
//   POST /api/approve-outreach
//   Authorization: Bearer <the recruiter's Supabase access token>
//   { "id": "C-7K2QX", "subject": "optional edit", "body": "optional edit" }
//
// The token is checked with Supabase Auth, and the candidate must belong to that recruiter.

import { callRpc, SUPABASE_URL } from './_lib/supabase.js';
import { sendOutreach } from './_lib/send-outreach.js';

async function userFromToken(token) {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: { apikey: process.env.SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${token}` },
    signal: AbortSignal.timeout(10000)
  });
  if (!res.ok) return null;
  const user = await res.json().catch(() => null);
  return user && user.id ? user : null;
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, error: 'Use POST' });
  }
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return res.status(500).json({ ok: false, error: 'Server not configured: SUPABASE_SERVICE_ROLE_KEY missing' });
  }

  const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  const user = token ? await userFromToken(token) : null;
  if (!user) return res.status(401).json({ ok: false, error: 'Sign in again to approve emails.' });

  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch { body = {}; }
  }
  const id = String((body && body.id) || '').trim();
  if (!/^C-[A-Z0-9]{3,12}$/i.test(id)) return res.status(400).json({ ok: false, error: 'Missing or invalid candidate id' });

  try {
    await callRpc('lili_approve_outreach', {
      p_id: id,
      p_user_id: user.id,
      p_subject: body.subject ? String(body.subject).slice(0, 300) : null,
      p_body: body.body ? String(body.body).slice(0, 20000) : null
    });
    const data = await sendOutreach(id, { ownerId: user.id });
    console.log('approve-outreach', id, data.sent ? 'sent' : data.already_sent ? 'already_sent' : 'pending');
    return res.status(200).json({ ok: true, data });
  } catch (err) {
    return res.status(200).json({ ok: false, error: err.message });
  }
}
