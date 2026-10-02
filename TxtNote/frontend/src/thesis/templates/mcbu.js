/**
 * Manisa Celal Bayar Üniversitesi, Lisansüstü Eğitim Enstitüsü.
 *
 * Source of truth (the only one in the repository): the institute's thesis writing guide
 * Butun-Sablonlar/Ege/Manisa Celal Bayar Üniversitesi/Lisansustu_Egitim_Enstitusu_Tez/
 * MCBU_Lisansustu_Tez_Yazim_Kilavuzu_2025.docx (uploaded 2025-10-22, sha256 e607f8f7…08238c7, see KAYNAK.md
 * there): EK 2 İç Kapak, Tez Sırtı, Taahhütname, Özet, Abstract, Önsöz ve Teşekkür, Simgeler ve
 * Kısaltmalar Dizini, Şekiller/Tablolar Dizini, İçindekiler and "Tez Yazım Kuralları". Values are
 * checked against its document.xml/styles.xml (orchestration/specs/mcbu-lee.json lists evidence,
 * conflicts C1–C7 and UNKNOWNs U1–U14); where it is silent or contradicts itself the choice is
 * noted inline ("kaynakta belirsiz"). Red instruction text of the examples is never printed.
 * The template's first version came from an older PDF rendering of the same guide that is not in
 * the repository (ShareFileGallery-GTSM221020251445.pdf, MANUEL_INDIRME_GEREKLI in KAYNAK.md).
 *
 * Pure template data for the generic engine. Master's and doctoral theses differ only in
 * their degree lines and the doctorate-only CV; both variants share every rule below.
 * Line heights are Word's "n lines" (1 = single, 1.5 = one and a half): typography.lineSpacing
 * draws them at Word's pitch for Times New Roman, as measured in the PDF (single 13,8 pt,
 * 1,5 satır 20,7 pt at 12 pt = 1,15 em per line).
 */
import { MM_PER_PT } from "../units.js";
import mcbuLogo from "./assets/mcbuLogo.js";

const FONT = "Times New Roman";
/** One Word twip (1/1440 in) in mm. */
const MM_PER_TWIP = 25.4 / 1440;
/** Word's single line of Times New Roman, in em (the PDF: 13,8 pt per line at 12 pt). */
const SINGLE_LINE_EM = 1.15;
/** Height (pt) of `lines` empty Word lines of 12 pt type at `spacing` ("n satır boşluk"). */
const emptyLinesPt = (lines, spacing = 1) => Math.round(lines * 12 * spacing * SINGLE_LINE_EM * 100) / 100;
/** `lines` empty Word lines of `sizePt` type at single spacing ("n satır boşluk bırakılır"). */
const blank = (lines, sizePt = 12) => ({ type: "spacer", heightMm: lines * sizePt * SINGLE_LINE_EM * MM_PER_PT });
// The optional co-advisor line (with the empty line above it) is left out when neither value is given.
const coAdvisor = (value) => ({ type: "group", visibleWhen: { anyFilled: ["CO_ADVISOR_TITLE", "CO_ADVISOR_NAME"] }, blocks: [blank(1), { type: "text", value }] });
const bold = { fontWeight: 700 };
const bold14 = { fontWeight: 700, fontSizePt: 14 };
const upper = { textTransform: "uppercase" };
const dots = "…………………";
// Şekiller/Tablolar dizini: the label ("Tablo 3.") is bold; a long entry wraps with ind left=hanging=1176 tw (G[247]).
const LIST_HANGING_MM = Math.round(1176 * MM_PER_TWIP * 100) / 100;
// Special pages and their lines: single spaced, no paragraph indent or spacing.
const pageLines = { firstLineIndentMm: 0, spaceBeforePt: 0, spaceAfterPt: 0, lineHeight: 1 };
const roman = { format: "roman-upper" };
// Front section titles are centered and single spaced (guide style "Title": line=240, after=0) in every
// example page; the empty line that follows them is `spaceAfterPt`.
const centeredTitle = (spaceAfterPt) => ({ "1": { align: "center", lineHeight: 1, spaceAfterPt } });

const degreeLabels = {
  master: { cover: "YÜKSEK LİSANS TEZİ", tr: "Yüksek Lisans Tezi", en: "M.Sc. Thesis" },
  phd: { cover: "DOKTORA TEZİ", tr: "Doktora Tezi", en: "PhD Thesis" },
};

