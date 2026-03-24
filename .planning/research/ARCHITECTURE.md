# Architecture Research

**Domain:** Single-file HTML feedback form with JSONBin backend (GitHub Pages)
**Researched:** 2026-03-24
**Confidence:** HIGH — based on direct inspection of the reference app (`pruefung/index.html`, 977 lines)

## Standard Architecture

### System Overview

```
┌──────────────────────────────────────────────────────────────┐
│                    GitHub Pages (static hosting)              │
│                                                              │
│  index.html                                                  │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  <style> — Inline CSS (design tokens, layout)        │   │
│  ├──────────────────────────────────────────────────────┤   │
│  │  <body>                                              │   │
│  │  ┌─────────────┐  ┌───────────┐  ┌───────────────┐  │   │
│  │  │  Form View  │  │  Confirm  │  │  Admin View   │  │   │
│  │  │  (default)  │  │  View     │  │  (?admin=true)│  │   │
│  │  └──────┬──────┘  └─────┬─────┘  └───────┬───────┘  │   │
│  ├─────────┼───────────────┼────────────────┼───────────┤   │
│  │  <script>              │                │           │   │
│  │  ┌──────────────────────────────────────────────┐   │   │
│  │  │  Constants (API key, BIN ID, lookup tables)  │   │   │
│  │  ├──────────────────────────────────────────────┤   │   │
│  │  │  initKacheln()   — interactive tile widgets  │   │   │
│  │  │  initValidierung() — live field validation   │   │   │
│  │  │  initSubmit()    — form submission handler   │   │   │
│  │  │  initAdmin()     — admin view bootstrap      │   │   │
│  │  ├──────────────────────────────────────────────┤   │   │
│  │  │  jsonbinFetch()  — API abstraction layer      │   │   │
│  │  │  saveToJsonBin() — read-append-write cycle   │   │   │
│  │  │  loadAdminData() — fetch + render table      │   │   │
│  │  └────────────────────────┬─────────────────────┘   │   │
│  └───────────────────────────┼─────────────────────────┘   │
└──────────────────────────────┼──────────────────────────────┘
                               │ HTTPS (fetch API)
                               ▼
┌──────────────────────────────────────────────────────────────┐
│                    JSONBin v3 (external API)                  │
│                                                              │
│  GET  /v3/b/{BIN_ID}/latest  — read current array           │
│  PUT  /v3/b/{BIN_ID}         — overwrite with new array      │
└──────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Implementation in Reference App |
|-----------|----------------|----------------------------------|
| Constants block | API credentials, BIN ID, data lookup tables (Ausbilder-Teams) | `var` declarations at top of `<script>` |
| DOMContentLoaded handler | Bootstraps all init functions; guards against re-init | Single `addEventListener('DOMContentLoaded', ...)` |
| Tile widget initializer | Converts `<div role="radio/checkbox">` into interactive cards with keyboard support | `initRadioCards()` — reusable for all tile types |
| Form validator | Reads DOM state, enables/disables submit button | `validateForm()` — called by every interactive element |
| Submit handler | Collects form values, delegates to save function | `initSubmit()` with `e.preventDefault()` |
| JSONBin client | Thin fetch wrapper, handles auth headers | `jsonbinFetch(method, body)` |
| Save cycle | GET current array → append → PUT updated array | `saveToJsonBin()` — read-modify-write pattern |
| View switcher | Shows/hides form, confirmation, already-voted, admin sections | Inline `style.display` manipulation |
| Admin loader | Fetches all records, renders summary stats + table | `initAdmin()` + `loadAdminData()` |
| Excel export | Builds .xlsx with SheetJS (CDN), triggers download | Attached to export button in admin view |
| Session guard | Prevents duplicate submission within browser session | `sessionStorage.setItem/getItem` |

## Recommended Project Structure

```
feedback/
├── index.html          # Single file — entire app
├── fonts/
│   ├── RubFlama-Regular.ttf
│   └── RubFlama-Bold.ttf
└── img/                # (optional) logos if needed in footer
```

### Structure Rationale

- **Single index.html:** All CSS and JS inline. Only fonts are external (file size: ~977 lines in reference app, feedback will be larger due to rating questions but well under 2000 lines). This is the proven pattern for this project family.
- **fonts/ external:** Unlike the hüttenabend app (Base64 inline), the pruefung app uses file references. Follow pruefung convention — cleaner source, same deployment simplicity on GitHub Pages.
- **No build step:** Vanilla JS, no npm, no bundler. Edit and deploy directly.

## Architectural Patterns

### Pattern 1: View State via display:none Sections

**What:** Multiple named sections (`#umfrage-form`, `#confirmation`, `#already-voted`, `#admin-view`) co-exist in the DOM. Only one is visible at a time, toggled by `style.display`.

