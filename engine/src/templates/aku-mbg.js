/**
 * Afyon Kocatepe Üniversitesi, Fen Edebiyat Fakültesi, Moleküler Biyoloji ve Genetik Bölümü, lisans bitirme tezi (Türkçe).
 *
 * Sources (Butun-Sablonlar/Ege/Afyon Kocatepe Üniversitesi/MBG_Lisans_Bitirme_Tezi/): "MBG Bölümü Lisans Tezi Yazım
 * Kılavuzu" (AKU_MBG_Lisans_Bitirme_Tezi_Kilavuzu_2025.pdf, 23 pages, 2025-05-13) and the Word template
 * AKU_MBG_Lisans_Bitirme_Tezi_Sablonu_2025.docx (2025-02-27). The reviewed spec is orchestration/specs/aku-mbg-lisans.json
 * (rule evidence, conflicts and decisions); the report is orchestration/reports/aku-mbg-lisans.md. Rule order: explicit
 * guide text > template XML (what the text leaves open) > the guide's own page geometry (only the Word line pitch and the
 * caption fonts; its printed margins and hanging indents are not normative). UNKNOWN stays UNKNOWN (see `source.notes`).
 *
 * Word line model (measured on the Word-made guide): a single Times New Roman line is 1.15 em, the first baseline of a
 * line box sits near 0.93 em below its top and the extra leading of "1,5 satır" goes below the text; paragraph spacing is
 * Word-additive. Special pages use spacers of whole Word lines ("n satır boşluk") like the template's empty paragraphs.
 *
 * One variant only (the sources offer no English thesis and no degree sub-variant). The Dış Kapak is not defined by either
 * source and is not generated; ÖZGEÇMİŞ has no sample page and is only offered as an optional, minimal section.
 */
import { MM_PER_PT } from "../units.js";
import { akuSeal, fefSeal } from "./assets/akuMbgLogos.js";

const FONT = "Times New Roman";
const SINGLE_LINE_EM = 1.15;
/** Word line of `sizePt` type at `spacing` (n lines), in pt and as an empty-line spacer in mm. */
const linePt = (sizePt, spacing) => sizePt * SINGLE_LINE_EM * spacing;
const blank = (lines = 1, sizePt = 12, spacing = 1.5) => ({ type: "spacer", heightMm: lines * linePt(sizePt, spacing) * MM_PER_PT });
/** One empty 12 pt line at 1.5 spacing: 20.7 pt (the guide's "bir satır boşluk"). */
const BLANK_PT = linePt(12, 1.5);

const bold = { fontWeight: 700 };
const upper = { textTransform: "uppercase" };
const grey = { color: "#bfbfbf" };
const page15 = { firstLineIndentMm: 0, spaceBeforePt: 0, spaceAfterPt: 0, lineHeight: 1.5 };
const roman = { numbering: { format: "roman-lower" } };

// ---- special pages -------------------------------------------------------------------------------------

// İç Kapak (template section 1): 14 pt bold, 1.5 lines everywhere ("Sadece bu sayfada 14 punto"), top margin 10.02 mm so the
// two seals sit at the top edge (TEMPLATE; the guide's generic 3 cm would push "Ay, Yıl" off the page: conflict recorded).
// Seals: AKÜ x0 32.01 mm (6.7 twips right-aligned run of spaces), Fen-Edebiyat Fakültesi right edge at the text edge, both 26.2 mm.
// Cached official Word page 1: first cover baseline = 43.949 mm. The prior 4.29 mm row gap placed the editor line at 45.165 mm;
// source-matched gap reduces that measured offset by 1.216 mm. (The logo row itself begins at y=10.0189 mm in official Word.)
const SEAL_MM = 26.19;
const COVER_TEXT_WIDTH_MM = 150;
const COVER_LOGO_ROW_GAP_MM = 3.074;
const innerCover = {
  id: "inner-cover", type: "innerCover", title: "İÇ KAPAK", status: "required", group: "cover", mode: "static", tocEntry: "none",
  overrides: { page: { margins: { topMm: 10.02, bottomMm: 30 }, numbering: { enabled: false }, trimTerminalTextLeading: true }, body: { ...page15, align: "center", fontSizePt: 14, fontWeight: 700 } },
  blocks: [
    { type: "group", direction: "row", marginBottomMm: COVER_LOGO_ROW_GAP_MM, blocks: [
      { type: "spacer", heightMm: 0, widthPercent: 2.0 / COVER_TEXT_WIDTH_MM * 100 },
      { type: "image", source: akuSeal, widthMm: SEAL_MM, heightMm: SEAL_MM, align: "left", widthPercent: SEAL_MM / COVER_TEXT_WIDTH_MM * 100 },
      { type: "spacer", heightMm: 0 },
      { type: "image", source: fefSeal, widthMm: 26.25, heightMm: 26.25, align: "right", widthPercent: 26.25 / COVER_TEXT_WIDTH_MM * 100 },
    ] },
    { type: "text", value: "AFYON KOCATEPE ÜNİVERSİTESİ" },
    { type: "text", value: "FEN EDEBİYAT FAKÜLTESİ" },
    { type: "text", value: "MOLEKÜLER BİYOLOJİ ve GENETİK BÖLÜMÜ" },
    blank(4, 14),
    { type: "text", value: "BİTİRME TEZİ" },
    blank(3, 14),
    { type: "metadata", field: "THESIS_TITLE", fallback: "BİTİRME TEZİ BAŞLIĞI", style: upper },
    blank(2, 14),
    { type: "metadata", field: "STUDENT_NAME", fallback: "Adı SOYADI" },
    blank(2, 14),
    { type: "text", value: "Danışman" },
    { type: "text", value: "{{ADVISOR_TITLE}} {{ADVISOR_NAME}}" },
    blank(6, 14),
    { type: "text", value: "{{SUBMISSION_MONTH}}, {{SUBMISSION_YEAR}}" },
  ],
};

