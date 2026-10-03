/**
 * Afyon Kocatepe Üniversitesi, Fen Edebiyat Fakültesi, Matematik Bölümü, lisans tezi (Türkçe).
 *
 * Source (Butun-Sablonlar/Ege/Afyon Kocatepe Üniversitesi/Matematik_Bolumu_Bitirme_Tezi/): the Word template
 * AKU_Matematik_Lisans_Tez_Sablonu_2025.docx (core.xml 2025-10-21) is the ONLY source; there is no separate guide. Its XML
 * (sectPr, styles, paragraph/run properties, empty-paragraph structure, tables, footers) is the authority; the instruction
 * texts inside it (call-out boxes, red notes, the embedded Word "Paragraf" screenshot) are EXPLICIT; whatever it does not
 * define is UNKNOWN and is not generated. The reviewed spec is orchestration/specs/aku-matematik-lisans.json, the report
 * orchestration/reports/aku-matematik-lisans.md.
 *
 * Template structure that exists: Dış Kapak (12 pt), İç Kapak (14 pt), TEŞEKKÜR, İÇİNDEKİLER DİZİNİ, SİMGELER ve KISALTMALAR
 * DİZİNİ, ŞEKİLLER / ÇİZELGELER / RESİMLER DİZİNİ, chapters 1-5, 6. KAYNAKLAR, ÖZGEÇMİŞ (page), EKLER (only in its TOC).
 * It has NO approval page, ethics page, ÖZET or ABSTRACT: none is generated.
 *
 * Word line model (measured on Word-made PDFs): a single Times New Roman line is 1.15 em, the first baseline of a line box sits
 * near 0.93 em below its top and the extra leading of "1,5 satır" goes below the text; paragraph spacing is Word-additive. The
 * template separates paragraphs and headings by empty paragraphs "(Bir boşluk)" (red notes) of one 1.5-spaced 12 pt line.
 */
import { MM_PER_PT } from "../units.js";

const FONT = "Times New Roman";
const SINGLE_LINE_EM = 1.15;
/** Word line of `sizePt` type at `spacing` (n lines), in pt and as an empty-line spacer in mm. */
const linePt = (sizePt, spacing) => sizePt * SINGLE_LINE_EM * spacing;
const blank = (lines = 1, sizePt = 12, spacing = 1.5) => ({ type: "spacer", heightMm: lines * linePt(sizePt, spacing) * MM_PER_PT });
const spacerPt = (pt) => ({ type: "spacer", heightMm: pt * MM_PER_PT });
/** One empty 12 pt line at 1.5 spacing: 20.7 pt (the template's red "(Bir boşluk)" paragraph). */
const BLANK_PT = linePt(12, 1.5);

const bold = { fontWeight: 700 };
const page15 = { firstLineIndentMm: 0, spaceBeforePt: 0, spaceAfterPt: 0, lineHeight: 1.5 };
const roman = { numbering: { format: "roman-lower" } };

// ---- special pages (template section 1 = two physical pages) --------------------------------------------

