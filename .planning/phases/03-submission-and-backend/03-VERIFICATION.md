---
phase: 03-submission-and-backend
verified: 2026-03-25T06:30:00Z
status: human_needed
score: 4/5 must-haves verified
re_verification: false
human_verification:
  - test: "Live submission with real JSONBin credentials"
    expected: "After tapping Absenden, button shows spinner + 'Wird gesendet...', then form is replaced by Danke confirmation card. JSONBin bin contains a new UUID-keyed entry with correct payload shape (timestamp, group, ratings, freitexte, ausbilder)."
    why_human: "JSONBIN_BIN_ID and JSONBIN_API_KEY are placeholder strings ('DEINE_BIN_ID' / 'DEIN_API_KEY'). Automated checks cannot trigger the real network path. Visual confirmation of the confirmation screen on 375px mobile also requires human."
  - test: "Error path with invalid credentials"
    expected: "After a few seconds the button returns to 'Absenden' (enabled) and the red error message 'Fehler beim Senden. Bitte versuche es erneut.' appears below the button. A second tap re-attempts without data loss."
    why_human: "Requires live browser interaction to observe the timing and visual appearance of the error state."
---

# Phase 3: Submission and Backend Verification Report

**Phase Goal:** Wire the Absenden button to JSONBin and show a confirmation screen after successful submission
**Verified:** 2026-03-25T06:30:00Z
**Status:** human_needed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Tapping Absenden immediately disables the button and shows a spinner with 'Wird gesendet...' | VERIFIED | Line 1220: `btn.disabled = true`; line 1221: `btn.innerHTML = '<span class="spinner"></span>Wird gesendet\u2026'` — set before await |
| 2 | The form cannot be submitted a second time while a request is in flight | VERIFIED | `btn.disabled = true` is set at function entry before the fetch; re-enabled only in the catch block |
| 3 | Each submission is stored in JSONBin as a separate UUID-keyed entry, never overwriting another student's data | VERIFIED (structurally) | Lines 1282-1284: `crypto.randomUUID()` generates key; `patchBody[uuid] = payload`; PATCH to JSONBin endpoint at line 1288-1297. Credentials are placeholders — live writes blocked until configured. |
| 4 | On network failure, an inline red error message appears below the Absenden button and the button is re-enabled | VERIFIED | Lines 1310-1318: catch block sets `btn.disabled = false`, `btn.textContent = 'Absenden'`, `errorEl.textContent = 'Fehler beim Senden...'`, `errorEl.style.display = 'block'` |
| 5 | After a successful submission the form disappears and a full-screen Danke card is shown | VERIFIED (structurally) | Lines 1304-1308: success branch hides `main`, sets `confirmEl.style.display = 'flex'`. `#confirmationScreen` div exists at line 972. Requires real credentials to verify live. |

**Score:** 5/5 truths verified structurally. Live end-to-end path requires human verification (placeholder credentials).

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `Feedback/index.html` | JSONBIN_BIN_ID and JSONBIN_API_KEY constants | VERIFIED | Lines 987-988 — placeholder strings present, ready for real values |
| `Feedback/index.html` | `submitFeedback()` async function | VERIFIED | Lines 1215-1319 — fully implemented, 104 lines, all branches present |
| `Feedback/index.html` | `crypto.randomUUID` call | VERIFIED | Line 1282 |
| `Feedback/index.html` | PATCH fetch to JSONBin endpoint | VERIFIED | Lines 1287-1297 |
| `Feedback/index.html` | `<div id="submitError" class="submit-error">` | VERIFIED | Line 964 — inside step-6 div, after nav-row |
| `Feedback/index.html` | `<div id="confirmationScreen">` with Danke heading, checkmark, message | VERIFIED | Lines 972-978 — hidden by default, Danke heading and checkmark present, no back/reset controls |
| `Feedback/index.html` | `.spinner` CSS and `@keyframes spin` | VERIFIED | Lines 432-446 |
| `Feedback/index.html` | `.submit-error` CSS | VERIFIED | Lines 448-457 |
| `Feedback/index.html` | `.confirmation-screen` / `.confirmation-card` / `.confirmation-heading` CSS | VERIFIED | Lines 462-503 |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `submitBtn click handler` | `submitFeedback()` | `addEventListener('click', submitFeedback)` | WIRED | Lines 1330-1332 inside DOMContentLoaded |
| `submitFeedback()` | JSONBin PATCH endpoint | `fetch` with UUID key in `patchBody` | WIRED | Lines 1282-1297 — UUID-keyed patchBody assembled and sent |
| `submitFeedback()` success branch | `#confirmationScreen` | `getElementById('confirmationScreen')` + `style.display = 'flex'` | WIRED | Lines 1304-1308 — hides `main`, shows `confirmEl` |
| `submitFeedback()` error branch | inline error div below submitBtn | `errorEl.textContent` + `errorEl.style.display` | WIRED | Lines 1310-1318 — catch block sets both text and display |
| `#confirmationScreen` HTML (Plan 03-02) | `submitFeedback()` getElementById call (Plan 03-01) | `id="confirmationScreen"` attribute | WIRED | Line 972 matches the `getElementById('confirmationScreen')` call at line 1304 |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| BACK-01 | 03-01 | Daten werden in JSONBin v3 gespeichert (UUID-keyed, kein Array) | SATISFIED | `crypto.randomUUID()` as object key, PATCH method, JSONBin v3 URL pattern |
| BACK-02 | 03-01 | Submit-Button mit Loading-State und Fehlerhandling/Retry | SATISFIED | Loading state at lines 1220-1221, error/retry at lines 1312-1317 |
| BACK-03 | 03-02 | Bestätigungsseite nach erfolgreicher Abgabe | SATISFIED | `#confirmationScreen` with Danke card, shown by success branch |

