/**
 * Afyon Kocatepe Üniversitesi, Fen Bilimleri Enstitüsü, İş Güvenliği Anabilim Dalı, Tezsiz Yüksek Lisans (İÖ) Programı: Dönem Projesi
 * (aku-isg-tezsiz-proje-tr-v1).
 *
 * Source (Butun-Sablonlar/Ege/Afyon Kocatepe Üniversitesi/Fen_Bilimleri_Is_Guvenligi_Tezsiz_Proje/): one Word 97-2003 template,
 * AKU_Fen_Bilimleri_Is_Guvenligi_Donem_Projesi_Sablonu_2022.doc (Last-Modified 2022-08-02), converted by Microsoft Word to isg.docx / isg.pdf
 * (orchestration/artifacts/aku-isg-tezsiz-proje/source/). The template XML (three sectPr, styles, paragraph/run properties, empty-paragraph
 * structure, footer fields) and the Word render's baselines are the only evidence; the template's own instruction text is EXPLICIT.
 * AKÜ FBE's thesis template (aku-fbe.js) is NOT a value source. Spec: orchestration/specs/aku-isg-tezsiz-proje.json, report:
 * orchestration/reports/aku-isg-tezsiz-proje.md.
 *
 * Special pages (cover, inner cover, ethics, approval, abstracts) are laid out from the template's own empty-paragraph structure; because
 * the engine places blocks by spacers, every line is positioned by its MEASURED Word baseline (flow() below turns baselines into spacers of
 * the engine's Word line model). Word collapses adjacent space-after/space-before, the editor sums them, so spacing on those pages is
 * carried by the spacers and every line has 0/0 spacing.
 */
import { MM_PER_PT } from "../units.js";

const FONT = "Times New Roman";
const SINGLE_LINE_EM = 1.15;
const ASCENT_EM = 0.9336;
/** First baseline of a line sits ASCENT_EM below its line box top; the leading of 1.25 / 1.5 lines goes below the text. */
const ascentMm = (sizePt) => ASCENT_EM * sizePt * MM_PER_PT;
const lineMm = (sizePt, spacing) => sizePt * SINGLE_LINE_EM * spacing * MM_PER_PT;
const belowMm = (sizePt, spacing) => lineMm(sizePt, spacing) - ascentMm(sizePt);
const round = (v) => Math.round(v * 1000) / 1000;
const spacer = (mm) => ({ type: "spacer", heightMm: round(mm) });

const bold = { fontWeight: 700 };
const FRONT_MARGINS = { topMm: 25, bottomMm: 25, leftMm: 30, rightMm: 30 }; // sectPr #2 (1418 / 1701 twips)
const BODY_MARGINS = { topMm: 30, bottomMm: 30, leftMm: 30, rightMm: 30 };  // sectPr #3 (1701 twips)
const COVER_MARGINS = { topMm: 30, bottomMm: 30, leftMm: 40, rightMm: 25 }; // sectPr #1 (1701 / 2268 / 1418 twips)
const roman = { margins: FRONT_MARGINS, numbering: { format: "roman-lower" } };

/**
 * Lays out lines at their measured baselines. item: { b: baseline mm from the page top, sz, sp (line spacing), n (lines), text|block, style }.
 * Spacers fill the distance between the previous line's bottom and this line's top (top margin = `topMm`).
 */
function flow(topMm, items) {
  const out = [];
  let cursor = topMm;
  for (const it of items) {
    const sz = it.sz ?? 12;
    const sp = it.sp ?? 1;
    const gap = it.b - ascentMm(sz) - cursor;
    if (gap > 0.005) out.push(spacer(gap));
    const style = { fontSizePt: sz, lineHeight: sp, spaceBeforePt: 0, spaceAfterPt: 0, firstLineIndentMm: 0, ...(it.style || {}) };
    out.push(it.block ? { ...it.block, style: { ...style, ...(it.block.style || {}) } } : { type: "text", value: it.text, style });
    const n = it.n ?? 1;
    cursor = it.b + (n - 1) * lineMm(sz, sp) + belowMm(sz, sp);
  }
  return out;
}
const meta = (field, fallback) => ({ type: "metadata", field, fallback });

