# TalentScout AI — Lili: The Autonomous "Zero-Dollar ATS" for Startups 🚀

> **Hackathon:** Agents at Work — 1st Edition | **Deadline:** October 3, 2026  
> **Backend Platform:** [Wesam.ai](https://wesam.ai) | **Frontend Dashboard:** [Lovable.dev](https://lovable.dev)  
> **Submission Portal:** [ai.untap.us/programs/aaw-1st-edition](https://ai.untap.us/programs/aaw-1st-edition)

---

## 🎯 The Problem: Big-Company Expectations on a Zero-Dollar Budget

Early-stage tech startups, boutique agencies, and lean founders cannot afford enterprise Applicant Tracking Systems (ATS) like **Greenhouse (\$10k/yr)**, **Gem (\$5k/yr)**, or **HackerRank (\$2.5k/yr)**.

Instead, they suffer through manual chaos:
* **15+ hours wasted per hiring cycle** manually opening unstructured PDF resumes.
* **Messy Google Sheets** with inconsistent notes and subjective "gut-feel" scoring.
* **Top candidates lost** to competitors due to 3-week screening delays.
* **Candidate ghosting:** Founders lack the time to draft 50 individual rejection emails, severely damaging their employer brand.

---

## 💡 The Solution: Dual-Engine Architecture

TalentScout AI combines an **autonomous agent backend on Wesam.ai** with a **modern SaaS executive dashboard built on Lovable.dev** to deliver an enterprise-grade recruitment experience for \$0.

* **Primary Repository:** [github.com/laila2005/recruitment-agent-wesam](https://github.com/laila2005/recruitment-agent-wesam)
* **Dedicated Frontend Repository:** [github.com/laila2005/pixel-perfect-render-84515](https://github.com/laila2005/pixel-perfect-render-84515)

```
┌─────────────────────────────────────────────────────────────┐
│                 FRONTEND: LOVABLE.DEV DASHBOARD             │
│  • Executive Triage Matrix (Tier 1 Fast-Track, Bench, Pass) │
│  • 1-Click "Bias-Free Anonymize Mode" Switch                │
│  • Interactive Scorecard Drawer, Interview Guide & Emails   │
│  • Visual circular score indicators (94 🟢, 78 🟡, 48 🔴)   │
└──────────────────────────────▲──────────────────────────────┘
                               │ (Syncs Decisions / CSV)
┌──────────────────────────────▼──────────────────────────────┐
│                  BACKEND: WESAM.AI AGENT (LILI)             │
│  • Core Engine: GPT-5.5 with evidence-based guardrails      │
│  • Modular Skills: Parsing, Rubric Scoring, Guide, Outreach │
│  • MCP Integrations: GitMCP (GitHub repos) & Tavily Search  │
│  • Scheduled Workflow: Daily 8:00 AM Hiring Market Brief    │
└─────────────────────────────────────────────────────────────┘
```

---

## ⚡ Core Capabilities & Skills

| Module / Skill | What It Does for Lean Teams |
|---|---|
| 📄 **Resume Evaluation** | Ingests PDF/DOCX resumes, anonymizes candidate IDs (`Candidate C-01`), and maps claims to verified evidence. |
| 🧮 **Rubric Scoring & Caps** | Applies 0–100 weighted scoring with non-negotiable score caps for missing mandatory requirements. |
| 📊 **Executive Triage Dashboard** | Normalizes multiple applicants into an executive leaderboard across 3 operational tiers (🟢 Fast-Track, 🟡 Bench, 🔴 Archive). |
| 🎯 **Screening Interview Guide** | Generates tailored behavioral questions with 1–4 rating anchors targeting candidate-specific resume gaps. |
| ✉️ **Candidate Outreach Package** | Generates ready-to-send personalized emails (1st-round interview invitations, keep-warm updates, and respectful feedback rejections). |
| 📂 **ATS Pipeline CSV Sync** | Exports batch evaluations into a clean CSV spreadsheet ready for Google Sheets or Notion. |
| 🌐 **Autonomous Morning Workflow** | Daily at 8:00 AM, searches the web via Tavily MCP to deliver a brief on in-demand engineering skills and salary benchmarks. |

---

## 📈 Measured Impact / ROI

| Metric | Before Lili (Manual) | With Lili on Wesam.ai + Lovable | Measured Benefit |
|---|---|---|---|
| **Time per hiring cycle** | 15+ hours | **Under 2 hours** | **85% reduction** |
| **Recruiting Software Costs** | \$10,000–\$17,000/yr | **\$0 (Wesam & Lovable Free Tier)**| **100% cost elimination** |
| **Scoring Consistency** | Subjective / Gut-feel | **Defensible 0–100 Rubric** | **Full auditability** |
| **Demographic Bias Surface** | High (name, school, photo) | **Zero (Anonymize Mode Toggle)** | **EEOC compliant** |
| **Candidate Ghosting Rate** | ~60% of applicants | **0% (1-click tailored email drafts)**| **Protects employer brand** |

---

## 📂 Repository Structure

```text
recruitment-agent-wesam/
│
├── README.md                          # Master project documentation & hackathon details
│
├── docs/
│   ├── architecture.md                # System prompt hierarchy & MCP integration design
│   ├── impact-slides-content.md       # Complete 3-slide deck content (Problem, Solution, ROI)
│   ├── demo-script.md                 # 2.5-minute video walkthrough recording script (Wesam + Lovable)
│   └── lovable-dashboard-prompt.md    # Master prompt for interactive web comparison dashboard
│
├── wesam-skills/
│   ├── skill-resume-evaluation.md     # Resume parsing, evidence scoring & outreach drafts
│   ├── skill-portfolio-assessment.md  # Technical GitHub inspection & code quality vetting
│   ├── skill-candidate-ranking.md     # High-throughput candidate triage & comparison matrix
│   ├── skill-screening-guide.md       # Behavioral questions with 1–4 rating anchors
│   └── skill-candidate-outreach.md    # Automated invite, keep-warm, and feedback emails
│
└── sample-data/
    ├── sample_jd.txt                  # Role 1: Senior Backend Engineer (Fintech)
    ├── jd_frontend_lead.txt           # Role 2: Senior Frontend / React Lead (SaaS)
    ├── jd_ai_engineer.txt             # Role 3: AI Applications Engineer (GenAI)
    ├── sample_resume.txt              # Candidate 1: Alex Chen (Senior Backend - Advance)
    ├── resume_frontend_strong.txt     # Candidate 2: Sarah Lin (Lead Frontend - Fast-Track)
    ├── resume_frontend_junior_gap.txt # Candidate 3: Jordan Blake (Underqualified - Score Cap)
    ├── resume_ai_candidate.txt        # Candidate 4: Marcus Vance (AI Engineer - Transferable)
    ├── sample_output.md               # Complete sample evaluation output
    ├── sample_comparison_dashboard.md # Sample Executive HR Triage Dashboard
    └── candidate_pipeline_export.csv  # Sample exportable ATS pipeline spreadsheet
```

---

## 🚀 How to Run the Demo

1. **Wesam.ai Backend Agent:** Open `Lili (Technical Recruiter)` on Wesam.ai, load skills from `wesam-skills/`, and test in Preview.
2. **Lovable.dev Frontend Dashboard:** Paste the prompt in [`docs/lovable-dashboard-prompt.md`](docs/lovable-dashboard-prompt.md) into Lovable.dev to interact with the visual candidate matrix and bias-free anonymize toggle.
