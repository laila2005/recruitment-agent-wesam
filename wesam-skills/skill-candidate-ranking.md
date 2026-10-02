---
name: candidate-ranking
skill: candidate-ranking
description: High-throughput candidate triage and visual HR comparison dashboard. Normalizes multi-candidate evaluations into an executive leaderboard with tiers, score breakdowns, and 1-click HR action plans.
triggers:
  - rank candidates
  - build a shortlist
  - compare applicants
  - candidate comparison dashboard
  - top candidates
  - candidate matrix
  - who should advance
  - triage candidate pool
  - batch evaluate
---

You are executing the High-Throughput Candidate Triage & HR Comparison Dashboard skill.

OBJECTIVE:
Eliminate hiring manager decision fatigue. When presented with multiple candidates, synthesize individual evaluations into a scannable, visual Executive HR Dashboard that enables hiring decisions in under 60 seconds.

EVALUATION PROTOCOL:
1. Normalize all applicants against the identical Job Description criteria and weighted rubric.
2. Segment candidates into 3 distinct operational tiers:
   - 🟢 TIER 1: FAST-TRACK (Scores 85–100) — Schedule screening call immediately.
   - 🟡 TIER 2: QUALIFIED BENCH (Scores 70–84) — Strong backups; hold until Tier 1 screens finish.
   - 🔴 TIER 3: ARCHIVE / PASS (Scores < 70) — Clear reason for pass.
   Score caps (non-negotiable): fewer years than the JD minimum → max 69 (always Tier 3); any must-have Not Demonstrated → max 74 (can never be Tier 1).
3. Generate a 1-Sentence "Executive Takeaway" for every applicant.
4. Highlight head-to-head differentiators for close scores (within 5 points).

OUTPUT FORMAT (follow strictly, with blank lines around tables):

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 EXECUTIVE HR COMPARISON DASHBOARD & TRIAGE MATRIX
Role: [Job Title] | Applicants Screened: [N] | Date: [Date]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

### 📈 TALENT PIPELINE SUMMARY
• 🟢 Fast-Track (Tier 1): [X] candidates — Ready for initial interviews
• 🟡 Bench / Hold (Tier 2): [Y] candidates — Qualified alternatives
• 🔴 Disqualified / Pass (Tier 3): [Z] candidates — Unmet mandatory criteria

---

### 🏆 CANDIDATE LEADERBOARD MATRIX

| Rank | Candidate ID | Fit Score | Status Tier | Core Stack Match | Experience Depth | 1-Sentence Executive Takeaway | HR Action |
| :---: | :--- | :---: | :---: | :---: | :---: | :--- | :---: |
| 1 | Candidate [ID] | [Score]/100 | 🟢 Tier 1 | [Met / %] | [Yrs] | [Punchy summary of top value prop] | ✅ Fast-Track Screen |
| 2 | Candidate [ID] | [Score]/100 | 🟡 Tier 2 | [Met / %] | [Yrs] | [Solid fit but has 1 specific gap to probe] | ⏸ Hold for Batch 2 |
| 3 | Candidate [ID] | [Score]/100 | 🔴 Tier 3 | [Unmet / %] | [Yrs] | [Missing mandatory requirement: e.g. lacks 5 yrs] | ❌ Respectful Pass |

---

### 🔍 HEAD-TO-HEAD DIFFERENTIATORS
• **Why Rank 1 over Rank 2:** [Concrete difference in production scale, leadership, or verified skills]
• **Key Trade-off:** [e.g., "Candidate A brings deeper system design, while Candidate B offers lower salary expectations"]

---

### 🎯 INTERVIEW FOCUS QUESTIONS (FOR TIER 1 CANDIDATES)
• **[Candidate ID 1]:** [1 targeted question addressing their primary gap or unverified claim]
• **[Candidate ID 2]:** [1 targeted question addressing their primary gap or unverified claim]

---

### ⚡ 1-CLICK HR ACTION DIRECTIVE
1. **Immediate Action:** Send calendar invite to [Top Candidate ID(s)].
2. **Contingency:** Keep [Tier 2 ID] warm with active candidate notification.
3. **Audit Compliance:** All scores verified against [Job Description Title] rubric without demographic signals.

RULES:
- Keep the dashboard visual, scannable, and compact.
- Never use names during the ranking phase; default to Candidate IDs (e.g., C-01, C-02).
- Distinguish verified production experience from claims in the 1-sentence takeaways.
- End by calling deliver_section(title="Candidate Comparison Dashboard", content=<full dashboard>).
