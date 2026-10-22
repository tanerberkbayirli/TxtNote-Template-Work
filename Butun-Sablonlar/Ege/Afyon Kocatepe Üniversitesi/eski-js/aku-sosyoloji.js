/**
 * Afyon Kocatepe Üniversitesi, Fen Edebiyat Fakültesi, Sosyoloji Bölümü, lisans bitirme tezi (Türkçe).
 *
 * Source (Butun-Sablonlar/Ege/Afyon Kocatepe Üniversitesi/Sosyoloji_Bolumu_Bitirme_Tezi/): the department's "Lisans Bitirme Tezi Yazım
 * Kılavuzu" DOCX (AKU_Sosyoloji_Lisans_Tez_Yazim_Kilavuzu_2022.docx; core.xml 2014-2015, re-uploaded 2022-04-05). The guide is itself a Word
 * file: its prose (§ "Tezin genel biçimi", "Atıf yapma") is EXPLICIT; its six example pages (Ek-1 dış kapak ... Ek-6 kısaltmalar dizini, Word
 * canvases with text boxes) are MEASURED from XML (paragraph/run properties, empty-paragraph structure) and from a Word render of the guide.
 * The guide's own sectPr (25 mm margins, 1.15 lines, 10 pt after) describes the guide document and is NOT used as a thesis rule.
 * Spec: engine/specs/aku-sosyoloji-lisans.json; report: orchestration/raporlar/aku-sosyoloji-lisans.md.
 *
 * Word line model (as the other AKÜ units, engine capability only): a single Times New Roman line is 1.15 em; paragraph spacing is additive.
 */
import { MM_PER_PT } from "../units.js";

const FONT = "Times New Roman";
const SINGLE_LINE_EM = 1.15;
const linePt = (sizePt, spacing) => sizePt * SINGLE_LINE_EM * spacing;
const spacerPt = (pt) => ({ type: "spacer", heightMm: pt * MM_PER_PT });
/** Empty paragraph of the guide's example pages: `sizePt` line at `spacing` lines plus the paragraph's space after (Word default "after=200" = 10 pt where unset). */
const emptyPara = (sizePt, spacing, afterPt) => spacerPt(linePt(sizePt, spacing) + afterPt);

/** Guide, "Tezin genel biçimi": 6 nk before and 6 nk after (EXPLICIT). */
const PARA_GAP_PT = 6;
/** Guide: "1,25 cm içeriden başlayan paragraf başı" (EXPLICIT). */
const PARA_INDENT_MM = 12.5;
/** Word Normal style of the guide's example pages: 1.15 lines and 10 pt after (docDefaults 276 / 200). */
const NORMAL_AFTER_PT = 10;

const bold = { fontWeight: 700 };
const upper = { textTransform: "uppercase" };
const roman = { numbering: { format: "roman-lower" } };
const pageLines = { firstLineIndentMm: 0, spaceBeforePt: 0, spaceAfterPt: 0, lineHeight: 1.5 };
const afterPt = (pt) => ({ spaceAfterPt: pt });

