export type Tier = 1 | 2 | 3;

export interface Candidate {
  id: string;
  anonId: string;
  name: string;
  contactEmail?: string;
  emailSent?: boolean;
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

// Completely empty by default — no fake demo data
export const CANDIDATES: Candidate[] = [];
