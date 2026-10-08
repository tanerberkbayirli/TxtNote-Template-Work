# Phase 5.2 B1 line-local fit prototype

The training and held-out corpus was frozen before fitting in `corpus.json`. B1 spent 70 seconds and used zero Word batches. Approach A (another global CSS fraction) was skipped because the measured CAPABILITIES evidence already falsifies that hypothesis. The existing J03/J04 failures and J01/J02/J05–J08 controls remain unchanged.

The pure prototype in `orchestration/validation/word-compat/phase-5.2/prototype/wordJustifyModel.js` represents Word's measured candidate-line overflow budget: the smaller of the per-gap cap and the final-word cap. Its focused unit tests pass. The API accepts measured natural token advances and legal break opportunities; NBSP content can stay grouped in one token, and hard breaks are caller metadata. It does not modify text or insert breaks.

B1 stopped at the required editor/PDF parity gate. The current editor is contenteditable, while PDF and editor layout both rely on Chromium wrapping. Replacing that wrapping with custom line ranges requires a line renderer and caret/selection/IME/paste/undo integration across rich DOM runs. The pure model is not wired into either renderer, so it does not establish an opt-in shared line model and would not change the three J03/J04 checks. Running Word now would only repeat the current baseline and would not evaluate this prototype. No Word acceptance batch was spent.

Decision: keep the measured failures open and do not promote B1. A further round needs a concrete, non-mutating editor rendering design that shares line placement with PDF, plus an explicit budget and fresh acceptance fixture. Do not loosen tolerances or change the frozen corpus to fit observed results.

Focused verification: `node --test TxtNote/frontend/src/lib/thesisJustify.test.js` — 9 passed, 0 failed. No full regression/build was run.

