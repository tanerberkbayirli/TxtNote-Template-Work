# AKÜ completion queue — 2026-10-02

Authorization: finish all AKÜ tasks. Root orchestrates and reviews; production code is written by GPT-6 Luna workers. At most two workers run concurrently. Consult the relevant AKÜ official sources under `Butun-Sablonlar/Ege` before escalating ambiguity. Source files remain read-only. Never import another university/unit's formatting values.

Starting checkpoint: `a80e81c` on `integrate/aku-mcbu`; engine fix `8e9bb83`. Existing untracked source conversions and exports are preserved. Baseline frontend tests: 610 passed, 0 failed. Progress correction checkpoint: `91f1292` (all eleven AKÜ targets listed, stale PENDING implementation records repaired, Matematik FAIL retained, Sağlık historical validation superseded).

## Work and dependencies

1. FBE Word evidence: measure official PDF and DOCX geometry, render copied official template with the existing 89-character title and seven jurors. Determine natural overflow before changing the template. Worker `fbe_word_evidence`; only this worker owns Word COM initially.
2. Optional source-less rules: audit and fix ISG, Felsefe thesis/seminar, Sosyoloji. Worker `optional_rule_audit`. No shared engine edits in this stage. Official-specific list page supports resolving Sosyoloji's list-title conflict with counter-evidence retained.
3. FBE template fixes from completed source evidence, real exports for master/PhD and stress fixtures, independent validation by a different worker.
4. Shared engine review: generic template-positioned images using existing user-layout primitives; empty DOCX header behavior; source-backed table row height and cell padding; Matematik note-to-heading spacing. Implement only supported reusable mechanisms, with tests and affected-template regressions.
5. Engine-fix-3 outstanding AKÜ checks: Word render before/after DOCX pairs for two or three AKÜ templates, compare paragraph gaps against real editor PDF; ISG real-export regression. Non-AKÜ-only requested renders remain outside this AKÜ completion queue.
6. Optional-value audit for Coğrafya, Kimya, Matematik against each unit's official sources, preserving supported values.
7. Sağlık: complete 2022-source geometry/checks/engine-gap reconciliation, implement current rules, real exports and independent validation. Historical guide outputs cannot support a current PASS.
8. Independent source/spec/output checks: MBG, Coğrafya, Kimya, Matematik, Sosyoloji, Felsefe thesis, Felsefe seminar, ISG; also FBE and Sağlık after fixes. A validator cannot sign off its own template changes.
9. SBE: old independent report has six FAIL findings; subsequent commits address some. Recheck current evidence and close remaining heading, cell alignment, appendix-index, title-gap and export issues as applicable. Do not rely on the older PASS progress label.
10. Update progress and source/evidence reports after validated stages; checkpoint meaningful completed work. Do not commit bulky reproducible exports, debug files or converted source artifacts.

## Completion gate

SOURCE → SPEC → IMPLEMENTATION → REAL EXPORT → INDEPENDENT VALIDATION → PASS → REGRESSION → CHECKPOINT. UNKNOWN remains UNKNOWN; supported violations are FAIL. BLOCKED requires concrete unavailable evidence or a demonstrated unsolvable technical obstacle, not unfinished work. Physical print items and unsupported variants are documented explicitly; no invented layouts or text.

MCBÜ-specific chapter-first numbering and rotated spine text are outside the AKÜ target scope unless a verified AKÜ requirement needs the same generic capability.