All three Phase 3 requirements are satisfied by the implementation.

**Orphaned requirements:** None — REQUIREMENTS.md maps BACK-01, BACK-02, BACK-03 to Phase 3 and all three are claimed by plans 03-01 and 03-02.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `Feedback/index.html` | 987-988 | `JSONBIN_BIN_ID = 'DEINE_BIN_ID'` and `JSONBIN_API_KEY = 'DEIN_API_KEY'` placeholder constants | Warning | Expected — app cannot submit to JSONBin until real credentials are configured. The code is correct; only the credential values are missing. This is a setup step, not a code defect. |

No blocker anti-patterns found. No TODO/FIXME comments in Phase 3 additions. No stub implementations.

### Human Verification Required

#### 1. Happy path — live JSONBin submission

**Test:** Insert a real JSONBin v3 Bin ID and Collection-scoped API Key into the constants at lines 987-988. Open `Feedback/index.html` in a browser at 375px viewport width. Select a Gruppe, rate some questions, fill both Ausbilder textareas. Tap Absenden.

**Expected:**
- Button immediately shows spinner and "Wird gesendet..." and becomes disabled
- After a moment the form disappears and the Danke card fills the screen with a checkmark, "Danke fur dein Feedback!" heading in blue RubFlama font, and the one-line message in muted text
- No back, reset, or "Neues Feedback" button is visible
- JSONBin bin contains a new UUID-keyed entry with the correct payload shape

**Why human:** JSONBIN_BIN_ID and JSONBIN_API_KEY are placeholder strings. The real network path cannot be exercised without live credentials. Visual appearance of the confirmation card on mobile also requires human judgment.

#### 2. Error path

**Test:** Set `JSONBIN_BIN_ID` to an invalid value (e.g., `'invalid'`). Complete the form. Tap Absenden.

**Expected:**
- Button shows loading state
- After the request fails, button returns to "Absenden" (enabled) and red error message "Fehler beim Senden. Bitte versuche es erneut." appears below the button
- Tapping Absenden again re-attempts (loading state activates, form data is unchanged)

**Why human:** Requires live browser interaction to observe timing and visual appearance of the error state. Cannot be verified by static analysis.

### Gaps Summary

No structural gaps found. All code paths are implemented, all elements are present, all wiring is correct, and all three requirements (BACK-01, BACK-02, BACK-03) are satisfied by the implementation.

The only open item is credential configuration: `JSONBIN_BIN_ID` and `JSONBIN_API_KEY` are intentional placeholders that the operator must fill in before live use. This is documented in both the plan and the summary. It does not constitute a gap in the phase goal — the goal is "wire the button to JSONBin and show a confirmation screen", which is achieved; the app simply requires credentials to function in production.

---

_Verified: 2026-03-25T06:30:00Z_
_Verifier: Claude (gsd-verifier)_