// ---- special pages (sectPr #1 and #2; baselines MEASURED on isg.pdf) ---------------------------------------------------------------------

// Outer cover: sectPr #1 (top/bottom 30, left 40, right 25 mm); 35 empty paragraphs, then the block of centred 12 pt lines.
const outerCover = {
  id: "outer-cover", type: "outerCover", title: "DIŞ KAPAK", status: "required", group: "cover", mode: "static", tocEntry: "none",
  overrides: { page: { margins: COVER_MARGINS, numbering: { enabled: false } }, body: { align: "center" } },
  blocks: flow(COVER_MARGINS.topMm, [
    { b: 215.2, block: meta("THESIS_TITLE", "DÖNEM PROJESİNİN ADI"), style: bold },
    { b: 222.2, block: meta("STUDENT_NAME", "Ad SOYAD") },
    { b: 229.2, text: "İş Güvenliği Anabilim Dalı" },
    { b: 236.2, text: "Tezsiz Yüksek Lisans (İÖ) Programı" },
    { b: 243.2, text: "Dönem Projesi" },
    { b: 250.2, sp: 1.5, text: "Danışman: {{ADVISOR_TITLE}} {{ADVISOR_NAME}}" },
    { b: 259.6, text: "Afyonkarahisar" },
  ]),
};

// Inner cover: first page of sectPr #2 (page "i", counted, number not printed: titlePg without a first-page footer). All lines bold except the last, 1.5 lines.
const innerCover = {
  id: "inner-cover", type: "innerCover", title: "İÇ KAPAK", status: "required", group: "cover", mode: "static", tocEntry: "none",
  overrides: { page: { margins: FRONT_MARGINS, numbering: { enabled: false, format: "roman-lower", startAt: 1, restart: true } }, body: { align: "center" } },
  blocks: flow(FRONT_MARGINS.topMm, [
    { b: 29.0, sp: 1.5, text: "T.C.", style: bold },
    { b: 38.4, sp: 1.5, text: "AFYON KOCATEPE ÜNİVERSİTESİ", style: bold },
    { b: 47.8, sp: 1.5, text: "FEN BİLİMLERİ ENSTİTÜSÜ", style: bold },
    { b: 57.2, sp: 1.5, text: "İŞ GÜVENLİĞİ ANABİLİM DALI", style: bold },
    { b: 66.6, sp: 1.5, text: "TEZSİZ YÜKSEK LİSANS PROGRAMI (İÖ)", style: bold },
    { b: 106.6, sz: 16, sp: 1.5, block: meta("THESIS_TITLE", "DÖNEM PROJESİNİN ADI"), style: bold },
    { b: 136.9, sp: 1.5, text: "Hazırlayan:", style: bold },
    { b: 144.2, sp: 1.5, block: meta("STUDENT_NAME", "Ad SOYAD"), style: bold },
    { b: 151.5, sp: 1.5, block: meta("STUDENT_NUMBER", "Numara"), style: bold },
    { b: 180.7, sp: 1.5, text: "Danışman:", style: bold },
    { b: 188.0, sp: 1.5, text: "{{ADVISOR_TITLE}} {{ADVISOR_NAME}}", style: bold },
    { b: 261.1, sp: 1.5, text: "Afyonkarahisar, {{YEAR}}" },
  ]),
};

// BİLİMSEL ETİK BİLDİRİM SAYFASI (page "ii"): bold centred title; justified 1.5-line paragraph with a 12.5 mm (709 twips) first-line indent;
// date / name / İmza right-aligned lines.
const ethics = {
  id: "ethics", type: "ethicsDeclaration", title: "BİLİMSEL ETİK BİLDİRİM SAYFASI", status: "required", group: "front", mode: "static", tocEntry: "title",
  overrides: { page: roman, body: { align: "left" } },
  blocks: flow(FRONT_MARGINS.topMm, [
    { b: 40.5, sp: 1.5, text: "BİLİMSEL ETİK BİLDİRİM SAYFASI", style: { ...bold, align: "center" } },
    { b: 59.3, sp: 1.5, n: 5, style: { align: "justify", firstLineIndentMm: 12.5 },
      text: "Dönem Projesi olarak sunduğum “{{THESIS_TITLE}}” adlı çalışmanın, tarafımdan bilimsel ahlak ve geleneklere aykırı düşecek bir yardıma başvurmaksızın yazıldığını ve yararlandığım eserlerin kaynakça’da gösterilen eserlerden oluştuğunu, bunlara atıf yapılarak yararlanmış olduğumu belirtir ve bunu onurumla doğrularım." },
    { b: 107.4, sp: 1.5, block: meta("SIGN_DATE", "…. / …. / 20….."), style: { align: "right" } },
    { b: 126.2, sp: 1.5, block: meta("STUDENT_NAME", "Öğrenci Adı, Soyadı"), style: { align: "right" } },
    { b: 135.7, sp: 1.5, text: "İmza", style: { align: "right" } },
  ]),
};

