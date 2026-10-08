# Architecture: Lili — TalentScout AI Agent Design

> **Platform:** Wesam.ai  
> **Version:** 1.0  
> **Last Updated:** 2026-10-02

---

## 🏗️ System Design Overview

Lili is a **single-agent, multi-skill system** deployed on Wesam.ai. The agent operates through a structured prompt hierarchy: a persistent system identity layer, three modular skill modules triggered by user intent, and a canonical output formatter enforced across all interactions.

```
┌─────────────────────────────────────────────────────────────────────┐
│                       LILI — WESAM.AI AGENT                        │
│                                                                     │
│  LAYER 1: Identity & Guardrails (lili-system-prompt.md)            │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ • Agent persona (Senior Technical Recruiter)                │   │
│  │ • Evidence-only evaluation mandate                          │   │
│  │ • Demographic bias prohibition                              │   │
│  │ • Canonical output format enforcement                       │   │
│  │ • Score cap rules                                           │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                              │                                      │
│  LAYER 2: Skill Modules (Intent-Triggered)                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐  │
│  │ skill:       │  │ skill:       │  │ skill:                   │  │
│  │ resume-      │  │ rubric-      │  │ interview-guide          │  │
│  │ parsing      │  │ scoring      │  │                          │  │
│  │              │  │              │  │                          │  │
│  │ Extracts:    │  │ Applies:     │  │ Generates:               │  │
│  │ • Role history│  │ • Weighted   │  │ • STAR questions         │  │
│  │ • Tech stack │  │   criteria   │  │ • Rating anchors         │  │
│  │ • Evidence   │  │ • 0-100 score│  │ • Verification probes    │  │
│  │   map        │  │ • Disposition│  │ • Legal compliance check │  │
│  │ • Red flags  │  │ • Ranking    │  │                          │  │
│  └──────┬───────┘  └──────┬───────┘  └────────────┬─────────────┘  │
│         │                 │                        │               │
│  LAYER 3: Output Formatter                                         │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ Canonical 6-section report:                                 │   │
│  │ Executive Summary → Scorecard → Strengths → Gaps →         │   │
│  │ Interview Guide → Final Recommendation                      │   │
│  └─────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
         ▲                                               ▲
   REFERENCE FILES                               USER INPUTS
   (Job Description                        (Resume PDF / text,
   uploaded once per                        Portfolio URLs,
   hiring round)                            "Rank these 5 candidates")
```

---

## 🔄 Execution Flows

### Flow 1: Single Candidate Evaluation

```
User uploads JD (reference file)
         │
         ▼
User pastes / uploads resume
         │
         ▼
Lili triggers: resume-parsing → rubric-scoring
         │
         ▼
6-section report returned (< 30 seconds)
         │
         ▼
User requests interview guide → interview-guide skill
         │
         ▼
Candidate-specific screening guide returned
```

### Flow 2: Multi-Candidate Ranking

```
User uploads JD + multiple resumes
         │
         ▼
Lili runs resume-parsing on each candidate
         │
         ▼
rubric-scoring applied with consistent weights
         │
         ▼
Ranking matrix returned (all candidates, sorted by score)
```

---

## 📝 Prompt Architecture

### System Prompt Structure (Wesam.ai)

```
[AGENT IDENTITY]
You are Lili, a senior Technical Recruiter Agent...

[BEHAVIORAL GUARDRAILS]
Evidence-only evaluation. No demographic signals...

[SKILL ROUTING]
When intent = "evaluate" → trigger resume-parsing + rubric-scoring
When intent = "rank" → trigger rubric-scoring (batch mode)
When intent = "interview" → trigger interview-guide

[OUTPUT FORMAT ENFORCEMENT]
Always use the canonical 6-section format...

[SCORE DISCIPLINE]
Apply caps when mandatory requirements are Not Demonstrated...
```

### Reference File Integration (Wesam.ai)

The Job Description is uploaded as a **Reference File** in Wesam.ai, which makes it persistently available across the entire conversation session. This allows Lili to:
- Extract role-specific weighting from the JD automatically
- Apply consistent criteria across multiple candidate evaluations in the same session
- Override default weights with JD-stated priorities

---

## 🔒 Bias Mitigation Design

| Risk | Mitigation |
|---|---|
| Name/nationality bias | Evidence-only evaluation; names treated as identifiers only |
| Recency bias | All tenures normalized; older experience evaluated equally |
| University prestige bias | Degrees evaluated only for accreditation, not institution rank |
| Inflation bias | Score caps applied when mandatory requirements are unmet |
| Confirmation bias | Gaps section is mandatory — cannot be omitted |

---

## 📊 Performance Characteristics

| Metric | Value |
|---|---|
| Evaluation time per candidate | ~25–40 seconds |
| Output consistency (same inputs) | >95% identical scoring |
| Supported input formats | PDF, TXT, direct paste, URLs |
| Max candidates per session | Limited by context window (~10–15 typical) |
| Legal compliance surface | EEOC-aligned question guardrails built-in |
