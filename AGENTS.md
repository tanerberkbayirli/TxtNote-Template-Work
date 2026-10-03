\# TxtNote / TxtEngine — Agent Instructions



\## 1. Mission



This repository contains TxtNote and its academic/thesis document engine, referred to as TxtEngine.



The current project goal is to implement official university thesis/document templates with extremely high fidelity while keeping the underlying engine reusable across universities.



The official university source documents are the source of truth.



The goal is NOT to make documents that merely "look similar."



The goal is to reproduce documented requirements as precisely as the available source evidence permits.



\---



\## 2. Core Principle



Never guess academic formatting rules.



Every university-specific formatting value must come from evidence in that university's official source material.



Evidence may include:



\- official PDF guides

\- official DOCX templates

\- DOC/DOCX document properties

\- DOCX XML

\- Word styles

\- section properties

\- official example documents

\- official university pages or files already included in the repository



If a value cannot be established from the available sources:



\- mark it UNKNOWN

\- document the missing evidence

\- do not invent a value



If sources disagree:



\- record the conflict explicitly

\- preserve evidence from both sides

\- do not silently average or compromise

\- escalate important unresolved conflicts to the main reasoning/orchestrator agent



\---



\## 3. Evidence Classification



Every extracted formatting rule should be classified when practical as:



\### EXPLICIT



Directly stated by an official source.



Example:



"Left margin shall be 3.5 cm."



\### MEASURED



Obtained directly from document structure or geometry.



Examples:



\- DOCX section margin = 1985 twips

\- PDF text bounding box begins at 35.02 mm

\- Word paragraph style has 1.5 line spacing



\### INFERRED



Strongly implied by the official document but not explicitly stated.



Inference must include the evidence and reasoning.



\### UNKNOWN



The available sources do not establish the value reliably.



Never convert UNKNOWN into an invented default merely to complete a template.



\---



\## 4. Precision Standard



Explicit dimensions are requirements, not suggestions.



If the source requires:



35 mm



the implementation target is:



35 mm



not approximately 35 mm.



For explicit measurable geometry, the default validation tolerance is:



<= 0.5 mm



Whenever measurement reliability allows it, prefer:



<= 0.25 mm



Tolerance represents measurement/rendering noise.



Tolerance is NOT permission to intentionally alter the required design.



Example:



Expected: 35.00 mm

Measured: 35.82 mm



Result:



FAIL



Do not PASS visually similar output when deterministic measurement shows that it violates an explicit requirement.



\---



\## 5. Source Conflicts



Official sources may contradict one another.



Examples:



\- guide text says 30 mm while DOCX template uses 10 mm

\- guide says single spacing while official example uses 1.5

\- naming differs between guide and template

\- older and newer guides disagree



When conflicts occur:



1\. identify all conflicting sources

2\. record the exact values

3\. record source file/page/section/style/XML evidence

4\. determine whether recency, specificity, or document purpose resolves the conflict

5\. if the resolution is not sufficiently supported, mark CONFLICT

6\. escalate significant unresolved conflicts



Never silently choose whichever value is easier to implement.



\---



\## 6. University Isolation



Never copy university-specific formatting values from one university to another.



AKÜ, MCBÜ, DEÜ, Ege University, etc. are independent sources of formatting requirements.



Reusable ENGINE CAPABILITIES may be shared.



University-specific VALUES may not be shared without evidence.



Correct reuse:



AKÜ caused TxtEngine to gain support for:

\- mirror margins

\- continued-table captions

\- independent image lists



A later university may use those existing capabilities if its own sources require them.



Incorrect reuse:



"AKÜ uses a 35 mm margin, therefore this university probably uses 35 mm too."



Never do this.



\---



\## 7. Reuse Before Reinvention



Before implementing a new capability:



1\. inspect the existing TxtEngine capability

2\. inspect existing templates

3\. inspect existing tests

4\. determine whether the requirement can already be represented

5\. reuse the existing generic mechanism whenever possible



Do not create university-specific hacks when a generic capability already exists.



Do not duplicate existing functionality.



Do not perform unrelated refactors.



\---



\## 8. Extending TxtEngine



If an official source requires a capability that TxtEngine genuinely cannot represent, extend TxtEngine.



Engine extensions must be:



\- generic

\- reusable

\- backward compatible

\- deterministic where practical

\- covered by tests

\- configurable by templates where appropriate



Do NOT hard-code university-specific behavior into generic engine logic unless there is no reasonable alternative and the reason is documented.



Preferred architecture:



official source

→ template configuration/specification

→ generic TxtEngine capability

→ document

→ export



Avoid:



official source

→ university-specific rendering hack

→ export



\---



\## 9. Existing Implementations



