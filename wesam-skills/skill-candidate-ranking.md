---
name: candidate-ranking
skill: candidate-ranking
description: Scores and ranks multiple candidates against a single job description using a consistent weighted rubric, producing a ranked matrix with Advance/Hold/Do Not Advance dispositions.
triggers:
  - rank candidates
  - build a shortlist
  - compare applicants
  - top candidates
  - candidate matrix
  - who should advance
---

You are executing the Candidate Ranking and Shortlist skill.

INPUTS REQUIRED:
- One Job Description (JD) — same for all candidates
- All candidate materials (resumes, portfolios, or both)

CRITICAL: Build the rubric from the JD BEFORE reviewing any candidate. Never adjust criteria after seeing results.

EVALUATION STEPS:
1. Extract from JD: must-have requirements, preferred qualifications, weights, and any hard constraints.
2. Define scoring rubric with explicit criteria and weights — document it in Audit Notes.
3. Score EVERY candidate against the SAME criteria, weights, and evidence standard.
4. Do NOT use: pedigree, school name, name recognition, personal similarity, or vague "culture fit."
5. For each candidate:
   - Parse materials into comparable evidence
   - Mark each criterion: Met / Partially Met / Not Demonstrated
   - Apply score caps for unmet mandatory requirements
   - Calculate weighted score (0–100)
   - Assign confidence: High / Medium / Low
6. Check if ranking differences reflect real qualification gaps vs. evidence quality gaps — flag if uncertain.
7. When scores are within 5 points, declare a tie and specify what evidence would separate them.

OUTPUT FORMAT (follow exactly):

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 CANDIDATE RANKING MATRIX
Role: [Title] | Candidates Evaluated: [N] | Date: [Date]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
| Rank | ID | Score | Confidence | Must-Haves | Differentiators | Key Gaps | Disposition |
|------|----|-------|------------|------------|-----------------|----------|-------------|
| 1 | [ID] | [X]/100 | [H/M/L] | [Met/Partial/ND] | [top strength] | [top gap] | ✅ ADVANCE |
| 2 | [ID] | [X]/100 | [H/M/L] | ... | ... | ... | ⏸ HOLD |
| 3 | [ID] | [X]/100 | [H/M/L] | ... | ... | ... | ❌ DO NOT ADVANCE |

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📝 CANDIDATE RATIONALES (80–150 words each)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[ID] — ADVANCE:
[Rationale with top 2 strengths, top gap, and condition for advancement]

[ID] — HOLD:
[Rationale with reason for hold and specific verification needed]

[ID] — DO NOT ADVANCE:
[Rationale with fundamental mismatch and which mandatory requirement is unmet]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔍 AUDIT NOTES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Rubric weights used: [list criteria and weights]
Score caps applied: [list any caps and reasons]
Tied candidates: [list and evidence needed to separate]
Material uncertainties: [evidence quality issues that affect ranking reliability]

RULES:
- Use candidate IDs or initials — minimize full name usage during evaluation
- Never manipulate criteria after seeing results to favor a candidate
- Never rank candidates scored against different rubrics — rescore all against one shared rubric first
- Call deliver_section(title="Candidate Ranking and Shortlist", content=<full output>) when done
