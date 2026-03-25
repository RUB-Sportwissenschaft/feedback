---
description: Admin Dashboard Upgrade — Charts, Dark Mode, Sentiment
---

// turbo-all
# Workflow: Admin Dashboard Upgrade

Follow these steps to upgrade the Admin Dashboard to the premium look and functional level.

## 1. Global Refactoring
- Consolidate `SECTIONS` at the top of `script.js`.
- Remove `exportSECTIONS` and other duplicates.
- Initialize `var activeTrainerChart = null;`.

## 2. UI/UX: Dark Mode & Glassmorphism
- Add the `body.admin-mode` CSS variables and scoped styles to `style.css`.
- Update `initAdmin()` to add the `admin-mode` class to the body.

## 3. Data Visualization (Chart.js)
- Implement `computeTrainerSectionAverages()` logic.
- Implement the Radar Chart in the Instructor Tab (with `.destroy()` logic).
- Replace the Übersicht HTML bars with the Chart.js mixed Bar/Line Chart.
- Refer to `chart_specification.md` for exact config objects.

## 4. Sentiment Analysis (Tag-Cloud)
- Implement `computeWordFrequencies()` with the provided stopword list.
- Implement the tag-cloud rendering in the Übersicht panel.

## 5. Excel Export Enhancement
- Update `exportToExcel()` to include Sheet 5 and the totals row in Sheet 4.

## 6. Final Verification
- Run the app and check `?admin=true`.
- Verify all charts and the new dark design.
- Verify participants' form is still working in light mode.