// ---- Ek-1. DIŞ KAPAK ÖRNEĞİ (canvas text box 1, pict 1): all lines centred bold, 1.5 lines; header lines 14 pt with 6 pt after, two empty 14 pt paragraphs,
// title 18 pt, then 12 pt blocks. Paragraphs without explicit "after" carry Word's 10 pt default (verified against the Word render: baseline pitches).
const outerCover = {
  id: "outer-cover", type: "outerCover", title: "DIŞ KAPAK", status: "required", group: "cover", mode: "static", tocEntry: "none",
  overrides: { page: { numbering: { enabled: false } }, body: { ...pageLines, align: "center", fontWeight: 700 } },
  blocks: [
    { type: "text", value: "AFYON KOCATEPE ÜNİVERSİTESİ", style: { fontSizePt: 14, ...afterPt(6) } },
    { type: "text", value: "FEN EDEBİYAT FAKÜLTESİ", style: { fontSizePt: 14, ...afterPt(6) } },
    { type: "text", value: "SOSYOLOJİ BÖLÜMÜ", style: { fontSizePt: 14, ...afterPt(6) } },
    { type: "text", value: "LİSANS BİTİRME TEZİ", style: { fontSizePt: 14, ...afterPt(6) } },
    emptyPara(14, 1.5, NORMAL_AFTER_PT), emptyPara(14, 1.5, NORMAL_AFTER_PT),
    { type: "metadata", field: "THESIS_TITLE", fallback: "TEZ BAŞLIĞI", style: { ...upper, fontSizePt: 18, ...afterPt(NORMAL_AFTER_PT) } },
    emptyPara(12, 1.5, NORMAL_AFTER_PT),
    { type: "text", value: "Hazırlayan", style: afterPt(6) },
    { type: "metadata", field: "STUDENT_NAME", fallback: "Ad SOYAD", style: afterPt(6) },
    emptyPara(12, 1.5, NORMAL_AFTER_PT),
    { type: "text", value: "Danışman", style: afterPt(6) },
    { type: "text", value: "{{ADVISOR_TITLE}} {{ADVISOR_NAME}}", style: afterPt(6) },
    emptyPara(12, 1.5, NORMAL_AFTER_PT), emptyPara(12, 1.5, NORMAL_AFTER_PT),
    { type: "text", value: "AFYONKARAHİSAR {{SUBMISSION_YEAR}}" },
  ],
};

// ---- Ek-2. İÇ KAPAK ÖRNEĞİ (pict 2): "T.C." + four 12 pt header lines (6 pt after), two empty 14 pt paragraphs, 14 pt title, student number line, Hazırlayan / Danışman blocks
// whose lines carry the 10 pt default after. (The example's header runs are set in the font name "Times"; the guide's rule is Times New Roman for all text, applied.)
const innerCover = {
  id: "inner-cover", type: "innerCover", title: "İÇ KAPAK", status: "required", group: "cover", mode: "static", tocEntry: "none",
  overrides: { page: { numbering: { enabled: false } }, body: { ...pageLines, align: "center", fontWeight: 700 } },
  blocks: [
    { type: "text", value: "T.C.", style: afterPt(6) },
    { type: "text", value: "AFYON KOCATEPE ÜNİVERSİTESİ", style: afterPt(6) },
    { type: "text", value: "FEN EDEBİYAT FAKÜLTESİ", style: afterPt(6) },
    { type: "text", value: "SOSYOLOJİ BÖLÜMÜ", style: afterPt(6) },
    { type: "text", value: "LİSANS BİTİRME TEZİ", style: afterPt(6) },
    emptyPara(14, 1.5, NORMAL_AFTER_PT), emptyPara(14, 1.5, NORMAL_AFTER_PT),
    { type: "metadata", field: "THESIS_TITLE", fallback: "TEZ BAŞLIĞI", style: { ...upper, fontSizePt: 14, ...afterPt(NORMAL_AFTER_PT) } },
    emptyPara(12, 1.5, NORMAL_AFTER_PT),
    { type: "text", value: "Hazırlayan", style: afterPt(NORMAL_AFTER_PT) },
    { type: "metadata", field: "STUDENT_NAME", fallback: "Ad SOYAD", style: afterPt(NORMAL_AFTER_PT) },
    { type: "metadata", field: "STUDENT_NUMBER", fallback: "Öğrenci No", style: afterPt(NORMAL_AFTER_PT) },
    emptyPara(12, 1.5, NORMAL_AFTER_PT),
    { type: "text", value: "Danışman", style: afterPt(NORMAL_AFTER_PT) },
    { type: "text", value: "{{ADVISOR_TITLE}} {{ADVISOR_NAME}}", style: afterPt(NORMAL_AFTER_PT) },
    emptyPara(12, 1.5, NORMAL_AFTER_PT),
    { type: "text", value: "AFYONKARAHİSAR {{SUBMISSION_YEAR}}" },
  ],
};