// BİLİMSEL ETİK BİLDİRİM SAYFASI (template section 2): not counted, not numbered. Items are "•" rows (30.0 mm bullet, text at
// 37.5 mm = a 7.5 mm / 5 % column); the signature block is the template's (date right, grey İmza at 167.37 mm, name right).
// The name run has no size in the template (renders 10 pt); the guide's 12 pt rule applies (conflict recorded).
const ethicsItem = (text) => ({ type: "group", direction: "row", blocks: [
  { type: "text", value: "•", widthPercent: 5 },
  { type: "text", value: text, style: { align: "justify" } },
] });
const ethics = {
  id: "ethics", type: "ethicsDeclaration", title: "BİLİMSEL ETİK BİLDİRİM SAYFASI", status: "required", group: "front", mode: "static", tocEntry: "none",
  overrides: { page: { margins: { bottomMm: 30 }, numbering: { enabled: false } }, body: { ...page15, align: "left" } },
  blocks: [
    { type: "text", value: "BİLİMSEL ETİK BİLDİRİM SAYFASI", style: { ...bold, align: "center" } },
    { type: "text", value: "Afyon Kocatepe Üniversitesi", style: { ...bold, align: "center" } },
    blank(1),
    { type: "text", value: "Moleküler Biyoloji ve Genetik Bölümü, bitirme tezi yazım kurallarına uygun olarak hazırladığım bu bitirme tezi çalışmasında;", style: { ...bold, align: "justify", firstLineIndentMm: 12.5 } },
    ethicsItem("Bitirme tezi içindeki bütün bilgi ve belgeleri akademik kurallar çerçevesinde elde ettiğimi,"),
    ethicsItem("Görsel, işitsel ve yazılı tüm bilgi ve sonuçları bilimsel ahlak kurallarına uygun olarak sunduğumu,"),
    ethicsItem("Başkalarının eserlerinden yararlanılması durumunda ilgili eserlere bilimsel normlara uygun olarak atıfta bulunduğumu,"),
    ethicsItem("Atıfta bulunduğum eserlerin tümünü kaynak olarak gösterdiğimi,"),
    ethicsItem("Kullanılan verilerde herhangi bir tahrifat yapmadığımı,"),
    ethicsItem("Ve bu bitirme tezinin herhangi bir bölümünü bu üniversite veya başka bir üniversitede başka bir tez çalışması olarak sunmadığımı"),
    { type: "text", value: "beyan ederim.", style: { ...bold, align: "justify" } },
    blank(1),
    { type: "metadata", field: "DECLARATION_DATE", fallback: "GG / AA / YYYY", style: { ...bold, align: "right" } },
    blank(1),
    { type: "text", value: "İmza", style: { ...bold, ...grey, align: "left", leftIndentMm: 137.37 } },
    { type: "metadata", field: "STUDENT_NAME", fallback: "Adı SOYADI", style: { align: "right", lineHeight: 1 } },
  ],
};

