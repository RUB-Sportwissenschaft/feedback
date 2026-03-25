# Phase 3: Submission and Backend - Context

**Gathered:** 2026-03-25
**Status:** Ready for planning

<domain>
## Phase Boundary

Wire the submit button to JSONBin v3: build the submission payload, handle loading/error states on the button, and show a confirmation screen after success. Form rendering is complete (Phase 2). Admin dashboard is Phase 4.

Requirements in scope: BACK-01, BACK-02, BACK-03.

</domain>

<decisions>
## Implementation Decisions

### Payload structure
- Full metadata per entry: timestamp, group, optional name, ratings object, freitexte per section, Ausbilder-Freitexte
- Ratings: formData object keyed by question ID (e.g. `{ "S1-01": 4, "S2-03": 2, ... }`)
- Freitexte per section: object keyed by section ID — `{ "S1": "...", "S2": "...", "allgemein": "..." }`
  - Only include keys where the user actually typed something (omit empty)
- Ausbilder feedback: named object — `{ "Kilian": "...", "Claudia": "..." }` — human-readable, Phase 4 can use directly without TEAM_MAP lookup
- UUID-keyed storage (not array) — pre-decided to prevent concurrent PUT overwrites

Example entry shape:
```json
{
  "timestamp": "2026-03-25T14:30:00.000Z",
  "group": "Gruppe 3",
  "name": "Max",
  "ratings": { "S1-01": 4, "S1-02": 3, "S2-01": 5 },
  "freitexte": { "S2": "Die Videoanalysen waren sehr hilfreich." },
  "ausbilder": { "Arno": "Sehr guter Unterricht.", "Batti": "Hat viel erklärt." }
}
```

### Submit UX
- Loading state: spinner CSS animation + button text changes to "Wird gesendet...", button disabled during call
- On error: inline red error message below the button — "Fehler beim Senden. Bitte versuche es erneut." — button re-enabled immediately so user can retry manually (no auto-retry)
- Error message appears below the Absenden button, inside the step 6 card

### Confirmation screen
- Full-page Danke screen: replace the entire form content with a centered card
- Content: checkmark icon + "Danke für dein Feedback!" heading + one-line message ("Deine Rückmeldung hilft uns die Ausfahrt zu verbessern.")
- No actions — final screen, user closes the tab
- No form reset or "Neues Feedback" button

### JSONBin config
- Top-of-file constants with clear comment block:
  ```js
  // JSONBin v3 — Feedback Valmorel
  // Erstelle einen neuen Bin unter https://jsonbin.io und trage die Werte hier ein.
  // Verwende einen Collection-scoped API Key (NICHT den Master Key).
  const JSONBIN_BIN_ID  = 'DEINE_BIN_ID';
  const JSONBIN_API_KEY = 'DEIN_API_KEY';
  ```
- Claude decides whether to use collection-scoped vs. master key (pre-decided in project state: collection-scoped preferred)

### Claude's Discretion
- Exact spinner CSS implementation
- Exact checkmark icon for confirmation screen (CSS, SVG, or Unicode)
- Confirmation card padding/sizing
- Whether to use async/await or .then() chains for the fetch call

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `formData` (plain const object): already tracks all rating values keyed by `data-question` ID — iterate over it to build the ratings payload
- `TEAM_MAP` constant: maps group → [ausbilder1, ausbilder2] — use to extract ausbilder names for the named-object payload
- `submitBtn` (id="submitBtn"): exists, already disabled until gates pass, wired via `updateSubmitState()`
- `.ausbilder-textarea[data-ausbilder]`: Ausbilder free-text inputs — index-based, need TEAM_MAP lookup to get names
- `renderAusbilder(group)`: already builds ausbilder cards; ausbilder names available from `TEAM_MAP[selectedGroup]`
- `updateSubmitState()`: already called on every relevant input — add the submit click handler alongside it

### Established Patterns
- `var btn = document.getElementById('submitBtn')` — existing vanilla JS pattern, no jQuery
- CSS variables (`--orange`, `--blau`, `--text-muted`, `--border`, `--radius`, `--shadow`, `--shadow-sm`) — use for spinner and error/success styling
- `.btn.btn-primary` class: orange button, already used for submitBtn — loading state modifies this element in-place
- `.form-section` card pattern: white card with `--radius`, `--shadow-sm` — use for confirmation card
- Step visibility via `data-step` and JS — confirmation screen can be a new hidden div shown after submit (same show/hide pattern)

### Integration Points
- Submit click handler: attach to `submitBtn` click — currently the button has no click handler (only `updateSubmitState` manages disabled state)
- Payload assembly: read `formData` (ratings), read all freitext textareas by section (`data-freitext` attribute), read ausbilder textareas (`data-ausbilder` attribute) + TEAM_MAP for names, read `selectedGroup` and name input value
- Confirmation screen: hide `.wizard` container (or current step), show a new `#confirmationScreen` div

</code_context>

<specifics>
## Specific Ideas

- The confirmation screen should follow the same visual language as the rest of the form — same blue header, same card style
- The spinner can be a simple CSS border-radius animation (no external library needed)

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 03-submission-and-backend*
*Context gathered: 2026-03-25*
