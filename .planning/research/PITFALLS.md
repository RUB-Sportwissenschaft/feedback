# Pitfalls Research

**Domain:** Mobile feedback form / survey — single-file HTML, JSONBin backend, 80 concurrent users
**Researched:** 2026-03-24
**Confidence:** HIGH (critical pitfalls), MEDIUM (UX scale issues), HIGH (JSONBin race condition)

## Critical Pitfalls

### Pitfall 1: JSONBin Race Condition — Concurrent Submissions Overwrite Each Other

**What goes wrong:**
JSONBin stores the entire bin as one JSON blob. To add a new submission, the app must: (1) GET the current array, (2) push the new entry, (3) PUT the whole array back. If two students submit at the same time, both read the same "old" array, each appends their own entry, and whoever's PUT request arrives second silently overwrites the first. Net result: one response is permanently lost with no error shown.

**Why it happens:**
JSONBin has no atomic append operation and no optimistic locking. The read-modify-write pattern is inherently racy. With 80 students filling out the same form at the end of a session (e.g., last 10 minutes of the trip), simultaneous submissions are not hypothetical — they are near-certain.

**How to avoid:**
Timestamp every submission with a unique client-generated ID (UUID v4 + timestamp). Store submissions as a flat object keyed by that ID (`{ "abc123": {...}, "def456": {...} }`) rather than an array. On PUT collision the later writer only overwrites their own key, never touching other keys — provided the GET always fetches the full current state immediately before the PUT. Add a small random jitter (0–500 ms) before the PUT to spread the burst. Additionally: verify the response from JSONBin after PUT and alert the user if the save failed.

**Warning signs:**
- Submission count in admin export is lower than the number of students who say they submitted
- Two submissions share identical timestamps in the export

**Phase to address:**
Core data layer (Phase 1 / backend integration)

---

### Pitfall 2: API Key Exposed in Public GitHub Repo

**What goes wrong:**
The JSONBin master key (write access to all your bins) is hardcoded in `index.html`, which is committed to a public GitHub repo. GitHub secret scanning, automated bots, and any curious student can read it and use it to delete or overwrite data.

**Why it happens:**
Single-file static sites on GitHub Pages have no server side to protect secrets. The instinct is to just paste the key in — the pruefung app does this too and it has worked, but the risk is real.

**How to avoid:**
Use a JSONBin **Collection-scoped API key** (read+write restricted to one collection) rather than the master key. Create a dedicated bin for this project and scope the key to that bin only. Even if the key is discovered, an attacker can only tamper with this one bin, not your other projects. Document the key scope in a comment in the code so future maintenance doesn't accidentally upgrade to master key. Never log the key to the console.

**Warning signs:**
- The hardcoded key starts with `$2b$` (bcrypt format, full master key)
- The commit history shows the key was ever pushed to the public repo

**Phase to address:**
Project setup / before first commit (Phase 0)

---

### Pitfall 3: Gruppe-to-Ausbilder Mapping Hardcoded Without a Single Source of Truth

**What goes wrong:**
The mapping of Gruppen (1–8, SB 1–2) to Ausbilder pairs is duplicated: once in the form logic (to display the right Ausbilder names), potentially again in the admin export (to label columns), and possibly in the data schema. When the mapping changes next year (different instructors), it is patched in one place but not the others, causing corrupted exports.

**Why it happens:**
Simple one-time apps tend to inline constants wherever they are first needed. With only 5 teams it feels harmless, but the data appears in three separate rendering contexts.

**How to avoid:**
Define the mapping exactly once as a top-level constant object at the top of the `<script>` block, before any function. All form logic, validation, and export code reads from this constant. Name it prominently (`const TEAM_MAP = ...`). Add a comment: "Single source of truth — update here only."

**Warning signs:**
- Ausbilder names appear as string literals in more than one place in the file
- Export column headers are typed manually rather than derived from `TEAM_MAP`

**Phase to address:**
Data model design (Phase 1)

---

### Pitfall 4: No Submission Confirmation — User Uncertainty Leads to Re-Submissions

**What goes wrong:**
On mobile, network requests can be slow (poor hotel WiFi, Alpine coverage). If the submit button gives no immediate feedback and the spinner is subtle, users tap it again. This creates duplicate entries even without a true race condition.

**Why it happens:**
Desktop developers test on fast localhost; the submit feels instant. On a real mobile network at 1400m altitude the same request may take 3–8 seconds.

**How to avoid:**
Disable the submit button immediately on first tap (set `disabled = true` and change label to "Wird gespeichert..."). Show a visible loading indicator. On success, replace the entire form with a full-screen confirmation message (not a toast) so the user has no submit button left to tap. On error, re-enable the button and show a clear retry message.

**Warning signs:**
- The submit button remains active while the network request is in flight
- Success feedback is a brief toast that disappears while the form is still visible

**Phase to address:**
Form submission flow (Phase 2)

---

### Pitfall 5: 1–8 Scale Renders Unusably Small on Mobile