// Dış Kapak = the template's first page (paragraphs 0-45): style "Normal (Web)", 12 pt, single spaced, 0 pt after, 6 pt before on
// the lines after the title; the text block starts after one 10 pt empty Normal line + 35 empty 12 pt lines (11.5 + 35 x 13.8 pt).
// The two-line title sample ("TEZ BAŞLIĞI" + "TEZ BAŞLIĞI (Devam)", bold) is one title paragraph here (its continuation lines wrap naturally).
// "ANABİLİM DALI" is the template's own wording of the department line (it differs from the İç Kapak's "MATEMATİK BÖLÜMÜ"): kept as
// the placeholder's default and flagged in the report. The call-out boxes are instructions and are not printed.
const OUTER_TOP_PT = 10 * SINGLE_LINE_EM + 35 * linePt(12, 1);
const outerCover = {
  id: "outer-cover", type: "outerCover", title: "DIŞ KAPAK", status: "required", group: "cover", mode: "static", tocEntry: "none",
  overrides: { page: { numbering: { enabled: false }, trimTerminalTextLeading: true }, body: { firstLineIndentMm: 0, spaceBeforePt: 0, spaceAfterPt: 0, lineHeight: 1, align: "center", fontSizePt: 12 } },
  blocks: [
    spacerPt(OUTER_TOP_PT),
    { type: "metadata", field: "THESIS_TITLE", fallback: "TEZ BAŞLIĞI", style: bold },
    { type: "text", value: "LİSANS TEZİ", style: { spaceBeforePt: 6 } },
    { type: "metadata", field: "STUDENT_NAME", fallback: "Öğrencinin Adı SOYADI", style: { spaceBeforePt: 6 } },
    { type: "text", value: "Danışman", style: { spaceBeforePt: 6 } },
    { type: "text", value: "{{ADVISOR_TITLE}} {{ADVISOR_NAME}}" },
    blank(1, 12, 1),
    { type: "metadata", field: "COVER_DEPARTMENT", fallback: "ANABİLİM DALI", style: { spaceBeforePt: 6 } },
    { type: "text", value: "{{SUBMISSION_MONTH}} {{SUBMISSION_YEAR}}", style: { spaceBeforePt: 6 } },
  ],
};

// İç Kapak = the template's second page (paragraphs 46-72): 14 pt bold ("Yukarıdaki destek yazısı hariç sadece bu sayfada 14 punto
// kullanılmalıdır", EXPLICIT), 1.5 lines, empty lines of 14 pt, margins 30 mm (section 1). The page starts with two empty paragraphs
// (12 pt + 14 pt, 20.7 + 24.15 pt). The title paragraph's first line is 1.5 spaced and a continuation line single spaced in the sample
// = single lines + 8.05 pt after, whatever the number of lines. No seals/logos in this template (its two images are sample figures).
const innerCover = {
  id: "inner-cover", type: "innerCover", title: "İÇ KAPAK", status: "required", group: "cover", mode: "static", tocEntry: "none",
  overrides: { page: { numbering: { enabled: false }, trimTerminalTextLeading: true }, body: { ...page15, align: "center", fontSizePt: 14, fontWeight: 700 } },
  blocks: [
    spacerPt(linePt(12, 1.5) + linePt(14, 1.5)),
    { type: "text", value: "AFYON KOCATEPE ÜNİVERSİTESİ" },
    { type: "text", value: "FEN EDEBİYAT FAKÜLTESİ" },
    blank(3, 14),
    { type: "text", value: "LİSANS TEZİ" },
    blank(3, 14),
    { type: "metadata", field: "THESIS_TITLE", fallback: "TEZ BAŞLIĞI", style: { lineHeight: 1, spaceAfterPt: linePt(14, 0.5) } },
    blank(2, 14),
    { type: "metadata", field: "STUDENT_NAME", fallback: "Öğrencinin Adı SOYADI" },
    blank(3, 14),
    { type: "text", value: "Danışman" },
    { type: "text", value: "{{ADVISOR_TITLE}} {{ADVISOR_NAME}}" },
    blank(3, 14),
    { type: "text", value: "MATEMATİK BÖLÜMÜ" },
    blank(1, 14),
    { type: "text", value: "{{SUBMISSION_MONTH}} {{SUBMISSION_YEAR}}" },
  ],
};

/** Front-matter title (template style Balk1 "No Spacing": bold, centred, 1.5 lines, unnumbered, one empty 1.5 line below). */
const frontTitle = (spaceAfterPt = BLANK_PT, align = "center") => ({ "1": { align, textTransform: "none", spaceAfterPt, numbering: { enabled: false } } });

