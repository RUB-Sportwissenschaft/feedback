# Stack Research

**Domain:** Mobile-optimized feedback form — single-file HTML, GitHub Pages, JSONBin v3
**Researched:** 2026-03-24
**Confidence:** HIGH

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Vanilla HTML/CSS/JS | Native (no version) | App runtime | Constraint from PROJECT.md: single-file, no framework. Zero build tooling, zero dependencies at runtime, full browser support. The pruefung/ app proves this approach works well for this exact use case. |
| JSONBin v3 | v3 (current) | Serverless JSON storage backend | Already in use for pruefung/ and huettenabend/. API is stable, supports CORS for browser fetch, no server needed. PUT replaces entire bin — append pattern via GET + PUT is proven in the codebase. |
| GitHub Pages | current | Static hosting | Already in use for all Valmorel apps. Zero cost, zero config for a repo with an index.html, HTTPS by default. |

### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| SheetJS Community Edition | 0.20.3 | Admin Excel export (.xlsx) | Load on demand (lazy, via loadScript) in the admin view only — do not block page load. Matches the pattern already proven in pruefung/. Use official CDN: `https://cdn.sheetjs.com/xlsx-0.20.3/package/dist/xlsx.full.min.js` |
| RubFlama font | n/a (TTF files) | RUB brand typography | Reference as external `fonts/` files, identical to pruefung/ structure. Do NOT inline as Base64 — pruefung/ uses external files, huettenabend/ inlined and is 463 KB as a result. |

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| Browser DevTools | Local testing, mobile emulation | Use Chrome/Edge device emulation for 375px viewport during development |
| Git Bash (Windows) | Commit and push | Use Unix paths and syntax. Direct push to master per project convention. |
| VS Code Live Server | Local preview | Serves fonts correctly over HTTP (file:// breaks @font-face in some browsers) |

## Installation

No npm packages. No build step. This is a single HTML file.

```bash
# Fonts (copy from pruefung/ — same files)
cp ../pruefung/fonts/RubFlama-Regular.ttf fonts/RubFlama-Regular.ttf
cp ../pruefung/fonts/RubFlama-Bold.ttf fonts/RubFlama-Bold.ttf
```

SheetJS and JSONBin are loaded via CDN/API at runtime — nothing to install.

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| Vanilla JS | Alpine.js / Vue CDN build | If reactivity complexity grows significantly (e.g., multi-step wizard, live validation across dozens of fields). Not needed here — form is linear and submit-once. |
| Radio buttons (styled) for 1–8 scale | `<input type="range">` slider | Range is harder to hit accurately on mobile for a fixed 8-point scale; radio buttons with large tap targets are more reliable. W3C APG explicitly recommends radio groups for rating scales. |
| SheetJS 0.20.3 from cdn.sheetjs.com | SheetJS 0.18.5 from cdnjs | Use 0.18.5 only if staying consistent with pruefung/ matters more than staying current. 0.18.5 on cdnjs is frozen at an old version — cdnjs is out of sync with SheetJS releases. |
| External font files (like pruefung/) | Base64-inlined fonts (like huettenabend/) | Inline only if truly zero-dependency delivery is required. External files keep file size sane and match the established pruefung/ pattern. |
| JSONBin v3 GET+PUT append pattern | Any other backend | No backend alternatives — JSONBin v3 is the project-wide standard. |

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| React / Vue / Svelte (even CDN builds) | Adds ~30–100 KB overhead, introduces component model complexity for a form that submits once. Overkill for this scope. | Vanilla JS with DOM manipulation |
| `<input type="range">` for the 1–8 rating scale | Sliders are imprecise on mobile touch, have inconsistent cross-browser styling, and users cannot easily see all 8 options at a glance | Styled radio buttons in an `<fieldset>`/`<legend>` group — large tap targets (min 44×44px), visible all options simultaneously |
| SheetJS from cdnjs (0.18.5) for new code | cdnjs is out of sync; 0.18.5 is two major minor versions behind 0.20.3 | `https://cdn.sheetjs.com/xlsx-0.20.3/package/dist/xlsx.full.min.js` |
| Eager (synchronous) SheetJS script tag | Adds ~900 KB to initial page load for all users, including students who never see the admin view | Lazy load via `loadScript()` on first admin export click — proven pattern from pruefung/ |
| localStorage for draft saving | Not in scope (PROJECT.md: out of scope is Mehrfach-Abgabe-Schutz, single submit is the flow) | Just submit directly |
| Python-based scripts | Python not installed on the dev machine per CLAUDE.md | Node.js for any helper scripts |

## Stack Patterns by Variant

**Student view (default, everyone):**
- Plain HTML form with sections per feedback category
- Styled radio buttons for 1–8 scale (one fieldset per question)
- Optional textarea per category (shown always or toggled — TBD in feature phase)
- Gruppe select (required) — triggers Ausbilder display
- Name input (optional)
- Single submit button — GET current bin, push new record via PUT, show confirmation

**Admin view (`?admin=true`):**
- Hidden by default, revealed on URL param
- Loads all records from JSONBin on mount
- Table display with sortable columns
- SheetJS export loaded lazily on first export click
- Delete individual records (GET + PUT minus record)

**Rating scale implementation pattern:**
```html
<fieldset>
  <legend>Ausbildungsort <span class="req">*</span></legend>
  <div class="scale-row">
    <span class="scale-label">sehr gut (1)</span>
    <div class="scale-options">
      <!-- 8 radio inputs, labels styled as large tap targets -->
      <label><input type="radio" name="ausbildungsort" value="1"><span>1</span></label>
      <!-- ... through value="8" -->
    </div>
    <span class="scale-label">sehr schlecht (8)</span>
  </div>
</fieldset>
```

CSS target: labels `min-width: 40px; min-height: 44px` for touch compliance.

**JSONBin append pattern (proven in pruefung/):**
```js
// GET current array, push new record, PUT full array back
fetch('https://api.jsonbin.io/v3/b/' + BIN_ID + '/latest', {
  headers: { 'X-Master-Key': API_KEY }
})
.then(r => r.json())
.then(data => {
  var records = Array.isArray(data.record) ? data.record : [];
  records.push(newRecord);
  return fetch('https://api.jsonbin.io/v3/b/' + BIN_ID, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', 'X-Master-Key': API_KEY },
    body: JSON.stringify(records)
  });
});
```

## Version Compatibility

| Package | Compatible With | Notes |
|---------|-----------------|-------|
| SheetJS 0.20.3 | All modern browsers (Chrome 80+, Safari 14+, Firefox 75+) | No known breaking changes for basic workbook/sheet/writeFile usage between 0.18.5 and 0.20.3 — the API surface used in pruefung/ (book_new, aoa_to_sheet, append_sheet, writeFile) is unchanged |
| JSONBin v3 API | Fetch API (all modern browsers) | CORS enabled by JSONBin for all endpoints — no proxy needed |
| RubFlama TTF | All modern browsers via @font-face | font-display: swap prevents invisible text on slow connections |

## Sources

- [JSONBin API Reference](https://jsonbin.io/api-reference) — CORS support, X-Master-Key auth, GET /latest and PUT endpoints confirmed (MEDIUM confidence — WebSearch verified, WebFetch blocked)
- [SheetJS CDN](https://cdn.sheetjs.com/) — 0.20.3 is current stable, official CDN preferred over cdnjs (HIGH confidence — official source)
- [SheetJS Standalone Docs](https://docs.sheetjs.com/docs/getting-started/installation/standalone/) — browser script installation pattern (HIGH confidence — official docs)
- [W3C APG Radio Rating Example](https://www.w3.org/WAI/ARIA/apg/patterns/radio/examples/radio-rating/) — radio buttons recommended for rating scales (HIGH confidence — W3C spec)
- `pruefung/index.html` in this repo — proven JSONBin pattern, lazy SheetJS load, font structure, CSS design system (HIGH confidence — working production code)

---
*Stack research for: Feedbackbogen Valmorel — single-file HTML, GitHub Pages, JSONBin v3*
*Researched: 2026-03-24*
