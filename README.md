# TalentScout AI — Autonomous Recruitment Pre-Screening Agent 🚀

An autonomous, evidence-based HR recruitment and pre-screening agent built on **Wesam.ai** for the **Agents at Work Hackathon (1st Edition)**. 

---

## 📌 The Problem
Small-to-medium enterprises (SMEs), digital agencies, and startup founders waste **15+ hours per hiring cycle** manually reading unformatted PDF resumes, cross-referencing skills against complex job descriptions, tracking candidates in messy spreadsheets, and writing repetitive scheduling emails. This manual bottleneck slows down hiring, introduces human bias, and causes top talent to slip through the cracks.

---

## 💡 The Solution: Lili (Technical Recruiter Agent)
**Lili** is an autonomous AI recruitment agent configured to manage resume parsing, portfolio assessment, job-fit evaluation, and defensible candidate ranking end-to-end. 

Key capabilities include:
* **Objective Resume-to-Job Evaluation:** Extracts role requirements, maps evidence to criteria (Met, Partially Met, Not Demonstrated), calculates an explicit 0–100 fit score, and flags verification questions without relying on demographic bias.
* **Technical Portfolio Assessment:** Inspects GitHub repos, project architectures, code complexity, and technical depth against job-relevant criteria.
* **Candidate Ranking & Shortlist Matrix:** Normalizes evaluations across multiple applicants to build a structured ranking table with clear disposition recommendations (Advance, Hold, or Do Not Advance).
* **Screening Interview Guide Generator:** Automatically generates targeted, behavioral screening questions and rating rubrics based on unresolved candidate gaps.

---

## 🛠️ Built with Wesam.ai
This agent was architected and deployed using **Wesam.ai**, leveraging structured system instructions, role guardrails, and reference document integrations to ensure predictable, professional, and compliant HR workflows.

---

## 📂 Repository Structure
```text
├── README.md               # Project documentation & hackathon submission details
├── docs/
│   ├── architecture.md     # Agent design and prompt structure
│   └── impact-slides.pdf   # SME workflow and measured ROI breakdown
└── sample-data/
    ├── sample_jd.txt       # Sample Software Engineer Job Description
    └── sample_resume.pdf   # Sample candidate resume for testing
