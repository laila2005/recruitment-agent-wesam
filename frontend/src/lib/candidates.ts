export type Tier = 1 | 2 | 3;

export interface Candidate {
  id: string;
  anonId: string;
  name: string;
  university: string;
  location: string;
  score: number;
  tier: Tier;
  years: number;
  matched: string[];
  missing: string[];
  takeaway: string;
  breakdown: { label: string; weight: number; score: number }[];
  strengths: { point: string; quote: string }[];
  gaps: { flag: string; severity: "High" | "Medium" | "Low" }[];
  questions: { q: string; type: "Behavioral" | "Technical"; strong: string; weak: string }[];
  email: string;
}

export const JOBS = [
  "Senior Backend Engineer (TechFlow)",
  "Senior Frontend / React Lead (PixelCraft)",
  "AI Applications Engineer (NeuroFlow)",
];

export const CANDIDATES: Candidate[] = [
  {
    id: "sarah",
    anonId: "Candidate C-01",
    name: "Sarah Lin",
    university: "UC Berkeley, B.S. Computer Science",
    location: "Seattle, WA",
    score: 94,
    tier: 1,
    years: 6.5,
    matched: ["React 18", "Next.js", "TypeScript", "Storybook", "Web Vitals"],
    missing: [],
    takeaway: "Storybook architect across 6 teams; verified LCP 1.4s performance win.",
    breakdown: [
      { label: "Technical Skills", weight: 40, score: 96 },
      { label: "Experience", weight: 25, score: 92 },
      { label: "Impact", weight: 20, score: 95 },
      { label: "Leadership", weight: 10, score: 90 },
      { label: "Communication", weight: 5, score: 88 },
    ],
    strengths: [
      { point: "Built and scaled a shared design system", quote: "Architected a Storybook-driven component library adopted by 6 product teams (140+ components)." },
      { point: "Measurable performance wins", quote: "Reduced LCP from 3.8s to 1.4s on the checkout flow via RSC migration and image streaming." },
      { point: "Mentorship track record", quote: "Mentored 5 engineers; 2 promoted to Senior within 18 months." },
    ],
    gaps: [
      { flag: "No explicit experience with GraphQL federation", severity: "Low" },
      { flag: "Verify scope of 'led' Next.js 14 migration (team size unclear)", severity: "Medium" },
    ],
    questions: [
      { type: "Technical", q: "Walk us through how you diagnosed and cut LCP to 1.4s. What trade-offs did you reject?", strong: "Cites specific metrics, RUM tooling, and explains rejected options with reasoning.", weak: "Generic 'we optimized images' answer with no measurement method." },
      { type: "Behavioral", q: "How did you get 6 teams to adopt one design system without a mandate?", strong: "Describes contribution model, governance, and handling of dissenting teams.", weak: "Relies on authority or cannot name adoption friction." },
      { type: "Technical", q: "When would you choose a Server Component vs. a Client Component in a data-heavy dashboard?", strong: "Discusses serialization boundaries, caching, and interactivity cost clearly.", weak: "Treats them as interchangeable or defaults everything to client." },
    ],
    email: `Subject: Interview invitation — Senior Frontend / React Lead at PixelCraft

Hi Sarah,

Thank you for applying to PixelCraft. Your work architecting a Storybook design system adopted across six teams — and cutting checkout LCP from 3.8s to 1.4s — stood out immediately to our team.

We'd love to invite you to a 45-minute first-round conversation with our Head of Engineering. Please pick any slot that works for you here: [scheduling link]

Looking forward to speaking soon,
The PixelCraft Talent Team`,
  },
  {
    id: "devin",
    anonId: "Candidate C-02",
    name: "Devin R.",
    university: "Georgia Tech, B.S. Computer Engineering",
    location: "Austin, TX",
    score: 78,
    tier: 2,
    years: 5.2,
    matched: ["React 18", "TypeScript", "Redux"],
    missing: ["Next.js", "Storybook"],
    takeaway: "Strong Redux state architect; lacks SSR/Next.js exposure and team leadership.",
    breakdown: [
      { label: "Technical Skills", weight: 40, score: 80 },
      { label: "Experience", weight: 25, score: 78 },
      { label: "Impact", weight: 20, score: 75 },
      { label: "Leadership", weight: 10, score: 70 },
      { label: "Communication", weight: 5, score: 82 },
    ],
    strengths: [
      { point: "Complex client state management", quote: "Redesigned Redux store for a trading UI handling 2k updates/sec with zero dropped frames." },
      { point: "Solid testing discipline", quote: "Raised frontend test coverage from 41% to 87% using RTL and Playwright." },
    ],
    gaps: [
      { flag: "No production Next.js / SSR experience", severity: "High" },
      { flag: "No formal leadership or mentoring evidence", severity: "Medium" },
      { flag: "Short 9-month tenure at most recent role", severity: "Low" },
    ],
    questions: [
      { type: "Technical", q: "How would you migrate a large Redux SPA toward server-rendered routes?", strong: "Proposes incremental strategy, hydration concerns, and state co-location.", weak: "Suggests a full rewrite with no risk plan." },
      { type: "Behavioral", q: "Tell us about a time you influenced a technical decision without formal authority.", strong: "Concrete example with stakeholders, data, and outcome.", weak: "Cannot produce an example or outcome." },
      { type: "Behavioral", q: "What prompted your move after 9 months at your last role?", strong: "Candid, reflective, and forward-looking answer.", weak: "Blames others or is evasive." },
    ],
    email: `Subject: Your application — Senior Frontend / React Lead at PixelCraft

Hi Devin,

Thanks for your interest in PixelCraft. We were impressed by your Redux architecture work on high-frequency trading UIs and your testing discipline.

We're still reviewing candidates for this round and would like to keep your profile active. We'll be in touch within the next two weeks with next steps.

Best regards,
The PixelCraft Talent Team`,
  },
  {
    id: "jordan",
    anonId: "Candidate C-03",
    name: "Jordan Blake",
    university: "Portland Community College, A.S.",
    location: "Portland, OR",
    score: 48,
    tier: 3,
    years: 3.1,
    matched: ["React 18"],
    missing: ["Next.js", "TypeScript", "Storybook"],
    takeaway: "WordPress-focused builder; does not meet the 5-year mandatory minimum.",
    breakdown: [
      { label: "Technical Skills", weight: 40, score: 52 },
      { label: "Experience", weight: 25, score: 35 },
      { label: "Impact", weight: 20, score: 50 },
      { label: "Leadership", weight: 10, score: 40 },
      { label: "Communication", weight: 5, score: 75 },
    ],
    strengths: [
      { point: "Client-facing delivery", quote: "Delivered 30+ WordPress sites for small businesses on schedule." },
      { point: "Growing React skills", quote: "Built a React booking widget embedded in 12 client sites." },
    ],
    gaps: [
      { flag: "Unmet 5-year mandatory experience minimum (3.1 yrs)", severity: "High" },
      { flag: "No TypeScript usage in any listed project", severity: "High" },
      { flag: "No lead-level scope or team ownership", severity: "Medium" },
    ],
    questions: [
      { type: "Technical", q: "How did you manage state and data fetching in your React booking widget?", strong: "Explains patterns and their limits clearly.", weak: "Unclear on how data flows." },
      { type: "Behavioral", q: "Describe a project where requirements changed late. How did you respond?", strong: "Structured re-planning and client communication.", weak: "No process described." },
      { type: "Technical", q: "What's your plan to grow into large-scale TypeScript codebases?", strong: "Concrete learning plan with examples.", weak: "Vague intent only." },
    ],
    email: `Subject: Update on your PixelCraft application

Hi Jordan,

Thank you for taking the time to apply for the Senior Frontend / React Lead role. After careful review, we won't be moving forward at this stage — this role requires a minimum of five years of professional frontend experience, including production TypeScript.

Your client delivery record and React widget work show real momentum. We'd encourage you to apply for future mid-level openings, and we'll keep your details on file.

Wishing you all the best,
The PixelCraft Talent Team`,
  },
];
