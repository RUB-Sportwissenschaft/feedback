# Phase 1: Foundation - Context

**Gathered:** 2026-03-24
**Status:** Ready for planning

<domain>
## Phase Boundary

A testable static HTML page exists with the correct RUB design, all 14 evaluation categories rendered as static widgets, group selector (10 options), name field, section headers, and mobile layout verified on a real device. No interactivity yet — ratings, Ausbilder logic, and freitext triggers are Phase 2. Backend wiring is Phase 3.

</domain>

<decisions>
## Implementation Decisions

### Form navigation
- Multi-Step Wizard — one section per screen, not a single long scrollable page
- 7 steps total: Step 0 (Gruppe + Name), then S1 → S3 → S2 → S4 → S5 → S6+Freitext+Submit (following required order)
- Navigation via Vor/Zurück buttons at the bottom (Weiter right, Zurück left)
- All form state lives in the browser (JS) until final Submit — no partial saving to backend

### Rating widget style
- 5 equal-width tiles in a row, filling full available width (not fixed px)
- Each tile shows the number (1–5) centered
- Endpoint labels displayed below the tile row: left label under tile 1, right label under tile 5
- Explanatory subtitle (where applicable, e.g. "Unterkunft, Skigebiet, Lage") shown directly below the question title, smaller font size and muted/gray color
- Tiles are card-style (consistent with group selector pattern from Pruefungs-App)

### Progress indicator
- Sticky below the page header — does not scroll away
- Layout: progress bar + "3 / 7" step count on the right + current section name below
- Bar fill color: orange (#EC633A — --orange variable)

### Page header and layout
- Blue header (#003560) with form title "Lehrgangskritik Valmorel" — NO orange accent bar below header (unlike Pruefungs-App)
- Each question gets its own white card (.form-section), not grouped into a single per-section card
- Section title (e.g. "S2 — Ausbildung") displayed as a bold heading above the question cards in the content area

### Claude's Discretion
- Exact padding/spacing between cards
- Header icon or emoji (if any)
- Exact font sizes beyond the hierarchy (title bold, subtitle muted/smaller)
- Zurück button styling (ghost/outline vs filled)
- Animation/transition between steps (none is fine for a static skeleton)

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `fonts/RubFlama-Regular.ttf` + `fonts/RubFlama-Bold.ttf`: Already present in project root — reference via `url('../fonts/...')` from index.html in same root
- `pruefung/index.html`: Full reference implementation with established CSS variables, card patterns, and group selector tile layout

### Established Patterns
- CSS variables from Pruefungs-App to reuse verbatim: `--orange: #EC633A`, `--orange-dark: #d4522b`, `--orange-light: #fff3ef`, `--blau: #003560`, `--blau-light: #e8eef5`, `--text: #1a1a1a`, `--text-muted: #6b7280`, `--border: #e5e7eb`, `--bg: #f4f5f7`, `--white: #ffffff`, `--radius: 10px`, `--radius-sm: 6px`, `--shadow-sm`, `--shadow`
- `.form-section` card pattern: white background, `--radius`, `--shadow-sm`, `1px solid --border` — reuse directly
- `.card` / `.card.selected` tile pattern: border, orange selected state — reuse for both group selector and rating tiles
- `.card-grid` with `grid-template-columns: repeat(4, 1fr)` for group selector — adapt to `repeat(5, 1fr)` for rating tiles
- `max-width: 560px` centered layout with `padding: 1.5rem 1rem 3rem`
- Font loading via `@font-face` with external TTF files (`font-display: swap`)

### Integration Points
- `index.html` lives at project root alongside `fonts/` — font paths are `fonts/RubFlama-Regular.ttf`
- Single-file HTML architecture: all CSS inline in `<style>`, all JS inline in `<script>`, fonts via external relative paths
- DES-02: External fonts are the exception (not Base64 inline) — this is intentional per pruefung convention

</code_context>

<specifics>
## Specific Ideas

- The design should match the Pruefungs-App closely, but WITHOUT the orange accent bar under the header
- The group selector in Pruefungs-App uses a 4-column grid for Gruppe 1–4, with Snowboard spanning full width — reuse this exact layout for the 10 group options (Gruppe 1–8 in two rows of 4, Snowboard 1–2 spanning full width)
- Rating tiles follow the same visual logic as group selector tiles: bordered, selected state orange

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 01-foundation*
*Context gathered: 2026-03-24*
