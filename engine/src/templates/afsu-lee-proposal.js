/**
 * Afyonkarahisar Sağlık Bilimleri Üniversitesi, Lisansüstü Eğitim Enstitüsü,
 * Yüksek Lisans / Doktora Tez Önerisi (Turkish).
 *
 * Only source: AFSU_Lisansustu_Tez_Onerisi_Hazirlama_Kilavuzu_2025.pdf (10 pages, Aralık 2025).
 * Evidence, UNKNOWNs and engine gaps: orchestration/specs/afsu-lee-proposal.json and
 * orchestration/reports/afsu-lee-proposal.md. No value is taken from the LEE thesis template.
 *
 * The guide states no page/body/heading rules itself: §1.1/§1.2 explicitly defer to the AFSÜ LEE thesis writing guide, so those
 * rules are EXPLICIT-by-reference (taken from orchestration/specs/afsu-lee.json). Proposal-specific values (cover sizes, outline, APA,
 * Kaynaklar placement) win. Details: spec and report.
 */

const FONT = "Times New Roman"; // EXPLICIT-by-reference (LEE guide: "Tezin tüm bölümlerinde Times New Roman"); also MEASURED in this PDF
// EXPLICIT-by-reference (proposal §1.1 -> AFSÜ LEE thesis guide, Sayfa Düzeni / Yazım Şekli ve Karakteri): 12 pt, 1.5 lines,
// justified, no paragraph indent, 6 pt before and 6 pt after (literal Word values).
const BODY = { fontFamily: FONT, fontSizePt: 12, lineHeight: 1.5, align: "justify", spaceBeforePt: 6, spaceAfterPt: 6, firstLineIndentMm: 0 };
// EXPLICIT-by-reference (LEE guide, Bölüm Başlıklarının Yazım Kuralları): H1 uppercase bold 14 centred, own page, numbered "1.";
// H2 bold 14 left, each word capitalised except ve/veya/ile; H3 bold 12 left, first word only; H4+ bold italic 12, unnumbered.
// Sub-heading number formats "1.1." / "1.1.1." are INFERRED (the guide prose shows only "1., 2., 3.").
const hd = (level, size, extra) => ({ fontFamily: FONT, fontSizePt: size, fontWeight: 700, align: "left", lineHeight: 1.5, spaceBeforePt: 6, spaceAfterPt: 6, firstLineIndentMm: 0, keepWithNext: true, numbering: { enabled: true, format: Array.from({ length: level }, (_, i) => `{${i + 1}}`).join(".") + ".", sequence: "arabic" }, ...extra });
const HEADINGS = {
  "1": hd(1, 14, { align: "center", textTransform: "uppercase", pageBreakBefore: true }),
  "2": hd(2, 14, { textTransform: "capitalize", textTransformExceptions: ["ve", "veya", "ile"] }),
  "3": hd(3, 12, { textTransform: "none" }),
  "4": hd(4, 12, { italic: true, textTransform: "none", numbering: { enabled: false, format: "{1}.{2}.{3}.{4}.", sequence: "arabic" } }),
};
// Page numbers: position bottom-right is EXPLICIT-by-reference; the proposal has no front matter, so Arabic numbering from the first
// body page (cover unnumbered) is INFERRED from the LEE rule "numbering starts with the main text".
const NO_NUMBER = { numbering: { enabled: false, position: "bottom", align: "right", format: "arabic" } };
const BODY_NUMBER = { numbering: { enabled: true, position: "bottom", align: "right", format: "arabic", startAt: 1, restart: true } };
const CONT_NUMBER = { numbering: { enabled: true, position: "bottom", align: "right", format: "arabic", restart: false } };

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
  // Sample is centred on the PAGE (x=297 pt); with the reference's 40/25 mm margins it would be off-centre, so the cover uses symmetric margins (value 25 mm = reference right margin; cover margins UNKNOWN).
  overrides: { page: { ...NO_NUMBER, margins: { topMm: 25, bottomMm: 25, leftMm: 25, rightMm: 25 } }, body: { ...BODY, align: "center", spaceBeforePt: 0, spaceAfterPt: 0, lineHeight: 1 } },
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
// and are treated as main (H1) sections: whether the proposal's sections count as "ana bölüm" is INFERRED.
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
  id, type: index === 0 ? "mainContent" : "custom", title, status: "required", group: "body", mode: "editable", showTitle: true, tocEntry: "none", titleNumbering: "continueH1",
  overrides: { page: index === 0 ? BODY_NUMBER : CONT_NUMBER },
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
      "The guide is not a format specification: it defines the cover example (Şekil 1) and the content outline (§1.3-§1.12). Page, body, heading, footnote, caption and reference rules are EXPLICIT-by-reference: proposal §1.1/§1.2 defer to the AFSÜ LEE thesis writing guide (rules taken from orchestration/specs/afsu-lee.json, not from afsu-lee.js). Proposal-specific cover sizes, outline, APA and Kaynaklar placement win. Page-number start, heading-level mapping, sub-heading number formats are INFERRED.",
      "The cover parenthetical is stated only for the doctorate ('(Doktora Tez Önerisi)'); the master's wording is INFERRED by substitution (the Şekil 1 caption names 'Yüksek Lisans/Doktora').",
      "Engine gap: the 'ÖRNEK ÇALIŞMA TAKVİMİ' landscape fill-in grid (13 rows x 19 month columns, merged AYLAR header) cannot be expressed by static blocks; not reproduced. Authors insert their own table in the 'Çalışma Takvimi' section.",
    ],
  },
  page: {
    size: "A4", widthMm: 210, heightMm: 297, orientation: "portrait", // MEASURED 595.32 x 841.92 pt pages
    margins: { topMm: 25, leftMm: 40, bottomMm: 25, rightMm: 25 }, // EXPLICIT-by-reference: LEE guide "Üst/alt/sağ 2,5 cm, sol 4 cm" (proposal §1.1)
    numbering: { enabled: true, position: "bottom", align: "right", format: "arabic" },
  },
  typography: {
    body: BODY,
    paragraph: { firstLineIndentMm: 0 },
    headings: HEADINGS,
    footnotes: { placement: "pageBottom", fontFamily: FONT, fontSizePt: 10, lineHeight: 1, firstLineIndentMm: 0 }, // EXPLICIT-by-reference: 10 pt TNR
    lineSpacing: { mode: "word", singleLineEm: 1.15, baseline: "word", paragraphSpacing: "collapse" }, // 1.15 em = engine calibration; 6/6 pt literal values
  },
  placeholders: {
    DEPARTMENT_NAME: { label: "Anabilim dalı adı (yalnız adı; ANABİLİM DALI eki şablondan gelir)", type: "text", required: true },
    THESIS_TITLE: { label: "Tezin adı", type: "multiline", required: true },
    STUDENT_NAME: { label: "Hazırlayan (Adı ve SOYADI)", type: "text", required: true },
    ADVISOR_NAME: { label: "Danışman (Unvanı, Adı ve SOYADI)", type: "text", required: true },
    THESIS_YEAR: { label: "Yıl", type: "number", required: true },
  },
  sections: [cover(degreeLabel), ...bodySections],
  // Captions EXPLICIT-by-reference: 12 pt, figure caption below centred, table caption above left; table/figure/formula content 10 pt. Caption numbering format UNKNOWN (document-wide arabic).
  tables: { label: "Tablo", position: "above", numbering: { scope: "document", format: "{n}", sequence: "arabic" }, captionAlignment: "left", style: { fontFamily: FONT, fontSizePt: 12, lineHeight: 1 } },
  figures: { label: "Şekil", position: "below", numbering: { scope: "document", format: "{n}", sequence: "arabic" }, captionAlignment: "center", style: { fontFamily: FONT, fontSizePt: 12, lineHeight: 1 } },
  // EXPLICIT (§1.1): in-text citations and the reference list follow APA. The guide asks for a "Kaynaklar" list at the end of
  // Genel Bilgi and of Yöntem (§1.4, §1.5), written inside those sections; no global bibliography section is added.
  bibliography: { heading: "Kaynaklar", style: { fontFamily: FONT, fontSizePt: 10, lineHeight: 1, spaceAfterPt: 6, firstLineIndentMm: 0 }, citationStyle: "apa" }, // 10 pt, single, 6 pt between entries: EXPLICIT-by-reference
  toc: { heading: "İÇİNDEKİLER", levels: [1, 2, 3, 4], showPageNumbers: true },
});

export const afsuLeeProposalMaster = build("master", "(Yüksek Lisans Tez Önerisi)", "master", "Yüksek Lisans Tez Önerisi");
export const afsuLeeProposalPhd = build("phd", "(Doktora Tez Önerisi)", "phd", "Doktora Tez Önerisi");
export default afsuLeeProposalMaster;
