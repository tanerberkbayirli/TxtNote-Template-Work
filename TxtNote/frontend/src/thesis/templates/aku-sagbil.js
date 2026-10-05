/**
 * Afyon Kocatepe Üniversitesi, Sağlık Bilimleri Enstitüsü (yüksek lisans ve doktora).
 *
 * Source of truth: "AKÜ Sağlık Bilimleri Enstitüsü Tez Yazım Kılavuzu" (institute-hosted PDF, file date 10.02.2022,
 * cover prints 2020; AKU_Saglik_Bilimleri_Enstitusu_Tez_Yazim_Kilavuzu_2022.pdf, 39 PDF pages = printed pp. 1-37).
 * The reconciled spec is orchestration/specs/aku-sagbil.json (rules marked HISTORICAL_ONLY / STALE belong to the
 * superseded guide and are NOT requirements). Rule order: explicit guide text > example-page geometry MEASURED on the
 * guide's own vector text (Örnek 1-14) > a documented non-source implementation choice (listed in source.notes).
 *
 * Word line model (this guide's pages measure the same): a single line of Times New Roman is 1.15 em (13.8 pt at
 * 12 pt), "1,5 satır" is 20.7 pt, the first baseline of a line sits 0.9336 em below its line box top and the extra
 * leading of 1.5 spacing goes below the text. The special pages (Örnek 1-4, 7, 9) are laid out by chaining the
 * measured baselines of the guide's example pages (chain()); spacers are derived, not typed.
 *
 * One shared base; the master's and doctoral variants differ only in their degree strings.
 */
import { MM_PER_PT } from "../units.js";

const FONT = "Times New Roman";
const SINGLE_LINE_EM = 1.15;
const BASELINE_EM = 0.9336;
const linePt = (sizePt, spacing) => sizePt * SINGLE_LINE_EM * spacing;
/** `lines` empty lines of `sizePt` type at `spacing`, as a spacer. */
const blank = (lines = 1, sizePt = 12, spacing = 1.5) => ({ type: "spacer", heightMm: lines * linePt(sizePt, spacing) * MM_PER_PT });
/** The guide's "1 satır boşluk (1,5 aralıklı)": one empty 12 pt line at 1.5 spacing = 20.7 pt (§2.4). */
const BLANK_PT = linePt(12, 1.5);

const asc = (sizePt) => BASELINE_EM * sizePt * MM_PER_PT;
const lineBox = (sizePt, spacing) => linePt(sizePt, spacing) * MM_PER_PT;
const r3 = (value) => Math.round(value * 1000) / 1000;
/**
 * Places `items` so that each item's first baseline lies at its example baseline (mm from the page top):
 * {block, s: size pt, sp: line spacing, first: first baseline, last: last baseline (default first)}.
 * `topMm` is where the flow starts (the top of the container). Spacers carry the derived gaps.
 */
function chain(items, topMm = 30) {
  const out = [];
  let cursor = topMm;
  for (const item of items) {
    const gap = item.first - asc(item.s) - cursor;
    if (gap > 0.004) out.push({ type: "spacer", heightMm: r3(gap) });
    out.push(item.block);
    cursor = (item.last ?? item.first) - asc(item.s) + lineBox(item.s, item.sp);
  }
  return out;
}
/** A single placed line: text/metadata block at a measured baseline. */
const line = (block, s, sp, first, last) => ({ block: { ...block, style: { fontSizePt: s, lineHeight: sp, ...block.style } }, s, sp, first, last });

const bold = { fontWeight: 700 };
const upper = { textTransform: "uppercase" };
const page15 = { firstLineIndentMm: 0, spaceBeforePt: 0, spaceAfterPt: 0, lineHeight: 1.5 };
const roman = { numbering: { format: "roman-lower" } };
const hiddenRoman = { numbering: { enabled: false, format: "roman-lower", indexLabelWhenHidden: true } };
const dots = "……………………";

const degreeLabels = {
  master: { cover: "YÜKSEK LİSANS TEZİ", tr: "Yüksek Lisans Tezi" },
  phd: { cover: "DOKTORA TEZİ", tr: "Doktora Tezi" },
};

const coAdvisor = (children) => ({ type: "group", visibleWhen: { anyFilled: ["CO_ADVISOR_NAME"] }, blocks: children });
const projectFilled = { anyFilled: ["PROJECT_NO", "PROJECT_FUNDER"] };

/** Front-matter title (ÖNSÖZ, İÇİNDEKİLER, dizinler, ÖZGEÇMİŞ): centered, bold, unnumbered; the gap after it is `spaceAfterPt`. */
const frontTitle = (spaceAfterPt = BLANK_PT) => ({ "1": { align: "center", textTransform: "none", spaceAfterPt, numbering: { enabled: false } } });

// ---- special pages (Örnek 1-4): centres and baselines measured on the guide's vector example pages ----------------

// Örnek 1 (PDF p.26, printed p.24): dış kapak altı (ön kapak). 12 pt, single, centred; the lines sit low on the page
// (first baseline 214.41 mm). The outer cover itself is the university bookstore's cover (§3.2.1) and is not generated.
const coverUnder = (degree) => ({
  id: "cover-under", type: "outerCover", title: "DIŞ KAPAK ALTI (ÖN KAPAK)", status: "required", group: "cover", mode: "static",
  overrides: { page: { numbering: { enabled: false } }, body: { ...page15, lineHeight: 1, align: "center" } },
  blocks: chain([
    line({ type: "metadata", field: "THESIS_TITLE", fallback: "TEZ BAŞLIĞI", style: { ...bold, ...upper } }, 12, 1, 214.41, 224.15),
    line({ type: "metadata", field: "STUDENT_NAME", fallback: "Ad SOYAD" }, 12, 1, 238.67),
    line({ type: "text", value: degree.tr }, 12, 1, 243.54),
    line({ type: "text", value: "Danışman: {{ADVISOR_TITLE}} {{ADVISOR_NAME}}" }, 12, 1, 248.40),
    line({ type: "text", value: "Tez No: {{THESIS_NO}}" }, 12, 1, 253.27),
    line({ type: "metadata", field: "CITY", fallback: "Afyonkarahisar" }, 12, 1, 258.31),
  ]),
});

