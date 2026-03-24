# Project Research Summary

**Project:** Feedbackbogen Valmorel — Schneesport-Exkursion 2026
**Domain:** Mobile-first single-file feedback form, GitHub Pages, JSONBin v3
**Researched:** 2026-03-24
**Confidence:** HIGH

## Executive Summary

This is a purpose-built, one-time-use feedback form for ~80 university students on a ski trip. The established pattern in this project family — a single `index.html` with inline CSS and JS, external fonts, JSONBin v3 as the serverless backend, deployed on GitHub Pages — is the right approach and is directly proven by the existing `pruefung/` app. No new technology choices are needed; the correct move is to follow the `pruefung/` conventions as closely as possible, extending them with the feedback-specific features (rating scale, group-to-Ausbilder mapping, 14 evaluation categories).

The recommended approach is to build in 4 sequential phases: project scaffolding and data model first, then the student form UI with the rating scale and Ausbilder logic, then submission and error handling, and finally the admin export view. This order matters because the group-to-Ausbilder lookup table is the central data structure that several other components depend on — it must be defined correctly before any rendering logic is built. The architecture is inherently simple; the main complexity is the mobile UX of an 8-point rating scale across 14 categories.

The top risk is the JSONBin read-modify-write race condition: if two students submit simultaneously, the later PUT silently overwrites the earlier one. The mitigation is to store submissions as a flat object keyed by a client-generated UUID rather than an array, so concurrent writes do not collide. A close second risk is mobile UX quality — the 8-point rating scale must use large tap targets (44x44px minimum) and be tested on a real 360px device, and iOS textarea keyboard overlay must be handled with `min-height: 100svh` and `scroll-padding-bottom`. Both risks are well-understood and fully preventable during implementation.

## Key Findings

### Recommended Stack

The entire stack is inherited from the existing project family with no new dependencies required. Vanilla HTML/CSS/JS in a single `index.html` file is the only viable approach given the no-build, no-framework constraint. JSONBin v3 is the project-wide backend standard; the GET-then-PUT append pattern is proven in `pruefung/`. SheetJS 0.20.3 handles the admin Excel export, loaded lazily from the official CDN. Fonts are external `fonts/` files — not Base64 inline — following `pruefung/` convention to avoid the 463 KB file size penalty from `huettenabend/`.

**Core technologies:**
- Vanilla HTML/CSS/JS: single-file app runtime — no build step, full browser support, proven pattern
- JSONBin v3: serverless JSON storage — GET+PUT append cycle, CORS enabled, free tier sufficient for 80 students
- GitHub Pages: static hosting — already in use, zero configuration required
- SheetJS 0.20.3: admin Excel export — lazy-loaded from `cdn.sheetjs.com`, same pattern as `pruefung/`
- RubFlama fonts (external TTF): RUB brand typography — external `fonts/` files, not Base64 inline

### Expected Features

All P1 features form a single coherent MVP. There are no difficult prioritization trade-offs — the scope is well-defined and the implementation cost for all required features is low.

**Must have (table stakes):**
- Gruppenauswahl as first required field — gates all downstream Ausbilder logic
- Rating scale 1-8 for all 14 Lehrgangskritik categories — direct digital equivalent of the paper form
- Ausbilder auto-assignment by group + individual rating per Ausbilder — key improvement over paper
- Submit to JSONBin with confirmation screen — data must persist, user must see acknowledgment
- Error handling and retry button on POST failure — mountain connectivity is unreliable
- Admin Excel export via `?admin=true` — replaces manual paper data entry
- Mobile-first layout with RUB design system — matches quality bar of `pruefung/`

**Should have (differentiators):**
- Optional free-text fields per configured question — preserves qualitative feedback channel
- Optional name field — preserves anonymity choice
- Collapsible free-text toggle (`<details>`) — keeps form visually compact by default
- Section progress indicator — guides users through 14 categories without feeling lost

**Defer (v2+):**
- Aggregate summary dashboard in admin — SheetJS summary tab partially covers this
- CSV export option — only if admin requests it after launch

**Explicitly excluded:**
- Duplicate submission prevention (cookie/IP) — out of scope per PROJECT.md; 80 users, noise not a crisis
- Real-time results dashboard — disproportionate complexity for one-time use
- Multi-page wizard flow — state loss risk on mobile, single scroll is correct for this scale

### Architecture Approach

The architecture is a direct extension of `pruefung/index.html` (977 lines, inspected directly). Four co-resident DOM sections (`#umfrage-form`, `#confirmation`, `#already-voted`, `#admin-view`) are toggled via `style.display`. JS is organized into named init functions (`initKacheln`, `initValidierung`, `initSubmit`, `initAdmin`) called from a single `DOMContentLoaded` handler. The feedback app adds one new architectural element not in `pruefung/`: the group-to-Ausbilder derived data flow, where selecting a Gruppe triggers a lookup table read and dynamic rendering of two Ausbilder rating rows.