// ONAY SAYFASI (page "iii"): bold centred header block, justified paragraph (bold: "İş Güvenliği" and the quoted title), İmza, then the
// Danışman / Anabilim Dalı Başkanı rows (label | ": Unvan, Ad, Soyad" bold | signature dots) with tab columns at 30 / 80 / 142.4 mm.
const signRow = (label, valueText) => ({ type: "group", direction: "row", blocks: [
  { type: "text", value: label, widthPercent: 33.33, style: { align: "left" } },
  { type: "text", value: valueText, widthPercent: 41.6, style: { align: "left", fontWeight: 700 } },
  { type: "text", value: "………………", widthPercent: 25.07, style: { align: "left" } },
] });
const approval = {
  id: "approval", type: "approval", title: "ONAY SAYFASI", status: "required", group: "front", mode: "static", tocEntry: "title",
  overrides: { page: roman, body: { align: "left" } },
  blocks: flow(FRONT_MARGINS.topMm, [
    { b: 31.1, sp: 1.5, text: "İŞ GÜVENLİĞİ ANABİLİM DALI", style: { ...bold, align: "center" } },
    { b: 40.5, sp: 1.5, text: "TEZSİZ YÜKSEK LİSANS PROGRAMI (İÖ)", style: { ...bold, align: "center" } },
    { b: 52.0, sp: 1.5, text: "ONAY SAYFASI", style: { ...bold, align: "center" } },
    { b: 75.7, sp: 1.5, n: 5, style: { align: "justify" },
      block: { type: "text", markup: "inline",
        value: "**İş Güvenliği** Anabilim Dalı Tezsiz Yüksek Lisans Programı (İÖ) {{STUDENT_NUMBER}} numaralı öğrencisi {{STUDENT_NAME}}’nın; “**{{THESIS_TITLE}}**” başlıklı Dönem Projesi, Afyon Kocatepe Üniversitesi Lisansüstü Eğitim ve Öğretim Sınav Yönetmeliği’nin ilgili maddeleri uyarınca, değerlendirilerek {{ACCEPT_DATE}} tarihinde kabul edilmiştir." } },
    { b: 130.8, sp: 1, block: { type: "text", value: "İmza", style: { ...bold, decoration: "underline", leftIndentMm: 112.4, align: "left" } } },
    { b: 149.0, sp: 1, block: signRow("Danışman", ": {{ADVISOR_TITLE}} {{ADVISOR_NAME}}") },
    { b: 169.0, sp: 1, block: signRow("Anabilim Dalı Başkanı:", ": {{HEAD_TITLE}} {{HEAD_NAME}}") },
  ]),
};

// ÖZET / ABSTRACT: Balk1 title (bold, centred; ÖZET 1.25 lines, ABSTRACT 1.5), bold centred work title, then single-spaced paragraphs
// (6 pt before and after, 12.5 mm first-line indent; bold because the sample paragraphs use Balk1) and the bold keyword line.
const abstractHeader = (id, type, title, titleSp, workTitle, tail) => ({
  id, type, title, status: "required", group: "front", mode: "static", standalone: false, tocEntry: "title",
  overrides: { page: roman, body: { align: "center", ...bold } },
  blocks: [...flow(FRONT_MARGINS.topMm, [
    { b: 33.2, sp: titleSp, text: title, style: { ...bold, align: "center" } },
    { b: titleSp === 1.25 ? 44.2 : 40.5, sp: 1, block: workTitle, style: { ...bold, align: "center" } },
  ]), ...(tail ? [spacer(tail)] : [])],
});
const abstractText = (id, type, title) => ({ id, type, title, status: "required", group: "front", mode: "editable", pageBreakBefore: false, showTitle: false,
  overrides: { page: roman, paragraph: { fontWeight: 700, lineHeight: 1, spaceBeforePt: 6, spaceAfterPt: 6, firstLineIndentMm: 12.5, align: "justify" } } });