// Örnek 2 (PDF p.27, printed p.25): iç kapak. 14 pt bold single (§3.2.2), the project sentence 12 pt bold. The example note
// says "Üsten 21 cm, sağ ve sol kenardan 5'er cm": measured, the first baseline lies 21.07 mm below the 30 mm margin and the lines
// span x 35.95-175.24 mm, i.e. 21 mm and 5 mm (the note's unit is a typo for mm) -> top offset 21 mm, 5 mm side indents.
const innerCover = (degree) => ({
  id: "inner-cover", type: "innerCover", title: "İÇ KAPAK", status: "required", group: "cover", mode: "static",
  // Counted but not printed: the contents example (Örnek 8) numbers the approval page II, so the inner cover is page I.
  overrides: { page: { numbering: { enabled: false, format: "roman-lower", startAt: 1, restart: true }, trimTerminalTextLeading: true }, body: { ...page15, lineHeight: 1, align: "center", fontSizePt: 14, fontWeight: 700 } },
  blocks: [
    { type: "group", style: { leftIndentMm: 5, rightIndentMm: 5 }, blocks: [
      { type: "spacer", heightMm: 21 },
      { type: "text", value: "AFYON KOCATEPE ÜNİVERSİTESİ" },
      { type: "text", value: "SAĞLIK BİLİMLERİ ENSTİTÜSÜ" },
      { type: "metadata", field: "DEPARTMENT_NAME", suffix: " ANABİLİM DALI", fallback: `${dots} ANABİLİM DALI`, style: upper },
      { type: "text", value: degree.cover },
      blank(2, 14, 1),
      { type: "metadata", field: "THESIS_TITLE", fallback: "TEZ BAŞLIĞI", style: upper },
      blank(2, 14, 1),
      { type: "text", value: "Hazırlayan" },
      { type: "metadata", field: "STUDENT_NAME", fallback: "Ad SOYAD" },
      blank(2, 14, 1),
      { type: "text", value: "Danışman" },
      { type: "text", value: "{{ADVISOR_TITLE}} {{ADVISOR_NAME}}" },
      coAdvisor([
        blank(1, 14, 1),
        { type: "text", value: "2. Danışman" },
        { type: "text", value: "{{CO_ADVISOR_TITLE}} {{CO_ADVISOR_NAME}}" },
      ]),
      blank(1, 14, 1),
      { type: "text", value: "Tez No: {{THESIS_NO}}" },
      blank(1, 14, 1),
      { type: "metadata", field: "CITY", fallback: "Afyonkarahisar", style: upper },
      { type: "group", visibleWhen: projectFilled, blocks: [
        blank(2, 14, 1),
        { type: "text", value: "Bu tez çalışması; {{PROJECT_FUNDER}} Tarafından Desteklenmiştir. Proje No: “{{PROJECT_NO}}”", style: { fontSizePt: 12 } },
      ] },
    ] },
  ],
});

