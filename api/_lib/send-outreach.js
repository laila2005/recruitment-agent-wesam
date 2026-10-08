// Sends the outreach email Lili recorded for a candidate, via Brevo, and marks the candidate as emailed.
// Server-side only (service_role). Files under api/_lib are not exposed as routes by Vercel.
//
// Safety: the database claims the send atomically (lili_claim_send), so two runs can never email the
// same candidate twice, and rejections wait for the recruiter's "Approve & send" on the dashboard.
//
// Env vars:
//   BREVO_API_KEY       Brevo API key (xkeysib-...). Required.
//   BREVO_SENDER        Verified Brevo sender address. Defaults to the recruiter address.
//   LILI_SEND_MODE      'demo' (default): every email goes to the recruiter's inbox, with the intended
//                       recipient in the subject. 'live': emails go to the candidate's own address.
//   LILI_APPROVAL_MODE  'rejections' (default): rejections wait for the recruiter, invites auto-send.
//                       'all': every email waits. 'none': Lili sends everything.
//   LILI_OWNER_EMAIL    Recruiter address (default laila.mohamed.fikry@gmail.com)

import { callRpc, RECRUITER_EMAIL } from './supabase.js';

const EMAIL_RE = /^[^\s@<>"]+@[^\s@<>"]+\.[^\s@<>"]{2,}$/;
const APPROVAL_MODE = ['rejections', 'all', 'none'].includes(process.env.LILI_APPROVAL_MODE) ? process.env.LILI_APPROVAL_MODE : 'rejections';

// Outreach is stored in lili_outreach {subject, body} (migration 004) or in `email` ("Subject: ...\n\nbody")
function outreachOf(claim) {
  const o = claim.outreach || {};
  if (o.body) return { type: o.type, subject: o.subject || 'Application update', body: o.body };
  const m = (claim.email || '').match(/^Subject:\s*([^\n]+)\n+([\s\S]*)$/i);
  if (m) return { type: o.type, subject: m[1].trim(), body: m[2].trim() };
  return null;
}

async function brevoSend({ to, subject, body }) {
  const sender = process.env.BREVO_SENDER || RECRUITER_EMAIL;
  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: { 'api-key': process.env.BREVO_API_KEY, accept: 'application/json', 'content-type': 'application/json' },
    body: JSON.stringify({
      sender: { name: 'Laila Mohamed (via Lili)', email: sender },
      to: [{ email: to }],
      replyTo: { email: RECRUITER_EMAIL },
      subject,
      textContent: body
    }),
    signal: AbortSignal.timeout(15000)
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    let msg = data.message || `Brevo HTTP ${res.status}`;
    if (res.status === 401) msg = 'Brevo rejected the API key. Use an API key (xkeysib-...), not the SMTP key.';
    if (/sender/i.test(msg)) msg = `Sender ${sender} is not verified in Brevo (Senders, Domains & Dedicated IPs → Senders).`;
    throw new Error(msg);
  }
  return data.messageId;
}

// ownerId: set when a signed-in recruiter approves from the dashboard; otherwise Lili's recruiter (LILI_OWNER_EMAIL)
export async function sendOutreach(id, { ownerId = null } = {}) {
  if (!process.env.BREVO_API_KEY) throw new Error('Email sending is not configured (BREVO_API_KEY missing on the server).');

  const claim = await callRpc('lili_claim_send', {
    p_id: id,
    p_owner_email: ownerId ? null : RECRUITER_EMAIL,
    p_require_approval: APPROVAL_MODE,
    p_owner_id: ownerId
  });

  switch (claim && claim.state) {
    case 'already_sent':
      return { candidate_id: id, already_sent: true, status: claim.status };
    case 'awaiting_approval':
      return {
        candidate_id: id,
        awaiting_approval: true,
        status: 'Awaiting your approval (Lili)',
        message: 'Saved for the recruiter: rejections are sent only after they click "Approve & send" on the dashboard.'
      };
    case 'in_progress':
      return { candidate_id: id, in_progress: true, message: 'This email is already being sent. Do not retry.' };
    case 'hold':
      throw new Error(`${id} is on hold; there is nothing to send.`);
    case 'no_outreach':
      throw new Error(`No outreach recorded for ${id}. Record it with /outreach first.`);
    case 'claimed':
      break;
    default:
      throw new Error(`Unexpected send state for ${id}`);
  }

  const live = process.env.LILI_SEND_MODE === 'live';
  let to, email, messageId;
  try {
    email = outreachOf(claim);
    if (!email) throw new Error(`No email text recorded for ${id}.`);
    if (live && !EMAIL_RE.test(claim.contact_email || '')) throw new Error(`${id} has no valid email address.`);
    to = live ? claim.contact_email.trim() : RECRUITER_EMAIL;
    const subject = live ? email.subject : `[Demo → ${claim.contact_email || 'no address'}] ${email.subject}`;
    messageId = await brevoSend({ to, subject, body: email.body.slice(0, 20000) });
  } catch (err) {
    // Nothing was sent: release the claim so a later retry can send it (the error shows on the dashboard)
    await callRpc('lili_finish_send', { p_id: id, p_ok: false, p_error: err.message }).catch(() => {});
    throw err;
  }

  // Sent. If saving fails, the claim stays held, so nothing re-sends this email.
  const status = email.type === 'invite' ? 'Invite Sent ✉️' : 'Feedback Sent ✉️';
  try {
    await callRpc('lili_finish_send', {
      p_id: id, p_ok: true, p_status: status, p_sent_to: to, p_message_id: messageId || null, p_mode: live ? 'live' : 'demo'
    });
  } catch (err) {
    throw new Error(`Email sent to ${to}, but saving the status failed: ${err.message}. Do not resend.`);
  }
  return { candidate_id: id, sent: true, mode: live ? 'live' : 'demo', to, status };
}
