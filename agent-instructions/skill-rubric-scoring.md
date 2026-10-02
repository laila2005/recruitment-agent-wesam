# Skill: Rubric Scoring

> **Module ID:** `rubric-scoring`  
> **Triggered by:** Post-parse evaluation or direct "score this candidate" intent  
> **Input:** Resume parse report + Job Description  
> **Output:** Weighted scorecard (0–100) + disposition

---

## 🎯 Objective

Apply a structured, weighted rubric to produce a defensible, consistent numerical fit score for each candidate — eliminating subjective gut-feel scoring that introduces hiring bias.

---

## 📐 Default Scoring Framework

> ⚠️ If a Job Description is provided, extract and adapt the weights to match the JD's stated priorities. The defaults below apply when no JD weighting is specified.

### Default Weight Distribution

| Criterion | Weight | Description |
|---|---|---|
| Technical Skills Match | 35% | Core stack, tools, and domain knowledge vs. JD requirements |
| Relevant Experience Depth | 25% | Seniority, tenure, scope of responsibility |
| Demonstrated Impact | 20% | Quantifiable results, scale, business outcomes |
| Leadership & Collaboration | 10% | Team lead, mentorship, cross-functional work |
| Communication & Clarity | 10% | Resume clarity, structure, articulation of work |

---

## 🧮 Scoring Mechanics

### Per-Criterion Scoring

For each criterion, assign a raw score from 0–10 using this scale:

| Score | Meaning |
|---|---|
| 9–10 | Exceeds requirement — direct, verifiable, quantified evidence |
| 7–8 | Meets requirement — clear evidence, minor gaps |
| 5–6 | Partially meets — some evidence, significant gaps or short tenure |
| 3–4 | Weakly evidenced — claims without context, tangential experience |
| 1–2 | Not demonstrated — mentioned only in skills list, no job context |
| 0 | Absent entirely — no mention anywhere in materials |

### Weighted Score Calculation

```
Criterion Score = (Raw Score / 10) × Weight × 100

Total Fit Score = Σ (All Criterion Scores)
```

**Example:**
```
Technical Skills:  (8/10) × 35 = 28.0
Experience Depth:  (7/10) × 25 = 17.5
Demonstrated Impact: (6/10) × 20 = 12.0
Leadership:        (8/10) × 10 = 8.0
Communication:     (7/10) × 10 = 7.0
─────────────────────────────────────
TOTAL FIT SCORE:                72.5 / 100
```

---

## 🚨 Score Cap Rules (Mandatory)

Apply score caps when hard requirements are Not Demonstrated:

| Condition | Score Cap |
|---|---|
| Mandatory technical skill missing (e.g., JD requires Python, not shown) | Max 60/100 |
| Required years of experience not met (< 50% of stated requirement) | Max 65/100 |
| Required certification or credential missing | Max 70/100 |
| No relevant industry experience whatsoever | Max 55/100 |

> ⚠️ Caps are **non-negotiable** and must be stated explicitly in the output alongside the reason.

---

## 📊 Disposition Thresholds

| Score Range | Disposition | Action |
|---|---|---|
| 80–100 | ✅ **ADVANCE** | Schedule technical screen immediately |
| 65–79 | ⏸ **HOLD** | Advance if pool is thin; verify 1–2 key gaps first |
| 50–64 | 🔶 **CONDITIONAL** | Strong gap — advance only if JD requirements flex |
| 0–49 | ❌ **DO NOT ADVANCE** | Fundamental mismatch with role requirements |

---

## 📋 Scorecard Output Format

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🧮 WEIGHTED SCORECARD
Role: [Title]  |  Candidate: [ID]  |  Date: [Date]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Criterion                Weight   Raw   Weighted   Status
─────────────────────────────────────────────────────
Technical Skills Match    35%    [X]/10   [Y]     [Met/Partial/ND]
Experience Depth          25%    [X]/10   [Y]     [Met/Partial/ND]
Demonstrated Impact       20%    [X]/10   [Y]     [Met/Partial/ND]
Leadership & Collab.      10%    [X]/10   [Y]     [Met/Partial/ND]
Communication & Clarity   10%    [X]/10   [Y]     [Met/Partial/ND]
─────────────────────────────────────────────────────
TOTAL FIT SCORE:                         [Z]/100
SCORE CAP APPLIED: [Yes — Reason / No]
DISPOSITION: [ADVANCE / HOLD / CONDITIONAL / DO NOT ADVANCE]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## 🏆 Multi-Candidate Ranking Matrix

When scoring multiple candidates, produce a ranking table:

```
Rank | Candidate ID | Tech  | Exp  | Impact | Leadership | Comms | TOTAL | Disposition
─────┼──────────────┼───────┼──────┼────────┼────────────┼───────┼───────┼─────────────
  1  | Candidate A  | 31.5  | 22.5 | 18.0   |  9.0       |  8.0  | 89.0  | ✅ ADVANCE
  2  | Candidate B  | 28.0  | 20.0 | 14.0   |  7.0       |  7.5  | 76.5  | ⏸ HOLD
  3  | Candidate C  | 21.0  | 15.0 | 10.0   |  5.0       |  6.0  | 57.0  | ❌ DO NOT ADVANCE
```

---

## ⚠️ Scoring Rules

1. **Always cite evidence** for scores above 7 — "scored 8 because: [specific reason]"
2. **Always cite gaps** for scores below 6 — "scored 4 because: [missing element]"
3. **Never average without weighting** — raw averages distort role-specific priorities
4. **Restate the cap** every time one is applied — transparency is non-negotiable
5. **JD overrides defaults** — if the JD states "Python is mandatory," treat it as a hard requirement regardless of weight