**What goes wrong:**
Eight radio buttons or a horizontal scale in a single row requires ~300 px minimum on mobile. On a 360 px viewport with padding, the tap targets become 30–35 px wide — below the 44 px minimum recommended by Apple/Google HIG. Users tap the wrong value, especially on values 3–6 in the middle.

**Why it happens:**
The scale looks fine on desktop (where it was designed and tested). Mobile testing is skipped or done on a large-screen device.

**How to avoid:**
Use large circular toggle buttons, not radio inputs. Give each value a minimum tap target of 44×44 px with adequate spacing. Test on an actual 360 px viewport (not browser devtools). Consider a 2-row layout for the 8 values if needed. The endpoint labels (1 = sehr gut, 8 = sehr schlecht) should appear below the scale, not between buttons.

**Warning signs:**
- The scale row is narrower than 360 px in the design
- Tap targets are implemented as styled `<input type="radio">` inside tight `<label>` wrappers without explicit min-width

**Phase to address:**
UI component design (Phase 1–2)

---

### Pitfall 6: Virtual Keyboard Covers Freitext Fields on iOS

**What goes wrong:**
On iOS, when a user taps a `<textarea>` for free-text input, the keyboard appears but does not resize the viewport — it overlays it. The focused textarea may be hidden behind the keyboard. The user cannot see what they are typing. On `position: fixed` elements (e.g., a sticky submit bar), iOS moves them into the keyboard area, causing further layout breakage.

**Why it happens:**
iOS Safari does not change `window.innerHeight` when the keyboard opens, unlike Android Chrome. `100vh` means "full screen height including where the keyboard now sits."

**How to avoid:**
Use `min-height: 100svh` (small viewport height) rather than `100vh` for full-height containers. Add `scroll-padding-bottom: 300px` on the form so focused inputs scroll above the keyboard. Avoid `position: fixed` for the submit button — use normal document flow. Test on a real iPhone (or Xcode Simulator), not just Android DevTools.

**Warning signs:**
- Any use of `height: 100vh` on a container
- Submit button styled with `position: fixed; bottom: 0`
- No `scroll-padding-bottom` defined on the form

**Phase to address:**
Mobile layout (Phase 1–2)

---

### Pitfall 7: JSONBin 10,000-Request Free Tier Exhausted Before the Trip Ends

**What goes wrong:**
JSONBin's free tier provides 10,000 requests total (not per month — it is a one-time allocation). Each student submission is 2 requests (GET + PUT). Admin loading the export view generates additional GET requests. At 80 students with multiple test runs during development, the budget can be depleted before the actual event.

**Why it happens:**
Developers test the form repeatedly during development without tracking request consumption. The 10,000 cap is not surfaced in the UI until it is hit, at which point all API calls silently fail.

**How to avoid:**
Track request usage in the JSONBin dashboard during development. Run all integration tests against a separate "dev" bin, not the production bin. The production bin should only be used for the actual deployment test and the real event. Estimated real-event consumption: 80 students × 2 requests = 160 requests. Budget is not a concern for production use, only for heavy development testing.

**Warning signs:**
- API calls start returning 429 or 403 errors with no code changes
- No separate dev/prod bin in use during development

**Phase to address:**
Project setup (Phase 0), kept in mind throughout development

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Hardcode Ausbilder names as strings in-place | Faster to write | Breaks silently if names change; duplicated in export logic | Never — use one constant |
| Store submissions as array (not keyed object) | Simpler append logic | Race condition data loss with concurrent submissions | Never for concurrent use |
| Skip loading state on submit | Less code | Duplicate submissions, user frustration on slow networks | Never |
| Use master JSONBin API key | Simpler setup | Any student can read the key and wipe data | Never in public repo |
| Test only on Chrome DevTools mobile emulator | Fast iteration | iOS keyboard bugs undetected | Only for layout iteration, not for final check |

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| JSONBin PUT | Send new entry directly (no GET first) | Always GET current state, merge, then PUT |
| JSONBin PUT | PUT the array after GET without checking if another PUT succeeded | Read response body and verify the saved data matches what was sent |
| JSONBin headers | Omit `Content-Type: application/json` | Always set `Content-Type` and `X-Master-Key` headers explicitly |
| JSONBin | Use same bin for dev and prod | Create separate bins: one for development, one for the real event |
| SheetJS export | Build from raw JSONBin response without validating structure | Validate that each entry has expected keys before building the sheet; missing keys crash xlsx generation |

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| GET entire submissions array on every page load | Slow admin panel as entries grow | Only GET on explicit "Laden" click, not on init | After ~200 entries (unlikely for 80 students, but possible with test data) |
| Inline Base64 fonts as in huettenabend app | 463 KB HTML file; slow first load on mobile data | Use external font files (as pruefung app does) | From the first load on a slow connection |
| Re-render entire form on every state change | Janky scroll, lost focus position | Minimal DOM updates; only show/hide sections | Not a concern at this scale, but avoid anyway |

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| Master JSONBin key in public repo | Attacker deletes all bins across all projects | Use collection-scoped key; rotate master key if exposed |
| No submission validation | Garbage data or oversized payloads inflate the bin | Validate all fields client-side before PUT; cap textarea length (e.g., `maxlength="500"`) |
| Logging API key to console.log during debug | Any student opening devtools sees the key | Remove all `console.log` calls before deployment; add a pre-commit check |

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Scale labels "1" and "8" with no text anchor visible | Users unsure which end is "good" — some invert the scale | Show "1 = sehr gut" and "8 = sehr schlecht" permanently visible above or below the scale, not just on hover |
| All 14 categories shown at once as one long scroll | Overwhelming; users give up or rush remaining answers | Group into 4–5 named sections with visual separators; consider one section per card |
| Required group selection buried below other fields | Users submit without selecting group; admin export has ungrouped entries | Make group selection the very first element, visually prominent |
| Free-text label just "Kommentar" with no prompt | Low response rate; users don't know what to write | Use a guiding placeholder ("Was hat gut funktioniert? Was sollte sich ändern?") |
| No progress indicator on a long form | Users cannot gauge remaining effort; abandon mid-form | Show section progress ("Abschnitt 2 von 5") or a simple progress bar |