/**
 * Titles of the front matter (Ek-3/4/5): 12 pt bold centred, Word Normal style (1.15 lines). `afterGapPt` = the title's own 10 pt after plus the empty
 * Normal paragraph(s) the example puts between the title and the next line (measured: İÇİNDEKİLER 10 pt; TABLOLAR/ŞEKİLLER: title + empty line = 35.9 pt).
 */
const frontTitle = (afterGapPt, extra = {}) => ({ "1": { align: "center", textTransform: "none", lineHeight: 1.15, spaceBeforePt: 0, spaceAfterPt: afterGapPt, numbering: { enabled: false }, ...extra } });
const EMPTY_NORMAL_PT = linePt(12, 1.15) + NORMAL_AFTER_PT;

// Lists (Ek-4/Ek-5): "Sayfa" 11.5 pt regular line below the title, rows 11.5 pt BOLD (label, title, dots and page number), single, 0/0, dot leader.
const listRule = (kind, title) => ({
  kind, title, leader: "dots", leaderFlow: "inline", pageHeading: "Sayfa", indentMm: 0,
  pageHeadingStyle: { fontWeight: 400, fontSizePt: 11.5, lineHeight: 1, spaceBeforePt: 0, spaceAfterPt: 0, align: "right" },
  style: { fontSizePt: 11.5, fontWeight: 700, lineHeight: 1, spaceBeforePt: 0, spaceAfterPt: 0, align: "justify" },
});
const generatedList = (id, type, title, kind, count) => ({
  id, type, title, status: "required", group: "front", mode: "generated", tocEntry: "title", visibleWhen: { count, gte: 1 },
  generatedIndex: listRule(kind, title),
  overrides: { page: roman, headings: frontTitle(NORMAL_AFTER_PT + EMPTY_NORMAL_PT, { fontSizePt: 12, fontWeight: 700 }) },
});

/** GİRİŞ, SONUÇ VE ÖNERİLER, KAYNAKÇA, EKLER: capital titles as in the İçindekiler example; layout of the title itself is UNKNOWN (body paragraph spacing, centred bold = INFERRED). */
const mainTitle = { "1": { align: "center", textTransform: "none", lineHeight: 1.5, spaceBeforePt: 0, spaceAfterPt: PARA_GAP_PT, numbering: { enabled: false } } };