Existing implementations, especially completed and validated university templates, are valuable engineering references.



They may be reused for:



\- architecture

\- engine capabilities

\- testing strategies

\- validation tooling

\- export tooling

\- implementation patterns

\- reusable components



They are NOT authoritative sources for another university's formatting values.



AKÜ may serve as an engineering reference.



AKÜ must not become the formatting source for ADMÜ, DEÜ, MCBÜ, or any other university.



\---



\## 10. Fonts



Font requirements are strict.



If an official source requires a specific font, use that font when legally and technically available.



Do not silently substitute:



\- metric-compatible fonts

\- visually similar fonts

\- fallback fonts



and then mark validation PASS.



Validation should inspect the actual exported font whenever technically possible.



If the required font cannot be embedded or used:



\- document the limitation

\- report the actual font used

\- do not claim exact font compliance



\---



\## 11. DOCX Inspection



Do not rely only on how a DOCX looks when rendered.



When relevant, inspect:



\- styles.xml

\- document.xml

\- section properties

\- paragraph properties

\- run properties

\- numbering definitions

\- header/footer relationships

\- page margins

\- page size

\- line spacing

\- paragraph spacing

\- indents

\- tab stops

\- table properties

\- borders

\- fonts

\- field codes

\- numbering behavior



Use the underlying structure as evidence.



\---



\## 12. PDF Inspection



Do not rely only on screenshots or visual similarity.



When relevant, inspect programmatically:



\- page dimensions

\- text bounding boxes

\- font names

\- font sizes

\- text positions

\- margins

\- line positions

\- page numbering

\- headers/footers

\- tables

\- captions

\- pagination behavior



Use PyMuPDF or equivalent measurement tooling already available in the repository when appropriate.



Visual inspection complements measurement.



It does not replace measurement.



\---



\## 13. Real Export Is Mandatory



A template is NOT complete because:



\- unit tests pass

\- CSS looks correct

\- the editor preview looks correct

\- configuration values look correct



Validation must use the real TxtNote/TxtEngine export path.



Required flow:



template

→ real editor/document pipeline

→ real export

→ generated PDF/DOCX

→ measurement/inspection

→ validation



Do not replace the real export pipeline with a simplified test renderer unless the task specifically concerns isolated engine testing.



\---



\## 14. Deterministic Test Documents



Where applicable, validation fixtures should exercise relevant structures such as:



\- cover

\- inner title page

\- approval page

\- declaration

\- acknowledgements

\- Turkish abstract

\- English abstract

\- table of contents

\- list of tables

\- list of figures

\- list of images

\- abbreviations

\- symbols

\- Heading 1

\- Heading 2

\- Heading 3

\- Heading 4

\- normal paragraphs

\- multi-page paragraphs

\- tables

\- multi-page tables

\- continued-table captions

\- figures

\- images

\- captions

\- equations

\- footnotes

\- citations

\- bibliography

\- appendices

\- page numbering transitions



Only include structures relevant to the target template.



Long fixtures should be used when necessary to detect cumulative pagination or spacing drift.



\---



\## 15. Validation



Validation must compare three things:



1\. official source evidence

2\. approved/extracted specification

3\. actual generated output



A template must not PASS merely because implementation matches its own spec.



The spec itself may be wrong.



Whenever practical, validation should independently verify important requirements against the original source.



\---



\## 16. PASS / FAIL / BLOCKED



\### PASS



Use only when required checks have succeeded.



\### FAIL



Use when implementation/output violates a supported requirement.



A FAIL should identify:



\- expected result

\- actual result

\- difference

\- evidence

\- likely responsible component when known



\### BLOCKED



Use only when completion is genuinely prevented by issues such as:



\- missing official evidence

\- unavailable required font

\- corrupted source

\- technical limitation that cannot reasonably be solved within the task



BLOCKED is not a shortcut for difficult implementation.



Document the blocker precisely.



\---



\## 17. Retry Policy



When validation fails:



1\. identify the smallest failing requirement

2\. determine whether the failure is in:

&#x20;  - source extraction

&#x20;  - specification

&#x20;  - engine

&#x20;  - template

&#x20;  - export

&#x20;  - measurement

3\. fix only what is necessary

4\. rerun the relevant validation

5\. rerun regression tests when shared engine behavior changed



Do not repeatedly rewrite unrelated parts of the implementation.



\---



\## 18. Regression Safety



Changes to TxtEngine may affect previously completed templates.



When shared engine behavior changes:



\- run relevant unit tests

\- run relevant regression tests

\- revalidate affected previously-PASS templates when necessary



A previous PASS may be reopened if a later engine change breaks it.



Backward compatibility is required unless an explicit task says otherwise.



\---



\## 19. Git and Checkpoints



