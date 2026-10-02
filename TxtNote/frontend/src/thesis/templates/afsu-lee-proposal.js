/**
 * Afyonkarahisar Sağlık Bilimleri Üniversitesi, Lisansüstü Eğitim Enstitüsü,
 * Yüksek Lisans / Doktora Tez Önerisi (Turkish).
 *
 * Only source: AFSU_Lisansustu_Tez_Onerisi_Hazirlama_Kilavuzu_2025.pdf (10 pages, Aralık 2025).
 * Evidence, UNKNOWNs and engine gaps: orchestration/specs/afsu-lee-proposal.json and
 * orchestration/reports/afsu-lee-proposal.md. No value is taken from the LEE thesis template.
 *
 * The guide is prose plus ONE format example (Şekil 1, p.5 cover). It states no page margins,
 * numbering, heading or body rules of its own: §1.1 defers format to the thesis writing guide
 * (not used here, UNKNOWN for this target). Fields the engine validator requires anyway
 * (page margins, numbering, body/heading style) are carried from the guide's own example pages
 * (MEASURED, not a stated rule) and are listed as such in the spec.
 */

const FONT = "Times New Roman"; // MEASURED: TimesNewRomanPSMT / -BoldMT in the PDF (no font name is stated in text)
// MEASURED on guide body pages (p.3,6,7,8,10): 12 pt, justified, first lines at x=70.8 pt (no indent),
// baseline pitch 20.7 pt (= 1.5 x 13.8 pt), paragraph/heading pitch 28.7 pt (= 20.7 + 8 pt after).
const BODY = { fontFamily: FONT, fontSizePt: 12, lineHeight: 1.5, align: "justify", spaceBeforePt: 0, spaceAfterPt: 8, firstLineIndentMm: 0 };
// MEASURED: guide headings are 12 pt bold, left, same pitch as paragraphs; they run on (no page break).
const H1 = { fontFamily: FONT, fontSizePt: 12, fontWeight: 700, align: "left", lineHeight: 1.5, spaceBeforePt: 0, spaceAfterPt: 8, firstLineIndentMm: 0, pageBreakBefore: false, keepWithNext: true };
const NO_NUMBER = { numbering: { enabled: false, position: "bottom", align: "center", format: "arabic" } };

// EXPLICIT sizes from the Şekil 1 annotations (12 / 14 pt bold, year line "12 Punto"); centred as drawn.
const base = { fontFamily: FONT, fontSizePt: 12, fontWeight: 700, align: "center", lineHeight: 1, spaceBeforePt: 0, spaceAfterPt: 0, firstLineIndentMm: 0 };
const line = (value, style = {}) => ({ type: "text", value, style: { ...base, ...style } });
const meta = (field, fallback, extra = {}, style = {}) => ({ type: "metadata", field, fallback, ...extra, style: { ...base, ...style } });
const gap = (heightMm) => ({ type: "spacer", heightMm });

// Gaps = MEASURED vertical distances of Şekil 1 (guide p.5; sample is scaled 11.7/12 = 0.975, distances divided by 0.975).
// gap(28.2)/gap(32.5) are the measured 28.7/33.4 reduced by the 14 pt title row (taller than the sample's 12 pt-pitch row) and the engine's 13.8 pt single-line pitch (sample 13.5), keeping Hazırlayan..year within 0.3 mm of the sample.
// Annotation lines of the sample are not reproduced; the distances are kept so the content positions match the sample.
const cover = (degreeLabel) => ({
  id: "cover", type: "outerCover", title: "KAPAK", status: "required", group: "cover", mode: "static", tocEntry: "none",
  overrides: { page: NO_NUMBER, body: { ...BODY, align: "center", spaceAfterPt: 0, lineHeight: 1 } },
  blocks: [
    gap(5),
    line("T.C."),
    line("AFYONKARAHİSAR SAĞLIK BİLİMLERİ"),
    line("ÜNİVERSİTESİ LİSANSÜSTÜ EĞİTİM ENSTİTÜSÜ"),
    meta("DEPARTMENT_NAME", "…..................... ANABİLİM DALI", { suffix: " ANABİLİM DALI" }),
    gap(28.2),
    meta("THESIS_TITLE", "TEZİN ADI", {}, { fontSizePt: 14 }),
    line(degreeLabel),
    gap(32.5),
    line("Hazırlayan"),
    meta("STUDENT_NAME", "Adı ve SOYADI"),
    gap(33.4),
    line("Danışman"),
    meta("ADVISOR_NAME", "Unvanı, Adı ve SOYADI"),
    gap(66.8),
    // Annotation reads "(12 Punto)" without "Koyu" (EXPLICIT) although the sample glyphs are bold: not bold here.
    line("{{THESIS_YEAR}} –AFYONKARAHİSAR", { fontWeight: 400 }),
  ],
});