**Major components:**
1. Constants block — API credentials, BIN_ID, and the `TEAM_MAP` lookup (single source of truth for Ausbilder assignments)
2. Rating tile widget — reusable `initRadioCards()` extended to 8-value rows; minimum 44x44px tap targets
3. Group-to-Ausbilder logic — group select triggers lookup, dynamically renders 2 Ausbilder rating sections
4. JSONBin client — `jsonbinFetch()` wrapper; `saveToJsonBin()` implements the read-modify-write cycle
5. View switcher — `switchView()` handles all 4 states (form, confirmation, already-voted, admin)
6. Admin view — `loadAdminData()`, table render, lazy SheetJS export, delete operations
7. Session guard — `sessionStorage` check on load prevents re-submission within same browser session

### Critical Pitfalls

1. **JSONBin race condition (concurrent PUT overwrites)** — Store submissions as a flat object keyed by client-generated UUID (`{ "uuid1": {...}, "uuid2": {...} }`) rather than an array. Add 0-500ms random jitter before PUT. This is the single most important implementation decision.

2. **API key scope** — Use a collection-scoped JSONBin key (not the master key) before the first commit to the public repo. If the master key is used, any student can view the key in source and wipe all project bins.

3. **Ausbilder mapping duplicated** — Define `TEAM_MAP` exactly once at the top of `<script>`. All rendering, validation, and export logic must read from this constant. Never write Ausbilder names as string literals anywhere else.

4. **No submit feedback on slow networks** — Disable the submit button immediately on first tap and change label to "Wird gespeichert...". Replace form with full-screen confirmation on success. Re-enable with error message on failure. Mobile networks at altitude can take 3-8 seconds per request.

5. **8-point scale tap targets on mobile** — Each rating value needs minimum 44x44px tap target. Test on a real 360px device. iOS keyboard overlay requires `min-height: 100svh` and `scroll-padding-bottom: 300px`; avoid `position: fixed` for the submit button.

## Implications for Roadmap

Based on research, suggested phase structure:

### Phase 0: Project Setup and Data Model
**Rationale:** Security and data structure decisions made here cascade through every subsequent phase. The `TEAM_MAP` constant and the UUID-keyed submission schema must be locked before any rendering code is written, or they will be duplicated. The API key scope must be set before the first commit.
**Delivers:** Directory structure (`feedback/index.html`, `fonts/`, optional `img/`), constants block with `TEAM_MAP`, JSONBin bins (dev + prod), collection-scoped API key, UUID generation utility function, submission schema definition.
**Avoids:** API key exposure pitfall, Ausbilder mapping duplication pitfall, JSONBin race condition (schema decision).

### Phase 1: Static HTML and CSS Foundation
**Rationale:** The visual and structural foundation must be correct before interactive JS is layered in. Building all 14 category sections as static HTML first allows testing mobile layout, tap target sizes, and the rating scale grid on a real device before any logic is involved.
**Delivers:** Full `index.html` skeleton with RUB design system (tokens from `pruefung/`), all 14 Lehrgangskritik sections as static rating rows, group selector, name field, free-text textareas, section headers, footer. No interaction yet.
**Uses:** RubFlama external fonts, CSS design tokens from `pruefung/` color/spacing system.
**Avoids:** Rating scale tap target pitfall (validate at this stage), iOS keyboard overlay pitfall (use `100svh` from the start).

### Phase 2: Interactive Form and Ausbilder Logic
**Rationale:** This is the most complex phase — the group-to-Ausbilder dynamic rendering is the unique architectural element of this app. Getting this right before wiring up the backend makes it easier to isolate and test.
**Delivers:** `initKacheln()` for group tile selection, `TEAM_MAP` lookup that dynamically renders 2 Ausbilder rating rows on group change, `initValidierung()` that enables submit only when Gruppe is selected, all rating tiles interactive.
**Implements:** Rating tile widget, group-to-Ausbilder derived data flow.
**Avoids:** Ausbilder rendering bugs by testing all 10 groups before submission is wired.

### Phase 3: Submission, Confirmation, and Error Handling
**Rationale:** Once the form is fully interactive and correct, wire up the backend. The race condition mitigation (UUID-keyed object) is implemented here. Submit button loading state and full-screen confirmation prevent double-tap duplicates.
**Delivers:** `jsonbinFetch()` wrapper, `saveToJsonBin()` with UUID-keyed read-modify-write, submit button loading state and disabled-on-click, full-screen confirmation view, error view with retry button, session guard via `sessionStorage`.
**Avoids:** Race condition pitfall, double-submission pitfall, silent failure pitfall.

