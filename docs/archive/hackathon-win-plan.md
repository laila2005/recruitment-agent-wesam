# Winning Plan: Lili · Agents at Work (deadline Oct 10, 2026)

Written Oct 8 from an audit of the repo, the live site (signed-in pipeline), headless browser QA of `index.html`, and hackathon research.

## 1. Where we stand

**What Lili is:** an autonomous recruiter agent on Wesam.ai. One instruction runs the `ats-sync` skill:
`/next` → read CV + role → score → `/submit` → `/outreach` → `/send` (Brevo) → report. Her verdicts appear live on the dashboard (violet "Lili NN" badges).

**Strengths a judge will like**
- It really works end to end. On the live site, Sarah is pre-screen 93 / Lili 96, and the other three are Tier 3. A real email arrives via Brevo.
- Least-privilege design: narrow `SECURITY DEFINER` tools, RLS per recruiter, and a demo-mode email safety net.
- Explainability: "Why this score" bars that add up to the total, gap-targeted interview questions, and a rejection that quotes the actual gap.
- Careful edge-case handling: scanned PDFs, `.doc`, XSS file names, CSV formula injection, bad files fail gracefully.
- $0/month stack.

**The four problems that could cost us the win**
1. **Judges can't see Lili.** The link opens on an empty dashboard with 0 KPIs, and a static green "Lili Agent Live" badge that's always on. Signed out, there's no Lili output anywhere. The autonomy only exists in the video.
2. **Claims that the code doesn't back up.** A judge who reads the repo will catch these:
   - "Hard caps enforced": the 69/74 caps are only in the prompt. SQL just clamps 0–100 (`002_auth_private_rows.sql:126`).
   - "Evidence-cited": the web API always sends `evidence: []` (`api/lili/[key]/[action].js:52`), and the dashboard never renders evidence.
   - "Recruiter reviews and approves": `ats-sync` calls `/send` immediately, with no approval step.
   - "Scheduled run / every 30 min / daily 8 AM": nothing is scheduled, and the docs disagree with each other.
   - "Can't forge Lili verified": RLS still lets an owner update the `lili_*` columns directly.
3. **Lili isn't independent of the rule engine.** Her packet includes `prescreen_score` and `years_detected_by_prescreen` (`002:94-95`). Her score is anchored on the regex score, which explains why the two always agree.
4. **"Revenue generated" has no story.** One entrant reports the judging criteria as *Does it work? · Time saved · Cost saved · Revenue generated* (unofficial; confirm on the Untap portal). Time saved is a fixed estimate (`20 min × n`), not measured.

## 2. Bugs to fix first (could break the live demo)