// Örnek 3 (PDF p.28, printed p.26): tez kabul ve onay sayfası. 12 pt. The institute-approval box is drawn with Word's thick-thin
// double rule (measured: thick 1.06 mm / thin 0.25 mm = 3 pt / 0.75 pt, gap 0.25 mm) from x 27.31 to 182.71 mm; the page margins are that
// box and text lines carry the 2.69 mm distance to the 30 mm text edges as indents.
const FRAME_L_MM = 27.31;
const FRAME_R_MM = 182.71;
const FRAME_BORDER = { outerPt: 0.75, gapPt: 0.75, innerPt: 3, paddingMm: 0, docx: { style: "thickThinSmallGap", sizePt: 3, sides: { top: "thickThinSmallGap", left: "thickThinSmallGap", bottom: "thinThickSmallGap", right: "thinThickSmallGap" } } };
const FRAME_BORDER_MM = (0.75 + 0.75 + 3) * MM_PER_PT;
const IN = { leftIndentMm: 30 - FRAME_L_MM, rightIndentMm: FRAME_R_MM - 180 };
// Fitting: Ornek 3 (5-line paragraph) ends its box at 260.85 mm, 6.15 mm above the 267 mm text-block limit, so a 7-line paragraph (a ~190-character
// thesis title) overflows by 8.45 mm. The three large empty gaps below the paragraph (chair->row 1, row 1->row 2, row 2->box) are each shortened by
// SAVE_MM so that up to 7 paragraph lines fit on the page. This is NOT source geometry: the amount is an UNKNOWN implementation value (the guide only
// says to adjust the rows to the jury size); the title and the paragraph keep Ornek 3's geometry (title baseline 36.08 mm).
const SAVE_MM = 3.1;
const DOCX_SOURCE_MARGINS = { topMm: 30, bottomMm: 30, leftMm: 30, rightMm: 30 };
const jurorCell = (n, role, base) => ({ type: "group", widthPercent: 50, style: n % 2 === 0 ? { leftIndentMm: 3.2 } : {}, blocks: chain([
  line({ type: "text", value: role, style: bold }, 12, 1, base[0]),
  line({ type: "metadata", field: `JURY_MEMBER_${n}`, fallback: "Unvan, Ad, Soyad" }, 12, 1, base[1]),
  line({ type: "text", value: "İmza" }, 12, 1, base[2]),
], base[0] - asc(12)) });
const jurorRow = (a, base, visibleWhen) => ({ type: "group", direction: "row", ...(visibleWhen ? { visibleWhen } : {}), blocks: [jurorCell(a, "Üye", base), jurorCell(a + 1, "Üye", base)] });
const approval = (degree) => ({
  id: "approval", type: "approval", title: "TEZ KABUL VE ONAY SAYFASI", status: "required", group: "front", mode: "static", tocEntry: "title",
  overrides: { page: { margins: { leftMm: FRAME_L_MM, rightMm: 210 - FRAME_R_MM }, docxMargins: DOCX_SOURCE_MARGINS, docxContentFrame: { xMm: FRAME_L_MM, yMm: 30, widthMm: FRAME_R_MM - FRAME_L_MM }, numbering: { ...hiddenRoman.numbering } }, body: { ...page15, lineHeight: 1, align: "center" } },
  blocks: [
    ...chain([
      line({ type: "text", value: "TEZ KABUL VE ONAY SAYFASI", style: { ...bold, ...IN } }, 12, 1, 36.08),
      line({ type: "text", markup: "inline", style: { align: "justify", ...IN },
        value: `Afyon Kocatepe Üniversitesi Sağlık Bilimleri Enstitüsü **{{DEPARTMENT_NAME}} Anabilim Dalı’nda**. {{STUDENT_NAME}} tarafından hazırlanan “{{THESIS_TITLE}}” adlı tez çalışması Afyon Kocatepe Üniversitesi Lisansüstü Eğitim-Öğretim ve Sınav Yönetmeliği’nin ilgili maddeleri uyarınca {{DEFENSE_DATE}} tarihinde aşağıdaki jüri tarafından **{{DECISION}}** ile **${degree.cover}** olarak kabul edilmiştir` }, 12, 1.5, 45.39, 74.60),
      line({ type: "text", value: "Başkan", style: bold }, 12, 1, 91.07),
      line({ type: "metadata", field: "JURY_CHAIR", fallback: "Unvan, Ad, Soyad" }, 12, 1, 97.98),
      line({ type: "text", value: "İmza" }, 12, 1, 104.96),
      { block: jurorRow(1, [126.00, 132.90, 139.89].map((v) => v - SAVE_MM)), s: 12, sp: 1, first: 126.00 - SAVE_MM, last: 139.89 - SAVE_MM },
      { block: jurorRow(3, [160.93, 167.83, 174.82].map((v) => v - 2 * SAVE_MM)), s: 12, sp: 1, first: 160.93 - 2 * SAVE_MM, last: 174.82 - 2 * SAVE_MM },
    ], 30),
    // A third row (5th and 6th member) appears only when filled: the guide asks to adjust the rows to the actual jury.
    { type: "group", visibleWhen: { anyFilled: ["JURY_MEMBER_5", "JURY_MEMBER_6"] }, blocks: chain([
      { block: jurorRow(5, [195.86, 202.76, 209.75].map((v) => v - 2 * SAVE_MM)), s: 12, sp: 1, first: 195.86 - 2 * SAVE_MM, last: 209.75 - 2 * SAVE_MM },
    ], 174.82 - 2 * SAVE_MM - asc(12) + lineBox(12, 1)) },
    // Institute approval box: outer top 189.85 mm, bottom 260.85 mm (with five jurors).
    { type: "spacer", heightMm: r3(189.85 - 3 * SAVE_MM - (174.82 - 2 * SAVE_MM - asc(12) + lineBox(12, 1))) },
    { type: "group", border: FRAME_BORDER, style: { align: "center" }, blocks: [
      ...chain([
        line({ type: "text", value: "Afyon Kocatepe Üniversitesi" }, 12, 1.5, 202.55),
        line({ type: "text", value: "Sağlık Bilimleri Enstitüsü Yönetim Kurulu’nun" }, 12, 1.5, 209.87),
        line({ type: "text", value: "…… / …… / ……… tarih; …..:…… saat ve" }, 12, 1.5, 217.16),
        line({ type: "text", value: "…………… sayılı kararıyla onaylanmıştır." }, 12, 1.5, 224.49),
        line({ type: "text", value: "……………………………….", style: {} }, 12, 1.5, 239.09),
        line({ type: "text", value: "Enstitü Müdürü" }, 12, 1.5, 246.37),
        line({ type: "metadata", field: "INSTITUTE_DIRECTOR", fallback: "Ünvanı Adı ve SOYADI" }, 12, 1.5, 255.81),
      ], 189.85 + FRAME_BORDER_MM),
    ] },
  ],
});

