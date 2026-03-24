# Feature Research

**Domain:** Mobile feedback/survey form — university course evaluation (single-use, anonymous)
**Researched:** 2026-03-24
**Confidence:** HIGH for table stakes (well-established UX research); MEDIUM for differentiators (context-specific)

## Feature Landscape

### Table Stakes (Users Expect These)

Features users assume exist. Missing these = product feels incomplete or broken on mobile.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Mobile-optimized layout | 83% of users abandon non-mobile-friendly surveys (WebSearch, Survicate) | LOW | Touch targets >= 44px, no horizontal scroll, thumb-reachable submit |
| Rating scale with clear endpoints | Standard for evaluation forms; users expect labeled anchors | LOW | 1=sehr gut, 8=sehr schlecht — only endpoints labeled, per PROJECT.md decision |
| Consistent scale throughout | Users build mental model after first question; switching scales causes errors | LOW | All rating items must use same 1–8 range |
| Required field enforcement | Without it, incomplete submissions corrupt data | LOW | Gruppenauswahl is the only hard requirement per PROJECT.md |
| Submission confirmation | Users need to know the form was received; no confirmation = rage-tap or re-submit | LOW | "Danke"-screen after successful POST to JSONBin |
| Free-text fields for qualitative feedback | Expected by users who have opinions beyond the scale | LOW | Per PROJECT.md: optional, per-question, individually configured |
| Sensible grouping / section headers | Long forms without structure feel overwhelming on mobile | LOW | 14 categories from Lehrgangskritik need visual grouping |
| Progress indication | Users want to know how far they are in a long form | LOW | Section counter or scroll progress bar; critical for 14 categories |
| Error feedback on submit failure | Network errors must be communicated; silent failure destroys trust | LOW | JSONBin POST can fail; show retry option |

### Differentiators (Competitive Advantage)

Features that set this app apart from a generic Google Form or paper questionnaire.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Ausbilder auto-assignment by group | Zero lookup errors; faster form completion; removes a decision from the user | MEDIUM | Group -> trainer mapping table; show exactly 2 trainers for individual rating |
| RUB design system / brand consistency | Feels official, not like a generic survey link; increases completion rate | LOW | Reuse RubFlama fonts, color scheme, card layout from pruefung/ |
| Compact 1-tap rating row | A horizontal row of 8 numbered buttons is faster than a dropdown; one thumb interaction per question | LOW | Visual design: 8 tight circular/square buttons, only 1 and 8 labeled |
| Offline-resilient submit with retry | Mountain venue may have poor connectivity; silent failure without retry is a trust killer | MEDIUM | Detect fetch failure, show "Erneut senden" button; localStorage draft optional |
| Collapsible optional free-text | Keeps the form visually short by default; users who want to elaborate can expand | LOW | `<details>`/chevron toggle per question; collapsed = clean, open = textarea |
| Admin Excel export with summary sheet | Raw data + computed group averages in one click; replaces manual data entry from paper forms | MEDIUM | SheetJS already used in pruefung/; add aggregate tab per category |

### Anti-Features (Commonly Requested, Often Problematic)

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Duplicate submission prevention (cookie/IP) | "Each student should only submit once" | Cookies are cleared, IPs are shared (university WiFi), breaks anonymous intent, adds engineering complexity for ~80 users | Trust + optional name field. If a student submits twice, it's noise, not a crisis. PROJECT.md explicitly out-of-scoped this. |
| Real-time results dashboard | "See how we're doing live" | Requires authenticated route, live polling or websockets, admin UI — disproportionate complexity for one-time use | Admin Excel export is sufficient; run it once after the trip. |
| Login / authentication | "Ensure only enrolled students submit" | Privacy concern, requires identity infrastructure, contradicts anonymous design goal | Anonymous access with Gruppenauswahl as implicit filter |
| Multi-page / wizard flow | "One question per screen looks modern" | Each page transition risks losing state on mobile; adds navigation complexity; 14 categories would become 14 screens | Single scrollable page with section anchors; progress bar shows position |
| Conditional branching (skip logic) | "Show ski questions only to ski groups" | Engineering complexity; the form is already group-filtered via Ausbilder assignment; full branch logic for 80 users is overkill | All students see all sections; snowboard sections are short and clearly labeled |
| Email confirmation to respondent | "Students want a receipt" | Requires collecting email (breaks anonymity) or server-side mail infrastructure | Submission confirmation screen is sufficient |
| Offline-first with full local sync | "What if there's no internet at all?" | Service workers + sync queue on a single-file no-build app adds significant complexity | Detect failure on submit, offer retry; if truly offline, paper backup is the fallback |

## Feature Dependencies

```
Gruppenauswahl (required field)
    └──enables──> Ausbilder auto-assignment
                      └──enables──> Ausbilder individual rating (2 items)

Rating scale component
    └──used by──> All 14 evaluation categories
    └──used by──> Ausbilder individual rating

Submission to JSONBin
    └──triggers──> Confirmation screen
    └──on failure──> Retry button

Admin export (Excel)
    └──reads from──> JSONBin GET (all responses)
    └──uses──> SheetJS (already available in pruefung/)
```

