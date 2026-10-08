// Lili's GitHub check: public facts about a candidate's profile, compared with what the CV claims.
// A missing or private profile is "unverifiable", never a penalty.
//
// Env vars: GITHUB_TOKEN (optional) raises the GitHub API rate limit from 60 to 5000 requests/hour.

const USERNAME_RE = /^[A-Za-z0-9](?:[A-Za-z0-9]|-(?=[A-Za-z0-9])){0,38}$/;
// github.com paths that are not user profiles
const RESERVED = new Set(['about', 'apps', 'blog', 'collections', 'contact', 'enterprise', 'explore', 'features',
  'marketplace', 'orgs', 'pricing', 'security', 'settings', 'site', 'sponsors', 'topics', 'trending']);

export function githubUsernameFromCv(cvText) {
  for (const m of String(cvText || '').matchAll(/github\.com\/([A-Za-z0-9-]{1,39})(?![A-Za-z0-9-])/gi)) {
    const name = m[1];
    if (USERNAME_RE.test(name) && !RESERVED.has(name.toLowerCase())) return name;
  }
  return null;
}

// Star counts the CV claims, e.g. "340 GitHub stars", "1.2k stars", "180+ stars"
export function starClaimsFromCv(cvText) {
  const claims = [];
  for (const m of String(cvText || '').matchAll(/(\d+(?:[.,]\d+)?)\s*(k)?\s*\+?\s*(?:github\s+stars?|stars)\b/gi)) {
    const n = Math.round(parseFloat(m[1].replace(',', '')) * (m[2] ? 1000 : 1));
    if (n > 0) claims.push({ text: m[0].trim(), stars: n });
  }
  return claims;
}

async function gh(path) {
  const headers = { accept: 'application/vnd.github+json', 'user-agent': 'talentscout-lili', 'x-github-api-version': '2022-11-28' };
  if (process.env.GITHUB_TOKEN) headers.authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  const res = await fetch(`https://api.github.com${path}`, { headers, signal: AbortSignal.timeout(10000) });
  if (res.status === 404) return { notFound: true };
  if (res.status === 403 || res.status === 429) throw new Error('GitHub rate limit reached; try again later (set GITHUB_TOKEN on the server to raise it).');
  if (!res.ok) throw new Error(`GitHub HTTP ${res.status}`);
  return { data: await res.json() };
}

export async function checkGithub(username, cvText = '') {
  const checkedAt = new Date().toISOString();
  if (!username || !USERNAME_RE.test(username)) {
    return {
      username: username || null,
      found: false,
      checked_at: checkedAt,
      claims: [{ claim: 'GitHub profile', finding: 'No GitHub profile link in the CV', status: 'unverifiable' }]
    };
  }

  const user = await gh(`/users/${encodeURIComponent(username)}`);
  if (user.notFound) {
    return {
      username,
      found: false,
      checked_at: checkedAt,
      claims: [{ claim: `github.com/${username}`, finding: 'Profile not found (renamed, private or mistyped)', status: 'unverifiable' }]
    };
  }

  const reposRes = await gh(`/users/${encodeURIComponent(username)}/repos?per_page=100&sort=pushed&type=owner`);
  const repos = Array.isArray(reposRes.data) ? reposRes.data.filter(r => !r.fork) : [];
  const totalStars = repos.reduce((s, r) => s + (r.stargazers_count || 0), 0);
  const maxStars = repos.reduce((m, r) => Math.max(m, r.stargazers_count || 0), 0);
  const langCount = {};
  for (const r of repos) if (r.language) langCount[r.language] = (langCount[r.language] || 0) + 1;
  const topLanguages = Object.entries(langCount).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([l]) => l);
  const lastPush = repos.map(r => r.pushed_at).filter(Boolean).sort().pop() || null;
  const topRepos = [...repos].sort((a, b) => (b.stargazers_count || 0) - (a.stargazers_count || 0)).slice(0, 3)
    .map(r => ({ name: r.name, stars: r.stargazers_count || 0, language: r.language || null, pushed_at: r.pushed_at || null, url: r.html_url }));

  // Deterministic claim checks the agent can't talk its way around
  const claims = [];
  for (const c of starClaimsFromCv(cvText)) {
    const ok = maxStars >= c.stars * 0.8 || totalStars >= c.stars * 0.8;
    claims.push({
      claim: `CV: "${c.text}"`,
      finding: `Public repos show ${totalStars} stars in total (best repo ${maxStars})`,
      status: ok ? 'verified' : 'mismatch'
    });
  }
  const mentionedRepos = [...String(cvText).matchAll(new RegExp(`github\\.com/${username}/([A-Za-z0-9._-]+)`, 'gi'))].map(m => m[1].replace(/\.git$/, ''));
  for (const name of [...new Set(mentionedRepos)].slice(0, 3)) {
    const repo = repos.find(r => r.name.toLowerCase() === name.toLowerCase());
    claims.push({
      claim: `Repo ${name}`,
      finding: repo ? `Exists · ${repo.stargazers_count || 0} stars · ${repo.language || 'no language'} · last push ${String(repo.pushed_at || '').slice(0, 10)}` : 'Not found among public repos',
      status: repo ? 'verified' : 'mismatch'
    });
  }

  return {
    username,
    found: true,
    profile_url: `https://github.com/${username}`,
    name: user.data.name || null,
    public_repos: user.data.public_repos ?? repos.length,
    followers: user.data.followers ?? 0,
    account_created: user.data.created_at || null,
    total_stars: totalStars,
    top_languages: topLanguages,
    last_push: lastPush,
    top_repos: topRepos,
    claims,
    checked_at: checkedAt
  };
}