// Örnek 4 (PDF p.29, printed p.27): bilimsel etik bildirimi. 12 pt, 1.5 lines, the list items as "- ..." lines.
const ethicsItem = (text, first, last) => ({ ...line({ type: "text", value: text, style: { align: "justify" } }, 12, 1.5, first, last) });
const ethics = {
  id: "ethics", type: "ethicsDeclaration", title: "BİLİMSEL ETİK BİLDİRİMİ", status: "required", group: "front", mode: "static", tocEntry: "title",
  overrides: { page: { numbering: { ...hiddenRoman.numbering }, trimTerminalTextLeading: true }, body: { ...page15, align: "left" } },
  blocks: chain([
    line({ type: "text", value: "BİLİMSEL ETİK BİLDİRİMİ", style: { ...bold, align: "center" } }, 12, 1.5, 33.96),
    line({ type: "text", value: "Sağlık Bilimleri Enstitüsü, Bilimsel Yayın Etiği İlkeleri ve Tez Yazım Kurallarına uygun olarak hazırladığım bu tez çalışmasında;", style: { ...bold, align: "justify" } }, 12, 1.5, 48.56, 55.84),
    ethicsItem("- Tez içindeki bütün bilgi ve belgeleri akademik kurallar çerçevesinde elde ettiğimi,", 63.08),
    ethicsItem("- Görsel, işitsel ve yazılı tüm bilgi ve sonuçları bilimsel ahlak kurallarına uygun olarak sunduğumu,", 70.37, 77.69),
    ethicsItem("- Başkalarının eserlerinden yararlanılması durumunda ilgili eserlere bilimsel normlara uygun olarak atıfta bulunduğumu,", 84.97, 92.29),
    ethicsItem("- Atıfta bulunduğum eserlerin tümünü kaynak olarak gösterdiğimi,", 99.59),
    ethicsItem("- Kullanılan verilerde herhangi bir tahrifat yapmadığımı,", 106.91),
    ethicsItem("- Bu tezin herhangi bir bölümünü Afyon Kocatepe Üniversitesi veya başka bir üniversitede başka bir tez çalışması olarak sunmadığımı", 114.19, 121.51),
    line({ type: "text", value: "beyan ederim.", style: bold }, 12, 1.5, 132.31),
    // The signature block is centred on x = 146.8 mm in the example (120.21-173.39, 130.41-163.23 and 115.43-178.22 around it).
    line({ type: "metadata", field: "DECLARATION_DATE", fallback: "…../…../……….", style: { align: "center", leftIndentMm: 83.6 } }, 12, 1, 154.20),
    line({ type: "text", value: "İmza", style: { align: "center", leftIndentMm: 83.6 } }, 12, 1, 159.07),
    line({ type: "metadata", field: "STUDENT_NAME", fallback: "Öğrenci – Adı- Soyadı", style: { align: "center", leftIndentMm: 83.6 } }, 12, 1, 163.94),
  ]),
};

// ÖZET / SUMMARY (§3.2.5): title at the top of the text block, 24 pt, the thesis title in bold, 12 pt, then the text and the keywords.
const abstractHeader = (id, title, type, lines) => ({
  id, type, title, status: "required", group: "front", mode: "static", standalone: false, tocEntry: "title",
  overrides: { page: roman, body: { ...page15, align: "center" } },
  blocks: lines,
});
const abstractText = (id, type, title) => ({ id, type, title, status: "required", group: "front", mode: "editable", pageBreakBefore: false, showTitle: false,
  overrides: { page: roman, paragraph: { firstLineIndentMm: 0 } } });
const abstractFooter = (id, type, title, keywords) => ({
  id, type, title, status: "required", group: "front", mode: "static", standalone: false, pageBreakBefore: false,
  overrides: { page: roman, body: { ...page15, align: "left" } },
  // The abstract's last paragraph already carries the guide's empty line before the keywords.
  blocks: [{ type: "text", markup: "inline", value: keywords, style: { align: "justify" } }],
});
const abstractTr = () => [
  abstractHeader("abstract-tr", "ÖZET", "abstract", [
    { type: "text", value: "ÖZET", style: { ...bold, spaceAfterPt: 24 } },
    { type: "metadata", field: "THESIS_TITLE", fallback: "Tezin Türkiye Türkçesi Başlığı", style: { ...bold, spaceAfterPt: 12 } },
  ]),
  abstractText("abstract", "abstract", "Özet metni"),
  abstractFooter("abstract-footer", "abstract", "Özet anahtar kelimeler", "**Anahtar Kelimeler:** {{KEYWORDS}}"),
];
const abstractEn = () => [
  abstractHeader("abstract-en-header", "SUMMARY", "englishAbstract", [
    { type: "text", value: "SUMMARY", style: { ...bold, spaceAfterPt: 24 } },
    { type: "metadata", field: "THESIS_TITLE_EN", fallback: "English Title of Thesis", style: { ...bold, spaceAfterPt: 12 } },
  ]),
  abstractText("abstract-en", "englishAbstract", "Summary text"),
  abstractFooter("abstract-en-footer", "englishAbstract", "Summary keywords", "**Keywords:** {{KEYWORDS_EN}}"),
];

// Örnek 8-12: contents and lists. Rows are 1.5 lines (pitch 7.3 mm measured); "SAYFA" is bold and right aligned under the title;
// the page numbers are centred in that column (x centres 172.7 mm measured); no leader line is printed (checked on the vector page).
const indexBase = (kind, title, extra = {}) => ({
  kind, title, leader: "none", pageHeading: "SAYFA", hanging: "label", indentMm: 5.29, pageNumberAlignment: "center", pageColumnWidthMm: 14.6,
  pageHeadingStyle: { ...bold, lineHeight: 1.5, spaceBeforePt: 0, spaceAfterPt: 0 },
  style: { lineHeight: 1.5, spaceBeforePt: 0, spaceAfterPt: 0, align: "left" }, ...extra,
});
const generatedList = (id, type, title, kind, count) => ({
  id, type, title, status: "required", group: "front", mode: "generated", tocEntry: "title", visibleWhen: { count, gte: 1 },
  generatedIndex: indexBase(kind, title, { indentMm: 0 }),
  overrides: { page: roman, headings: frontTitle(BLANK_PT) },
});