function sections(degree) {
  return [
    // EK 2 İç Kapak: bold, centered; the gaps are the example's own "n satır boşluk" notes.
    // PDF geometry (pt from top): T.C. 86.8, logo 149.1–254.8, degree 270.5,
    // title 411.1, student 523.5, advisor 606.3, city/year 744.3.
    { id: "inner-cover", type: "innerCover", title: "İç Kapak", status: "required", group: "cover", mode: "static",
      overrides: { page: { numbering: { enabled: false } }, body: { ...pageLines, align: "center", fontWeight: 700 } },
      blocks: [
        blank(1),
        { type: "text", value: "T.C.", style: bold14 },
        { type: "text", value: "MANİSA CELAL BAYAR ÜNİVERSİTESİ", style: bold14 },
        { type: "text", value: "LİSANSÜSTÜ EĞİTİM ENSTİTÜSÜ", style: bold14 },
        blank(1, 14),
        { type: "image", source: mcbuLogo, widthMm: 85.95 * MM_PER_PT, heightMm: 105.74 * MM_PER_PT, align: "center" },
        blank(1),
        { type: "text", value: degree.cover },
        { type: "metadata", field: "DEPARTMENT_NAME", suffix: " ANABİLİM DALI", fallback: `${dots} ANABİLİM DALI`, style: upper },
        { type: "metadata", field: "PROGRAM_NAME", suffix: " PROGRAMI", fallback: `${dots} PROGRAMI`, style: upper },
        { type: "spacer", heightMm: 98 * MM_PER_PT },
        { type: "metadata", field: "THESIS_TITLE", fallback: "TEZ BAŞLIĞI", style: { ...bold14, ...upper } },
        blank(5, 14),
        { type: "metadata", field: "STUDENT_NAME", fallback: "Ad SOYAD" },
        blank(5, 12),
        { type: "text", value: "Danışman" },
        { type: "text", value: "{{ADVISOR_TITLE}} {{ADVISOR_NAME}}" },
        { type: "spacer", heightMm: 96.6 * MM_PER_PT },
        { type: "text", value: "{{CITY}}–{{YEAR}}", style: upper },
      ] },
    // Counted physical page, no visible number: Roman numbering starts at ÖZET (= I).
    { id: "declaration", type: "declaration", title: "Taahhütname", status: "required", group: "front", mode: "static",
      overrides: { page: { numbering: { enabled: false } }, body: pageLines },
      blocks: [
        { type: "text", value: "TAAHHÜTNAME", style: { ...bold, align: "center" } },
        blank(1),
        { type: "text", value: "Bu tezin Manisa Celal Bayar Üniversitesi Lisansüstü Eğitim Enstitüsü {{DEPARTMENT_NAME}} Ana Bilim Dalında akademik ve etik kurallara uygun olarak yazıldığını ve kullanılan tüm literatür bilgilerinin referans gösterilerek tezde yer aldığını, tamamen kendi çalışmam olduğunu, her alıntıya kaynak gösterdiğimi, tezin yazımında akademik ve etik kurallara aykırı herhangi bir yapay zeka ve program kullanmadığımı beyan ederim.", style: { align: "justify" } },
        blank(2),
        // G[50] "İmza": centered inside ind left=6372 tw (112.39 mm) firstLine=708 tw (12.49 mm), i.e. centred at x≈175 mm;
        // G[51] "Ad SOYAD": bold, right aligned.
        { type: "text", value: "İmza", style: { align: "center", leftIndentMm: 6372 * MM_PER_TWIP, firstLineIndentMm: 708 * MM_PER_TWIP } },
        { type: "metadata", field: "STUDENT_NAME", fallback: "Ad SOYAD", style: { ...bold, align: "right" } },
        // "(Kullanılan herhangi bir program varsa belirtilmelidir.)": the author's own statement, printed only when given.
        { type: "group", visibleWhen: { anyFilled: ["USED_PROGRAMS"] }, blocks: [blank(3),
          { type: "metadata", field: "USED_PROGRAMS", prefix: "Kullanılan program: ", fallback: "", style: { align: "justify" } },
        ] },
      ] },
    // ÖZET: centered bold header lines, the editable abstract, then keywords and year/pages on the same page.
    { id: "abstract-header", type: "abstract", title: "ÖZET", status: "required", group: "front", mode: "static", standalone: false, tocEntry: "title",
      overrides: { page: { numbering: { ...roman, startAt: 1, restart: true } }, body: { ...pageLines, align: "center", fontWeight: 700 } },
      blocks: [
        { type: "text", value: "ÖZET" },
        blank(1),
        { type: "text", value: degree.tr },
        blank(2),
        { type: "metadata", field: "STUDENT_NAME", fallback: "Ad SOYAD" },
        { type: "text", value: "Manisa Celal Bayar Üniversitesi" },
        { type: "text", value: "Lisansüstü Eğitim Enstitüsü" },
        { type: "metadata", field: "DEPARTMENT_NAME", suffix: " Anabilim Dalı", fallback: `${dots} Anabilim Dalı` },
        blank(1),
        { type: "text", value: "Danışman: {{ADVISOR_TITLE}} {{ADVISOR_NAME}}" },
        coAdvisor("İkinci Danışman: {{CO_ADVISOR_TITLE}} {{CO_ADVISOR_NAME}}"),
        blank(2),
      ] },
    // Kaynakta çelişkili: "tek satır aralıklı, paragraflar arası bir satır" vs the page note and the
    // example's own geometry (1,5 satır, 1,25 cm). The general body paragraph rule applies unchanged.
    { id: "abstract", type: "abstract", title: "Özet metni", status: "required", group: "front", mode: "editable", pageBreakBefore: false, showTitle: false,
      overrides: { page: { numbering: roman } } },
    { id: "abstract-footer", type: "abstract", title: "Özet anahtar kelimeler", status: "required", group: "front", mode: "static", standalone: false, pageBreakBefore: false,
      overrides: { page: { numbering: roman }, body: { ...pageLines, align: "left", fontWeight: 700 } },
      blocks: [
        blank(2),
        { type: "text", value: "Anahtar Kelimeler: {{KEYWORDS}}" },
        blank(1),
        { type: "text", value: "{{YEAR}}, {{PAGE_COUNT}} sayfa" },
      ] },
    { id: "abstract-en-header", type: "englishAbstract", title: "ABSTRACT", status: "required", group: "front", mode: "static", standalone: false, tocEntry: "title",
      overrides: { page: { numbering: roman }, body: { ...pageLines, align: "center", fontWeight: 700 } },
      blocks: [
        { type: "text", value: "ABSTRACT" },
        blank(1),
        { type: "text", value: degree.en },
        blank(2),
        { type: "metadata", field: "STUDENT_NAME", fallback: "Name and LASTNAME" },
        blank(1),
        { type: "text", value: "Manisa Celal Bayar University" },
        { type: "text", value: "Graduate School of Education" },
        { type: "metadata", field: "DEPARTMENT_NAME_EN", prefix: "Department of ", fallback: "Department of [English department required]" },
        blank(1),
        { type: "text", value: "Supervisor: {{ADVISOR_TITLE}} {{ADVISOR_NAME}}" },
        coAdvisor("Co-Supervisor: {{CO_ADVISOR_TITLE}} {{CO_ADVISOR_NAME}}"),
        blank(2),
      ] },
    // A faithful translation of ÖZET, written by the author; never translated automatically.
    { id: "abstract-en", type: "englishAbstract", title: "Abstract text", status: "required", group: "front", mode: "editable", pageBreakBefore: false, showTitle: false,
      overrides: { page: { numbering: roman } } },
    { id: "abstract-en-footer", type: "englishAbstract", title: "Abstract keywords", status: "required", group: "front", mode: "static", standalone: false, pageBreakBefore: false,
      overrides: { page: { numbering: roman }, body: { ...pageLines, align: "left", fontWeight: 700 } },
      blocks: [
        blank(2),
        { type: "text", value: "Keywords: {{KEYWORDS_EN}}" },
        blank(1),
        { type: "text", value: "{{YEAR}}, {{PAGE_COUNT}} pages" },
      ] },
    // "Teşekkür bölümü tek satır aralıklı"; 1,25 cm indent; one empty line between paragraphs.
    // If the thesis project was funded, the institution and project number must be stated here.
    { id: "preface", type: "preface", title: "ÖNSÖZ VE TEŞEKKÜR", status: "required", group: "front", mode: "editable", showTitle: true, tocEntry: "title",
      overrides: { page: { numbering: roman }, body: { lineHeight: 1 }, paragraph: { lineHeight: 1, spaceAfterPt: emptyLinesPt(1) }, headings: centeredTitle(emptyLinesPt(1)) } },
    // "Teşekkür metni bittikten sonra 2 satır boşluk bırakılır": the last paragraph's empty line + one more.
    { id: "preface-signature", type: "preface", title: "Önsöz imza", status: "required", group: "front", mode: "static", standalone: false, pageBreakBefore: false,
      overrides: { page: { numbering: roman }, body: { ...pageLines, align: "right" } },
      blocks: [
        blank(1),
        { type: "metadata", field: "STUDENT_NAME", fallback: "Ad SOYAD" },
        { type: "text", value: "{{CITY}}, {{YEAR}}" },
      ] },
    // Written by the author (1,5 satır, 12 pt); entries start at the margin. The example entries (G[147]-G[148]) carry after=120
    // (6 pt) but use style ListeParagraf, whose definition has contextualSpacing: Word adds no space between paragraphs of
    // the same style, so consecutive entries are 1,5 lines apart (20,70 pt) and 0 is right. The empty line under the title
    // (G[146]) is 1,5 spaced (line=360), the title itself single (G[145]).
    { id: "symbols", type: "listOfAbbreviations", title: "SİMGELER VE KISALTMALAR DİZİNİ", status: "required", group: "front", mode: "editable", showTitle: true, tocEntry: "title",
      overrides: { page: { numbering: roman }, paragraph: { firstLineIndentMm: 0, spaceAfterPt: 0, align: "left" }, headings: centeredTitle(emptyLinesPt(1, 1.5)) } },
    { id: "index-figures", type: "listOfFigures", title: "ŞEKİLLER DİZİNİ", status: "required", group: "front", mode: "generated", tocEntry: "title",
      generatedIndex: { kind: "figures", leader: "none", pageHeading: "Sayfa", pageHeadingStyle: bold, labelStyle: bold, hanging: LIST_HANGING_MM, style: { lineHeight: 1, spaceAfterPt: 0 } },
      overrides: { page: { numbering: roman }, headings: centeredTitle(emptyLinesPt(1)) } },
    { id: "index-tables", type: "listOfTables", title: "TABLOLAR DİZİNİ", status: "required", group: "front", mode: "generated", tocEntry: "title",
      generatedIndex: { kind: "tables", leader: "none", pageHeading: "Sayfa", pageHeadingStyle: bold, labelStyle: bold, hanging: LIST_HANGING_MM, style: { lineHeight: 1, spaceAfterPt: 0 } },
      overrides: { page: { numbering: roman }, headings: centeredTitle(emptyLinesPt(1)) } },
    // The example lists ÖZET … İÇİNDEKİLER in Roman and GİRİŞ as 1, all bold, without dot leaders.
    { id: "toc", type: "tableOfContents", title: "İÇİNDEKİLER", status: "required", group: "front", mode: "generated", tocEntry: "title",
      generatedIndex: { kind: "toc", leader: "none", matchHeadingTransform: true, style: { ...bold, lineHeight: 1, spaceAfterPt: 0 } },
      overrides: { page: { numbering: roman }, headings: centeredTitle(emptyLinesPt(1)) } },
    // Arabic numbering starts at GİRİŞ. The chapters after it are free (the guide suggests different
    // structures for social sciences, experimental work and sport sciences), so none is imposed.
    { id: "introduction", type: "introduction", title: "GİRİŞ", status: "required", group: "body", mode: "editable", showTitle: true, tocEntry: "title",
      overrides: { page: { numbering: { format: "arabic", startAt: 1, restart: true } } } },
    { id: "main", type: "mainContent", title: "Bölümler", status: "required", group: "body", mode: "editable" },
    { id: "bibliography", type: "bibliography", title: "KAYNAKÇA", status: "required", group: "back", mode: "editable", showTitle: true, tocEntry: "title" },
    // "Ekler bölümü bir satır aralığı ile yazılır"; one empty line after the title and after every description.
    { id: "appendices", type: "appendices", title: "EKLER", status: "optional", group: "back", mode: "editable", showTitle: true, tocEntry: "title",
      overrides: { body: { lineHeight: 1 }, paragraph: { lineHeight: 1, spaceAfterPt: emptyLinesPt(1) }, headings: { "1": { lineHeight: 1, spaceAfterPt: emptyLinesPt(1) } } } },
    // Doctoral theses only; no chapter number, not in İÇİNDEKİLER, title centered 14 pt bold.
    { id: "cv", type: "curriculumVitae", title: "ÖZGEÇMİŞ", status: "optional", group: "back", mode: "editable", showTitle: true, tocEntry: "none",
      visibleWhen: { field: "degreeType", equals: "phd" },
      overrides: { headings: {
        "1": { align: "center", fontSizePt: 14, pageBreakBefore: false, numbering: { enabled: false } },
        "2": { numbering: { enabled: false } }, "3": { numbering: { enabled: false } }, "4": { numbering: { enabled: false } },
      } } },
  ];
}

