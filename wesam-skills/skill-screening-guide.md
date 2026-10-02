---
name: screening-interview-guide
skill: screening-interview-guide
description: Generates a structured, candidate-specific screening interview guide with behavioral questions, rating anchors, and a decision rule — usable in a 20–30 minute phone screen.
triggers:
  - create screening questions
  - phone screen
  - interview guide
  - validate gaps
  - recruiter screen
---

You are executing the Screening Interview Guide skill.

INPUTS REQUIRED:
- Job criteria (from JD) — defines what competencies must be tested
- Candidate scorecard or gap list — drives candidate-specific questions

If no scorecard exists yet, ask for the JD and candidate materials first, then generate the guide after evaluating.

GUIDE CONSTRUCTION STEPS:
1. Start from JD must-haves and unresolved claims in candidate evidence — do NOT generate generic questions.
2. For each gap or unverified claim, write a targeted question that:
   - Tests the specific competency in context (not in the abstract)
   - Uses behavioral / evidence-seeking phrasing: "Tell me about a time when..." / "Walk me through..."
   - Does NOT lead the candidate toward a correct answer
3. For each question, define:
   - Competency being tested
   - Strong signals (what a great answer looks like — observable behaviors, specifics, metrics)
   - Weak signals (red flags — vague, hypothetical, evasive, or contradictory answers)
   - Rating anchor: 4 = Strong, 3 = Adequate, 2 = Weak, 1 = Unacceptable
4. PROHIBITED question topics (never include):
   - Age, birth year, graduation year (unless legally required)
   - Marital status, family plans, childcare
   - National origin, citizenship (unless legally required)
   - Religious practices or affiliations
   - Medical history, disability status
   - Political affiliation
5. Total questions: 6–10 core + up to 5 candidate-specific probes.
6. Design for a 20–30 minute screening call.

OUTPUT FORMAT (follow exactly):

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 INTERVIEW OBJECTIVE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Role: [Title] | Candidate: [ID] | Duration: 20–30 min
Focus areas: [Top 3 competencies or gaps to probe]

📌 OPENING SCRIPT (read verbatim):
"Thanks for making time today. I'll be asking about specific experiences from your background — 
the more concrete and detailed you can be, the better. Ready to begin?"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔵 CORE QUESTIONS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Q[N]: [Behavioral or scenario question]
Competency: [What this tests]
Strong (4): [Specific observable indicators of an excellent answer]
Adequate (3): [Acceptable answer — meets the bar]
Weak (1–2): [Red flag responses]
Interviewer note: [Why this question matters for THIS role]

[Repeat for each core question]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔴 CANDIDATE-SPECIFIC PROBES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

P[N]: [Question targeting a specific unverified claim or resume gap]
Context: [The specific claim or gap this addresses]
Strong (4): [Ideal response]
Weak (1–2): [Red flag response]

[Repeat for each probe — max 5]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 CLOSING CHECKLIST
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
□ Confirm compensation expectations vs. budget
□ Confirm start date availability
□ Ask about competing offers or decision timeline
□ Explain next steps clearly

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚖️ RATING RUBRIC & DECISION RULE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Score each question 1–4. Record in this template:
Q1: __/4  Q2: __/4  Q3: __/4  Q4: __/4  Q5: __/4
P1: __/4  P2: __/4

DECISION RULE:
- Average ≥ 3.2 AND no question scored 1: ADVANCE to technical round
- Average 2.5–3.1 OR one score of 1: HOLD — escalate for second opinion
- Average < 2.5 OR two+ scores of 1: DO NOT ADVANCE

Overall decision: [ ] Advance  [ ] Hold  [ ] Do Not Advance
Interviewer notes: ___________________________________________

RULES:
- Every question must link to a specific JD requirement or candidate gap
- Never generate questions about protected characteristics
- If user requests a prohibited question, refuse and explain the legal/compliance risk
- Call deliver_section(title="Screening Interview Guide", content=<full output>) when done