// ÖZET / ABSTRACT (template sections 3-4): "ÖZET" bold, "Bitirme Tezi" / "Graduation Thesis" (the English page must say so, guide §4.2),
// a blank 1.5 line, the title in capitals SINGLE spaced and regular weight, a blank line, then 1.5-spaced lines. Then the abstract
// text (justified, 1.5, no indent), the keywords (guide order: keywords, then year + pages; the template has the reverse: conflict
// recorded) and the bold "<year>, <front pages in Roman> + <pages from GİRİŞ> sayfa" line.
const abstractHeader = (id, title, type, lines) => ({
  id, type, title, status: "required", group: "front", mode: "static", standalone: false, tocEntry: "title",
  overrides: { page: id === "abstract-tr" ? { numbering: { format: "roman-lower", startAt: 1, restart: true } } : roman, body: { ...page15, align: "center" } },
  blocks: lines,
});
const abstractTitle = (field, fallback, transform = upper) => ({ type: "metadata", field, fallback, style: { ...transform, lineHeight: 1 } });
const abstractText = (id, type, title) => ({ id, type, title, status: "required", group: "front", mode: "editable", pageBreakBefore: false, showTitle: false,
  overrides: { page: roman, paragraph: { firstLineIndentMm: 0 } } });
const abstractFooter = (id, type, title, keywords, hangMm, pages) => ({
  id, type, title, status: "required", group: "front", mode: "static", standalone: false, pageBreakBefore: false,
  overrides: { page: roman, body: { ...page15, align: "left" } },
  // The abstract's last paragraph already carries its empty line (paragraph spacing) before the keywords.
  blocks: [
    { type: "text", markup: "inline", value: keywords, style: { align: "justify", hangingIndentMm: hangMm } },
    blank(1),
    { type: "text", value: pages, style: { ...bold, align: "justify" } },
  ],
});
const abstractTr = [
  abstractHeader("abstract-tr", "ÖZET", "abstract", [
    { type: "text", value: "ÖZET", style: bold },
    { type: "text", value: "Bitirme Tezi" },
    blank(1),
    abstractTitle("THESIS_TITLE", "BİTİRME TEZİ BAŞLIĞI"),
    blank(1),
    { type: "metadata", field: "STUDENT_NAME", fallback: "Adı SOYADI" },
    { type: "text", value: "Afyon Kocatepe Üniversitesi" },
    { type: "text", value: "Fen Edebiyat Fakültesi" },
    { type: "text", value: "Moleküler Biyoloji ve Genetik Bölümü" },
    { type: "text", markup: "inline", value: "**Danışman:** {{ADVISOR_TITLE}} {{ADVISOR_NAME}}" },
    blank(1),
  ]),
  abstractText("abstract", "abstract", "Özet metni"),
  abstractFooter("abstract-footer", "abstract", "Özet anahtar kelimeler", "**Anahtar Kelimeler:** {{KEYWORDS_TR}}", 37.52, "{{DEFENSE_YEAR}}, {{FRONT_PAGE_COUNT}} + {{BODY_PAGE_COUNT}} sayfa"),
];
const abstractEn = [
  abstractHeader("abstract-en-header", "ABSTRACT", "englishAbstract", [
    { type: "text", value: "ABSTRACT", style: bold },
    { type: "text", value: "Graduation Thesis" },
    blank(1),
    abstractTitle("THESIS_TITLE_EN", "TITLE OF GRADUATION THESIS"),
    blank(1),
    { type: "metadata", field: "STUDENT_NAME", fallback: "Name SURNAME" },
    { type: "text", value: "Afyon Kocatepe University" },
    { type: "text", value: "Faculty of Science and Arts" },
    { type: "text", value: "Department of Molecular Biology and Genetics" },
    { type: "text", markup: "inline", value: "**Supervisor:** {{ADVISOR_TITLE_EN}} {{ADVISOR_NAME}}" },
    blank(1),
  ]),
  abstractText("abstract-en", "englishAbstract", "Abstract text"),
  abstractFooter("abstract-en-footer", "englishAbstract", "Abstract keywords", "**Keywords:** {{KEYWORDS_EN}}", 22.0, "{{DEFENSE_YEAR}}, {{FRONT_PAGE_COUNT}} + {{BODY_PAGE_COUNT}} pages"),
];

/** Front-matter title (ÖZET-like pages, TEŞEKKÜR, dizinler): centred, bold, unnumbered, one empty 1.5 line (or `spaceAfterPt`) below. */
const frontTitle = (spaceAfterPt = BLANK_PT, align = "center") => ({ "1": { align, textTransform: "none", spaceAfterPt, numbering: { enabled: false } } });