function sections(degree) {
  return [
    coverUnder(degree),
    innerCover(degree),
    approval(degree),
    ethics,
    ...abstractTr(),
    ...abstractEn(),
    // ÖNSÖZ (Örnek 7): bold centred title, text, then the signature lines (student, city, year) centred.
    { id: "preface", type: "preface", title: "ÖNSÖZ", status: "required", group: "front", mode: "editable", showTitle: true, tocEntry: "title",
      overrides: { page: roman, headings: frontTitle(), paragraph: { firstLineIndentMm: 0 } } },
    { id: "preface-signature", type: "preface", title: "Önsöz imza", status: "required", group: "front", mode: "static", standalone: false, pageBreakBefore: false,
      overrides: { page: roman, body: { ...page15, align: "center", spaceAfterPt: 6 } },
      blocks: [{ type: "spacer", heightMm: 13.63 }, { type: "metadata", field: "STUDENT_NAME", fallback: "Öğrencinin Adı SOYADI" }, { type: "metadata", field: "CITY", fallback: "Afyonkarahisar" }, { type: "metadata", field: "YEAR", fallback: "2020", style: { spaceAfterPt: 0 } }] },
    { id: "toc", type: "tableOfContents", title: "İÇİNDEKİLER", status: "required", group: "front", mode: "generated", tocEntry: "title",
      generatedIndex: indexBase("toc", "İÇİNDEKİLER", { matchHeadingTransform: true, levelStyles: { "1": { fontWeight: 700 }, unnumbered: { fontWeight: 700 } } }),
      overrides: { page: roman, headings: frontTitle(0) } },
    // Örnek 9: symbols and abbreviations, single spaced entries ("symbol: explanation", measured pitch 13.8 pt).
    { id: "symbols", type: "listOfAbbreviations", title: "SİMGELER VE KISALTMALAR DİZİNİ", status: "optional", group: "front", mode: "editable", showTitle: true, tocEntry: "title",
      overrides: { page: roman, headings: frontTitle(), paragraph: { firstLineIndentMm: 0, align: "left", lineHeight: 1, spaceBeforePt: 0, spaceAfterPt: 0 } } },
    generatedList("list-figures", "listOfFigures", "ŞEKİLLER DİZİNİ", "figures", "figures"),
    generatedList("list-tables", "listOfTables", "ÇİZELGELER DİZİNİ", "tables", "tables"),
    generatedList("list-photos", "custom", "RESİMLER DİZİNİ", "photo", "photo"),
    // 1. GİRİŞ restarts the numbering in Arabic at 1 (§2.6); the numbered chapters follow in "Bölümler".
    { id: "introduction", type: "introduction", title: "GİRİŞ", status: "required", group: "body", mode: "editable", showTitle: true, titleNumbering: "continueH1",
      overrides: { page: { numbering: { format: "arabic", startAt: 1, restart: true } } } },
    { id: "main", type: "mainContent", title: "Bölümler", status: "required", group: "body", mode: "editable" },
    { id: "bibliography", type: "bibliography", title: "KAYNAKLAR", status: "required", group: "back", mode: "editable", showTitle: true, titleNumbering: "continueH1" },
    // EKLER (§3.3.7): every appendix starts on its own page; numbered on after KAYNAKLAR. The guide is internally inconsistent about the number
    // ("7. EKLER" in §3 vs "8. EKLER" in Örnek 13) and the sub-label ("EK 1." vs "8.1."): CONFLICT, the continuing chapter number is used.
    { id: "appendices", type: "appendices", title: "EKLER", status: "optional", group: "back", mode: "editable", showTitle: true, titleNumbering: "continueH1",
      overrides: { headings: { "2": { pageBreakBefore: true, pageBreakUnlessAfterHeading: true } } } },
    // ÖZGEÇMİŞ (§3.3.8, Örnek 14): the last page of the thesis; bold centred title, the text starts on the next 1.5 line.
    { id: "cv", type: "curriculumVitae", title: "ÖZGEÇMİŞ", status: "required", group: "back", mode: "editable", showTitle: true, tocEntry: "title",
      overrides: { headings: frontTitle(0), paragraph: { firstLineIndentMm: 0, align: "justify" } } },
  ];
}

// ---- typography ----------------------------------------------------------------------------------------

const EXCEPTIONS = ["ve", "veya", "ile"];
const heading = (format, extra = {}) => ({ fontFamily: FONT, fontSizePt: 12, fontWeight: 700, align: "left", lineHeight: 1.5, spaceBeforePt: 0, spaceAfterPt: BLANK_PT, firstLineIndentMm: 0, keepWithNext: true, textTransform: "capitalize", textTransformExceptions: EXCEPTIONS, numbering: { enabled: true, format, sequence: "arabic" }, ...extra });
const captionNumbering = { scope: "chapter", format: "{chapter}.{n}", sequence: "arabic" };
const caption = (label, position, extra = {}) => ({
  label, position, numbering: captionNumbering, labelFormat: "{label} {number}:", labelStyle: bold, captionAlignment: "justify", align: "center",
  style: { fontFamily: FONT, fontSizePt: 12, fontWeight: 400, align: "justify", lineHeight: 1.5, spaceBeforePt: 0, spaceAfterPt: 0 },
  spacingBeforePt: 0, spacingAfterPt: 0, ...extra,
});