const abstractFooter = (id, type, title, text, lead) => ({
  id, type, title, status: "required", group: "front", mode: "static", standalone: false, pageBreakBefore: false,
  overrides: { page: roman, body: { align: "justify", ...bold } },
  blocks: [...(lead ? [spacer(lead)] : []), { type: "text", value: text, style: { lineHeight: 1.5, spaceBeforePt: 0, spaceAfterPt: 0, firstLineIndentMm: 0, align: "justify", fontWeight: 700 } }],
});
const abstractSections = [
  // ÖZET: title 1.25 lines, one empty single line, work title, one empty 1.25-line paragraph, text; keywords one empty single line + 12 pt below the text.
  abstractHeader("abstract-tr", "abstract", "ÖZET", 1.25, meta("THESIS_TITLE", "ÇALIŞMANIN BAŞLIĞI"), 6.09),
  abstractText("abstract", "abstract", "Özet metni"),
  abstractFooter("abstract-footer", "abstract", "Özet anahtar kelimeler", "Anahtar Kelimeler: {{KEYWORDS}}", 9.1),
  // ABSTRACT: title 1.5 lines, work title directly below; keywords directly below the text (12 pt before).
  abstractHeader("abstract-en-header", "englishAbstract", "ABSTRACT", 1.5, meta("THESIS_TITLE_EN", "ÇALIŞMANIN BAŞLIĞI"), 0),
  abstractText("abstract-en", "englishAbstract", "Abstract text"),
  abstractFooter("abstract-en-footer", "englishAbstract", "Abstract keywords", "Keywords:: {{KEYWORDS_EN}}", 2.11),
];

// ---- generated pages and headings ---------------------------------------------------------------------------------------------------

/** Balk1 title of a front page: bold, centred, 1.5 lines, 12 pt before (measured baseline 33.2 mm = 25 + 4.23 + 3.95), no space after. */
const frontTitle = { "1": { align: "center", textTransform: "none", fontWeight: 700, lineHeight: 1.5, spaceBeforePt: 12, spaceAfterPt: 0, firstLineIndentMm: 0, numbering: { enabled: false } } };
/** "Sayfa": bold, underlined, right-aligned, single, directly below the title. */
const pageHeadingStyle = { fontWeight: 700, decoration: "underline", lineHeight: 1, spaceBeforePt: 0, spaceAfterPt: 0, align: "right" };
const indexRule = (kind, title, extra = {}) => ({
  kind, title, leader: "dots", leaderFlow: "inline", pageHeading: "Sayfa", pageHeadingStyle, indentMm: 0,
  style: { lineHeight: 1, spaceBeforePt: 0, spaceAfterPt: 0, align: "left", fontWeight: 700 }, ...extra,
});
const listSection = (id, type, title, kind) => ({
  id, type, title, status: "required", group: "front", mode: "generated", tocEntry: "title",
  generatedIndex: indexRule(kind, title), overrides: { page: roman, headings: frontTitle },
});

