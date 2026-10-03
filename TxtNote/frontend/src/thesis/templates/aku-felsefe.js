/**
 * Afyon Kocatepe Üniversitesi, Fen Edebiyat Fakültesi, Felsefe Bölümü: lisans bitirme tezi (aku-felsefe-lisans-tr-v1) and lisans seminer
 * (aku-felsefe-seminer-tr-v1), both Turkish.
 *
 * Sources (Butun-Sablonlar/Ege/Afyon Kocatepe Üniversitesi/Felsefe_Bolumu_Tez_ve_Seminer/), two DOCX guides of 2019 (Akademik Kurul karar 01.08.2019/5):
 *   - AKU_Felsefe_Lisans_Bitirme_Tezi_Yazim_Kilavuzu_2019.docx  -> lisans (includes labeled VML cover and TOC examples)
 *   - AKU_Felsefe_Seminer_Hazirlama_Kilavuzu_2019.docx          -> seminer (own, independently stated values)
 * Both contain prose plus labeled VML examples (thesis cover/TOC at paras 130-131; seminar cover at para 124). The guide documents' own
 * sectPr/styles outside those labeled examples describe the GUIDE and are not thesis rules. The reviewed specs are orchestration/specs/aku-felsefe-*.json,
 * the reports orchestration/reports/aku-felsefe-*.md.
 *
 * Defined by the guides (EXPLICIT): Times New Roman 12 pt, 1.5 lines, 1.25 cm first-line indent, 6 nk before and 6 nk after paragraphs,
 * justified, margins (lisans top 3 / bottom 3 / left 3.5 / right 2 cm; seminer top 3 / bottom 3 / left 3 / right 2 cm), block quotes
 * (> 3 lines or 40 words: 11 pt, 1 line, 1 cm narrower on both sides), automatic contents/lists, page numbers bottom centre without any other
 * sign, APA in-text author-year citations and an alphabetical reference list. NOT defined (UNKNOWN, nothing is generated or invented):
 * exact generated-cover page geometry is UNKNOWN despite centered example content; heading typography and numbering, caption
 * wording/position, page-number font size, footnote typography, reference-list indents, appendix layout remain UNKNOWN unless separately specified.
 */
const FONT = "Times New Roman";
const SINGLE_LINE_EM = 1.15;

const listSection = (id, type, title, kind) => ({
  id, type, title, status: "optional", group: "front", mode: "generated", tocEntry: "title",
  generatedIndex: { kind, title, leader: "dots", leaderFlow: "inline", indentMm: 0 },
});

const tocSection = (status) => ({
  id: "toc", type: "tableOfContents", title: "İÇİNDEKİLER", status, group: "front", mode: "generated", tocEntry: "title",
  generatedIndex: { kind: "toc", title: "İÇİNDEKİLER", leader: "dots", leaderFlow: "inline", indentMm: 5 },
});

const placeholders = {
  THESIS_TITLE: { label: "Başlık", type: "text", required: true },
  STUDENT_NAME: { label: "Öğrencinin Adı SOYADI", type: "text", required: true },
};

