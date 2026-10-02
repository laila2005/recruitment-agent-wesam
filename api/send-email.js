// Vercel Serverless Function: Autonomous / Transactional Email Dispatcher
// Free-tier compatible with Resend API (3,000 free emails/month) or custom SMTP webhooks

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  const { to, subject, body, apiKey, fromEmail, fromName } = req.body || {};

  if (!to || !subject || !body) {
    return res.status(400).json({ error: 'Missing required fields: to, subject, and body are required.' });
  }

  const key = apiKey || process.env.RESEND_API_KEY;

  if (!key) {
    return res.status(200).json({
      success: false,
      mode: 'fallback_gmail',
      message: 'No Resend API Key provided. Use 1-Click Gmail composer to dispatch from your authenticated Google account.'
    });
  }

  try {
    const resendPayload = {
      from: `${fromName || 'Lili Technical Recruiter'} <onboarding@resend.dev>`,
      to: [to],
      reply_to: fromEmail || 'laila.mohamed.fikry@gmail.com',
      subject: subject,
      text: body
    };

    const apiResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${key}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(resendPayload)
    });

    const data = await apiResponse.json();

    if (!apiResponse.ok) {
      return res.status(apiResponse.status).json({
        success: false,
        error: data.message || 'Resend API returned an error',
        details: data
      });
    }

    return res.status(200).json({
      success: true,
      mode: 'resend',
      id: data.id,
      message: `Email successfully delivered to ${to}!`
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: `Failed to dispatch email: ${err.message}`
    });
  }
}
