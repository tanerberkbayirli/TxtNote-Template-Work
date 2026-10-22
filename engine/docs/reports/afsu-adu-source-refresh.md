# AFSÜ / ADÜ source refresh proposal

This metadata-only proposal does not edit the live `orchestration/manifest.json` or `orchestration/progress.json`. Review/apply the localized unified diff at `orchestration/validation/afsu-adu-manifest-update.patch`.

The orchestrator reviewed and applied this proposal on 2026-10-02. The live manifest now includes the refreshed AFSÜ/ADÜ sources and pending targets. Its original generation date is retained, with separate refresh date and university scope. Progress changes were made separately by the orchestrator; no implementation or validation PASS is implied by this inventory update.

AFSÜ's stale LEE guide and master/doctoral template paths now point to the 2025 guide and 2026 templates named in refreshed official metadata; the guide version is metadata-derived rather than the stale 2026-02-16 value. Seven LEE support files (2024 cover formats, two 2026 approval forms, and four 2026 checklists) are added as supplementary sources. Proposal, Tıp, Diş Hekimliği, and Eczacılık report-rule targets are pending cards. Metadata says no English LEE guide/template was found. Eczacılık is a course-project directive, not a thesis template.

ADÜ contributes ten current local source cards: FBE Turkish/English guides and checklist; SBE guide and Form 16; Sağlık guide and 2026 template; current linked May-2023 Tıp guide; Ziraat guide; and Mühendislik English template. ADÜ leaves `nonImplementableUniversities`; other source gaps are out of scope. Ten target cards have `variants: []` and no registry IDs pending source-specific extraction.

Validation: all 14 selected AFSÜ and 10 ADÜ files exist and each SHA-256 matches the official `metadata.json`; selected manifest paths resolve. Proposed JSON parses; target/source IDs are unique; the existing two confirmed `afsu-lee` registry IDs remain unchanged; no new registry IDs are introduced; unrelated target records equal the originals. Counts become 95 valid sources, 37 PDF, 55 DOCX, 3 DOC, 80 primary, 14 supplementary, 16 implementable universities, 42 targets, and 71 registry variants; source-card rows total 98. Duplicate-format and excluded-file treatment is unchanged.
