# adu-sagbil — Phase 4 extraction checkpoint
- Status (2026-10-07): analysis IN_PROGRESS; implementation/validation PENDING. Phase 4 OPEN.
- Official source: `Butun-Sablonlar/Ege/Aydın Adnan Menderes Üniversitesi/Saglik_Bilimleri_Enstitusu_Tez/ADU_Saglik_Bilimleri_Tez_Sablonu_2026.docx`.
- XML extraction: `orchestration/specs/adu-sagbil.extracted.json`; source/part SHA256 and exact XML locators retained. 3 sections, 96 styles, 12 tables, 1 PAGE field.
- Tool: `orchestration/tools/docx2spec.py`; usage and unresolved semantics: `orchestration/tools/DOCX_EXTRACTION.md`.
- Extracted style properties are source facts, not reviewed body-text requirements. Do not infer missing Word defaults, theme fonts, inherited header/footer references or universal margins.
- No official Word-render cache, fixed-page geometry, conflict ruling, generated template/checks/fixture or Tier 1 PASS is claimed.
- Next: cache official Word render with provenance; extract positioned cover/approval/declaration lines, then implement `spec2template.mjs` mapping with unresolved properties listed as gaps. Review guide prose only at source conflicts.
- Read selected sections/style IDs using the extractor output; do not load the full source or 1.6 MB extracted tree into context.
