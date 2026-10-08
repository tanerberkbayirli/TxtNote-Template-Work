# Phase 5.2 B2 model-line editor proof — mechanism-only, renderer deferred

**Supersedes the first B2 source-clean claim.** The first proof manually removed `<thesis-line>` wrappers and sampled text after reflow; it did not exercise the actual serializer and was invalid evidence.

The corrected Chrome 154.0.8037.98 run called the real `thesisSourceHtml` on live wrapper DOM without preprocessing. With the proposed one-line serializer patch applied, pre/post source HTML, semantic text and paragraph count matched. Backward and collapsed-boundary selections survived reflow; rich `<strong>` and NBSP content remained; typing, synthetic plain-text paste, undo/redo and save/reopen checks passed. Full results are in `prototype/model-line-editor-proof.json`. Paste used a synthetic event; OS clipboard and IME were not exercised.

The serializer patch and focused test are preserved under `prototype/` only; production `TxtNote/frontend/src/thesis/sourceHtml.js` has been restored unchanged. The tested patch SHA256 is recorded in the proof JSON. No live line model was integrated into the editor or PDF, and no Word line-model acceptance was claimed. Arbitrary rich-run shaping, manual breaks, long unbreakable tokens, IME, OS clipboard and full-document pagination remain open.

Phase 5.2 decision: **DEFER** renderer integration at this bounded research gate. Keep all original FAILs and tolerances. The frozen corpus has independent Word line and word-position references; the fit prototype has not been trained or validated against them. Continue only in a separately budgeted implementation/acceptance cycle.