Work must remain recoverable.



Use Git checkpoints for meaningful completed stages.



Before moving to another university, ensure:



\- completed work is committed

\- progress metadata is updated

\- relevant reports/specs are saved

\- the working tree is understood

\- completed work can be resumed after context loss



Do not commit:



\- node\_modules

\- build caches

\- unnecessary generated artifacts

\- temporary extraction files

\- huge debug dumps



unless the repository explicitly requires them.



Before committing unusually large diffs, inspect what is causing the size.



\---



\## 20. Generated Files



Generated artifacts should not be treated as production source code.



Keep clear separation between:



\- production source

\- tests

\- specifications

\- reports

\- validation results

\- temporary/generated artifacts

\- original university source material



Avoid committing large generated files when they can be reproduced deterministically.



\---



\## 21. Context Efficiency



Context is a limited and billable resource.



Read only what is required for the current task.



Do not repeatedly read:



\- unrelated universities

\- unrelated engine modules

\- already validated sources

\- enormous generated outputs



when a smaller relevant subset is sufficient.



Prefer structured handoffs.



A useful worker result should contain:



\- Finding

\- Value

\- Unit

\- Evidence

\- Source

\- Page/section/style/XML location

\- Status: EXPLICIT / MEASURED / INFERRED / UNKNOWN

\- Conflict, if any



Do not transfer enormous reasoning histories when a compact evidence-backed result is sufficient.

TOKEN COST: read the target's `orchestration/specs/<target>.CONTEXT.md` (see §24A) instead of AGENTS.md + briefs + full sources; open sources only for the rows being worked. Use grep / line-range reads, never whole long files.

ENGINE CATALOG: before opening engine code, consult `TxtNote/frontend/src/thesis/CAPABILITIES.md` (template keys, support in editor/PDF/DOCX, tests, known gaps). A unit test keeps it in sync with `validation.js`.



\---



\## 22. Worker / Subagent Rules



Workers should receive narrow, verifiable tasks.



Good worker task:



"Inspect pages 14-22 of this official guide and extract only page margins, paragraph indents, line spacing, and paragraph spacing. Include evidence. Do not modify code."



Bad worker task:



"Understand this entire university and implement its thesis system."



Workers must not guess missing information.



Workers should escalate:



\- source conflicts

\- architectural decisions

\- ambiguous requirements

\- engine capability gaps

\- repeated implementation failures



to the main orchestrator/reasoning agent.

Worker task granularity: batch related small fixes into ONE worker (several UI bugs, several template value tweaks) instead of one worker per bug. Worker output contract: at most 15 lines (finding / value / unit / evidence / status), no narrative, never paste large file contents. A cold-start worker costs 55-85k tokens even for a one-line fix, so the orchestrator makes trivial one-line fixes itself.



\---



\## 23. Parallelism



Parallel work is useful only for genuinely independent tasks.



Do not spawn one large agent per target merely because parallelism is available.



Avoid having multiple agents repeatedly read the same large source documents.



Prefer:



one shared source extraction

→ small target-specific deltas



over:



many independent full-document analyses



Unless explicitly overridden by the user or orchestration task:



MAXIMUM CONCURRENT SUBAGENTS = 2



This is a hard cost-control constraint.

Do not spawn a fresh LLM agent to redo measurement that a script can do (see §24A).



\---



\## 24. Cost-Aware Reasoning



Use expensive reasoning where it creates value.



Prefer cheaper/narrow workers for:



\- structured extraction

\- file inspection

\- XML inspection

\- measurements

\- deterministic comparisons

\- running tests

\- simple localized fixes

\- report generation



Reserve stronger reasoning for:



\- source conflicts

\- architectural decisions

\- new engine capabilities

\- difficult bugs

\- cross-template regressions

\- final integration decisions



Do not sacrifice correctness merely to save tokens.



Instead, reduce unnecessary context and duplicated work.

Model choice: Haiku for mechanical edits and running the conformance checker; Sonnet for engine work, conflict reasoning and reading failing rows; the strongest model only for architecture and unresolved source conflicts.



\---



## 24A. Token-efficient workflow (binding; does not relax any correctness rule)

Measured cost of the old method: independent LLM validation 160-260k tokens and 7-27 min per run; integrator fixes 80-165k; targets need about 3 rounds. All evidence classes, source precedence, tolerances, exact-font rule, PASS/FAIL/BLOCKED, real export, independence, regression and checkpoints stay unchanged; only HOW they are checked changes.