**When to use:** Always — this is the core navigation model for single-file apps.

**Trade-offs:** Simple, zero dependencies, instant transitions. Not scalable beyond ~4 states, but 4 is exactly what this app needs (form / confirmation / already-voted / admin).

**Example:**
```javascript
// Show confirmation, hide form
document.getElementById('umfrage-form').style.display = 'none';
document.getElementById('confirmation').style.display = 'block';
```

### Pattern 2: Read-Modify-Write for JSONBin

**What:** JSONBin stores a single JSON array per bin. Every submission requires: (1) GET the current array, (2) append the new record, (3) PUT the whole array back.

**When to use:** Every form submission. Also used by admin delete operations.

**Trade-offs:** Simple and works perfectly for low-concurrency (80 students, not simultaneous). Risk of race condition if two users submit at the exact same millisecond — acceptable for this scale and use case.

**Example:**
```javascript
function saveToJsonBin(antwort) {
  jsonbinFetch('GET')
    .then(res => res.json())
    .then(json => {
      var records = Array.isArray(json.record) ? json.record : [];
      records = records.filter(r => !r._init); // strip init sentinel
      antwort.timestamp = new Date().toISOString();
      records.push(antwort);
      return jsonbinFetch('PUT', records);
    });
}
```

### Pattern 3: Reusable Tile Widget Function

**What:** A single `initRadioCards(selector, onSelect)` function handles all tile-style selections (groups, uni, options). Adds click + keyboard handlers, manages `selected` class and `aria-checked`, syncs hidden `<input>` values.

**When to use:** Every interactive selection control. Extend it for the rating scale tiles (1-8) in the feedback app.

**Trade-offs:** Keeps interaction logic DRY. The feedback app's rating scale is a row of 8 numbered tiles — same pattern, different selector.

### Pattern 4: Derived Data via Lookup Table

**What:** A JS object maps group choice to Ausbilder names. When a user selects their group, the app reads the lookup table and renders the correct two Ausbilder names for individual rating.

**When to use:** Ausbilder-Bewertung section — this is unique to the feedback app vs. the pruefung reference.

**Example:**
```javascript
var AUSBILDER_TEAMS = {
  '1': ['Kilian', 'Claudia'],
  '2': ['Kilian', 'Claudia'],
  '3': ['Michael', 'Annika'],
  '4': ['Michael', 'Annika'],
  '5': ['Arno', 'Batti'],
  '6': ['Arno', 'Batti'],
  '7': ['Tanne', 'Pablo'],
  '8': ['Tanne', 'Pablo'],
  'SB 1': ['Adam', 'Kami'],
  'SB 2': ['Adam', 'Kami']
};
// On group select: look up team, render two rating rows
```

## Data Flow

### Submission Flow

```
User fills form
    |
    v
Each interaction --> validateForm() --> enable/disable submit button
    |
    v
User clicks "Abschicken"
    |
    v
initSubmit() collects values from DOM (checked inputs, text fields)
    |
    v
saveToJsonBin(payload)
    |-- GET /v3/b/{BIN_ID}/latest  --> parse json.record array
    |-- append new record with timestamp
    |-- PUT /v3/b/{BIN_ID}         --> overwrites bin with updated array
    |
    v (success)
sessionStorage.setItem('feedback_voted', '1')
switchView('confirmation')

    v (error)
show error message, re-enable submit button
```

### Admin Flow

```
Page load with ?admin=true
    |
    v
initAdmin() detects URL param
    |
    v
hide main form, show #admin-view
    |
    v
loadAdminData() --> GET /v3/b/{BIN_ID}/latest
    |
    v
render stats summary + table of all submissions
    |
    v
Excel button --> SheetJS builds .xlsx in-browser, triggers download
```

### Key Data Flows

1. **Group -> Ausbilder:** User selects group (e.g. "Gruppe 3") -> lookup table -> render Ausbilder A and Ausbilder B rating rows dynamically in the form section.
2. **Rating tiles -> payload:** Each rating section has 8 numbered tiles (1-8). Selected tile sets a hidden value. On submit, all section ratings + optional text fields are collected into one flat object.
3. **Session guard:** On DOMContentLoaded, check `sessionStorage.getItem('feedback_voted')`. If set, skip form init entirely and show already-voted view immediately.

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| ~80 submissions (this use case) | Current read-modify-write pattern is perfectly adequate. JSONBin free tier handles this volume comfortably. |
| 1k+ submissions | JSONBin response payload grows. Consider pagination or switching to a proper database. Not needed here. |
| Concurrent submissions | Race condition risk in read-modify-write. At 80 students spread over days, risk is negligible. |

### Scaling Priorities

