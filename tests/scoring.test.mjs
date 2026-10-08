// Pre-screen scorer tests. The scorer lives inside index.html (single-file dashboard), between the
// `// <scoring-core>` markers; this test evaluates exactly that block in an isolated VM context.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import vm from 'node:vm';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const html = readFileSync(path.join(root, 'index.html'), 'utf8');
const start = html.indexOf('// <scoring-core>');
const end = html.indexOf('// </scoring-core>');
assert.ok(start > 0 && end > start, 'scoring-core markers not found in index.html');

const core = vm.runInNewContext(
  html.slice(start, end) +
    '\n;({ SCORING, detectSkills, skillSatisfies, analyzeExperience, extractYears, extractName, titleCaseName, scoreCandidate, prescreenFromText, detectPromptInjection, classifyCvLines })',
  {}
);

const cv = name => readFileSync(path.join(root, 'sample-data', name), 'utf8');

// Same as defaultJobs[0] in index.html
const FRONTEND = {
  id: 'frontend',
  title: 'Senior Frontend / React Lead',
  minExp: 5.0,
  mandatory: ['React 18', 'Next.js', 'TypeScript', 'Storybook'],
  weights: { tech: 40, exp: 25, impact: 20, lead: 15 }
};
const BACKEND = { id: 'backend', minExp: 5.0, mandatory: ['Python', 'FastAPI', 'PostgreSQL', 'Microservices'], weights: { tech: 40, exp: 25, impact: 20, lead: 15 } };
const AI = { id: 'ai', minExp: 3.0, mandatory: ['Python', 'LangChain', 'Vector DB', 'FastAPI'], weights: { tech: 45, exp: 20, impact: 25, lead: 10 } };
const NOW = new Date('2026-10-10T12:00:00Z');
const techOf = r => r.breakdown.find(d => d.key === 'tech').score;

test('strong frontend CV (Sarah) is Tier 1 with ~93', () => {
  const r = core.prescreenFromText(FRONTEND, cv('resume_frontend_strong.txt'), NOW);
  assert.equal(r.tier, 'tier1');
  assert.ok(r.score >= 85, `score ${r.score}`);
  assert.equal(r.score, 93);
  assert.equal(r.exp, 6.8);
  assert.deepEqual([...r.missing], []);
  assert.equal(r.injection, null);
});

test('junior with gaps (Jordan) is Tier 3 with both caps applied', () => {
  const r = core.prescreenFromText(FRONTEND, cv('resume_frontend_junior_gap.txt'), NOW);
  assert.equal(r.tier, 'tier3');
  assert.ok(r.belowExpBar, 'experience cap applied');
  assert.ok(r.missing.length > 0, 'missing must-have cap applied');
  assert.ok(r.score <= core.SCORING.minExpCap);
  assert.ok(r.gaps.some(g => g.includes('Score capped at 69')));
  assert.ok(r.gaps.some(g => g.includes('Score capped at 74')));
});

test('sample CVs fit their own roles', () => {
  const alex = core.prescreenFromText(BACKEND, cv('sample_resume.txt'), NOW);
  assert.equal(alex.tier, 'tier1', `Alex ${alex.score}`);
  const marcus = core.prescreenFromText(AI, cv('resume_ai_candidate.txt'), NOW);
  assert.ok(marcus.score >= 70, `Marcus ${marcus.score}`);
  assert.ok(marcus.skills.includes('Vector DB'));
});

test('prompt-injection / keyword-stuffed junior is NOT Tier 1 and the injection is detected', () => {
  const r = core.prescreenFromText(FRONTEND, cv('adversarial/resume_prompt_injection.txt'), NOW);
  assert.notEqual(r.tier, 'tier1', `score ${r.score}`);
  assert.ok(r.injection, 'injection phrase detected');
  assert.ok(r.flags.includes('prompt_injection'));
  // dated roles (1.5 yrs) beat the hidden "12 years of experience" claim
  assert.equal(r.exp, 1.5);
  assert.ok(r.flags.includes('claim_mismatch'));
  assert.ok(r.gaps.some(g => /Claimed 12 yrs but dated roles show 1\.5 yrs/.test(g)));
});