const base = {
  schemaVersion: 1,
  templateVersion: "1.0.0",
  universityId: "aku",
  universityName: "Afyon Kocatepe Üniversitesi",
  instituteId: "sagbil",
  instituteName: "Sağlık Bilimleri Enstitüsü",
  language: "tr",
  status: "official",
  source: {
    type: "official",
    documentName: "AKÜ Sağlık Bilimleri Enstitüsü Tez Yazım Kılavuzu — AKU_Saglik_Bilimleri_Enstitusu_Tez_Yazim_Kilavuzu_2022.pdf (Butun-Sablonlar/Ege/Afyon Kocatepe Üniversitesi/Saglik_Bilimleri_Enstitusu_Tez/)",
    revisionDate: "2022-02-10 (kılavuz dosyası/yolu); kapak 2020 basar, Senato kabul tarihi boş",
    verifiedAt: "2026-10-02",
    notes: [
      "Kaynak: yalnız 2022 kılavuzu (spec: orchestration/specs/aku-sagbil.json, 2022 uzlaştırması). Eski (2009/2015) kılavuza ait değerler (üstte sayfa numarası, Tablo etiketi, 36/24 nk başlık aralıkları, 14 pt H1, 10 mm girinti, mavi kapak bandı vb.) uygulanmaz; orchestration/reports/AKU_DECISIONS.md'deki aku-sagbil bölümü bu uzlaştırmadan öncedir ve onunla çeliştiği yerde spec + 2022 kılavuzu geçerlidir. Formal geçerlilik tarihi doğrulanamamıştır (UNKNOWN).",
      "Açık kılavuz değerleri (EXPLICIT): A4; her kenardan 3 cm; Times New Roman, iç kapak hariç 12 punto; 1,5 satır aralığı; iki yana yaslı; paragraf başı girintisiz; alt başlık ve paragraflardan önce/sonra 1 satır (1,5 aralıklı) boşluk; sayfa numarası yalnız alt bilgide ortalı, Times New Roman 11 punto, işaretsiz; ön sayfalar küçük Romen, GİRİŞ'ten itibaren 1,2,3…; 1. derece başlık BÜYÜK HARF, 2./3. derece her sözcüğün ilk harfi büyük (ve/veya/ile küçük), hepsi koyu ve solda, '1.', '1.1.', '1.1.1.' numaralı, her ana bölüm yeni sayfada; en çok 3. derece; şekil/çizelge/denklem bölüm içinde bağımsız {bölüm}.{n} numaralı, etiket+numara koyu ve ':' sonra açıklama koyu değil, çizelge açıklaması üstte, şekil açıklaması altta; bölünen çizelge '{etiket} {no}. Devam.'; dip not ana metinden 2 tam aralık sonra, soldan sayfa ortasına sürekli çizgi, daha küçük punto ve dar aralık; KAYNAKLAR 11 pt, tek aralık, iki yana yaslı, 2. satırdan itibaren 1,25 cm içeriden, her kaynaktan sonra 6 nk; ÖZET: başlık büyük harf koyu ortalı metin bloğunun üstünde, 2 aralık (24 nk) sonra tez adı (sözcük baş harfleri büyük, koyu), 1 satır (12 nk) sonra metin, 1 satır sonra koyu 'Anahtar Kelimeler:' ve 3–6 alfabetik sözcük; SUMMARY aynı düzende İngilizce.",
      "Örnek sayfaları (Örnek 1-14) kılavuzun kendi vektör metninden ölçülmüştür (MEASURED); özel sayfaların dikey yerleşimi bu taban çizgilerinden türetilmiştir. Örnek 2 notundaki 'Üsten 21 cm, sağ ve sol kenardan 5'er cm' ölçülen geometriyle yalnız mm okunuşuyla uyuşur (ilk taban çizgisi 30 mm kenar boşluğunun 21,07 mm altında, satırlar x 35,95–175,24 mm): iç kapakta 21 mm üst ve 5 mm yan girinti (INFERRED).",
      "Dış kapak: üniversite kitap satış biriminden sağlanan hazır kapaktır (§3.2.1); üretilmez. 'Dış kapak altı (ön kapak)' sayfası Örnek 1'dir ve üretilir.",
      "CONFLICT — ön sayfa numaralaması: §2.6 dış kapak, iç kapak, onay ve etik sayfasını 'numaralandırılmaz' der ve Özet'ten itibaren i, ii, iii… verir; Örnek 8 ise onay sayfasını II, etik sayfasını III, ÖZET'i IV gösterir. Uygulama: iç kapak sayılır (i) ancak basılmaz, onay (ii) ve etik (iii) sayılır ancak basılmaz, ÖZET iv olur (Örnek 8); dış kapak altı sayfası sayılmaz. Çözüm insan kararı gerektirir.",
      "CONFLICT — dizin başlıkları: §3.2.9–3.2.11 'ŞEKİLLER DİZİNİ / ÇİZELGELER DİZİNİ / RESİMLER DİZİNİ' der (tırnaklı), Örnek 10–12 'ŞEKİLLER / ÇİZELGELER / RESİMLER' basar; metindeki ifade kullanılır. İçindekiler satırları başlıkları aynen yansıtır (§3.2.7), Örnek 8'deki 'ÖNSÖZ SAYFASI', 'KABUL VE ONAY SAYFASI', 'BİLİMSEL ETİK BİLDİRİM SAYFASI' örnek metinleridir, sayfa başlıkları (ÖNSÖZ, TEZ KABUL VE ONAY SAYFASI, BİLİMSEL ETİK BİLDİRİMİ) aynen listelenir.",
      "CONFLICT — şekil/çizelge yazı boyutu: §2.14 'ana metin puntosu ile aynı' (12), aynı bölümün örneği 'Times New Roman, 11 punto' der. Örnekteki 11 punto kullanılır (daha özel); çözülmemiştir. Çizelge altı kısaltma açıklaması 8 punto, iki yana yaslı (EXPLICIT).",
      "CONFLICT — EKLER: §3 ve §3.3.7 '7. EKLER' / 'EK 1., EK 2.' der, Örnek 8 başlığı '7. EKLER', alt kalemleri '8.1., 8.2.' gösterir, Örnek 13 '8. EKLER / Ek 8.1.' basar. KAYNAKLAR'dan sonraki bölüm numarası sürdürülür (7.), ek alt başlıkları 2. derece başlık olarak numaralanır ve her biri yeni sayfada başlar (EXPLICIT: ayrı sayfa).",
      "İçindekiler (Örnek 8, vektör ölçümü): 'İÇİNDEKİLER' ortalı koyu, 'SAYFA' koyu sağda, sayfa numaraları bu sütunda ortalı, 1. derece satırlar (sayfa numaralarıyla) koyu, alt düzeyler 5,29 mm içeride, 1,5 satır aralığı, noktalı çizgi (leader) YOK — spec'teki 'dotted' kaydı yanlıştır, PDF vektör sayfası doğrulanmıştır. Örnek 8'deki büyük Romen sayfa etiketleri (II, III …) §2.6'nın küçük Romen kuralıyla çeliştiğinden küçük Romen kullanılır.",
      "Kaynakta olmayan uygulama seçimleri (NOT_SPECIFIED): sayfa numarasının kenara uzaklığı 12,5 mm (Word varsayılanı; kılavuz uzaklık vermez); üst bilgi yok; başlıklar 12 pt (belge geneli 12 punto kuralından; kılavuz başlık boyutu vermez); paragraf aralığı 1 boş satır (§2.4 'alt bölüm başlıkları ile paragraflardan önce ve sonra'); şekil/çizelge ile açıklama arası 0, açıklama satır aralığı 1,5 (genel kural); çizelge çizgileri üst/başlık altı/alt üç yatay 0,5 pt (kılavuz: dikey çizgi yok, yatay çizgiler ana bilgilerle bölünmeli), hücre 12 pt; dip not 10 pt tek aralık Times New Roman, ayraç kalınlığı 0,5 pt, ayraç öncesi 24 pt ('2 tam aralık' = 2×12 nk, kılavuzun kendi 'aralık' birimi, INFERRED), ayraç uzunluğu sayfa ortasına kadar = metin genişliğinin %50'si; denklem numarası '(bölüm.n)' parantezli ve sağda; denklem yazı tipi Times New Roman 12; ÖNSÖZ/İÇİNDEKİLER/dizin/SİMGELER başlıkları metin bloğunun üstünde, başlıktan sonra 1 boş satır (başlık konumu UNKNOWN); H1 numarası sonrası boşluk; sembol listesi tek aralık (Örnek 9 ölçümü); anahtar kelime öncesi boşluk önceki paragrafın 1 boş satırı; Önsöz imza satırları Örnek 7'deki gibi ortalı, 6 pt aralıklı.",
      "Özet sayfası: Örnek 5/6 başlığı metin bloğunun 7,3 mm altında gösterir; açık kural (başlık metin bloğunun üstünde, 24 nk/12 nk boşluklar) uygulanır. Örnek 5 anahtar kelime etiketi 'Anahtar Kelimeler:', Örnek 6 'Keywords:' basar (spec'teki 'Key words:' PDF vektör metniyle doğrulanamadı). Özet satır aralığı kılavuzda yazılmamış (cümlede sözcük eksik) — genel 1,5 kuralı ve Örnek 5/6 ölçümü (7,3 mm).",
      "Onay sayfası: Örnek 3 'Tez Onay Sayfası' adlı tez çalışması der — tırnak içi tez başlığı yer tutucusu olarak yorumlanmıştır (INFERRED). Jüri sayısı yüksek lisans için belirtilmemiştir; örnek 5 üyelidir (başkan + 4 üye). 5. ve 6. üye satırları yalnız doldurulunca görünür ve enstitü onay çerçevesini sonraki sayfaya itebilir (kılavuz yalnız 'üye sayısına göre artırılıp azaltılmalı' der). Enstitü müdürü adı düzenlenebilir alandır.",
      "Sınırlamalar: yatay sayfa TxtNote'ta yoktur; baskı (tek yüz, 70–100 g/m², en az 7 nüsha, ciltleme) belge içeriği değildir; ikinci dilde isteğe bağlı özetin yeri/başlığı kaynakta belirsizdir (UNKNOWN) ve üretilmez; Örnek 2'nin kırmızı açıklama kutuları basılmaz.",
    ],
  },
  page: {
    size: "A4", widthMm: 210, heightMm: 297, orientation: "portrait",
    margins: { topMm: 30, bottomMm: 30, leftMm: 30, rightMm: 30 },
    header: { heightMm: 0, distanceMm: 12.5, content: "", firstPage: "same" },
    footer: { heightMm: 8, distanceMm: 12.5, content: "", firstPage: "same" },
    numbering: { enabled: true, position: "bottom", align: "center", format: "arabic", startAt: 1, restart: false, style: { fontFamily: FONT, fontSizePt: 11 } },
  },
  typography: {
    body: { fontFamily: FONT, fontSizePt: 12, fontWeight: 400, align: "justify", lineHeight: 1.5, spaceBeforePt: 0, spaceAfterPt: BLANK_PT, firstLineIndentMm: 0 },
    paragraph: { firstLineIndentMm: 0, spaceBeforePt: 0, spaceAfterPt: BLANK_PT, lineHeight: 1.5, align: "justify" },
    headings: {
      "1": heading("{1}.", { textTransform: "uppercase", pageBreakBefore: true }),
      "2": heading("{1}.{2}."),
      "3": heading("{1}.{2}.{3}."),
      // The guide explicitly requires every heading degree bold. H4 has no distinct size or numbering rule;
      // TNR 12 pt follows the general text rule without assigning a new hierarchy format.
      "4": { fontFamily: FONT, fontSizePt: 12, fontWeight: 700 },
    },
    // Word numbers footnotes continuously; the guide is silent. Separator: from the text-block edge to the page centre (50 % of the text width).
    footnotes: { placement: "pageBottom", numbering: "document", fontFamily: FONT, fontSizePt: 10, lineHeight: 1, separator: { enabled: true, widthPercent: 50, thicknessPt: 0.5, spaceBeforePt: 24 } },
    lineSpacing: { mode: "word", singleLineEm: SINGLE_LINE_EM, baseline: "word", paragraphSpacing: "additive", blockGap: "paragraphPitch" },
    // Çizelge altı kısaltma açıklamaları: Times New Roman 8 punto, iki yana yaslı (§2.14 Örnek).
    paragraphStyles: { tableNote: { fontSizePt: 8, align: "justify", firstLineIndentMm: 0, spaceBeforePt: 0, spaceAfterPt: 0 } },
  },
  placeholders: {
    THESIS_TITLE: { label: "Tez başlığı (Türkçe, sözcük baş harfleri büyük)", type: "text", required: true },
    THESIS_TITLE_EN: { label: "Title of thesis (English)", type: "text" },
    STUDENT_NAME: { label: "Öğrencinin Adı SOYADI", type: "text", required: true },
    DEPARTMENT_NAME: { label: "Anabilim dalı adı", type: "text", required: true },
    ADVISOR_TITLE: { label: "Danışman unvanı", type: "text", required: true },
    ADVISOR_NAME: { label: "Danışman Adı SOYADI", type: "text", required: true },
    CO_ADVISOR_TITLE: { label: "2. Danışman unvanı (varsa)", type: "text" },
    CO_ADVISOR_NAME: { label: "2. Danışman Adı SOYADI (varsa)", type: "text" },
    THESIS_NO: { label: "Tez No (örn. 2020-001)", type: "text" },
    CITY: { label: "Şehir", type: "text", defaultValue: "Afyonkarahisar" },
    YEAR: { label: "Yıl (Önsöz imzası)", type: "number", required: true },
    DEFENSE_DATE: { label: "Savunma tarihi (GG / AA / YYYY)", type: "text", required: true },
    DECISION: { label: "Karar (oy birliği / oy çokluğu)", type: "text", required: true },
    JURY_CHAIR: { label: "Jüri başkanı (Unvan, Ad, Soyad, Kurum)", type: "text" },
    ...Object.fromEntries([1, 2, 3, 4, 5, 6].map((n) => [`JURY_MEMBER_${n}`, { label: `Jüri üyesi ${n} (Unvan, Ad, Soyad, Kurum)`, type: "text" }])),
    INSTITUTE_DIRECTOR: { label: "Enstitü müdürü (Ünvanı Adı ve SOYADI)", type: "text" },
    DECLARATION_DATE: { label: "Etik bildirim tarihi (GG/AA/YYYY)", type: "text" },
    PROJECT_FUNDER: { label: "Destekleyen kuruluş (proje varsa)", type: "text" },
    PROJECT_NO: { label: "Proje numarası (proje varsa)", type: "text" },
    KEYWORDS: { label: "Anahtar Kelimeler (3-6, alfabetik, virgülle)", type: "text" },
    KEYWORDS_EN: { label: "Keywords (3-6, alphabetical)", type: "text" },
  },
  validation: {
    KEYWORDS: { minItems: 3, separator: ",", severity: "warning", message: "Anahtar Kelimeler 3-6 tane olmalı ve virgülle ayrılmalıdır." },
    KEYWORDS_EN: { minItems: 3, separator: ",", severity: "warning", message: "Keywords 3-6 tane olmalı ve virgülle ayrılmalıdır." },
  },
  tables: {
    ...caption("Çizelge", "above"),
    borders: { preset: "threeRule", widthPt: 0.5 },
    cellStyle: { fontSizePt: 12 },
    continuation: { format: "{label} {number}. Devam." },
  },
  figures: caption("Şekil", "below", { box: { align: "center", spaceBeforePt: 0, spaceAfterPt: 0 } }),
  captionKinds: { photo: caption("Resim", "below", { box: { align: "center", spaceBeforePt: 0, spaceAfterPt: 0 } }) },
  equations: { numbering: { scope: "chapter", format: "({chapter}.{n})" }, numberAlign: "right",
    style: { fontFamily: FONT, fontSizePt: 12, lineHeight: 1.5, spaceBeforePt: 0, spaceAfterPt: BLANK_PT } },
  bibliography: { heading: "KAYNAKLAR", style: { fontFamily: FONT, fontSizePt: 11, align: "justify", lineHeight: 1, spaceBeforePt: 0, spaceAfterPt: 6, firstLineIndentMm: 0, hangingIndentMm: 12.5 }, hangingIndentMm: 0, citationStyle: "author-year" },
  toc: { heading: "İÇİNDEKİLER", levels: [1, 2, 3], showPageNumbers: true },
};

const variant = (degreeType, suffix) => ({ ...base, id: `aku-sagbil-${degreeType}-tr-v1`, degreeType, sections: sections(degreeLabels[degreeType]), displayName: `Afyon Kocatepe Üniversitesi · Sağlık Bilimleri Enstitüsü · ${suffix}` });

export const akuSagbilMaster = variant("master", "Yüksek Lisans");
export const akuSagbilPhd = variant("phd", "Doktora");
export default akuSagbilMaster;