const listRule = (kind, title) => ({
  kind, title, leader: "dots", leaderFlow: "inline", pageHeading: "Sayfa", hanging: "label", labelStyle: bold, indentMm: 0,
  pageHeadingStyle: { ...bold, lineHeight: 1.5, spaceBeforePt: 0, spaceAfterPt: 0 },
  // Template style "table of figures": 1.5 lines, 0 pt after, entries hang under the caption text.
  style: { lineHeight: 1.5, spaceBeforePt: 0, spaceAfterPt: 0, align: "left" },
});
const generatedList = (id, type, title, kind, count) => ({
  id, type, title, status: "required", group: "front", mode: "generated", tocEntry: "title", visibleWhen: { count, gte: 1 },
  generatedIndex: listRule(kind, title),
  overrides: { page: roman, headings: frontTitle(0) },
});

const sections = () => [
  innerCover,
  ethics,
  ...abstractTr,
  ...abstractEn,
  // TEŞEKKÜR: title, one empty line, text (max one page); two empty lines before the right-aligned signature (template).
  { id: "acknowledgements", type: "acknowledgements", title: "TEŞEKKÜR", status: "required", group: "front", mode: "editable", showTitle: true, tocEntry: "title",
    overrides: { page: roman, headings: frontTitle(), paragraph: { firstLineIndentMm: 0 } } },
  { id: "acknowledgements-signature", type: "acknowledgements", title: "Teşekkür imza", status: "required", group: "front", mode: "static", standalone: false, pageBreakBefore: false,
    overrides: { page: roman, body: { ...page15, align: "right" } },
    blocks: [blank(1), { type: "metadata", field: "STUDENT_NAME", fallback: "Adı SOYADI" }, { type: "text", value: "Afyonkarahisar {{YEAR}}" }] },
  // İÇİNDEKİLER DİZİNİ: bold centred title, "Sayfa" bold right directly below; rows 12 pt regular, 1.5 lines, 0 pt after, dot leader to the right edge.
  { id: "toc", type: "tableOfContents", title: "İÇİNDEKİLER DİZİNİ", status: "required", group: "front", mode: "generated", tocEntry: "title",
    generatedIndex: { kind: "toc", title: "İÇİNDEKİLER DİZİNİ", leader: "dots", leaderFlow: "inline", pageHeading: "Sayfa", hanging: "label", indentMm: 5, matchHeadingTransform: true,
      pageHeadingStyle: { ...bold, lineHeight: 1.5, spaceBeforePt: 0, spaceAfterPt: 0 }, style: { lineHeight: 1.5, spaceBeforePt: 0, spaceAfterPt: 0, align: "left" } },
    overrides: { page: roman, headings: frontTitle(0) } },
  // SİMGELER ve KISALTMALAR DİZİNİ: the template sets the title left (the guide is silent: conflict recorded); single spaced, definitions on a
  // tab stop 40.71 mm from the margin. The template's two-column table with its 0.5 pt rules is author content.
  { id: "symbols", type: "listOfAbbreviations", title: "SİMGELER ve KISALTMALAR DİZİNİ", status: "optional", group: "front", mode: "editable", showTitle: true, tocEntry: "title",
    overrides: { page: roman, headings: frontTitle(BLANK_PT, "left"), paragraph: { firstLineIndentMm: 0, align: "left", lineHeight: 1, spaceBeforePt: 0, spaceAfterPt: 0, tabStopMm: 40.71, hangingIndentMm: 40.71 } } },
  generatedList("list-figures", "listOfFigures", "ŞEKİLLER DİZİNİ", "figures", "figures"),
  generatedList("list-tables", "listOfTables", "ÇİZELGELER DİZİNİ", "tables", "tables"),
  generatedList("list-photos", "custom", "RESİMLER DİZİNİ", "photo", "photo"),
  // 1. GİRİŞ restarts the numbering in Arabic at 1; the numbered chapters follow in "Bölümler" and KAYNAKLAR/EKLER continue the numbers.
  { id: "introduction", type: "introduction", title: "GİRİŞ", status: "required", group: "body", mode: "editable", showTitle: true, titleNumbering: "continueH1",
    overrides: { page: { numbering: { format: "arabic", startAt: 1, restart: true } } } },
  { id: "main", type: "mainContent", title: "Bölümler", status: "required", group: "body", mode: "editable" },
  { id: "bibliography", type: "bibliography", title: "KAYNAKLAR", status: "required", group: "back", mode: "editable", showTitle: true, titleNumbering: "continueH1",
    // The first entry's 6 pt space-before adds to the title's empty line (Word), which CSS would collapse across the section wrapper.
    overrides: { headings: { "1": { spaceAfterPt: BLANK_PT + 6 } } } },
  // ÖZGEÇMİŞ: named in the guide's TOC rule (§4.4) and in the template's TOC (before EKLER) but it has no sample page: offered as an
  // optional section with an unnumbered, otherwise unstyled level-1 title (layout UNKNOWN).
  { id: "cv", type: "curriculumVitae", title: "ÖZGEÇMİŞ", status: "optional", group: "back", mode: "editable", showTitle: true, tocEntry: "title",
    overrides: { headings: { "1": { numbering: { enabled: false } } } } },
  // EKLER: each appendix ("EK 1.", "EK 2.") on its own page; the appendix heading typography is UNKNOWN (no sample), the unnumbered H1 style is used.
  { id: "appendices", type: "appendices", title: "EKLER", status: "optional", group: "back", mode: "editable", showTitle: true, tocEntry: "title",
    overrides: { headings: { "1": { numbering: { enabled: false } } } } },
];