const sections = [
  outerCover,
  innerCover,
  ethics,
  approval,
  ...abstractSections,
  // İÇİNDEKİLER: rows of the template's "toc 1" / "toc 2" styles: level 1 and titles bold single 0/0 (the sample rows), level 2 bold 1.5 lines 6/6.
  { id: "toc", type: "tableOfContents", title: "İÇİNDEKİLER", status: "required", group: "front", mode: "generated", tocEntry: "title",
    generatedIndex: indexRule("toc", "İÇİNDEKİLER", {
      hanging: 6.3,
      levelStyles: {
        "1": { fontWeight: 700 }, "2": { fontWeight: 700, lineHeight: 1.5, spaceBeforePt: 6, spaceAfterPt: 6 },
        "3": { fontWeight: 700, lineHeight: 1.5, spaceBeforePt: 6, spaceAfterPt: 6 }, "4": { fontWeight: 400, lineHeight: 1.5, spaceBeforePt: 6, spaceAfterPt: 6 },
        unnumbered: { fontWeight: 700 },
      },
    }),
    overrides: { page: roman, headings: frontTitle } },
  listSection("list-tables", "listOfTables", "ÇİZELGELER DİZİNİ", "tables"),
  listSection("list-figures", "listOfFigures", "ŞEKİLLER DİZİNİ", "figures"),
  // SİMGELER VE KISALTMALAR DİZİNİ: title (Balk1) and "Sayfa" (bold, underlined, right) over empty centred 1.5-line paragraphs (no entry format defined).
  { id: "symbols-header", type: "listOfAbbreviations", title: "SİMGELER VE KISALTMALAR DİZİNİ", status: "required", group: "front", mode: "static", standalone: false, tocEntry: "title",
    overrides: { page: roman, body: { align: "center", ...bold } },
    blocks: flow(FRONT_MARGINS.topMm, [
      { b: 33.2, sp: 1.5, text: "SİMGELER VE KISALTMALAR DİZİNİ", style: { ...bold, align: "center" } },
      { b: 40.5, sp: 1, text: "Sayfa", style: { ...bold, decoration: "underline", align: "right" } },
    ]) },
  { id: "symbols", type: "listOfAbbreviations", title: "Simgeler ve kısaltmalar", status: "required", group: "front", mode: "editable", pageBreakBefore: false, showTitle: false,
    overrides: { page: roman, paragraph: { lineHeight: 1.5, spaceBeforePt: 0, spaceAfterPt: 0, firstLineIndentMm: 0, align: "center" } } },
  // GİRİŞ restarts in Arabic at 1 (sectPr #3: pgNumType start 1, no titlePg: the number is printed on its first page).
  { id: "introduction", type: "introduction", title: "GİRİŞ", status: "required", group: "body", mode: "editable", showTitle: true, titleNumbering: "continueH1", tocEntry: "title",
    overrides: { page: { margins: BODY_MARGINS, numbering: { format: "arabic", startAt: 1, restart: true } } } },
  // The sample's chapters 2 and 3 follow each other without a forced break (the break before "2." / "3." is Word's own flow).
  { id: "main", type: "mainContent", title: "Bölümler", status: "required", group: "body", mode: "editable", pageBreakBefore: false },
  { id: "bibliography", type: "bibliography", title: "KAYNAKÇA", status: "required", group: "back", mode: "editable", showTitle: true, tocEntry: "title",
    overrides: { headings: { "1": { numbering: { enabled: false } } } } },
  { id: "appendices", type: "appendices", title: "EKLER", status: "optional", group: "back", mode: "editable", showTitle: true, tocEntry: "title",
    overrides: { headings: { "1": { numbering: { enabled: false } } } } },
  { id: "cv", type: "curriculumVitae", title: "ÖZGEÇMİŞ", status: "optional", group: "back", mode: "editable", showTitle: true, tocEntry: "title",
    overrides: { headings: { "1": { numbering: { enabled: false } } } } },
];

// ---- typography ---------------------------------------------------------------------------------------------------------------------

// Heading levels follow the real body pages of the template. H1 (1. GİRİŞ / 2. / 3. / KAYNAKÇA): bold capitals, "toc 1" paragraph format
// (single, 6/6 pt) as used by 3 of 4 chapter titles; GİRİŞ alone uses "heading 1" (1.5 lines, 12 pt before): CONFLICT recorded in the report.
const headingBase = { fontFamily: FONT, fontSizePt: 12, fontWeight: 700, align: "justify", firstLineIndentMm: 0, keepWithNext: false };
const headings = {
  "1": { ...headingBase, lineHeight: 1, spaceBeforePt: 6, spaceAfterPt: 6, textTransform: "uppercase", textTransformExceptions: ["ve"], numbering: { enabled: true, format: "{1}.", sequence: "arabic" } },
  "2": { ...headingBase, lineHeight: 1.5, spaceBeforePt: 12, spaceAfterPt: 0, numbering: { enabled: true, format: "{1}.{2}.", sequence: "arabic" } },
  "3": { ...headingBase, lineHeight: 1.5, spaceBeforePt: 6, spaceAfterPt: 6, numbering: { enabled: true, format: "{1}.{2}.{3}.", sequence: "arabic" } },
  // Level 4 is not in the body sample; the template's instruction plan shows "3.1.1.1." in regular weight, single, 6/6 pt.
  "4": { ...headingBase, fontWeight: 400, lineHeight: 1, spaceBeforePt: 6, spaceAfterPt: 6, numbering: { enabled: true, format: "{1}.{2}.{3}.{4}.", sequence: "arabic" } },
};