const build = ({ id, instituteId, instituteName, displayName, documentName, revisionDate, notes, leftMm, sections, tocLevels = [1, 2, 3] }) => ({
  schemaVersion: 1,
  templateVersion: "1.0.0",
  id,
  universityId: "aku",
  universityName: "Afyon Kocatepe Üniversitesi",
  instituteId,
  instituteName,
  degreeType: "undergraduate",
  language: "tr",
  status: "official",
  displayName,
  source: { type: "official", documentName, revisionDate, verifiedAt: "2026-10-02", notes },
  page: {
    size: "A4", widthMm: 210, heightMm: 297, orientation: "portrait",
    margins: { topMm: 30, bottomMm: 30, leftMm, rightMm: 20 },
    // Header/footer geometry has not been extracted from the guides; empty objects use generic engine defaults.
    header: {},
    footer: {},
    // Guide: "alt ve orta", plain Arabic numbers 1, 2, 3 ... with no other sign; the size is not stated.
    numbering: { enabled: true, position: "bottom", align: "center", format: "arabic", startAt: 1, restart: false },
  },
  typography: {
    body: { fontFamily: FONT, fontSizePt: 12, fontWeight: 400, align: "justify", lineHeight: 1.5, spaceBeforePt: 6, spaceAfterPt: 6, firstLineIndentMm: 12.5 },
    paragraph: { firstLineIndentMm: 12.5, spaceBeforePt: 6, spaceAfterPt: 6, lineHeight: 1.5, align: "justify" },
    // Source does not define heading styles. Preserve generic engine fallback (body font/size, bold, unnumbered), including H4 for the demonstrated TOC depth.
    headings: Object.fromEntries([1, 2, 3, 4].map((level) => [level, { fontFamily: FONT, fontSizePt: 12, fontWeight: 700 }])),
    // Each paragraph carries the source's direct 6pt before + 6pt after. Do not compensate one field to imitate a 12pt visual gap.
    lineSpacing: { mode: "word", singleLineEm: SINGLE_LINE_EM, baseline: "word", paragraphSpacing: "collapse" },
    // "Üç satırı ya da 40 kelimeyi aşan doğrudan alıntılar, 11 punto ve 1 satır aralığı ile sağdan ve soldan 1 cm daraltılmış paragraf".
    paragraphStyles: { blockQuote: { fontSizePt: 11, lineHeight: 1, leftIndentMm: 10, rightIndentMm: 10 } },
  },
  sections,
  placeholders,
  // Caption formatting is UNKNOWN. APA author-year citation structure is explicit; bibliography typography is not.
  bibliography: { heading: "KAYNAKÇA", citationStyle: "author-year" },
  // The thesis example shows at least four levels; it does not establish a maximum depth.
  toc: { heading: "İÇİNDEKİLER", levels: tocLevels, showPageNumbers: true },
});

const lisansSections = [
  // Guide order: Dış Kapak, İç Kapak (layouts UNKNOWN, not generated), Önsöz, İçindekiler, Simgeler veya Kısaltmalar, Giriş, Birinci Bölüm, İkinci Bölüm,
  // Sonuç, Kaynakça; gerekliyse Ekler, Tablolar Listesi, Şekiller Listesi.
  { id: "preface", type: "preface", title: "ÖNSÖZ", status: "required", group: "front", mode: "editable", showTitle: true, tocEntry: "title" },
  tocSection("required"),
  { id: "symbols", type: "listOfAbbreviations", title: "SİMGELER VEYA KISALTMALAR", status: "required", group: "front", mode: "editable", showTitle: true, tocEntry: "title" },
  { id: "introduction", type: "introduction", title: "GİRİŞ", status: "required", group: "body", mode: "editable", showTitle: true },
  { id: "main", type: "mainContent", title: "Bölümler", status: "required", group: "body", mode: "editable" },
  { id: "conclusion", type: "conclusion", title: "SONUÇ", status: "required", group: "body", mode: "editable", showTitle: true },
  { id: "bibliography", type: "bibliography", title: "KAYNAKÇA", status: "required", group: "back", mode: "editable", showTitle: true, tocEntry: "title" },
  { id: "appendices", type: "appendices", title: "EKLER", status: "optional", group: "back", mode: "editable", showTitle: true, tocEntry: "title" },
  listSection("list-tables", "listOfTables", "TABLOLAR LİSTESİ", "tables"),
  listSection("list-figures", "listOfFigures", "ŞEKİLLER LİSTESİ", "figures"),
];

const seminerSections = [
  // Seminer guide: Kapak (layout UNKNOWN, not generated), Giriş-Gelişme-Sonuç, Kaynakça; İçindekiler only if the advisor asks; gerekliyse Ekler, Tablolar Listesi, Şekiller Listesi.
  tocSection("optional"),
  { id: "introduction", type: "introduction", title: "GİRİŞ", status: "required", group: "body", mode: "editable", showTitle: true },
  { id: "main", type: "mainContent", title: "GELİŞME", status: "required", group: "body", mode: "editable" },
  { id: "conclusion", type: "conclusion", title: "SONUÇ", status: "required", group: "body", mode: "editable", showTitle: true },
  { id: "bibliography", type: "bibliography", title: "KAYNAKÇA", status: "required", group: "back", mode: "editable", showTitle: true, tocEntry: "title" },
  { id: "appendices", type: "appendices", title: "EKLER", status: "optional", group: "back", mode: "editable", showTitle: true, tocEntry: "title" },
  listSection("list-tables", "listOfTables", "TABLOLAR LİSTESİ", "tables"),
  listSection("list-figures", "listOfFigures", "ŞEKİLLER LİSTESİ", "figures"),
];