// Lists of figures/tables/pictures: "Sayfa" bold right under the title; the red instruction + embedded Word "Paragraf" screenshot prescribe
// left alignment, hanging indent, 0 pt before, 6 pt after, SINGLE line spacing ("Şekiller, Çizelgeler ve Resimler Dizininde aşağıdaki ayarlar
// uygulanmalı"); the call-out says continuation lines align under the first line's text. The sample rows (TOC-field output) are 1.5 lines /
// 0 pt after with 907-1191 tw hangings: CONFLICT recorded, the instruction is followed (pitch differs by only 0.9 pt for one-line rows).
const listRule = (kind, title) => ({
  kind, title, leader: "dots", leaderFlow: "inline", pageHeading: "Sayfa", hanging: "label", labelStyle: bold, indentMm: 0,
  pageHeadingStyle: { ...bold, lineHeight: 1.5, spaceBeforePt: 0, spaceAfterPt: 0 },
  style: { lineHeight: 1, spaceBeforePt: 0, spaceAfterPt: 6, align: "left" },
});
const generatedList = (id, type, title, kind, count) => ({
  id, type, title, status: "required", group: "front", mode: "generated", tocEntry: "title", visibleWhen: { count, gte: 1 },
  generatedIndex: listRule(kind, title),
  overrides: { page: roman, headings: frontTitle(0) },
});

const sections = () => [
  outerCover,
  innerCover,
  // TEŞEKKÜR (template section 2 starts here: lowerRoman, start=1 -> TEŞEKKÜR is "i"): bold centred title, one empty line, unindented justified
  // 1.5-spaced paragraphs separated by an empty line, two empty lines, then the right-aligned name and "Afyonkarahisar <yıl>".
  { id: "acknowledgements", type: "acknowledgements", title: "TEŞEKKÜR", status: "required", group: "front", mode: "editable", showTitle: true, tocEntry: "title",
    overrides: { page: { numbering: { format: "roman-lower", startAt: 1, restart: true } }, headings: frontTitle(), paragraph: { firstLineIndentMm: 0 } } },
  { id: "acknowledgements-signature", type: "acknowledgements", title: "Teşekkür imza", status: "required", group: "front", mode: "static", standalone: false, pageBreakBefore: false,
    overrides: { page: roman, body: { ...page15, align: "right" } },
    blocks: [blank(1), { type: "metadata", field: "STUDENT_NAME", fallback: "Öğrencinin Adı SOYADI" }, { type: "text", value: "Afyonkarahisar {{YEAR}}" }] },
  // İÇİNDEKİLER DİZİNİ: bold centred title, "Sayfa" bold right directly below; rows 12 pt regular, 1.5 lines, 0 pt after (direct), right tab 8494 tw
  // (149.8 mm) with dot leader, indents 0 / 5 / 10 / 15 mm (styles toc 1-2: 0, toc 3: 284 tw, toc 4: 567 tw, toc 5: 851 tw); the front-matter titles are listed.
  { id: "toc", type: "tableOfContents", title: "İÇİNDEKİLER DİZİNİ", status: "required", group: "front", mode: "generated", tocEntry: "title",
    generatedIndex: { kind: "toc", title: "İÇİNDEKİLER DİZİNİ", leader: "dots", leaderFlow: "inline", pageHeading: "Sayfa", hanging: "label", indentMm: 5, matchHeadingTransform: true,
      pageHeadingStyle: { ...bold, lineHeight: 1.5, spaceBeforePt: 0, spaceAfterPt: 0 }, style: { lineHeight: 1.5, spaceBeforePt: 0, spaceAfterPt: 0, align: "left" } },
    overrides: { page: roman, headings: frontTitle(0) } },
  // SİMGELER ve KISALTMALAR DİZİNİ: title bold centred (Balk1), one empty line, then the template's two-column table (no rules) of single-spaced 12 pt rows
  // with the definitions at 70.7 mm = 40.7 mm from the margin (the symbols start at 32.0 mm there = cell margin, not reproduced; "Simgeler"/"Kısaltmalar" sub-titles bold); call-out: the abbreviations are alphabetical (EXPLICIT, author duty).
  { id: "symbols", type: "listOfAbbreviations", title: "SİMGELER ve KISALTMALAR DİZİNİ", status: "optional", group: "front", mode: "editable", showTitle: true, tocEntry: "title",
    overrides: { page: roman, headings: frontTitle(), paragraph: { firstLineIndentMm: 0, align: "left", lineHeight: 1, spaceBeforePt: 0, spaceAfterPt: 0, tabStopMm: 40.7, hangingIndentMm: 40.7 } } },
  generatedList("list-figures", "listOfFigures", "ŞEKİLLER DİZİNİ", "figures", "figures"),
  generatedList("list-tables", "listOfTables", "ÇİZELGELER DİZİNİ", "tables", "tables"),
  generatedList("list-photos", "custom", "RESİMLER DİZİNİ", "photo", "photo"),
  // 1. GİRİŞ restarts the numbering in Arabic at 1 (template section 3: pgNumType start=1); chapters follow in "Bölümler"; KAYNAKLAR continues the chapter numbers.
  { id: "introduction", type: "introduction", title: "GİRİŞ", status: "required", group: "body", mode: "editable", showTitle: true, titleNumbering: "continueH1",
    overrides: { page: { numbering: { format: "arabic", startAt: 1, restart: true } } } },
  { id: "main", type: "mainContent", title: "Bölümler", status: "required", group: "body", mode: "editable" },
  { id: "bibliography", type: "bibliography", title: "KAYNAKLAR", status: "required", group: "back", mode: "editable", showTitle: true, titleNumbering: "continueH1",
    // The first entry's 6 pt space-before adds to the title's empty line (Word), which CSS would collapse across the section wrapper.
    overrides: { headings: { "1": { spaceAfterPt: BLANK_PT + 6 } } } },
  // ÖZGEÇMİŞ: the template has a page (bold centred title ÖZGEÇMİŞ + label rows filled in by the author) and lists it in its TOC. The page body
  // is author content (rows with "......" placeholders); only the title typography is taken: optional, unnumbered centred bold title.
  { id: "cv", type: "curriculumVitae", title: "ÖZGEÇMİŞ", status: "optional", group: "back", mode: "editable", showTitle: true, tocEntry: "title",
    overrides: { headings: { "1": { align: "center", textTransform: "none", numbering: { enabled: false } } } } },
  // EKLER: named only in the template's (stale) TOC; no sample page -> layout UNKNOWN, unnumbered H1 style, optional.
  { id: "appendices", type: "appendices", title: "EKLER", status: "optional", group: "back", mode: "editable", showTitle: true, tocEntry: "title",
    overrides: { headings: { "1": { numbering: { enabled: false } } } } },
];