### Dependency Notes

- **Gruppenauswahl requires being first in form:** All downstream logic (Ausbilder names, group filter in export) depends on it being set early.
- **Ausbilder assignment requires group selection:** Cannot render the 2-trainer rating block until group is known. Should render dynamically on group change, not on submit.
- **Admin export requires JSONBin read access:** Export is gated behind `?admin=true` URL param (same pattern as pruefung/).
- **Confirmation screen requires successful POST:** Never show "Danke" before receiving a 2xx from JSONBin.

## MVP Definition

### Launch With (v1)

Minimum viable product — digitizes the paper form with no regressions.

- [ ] Gruppenauswahl (required) — gate for Ausbilder assignment
- [ ] Rating scale 1–8 for all 14 categories from Lehrgangskritik — parity with paper form
- [ ] Ausbilder auto-assignment + individual rating per Ausbilder — key improvement over paper
- [ ] Optional name field — preserves anonymity choice
- [ ] Optional free-text per configured question — preserves qualitative feedback channel
- [ ] Submit to JSONBin v3 — data persists after the trip
- [ ] Submission confirmation screen — trust signal
- [ ] Error handling + retry on POST failure — mountain connectivity is unreliable
- [ ] Admin export as Excel (.xlsx) via ?admin=true — replaces paper data entry
- [ ] Mobile-first layout with RUB design system — matches pruefung/ quality bar

### Add After Validation (v1.x)

Features to add if real usage reveals a gap.

- [ ] Section progress indicator — add if testers find the form feels endless
- [ ] Collapsible free-text fields — add if form feels visually heavy on first render

### Future Consideration (v2+)

Features to defer — not justified for a ~80 person one-time event.

- [ ] Aggregate summary view in admin — SheetJS summary tab partially covers this; full dashboard deferred
- [ ] Export to CSV in addition to Excel — only if admin requests it

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Rating scale 1–8 (all categories) | HIGH | LOW | P1 |
| Gruppenauswahl (required) | HIGH | LOW | P1 |
| Ausbilder auto-assignment | HIGH | LOW | P1 |
| Submit to JSONBin + confirmation | HIGH | LOW | P1 |
| Error handling + retry | HIGH | LOW | P1 |
| Admin Excel export | HIGH | MEDIUM | P1 |
| Optional free-text fields | MEDIUM | LOW | P1 |
| Mobile-optimized layout + RUB design | HIGH | LOW | P1 |
| Optional name field | LOW | LOW | P1 |
| Progress indication | MEDIUM | LOW | P2 |
| Collapsible free-text UI | MEDIUM | LOW | P2 |
| Offline draft (localStorage) | LOW | MEDIUM | P3 |
| Real-time dashboard | LOW | HIGH | OUT |
| Duplicate prevention | LOW | MEDIUM | OUT |

**Priority key:**
- P1: Must have for launch
- P2: Should have, add when possible
- P3: Nice to have, future consideration
- OUT: Explicitly excluded

## Competitor Feature Analysis

This is a purpose-built tool, not a general survey platform. Reference points are Google Forms, Typeform, and the existing pruefung/ app.

| Feature | Google Forms | Typeform | Our Approach |
|---------|--------------|----------|--------------|
| Rating scale | 1–5 or 1–10, linear scale | Emoji/NPS, one-question-per-screen | 1–8 custom, all on one scrollable page |
| Group-based routing | Conditional sections (complex) | Logic jumps (complex) | Direct: group selection -> JS renders trainer block |
| Trainer individual rating | Manual: user selects from list | Same | Automatic: group -> trainer names resolved in JS |
| Submission backend | Google Sheets | Typeform storage | JSONBin v3 (consistent with rest of project) |
| Admin export | Google Sheets built-in | CSV download | Excel (.xlsx) via SheetJS, summary tab included |
| Offline handling | None (requires connectivity) | None | Detect failure, retry button |
| Design customization | Limited (Google branding) | Good | Full: RUB brand identity, single-file, no third-party UI |
| Anonymity | Google account optional | No tracking option | Anonymous by default; name optional |

## Sources

- [In-App Survey Design Best Practices — Qualaroo](https://qualaroo.com/blog/in-app-survey/)
- [Mobile App Survey Best Practices — Survicate](https://survicate.com/blog/mobile-app-survey/)
- [Rating Scales in UX Research — Nielsen Norman Group](https://www.nngroup.com/articles/rating-scales/)
- [Rating Scale Best Practices — MeasuringU](https://measuringu.com/rating-scale-best-practices-8-topics-examined/)
- [Prevent Duplicate Form Submissions — SurveyJS](https://surveyjs.io/survey-creator/documentation/end-user-guide/prevent-duplicate-forms-submissions)
- [Course Evaluation Form Template — Jotform](https://www.jotform.com/form-templates/sample-course-evaluation)
- PROJECT.md requirements and out-of-scope decisions (primary source for this project's constraints)

---
*Feature research for: Mobile feedback form — Schneesport-Exkursion Valmorel, RUB Sportwissenschaft*
*Researched: 2026-03-24*
