# afsu-lee-proposal (AFSU LEE Tez Onerisi 2025) - self-check report

Source (only): AFSU_Lisansustu_Tez_Onerisi_Hazirlama_Kilavuzu_2025.pdf (10 p., A4; p.9 landscape). Registry: afsu-lee-proposal-master-tr-v1, afsu-lee-proposal-phd-tr-v1. Module: templates/afsu-lee-proposal.js. Test: src/lib/thesisAfsuLeeProposal.test.js. Export: orchestration/validation/afsu-lee-proposal/self-1/ (PHD variant).

## Findings
- EXPLICIT: cover example (Sekil 1, p.5): 12 pt bold lines, title 14 pt bold, "(Doktora Tez Onerisi)" 12 bold, Hazirlayan/Danisman labels 12 bold, year line "12 Punto" (not bold; sample glyphs are bold - annotation wins); APA for citations + references (p.3 s1.1); Kaynaklar list at end of Genel Bilgi and Yontem (p.7); content outline s1.3-s1.12; proposal cover = thesis cover format (s1.2); format otherwise deferred to thesis writing guide (s1.1).
- MEASURED: A4 portrait; TNR; cover vertical distances (sample scaled 0.975); guide body pages: 12 pt justified, no first-line indent, left x=70.86 pt (25 mm), 1.5 line pitch 20.7 pt, +8 pt after paragraphs/headings, headings 12 pt bold left, no page breaks, no page numbers. These are the guide's own pages, NOT stated rules.
- UNKNOWN (for the proposal): margins (top/bottom/right), page numbering, heading numbering/case, title-case of thesis title, cover page margins, whether the master variant parenthetical is "(Yuksek Lisans Tez Onerisi)" (INFERRED by substitution; only the PhD text is stated), table/figure caption format.
- Carrier values: engine validator REQUIRES page margins, numbering block, body style. Margins 25 mm all sides (left MEASURED, others not established), numbering disabled, body/H1 from measured guide pages. Flagged in template comments/notes.
- CONFLICT: none between sources. Source defect: duplicate "1.10." (calendar and other projects); s1.5 refers to "3.9 Calisma Takvimi" (wrong). Guide's "1.x." numbers are the guide's own, proposal headings left unnumbered.

## Engine gaps
1. Static table block: "ORNEK CALISMA TAKVIMI" (p.9) is a landscape fill-in grid, 13 rows x (FAALIYETLER + 19 month columns), merged AYLAR header, thicker divider after month 12. Static blocks have text/image/spacer/separator/group only; not reproduced (authors insert a table in the Calisma Takvimi section; section pages cannot be landscape-per-section with a static grid).
2. Cover geometry is flow-based (spacers), not positioned.

## Real export check (PHD, PDF+DOCX)
Fonts: Times New Roman (PDF TimesNewRomanPSMT/-BoldMT; DOCX ascii TNR). Cover sizes 12/14 bold PASS; year line regular PASS. Vertical positions vs scaled sample: T.C./lines within 0.35 mm; Hazirlayan..year within 0.3 mm; title +0.0; "(Doktora...)" +0.85 mm (title row is 14 pt, sample row unreliable). DOCX pgSz 11906x16838, pgMar 1417 (25 mm) = carrier values. npm test 633/633.
Status: PASS (self-check) for cover + outline only; body format rules UNKNOWN, not PASS-claimable.

## self-2 (orchestrator decision: same-institute referral)
Proposal §1.1/§1.2 explicitly defer to the AFSÜ LEE thesis guide. Carrier values replaced by that guide's rules (from afsu-lee.json, each EXPLICIT-by-reference; proposal-specific cover sizes/outline/APA/Kaynaklar win): margins 25/40/25/25, TNR 12 / 1.5 / justified / 6+6 pt, H1-H4, footnotes 10, captions, references 10 pt single, page number bottom-right. INFERRED: Arabic numbering from first body page, proposal sections = H1 (own page, numbered), sub-heading number formats. Cover uses symmetric 25 mm margins to keep the sample's page-centred layout (UNKNOWN). Still UNKNOWN: caption numbering format, thesis-title casing, p.9 calendar grid (engine gap).
Export self-2 (master + PhD, 33 pages each): cover positions unchanged vs sample (<=0.35 mm; Hazirlayan..year <=0.3 mm), cover 12/14 bold, year regular; body text left x=112.6 pt (39.7 mm), right 524.4 pt (25.0 mm); DOCX pgMar 2268/1417 twips (40/25 mm); page numbers bottom right (y 793); H1 14 bold; footnotes 10 pt; fonts TNR. npm test 634/634. Status PASS (self-check) for cover, outline and by-reference page/body/heading geometry.