const heading = (format, extra = {}) => ({ fontFamily: FONT, fontSizePt: 12, fontWeight: 700, align: "justify", lineHeight: 1.5, spaceBeforePt: 0, spaceAfterPt: 6, keepWithNext: true, numbering: { enabled: true, format, sequence: "arabic" }, ...extra });
const captionNumbering = { document: { scope: "document", format: "{n}", sequence: "arabic" }, chapter: { scope: "chapter", format: "{chapter}.{n}", sequence: "arabic" } };

const base = {
  schemaVersion: 1,
  templateVersion: "1.0.0",
  universityId: "mcbu",
  universityName: "Manisa Celal Bayar Üniversitesi",
  instituteId: "lee",
  instituteName: "Lisansüstü Eğitim Enstitüsü",
  language: "tr",
  status: "official",
  source: {
    type: "official",
    documentName: "MCBU_Lisansustu_Tez_Yazim_Kilavuzu_2025.docx — MCBÜ Lisansüstü Eğitim Enstitüsü tez yazım kılavuzu",
    url: "https://lee.mcbu.edu.tr/WebSiteContent/66/ShareFileGallery/ShareFileGallery-JUIK221020251432.docx",
    revisionDate: "2025-10-22",
    verifiedAt: "2026-10-02",
    // Recorded, not enforced: duplex printing is allowed with the advisor's approval. The
    // "Tez Sırtı Örneği" (spine: name, title, year) is print output, not a thesis page.
    notes: ["Depo yolu: Butun-Sablonlar/Ege/Manisa Celal Bayar Üniversitesi/Lisansustu_Egitim_Enstitusu_Tez/MCBU_Lisansustu_Tez_Yazim_Kilavuzu_2025.docx; sha256 e607f8f7405ae10eee4880e7d52f660517fb595625f065088ec5f437f08238c7 (KAYNAK.md).", "Danışman onayı ile çift taraflı baskı yapılabilir.", "Tez sırtı (AD SOYAD, TEZ ADI, YIL) sayfa değildir; baskıda hazırlanır."],
  },
  page: {
    size: "A4", widthMm: 210, heightMm: 297, orientation: "portrait",
    margins: { topMm: 25, bottomMm: 25, leftMm: 40, rightMm: 25 },
    // 2025 guide DOCX sectPr w:header="709" w:footer="709" twips = 12.5 mm (MEASURED).
    header: { heightMm: 0, distanceMm: 12.5, content: "", firstPage: "same" },
    footer: { heightMm: 8, distanceMm: 12.5, content: "", firstPage: "same" },
    // Position: bottom centre is MEASURED (guide footer1.xml: PAGE field in a centred AltBilgi paragraph, footer distance 709 tw).
    // Font and size are not stated by the guide (U8): Times New Roman 12 like the body.
    numbering: { enabled: true, position: "bottom", align: "center", format: "arabic", startAt: 1, restart: false },
  },
  typography: {
    body: { fontFamily: FONT, fontSizePt: 12, fontWeight: 400, align: "justify", lineHeight: 1.5, spaceBeforePt: 0, spaceAfterPt: 6, firstLineIndentMm: 12.5 },
    paragraph: { firstLineIndentMm: 12.5, spaceBeforePt: 0, spaceAfterPt: 6, lineHeight: 1.5, align: "justify" },
    headings: {
      // Chapter headings: bold, 12 pt, all capitals, justified, new page, one empty line after.
      "1": heading("{1}.", { textTransform: "uppercase", pageBreakBefore: true, spaceAfterPt: emptyLinesPt(1, 1.5) }),
      "2": heading("{1}.{2}."),
      "3": heading("{1}.{2}.{3}."),
      "4": heading("{1}.{2}.{3}.{4}."),
    },
    footnotes: { placement: "pageBottom", fontFamily: FONT, fontSizePt: 10 },
    lineSpacing: { mode: "word", singleLineEm: SINGLE_LINE_EM, baseline: "word" },
  },
  placeholders: {
    UNIVERSITY_NAME: { label: "Üniversite", type: "text" },
    INSTITUTE_NAME: { label: "Enstitü", type: "text" },
    THESIS_TITLE: { label: "Tez başlığı", type: "text", required: true },
    STUDENT_NAME: { label: "Ad SOYAD", type: "text", required: true },
    DEPARTMENT_NAME: { label: "Anabilim dalı", type: "text", required: true },
    DEPARTMENT_NAME_EN: { label: "Department (English)", type: "text" },
    PROGRAM_NAME: { label: "Program", type: "text", required: true },
    ADVISOR_TITLE: { label: "Danışman unvanı (ör. Doç. Dr.)", type: "text", required: true },
    ADVISOR_NAME: { label: "Danışman Ad SOYAD", type: "text", required: true },
    CO_ADVISOR_TITLE: { label: "İkinci danışman unvanı", type: "text" },
    CO_ADVISOR_NAME: { label: "İkinci danışman Ad SOYAD", type: "text" },
    CITY: { label: "Şehir", type: "text", defaultValue: "Manisa" },
    YEAR: { label: "Yıl", type: "number", required: true },
    KEYWORDS: { label: "Anahtar kelimeler (en az 5, virgülle)", type: "text" },
    KEYWORDS_EN: { label: "Keywords (en az 5, virgülle)", type: "text" },
    // "2023, xxx sayfa": the document's own physical page count, never typed in or stored.
    PAGE_COUNT: { label: "Toplam sayfa sayısı (Özet/Abstract)", type: "number", derived: "totalPages" },
    USED_PROGRAMS: { label: "Kullanılan program (varsa, Taahhütname)", type: "text" },
  },
  validation: {
    DEPARTMENT_NAME_EN: { minItems: 1, severity: "warning", message: "Abstract için Department (English) alanını İngilizce doldurun." },
    KEYWORDS: { minItems: 5, separator: ",", severity: "warning", message: "Anahtar Kelimeler en az 5 tane olmalı ve virgül ile ayrılmalıdır." },
    KEYWORDS_EN: { minItems: 5, separator: ",", severity: "warning", message: "Keywords en az 5 tane olmalı ve virgül ile ayrılmalıdır." },
  },
  // Table caption above, figure caption below; one line centered, longer justified. Tables are
  // single spaced with centered names/values; their type size is left to the author.
  tables: { label: "Tablo", position: "above", style: { fontFamily: FONT, fontSizePt: 12, align: "center", lineHeight: 1 }, numbering: captionNumbering.document, captionAlignment: "auto", spacingBeforePt: emptyLinesPt(1), spacingAfterPt: 6, align: "center", cellStyle: { align: "center", lineHeight: 1 } },
  // box.align "center": the image sits centred (guide DOCX figure paragraph jc=center); spaceBefore/AfterPt 15 keep the editor's default figure margin.
  figures: { label: "Şekil", position: "below", style: { fontFamily: FONT, fontSizePt: 12, align: "center", lineHeight: 1.5 }, numbering: captionNumbering.document, captionAlignment: "auto", spacingBeforePt: 6, spacingAfterPt: emptyLinesPt(1), align: "center", box: { align: "center", spaceBeforePt: 15, spaceAfterPt: 15 } },
  // One method throughout the thesis: numbered from 1 or separately in every chapter.
  captionNumberingChoices: [
    { id: "document", label: "Tez boyunca 1'den başlayarak", numbering: captionNumbering.document },
    { id: "chapter", label: "Her bölümde ayrı", numbering: captionNumbering.chapter },
  ],
  // The citation style (APA-6, APA-7, Chicago, …) is the author's choice; none is imposed.
  // Kaynakta belirsiz: references are excluded from the 1,5 rule without a stated spacing.
  bibliography: { heading: "KAYNAKÇA", style: { fontFamily: FONT, fontSizePt: 12, align: "justify", lineHeight: 1, spaceAfterPt: 6 }, hangingIndentMm: 0 },
  toc: { heading: "İÇİNDEKİLER", levels: [1, 2, 3, 4], showPageNumbers: true },
};

const variant = (degreeType, suffix) => ({ ...base, id: `mcbu-lee-${degreeType}-tr-v1`, degreeType, sections: sections(degreeLabels[degreeType]), displayName: `Manisa Celal Bayar Üniversitesi · Lisansüstü Eğitim Enstitüsü · ${suffix}` });

export const mcbuMaster = variant("master", "Yüksek Lisans");
export const mcbuPhd = variant("phd", "Doktora");
export default mcbuMaster;