// Section titles are the guide's own bold headings (§1.3-§1.12); the guide's "1.x." numbers belong to the guide,
// so the proposal headings are unnumbered (numbering UNKNOWN).
const bodySections = [
  ["purpose-scope", "Tezin Amacı ve Kapsamı"],
  ["general-information", "Tez ile İlgili Genel Bilgi"],
  ["method", "Tez Çalışmasının Yöntemi"],
  ["success-criteria", "Başarı Ölçütleri ve B Planı"],
  ["originality", "Özgün Değeri"],
  ["impact", "Yaygın Etki/Katma Değer"],
  ["facilities", "Araştırma Olanakları"],
  ["schedule", "Çalışma Takvimi"],
  ["other-projects", "Tez Yürütücüsünün Diğer Projeleri"],
  ["ethics-permits", "Etik Kurul Belgesi ve/veya Diğer İzin Belgeleri"],
  ["budget", "Tez Bütçesi"],
].map(([id, title], index) => ({
  id, type: index === 0 ? "mainContent" : "custom", title, status: "required", group: "body", mode: "editable", showTitle: true, tocEntry: "none", titleNumbering: "none",
  ...(index === 0 ? {} : { pageBreakBefore: false }),
  overrides: { page: NO_NUMBER },
}));

const build = (degreeType, degreeLabel, idPart, name) => ({
  schemaVersion: 1,
  templateVersion: "1.0.0",
  id: `afsu-lee-proposal-${idPart}-tr-v1`,
  universityId: "afsu",
  universityName: "Afyonkarahisar Sağlık Bilimleri Üniversitesi",
  instituteId: "lee-proposal",
  instituteName: "Lisansüstü Eğitim Enstitüsü · Tez Önerisi",
  degreeType,
  language: "tr",
  status: "official",
  displayName: `Afyonkarahisar Sağlık Bilimleri Üniversitesi · Lisansüstü Eğitim Enstitüsü · ${name}`,
  source: {
    type: "official",
    documentName: "AFSU_Lisansustu_Tez_Onerisi_Hazirlama_Kilavuzu_2025.pdf",
    revisionDate: "2025-12",
    verifiedAt: "2026-10-03",
    notes: [
      "Evidence and UNKNOWNs: orchestration/specs/afsu-lee-proposal.json; report orchestration/reports/afsu-lee-proposal.md.",
      "The guide is not a format specification: it defines the cover example (Şekil 1) and the content outline (§1.3-§1.12). Margins, page numbering, body/heading rules are UNKNOWN for the proposal itself (§1.1 defers to the thesis writing guide, deliberately not applied). Values the engine requires anyway are carried from the guide's own example pages (MEASURED, not stated rules).",
      "The cover parenthetical is stated only for the doctorate ('(Doktora Tez Önerisi)'); the master's wording is INFERRED by substitution (the Şekil 1 caption names 'Yüksek Lisans/Doktora').",
      "Engine gap: the 'ÖRNEK ÇALIŞMA TAKVİMİ' landscape fill-in grid (13 rows x 19 month columns, merged AYLAR header) cannot be expressed by static blocks; not reproduced. Authors insert their own table in the 'Çalışma Takvimi' section.",
    ],
  },
  page: {
    size: "A4", widthMm: 210, heightMm: 297, orientation: "portrait", // MEASURED 595.32 x 841.92 pt pages
    margins: { topMm: 25, leftMm: 25, bottomMm: 25, rightMm: 25 }, // validator-required carrier: left MEASURED 24.98 mm; others not established
    numbering: { enabled: false, position: "bottom", align: "center", format: "arabic" }, // guide example pages carry no page numbers; rule UNKNOWN
  },
  typography: {
    body: BODY,
    paragraph: { firstLineIndentMm: 0 },
    headings: { "1": H1 },
    lineSpacing: { mode: "word", singleLineEm: 1.15, baseline: "word", paragraphSpacing: "additive", blockGap: "paragraphPitch", figureExitGap: "spacing" },
  },
  placeholders: {
    DEPARTMENT_NAME: { label: "Anabilim dalı adı (yalnız adı; ANABİLİM DALI eki şablondan gelir)", type: "text", required: true },
    THESIS_TITLE: { label: "Tezin adı", type: "multiline", required: true },
    STUDENT_NAME: { label: "Hazırlayan (Adı ve SOYADI)", type: "text", required: true },
    ADVISOR_NAME: { label: "Danışman (Unvanı, Adı ve SOYADI)", type: "text", required: true },
    THESIS_YEAR: { label: "Yıl", type: "number", required: true },
  },
  sections: [cover(degreeLabel), ...bodySections],
  tables: { label: "Tablo", position: "above", numbering: { scope: "document", format: "{n}", sequence: "arabic" }, style: { fontFamily: FONT, fontSizePt: 12 } },
  figures: { label: "Şekil", position: "below", numbering: { scope: "document", format: "{n}", sequence: "arabic" }, style: { fontFamily: FONT, fontSizePt: 12 } },
  // EXPLICIT (§1.1): in-text citations and the reference list follow APA. The guide asks for a "Kaynaklar" list at the end of
  // Genel Bilgi and of Yöntem (§1.4, §1.5), written inside those sections; no global bibliography section is added.
  bibliography: { heading: "Kaynaklar", style: { fontFamily: FONT, fontSizePt: 12 }, citationStyle: "apa" },
  toc: { heading: "İÇİNDEKİLER", levels: [1], showPageNumbers: false },
});

export const afsuLeeProposalMaster = build("master", "(Yüksek Lisans Tez Önerisi)", "master", "Yüksek Lisans Tez Önerisi");
export const afsuLeeProposalPhd = build("phd", "(Doktora Tez Önerisi)", "phd", "Doktora Tez Önerisi");
export default afsuLeeProposalMaster;