1. **First bottleneck:** JSONBin PUT payload size if many large free-text fields are submitted. Mitigation: keep free-text fields short/optional, which is already the design intent.
2. **Not a concern:** Performance, SSR, caching — GitHub Pages CDN handles all of this without configuration.

## Anti-Patterns

### Anti-Pattern 1: Inline Event Handlers (onclick="...")

**What people do:** `<div onclick="selectGroup(this)">` in HTML.

**Why it's wrong:** Mixes concerns, harder to test, pollutes global scope. Reference app avoids this entirely.

**Do this instead:** `querySelectorAll` + `addEventListener` in `initKacheln()` — as the reference app does.

### Anti-Pattern 2: Storing API Key in a Separate Config File

**What people do:** Create a `config.js` with the JSONBin API key and load it as a separate script tag.

**Why it's wrong:** GitHub Pages is public. The key is visible either way (it's a client-side app). Splitting it out adds complexity for no security gain. The reference app stores the key directly in the inline script — consistent, simple, and honest about the security model.

**Do this instead:** Keep the key in the `<script>` block as a `var` constant. Document that JSONBin keys for public apps are inherently visible.

### Anti-Pattern 3: One JSONBin Request Per Question

**What people do:** POST individual rating values as separate API calls.

**Why it's wrong:** JSONBin rate limits apply per-request. A 14-question feedback form would hammer the API on submit. Also creates partial-save states.

**Do this instead:** Collect the entire form state into one payload object and write it in a single PUT call. All data for one submission is one atomic write.

### Anti-Pattern 4: Using a Framework (React, Vue, etc.)

**What people do:** Reach for a framework because the form has conditional rendering (Ausbilder section depends on group selection).

**Why it's wrong:** This app family is single-file, no build step, deployed directly to GitHub Pages. A framework requires npm, a bundler, and a build pipeline. The conditional rendering here is simple enough for vanilla `style.display` and `innerHTML` manipulation.

**Do this instead:** Vanilla JS with direct DOM manipulation, exactly as the reference app demonstrates.

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| JSONBin v3 | REST API via `fetch()`, `X-Master-Key` header auth | GET `/latest` to read, PUT to overwrite. BIN_ID and API key are hardcoded `var` constants. Free tier sufficient for 80 submissions. |
| GitHub Pages | Static file hosting — push to master, Pages serves automatically | No config needed beyond existing repo setup. |
| SheetJS (xlsx) | Loaded from CDN via `<script src>` tag in admin section only | Only needed for admin export. Load lazily (only when admin view is active) or unconditionally — reference app loads it unconditionally. |
| RubFlama fonts | External `.ttf` files referenced via `@font-face` | Same pattern as `pruefung/`. Files live in `fonts/` subdirectory. |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| Form view <-> JS state | DOM is the state — read `querySelectorAll(':checked')`, text input `.value` on submit | No separate state object; the form IS the state. |
| Group selection <-> Ausbilder display | Group tile click triggers lookup + DOM update of Ausbilder section | This is the main dynamic behavior unique to the feedback app vs. reference. |
| Rating tiles <-> submit payload | Each rating row has a named hidden input or data attribute; collect all on submit | Consistent with how pruefung collects `input[name="gruppe"]:checked`. |
| Admin view <-> form view | URL param `?admin=true` at load time; mutually exclusive display | Not togglable at runtime — requires page reload with different URL. |

## Suggested Build Order

Based on component dependencies:

1. **HTML skeleton + CSS tokens** — Header, accent bar, main wrapper, footer. Design tokens (colors, fonts, radius). No JS yet. Confirms visual baseline matches pruefung app.

2. **Static form sections** — All category sections with rating tiles (1-8) as static HTML. No interaction. Confirms layout, mobile spacing, tile grid.

3. **Tile interaction + group logic** — `initKacheln()` for group tiles. Ausbilder lookup table + dynamic rendering of Ausbilder rating rows on group select. This is the most complex derived-data logic.

4. **Form validation + submit** — `validateForm()` (enable submit when required fields filled), `initSubmit()`, `jsonbinFetch()`, `saveToJsonBin()`, confirmation view.

5. **Session guard** — `sessionStorage` check on DOMContentLoaded. Already-voted view.

6. **Admin view** — `initAdmin()`, `loadAdminData()`, table render. Excel export with SheetJS.

Each step is independently testable in the browser without a build step.

## Sources

- Direct inspection of `pruefung/index.html` (977 lines) — the canonical reference implementation for this project family. HIGH confidence.
- `PROJECT.md` for feedback-specific requirements (Ausbilder teams, categories, group structure). HIGH confidence.
- JSONBin v3 API: https://jsonbin.io/api-reference — GET/PUT pattern verified against reference app code. HIGH confidence.

---
*Architecture research for: Single-file HTML feedback form, Valmorel Schneesport-Exkursion*
*Researched: 2026-03-24*