### Phase 4: Admin View and Excel Export
**Rationale:** Admin functionality is entirely decoupled from the student flow and has no external dependencies on phases 1-3 except the JSONBin data schema. Building it last keeps the critical student path uncluttered during development.
**Delivers:** `?admin=true` URL param detection, `initAdmin()` + `loadAdminData()`, submissions table, per-group summary stats, lazy-loaded SheetJS export (data sheet + summary sheet), delete functionality.
**Uses:** SheetJS 0.20.3 from `cdn.sheetjs.com`, lazy load pattern from `pruefung/`.

### Phase Ordering Rationale

- Phase 0 before everything: UUID schema and `TEAM_MAP` are referenced by all other phases; API key must be set before any commit.
- Phase 1 before Phase 2: Static HTML must exist before JS can query it. Mobile layout bugs are cheapest to fix without interaction complexity.
- Phase 2 before Phase 3: Ausbilder dynamic rendering must produce the correct DOM structure (hidden inputs with correct `name` attributes) before the submit handler collects values from those inputs.
- Phase 4 last: Admin view reads from JSONBin using the schema locked in Phase 0; it can be developed and tested independently once real submissions exist from Phase 3 testing.

### Research Flags

Phases with well-documented patterns (skip research-phase):
- **Phase 0:** Direct copy of `pruefung/` project setup; standard GitHub Pages configuration.
- **Phase 1:** Pure CSS/HTML work; RUB design system is established in `pruefung/`.
- **Phase 3:** JSONBin append pattern is proven in `pruefung/`; UUID v4 generation is a one-liner.
- **Phase 4:** SheetJS pattern is proven in `pruefung/`; extending it with a summary tab is straightforward.

Phases that may benefit from closer inspection:
- **Phase 2:** The group-to-Ausbilder dynamic rendering is new to this app family. The exact Ausbilder team assignments (which instructor pairs which groups) need confirmation from Kilian before coding the `TEAM_MAP` constant. The `TEAM_MAP` in `ARCHITECTURE.md` shows a placeholder assignment — these must be verified.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Entire stack directly inherited from working production code in same repo |
| Features | HIGH | Features derive from paper form requirements and explicit PROJECT.md decisions; UX research from NNG/Survicate corroborates choices |
| Architecture | HIGH | Based on direct inspection of `pruefung/index.html` (977 lines, working production app) |
| Pitfalls | HIGH (critical), MEDIUM (UX details) | Race condition and API key risks are verified against JSONBin behavior; iOS keyboard behavior is well-documented; specific pixel measurements are advisory |

**Overall confidence:** HIGH

### Gaps to Address

- **Ausbilder team assignments:** The `TEAM_MAP` in research uses placeholder names (`['Kilian', 'Claudia']`, `['Michael', 'Annika']`, etc.). The actual instructor pairings per group must be confirmed with Kilian before Phase 2. This is a data gap, not a technical gap.
- **14 Lehrgangskritik categories:** The research references "14 categories" but does not enumerate them. The exact category labels, question texts, and which categories get optional free-text fields must come from the paper form or Kilian. This drives the Phase 1 HTML structure.
- **JSONBin bin IDs:** New bins (dev + prod) need to be created for this app. The research correctly identifies this as a Phase 0 task but the actual IDs are not yet known.

## Sources

### Primary (HIGH confidence)
- `pruefung/index.html` (977 lines) — canonical reference implementation; inspected directly
- `PROJECT.md` — requirements, out-of-scope decisions, group/Ausbilder structure
- [SheetJS official docs](https://docs.sheetjs.com/docs/getting-started/installation/standalone/) — browser installation pattern
- [W3C APG Radio Rating example](https://www.w3.org/WAI/ARIA/apg/patterns/radio/examples/radio-rating/) — radio button rating scale recommendation

### Secondary (MEDIUM confidence)
- [JSONBin API Reference](https://jsonbin.io/api-reference) — CORS, auth headers, GET/PUT endpoints (WebSearch verified, direct fetch blocked)
- [Nielsen Norman Group — Rating Scales](https://www.nngroup.com/articles/rating-scales/) — scale labeling best practices
- [Survicate — Mobile Survey Best Practices](https://survicate.com/blog/mobile-app-survey/) — 83% abandonment rate for non-mobile-friendly surveys

### Tertiary (supporting)
- [Bram.us — Preventing Double Form Submissions](https://www.bram.us/2020/11/04/preventing-double-form-submissions/) — disable-on-click pattern
- [iOS keyboard overlay fix](https://dev.to/franciscomoretti/fix-mobile-keyboard-overlap-with-visualviewport-3a4a) — `100svh` and `scroll-padding-bottom` approach
- [JSONBin race condition community thread](https://community.render.com/t/jsonbion-io-api-for-update-over-riding-existing-data/21455) — concurrent PUT behavior confirmed

---
*Research completed: 2026-03-24*
*Ready for roadmap: yes*
