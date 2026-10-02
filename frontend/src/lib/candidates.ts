export type Tier = 1 | 2 | 3;

export interface Candidate {
  id: string;
  anonId: string;
  name: string;
  university: string;
  location: string;
  roleId?: string;
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

export interface JobRole {
  id: string;
  title: string;
  company: string;
  minExp: number;
  mandatory: string[];
  description: string;
  weights: { tech: number; exp: number; impact: number; lead: number };
}

export const INITIAL_JOB_ROLES: JobRole[] = [
  {
    id: "frontend",
    title: "Senior Frontend / React Lead (PixelCraft)",
    company: "PixelCraft Studios",
    minExp: 5.0,
    mandatory: ["React 18", "Next.js", "TypeScript", "Storybook", "Web Vitals"],
    description: "Architect enterprise web applications, lead front-end performance, and maintain component libraries.",
    weights: { tech: 40, exp: 25, impact: 20, lead: 15 }
  },
  {
    id: "backend",
    title: "Senior Backend Engineer (TechFlow)",
    company: "TechFlow Solutions",
    minExp: 5.0,
    mandatory: ["Python", "FastAPI", "PostgreSQL", "Microservices"],
    description: "Lead API infrastructure, scaling distributed systems serving 500k+ daily transactions.",
    weights: { tech: 40, exp: 25, impact: 20, lead: 15 }
  },
  {
    id: "ai",
    title: "AI Applications Engineer (NeuroFlow)",
    company: "NeuroFlow AI",
    minExp: 3.0,
    mandatory: ["Python", "LangChain", "Vector DB", "FastAPI"],
    description: "Build production RAG pipelines, multi-agent workflows, and token optimization pipelines.",
    weights: { tech: 45, exp: 20, impact: 25, lead: 10 }
  }
];

export const JOBS = INITIAL_JOB_ROLES.map(j => j.title);

export const CANDIDATES: Candidate[] = [
  {
    id: "sarah",
    anonId: "Candidate C-01",
    name: "Sarah Lin",
    university: "UC Berkeley, B.S. Computer Science",
    location: "Seattle, WA",
    roleId: "frontend",
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
    email: `Subject: Interview Invitation — Senior Frontend Lead at PixelCraft\n\nHi Sarah,\n\nWe reviewed your background and were particularly impressed by your work scaling the Storybook design system across 6 teams and driving checkout LCP down to 1.4s.\n\nWe’d love to invite you to an initial 30-minute technical screening call with our engineering team: https://cal.com/pixelcraft/screen-sarah\n\nLooking forward to speaking!\n\nBest,\nLili (Technical Recruiter)`,
  },
  {
    id: "devin",
    anonId: "Candidate C-02",
    name: "Devin R.",
    university: "UT Austin, B.S. Software Engineering",
    location: "Austin, TX",
    roleId: "frontend",
    score: 78,
    tier: 2,
    years: 5.2,
    matched: ["React 18", "TypeScript", "Redux"],
    missing: ["Next.js", "Storybook"],
    takeaway: "Strong Redux state architect; lacks SSR/Next.js exposure and team leadership.",
    breakdown: [
      { label: "Technical Skills", weight: 40, score: 76 },
      { label: "Experience", weight: 25, score: 84 },
      { label: "Impact", weight: 20, score: 78 },
      { label: "Leadership", weight: 10, score: 68 },
      { label: "Communication", weight: 5, score: 85 },
    ],
    strengths: [
      { point: "Complex state management", quote: "Maintained a 40k LOC Redux Toolkit store with zero regression incidents across 4 major releases." },
      { point: "Solid automated testing", quote: "Wrote 300+ unit and integration tests with Vitest, hitting 88% branch coverage." },
    ],
    gaps: [
      { flag: "No demonstrated Next.js or React Server Components experience", severity: "High" },
      { flag: "Limited formal mentorship / lead experience", severity: "Medium" },
    ],
    questions: [
      { type: "Technical", q: "How would you migrate a Redux-heavy client SPA to Next.js App Router without rewriting state from scratch?", strong: "Identifies state boundaries, server state caching (TanStack Query), and incremental route migration.", weak: "Suggests keeping all state in global Redux on the client." },
      { type: "Behavioral", q: "Tell us about a time you disagreed with an architectural decision made by a senior peer.", strong: "Frames disagreement around business trade-offs, benchmarks, and respectful consensus.", weak: "Personalizes conflict or passively complies without raising concerns." },
    ],
    email: `Subject: Application Update — Senior Frontend Lead at PixelCraft\n\nHi Devin,\n\nThank you for taking the time to apply to PixelCraft. Our team was impressed by your extensive work in Redux state architecture and testing rigor.\n\nWe are currently prioritizing candidates with deep Next.js App Router and design system leadership experience. We’d love to keep your profile active in our bench for upcoming backend/full-stack openings.\n\nBest,\nLili (Technical Recruiter)`,
  },
  {
    id: "jordan",
    anonId: "Candidate C-03",
    name: "Jordan Blake",
    university: "Austin Community College, A.A. Web Design",
    location: "Portland, OR",
    roleId: "frontend",
    score: 48,
    tier: 3,
    years: 3.1,
    matched: ["React 18", "Next.js"],
    missing: ["TypeScript", "Storybook", "TypeScript"],
    takeaway: "WordPress-focused builder; does not meet the 5-year mandatory minimum.",
    breakdown: [
      { label: "Technical Skills", weight: 40, score: 45 },
      { label: "Experience", weight: 25, score: 42 },
      { label: "Impact", weight: 20, score: 55 },
      { label: "Leadership", weight: 10, score: 40 },
      { label: "Communication", weight: 5, score: 70 },
    ],
    strengths: [
      { point: "Fast turnaround on marketing pages", quote: "Delivered 20+ responsive landing pages in Next.js and Tailwind with sub-48h turnaround." },
    ],
    gaps: [
      { flag: "Does not meet mandatory 5+ year experience requirement (3.1 yrs verified)", severity: "High" },
      { flag: "No production TypeScript experience demonstrated", severity: "High" },
      { flag: "No design system maintenance or team mentoring background", severity: "Medium" },
    ],
    questions: [
      { type: "Technical", q: "What is your experience working with strict TypeScript in production codebases?", strong: "Discusses generic types, utility types, and strictNullChecks debugging.", weak: "Admits to 'any' casting or strictly JavaScript background." },
    ],
    email: `Subject: Application Status — Senior Frontend Lead at PixelCraft\n\nHi Jordan,\n\nThank you for applying to the Senior Frontend Lead opening at PixelCraft.\n\nFor this specific lead position, we are strictly prioritizing candidates with 5+ years of enterprise experience in strict TypeScript and design system governance. We appreciate your time and wish you the best in your search!\n\nBest,\nLili (Technical Recruiter)`,
  },
];
