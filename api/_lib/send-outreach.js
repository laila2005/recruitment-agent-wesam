// Sends the outreach email Lili recorded for a candidate, via Brevo, and marks the candidate as emailed.
// Server-side only (service_role). Files under api/_lib are not exposed as routes by Vercel.
//
// Env vars:
//   BREVO_API_KEY      Brevo API key (xkeysib-...). Required.
//   BREVO_SENDER       Verified Brevo sender address. Defaults to the recruiter address.
//   LILI_SEND_MODE     'demo' (default): every email goes to the recruiter's inbox, with the intended
//                      recipient in the subject. 'live': emails go to the candidate's own address.
//   LILI_OWNER_EMAIL   Recruiter address (default laila.mohamed.fikry@gmail.com)

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://ppjxzlepqstqvcrkqscz.supabase.co';
const RECRUITER_EMAIL = process.env.LILI_OWNER_EMAIL || 'laila.mohamed.fikry@gmail.com';
const EMAIL_RE = /^[^\s@<>"]+@[^\s@<>"]+\.[^\s@<>"]{2,}$/;

function serviceHeaders(extra = {}) {
  return {
    apikey: process.env.SUPABASE_SERVICE_ROLE_KEY,
    Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
    ...extra
  };
}

async function loadCandidate(id) {
  const url = `${SUPABASE_URL}/rest/v1/candidates?id=eq.${encodeURIComponent(id)}&select=id,name,contact_email,status,email,lili_outreach`;
  const res = await fetch(url, { headers: serviceHeaders() });
  if (!res.ok) throw new Error(`Database read failed (HTTP ${res.status})`);
  const rows = await res.json();
  if (!rows.length) throw new Error(`Candidate ${id} not found`);
  return rows[0];
}

// Outreach is stored either in `email` ("Subject: ...\n\nbody") or in lili_outreach {subject, body}
function outreachOf(c) {
  const o = c.lili_outreach || {};
  if (o.body) return { type: o.type, subject: o.subject || 'Application update', body: o.body };
  const m = (c.email || '').match(/^Subject:\s*([^\n]+)\n+([\s\S]*)$/i);
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
    })
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

export async function sendOutreach(id) {
  if (!process.env.BREVO_API_KEY) throw new Error('Email sending is not configured (BREVO_API_KEY missing on the server).');

  const c = await loadCandidate(id);
  if ((c.status || '').includes('Sent')) {
    return { candidate_id: id, already_sent: true, status: c.status };
  }
  const email = outreachOf(c);
  if (!email) throw new Error(`No outreach recorded for ${id}. Record it with /outreach first.`);
  if (email.type === 'hold') throw new Error(`${id} is on hold; there is nothing to send.`);

  const live = process.env.LILI_SEND_MODE === 'live';
  if (live && !EMAIL_RE.test(c.contact_email || '')) throw new Error(`${id} has no valid email address.`);
  const to = live ? c.contact_email.trim() : RECRUITER_EMAIL;
  const subject = live ? email.subject : `[Demo → ${c.contact_email || 'no address'}] ${email.subject}`;

  const messageId = await brevoSend({ to, subject, body: email.body.slice(0, 20000) });

  const isInvite = email.type === 'invite' || /interview|invit/i.test(email.subject);
  const status = isInvite ? 'Invite Sent ✉️' : 'Feedback Sent ✉️';
  const patch = await fetch(`${SUPABASE_URL}/rest/v1/candidates?id=eq.${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: serviceHeaders({ 'Content-Type': 'application/json', Prefer: 'return=minimal' }),
    body: JSON.stringify({
      status,
      lili_outreach: { ...(c.lili_outreach || {}), sent_at: new Date().toISOString(), sent_to: to, brevo_message_id: messageId, mode: live ? 'live' : 'demo' }
    })
  });
  if (!patch.ok) throw new Error(`Email sent, but saving the status failed (HTTP ${patch.status}).`);

  return { candidate_id: id, sent: true, mode: live ? 'live' : 'demo', to, status };
}
