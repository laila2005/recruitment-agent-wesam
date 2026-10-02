// Vercel Serverless Function: Autonomous / Transactional Email Dispatcher
// Providers (picked from the API key prefix):
//   Brevo  (xkeysib-...)  free 300 emails/day, sends from any single sender address you verify in Brevo
//   Resend (re_...)       free 3,000 emails/month, but needs a verified domain to email anyone but yourself
//
// Env vars (Vercel → Project → Settings → Environment Variables), all optional:
//   BREVO_API_KEY / RESEND_API_KEY  Server-side keys. Only used when the request carries the matching
//                                   LILI_DISPATCH_SECRET, otherwise this endpoint would be an open mail relay.
//   LILI_DISPATCH_SECRET            Shared secret sent by trusted callers in the X-Lili-Secret header.
//   BREVO_SENDER                    Verified Brevo sender address (defaults to the recruiter's fromEmail).
//   RESEND_FROM                     Sender on a Resend-verified domain, e.g. "Lili Recruiting <lili@yourdomain.com>".
//   ALLOWED_ORIGIN                  Extra origin allowed by CORS (same-origin calls never need CORS).

const EMAIL_RE = /^[^\s@<>"]+@[^\s@<>"]+\.[^\s@<>"]{2,}$/;
const MAX_SUBJECT = 300;
const MAX_BODY = 20000;

function clean(value) {
  return String(value || '').replace(/[\r\n<>"]/g, ' ').trim();
}

function validEmail(value) {
  return typeof value === 'string' && EMAIL_RE.test(value.trim());
}

async function sendWithBrevo({ key, to, subject, body, fromEmail, fromName }) {
  const senderEmail = process.env.BREVO_SENDER || (validEmail(fromEmail) ? fromEmail.trim() : null);
  if (!senderEmail) {
    return { ok: false, status: 400, error: 'Brevo needs a verified sender: set the Sender Email in Inbox settings (or BREVO_SENDER).' };
  }

  const apiResponse = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: { 'api-key': key, 'accept': 'application/json', 'content-type': 'application/json' },
    body: JSON.stringify({
      sender: { name: clean(fromName) || 'Lili Technical Recruiter', email: senderEmail },
      to: [{ email: to }],
      replyTo: { email: validEmail(fromEmail) ? fromEmail.trim() : senderEmail },
      subject,
      textContent: body
    })
  });
  const data = await apiResponse.json().catch(() => ({}));

  if (!apiResponse.ok) {
    let error = data.message || `Brevo API returned HTTP ${apiResponse.status}`;
    if (apiResponse.status === 401) error = 'Brevo rejected the key. Use an API key (xkeysib-...) from SMTP & API → API Keys, not the SMTP key.';
    if (/sender/i.test(error)) error = `Sender ${senderEmail} is not verified in Brevo. Add it under Senders, Domains & Dedicated IPs → Senders.`;
    return { ok: false, status: apiResponse.status, error };
  }
  return { ok: true, id: data.messageId };
}

async function sendWithResend({ key, to, subject, body, fromEmail, fromName }) {
  const from = process.env.RESEND_FROM || `${clean(fromName) || 'Lili Technical Recruiter'} <onboarding@resend.dev>`;
  const apiResponse = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from,
      to: [to],
      ...(validEmail(fromEmail) ? { reply_to: fromEmail.trim() } : {}),
      subject,
      text: body
    })
  });
  const data = await apiResponse.json().catch(() => ({}));

  if (!apiResponse.ok) {
    const testingOnly = apiResponse.status === 403 && !process.env.RESEND_FROM;
    return {
      ok: false,
      status: apiResponse.status,
      error: testingOnly
        ? 'Resend test sender can only email your own Resend account address. Verify a domain in Resend and set RESEND_FROM, or use a Brevo key.'
        : (data.message || `Resend API returned HTTP ${apiResponse.status}`)
    };
  }
  return { ok: true, id: data.id };
}

export default async function handler(req, res) {
  const origin = req.headers.origin;
  if (origin && process.env.ALLOWED_ORIGIN && origin === process.env.ALLOWED_ORIGIN) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Lili-Secret');
  }

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed. Use POST.' });
  }

  const { to, subject, body, apiKey, fromEmail, fromName } = req.body || {};

  if (!to || !subject || !body) {
    return res.status(400).json({ success: false, error: 'Missing required fields: to, subject, and body are required.' });
  }
  if (!validEmail(to)) {
    return res.status(400).json({ success: false, error: `Invalid recipient address: ${String(to).slice(0, 80)}` });
  }
  if (String(subject).length > MAX_SUBJECT || String(body).length > MAX_BODY) {
    return res.status(413).json({ success: false, error: 'Subject or body is too long.' });
  }

  const secretOk = process.env.LILI_DISPATCH_SECRET && req.headers['x-lili-secret'] === process.env.LILI_DISPATCH_SECRET;
  const key = apiKey || (secretOk ? (process.env.BREVO_API_KEY || process.env.RESEND_API_KEY) : null);

  if (!key) {
    return res.status(200).json({
      success: false,
      mode: 'fallback_gmail',
      error: 'No email API key provided. Use the 1-Click Gmail composer to send from your Google account.'
    });
  }
  if (String(key).startsWith('xsmtpsib-')) {
    return res.status(400).json({ success: false, error: 'That is a Brevo SMTP key. Create an API key (xkeysib-...) under SMTP & API → API Keys.' });
  }

  const provider = String(key).startsWith('xkeysib-') ? 'brevo' : 'resend';
  const message = { key, to: to.trim(), subject: String(subject), body: String(body), fromEmail, fromName };

  try {
    const result = provider === 'brevo' ? await sendWithBrevo(message) : await sendWithResend(message);
    if (!result.ok) {
      return res.status(result.status || 502).json({ success: false, mode: provider, error: result.error });
    }
    return res.status(200).json({
      success: true,
      mode: provider,
      id: result.id,
      message: `Email delivered to ${message.to}.`
    });
  } catch (err) {
    return res.status(502).json({
      success: false,
      mode: provider,
      error: `Failed to reach ${provider === 'brevo' ? 'Brevo' : 'Resend'}: ${err.message}`
    });
  }
}
