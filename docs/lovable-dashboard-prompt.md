# TalentScout AI — Lovable.dev Dashboard Prompt

> **Tool:** [Lovable.dev](https://lovable.dev)  
> **Use Case:** Interactive Web Comparison Dashboard for Hackathon Demo

---

## 📋 Copy & Paste Prompt for Lovable

```text
Build a modern, high-polish HR Recruitment & Candidate Triage Dashboard called "TalentScout AI — Powered by Lili". 

The application should look like a world-class B2B SaaS tool (aesthetic: Linear, Raycast, or Vercel; sleek dark/light mode support, clean typography, soft borders, subtle gradients).

KEY FEATURES & LAYOUT:

1. Top Navigation Bar:
   - App Logo & Title: "TalentScout AI" with badge "Lili Agent Active"
   - Job Opening Dropdown Switcher: 
     * "Senior Backend Engineer (TechFlow)"
     * "Senior Frontend / React Lead (PixelCraft)"
     * "AI Applications Engineer (NeuroFlow)"
   - "Bias-Free Anonymize Mode" toggle switch: When turned ON, replace candidate names with anonymized IDs (e.g., "Sarah Lin" becomes "Candidate C-01") and hide any university/location info.
   - Button: "+ Upload Resumes (Batch PDF/DOCX)" that opens a drag-and-drop modal.

2. Executive Pipeline KPI Cards (Top Row):
   - Total Applicants Screened: 48 candidates
   - Tier 1 Fast-Track: 4 candidates (Top 8%)
   - Time Saved This Round: 14.5 Hours (85% reduction)
   - Average Fit Score: 76.4 / 100

3. Candidate Triage & Comparison Table (Main View):
   - Filter Tabs: All (48), 🟢 Tier 1: Fast-Track (4), 🟡 Tier 2: Bench (12), 🔴 Tier 3: Archive (32).
   - Search bar to filter by skill or keyword.
   - Table Columns:
     * Rank & Candidate Name/ID
     * Fit Score: Visual circular or bar indicator (0–100) with color coding (Green 85+, Amber 70–84, Red <70)
     * Status Badge: "🟢 Fast-Track", "🟡 Bench / Review", "🔴 Does Not Meet Bar"
     * Core Stack Match: Colored pill tags for matched skills (e.g., React 18, Next.js, TypeScript) and grey tags for missing
     * Experience: Total years (e.g., "6.5 yrs")
     * 1-Sentence Executive Takeaway (e.g., "Storybook architect across 6 teams; verified LCP 1.4s performance win.")
     * Actions: "View Full Scorecard" button & "Schedule Interview" button.

4. Slide-Over Drawer / Modal (Candidate Deep-Dive):
   When clicking any candidate in the table, slide open an interactive full evaluation panel with tabs:
   - Tab 1: "Scorecard":
     * Radar or progress bars for: Technical Skills (40%), Experience (25%), Impact (20%), Leadership (10%), Communication (5%).
     * Evidence-Referenced Strengths (bullet points with direct quote citations from resume).
     * Gaps & Verification Flags (with severity tags: High, Medium, Low).
   - Tab 2: "Screening Guide":
     * 3 targeted behavioral & technical interview questions auto-generated for this specific candidate.
     * Calibrated rating anchors for each question (Strong 4 vs. Weak 1 indicators).
   - Tab 3: "Outreach Email":
     * Pre-drafted email ready to copy.
     * If Tier 1: Enthusiastic 1st-round interview invitation mentioning their specific achievements.
     * If Tier 3: Respectful, constructive feedback notification.
     * "Copy to Clipboard" button with toast notification.

5. Pre-Loaded Mock Data:
   Include real mock data for the 3 candidates from our Senior Frontend Lead role:
   - Candidate 1: Sarah Lin (or Candidate C-01) — Score: 94/100, Tier 1, React/Next.js/TS, 6.5 yrs, Fast-track.
   - Candidate 2: Devin R. (or Candidate C-02) — Score: 78/100, Tier 2, React/Redux/TS, 5.2 yrs, Bench.
   - Candidate 3: Jordan Blake (or Candidate C-03) — Score: 48/100, Tier 3, WordPress/React, 3.1 yrs, Archive (Unmet 5-yr mandatory minimum).

Use Lucide icons, smooth animations with Tailwind CSS, and shadcn-style UI components.
```
