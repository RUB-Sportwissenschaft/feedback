# Roadmap: Feedbackbogen Valmorel

## Overview

A single-file feedback web app for ~80 students on a ski trip. Built in 4 sequential phases: static foundation first (HTML skeleton, RUB design system, all 14 evaluation categories), then interactivity (rating tiles, Ausbilder logic, freitext triggers), then backend wiring (JSONBin submission, confirmation, error handling), and finally the admin export view. Each phase is independently testable on a real mobile device before the next begins.

## Phases

- [ ] **Phase 1: Foundation** - Static HTML/CSS skeleton with all sections and RUB design system
- [ ] **Phase 2: Interactive Form** - Rating tiles, Ausbilder mapping, freitext triggers, validation
- [ ] **Phase 3: Submission and Backend** - JSONBin integration, confirmation screen, error handling
- [ ] **Phase 4: Admin Export** - Admin view, Excel export with per-group summary

## Phase Details

### Phase 1: Foundation
**Goal**: A testable static HTML page exists with the correct RUB design, all 14 evaluation categories rendered, group selector, name field, section headers, and mobile layout verified on a real device.
**Depends on**: Nothing (first phase)
**Requirements**: DES-01, DES-02, FORM-01, FORM-02, FORM-03, FORM-04, S1-01, S1-02, S1-03, S2-01, S2-02, S2-03, S2-04, S2-05, S2-06, S2-07, S3-01, S3-02, S4-01, S4-02, S4-03, S5-01, S5-02, S5-03
**Success Criteria** (what must be TRUE):
  1. Opening `index.html` on a 375px mobile screen shows the full form with correct RubFlama fonts and RUB color scheme matching the Pruefungs-App
  2. All 14 evaluation categories are visible with their correct labels, scale endpoints, and explanatory subtitles
  3. The group selector renders all 10 options (Gruppe 1-8, Snowboard 1-2) and the name field is present
  4. A progress indicator is visible showing the current section and overall progress through the form
  5. All tap targets are at least 44x44px and the form is fully usable without horizontal scrolling on a 375px device
**Plans:** 2/3 plans executed

Plans:
- [x] 01-01-PLAN.md — Design system, header, progress bar, Step 0 (Gruppe + Name), wizard navigation
- [ ] 01-02-PLAN.md — All 14 rating questions across Steps 1-6 (S1, S3, S2, S4, S5, S6+Freitext)
- [ ] 01-03-PLAN.md — Visual verification checkpoint on mobile device

### Phase 2: Interactive Form
**Goal**: Every rating widget is interactive, selecting a Gruppe automatically shows the correct two Ausbilder rating rows, freitext fields appear on negative ratings, and the submit button is gated until Gruppe is selected.
**Depends on**: Phase 1
**Requirements**: RATE-01, RATE-02, RATE-03, RATE-04, RATE-05, S6-01, S6-02
**Success Criteria** (what must be TRUE):
  1. Clicking any rating tile (1-5) on any question immediately highlights the selected value and deselects the others
  2. Selecting a Gruppe instantly renders the 2 correct Ausbilder rows for that group (and updates if Gruppe is changed)
  3. Rating a question 1 or 2 in any section automatically reveals the optional freitext field for that section; rating 3-5 hides it
  4. For the Pruefungsanforderungen question (S4-02), the freitext field appears at both extremes (1-2 and 4-5) but not at 3
  5. The submit button is disabled until a Gruppe is selected; each Ausbilder row has a required free-text field that must be filled before submit is enabled
**Plans**: TBD

### Phase 3: Submission and Backend
**Goal**: Completing the form and tapping submit stores the response in JSONBin under a unique UUID key, shows a full-screen confirmation, and handles network errors gracefully with a retry option.
**Depends on**: Phase 2
**Requirements**: BACK-01, BACK-02, BACK-03
**Success Criteria** (what must be TRUE):
  1. After submit the button immediately shows a loading state and becomes disabled; the form cannot be submitted twice
  2. On success the form is replaced by a full-screen confirmation screen acknowledging the response was saved
  3. On network failure an error message appears with a retry button; tapping retry re-attempts the submission without data loss
  4. Each saved response in JSONBin is keyed by a client-generated UUID so simultaneous submissions from different students do not overwrite each other
**Plans**: TBD

### Phase 4: Admin Dashboard und Export
**Goal**: Navigating to `?admin=true` shows an inline dashboard with participation stats, per-question and per-group averages, collected free-text responses, and allows downloading a complete Excel file.
**Depends on**: Phase 3
**Requirements**: ADM-01, ADM-02, ADM-03, ADM-04, ADM-05, ADM-06

**Success Criteria** (what must be TRUE):
  1. Opening `?admin=true` shows Teilnehmeranzahl gesamt und pro Gruppe
  2. Dashboard zeigt Durchschnittswerte pro Frage (alle 14 bewerteten Items)
  3. Dashboard zeigt Durchschnittswerte pro Gruppe (Vergleich der Gruppen)
  4. Alle Freitextantworten sind gesammelt pro Sektion einsehbar
  5. Export-Button l&#x00e4;dt .xlsx mit Einzelantworten und Zusammenfassung herunter
**Plans**: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation | 2/3 | In Progress|  |
| 2. Interactive Form | 0/? | Not started | - |
| 3. Submission and Backend | 0/? | Not started | - |
| 4. Admin Export | 0/? | Not started | - |