// ---- typography ----------------------------------------------------------------------------------------

const EXCEPTIONS = ["ve", "veya", "ile"];
// Headings (template styles Balk1-Balk4): TNR 12 bold, left, 1.5 lines, one empty 1.5 line after (the guide's "bir satır boşluk"); H1 on a new
// page. H1 is typed in capitals but "ve/veya/ile" stay lower-case (EXPLICIT), H2 is Title Case; H3/H4 are as typed (template samples only).
const heading = (format, extra = {}) => ({ fontFamily: FONT, fontSizePt: 12, fontWeight: 700, align: "left", lineHeight: 1.5, spaceBeforePt: 0, spaceAfterPt: BLANK_PT, firstLineIndentMm: 0, keepWithNext: true, numbering: { enabled: true, format, sequence: "arabic" }, ...extra });
const captionNumbering = { scope: "chapter", format: "{chapter}.{n}", sequence: "arabic" };
// Figure/Resim: the image bottom is 6.2 mm above the first caption baseline (Word-made guide, pp.11-12: 6.24 and 6.19 mm; the caption's own ascent is 0.9336 em).
const FIGURE_GAP_PT = 6.215 / MM_PER_PT - 0.9336 * 11;
const caption = (label, position, extra = {}) => ({
  label, position, numbering: captionNumbering, labelFormat: "{label} {number}", labelStyle: bold, hangingIndent: "label", captionAlignment: "justify", align: "center",
  style: { fontFamily: FONT, fontSizePt: 11, align: "justify", lineHeight: 1, spaceBeforePt: 0, spaceAfterPt: 6 },
  spacingBeforePt: 0, spacingAfterPt: 6, ...extra,
});
const figureCaption = (label) => caption(label, "below", { spacingBeforePt: Math.round(FIGURE_GAP_PT * 100) / 100, box: { align: "center", spaceBeforePt: 0, spaceAfterPt: 0 } });

