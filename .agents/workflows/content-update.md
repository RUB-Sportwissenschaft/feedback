---
description: Content Update Workflow — Feedback App
---

// turbo-all
# Workflow: Feedback App Content Update

Follow these steps to update the Feedback App content based on `final_content_spec.md`.

## 1. Prepare Configuration
Update the constants in `script.js` to match the new structure.
- Set `totalSteps = 8;`
- Update `sectionNames` (8 items)
- Update `QUESTION_LABELS` with semantic IDs
- Update `SECTION_LABELS` and `SECTIONS` array

## 2. Update HTML Structure
Update `index.html` to reflect the 8 steps and new question IDs.
- Ensure `data-step` attributes are 0-7.
- Replace all question labels, subtitles, and `data-question` attributes.
- Update progress counter text if necessary.

## 3. Update Logic & Data Handling
Update the JavaScript logic to work with the new IDs.
- Refactor `checkSectionFreitext()` to use semantic IDs and handle bipolar scales (revealing on 1, 2, 4, 5).
- Update `submitFeedback()` to correctly map ratings and freitexts using the new IDs.
- Ensure the payload to Supabase remains consistent.

## 4. Final Review
- Check navigation between steps 0 and 7.
- Verify freitext reveal logic for all questions.
- Verify the final payload sent to Supabase.