const sections = () => [
  outerCover,
  innerCover,
  // ÖNSÖZ (isteğe bağlı): format not defined by the guide; first page of the Roman-numbered front matter (i).
  { id: "preface", type: "preface", title: "ÖNSÖZ", status: "optional", group: "front", mode: "editable", showTitle: true, tocEntry: "title",
    overrides: { page: { numbering: { format: "roman-lower", startAt: 1, restart: true } }, headings: frontTitle(PARA_GAP_PT, { lineHeight: 1.5 }) } },
  // İÇİNDEKİLER (Ek-3): title bold centred; unnumbered rows bold; "BİRİNCİ BÖLÜM" + chapter title bold centred; ORTA/YAN BAŞLIK rows regular (4.3 mm steps), Alt Başlık bold.
  { id: "toc", type: "tableOfContents", title: "İÇİNDEKİLER", status: "required", group: "front", mode: "generated", tocEntry: "title",
    generatedIndex: { kind: "toc", title: "İÇİNDEKİLER", leader: "dots", leaderFlow: "inline", indentMm: 0, matchHeadingTransform: true,
      style: { lineHeight: 1, spaceBeforePt: 0, spaceAfterPt: 0, align: "left" },
      levelStyles: {
        "1": { fontWeight: 700, align: "center", includePageNumber: false, lineHeight: 1.15, spaceBeforePt: 0, spaceAfterPt: NORMAL_AFTER_PT },
        "2": { fontWeight: 400, leftIndentMm: 0 }, "3": { fontWeight: 400, leftIndentMm: 4.3 }, "4": { fontWeight: 700, leftIndentMm: 8.5 },
        unnumbered: { fontWeight: 700, align: "left", includePageNumber: true, lineHeight: 1.15, spaceBeforePt: 0, spaceAfterPt: NORMAL_AFTER_PT },
      } },
    overrides: { page: roman, headings: frontTitle(NORMAL_AFTER_PT) } },
  generatedList("list-tables", "listOfTables", "TABLOLAR DİZİNİ", "tables", "tables"),
  generatedList("list-figures", "listOfFigures", "ŞEKİLLER LİSTESİ", "figures", "figures"),
  // KISALTMALAR DİZİNİ (Ek-6): 11.5 pt bold title, one empty 1.5 line below, entries 11.5 pt regular, 1.5 lines, 0 pt after, justified, 15.9 mm (902 tw) first-line indent.
  { id: "symbols", type: "listOfAbbreviations", title: "KISALTMALAR DİZİNİ", status: "optional", group: "front", mode: "editable", showTitle: true, tocEntry: "title",
    overrides: { page: roman, headings: frontTitle(linePt(11.5, 1.5), { fontSizePt: 11.5, lineHeight: 1 }),
      paragraph: { fontSizePt: 11.5, lineHeight: 1.5, align: "justify", firstLineIndentMm: 15.9, spaceBeforePt: 0, spaceAfterPt: 0 } } },
  // GİRİŞ: Arabic page numbering restarts at 1 (guide: "ana ve arka bölümler 1'den başlayarak").
  { id: "introduction", type: "introduction", title: "GİRİŞ", status: "required", group: "body", mode: "editable", showTitle: true, tocEntry: "title",
    overrides: { page: { numbering: { format: "arabic", startAt: 1, restart: true } }, headings: mainTitle } },
  { id: "main", type: "mainContent", title: "Bölümler", status: "required", group: "body", mode: "editable" },
  { id: "conclusion", type: "conclusion", title: "SONUÇ VE ÖNERİLER", status: "required", group: "body", mode: "editable", showTitle: true, tocEntry: "title",
    overrides: { headings: mainTitle } },
  { id: "bibliography", type: "bibliography", title: "KAYNAKÇA", status: "required", group: "back", mode: "editable", showTitle: true, tocEntry: "title",
    overrides: { headings: mainTitle } },
  { id: "appendices", type: "appendices", title: "EKLER", status: "optional", group: "back", mode: "editable", showTitle: true, tocEntry: "title",
    overrides: { headings: mainTitle } },
];

// ---- typography ----------------------------------------------------------------------------------------

// Headings: the guide gives NO heading typography; only the İçindekiler example shows the hierarchy ("BİRİNCİ BÖLÜM" / title centred bold; "1. ORTA BAŞLIK" capitals;
// "1.1. YAN BAŞLIK" capitals; "2.1.1. Alt Başlık" Title Case bold; numbers restart in every chapter). The rows' weights are mirrored (INFERRED); sizes follow the
// general "12 punto" rule; spacing follows the paragraph rule (1.5 lines, 6/6 pt).
const headingBase = { fontFamily: FONT, fontSizePt: 12, lineHeight: 1.5, spaceBeforePt: PARA_GAP_PT, spaceAfterPt: PARA_GAP_PT, firstLineIndentMm: 0, keepWithNext: true };
const subHeading = (format, extra) => ({ ...headingBase, fontWeight: 400, align: "left", numbering: { enabled: true, format, sequence: "arabic" }, ...extra });
const chapterHeading = { ...headingBase, fontWeight: 700, align: "center", textTransform: "uppercase", numbering: { enabled: true, format: "{1} BÖLÜM", sequence: "ordinal-tr-upper", placement: "ownLine" } };
// Caption labels are INFERRED from list rows; the guide has no caption paragraphs to establish position or styling.
const caption = (label) => ({ label });

