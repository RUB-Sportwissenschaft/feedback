---
phase: 03-submission-and-backend
plan: "01"
subsystem: backend-integration
tags: [jsonbin, submission, fetch, uuid, loading-state, error-handling]
dependency_graph:
  requires: []
  provides: [BACK-01, BACK-02]
  affects: [Feedback/index.html]
tech_stack:
  added: []
  patterns: [UUID-keyed JSONBin PATCH, async/await fetch, inline loading/error state]
key_files:
  created: []
  modified:
    - Feedback/index.html
decisions:
  - "submitFeedback() placed before INIT block so DOMContentLoaded wiring is clean"
  - "submitError div placed after nav-row closing tag, inside step-6 div — outside the flex row"
  - "Click handler attached in existing DOMContentLoaded INIT block (not a separate listener)"
metrics:
  duration: "2 min"
  completed_date: "2026-03-25"
  tasks_completed: 2
  tasks_total: 2
---

# Phase 3 Plan 1: JSONBin Submit Wiring Summary

**One-liner:** UUID-keyed JSONBin PATCH with spinner/disabled loading state and inline red error retry via async submitFeedback().

## What Was Built

Wired the Absenden button to JSONBin v3 so students can actually submit their feedback. Each submission lands under a unique UUID key so concurrent submissions never overwrite each other.

### Task 1: JSONBin constants + CSS for loading/error states

Added to `index.html`:
- `JSONBIN_BIN_ID` and `JSONBIN_API_KEY` placeholder constants immediately before the TEAM_MAP comment block
- `@keyframes spin` + `.spinner` CSS for the button loading indicator
- `.submit-error` CSS for the inline red error message below the Absenden button

Commit: `e48ac79`

### Task 2: submitFeedback() implementation + click handler wiring

Added to `index.html`:
- `async function submitFeedback()` with full payload assembly:
  - `timestamp` (ISO string), `group` (display name), optional `name`
  - `ratings` (copied from `formData` — all keyed question IDs, values 1-5)
  - `freitexte` (non-empty only, mapped to section IDs S1/S2/S3/S4/S5 + allgemein)
  - `ausbilder` (named object using TEAM_MAP — only non-empty values)
- UUID-keyed PATCH: `crypto.randomUUID()` generates key per submission
- Loading state: `btn.disabled = true` + spinner HTML on click
- Error state: button re-enabled + `errorEl.textContent` shown on catch
- Success branch: checks for `confirmationScreen` element (added in Plan 03-02)
- `<div id="submitError" class="submit-error"></div>` added to step 6 HTML
- `submitBtn.addEventListener('click', submitFeedback)` wired in DOMContentLoaded INIT block

Commit: `c292bb1`

## Success Criteria Verification

- Absenden button triggers loading state immediately on click: YES — `btn.disabled = true` + spinner HTML set before fetch
- Button cannot be double-tapped: YES — disabled during request (pointer-events: none via CSS)
- JSONBin receives PATCH with UUID-keyed entry: YES — `crypto.randomUUID()` + `patchBody[uuid] = payload`
- Network errors surface as inline red message: YES — catch block sets `errorEl.textContent` + `style.display = 'block'`
- Retry works without data loss: YES — payload assembled fresh each call from unchanged `formData` and DOM state

## Deviations from Plan

None — plan executed exactly as written.

## Self-Check

### Files
- [x] `Feedback/index.html` — modified

### Commits
- [x] `e48ac79` — feat(03-01): add JSONBin constants and CSS for loading/error states
- [x] `c292bb1` — feat(03-01): implement submitFeedback() and wire click handler

## Self-Check: PASSED
