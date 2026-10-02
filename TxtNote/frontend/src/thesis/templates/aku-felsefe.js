/**
 * Afyon Kocatepe Üniversitesi, Fen Edebiyat Fakültesi, Felsefe Bölümü: lisans bitirme tezi (aku-felsefe-lisans-tr-v1) and lisans seminer
 * (aku-felsefe-seminer-tr-v1), both Turkish.
 *
 * Sources (Butun-Sablonlar/Ege/Afyon Kocatepe Üniversitesi/Felsefe_Bolumu_Tez_ve_Seminer/), two DOCX guides of 2019 (Akademik Kurul karar 01.08.2019/5):
 *   - AKU_Felsefe_Lisans_Bitirme_Tezi_Yazim_Kilavuzu_2019.docx  -> lisans (this guide's text is the only evidence)
 *   - AKU_Felsefe_Seminer_Hazirlama_Kilavuzu_2019.docx          -> seminer (own, independently stated values)
 * Both are prose-only guides: no official thesis template, no thesis example pages. The guide documents' own pages (their cover, sectPr
 * 30/30/30/25 mm, styles) describe the GUIDE and are not thesis rules. The reviewed specs are orchestration/specs/aku-felsefe-*.json,
 * the reports orchestration/reports/aku-felsefe-*.md.
 *
 * Defined by the guides (EXPLICIT): Times New Roman 12 pt, 1.5 lines, 1.25 cm first-line indent, 6 nk before and 6 nk after paragraphs,
 * justified, margins (lisans top 3 / bottom 3 / left 3.5 / right 2 cm; seminer top 3 / bottom 3 / left 3 / right 2 cm), block quotes
 * (> 3 lines or 40 words: 11 pt, 1 line, 1 cm narrower on both sides), automatic contents/lists, page numbers bottom centre without any other
 * sign, APA in-text author-year citations and an alphabetical reference list. NOT defined (UNKNOWN, nothing is generated or invented):
 * the layout of the outer/inner cover, heading typography and numbering, caption wording/position, page-number font size, footnote typography,
 * reference-list indents, appendix layout.
 */
const FONT = "Times New Roman";
const SINGLE_LINE_EM = 1.15;

/** Heading typography is UNKNOWN in both guides: only the body font/size (guide "metin": 12 pt) is inherited; no weight, case or spacing is invented. Decimal numbering (1. / 1.1 / 1.1.1) is NOT a source rule: the shared engine test requires numbered headings, so a plain engine default is used (UNKNOWN). */
const heading = (format) => ({ fontFamily: FONT, fontSizePt: 12, align: "left", firstLineIndentMm: 0, keepWithNext: true, numbering: { enabled: true, format, sequence: "arabic" } });

const captionStyle = { fontFamily: FONT, fontSizePt: 12 };

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

const build = ({ id, instituteId, instituteName, displayName, documentName, revisionDate, notes, leftMm, sections }) => ({
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
    header: { heightMm: 0, distanceMm: 12.5, content: "", firstPage: "same" },
    footer: { heightMm: 8, distanceMm: 12.5, content: "", firstPage: "same" },
    // Guide: "alt ve orta", plain Arabic numbers 1, 2, 3 ... with no other sign; the size is not stated.
    numbering: { enabled: true, position: "bottom", align: "center", format: "arabic", startAt: 1, restart: false },
  },
  typography: {
    body: { fontFamily: FONT, fontSizePt: 12, fontWeight: 400, align: "justify", lineHeight: 1.5, spaceBeforePt: 6, spaceAfterPt: 6, firstLineIndentMm: 12.5 },
    paragraph: { firstLineIndentMm: 12.5, spaceBeforePt: 6, spaceAfterPt: 6, lineHeight: 1.5, align: "justify" },
    headings: { "1": heading("{1}."), "2": heading("{1}.{2}"), "3": heading("{1}.{2}.{3}"), "4": heading("{1}.{2}.{3}.{4}") },
    lineSpacing: { mode: "word", singleLineEm: SINGLE_LINE_EM, baseline: "word", paragraphSpacing: "additive" },
    // "Üç satırı ya da 40 kelimeyi aşan doğrudan alıntılar, 11 punto ve 1 satır aralığı ile sağdan ve soldan 1 cm daraltılmış paragraf".
    paragraphStyles: { blockQuote: { fontSizePt: 11, lineHeight: 1, leftIndentMm: 10, rightIndentMm: 10 } },
  },
  sections,
  placeholders,
  // Caption and reference-list typography/position/numbering are UNKNOWN in the guides: the engine-required fields only inherit the body font/size and use plain document-wide Arabic numbers.
  tables: { label: "Tablo", position: "above", style: captionStyle, numbering: { scope: "document", format: "{n}", sequence: "arabic" } },
  figures: { label: "Şekil", position: "below", style: captionStyle, numbering: { scope: "document", format: "{n}", sequence: "arabic" } },
  bibliography: { heading: "KAYNAKÇA", style: { fontFamily: FONT, fontSizePt: 12 }, citationStyle: "author-year" },
  toc: { heading: "İÇİNDEKİLER", levels: [1, 2, 3, 4], showPageNumbers: true },
});