test('must-haves listed only in a skills line get less than full tech credit', () => {
  const r = core.prescreenFromText(FRONTEND, cv('adversarial/resume_skills_list_only.txt'), NOW);
  assert.ok(techOf(r) < 100, `tech ${techOf(r)}`);
  assert.equal(techOf(r), 50);
  assert.ok(r.listedOnly.length === 4);
  assert.ok(r.gaps.some(g => g.includes('Listed only in skills section')));
  assert.notEqual(r.tier, 'tier1');
});

test('name/email/city/university swap scores identically to the original', () => {
  const a = core.prescreenFromText(FRONTEND, cv('resume_frontend_strong.txt'), NOW);
  const b = core.prescreenFromText(FRONTEND, cv('adversarial/resume_frontend_strong_name_swap.txt'), NOW);
  assert.equal(b.score, a.score);
  assert.equal(b.tier, a.tier);
  assert.deepEqual(JSON.parse(JSON.stringify(b.breakdown)), JSON.parse(JSON.stringify(a.breakdown)));
});

test('unknown years are not capped and are flagged for manual check', () => {
  const text = 'ALEX DOE\nFrontend Engineer\nBuilt dashboards with React 18, Next.js, TypeScript and Storybook. Led a team of 4, mentored 2 juniors, architected the design system.\nImproved load time by 40% for 2 million users and cut errors by 30%.';
  const exp = core.analyzeExperience(text, NOW);
  assert.equal(exp.years, null);
  const r = core.prescreenFromText(FRONTEND, text, NOW);
  assert.equal(r.expUnknown, true);
  assert.equal(r.belowExpBar, false);
  assert.ok(r.score > core.SCORING.minExpCap, `score ${r.score} should not be capped at 69`);
  assert.ok(r.gaps.some(g => /exp unknown — verify manually/.test(g)));
});

test('experience: dated spans, education excluded, overlaps unioned, claimed fallback', () => {
  const t = 'Engineer — A\nJan 2018 – Dec 2019\nEngineer — B (part-time)\nJun 2019 – Dec 2020\nB.Sc. Computer Science, University of X, 2010 – 2014';
  assert.equal(core.analyzeExperience(t, NOW).years, 2.9); // Jan 2018 → Dec 2020, overlap counted once; degree ignored
  assert.equal(core.analyzeExperience('Senior dev with 7 years of experience in React.', NOW).years, 7);
  assert.equal(core.analyzeExperience('Senior dev with 7 years of experience in React.', NOW).source, 'claimed');
});

test('skill aliases are detected and plain English is not', () => {
  const s = core.detectSkills('Built apps in ReactJS and NextJS on k8s with Postgres, golang and a Chroma vector database.', null);
  for (const k of ['React', 'Next.js', 'Kubernetes', 'PostgreSQL', 'Vector DB']) assert.ok(s.includes(k), `${k} in ${s}`);
  const fp = core.detectSkills('I react quickly to incidents and help the rest of the team. Graduated Spring 2020. Ready to go to market.', null);
  for (const k of ['React', 'REST', 'Spring', 'Go']) assert.ok(!fp.includes(k), `false positive ${k} in ${fp}`);
  assert.ok(core.detectSkills('Languages: Go, Python', null).includes('Go'));
  assert.ok(core.skillSatisfies('PostgreSQL', 'Postgres'));
  assert.ok(core.skillSatisfies('Kubernetes', 'k8s'));
  assert.ok(core.skillSatisfies('Qdrant', 'Vector DB'));
  assert.ok(core.skillSatisfies('React', 'React 18'));
});

test('all-caps names are title-cased; mixed-case names are kept', () => {
  assert.equal(core.extractName('SARAH LIN\nSenior Frontend Engineer', 'x.txt'), 'Sarah Lin');
  assert.equal(core.titleCaseName("SEÁN O'BRIEN-MÜLLER"), "Seán O'Brien-Müller");
  assert.equal(core.titleCaseName("Aoife O'Brien-Müller"), "Aoife O'Brien-Müller");
  assert.equal(core.titleCaseName('Ronald McDonald'), 'Ronald McDonald');
});

test('min experience 0 never caps', () => {
  const job = { ...FRONTEND, minExp: 0 };
  const r = core.scoreCandidate(job, ['React 18', 'Next.js', 'TypeScript', 'Storybook'], 0.5, '');
  assert.equal(r.belowExpBar, false);
});
