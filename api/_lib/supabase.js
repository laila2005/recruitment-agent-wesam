// Server-side Supabase access for Lili's tools (service_role; never sent to browsers).
// Files under api/_lib are not exposed as routes by Vercel.

export const SUPABASE_URL = process.env.SUPABASE_URL || 'https://ppjxzlepqstqvcrkqscz.supabase.co';
// The recruiter Lili works for is fixed server-side; the agent cannot choose another tenant
export const RECRUITER_EMAIL = process.env.LILI_OWNER_EMAIL || 'laila.mohamed.fikry@gmail.com';

export function serviceHeaders(extra = {}) {
  return {
    apikey: process.env.SUPABASE_SERVICE_ROLE_KEY,
    Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
    ...extra
  };
}

export async function callRpc(fn, params) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${fn}`, {
    method: 'POST',
    headers: serviceHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(params),
    signal: AbortSignal.timeout(15000)
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