export const akuFelsefeLisans = build({
  id: "aku-felsefe-lisans-tr-v1",
  instituteId: "fef-felsefe",
  instituteName: "Fen Edebiyat Fakültesi · Felsefe Bölümü",
  displayName: "Afyon Kocatepe Üniversitesi · Fen Edebiyat Fakültesi · Felsefe Bölümü · Lisans Bitirme Tezi",
  documentName: "AKÜ Felsefe Bölümü Lisans Bitirme Tezi (Projesi) Yazım Kılavuzu 2019 — AKU_Felsefe_Lisans_Bitirme_Tezi_Yazim_Kilavuzu_2019.docx",
  revisionDate: "2019 (Akademik Kurul 01.08.2019 / 5; core.xml 2019-09-22)",
  leftMm: 35,
  sections: lisansSections,
  tocLevels: [1, 2, 3, 4],
  notes: [
    "Kaynak yalnız düz yazılı bir DOCX kılavuzudur (şablon veya örnek tez sayfası yok). Kılavuzun kendi sectPr'ı (üst/alt/sol 30, sağ 25 mm), stilleri ve kapağı kılavuz belgesini tanımlar, tez kuralı sayılmadı; kenar boşlukları kılavuz metninden alındı: üst 3, alt 3, sol 3,5, sağ 2 cm (EXPLICIT). Kılavuzun sectPr'ı ile metin çelişir (sol 30 ve sağ 25 mm'ye karşı 35 ve 20 mm): metin izlendi.",
    "Gövde (EXPLICIT): Times New Roman, 12 punto, 1,5 satır aralığı, 1,25 cm paragraf başı girintisi, her paragrafta önce 6 nk ve sonra 6 nk, iki yana hizalı. Export bunu doğrudan 6/6 nk yazar; ardışık paragraf görsel birleşimi hedef alınmaz.",
    "Doğrudan alıntı (EXPLICIT): üç satırı veya 40 kelimeyi aşarsa 11 punto, 1 satır aralığı, sağdan ve soldan 1 cm daraltılmış paragraf (blockQuote paragraf biçimi). İlk satır girintisi ve alıntı öncesi/sonrası aralık belirtilmemiştir (UNKNOWN; gövde değerleri miras).",
    "Sayfa numarası (EXPLICIT): önsözden itibaren 1'den başlayarak Arapça rakam, tüm bölümlerde altta ortada, yanında başka işaret yok. Kapaklar şablonda üretilmediğinden numara ilk üretilen sayfadan (Önsöz) başlar. Numara yazı boyutu UNKNOWN (motor varsayılanı).",
    "Bölümler sırası (EXPLICIT): Dış Kapak, İç Kapak, Önsöz, İçindekiler, Simgeler veya Kısaltmalar, Giriş, Birinci Bölüm, İkinci Bölüm, Sonuç, Kaynakça; gerekliyse Ekler, Tablolar Listesi, Şekiller Listesi. Tez iki veya üç bölümden oluşur. İçindekiler ve listeler yazılımla otomatik hazırlanır (EXPLICIT). Simgeler/Kısaltmalar sequence entry is not marked optional; author supplies its content and empty-list behavior remains UNKNOWN.",
    "Kapak örneği (MEASURED from labeled guide VML example, para 130): centered rows and field order are shown; institutional rows/purpose line use bold Times 14 pt and the sample work title bold Times 18 pt. Author/advisor/city-year font sizes are not specified by run properties. Example's VML page position/border cannot be treated as output geometry because it is anchored to guide characters/lines. Cover pages are required by paras 40-43, but exact generated-page geometry and whether to print a border remain UNKNOWN.",
    "İçindekiler hierarchy (MEASURED from labeled example, para 131): at least four levels are shown (chapter title, 1., 1.1, 2.1.1); no maximum depth or consistent cross-chapter numbering progression is established. Entry typography beyond displayed sample remains UNKNOWN.",
    "Atıf ve kaynakça (EXPLICIT): metin içinde APA alıntı sistemi, yazar-yıl: (Turhan, 2003: 40-51); kaynakça tezin sonunda KAYNAKÇA başlığı altında yazar soyadına göre alfabetik, yalnız tezde yararlanılanlar; açıklama için dipnot kullanılabilir. Kılavuzun kaynak örnekleri 'SOYAD, Ad. (Yıl), Başlık ...' biçimindedir; liste girintisi ve punto değerleri kılavuzda kural olarak verilmemiştir (UNKNOWN).",
    "UNKNOWN (üretilmez/uydurulmaz): Kapakların generated page-axis placement, border requirement, author/advisor/city-year font sizes; source-defined heading typography/numbering (levels 1–4 use generic engine fallback of inherited body font/size, bold, unnumbered, not a source requirement); table/figure caption format and position; footnote style; page-number size; appendix layout; abstract (not in guide). Decimal numbering (1. / 1.1 / 1.1.1) is not a source requirement and is not imposed by this template.",
    "Teslim/fiziksel kurallar (A4 çıktı, A5 fotokopi ve cilt, danışman ve bölüm nüshası, değerlendirme puanları) belge biçimi değildir ve uygulanmadı.",
  ],
});