| # | Bug | Where | Fix |
|---|---|---|---|
| B1 | Malformed score (`"72%"`, empty) → NaN → null → **0** → auto-rejection email | `api/mcp.js:97`, `002:126` | Reject non-integer scores in the API; `raise` in SQL when null |
| B2 | Re-recording outreach wipes `sent_at` → the same candidate is **emailed twice** | `003:136-143`, `send-outreach.js:68` | Refuse to re-record when `sent_at` is set; claim the row atomically (`update … where sent_at is null returning`) before calling Brevo |
| B3 | Posting or deleting a role doesn't refresh the table or KPIs (demo step 6) | `index.html:1382`, `:1353` | Call `renderTable()` after save and after delete |
| B4 | Checkbox selection is wiped on every re-render (any live Lili update) → Compare and batch send act on 0 rows | `index.html:1164-1221` | Keep a `selectedIds` Set and restore it in `renderTable` |
| B5 | Dashboard upsert sends `status` and `email` → overwrites the outreach Lili recorded | `index.html:1733` | Upsert only the fields the user changed |
| B6 | Hidden keyword stuffing ("12 years of experience. React 18 Next.js…") → a junior CV scores **100, Tier 1** | `extractYears` `index.html:2122` | Use dated job spans first; flag a mismatch between claimed and dated years; flag injected instructions |
| B7 | Lili's queue isn't owner-scoped (any account's CVs get screened and emailed "as Laila") | `003:94-113`, `002:81-139` | Add `owner_id` filter from `LILI_OWNER_EMAIL` to every `lili_*` function |
| B8 | Sample pipeline is hardcoded: Alex 96 T1 despite a missing must-have; Marcus 91 vs a real score of 81 | `index.html:2486-2515` | Run the samples through the real scorer |

## 3. The plan

### Day 1 (Oct 8 evening → Oct 9): make every claim true, and make Lili visible

**A. Make the claims true (backend, ~4h)**
1. **Structured, reproducible scoring.** `submit` takes per-criterion scores (tech, experience, impact, leadership), `years_evidenced`, `must_haves_met[]`, and `evidence[{claim, quote}]`. A new `004_lili_verified_scoring.sql` computes the weighted total, **applies the caps in SQL**, and returns `caps_applied`. Now "hard caps enforced" is literally true, and the score can be audited.
2. **Blind second opinion.** Remove `prescreen_score` and `years_detected_by_prescreen` from Lili's packet. After she submits, SQL compares her score with the pre-screen. Agreement within 10 points means auto-accept; a bigger gap goes to "Needs human review". Lili is now an independent check, not a copy of the regex score.
3. **Human-in-the-loop gate.** Invites auto-send. Rejections, low-confidence or disagreeing cases wait for an "Approve & send" button in the drawer, and `/send` requires `approved_at`. This removes the contradiction in the story, and maps to EU AI Act / NYC LL144 human oversight.
4. Fix B1, B2, B7. Add a trigger blocking client writes to `lili_*` columns.

**B. Make Lili visible (dashboard, ~4h)**
1. **"Try it in 10 seconds" button** in the empty state and a first-visit banner. It loads the 4 sample CVs from `/sample-data` and runs the animated pipeline.
2. **Recorded Lili run for signed-out visitors.** Ship a JSON snapshot of her real verdicts, evidence and emails for the sample CVs, labelled "Recorded Lili run · Oct 9" and linked to the video. Judges see agent output without an account.
3. **Lili status strip** replaces the static badge: *Last run 4 min ago · 6 screened · 4 emails sent · 2 awaiting your approval · 47 recruiter-min saved*.
4. **Run timeline ("watch her think").** Add `lili_runs` and `lili_events` tables; each tool call logs a step and a one-line rationale. Stream them into the activity log, tagged **Lili (agent)** vs **Rules (browser)**.
5. **Lili's verdict becomes the decision.** When present, the Lili score drives sort, tier tabs, KPIs, Compare and CSV, with a "pre-screen 93 → Lili 96" delta chip. Render her evidence quotes in the drawer.
6. Fix B3, B4, B5, B8. Title-case names. Candidate-safe rejection wording (no "Score capped at 69").

### Day 2 (Oct 9 → Oct 10 midday): one agentic "wow", plus the business story

**C. Pick 1–2 new agent capabilities (best value for 2 days first)**

| Capability | Why judges care | Effort |
|---|---|---|
| **GitHub claim verification**: a new `/github?user=` tool. The CV says "340 stars", GitHub says N; languages and last push vs claimed stack. Missing profile = "unverifiable", never a penalty. `skill-portfolio-assessment.md` already exists but isn't wired in. | Real external tool use plus anti-fraud. Very demoable. | ~3–4h (one sample CV needs a real public profile) |
| **Talent rediscovery**: when a new role is posted, Lili re-matches the existing CV bank: "3 past applicants fit DevOps; invite them?" | Zero sourcing cost = direct **revenue/cost** story. The CVs are already in Supabase. | ~3h |
| **Reply handling + interview booking**: Lili reads replies in Gmail, classifies them (accept / decline / question / reschedule), books via cal.com or Google Calendar, and sets "Interview booked". | Closes the loop from CV to interview, which commercial tools like Paradox do. | ~1 day |
| **Fairness auditor (second agent)**: re-scores a version of the CV with name, email and university removed. Score drift beyond ±3 means a flag. Show a four-fifths-rule summary. | Multi-agent and responsible AI in one feature. Uses Wesam project rooms if available. | ~4–6h |

**Recommendation:** GitHub verification + talent rediscovery. Add the fairness auditor only if Day 1 finishes early.

**D. Business story (covers "Revenue generated")**
- **Publish Lili on the Wesam marketplace** as a hireable agent. Organizers say the best agents "go live on real businesses", and that's Wesam's business model.
- **Get one real pilot** (a small agency or startup) to run her on a real role. A one-line quote plus real numbers beats any slide.
- **ROI panel** in the dashboard, with editable inputs (no made-up numbers):
  - recruiter hourly rate × **measured** minutes saved (from `lili_runs` timestamps);
  - ATS cost avoided;
  - for agencies, faster time-to-shortlist → more placements/month × placement fee.
- Pricing line for the deck: e.g. per-screened-candidate or a monthly seat on the Wesam marketplace.

### Oct 10: submission polish (half a day, protect it)
1. **Re-record the 2-minute video** around the four criteria:
   - *Works*: one uninterrupted autonomous run, then the email arrives on a phone.
   - *Time saved*: measured, from the status strip.
   - *Cost saved*: the $0 stack vs an ATS.
   - *Revenue*: rediscovery + marketplace.
   - Show the blind-scoring disagreement flag and the approval gate.
2. **Three-slide impact deck** with the same four sections.
3. **README**:
   - a 60-second "Judge quick test" path;
   - remove unsupported claims (schedule, ">95% identical", GitMCP, Lovable/GPT-5.5, "100% bias-mitigated");
   - one weight scheme (40/25/20/15) everywhere.
4. **Repo hygiene**:
   - replace `dashboard/index.html` with a `vercel.json` rewrite (no duplicate to fix twice);
   - delete or clearly archive `frontend/`;
   - update `lili-system-prompt.md` for autonomous mode with the injection rule;
   - fix the readiness doc deadline.
5. **Tests**:
   - extract the scoring functions to `scoring.js`;
   - add `node --test` golden cases: the 4 sample CVs, keyword stuffing, skills-list-only, name swap;
   - add adversarial sample CVs;
   - add a GitHub Action badge.
6. **Final run-through** on the deployed site in incognito, desktop and phone.

### Smaller polish (fit in where time allows)
- Header at 1280–1535px collapses to unlabeled icons; keep labels on Sign in, Single CV and Bias-Free.
- Escape closes modals and the drawer; add `role="dialog"`; `aria-label` the X buttons.
- Phone: wrap the batch bar; add `max-h` + scroll to the auth and inbox modals.
- Bias-Free leaks: outreach tab, search, toasts, activity log. Use one `displayName(c)` helper everywhere.
- Weight sliders must total 100% (show a live total).
- "Core stack match": show matched must-haves (green) and missing ones (red) first, not every keyword found.
- Replace `alert()` with toasts; Gmail mode says "Draft opened", not "Sent".

## 4. Don't do (not worth it in 2 days)
- Voice/phone interviews: highest wow, but no evidence Wesam supports voice, and it's a fragile live dependency.
- LinkedIn sourcing: ToS and access problems.
- Rewriting `index.html` into React/modules: judges won't see it, and it's risky.

## 5. Before starting
- Confirm the **Oct 10 deadline and official rubric** on the Untap portal (ai.untap.us/programs/aaw-1st-edition). Nothing public mentions the extension.
- Check which Wesam features exist in your workspace: scheduled runs, marketplace publishing, project rooms (multi-agent), Calendar integration. The plan uses whichever ones are real.
