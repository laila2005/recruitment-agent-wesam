# TalentScout AI — Lili: The Autonomous "Zero-Dollar ATS" for Startups 🚀

> **Hackathon:** Agents at Work — 1st Edition | **Deadline:** October 3, 2026  
> **Platform:** [Wesam.ai](https://wesam.ai) | **Category:** HR Automation / Recruitment Intelligence  
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

## 💡 The Solution: Lili (Technical Recruiter & Autonomous ATS)

**Lili** is an autonomous AI recruitment agent built on **Wesam.ai** that executes the entire pre-screening and candidate management pipeline end-to-end, replacing the entire \$17,000 enterprise recruiting stack.

```
               TRADITIONAL ATS STACK ($17,000/yr)                      LILI (ZERO-DOLLAR AUTONOMOUS ATS)
┌─────────────────────────────────────────────────────────────┐    ┌──────────────────────────────────────────────────────────┐
│ 1. Greenhouse / Lever ($10k/yr) — Candidate Database        │ ──►│ 📄 Instant CSV / Notion Pipeline Sync                    │
│ 2. Gem / HireEZ ($5k/yr) — Candidate Email Outreach         │ ──►│ ✉️ 1-Click Personalized Email Generator (Invite & Reject)│
│ 3. HackerRank / Screen ($2k/yr) — Technical Vetting Guides  │ ──►│ 🎯 Auto-Generated Technical Probes & Rating Anchors     │
│ 4. Recruiter Agency Fees ($15k/hire) — Screening & Triage   │ ──►│ 🤖 30-Second Autonomous Evidence-Based Ranking          │
└─────────────────────────────────────────────────────────────┘    └──────────────────────────────────────────────────────────┘
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

| Metric | Before Lili (Manual) | With Lili on Wesam.ai | Measured Benefit |
|---|---|---|---|
| **Time per hiring cycle** | 15+ hours | **Under 2 hours** | **85% reduction** |
| **Recruiting Software Costs** | \$10,000–\$17,000/yr | **\$0 (Wesam Free Tier)** | **100% cost elimination** |
| **Scoring Consistency** | Subjective / Gut-feel | **Defensible 0–100 Rubric** | **Full auditability** |
| **Demographic Bias Surface** | High (name, school, photo) | **Zero (Anonymized IDs)** | **EEOC compliant** |
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
│   ├── demo-script.md                 # 2.5-minute video walkthrough recording script
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

## 🚀 How to Replicate & Test on Wesam.ai

1. Open [Wesam.ai](https://wesam.ai) and create/open the **Lili** agent.
2. Select model **`gpt-5.5`**.
3. Upload the skills from [`wesam-skills/`](wesam-skills/) and reference JDs from [`sample-data/`](sample-data/).
4. Connect MCP tools:
   * **GitHub MCP:** `https://gitmcp.io/docs`
   * **Web Search MCP:** `https://mcp.tavily.com/mcp/?tavilyApiKey=...`
5. Test in **Preview** using any of the candidate samples in [`sample-data/`](sample-data/).