const lisansSections = [
  // Guide order: Dış Kapak, İç Kapak (layouts UNKNOWN, not generated), Önsöz, İçindekiler, Simgeler veya Kısaltmalar, Giriş, Birinci Bölüm, İkinci Bölüm,
  // Sonuç, Kaynakça; gerekliyse Ekler, Tablolar Listesi, Şekiller Listesi.
  { id: "preface", type: "preface", title: "ÖNSÖZ", status: "required", group: "front", mode: "editable", showTitle: true, tocEntry: "title" },
  tocSection("required"),
  { id: "symbols", type: "listOfAbbreviations", title: "SİMGELER VEYA KISALTMALAR", status: "optional", group: "front", mode: "editable", showTitle: true, tocEntry: "title" },
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
  notes: [
    "Kaynak yalnız düz yazılı bir DOCX kılavuzudur (şablon veya örnek tez sayfası yok). Kılavuzun kendi sectPr'ı (üst/alt/sol 30, sağ 25 mm), stilleri ve kapağı kılavuz belgesini tanımlar, tez kuralı sayılmadı; kenar boşlukları kılavuz metninden alındı: üst 3, alt 3, sol 3,5, sağ 2 cm (EXPLICIT). Kılavuzun sectPr'ı ile metin çelişir (sol 30 ve sağ 25 mm'ye karşı 35 ve 20 mm): metin izlendi.",
    "Gövde (EXPLICIT): Times New Roman, 12 punto, 1,5 satır aralığı, 1,25 cm paragraf başı girintisi, paragraflar arasında önceki 6 nk ve sonraki 6 nk, iki yana hizalı. Word ardışık paragraflarda 6 nk + 6 nk'yi büyük değere indirir (6 nk), editör toplar (12 nk): motor farkı.",
    "Doğrudan alıntı (EXPLICIT): üç satırı veya 40 kelimeyi aşarsa 11 punto, 1 satır aralığı, sağdan ve soldan 1 cm daraltılmış paragraf (blockQuote paragraf biçimi). İlk satır girintisi ve alıntı öncesi/sonrası aralık belirtilmemiştir (UNKNOWN; gövde değerleri miras).",
    "Sayfa numarası (EXPLICIT): önsözden itibaren 1'den başlayarak Arapça rakam, tüm bölümlerde altta ortada, yanında başka işaret yok. Kapaklar şablonda üretilmediğinden numara ilk üretilen sayfadan (Önsöz) başlar. Numara yazı boyutu UNKNOWN (motor varsayılanı).",
    "Bölümler sırası (EXPLICIT): Dış Kapak, İç Kapak, Önsöz, İçindekiler, Simgeler veya Kısaltmalar, Giriş, Birinci Bölüm, İkinci Bölüm, Sonuç, Kaynakça; gerekliyse Ekler, Tablolar Listesi, Şekiller Listesi. Tez iki veya üç bölümden oluşur. İçindekiler ve listeler yazılımla otomatik hazırlanır (EXPLICIT).",
    "Atıf ve kaynakça (EXPLICIT): metin içinde APA alıntı sistemi, yazar-yıl: (Turhan, 2003: 40-51); kaynakça tezin sonunda KAYNAKÇA başlığı altında yazar soyadına göre alfabetik, yalnız tezde yararlanılanlar; açıklama için dipnot kullanılabilir. Kılavuzun kaynak örnekleri 'SOYAD, Ad. (Yıl), Başlık ...' biçimindedir; liste girintisi ve punto değerleri kılavuzda kural olarak verilmemiştir (UNKNOWN).",
    "UNKNOWN (üretilmez/uydurulmaz): Dış ve İç Kapak düzeni ve metni (kılavuzun kapağı kılavuzundur), başlık düzeyleri için punto/kalınlık/büyük harf/numara/aralık, tablo ve şekil başlığı biçimi ve konumu (yalnız 'Tablolar Listesi' ve 'Şekiller Listesi' adları belli), dipnot biçimi, sayfa numarası boyutu, Ek düzeni, özet/abstract (kılavuzda yok). Başlık düzeylerinde yalnız gövde yazı tipi/puntosu miras alınır, ondalık numaralandırma (1. / 1.1 / 1.1.1) kaynak kuralı değil, ortak motor testinin gerektirdiği varsayılandır (UNKNOWN).",
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
  notes: [
    "Kaynak yalnız düz yazılı bir DOCX kılavuzudur (seminer; tez değildir). Kılavuzun kendi sectPr'ı, stilleri ve kapağı kılavuz belgesini tanımlar, seminer kuralı sayılmadı. Kenar boşlukları kılavuz metninden: üst 3, alt 3, sol 3, sağ 2 cm (EXPLICIT; lisans kılavuzunda sol 3,5 cm'dir, bu kılavuz bağımsız olarak sol 3 cm yazar). Kılavuzun sectPr'ı (sol 30, sağ 25 mm) ile metin sağ kenarda çelişir: metin izlendi.",
    "Gövde (EXPLICIT, bu kılavuzda ayrıca yazılı): Times New Roman, 12 punto, 1,5 satır, 1,25 cm paragraf başı, önceki 6 nk ve sonraki 6 nk, iki yana hizalı. Doğrudan alıntı: üç satır veya 40 kelimeyi aşarsa 11 punto, 1 satır, sağdan ve soldan 1 cm daraltılmış. Word 6+6 nk'yi 6 nk'ye indirir, editör toplar (motor farkı).",
    "Yapı (EXPLICIT): her seminer bir makale olarak hazırlanır; Giriş-Gelişme-Sonuç sırası; Kapak ve Kaynakça eklenir; 10 sayfadan az olmaz (sayfa sayısı denetlenmez); danışman isterse İçindekiler eklenir (isteğe bağlı bölüm); gerekliyse Ekler, Tablolar Listesi, Şekiller Listesi. Ana içerik bölümü 'GELİŞME' olarak adlandırıldı.",
    "Sayfa numarası (EXPLICIT; metin lisans kılavuzuyla aynı): 'önsözden itibaren' 1'den, altta ortada, başka işaret yok. Seminerde Önsöz tanımlı değildir; kapak üretilmediğinden numara ilk üretilen sayfadan başlar (INFERRED). Numara boyutu UNKNOWN.",
    "Atıf/kaynakça (EXPLICIT): APA alıntı sistemi (yazar-yıl), kaynakçada yazar soyadına göre alfabetik KAYNAKÇA; dipnot açıklama için. Liste girintisi/punto UNKNOWN.",
    "UNKNOWN (üretilmez): Kapak düzeni ve metni, başlık biçimi/numarası, tablo/şekil başlığı biçimi ve konumu, dipnot biçimi, sayfa numarası boyutu, Ek düzeni. Başlıklarda yalnız gövde yazı tipi/puntosu miras alınır, ondalık numaralandırma (1. / 1.1 / 1.1.1) kaynak kuralı değil, ortak motor testinin gerektirdiği varsayılandır (UNKNOWN). Sunum ve değerlendirme puanları belge biçimi değildir.",
  ],
});

export default akuFelsefeLisans;