// ---- typography ----------------------------------------------------------------------------------------

const EXCEPTIONS = ["ve", "veya", "ile"];
// Headings (styles Balk2-Balk5 + direct formatting): TNR 12 bold, left, no indent, 1.5 lines, 0 pt before/after, a blank 1.5 line (the red "(Bir boşluk)")
// between a heading and the text. Numbers are typed in the template ("1." / "2.1" / "2.2.1" / "2.3.1.1"). H1 samples are all capitals ("ve" lower-case in
// "MATERYAL ve METOT"): uppercase with exceptions (INFERRED from samples); H2-H4 sample text is Title Case but no rule says so: as typed (UNKNOWN).
// H1 starts on a new page (sample page breaks before 2., 3., 4., 5., 6.).
const heading = (format, extra = {}) => ({ fontFamily: FONT, fontSizePt: 12, fontWeight: 700, align: "left", lineHeight: 1.5, spaceBeforePt: 0, spaceAfterPt: BLANK_PT, firstLineIndentMm: 0, keepWithNext: true, numbering: { enabled: true, format, sequence: "arabic" }, ...extra });
const captionNumbering = { scope: "chapter", format: "{chapter}.{n}", sequence: "arabic" };
// Figure/Resim: image bottom to the caption's first baseline = 6.2 mm (MEASURED on the Word render of the template, p.14: image bottom 101.62 mm,
// caption line top 104.2 mm, caption ascent 0.9336 em).
const FIGURE_GAP_PT = 6.2 / MM_PER_PT - 0.9336 * 11;
// Captions (styles Balk6 + direct): 11 pt, single, justified, label bold + regular text, no period after the number (sample), 0 pt before and 6 pt after; the
// call-out says continuation lines align under the first line ("II. satır üst satıra hizalanmalı").
const caption = (label, position, extra = {}) => ({
  label, position, numbering: captionNumbering, labelFormat: "{label} {number}", labelStyle: bold, hangingIndent: "label", captionAlignment: "justify", align: "center",
  style: { fontFamily: FONT, fontSizePt: 11, align: "justify", lineHeight: 1, spaceBeforePt: 0, spaceAfterPt: 6 },
  spacingBeforePt: 0, spacingAfterPt: 6, ...extra,
});
// The caption's 6 pt after (sample w:after=120) is followed by the template's empty "(Bir boşluk)" paragraph; blockGap realises that whole gap as the
// next block's space-before. Word takes the LARGER of space-after/space-before (measured with Word COM), not the sum, so a non-zero space-after here
// would shorten the Word gap by 6 pt: it is carried by the gap instead (0 here), editor/PDF unchanged.
const figureCaption = (label) => caption(label, "below", { spacingBeforePt: Math.round(FIGURE_GAP_PT * 100) / 100, spacingAfterPt: 0, style: { fontFamily: FONT, fontSizePt: 11, align: "justify", lineHeight: 1, spaceBeforePt: 0, spaceAfterPt: 0 }, box: { align: "center", spaceBeforePt: 0, spaceAfterPt: 0 } });