1. Deterministic conformance checker first. Measurement and comparison are done by a script in `orchestration/tools/` (one command): real export via `export.mjs` -> optional Word render -> PyMuPDF / DOCX-XML landmark measurement of BOTH our output and the cached official reference -> expected/actual/delta JSON plus a short table. Agents interpret only the failing rows. Agents must NOT write new ad-hoc measurement scripts; they extend the shared tool. Until the checker exists, building it is the top-priority task; validators meanwhile reuse the existing scripts in `orchestration/tools/` and prior `validation/<target>/` attempt folders.
2. Independence comes from comparing against source-derived references (official render / XML values / spec), not from spawning a fresh LLM that redoes everything. An independent LLM reviewer reads only: the checker output, the spec, and the source locators of failing or conflicting rows.
3. Official reference renders (Word render of the official DOCX/DOC, extracted XML values) are produced ONCE per source and cached under `orchestration/artifacts/<target>/source/`; never re-rendered per attempt.
4. After the first full validation, re-validate only the failed checks plus the checker's automated regression run. Do not re-measure untouched PASS items manually and do not loop.
5. Context pack: each target keeps a <=1-page `orchestration/specs/<target>.CONTEXT.md` (source files + locators, key values, open conflicts/rulings, current status, commands). Briefs must list which files NOT to read.
6. Word COM only for criteria that depend on Word pagination/glyph metrics. Own instance, record PID, timeout (e.g. 120 s), Quit in `finally`. On timeout fall back to DOCX XML + editor PDF and record the limitation (never claim a Word measurement that was not made).
7. Orchestrator hygiene: one university (or one engine theme) per session; checkpoint with a short RESUME note and start a fresh session instead of growing one conversation; do not poll or narrate between notifications.
8. Code reading: grep and line-range reads. Very long single-line JSX files are expensive; prefer splitting them when touched (recommended refactor, not mandatory now).

\---

\## 25. Scope Discipline



Do not:



\- redesign unrelated UI

\- refactor unrelated modules

\- rename large parts of the repository without need

\- replace working infrastructure unnecessarily

\- modify unrelated university templates

\- change product behavior outside the task



Prefer the smallest correct implementation.



\---



\## 26. Resume Behavior



Before beginning substantial work:



1\. inspect repository status

2\. inspect current branch

3\. inspect recent relevant commits

4\. inspect orchestration progress if present

5\. identify completed, in-progress, failed, and blocked targets

6\. continue from the latest valid checkpoint



Do not redo completed PASS work without evidence that it needs revalidation.



If previous work is incomplete, preserve useful existing work and continue from it rather than starting over automatically.



\---



\## 27. University Completion Gate



Before declaring a university complete, verify as applicable:



\- all intended targets implemented

\- all supported variants implemented

\- source evidence recorded

\- conflicts resolved or explicitly documented

\- required engine capabilities present

\- real exports generated

\- geometry validated

\- fonts validated

\- pagination validated

\- headings validated

\- special pages validated

\- tables/captions/equations validated

\- bibliography/citation behavior validated when applicable

\- relevant tests pass

\- regressions checked

\- progress updated

\- changes committed



Do not begin the next university before the current university reaches its defined completion state unless the orchestration plan explicitly permits it.



\---



\## 28. Definition of Done



"Implemented" is not the same as "Done."



Done means:



SOURCE

→ SPEC

→ IMPLEMENTATION

→ REAL EXPORT

→ INDEPENDENT VALIDATION

→ PASS

→ REGRESSION CHECK

→ CHECKPOINT



Anything before that is work in progress.



### 28A. Two-tier Done (approved by the user, 2026-10-03)

Validation is performed by the conformance checker (`orchestration/tools/check.mjs`) against cached, source-derived references.

- **Tier 1 — release-blocking.** Every requirement in these categories that the source supports must be PASS in the checker: page size and margins, exact font face, font sizes, line spacing and paragraph spacing, heading format and position, page-number position, format and sequence, fixed-page geometry (cover, inner cover, approval, declaration/ethics blocks), and DOCX validity (opens in Word, correct page order). A FAIL or an unruled CONFLICT here blocks release.
- **Tier 2 — documented edge cases.** Behaviour the official sources do not define (e.g. a 3-line title overflowing the cover, more jurors than the example shows) is labelled `UNKNOWN` in the spec and context pack, with the engine's deterministic default behaviour described. Tier 2 items do not block release and are never reported as PASS.

A target is Done when all Tier 1 checks PASS, Tier 2 items are documented, the regression run over all checker-covered targets is clean, and the work is checkpointed. Nothing in this section relaxes tolerances, the exact-font rule, or evidence classification.



\---



\## 29. Final Rule



Accuracy must come from evidence and measurement, not confidence.



Never claim exact compliance merely because output looks plausible.



When evidence is insufficient, say UNKNOWN.



When output differs from a supported requirement, say FAIL.



When it passes measurable and source-backed requirements, say PASS.