const captionStyle = { fontFamily: FONT, fontSizePt: 12 };

export const akuIsgTezsizProje = {
  schemaVersion: 1,
  templateVersion: "1.0.0",
  id: "aku-isg-tezsiz-proje-tr-v1",
  universityId: "aku",
  universityName: "Afyon Kocatepe Üniversitesi",
  instituteId: "fbe-isg-proje",
  instituteName: "Fen Bilimleri Enstitüsü · İş Güvenliği Anabilim Dalı · Tezsiz Yüksek Lisans (İÖ) Dönem Projesi",
  degreeType: "master",
  language: "tr",
  status: "official",
  displayName: "Afyon Kocatepe Üniversitesi · Fen Bilimleri Enstitüsü · İş Güvenliği Tezsiz Yüksek Lisans (İÖ) · Dönem Projesi",
  source: {
    type: "official",
    documentName: "AKÜ Fen Bilimleri Enstitüsü İş Güvenliği (İÖ) Tezsiz Yüksek Lisans Dönem Projesi Yazım Şablonu — AKU_Fen_Bilimleri_Is_Guvenligi_Donem_Projesi_Sablonu_2022.doc",
    revisionDate: "2022-08-02 (HTTP Last-Modified)",
    verifiedAt: "2026-10-02",
    notes: [
      "Tek kaynak bir Word şablonudur (.doc; Word ile .docx/.pdf'e çevrildi). Biçim kanıtı: üç bölümün sectPr'ı, stiller, paragraf/çalışma özellikleri, boş paragraf yapısı, altbilgi alanı ve Word PDF taban çizgileri. Şablonun yönerge metinleri açık kuraldır. AKÜ FBE tez şablonu (aku-fbe.js) değer kaynağı DEĞİLDİR.",
      "Kenar boşlukları (TEMPLATE): dış kapak üst/alt 30, sol 40, sağ 25 mm; iç kapak ile giriş öncesi sayfalar (etik, onay, özet, abstract, içindekiler, dizinler) üst/alt 25, sol/sağ 30 mm; giriş ve sonrası 30/30/30/30 mm. Üstbilgi/altbilgi mesafesi 12,5 mm (709 twip).",
      "Sayfa numarası (TEMPLATE): altta ortada, 11 punto Times New Roman, PAGE alanı. Dış kapak sayılmaz; iç kapak 'i' sayılır ama numarası basılmaz (titlePg, ilk sayfa altbilgisi yok); etik 'ii'dir; ön kısım küçük Romen rakamı; GİRİŞ Arapça 1'den başlar.",
      "Gövde (MEASURED, tek gerçek örnek paragraf): Times New Roman 12, iki yana yaslı, 1,5 satır, önce/sonra 0, ilk satır girintisi yok. Özet örnek satırlarında 12,5 mm girinti vardır (özet/abstract paragraflarında uygulandı); GİRİŞ örnek satırlarında da 12,5 mm girinti vardır ama gerçek metin paragrafında yoktur (ÇELİŞKİ, bkz. rapor).",
      "Başlıklar (gerçek gövde sayfaları): H1 kalın, büyük harf, tek satır, 6/6 nk ('toc 1' biçimi; yalnız GİRİŞ 'heading 1' biçimindedir: 1,5 satır, önce 12 nk: ÇELİŞKİ); H2 kalın 1,5 satır önce 12; H3 kalın 1,5 satır 6/6; H4 gövdede yok, yönerge planında normal ağırlık. Numaralandırma 1. / 2.1. / 2.1.1. (bölüm numarası dahil, yazılı). Şablonun 'ÖRNEK (GEÇİCİ TASLAK) PLAN' metni 'BİRİNCİ BÖLÜM' ortalı başlıkları ve bölüm başına yeniden başlayan numaralar gösterir; gerçek sayfalarla çeliştiği için uygulanmadı (ÇELİŞKİ).",
      "UNKNOWN / zorlanan alanlar: tablo ve şekil başlığı etiketi, konumu, biçimi ve numaralandırması (şablonda yalnız 'ÇİZELGELER DİZİNİ' ve 'ŞEKİLLER DİZİNİ' başlıkları vardır; etiketler Çizelge/Şekil ÇIKARIM), dipnot biçimi, blok alıntı, denklem, ek düzeni, özgeçmiş düzeni, dizin satır biçimleri (örnek satır yok), tablo çizgileri.",
    ],
  },
  page: {
    size: "A4", widthMm: 210, heightMm: 297, orientation: "portrait",
    margins: BODY_MARGINS,
    header: { heightMm: 0, distanceMm: 12.5, content: "", firstPage: "same" },
    footer: { heightMm: 4.9, distanceMm: 17.4, content: "", firstPage: "same" },
    numbering: { enabled: true, position: "bottom", align: "center", format: "arabic", startAt: 1, restart: false, style: { fontFamily: FONT, fontSizePt: 11 } },
  },
  typography: {
    body: { fontFamily: FONT, fontSizePt: 12, fontWeight: 400, align: "justify", lineHeight: 1.5, spaceBeforePt: 0, spaceAfterPt: 0, firstLineIndentMm: 0 },
    paragraph: { firstLineIndentMm: 0, spaceBeforePt: 0, spaceAfterPt: 0, lineHeight: 1.5, align: "justify" },
    headings,
    lineSpacing: { mode: "word", singleLineEm: SINGLE_LINE_EM, baseline: "word", paragraphSpacing: "additive" },
  },
  sections,
  placeholders: {
    THESIS_TITLE: { label: "Dönem projesinin adı", type: "text", required: true },
    THESIS_TITLE_EN: { label: "Dönem projesinin adı (Abstract sayfası)", type: "text" },
    STUDENT_NAME: { label: "Ad SOYAD", type: "text", required: true },
    STUDENT_NUMBER: { label: "Öğrenci numarası", type: "text", required: true },
    ADVISOR_TITLE: { label: "Danışman unvanı", type: "text", required: true },
    ADVISOR_NAME: { label: "Danışman Ad-Soyad", type: "text", required: true },
    HEAD_TITLE: { label: "Anabilim Dalı Başkanı unvanı", type: "text" },
    HEAD_NAME: { label: "Anabilim Dalı Başkanı Ad-Soyad", type: "text" },
    YEAR: { label: "Kapak yılı (20....)", type: "number", required: true },
    SIGN_DATE: { label: "Etik bildirim tarihi (…. / …. / 20…..)", type: "text" },
    ACCEPT_DATE: { label: "Kabul tarihi (…/…/…)", type: "text" },
    KEYWORDS: { label: "Anahtar Kelimeler", type: "text" },
    KEYWORDS_EN: { label: "Keywords", type: "text" },
  },
  // Caption rules are UNKNOWN in the template: label from the list titles (INFERRED), the remaining fields are engine-required and neutral.
  tables: { label: "Çizelge", position: "above", style: captionStyle, numbering: { scope: "document", format: "{n}", sequence: "arabic" } },
  figures: { label: "Şekil", position: "below", style: captionStyle, numbering: { scope: "document", format: "{n}", sequence: "arabic" } },
  // KAYNAKÇA entries (sample): 1.5 lines, 6 pt before, hanging 709 twips (12.5 mm), justified; in-text "Baykal vd. (2015)", "(Petrucci ve Harwood 1993)" = author-year.
  bibliography: { heading: "KAYNAKÇA", style: { fontFamily: FONT, fontSizePt: 12, align: "justify", lineHeight: 1.5, spaceBeforePt: 6, spaceAfterPt: 0, firstLineIndentMm: 0, hangingIndentMm: 12.5 }, hangingIndentMm: 0, citationStyle: "author-year" },
  toc: { heading: "İÇİNDEKİLER", levels: [1, 2, 3, 4], showPageNumbers: true },
};

export default akuIsgTezsizProje;