const base = {
  schemaVersion: 1,
  templateVersion: "1.0.0",
  id: "aku-matematik-lisans-tr-v1",
  universityId: "aku",
  universityName: "Afyon Kocatepe Üniversitesi",
  instituteId: "fef-matematik",
  instituteName: "Fen Edebiyat Fakültesi · Matematik Bölümü",
  degreeType: "undergraduate",
  language: "tr",
  status: "official",
  displayName: "Afyon Kocatepe Üniversitesi · Fen Edebiyat Fakültesi · Matematik Bölümü · Lisans Tezi",
  source: {
    type: "official",
    documentName: "AKÜ Matematik Bölümü Lisans Tez Şablonu (2025) — AKU_Matematik_Lisans_Tez_Sablonu_2025.docx (ayrı yazım kılavuzu yoktur)",
    revisionDate: "2025-10 (şablon: core.xml 2025-10-21; Last-Modified 24 Oct 2025; kapakta 'Afyonkarahisar 2025')",
    verifiedAt: "2026-10-02",
    notes: [
      "Tek kaynak: resmî Word şablonu (ayrı yazım kılavuzu yoktur). Yetki sırası: şablonun XML'i (sectPr, stiller, paragraf/çalıştırma özellikleri, boş paragraf yapısı, tablolar, altbilgiler) > şablon içindeki yönerge metinleri (açıklama kutuları, kırmızı notlar, gömülü Word 'Paragraf' ekran görüntüsü; AÇIK) > tanımsız = UNKNOWN (üretilmez). Kırmızı '(Bir boşluk)' notları 1 boş satır (12 pt, 1,5 aralık, 20,7 pt) yönergesidir ve basılmaz; yerine boşluk konur. Sayfa kuralları Word ile ölçülmüş render (Word COM → PDF) ile doğrulandı.",
      "Şablonda yalnız şu sayfalar vardır: Dış Kapak, İç Kapak, TEŞEKKÜR, İÇİNDEKİLER DİZİNİ, SİMGELER ve KISALTMALAR DİZİNİ, ŞEKİLLER DİZİNİ, ÇİZELGELER DİZİNİ, RESİMLER DİZİNİ, 1. GİRİŞ … 5. TARTIŞMA ve SONUÇ, 6. KAYNAKLAR, ÖZGEÇMİŞ (sayfa); EKLER yalnız şablonun eski önbellekli içindekilerinde geçer. Onay sayfası, etik bildirim, ÖZET ve ABSTRACT şablonda YOKTUR: üretilmez (UNKNOWN değil, tanımsız). Mühür/logo yoktur (şablonun iki görseli örnek şekillerdir).",
      "Sayfa: A4 dikey (pgSz 11904/11906 x 16838 tw), dört kenar 30 mm (1701 tw, üç bölümde de aynı; 3. bölümde 1701 sol-sağ-üst-alt), üst/alt bilgi uzaklığı 12,5 mm (709/708 tw). Kapaklar numarasız (1. bölüm altbilgisi boş). 2. bölüm: küçük Roman, başlangıç 1 (TEŞEKKÜR 'i'… RESİMLER DİZİNİ 'vii'); 3. bölüm: Arapça, başlangıç 1 (1. GİRİŞ '1'). Altbilgi: ortada, yalnız PAGE alanı, boyut verilmemiş (Normal stili/docDefaults boyutsuz = Word varsayılanı 10 pt, MEASURED 10,0 pt), Times New Roman. Bölüm sonu türü 'oddPage' boş sayfa üretmez (sıradaki numara 1/tek).",
      "Gövde: stil 'Normal' Times New Roman, boyut stilde yoktur; gövde paragraflarının çalıştırmaları sz=24 (12 pt) tanımlar (doğrudan). Paragraf: iki yana yaslı, line=360 (1,5), girinti YOK, öncesi/sonrası 0; paragraflar ve başlıklar arasında birer boş 1,5 satır (kırmızı '(Bir boşluk)' ve boş paragraflar). Motorda: paragraf sonrası 20,7 pt (Word toplamlı aralık), başlık öncesi 0. ÇELİŞKİ/UNKNOWN: 3 gövde paragrafında (Einstein, Aarpa çeşitleri, Arpa çeşitlerinin ilk yaprak…) ve KAYNAKLAR'ın çoğu girişinde doğrudan Calibri çalıştırma yazı tipi vardır; Normal stili Times New Roman'dır ve diğer paragraflar TNR: stil yazı tipi (TNR) uygulandı (Calibri örnek kopyalama izi olarak değerlendirildi, UNKNOWN). Widow/orphan denetimi Normal stilinde KAPALI (widowControl=0); motorda anahtarı yoktur (motor açığı, yalnız rapor).",
      "Başlıklar: 4 düzey; stiller Balk2-Balk5 (Balk4/5 öncesi 200 stilde, örneklerde doğrudan 0), hepsi TNR 12 kalın, sola yaslı, girintisiz, 1,5 satır; sayılar elle yazılmıştır ('1.', '2.1', '2.2.1', '2.3.1.1'; 'Dördüncü Dereceden Başlık' 4. düzeydir). 1. düzey örnekleri BÜYÜK HARF ('MATERYAL ve METOT': 've' küçük; INFERRED) ve yeni sayfada başlar (sayfa sonları); 2.-4. düzey örnek metni Baş Harfleri Büyüktür ama kural yoktur: yazarın yazdığı gibi (UNKNOWN). Heading 1 örneğinde Balk1/Balk2 stil karışıklığı (örn. '4. BULGULAR' Balk1) görsel farkı yok (sola yaslı tek satır).",
      "Şekil/Çizelge/Resim: bölüm numaralı ('Şekil 2.1', 'Çizelge 3.1', 'Resim 4.1'), etiket kalın metin normal, aralarında yalnız boşluk, 11 pt (sz=22), tek satır, iki yana yaslı, öncesi 0 sonrası 6 pt (120 tw); Çizelge başlığı üstte, Şekil ve Resim altta; yönerge: ikinci satır üst satıra hizalanır (asılı, motor 'label'; örneklerde 15-21 mm asılı değişir). Şekil/Çizelge/Resim sayfaya ortalanır ve kenar boşluklarına taşmaz (AÇIK). Çizelge: ortalı, üç yatay çizgi (üst, başlık altı, alt; 0,5 pt = sz 4; dikey çizgi yok), başlık kalın; hücre 12 pt (örneklerde 2 çizelge 12 pt, 2 çizelge 10/11 pt karışık: 12 pt, UNKNOWN); örnek satır yükseklikleri (7,0 mm 'exact') motorda yoktur. Çizelge altı açıklaması: AÇIK '10 punto ve 1 satır aralığı' (öncesi/sonrası 6 pt). Bölünen çizelge: 'Çizelge … (Devam)' örneği (şablon sayfası); biçim 'Çizelge 2.1 (Devam) …' (INFERRED). Şekil görseli ile başlık arası 6,2 mm (MEASURED).",
      "Dizinler: İÇİNDEKİLER DİZİNİ, SİMGELER ve KISALTMALAR DİZİNİ, ŞEKİLLER DİZİNİ, ÇİZELGELER DİZİNİ, RESİMLER DİZİNİ (başlıklar Balk1: kalın, ortalı); 'Sayfa' kalın sağda hemen altta. İçindekiler satırları 12 pt normal, 1,5 satır, 0 pt sonra, sağ sekme 149,8 mm (8494 tw) nokta kılavuzlu, girinti 0/5/10/15 mm; 'II. satır üst satıra hizalanmalı' (AÇIK). Şekiller/Çizelgeler/Resimler dizini: gömülü Word ekran görüntüsü 'Soldan, sol 0 sağ 0, asılı 1,6 cm, öncesi 0 nk, sonrası 6 nk, satır aralığı Tek' (AÇIK yönerge) — örnek satırlar ise 1,5 aralık/0 sonra, asılı 907-1191 tw (ÇELİŞKİ; yönerge uygulandı, tek satırlık girişte aralık farkı 0,9 pt; asılı girinti etiket genişliği 'label'). Simgeler dizini: 2 sütunlu tablo (tanım 40,7 mm), tek satır 12 pt; 'Kısaltmalar bölümü alfabetik sırada olmalıdır' (AÇIK).",
      "Kaynaklar: 'KAYNAKLAR' bir sonraki bölüm gibi numaralanır ('6. KAYNAKLAR'); girişler 12 pt, 1,5 satır, öncesi 6 pt (120 tw) sonrası 0, iki yana yaslı, 12,5 mm (709 tw) asılı girinti, kaynaklar arasında boş satır yok; biçim 'Soyad Ad, Yıl, Başlık, …' soyadına göre sıralı (örnekler); metin içi atıf (Soyad Yıl) / 'vd.' / 've' (örnekler). 'İnternet Kaynakları' kalın alt başlık ve '1-' numaralı liste: yazar işi (motorda ayrı grup yok). Denklem: yönerge 'denklem editörü, sayfaya ortalı, numaralar sağa yaslı' (AÇIK), numara '(4.1)' bölüm.sıra; öncesi/sonrası bir boş 1,5 satır.",
      "UNKNOWN / üretilmeyenler: ÖZET/ABSTRACT/etik/onay sayfaları (şablonda yok); dipnot: şablonda dipnot stili yok, DipnotMetni Normal'den türer (boyutsuz = 10 pt, tek satır): Times New Roman 10 pt tek satır (MEASURED stil zinciri); EKLER sayfa düzeni; ÖZGEÇMİŞ satır iskeleti (yazar içeriği); başlık harf büyüklüğü 2-4. düzey; çizelge satır yüksekliği; tek-çift sayfa bölüm sonu; yatay sayfa; Dış Kapak 'ANABİLİM DALI' satırı şablonda bu sözcükle yazılıdır (İç Kapak 'MATEMATİK BÖLÜMÜ'): COVER_DEPARTMENT yer tutucusu varsayılanı 'ANABİLİM DALI'dır, yazar değiştirebilir; çok satırlı tez başlığı aralığı örnekten (1,5 + tek) türetildi.",
    ],
  },
  page: {
    size: "A4", widthMm: 210, heightMm: 297, orientation: "portrait",
    margins: { topMm: 30, bottomMm: 30, leftMm: 30, rightMm: 30 },
    header: { heightMm: 0, distanceMm: 12.5, content: "", firstPage: "same" },
    footer: { heightMm: 8, distanceMm: 12.5, content: "", firstPage: "same" },
    numbering: { enabled: true, position: "bottom", align: "center", format: "arabic", startAt: 1, restart: false, style: { fontFamily: FONT, fontSizePt: 10 } },
  },
  typography: {
    body: { fontFamily: FONT, fontSizePt: 12, fontWeight: 400, align: "justify", lineHeight: 1.5, spaceBeforePt: 0, spaceAfterPt: BLANK_PT, firstLineIndentMm: 0 },
    paragraph: { firstLineIndentMm: 0, spaceBeforePt: 0, spaceAfterPt: BLANK_PT, lineHeight: 1.5, align: "justify" },
    headings: {
      "1": heading("{1}.", { textTransform: "uppercase", textTransformExceptions: EXCEPTIONS, pageBreakBefore: true }),
      "2": heading("{1}.{2}"),
      "3": heading("{1}.{2}.{3}"),
      "4": heading("{1}.{2}.{3}.{4}"),
    },
    // DipnotMetni is based on Normal, which (like docDefaults) carries no size: Word default 10 pt, single line (MEASURED style chain).
    footnotes: { placement: "pageBottom", numbering: "document", fontFamily: FONT, fontSizePt: 10, lineHeight: 1 },
    lineSpacing: { mode: "word", singleLineEm: SINGLE_LINE_EM, baseline: "word", paragraphSpacing: "additive", blockGap: "paragraphPitch", noteExitGap: "spacing" },
    // Table notes: "Çizelge altındaki açıklamalar 10 punto ve 1 satır aralığıyla yazılmalıdır" (EXPLICIT); 6 pt before = the sample note's w:before=120, 6 pt after = w:after=120.
    // lineSpacing.noteExitGap "spacing": note -> next block = 6 pt + the empty "(Bir boşluk)" line (official p13 note baseline 132.61 -> heading 146.70 mm = 14.09 mm).
    paragraphStyles: { tableNote: { fontSizePt: 10, lineHeight: 1, align: "justify", spaceBeforePt: 6, spaceAfterPt: 6, firstLineIndentMm: 0 } },
  },
  placeholders: {
    THESIS_TITLE: { label: "Tez başlığı", type: "text", required: true },
    STUDENT_NAME: { label: "Öğrencinin Adı SOYADI", type: "text", required: true },
    ADVISOR_TITLE: { label: "Danışman unvanı (Prof. Dr. / Doç. Dr. / Dr. Öğr. Üyesi)", type: "text", required: true },
    ADVISOR_NAME: { label: "Danışman Adı SOYADI", type: "text", required: true },
    SUBMISSION_MONTH: { label: "Tezin teslim edildiği ay (kapak)", type: "text", required: true },
    SUBMISSION_YEAR: { label: "Tezin teslim edildiği yıl (kapak)", type: "number", required: true },
    COVER_DEPARTMENT: { label: "Dış kapak bölüm/anabilim dalı satırı (şablon: ANABİLİM DALI)", type: "text" },
    YEAR: { label: "Yıl (Teşekkür)", type: "number", required: true },
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

export const akuMatematikLisans = { ...base, sections: sections() };
export default akuMatematikLisans;
