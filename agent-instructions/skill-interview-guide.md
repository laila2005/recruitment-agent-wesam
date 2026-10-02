# Skill: Interview Guide Generator

> **Module ID:** `interview-guide`  
> **Triggered by:** "Generate interview questions," "screening guide," or post-scorecard follow-up  
> **Input:** Scorecard gaps + candidate profile  
> **Output:** Structured behavioral interview guide with rating anchors

---

## 🎯 Objective

Generate a targeted, candidate-specific screening interview guide that addresses verified gaps, tests unverified claims, and probes for the competencies most critical to the role — giving the hiring manager a consistent, defensible framework for every screening call.

---

## 📋 Question Generation Protocol

### Step 1 — Gap-to-Question Mapping

For each **High Impact gap** flagged in the scorecard, generate **2 behavioral questions**.  
For each **Medium Impact gap**, generate **1 behavioral question**.  
Always include **2 technical verification questions** for any "Claimed — Verify" skills.

### Step 2 — Question Types

| Type | Purpose | Format |
|---|---|---|
| **Behavioral (STAR)** | Probe past experience for soft skills, leadership, impact | "Tell me about a time when..." |
| **Technical Scenario** | Verify claimed skills in realistic context | "Walk me through how you would..." |
| **Verification Probe** | Confirm specific resume claims | "You mentioned [X] — can you describe that in detail?" |
| **Motivation/Fit** | Assess alignment with team/culture/role | "What drew you to this type of work?" |

### Step 3 — Rating Anchor Construction

For every question, provide calibrated rating anchors:

```
Strong (4):  [Specific, observable indicators of an excellent answer]
Adequate (3): [Acceptable answer — meets minimum bar]
Weak (1–2):  [Red flag responses — what indicates a gap or misrepresentation]
```

---

## 📤 Output Format

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 SCREENING INTERVIEW GUIDE
Role: [Title]  |  Candidate: [ID]  |  Date: [Date]
Interviewer Focus Areas: [Top 3 gaps from scorecard]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📌 OPENING (2 minutes)
"Thank you for your time today. I'll be asking you about some of the experiences you outlined in your application — please feel free to be as specific as possible. Ready to begin?"

─────────────────────────────────────────────────────
SECTION 1: TECHNICAL SKILLS VERIFICATION
─────────────────────────────────────────────────────

Q1: [Technical question — addresses Gap #1]
Type: Technical Scenario | Priority: HIGH
Context: [Why this question was generated — link to gap]

   Strong (4): [Excellent answer indicators]
   Adequate (3): [Acceptable answer indicators]
   Weak (1–2): [Red flag indicators]

Verification Probe (if needed):
"You mentioned [specific claim]. Can you walk me through a concrete example where you used this in production?"

─────────────────────────────────────────────────────
SECTION 2: EXPERIENCE & IMPACT
─────────────────────────────────────────────────────

Q2: [Behavioral STAR question — addresses Impact Gap]
Type: Behavioral | Priority: HIGH

   Strong (4): Describes measurable outcome, specific scale, personal ownership
   Adequate (3): Describes team effort with some personal contribution
   Weak (1–2): Vague or hypothetical — "I would have..." / "Generally we..."

─────────────────────────────────────────────────────
SECTION 3: LEADERSHIP & COLLABORATION
─────────────────────────────────────────────────────

Q3: [Behavioral question — addresses Leadership Gap]
Type: Behavioral | Priority: MEDIUM

   Strong (4): [Specific answer indicators]
   Adequate (3): [Acceptable answer indicators]
   Weak (1–2): [Red flag indicators]

─────────────────────────────────────────────────────
SECTION 4: MOTIVATION & ROLE FIT
─────────────────────────────────────────────────────

Q4: "What specifically about this role and our company attracted you to apply?"
Type: Motivation | Priority: MEDIUM

   Strong (4): References specific product, team, or technical challenge — shows research
   Adequate (3): General growth motivation with some company awareness
   Weak (1–2): Generic answer — "I'm looking for growth" with zero company-specific signal

─────────────────────────────────────────────────────
CLOSING CHECKLIST
─────────────────────────────────────────────────────
□ Confirm salary expectations vs. budget range
□ Confirm start date availability
□ Ask about competing offers / timeline
□ Explain next steps clearly

INTERVIEWER NOTES TEMPLATE:
Q1: ___/4  Q2: ___/4  Q3: ___/4  Q4: ___/4
Overall Impression (1–5): ___
Advance to Next Round? [ ] Yes  [ ] No  [ ] Conditional
Notes: ________________________________________________
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## ⚠️ Interview Guide Rules

1. **Never generate generic question banks** — every question must reference a specific candidate gap or claim
2. **Include the "why" for each question** — interviewers need context to probe effectively
3. **Rating anchors must be observable** — describe behaviors, not feelings ("candidate seems confident")
4. **Flag legally sensitive areas** — if a question risks touching protected characteristics, replace it
5. **Limit to 4–6 questions per guide** — respect the 30-minute screening call window
6. **Always include a verification probe** for any "Claimed — Verify" skill from the scorecard

---

## ⚖️ Legal Compliance Notes

The following question categories are **prohibited** — Lili will never generate them:

- Age, birth year, or graduation year (unless legally required for role)
- Marital status, family plans, or childcare arrangements
- National origin, citizenship status (unless legally required for role)
- Religious affiliation or practices
- Medical history or disability status
- Political affiliation

If a user requests questions in these areas, Lili will refuse and explain the legal risk.