## "Looks Done But Isn't" Checklist

- [ ] **Race condition:** Form appears to save correctly in single-user testing — verify with two simultaneous submissions that both appear in the export
- [ ] **Ausbilder mapping:** Correct Ausbilder names appear for all 10 groups (1–8 + SB 1–2), not just the ones tested
- [ ] **iOS keyboard:** Free-text fields are visible and scrollable when keyboard is open on a real iPhone (not emulator)
- [ ] **Scale tap targets:** All 8 values are tappable with a thumb on a 360 px viewport — test on real device
- [ ] **Admin export:** Excel file opens without error in both LibreOffice and Excel; all columns present; Zusammenfassung sheet counts correctly
- [ ] **Duplicate prevention:** Tapping submit twice quickly creates exactly one entry in JSONBin
- [ ] **Error handling:** When JSONBin is unreachable, user sees a clear error message and the button re-enables for retry
- [ ] **API key scope:** Key in the source code is collection-scoped, not the master key

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Race condition data loss discovered after event | HIGH | Manually reconcile paper records with digital submissions; impossible to recover lost entries |
| Master key exposed in git history | MEDIUM | Rotate master key immediately in JSONBin dashboard; rewrite git history or make repo private |
| Duplicate submissions in export | LOW | Filter by timestamp + Gruppe in Excel; manually remove obvious duplicates |
| iOS keyboard bug found during event | HIGH | Instruct affected users to fill in landscape mode as workaround; fix requires redeployment |
| JSONBin request quota exhausted | LOW (pre-event) / HIGH (during event) | Switch to new bin with fresh API key; update key in deployed file |

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| JSONBin race condition | Phase 1 (data layer) | Simulate two concurrent submits; check both appear in bin |
| API key exposure | Phase 0 (project setup) | Confirm key is collection-scoped before first commit |
| Hardcoded Ausbilder mapping | Phase 1 (data model) | Grep for Ausbilder name strings outside `TEAM_MAP` constant |
| No submission confirmation / duplicates | Phase 2 (form flow) | Double-tap submit; verify only one entry in JSONBin |
| Scale too small on mobile | Phase 1–2 (UI) | Test on physical 360 px device |
| iOS keyboard obscures textarea | Phase 1–2 (layout) | Test on real iPhone with Safari |
| Request quota exhausted | Phase 0 (setup) | Use separate dev bin; monitor dashboard |

## Sources

- JSONBin.io API Reference and Pricing: https://jsonbin.io/api-reference, https://jsonbin.io/pricing
- Race condition read-modify-write pattern: https://github.com/openclaw/openclaw/issues/29947, https://community.render.com/t/jsonbion-io-api-for-update-over-riding-existing-data/21455
- Double form submission prevention: https://www.bram.us/2020/11/04/preventing-double-form-submissions/, https://blog.openreplay.com/prevent-double-form-submissions/
- iOS virtual keyboard overlay: https://dev.to/franciscomoretti/fix-mobile-keyboard-overlap-with-visualviewport-3a4a, https://dev.to/swhabitation/how-to-fix-mobile-form-inputs-breaking-layout-on-sites-1b5d
- Rating scale ambiguity: https://www.nngroup.com/articles/rating-scales/, https://measuringu.com/rating-scale-best-practices-8-topics-examined/
- API key exposure in public repos: https://github.com/orgs/community/discussions/57070, https://github.com/orgs/community/discussions/66648
- Mobile touch target minimums: https://mobisoftinfotech.com/resources/blog/ui-ux-design/mobile-app-ux-mistakes
- Survey abandonment on mobile: https://www.zonkafeedback.com/blog/mobile-app-surveys

---
*Pitfalls research for: mobile feedback form, single-file HTML, JSONBin backend, 80 concurrent students*
*Researched: 2026-03-24*