const base = {
  schemaVersion: 1,
  templateVersion: "1.0.0",
  id: "aku-sosyoloji-lisans-tr-v1",
  universityId: "aku",
  universityName: "Afyon Kocatepe Üniversitesi",
  instituteId: "fef-sosyoloji",
  instituteName: "Fen Edebiyat Fakültesi · Sosyoloji Bölümü",
  degreeType: "undergraduate",
  language: "tr",
  status: "official",
  displayName: "Afyon Kocatepe Üniversitesi · Fen Edebiyat Fakültesi · Sosyoloji Bölümü · Bitirme Tezi",
  source: {
    type: "official",
    documentName: "AKÜ Sosyoloji Bölümü Lisans Bitirme Tezi Yazım Kılavuzu — AKU_Sosyoloji_Lisans_Tez_Yazim_Kilavuzu_2022.docx",
    revisionDate: "2022-04 (dosya Last-Modified 2022-04-05; core.xml 2014-11 / 2015-06; kılavuz kapağı: AFYONKARAHİSAR-2014)",
    verifiedAt: "2026-10-02",
    notes: [
      "Kural önceliği (kullanıcı kararı): kılavuzun açık metni EXPLICIT; kılavuzun biçimlendirilmiş ek örnek sayfaları (Ek-1 ... Ek-6; Word tuvali metin kutuları) XML paragraf/çalıştırma özellikleri ve Word çıktısıyla MEASURED ve metinle çeliştiğinde örnek sayfa üstündür. Kılavuz belgesinin kendi sectPr/stilleri (25 mm kenar, 1,15 satır, 10 nk sonra) tezin kuralı değil kılavuzun kendi sayfa düzenidir ve kullanılmadı. Örnek sayfa çerçeveleri (450 pt x 9 inç tuval) sayfa geometrisi olarak kullanılmadı; yalnız yazı boyutu, hizalama, satır aralığı ve boş paragraf yapısı alındı.",
      "EXPLICIT (metin): Times New Roman, 12 punto, 1,5 satır, 1,25 cm paragraf başı girintisi, paragraflar arası önce 6 nk + sonra 6 nk (Word toplamlı), iki yana yaslı; kenar boşlukları üst 4,5 / alt 4,5 / sol 4,5 / sağ 3 cm; tablo ve içindeki yazı için daha küçük punto/satır aralığı serbest; 3 satırı veya 40 kelimeyi aşan doğrudan alıntı 11 punto, tek satır, sağdan ve soldan 1 cm daraltılmış; içindekiler ve listeler yazılıma hazırlatılır; en az 60 sayfa, en az 40 kaynak; sayfa numaraları altta ortada, yanında başka işaret yok; Giriş'e kadar ön bölüm küçük Romen (i, ii, iii), ana ve arka bölüm 1'den Arapça; atıf metin içinde (Soyad, yıl: sayfa), kaynakça arka bölümde yazar soyadına göre alfabetik, yalnız yararlanılan eserler.",
      "Bölüm sırası (metin): Dış Kapak, İç Kapak, [Ön Bölüm: Önsöz (isteğe bağlı), İçindekiler, Tablolar Listesi, Şekiller Listesi, Simgeler ve Kısaltmalar], [Ana Bölüm: Giriş, Tez Metni, Sonuç ve Öneriler], [Arka Bölüm: Kaynakça, Ekler]. Dış/İç Kapak listede Ön Bölümden ayrı bir liste grubundadır (numbering.xml): numarasız sayılır (INFERRED); Önsöz = i. Onay, bildirim, özet/abstract, teşekkür, özgeçmiş sayfaları kaynakta tanımlı DEĞİL: üretilmedi.",
      "Dış Kapak (Ek-1): 14 pt koyu ortalı dört satır (6 nk sonra), iki boş 14 pt paragraf, 18 pt koyu başlık, Hazırlayan/Danışman blokları, AFYONKARAHİSAR yıl; tüm paragraflar 1,5 satır, açık 'sonra' yazılmamış paragraflarda Word varsayılanı 10 nk (Word çıktısında taban çizgisi aralıklarıyla doğrulandı). İç Kapak (Ek-2): 'T.C.' + dört 12 pt satır, iki boş 14 pt paragraf, 14 pt başlık, öğrenci numarası. Örneklerin başlık satırları 'Times' yazı tipi adıyla yazılmıştır; kılavuz metni tüm metin için Times New Roman der: Times New Roman uygulandı (ÇELİŞKİ kaydı).",
      "Başlıklar: kılavuz metni başlık biçimi tanımlamaz. Yalnız Ek-3 örneği düzeyleri gösterir: 'BİRİNCİ BÖLÜM' + bölüm adı ortalı koyu; '1. ORTA BAŞLIK' ve '1.1. YAN BAŞLIK' büyük harf, normal ağırlık; '2.1.1. Alt Başlık' Baş Harfleri Büyük koyu; numaralar her bölümde yeniden başlar. İçindekiler satırı ağırlıkları başlığa yansıtıldı (INFERRED). Başlık aralığı UNKNOWN: genel paragraf kuralı (1,5 satır, 6/6 nk) uygulandı. Bölümlerin yeni sayfada başlaması UNKNOWN (zorlanmadı). Ek-3'te 3. düzey '3.1 YANBAŞLIK1' sonu noktasız yazılmıştır, diğerleri noktalıdır: noktalı (çoğunluk).",
      "CONFLICT (table-list title): prose paragraph 45 and the Ek-3 TOC row say 'TABLOLAR LİSTESİ'; the dedicated actual list-page example Ek-4 is headed 'TABLOLAR DİZİNİ'. Applied 'TABLOLAR DİZİNİ' because the dedicated example is more specific to the generated page than its TOC label and prose section name; the counter-evidence remains explicit.",
      "Listeler (Ek-4/Ek-5): başlık 12 pt koyu ortalı; 'Sayfa' 11,5 pt normal tek satır (Ek-4'te ortalı, Ek-5'te sağa yaslı: ÇELİŞKİ, sağa yaslı seçildi); satırlar 11,5 pt KOYU (etiket, başlık, noktalar, sayfa), tek satır, 0 nk, iki yana yaslı, noktalı kılavuz. Örnek sayfalardaki 11,5 pt metindeki '12 punto' kuralına aykırıdır (ÇELİŞKİ; kullanıcı kararı gereği örnek sayfa). Başlık ile 'Sayfa' arasında bir boş Normal paragraf (Ek-4 ölçümü 51,7 pt). Ek-6: başlık 11,5 pt koyu, satırlar 11,5 pt normal 1,5 satır, 15,9 mm (902 tw) ilk satır girintisi; örnekte 'Bkz' ve 'SBE' satırları elle kaydırılmıştır (kural değil, atlandı). Örnek sayfaların başındaki boş paragraf sayısı (Ek-4: 1, Ek-5: 2, Ek-6: 2) kendi içinde tutarsız ve sayfa konumu çizimin parçası: üretilmedi (UNKNOWN).",
      "İçindekiler (Ek-3): başlık 12 pt koyu ortalı, satırlar 12 pt; ÖNSÖZ/GİRİŞ/liste/SONUÇ/KAYNAKÇA/EKLER satırları koyu; bölüm satırları ('BİRİNCİ BÖLÜM', bölüm adı) koyu ortalı sayfa numarasız; ORTA/YAN BAŞLIK normal, Alt Başlık koyu; örnekte alt düzeyler 4,3 mm basamakla boşlukla kaydırılmıştır (ölçüm). Örnek sayfa satır aralığı (koyu üst satırlar 1,15 satır + 10 nk, numaralı satırlar tek satır 0 nk) uygulandı. Örnekteki sayfa numaraları hatalıdır (şekiller 'vi', kısaltmalar 'v'): kural değil, görsel örnek.",
      "UNKNOWN (missing evidence): page-number font/size (12 pt INFERRED from general text-size rule) and bottom distance; thesis header/footer geometry; footnote style; preface layout; caption position, typography, alignment and style (Ek-4/Ek-5 show list rows only); table rules; equations; block-quote first-line indent and spacing; bibliography-specific indent/spacing beyond the general paragraph rule; appendices; abstract (absent). Caption labels and document-wide Arabic number pattern are INFERRED from the official index rows 'Tablo 1.' / 'Şekil 1.'; no caption paragraphs were found. General paragraph rule applies to reference entries only as an INFERRED fallback. The guide's page/source-count and writing-format examples are not document rules.",
      "Kılavuz belgesinin kendi paragrafları (1,15 satır, ilk satır 1,0 cm, 10 nk sonra, iki yana yaslı) kendi metin kuralına (1,5 satır, 1,25 cm, 6/6 nk) uymaz: ÇELİŞKİ kaydı; metin kuralı uygulandı (örnek sayfa değil, kılavuz belgesinin kendi gövdesi).",
    ],
  },
  page: {
    size: "A4", widthMm: 210, heightMm: 297, orientation: "portrait",
    margins: { topMm: 45, bottomMm: 45, leftMm: 45, rightMm: 30 },
    // The guide's own section settings describe the guide, not the thesis. Thesis header/footer geometry is unknown.
    header: {},
    footer: {},
    numbering: { enabled: true, position: "bottom", align: "center", format: "arabic", startAt: 1, restart: false, style: { fontFamily: FONT, fontSizePt: 12 } },
  },
  typography: {
    body: { fontFamily: FONT, fontSizePt: 12, fontWeight: 400, align: "justify", lineHeight: 1.5, spaceBeforePt: PARA_GAP_PT, spaceAfterPt: PARA_GAP_PT, firstLineIndentMm: PARA_INDENT_MM },
    paragraph: { firstLineIndentMm: PARA_INDENT_MM, spaceBeforePt: PARA_GAP_PT, spaceAfterPt: PARA_GAP_PT, lineHeight: 1.5, align: "justify" },
    headings: {
      "1": chapterHeading,
      "2": subHeading("{2}.", { textTransform: "uppercase" }),
      "3": subHeading("{2}.{3}.", { textTransform: "uppercase" }),
      "4": subHeading("{2}.{3}.{4}.", { fontWeight: 700, textTransform: "capitalize" }),
    },
    footnotes: { placement: "pageBottom", numbering: "document", fontFamily: FONT, fontSizePt: 12 },
    lineSpacing: { mode: "word", singleLineEm: SINGLE_LINE_EM, baseline: "word", paragraphSpacing: "additive" },
    // Doğrudan alıntı (3 satır / 40 kelimeyi aşan): 11 pt, tek satır, sağdan ve soldan 1 cm daraltılmış (EXPLICIT).
    paragraphStyles: { blockQuote: { fontSizePt: 11, lineHeight: 1, leftIndentMm: 10, rightIndentMm: 10 } },
  },
  placeholders: {
    THESIS_TITLE: { label: "Bitirme tezi başlığı", type: "text", required: true },
    STUDENT_NAME: { label: "Öğrencinin Adı SOYADI", type: "text", required: true },
    STUDENT_NUMBER: { label: "Öğrenci numarası (iç kapak)", type: "text" },
    ADVISOR_TITLE: { label: "Danışman unvanı (Prof. Dr. / Doç. Dr. / Dr. Öğr. Üyesi)", type: "text", required: true },
    ADVISOR_NAME: { label: "Danışman Adı SOYADI", type: "text", required: true },
    SUBMISSION_YEAR: { label: "Tezin teslim yılı (kapak)", type: "number", required: true },
  },
  tables: caption("Tablo"),
  figures: caption("Şekil"),
  // The heading and alphabetical author-year reference structure are explicit; bibliography-specific typography is unknown.
  bibliography: { heading: "KAYNAKÇA", citationStyle: "author-year" },
  toc: { heading: "İÇİNDEKİLER", levels: [1, 2, 3, 4], showPageNumbers: true },
};

export const akuSosyolojiLisans = { ...base, sections: sections() };
export default akuSosyolojiLisans;
