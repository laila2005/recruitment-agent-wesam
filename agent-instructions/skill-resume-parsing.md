# Skill: Resume Parsing

> **Module ID:** `resume-parsing`  
> **Triggered by:** Resume upload + "evaluate" or "parse" intent  
> **Output:** Structured resume data object + evidence map

---

## 🎯 Objective

Extract all verifiable, role-relevant information from a candidate's resume and organize it into a structured data object. Separate **explicit claims** (stated facts) from **inferred signals** and flag **missing evidence** for key criteria.

---

## 📋 Parsing Protocol

### Step 1 — Role History Extraction

For each position, extract:

```
Company:        [Name] — [Verify: LinkedIn / Company website]
Title:          [Exact title as stated]
Tenure:         [Start] → [End] | Duration: [X years Y months]
Employment Type: [Full-time / Contract / Freelance / Internship]
Location:       [City / Remote / Hybrid]
Key Responsibilities: [Bullet list — verbatim or close paraphrase]
Technologies:   [All tools/languages/frameworks mentioned]
Impact Claims:  [Quantified results if stated — flag if unquantified]
```

> **Rule:** If tenure dates are missing or ambiguous, mark as `[DATES UNVERIFIED]` and flag.

---

### Step 2 — Tech Stack Mapping

Build a clean technology inventory organized by category:

```
Languages:      [e.g., Python (7 yrs), JavaScript (4 yrs), Go (1 yr)]
Frameworks:     [e.g., FastAPI, React, Django]
Databases:      [e.g., PostgreSQL, MongoDB, Redis]
Infrastructure: [e.g., AWS, Docker, Kubernetes, Terraform]
Tools:          [e.g., GitHub, Jira, Figma]
Methodologies:  [e.g., Agile/Scrum, TDD, CI/CD]
```

> **Rule:** Only list technologies that appear in described work experience, not just in a "Skills" section (skill lists without context = "Claimed, Not Demonstrated in Context").

---

### Step 3 — Evidence Classification

For each skill or requirement, classify as:

| Status | Definition |
|---|---|
| ✅ **Met** | Explicit, verifiable evidence in described work or portfolio |
| 🔶 **Partially Met** | Evidence present but weak (short tenure, junior role, or no quantified impact) |
| ❌ **Not Demonstrated** | Claimed in skills section only OR absent entirely |
| 🔍 **Claimed — Verify** | Stated but requires external verification (certificates, references) |

---

### Step 4 — Red Flag Detection

Automatically scan for and flag:

- **Employment gaps** > 3 months (flag for discussion, not penalization)
- **Titles that don't match responsibilities** (e.g., "Lead" with no team leadership evidence)
- **Vague impact claims** ("improved performance" without metrics)
- **Short tenure patterns** (< 12 months at 3+ consecutive roles)
- **Resume inflation signals** (superlatives without evidence: "expert," "world-class," "deep expertise")

---

### Step 5 — Structured Output

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📄 RESUME PARSE REPORT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Candidate:    [Name / Anonymized ID]
Parsed Date:  [Date]
Total Experience: [X years]

ROLE HISTORY:
[Structured table of roles]

TECH INVENTORY:
[Categorized stack]

EVIDENCE MAP:
[Per-skill classification table]

RED FLAGS DETECTED:
[List or "None detected"]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## ⚠️ Parsing Rules

1. **Never infer tenure** from vague statements like "several years" — mark as `[UNVERIFIED]`
2. **Never upgrade skill status** to Met based on years of claimed experience alone — look for context
3. **Preserve exact company names and titles** — do not paraphrase or standardize
4. **Flag but don't penalize** formatting issues (ATS-unfriendly layouts, missing sections)
5. Pass the structured output directly to the `rubric-scoring` skill for weighted evaluation