export const akuFelsefeSeminer = build({
  id: "aku-felsefe-seminer-tr-v1",
  instituteId: "fef-felsefe-seminer",
  instituteName: "Fen Edebiyat Fakültesi · Felsefe Bölümü · Seminer",
  displayName: "Afyon Kocatepe Üniversitesi · Fen Edebiyat Fakültesi · Felsefe Bölümü · Seminer (Seminer I ve II)",
  documentName: "AKÜ Felsefe Bölümü Seminer I ve Seminer II Yazım Kılavuzu 2019 — AKU_Felsefe_Seminer_Hazirlama_Kilavuzu_2019.docx",
  revisionDate: "2019 (Akademik Kurul 01.08.2019 / 5; Last-Modified 23 Eylül 2019)",
  leftMm: 30,
  sections: seminerSections,
  tocLevels: [1, 2, 3],
  notes: [
    "Kaynak yalnız düz yazılı bir DOCX kılavuzudur (seminer; tez değildir). Kılavuzun kendi sectPr'ı, stilleri ve kapağı kılavuz belgesini tanımlar, seminer kuralı sayılmadı. Kenar boşlukları kılavuz metninden: üst 3, alt 3, sol 3, sağ 2 cm (EXPLICIT; lisans kılavuzunda sol 3,5 cm'dir, bu kılavuz bağımsız olarak sol 3 cm yazar). Kılavuzun sectPr'ı (sol 30, sağ 25 mm) ile metin sağ kenarda çelişir: metin izlendi.",
    "Gövde (EXPLICIT, bu kılavuzda ayrıca yazılı): Times New Roman, 12 punto, 1,5 satır, 1,25 cm paragraf başı, her paragrafta önce 6 nk ve sonra 6 nk, iki yana hizalı. Export bunu doğrudan 6/6 nk yazar. Doğrudan alıntı: üç satır veya 40 kelimeyi aşarsa 11 punto, 1 satır, sağdan ve soldan 1 cm daraltılmış.",
    "Yapı (EXPLICIT): her seminer bir makale olarak hazırlanır; Giriş-Gelişme-Sonuç sırası; Kapak ve Kaynakça eklenir; 10 sayfadan az olmaz (sayfa sayısı denetlenmez); danışman isterse İçindekiler eklenir (isteğe bağlı bölüm); gerekliyse Ekler, Tablolar Listesi, Şekiller Listesi. Ana içerik bölümü 'GELİŞME' olarak adlandırıldı.",
    "Kapak örneği (MEASURED from labeled guide VML example, para 124): centered rows and field order are shown; institutional rows/purpose line use bold Times 14 pt and sample seminar work title bold Times 18 pt. Author/advisor/city-year font sizes are not specified by run properties. VML placement/border is not output geometry because it is guide-character/line anchored; cover prose requirement is explicit at paras 43-50, while generated cover geometry/border remain UNKNOWN.",
    "Sayfa numarası (EXPLICIT; metin lisans kılavuzuyla aynı): 'önsözden itibaren' 1'den, altta ortada, başka işaret yok. Seminerde Önsöz tanımlı değildir; kapak üretilmediğinden numara ilk üretilen sayfadan başlar (INFERRED). Numara boyutu UNKNOWN.",
    "Atıf/kaynakça (EXPLICIT): APA alıntı sistemi (yazar-yıl), kaynakçada yazar soyadına göre alfabetik KAYNAKÇA; dipnot açıklama için. Liste girintisi/punto UNKNOWN.",
    "UNKNOWN (üretilmez): Kapakların generated page-axis placement/border, author/advisor/city-year sizes, heading typography/numbering, table/figure caption format/position, footnote style, page-number size, appendix layout. Levels 1–3 use generic engine fallback (body font/size, bold, unnumbered); source gives no seminar TOC depth and this configuration does not assert a source-required hierarchy. Sunum ve değerlendirme puanları belge biçimi değildir.",
  ],
});

export default akuFelsefeLisans;