const base = {
  schemaVersion: 1,
  templateVersion: "1.0.0",
  id: "aku-mbg-lisans-tr-v1",
  universityId: "aku",
  universityName: "Afyon Kocatepe Üniversitesi",
  instituteId: "fef-mbg",
  instituteName: "Fen Edebiyat Fakültesi · Moleküler Biyoloji ve Genetik Bölümü",
  degreeType: "undergraduate",
  language: "tr",
  status: "official",
  displayName: "Afyon Kocatepe Üniversitesi · Fen Edebiyat Fakültesi · Moleküler Biyoloji ve Genetik Bölümü · Bitirme Tezi",
  source: {
    type: "official",
    documentName: "AKÜ Moleküler Biyoloji ve Genetik Bölümü Lisans Tezi Yazım Kılavuzu (2025) — AKU_MBG_Lisans_Bitirme_Tezi_Kilavuzu_2025.pdf; AKU_MBG_Lisans_Bitirme_Tezi_Sablonu_2025.docx",
    revisionDate: "2025-05 (kılavuz: Last-Modified 2025-05-13, kapak 'AFYONKARAHİSAR, 2025'; şablon: core.xml 2025-02-27)",
    verifiedAt: "2026-10-02",
    notes: [
      "Öncelik: kılavuzun açık cümlesi (daha yeni, 2025-05-13) > şablon XML'i (2025-02-27; kılavuzun açık bırakıp şablonun belirlediği değerler) > kılavuzun kendi sayfa geometrisi (yalnız Word satır aralığı ve başlık yazı tipleri için; kendi sayfaları ~25 mm sol kenar, 10 mm asılı girinti ve asılı olmayan başlıklarla dizilmiştir, normatif değildir). Kırmızı açıklama kutuları (şablondaki uyarılar) basılmaz.",
      "Tek tür (Türkçe lisans bitirme tezi); İngilizce tez veya alt tür yoktur. Dış Kapak: kılavuz §4.1 sıralamasında geçer ve numarasızdır, ancak ne kılavuzda ne şablonda sayfası vardır (şablondaki tek kapak '14 punto yalnız bu sayfada' notuyla İç Kapaktır); düzeni UNKNOWN, üretilmez. ÖZGEÇMİŞ: içindekiler kuralında ve şablon içindekilerinde (EKLER'den önce) geçer, sayfası yoktur; isteğe bağlı, yalnız numarasız başlık (düzen UNKNOWN).",
      "Sayfa: A4 dikey, 30 mm dört kenar (1701 tw); İç Kapak üst boşluğu 10,02 mm (şablon bölüm 1, mühürler sayfa üstünde; kılavuzun genel 3 cm kuralı ile ÇELİŞKİ: 3 cm ile resmî kapak tek sayfaya sığmaz, 'Ay, Yıl' 283,6 mm'ye düşer). Üst/alt bilgi uzaklığı 12,51 mm, sayfa numarası altta ortada Times New Roman 10 pt, süssüz (kılavuz); kapaklar ve etik bildirim numarasız, ÖZET i, 1. GİRİŞ 1 (Arapça), KAYNAKLAR ve EKLER devam eder.",
      "Gövde: Times New Roman 12 pt, iki yana yaslı, 1,5 satır (Word 20,7 pt), girintisiz; paragraflar ve başlıklar arasında bir boş 12 pt/1,5 satır (20,7 pt). Motorda paragraf sonrası 20,7 pt, başlık öncesi 0 pt (Word toplamlı aralık; kılavuzun 'bir satır boşluk'u). Başlıklar: 4 düzey, hepsi TNR 12 kalın, sola yaslı; sayılar elle yazılır (1. / 2.1 / 2.2.1 / 2.3.1.1), 1. düzey büyük harf ('ve/veya/ile' küçük kalır: textTransformExceptions) ve yeni sayfa, 2. düzey Baş Harfleri Büyük; 3./4. düzey büyük/küçük harfi yazara bırakılır (kılavuz yalnız 1.-2. düzeyi söyler; şablon örnekleri Baş Harfleri Büyük, INFERRED/UNKNOWN). Başlık sonrası boşluk 1 satır (20,7 pt).",
      "Şekil/Çizelge/Resim: bölüm numaralı (Şekil 2.1), etiket kalın, etiket ile metin arasında yalnız boşluk (nokta/iki nokta yok), 11 pt, tek satır, iki yana yaslı, ikinci satır etiket genişliğinde asılı (kılavuz metni ve şablon; kılavuzun kendi örnekleri asılı değildir: ÇELİŞKİ, metin ve şablon önceliklidir), sonra 6 nk. Çizelge başlığı üstte, Şekil ve Resim başlığı altta. Şekil görsel alt kenarı ile başlığın ilk taban çizgisi arası 6,2 mm (kılavuz s.11-12'de 6,24 ve 6,19 mm ölçüldü, normatif olmayan ölçüm; şablonun LibreOffice çıktısı 5,66 mm). Bölünen çizelge başlığı: 'Çizelge 3.1 (Devam) …'. Çizelge: ortalı, üç yatay çizgi 0,5 pt (şablon), 12 pt tek satır; çizelge altı açıklaması 10 pt tek satır iki yana yaslı, 6/6 nk (tableNote stili).",
      "Denklem: Cambria Math 12 pt, ortalı, numara (bölüm.sıra) sağda; öncesinde ve sonrasında bir boş 1,5 satır. İçindekiler: 'Sayfa' kalın sağda başlığın hemen altında, satırlar 12 pt normal, 1,5 satır, 0 nk sonra, nokta kılavuzu sağ kenara (179,85 mm), girintiler 0/5,01/10,0/15,01 mm; ÖN BÖLÜM başlıkları Roman, ÖZGEÇMİŞ ve EKLER dizinde. Dizin sayfalarının (İÇİNDEKİLER, ŞEKİLLER, ÇİZELGELER, RESİMLER DİZİNİ) başlığı kılavuzda ortalı (açık), şablonda soldadır: kılavuz uygulanır (ÇELİŞKİ kaydı). SİMGELER ve KISALTMALAR DİZİNİ başlığı için kılavuz sessiz, şablon soldadır: sola yaslı bırakıldı (diğer dizin başlıklarıyla tutarsız; teyit gerekir).",
      "ÖZET/ABSTRACT: kılavuz sırası metin, anahtar kelimeler (4-6, etiket kalın, asılı girinti 37,52/22,0 mm şablon), sonra 'yıl, Roma ön sayfa sayısı + GİRİŞ'ten itibaren sayfa sayısı (ekler dahil) sayfa' kalın; şablon son ikisini ters sıralar (ÇELİŞKİ, kılavuz izlendi). İngilizce sayfada 'Graduation Thesis' ve 'Supervisor' (kılavuz §4.2). Başlık satırı büyük harf, tek satır aralıklı, normal kalınlık (şablon). Özetin sözcük/sayfa sınırı UNKNOWN.",
      "Kaynaklar: '6. KAYNAKLAR' bir sonraki bölüm gibi numaralanır (titleNumbering), 1,5 satır, öncesi 6 nk sonrası 0 nk, iki yana yaslı, 12,5 mm asılı girinti, kaynaklar arası boş satır yok, soyadına göre alfabetik; atıf (Soyad Yıl), iki yazar 've', üç ve fazlası 'vd.'. 'İnternet Kaynakları' ayrı bir grup olarak '1-' ile yazarca yazılır (motorda ayrı grup yok: yazar işi).",
      "Dipnot yazı tipi boyutu kaynaklarda UNKNOWN (şablonda Dipnot stili yok, Normal stili boyut vermez): motor alanı için Times New Roman 10 pt tek satır kullanıldı (kaynak dışı, NOT_SPECIFIED). Bitirme tezi benzerlik üst sınırı %30 ve baskı (tek yüz, 70-100 g/m², Word'den yazdırma, spiral cilt) fiziksel/gönderim kuralıdır, belge içeriği değildir.",
      "Widow/orphan denetimi kılavuzda zorunlu (tek satır sayfa başında/sonunda kalmaz), şablonun Normal stilinde kapalıdır: kılavuz uygulanır. Şablonun tek/çift sayfa bölüm sonları boş sayfa üretmez (her sonraki bölüm numarayı 1'den başlatır). Yatay sayfa desteklenmez.",
      "Kapak mutlak konumları üretim yazılımına bağlıdır (Word'ün 1,5 aralıklı resim satırının yüksekliği doğrulanamadı: UNKNOWN); kapak kontrolleri göreli (aralıklar, ortalama, yazı tipi, mühür kutuları) yapılmalıdır. Çok satırlı tez başlığı, kapakta kendi paragrafının 1,5 aralığıyla dizilir; şablondaki '(Devam)' örnek satırı ayrı tek aralıklı bir paragraftır, kural olarak alınmadı.",
    ],
  },
  page: {
    size: "A4", widthMm: 210, heightMm: 297, orientation: "portrait",
    margins: { topMm: 30, bottomMm: 30, leftMm: 30, rightMm: 30 },
    header: { heightMm: 0, distanceMm: 12.51, content: "", firstPage: "same" },
    footer: { heightMm: 8, distanceMm: 12.51, content: "", firstPage: "same" },
    numbering: { enabled: true, position: "bottom", align: "center", format: "arabic", startAt: 1, restart: false, style: { fontFamily: FONT, fontSizePt: 10 } },
  },
  typography: {
    body: { fontFamily: FONT, fontSizePt: 12, fontWeight: 400, align: "justify", lineHeight: 1.5, spaceBeforePt: 0, spaceAfterPt: BLANK_PT, firstLineIndentMm: 0 },
    paragraph: { firstLineIndentMm: 0, spaceBeforePt: 0, spaceAfterPt: BLANK_PT, lineHeight: 1.5, align: "justify" },
    headings: {
      "1": heading("{1}.", { textTransform: "uppercase", textTransformExceptions: EXCEPTIONS, pageBreakBefore: true }),
      "2": heading("{1}.{2}", { textTransform: "capitalize", textTransformExceptions: EXCEPTIONS }),
      "3": heading("{1}.{2}.{3}"),
      "4": heading("{1}.{2}.{3}.{4}"),
    },
    footnotes: { placement: "pageBottom", numbering: "document", fontFamily: FONT, fontSizePt: 10, lineHeight: 1 },
    // blockGap: a paragraph/heading after a figure, table or table note keeps the paragraph baseline pitch (the guide's empty 1.5 line).
    lineSpacing: { mode: "word", singleLineEm: SINGLE_LINE_EM, baseline: "word", paragraphSpacing: "additive", blockGap: "paragraphPitch" },
    // Table notes: below the table, 10 pt, single spaced, block (no indent), justified, 6 pt before and after.
    paragraphStyles: { tableNote: { fontSizePt: 10, lineHeight: 1, align: "justify", spaceBeforePt: 6, spaceAfterPt: 6, firstLineIndentMm: 0 } },
  },
  placeholders: {
    THESIS_TITLE: { label: "Bitirme tezi başlığı (Türkçe)", type: "text", required: true },
    THESIS_TITLE_EN: { label: "Title of graduation thesis (English)", type: "text" },
    STUDENT_NAME: { label: "Öğrencinin Adı SOYADI", type: "text", required: true },
    ADVISOR_TITLE: { label: "Danışman unvanı (Prof. Dr. / Doç. Dr. / Dr. Öğr. Üyesi)", type: "text", required: true },
    ADVISOR_TITLE_EN: { label: "Supervisor title (Prof. / Assoc. Prof. / Asst. Prof.)", type: "text" },
    ADVISOR_NAME: { label: "Danışman Adı SOYADI", type: "text", required: true },
    SUBMISSION_MONTH: { label: "Tezin teslim edildiği ay (kapak)", type: "text", required: true },
    SUBMISSION_YEAR: { label: "Tezin teslim edildiği yıl (kapak)", type: "number", required: true },
    DECLARATION_DATE: { label: "Etik bildirim tarihi (GG / AA / YYYY)", type: "text" },
    DEFENSE_YEAR: { label: "Savunma yılı (Özet/Abstract)", type: "number", required: true },
    YEAR: { label: "Yıl (Teşekkür)", type: "number", required: true },
    KEYWORDS_TR: { label: "Anahtar Kelimeler (4-6, virgülle)", type: "text" },
    KEYWORDS_EN: { label: "Keywords (4-6)", type: "text" },
    // "2023, ix + 16 sayfa": last roman page label and the Arabic pages from GİRİŞ to the end (ekler dahil), from the layout.
    FRONT_PAGE_COUNT: { label: "Son romen sayfa (Özet/Abstract)", type: "text", derived: "frontLastLabel" },
    BODY_PAGE_COUNT: { label: "Giriş'ten sonraki sayfa sayısı (Özet/Abstract)", type: "number", derived: "mainPageCount" },
  },
  validation: {
    KEYWORDS_TR: { minItems: 4, separator: ",", severity: "warning", message: "Anahtar Kelimeler 4-6 tane olmalı ve virgülle ayrılmalıdır." },
    KEYWORDS_EN: { minItems: 4, separator: ",", severity: "warning", message: "Keywords 4-6 tane olmalı ve virgülle ayrılmalıdır." },
  },
  tables: {
    ...caption("Çizelge", "above"),
    borders: { preset: "threeRule", widthPt: 0.5 },
    cellStyle: { fontSizePt: 12, lineHeight: 1, align: "left" },
    continuation: { format: "{label} {number} (Devam) {title}" },
  },
  figures: figureCaption("Şekil"),
  captionKinds: { photo: figureCaption("Resim") },
  equations: { numbering: { scope: "chapter", format: "({chapter}.{n})" }, numberAlign: "right",
    style: { fontFamily: "Cambria Math", fontSizePt: 12, lineHeight: 1.5, spaceBeforePt: 0, spaceAfterPt: BLANK_PT } },
  bibliography: { heading: "KAYNAKLAR", style: { fontFamily: FONT, fontSizePt: 12, align: "justify", lineHeight: 1.5, spaceBeforePt: 6, spaceAfterPt: 0, firstLineIndentMm: 0, hangingIndentMm: 12.5 }, hangingIndentMm: 0, citationStyle: "author-year" },
  toc: { heading: "İÇİNDEKİLER DİZİNİ", levels: [1, 2, 3, 4], showPageNumbers: true },
};

export const akuMbgLisans = { ...base, sections: sections() };
export default akuMbgLisans;
