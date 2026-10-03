/**
 * Manisa Celal Bayar Üniversitesi, Tıp Fakültesi, tıpta uzmanlık (asistan) tezi (Türkçe).
 *
 * Source (the only one): Butun-Sablonlar/Ege/Manisa Celal Bayar Üniversitesi/Tip_Fakultesi_Uzmanlik_Tezi/
 * MCBU_Tip_Fakultesi_Uzmanlik_Tez_Yazim_Kilavuzu.pdf (6 pages, PDF metadata 2014-08-27, still the guide linked on the faculty page; the guide
 * is titled with the former university name "Celal Bayar Üniversitesi"). There is no Word template: the rules are prose (pp. 2-4) plus two
 * examples (Ek-1 cover on p. 6, Ek-2 contents/reference examples on pp. 4-5). The reviewed spec is orchestration/specs/mcbu-tip-uzmanlik.json
 * (rule evidence, conflicts, unknowns); the report is orchestration/reports/mcbu-tip-uzmanlik.md.
 *
 * Nothing here is taken from the MCBÜ LEE template (templates/mcbu.js) or from any AKÜ template: those are engineering references only.
 * Evidence classes in comments: EXPLICIT (guide prose), MEASURED (guide example page geometry), INFERRED (reasoned), UNKNOWN (sources silent;
 * the neutral engine/Word default is used and named in `source.notes` - never claimed as a requirement).
 *
 * Word line model (Arial): a single line is 1.15 em (ascent 0.905 + descent 0.212 + line gap 0.033), the first baseline sits 0.9377 em
 * below the line top and the extra leading of "1.5 satır" goes below the text.
 */
import { MM_PER_PT } from "../units.js";

const FONT = "Arial";
const SINGLE_LINE_EM = 1.15;
const BASE_EM = 0.9377; // first baseline below the top of a Word line box, in em (baseline "word")
const boxPt = (sizePt, lines) => sizePt * SINGLE_LINE_EM * lines;
/** Distance (mm) from the baseline of line `a` to the baseline of the line directly below it, when nothing is between them. */
const baselineStepMm = (a, b) => (boxPt(a.size, a.lines) - BASE_EM * a.size + BASE_EM * b.size) * MM_PER_PT;
/** Spacer that makes the baseline-to-baseline distance `targetMm` (the guide's Ek-1 example, MEASURED). */
const spacerFor = (a, b, targetMm) => ({ type: "spacer", heightMm: Math.round((targetMm - baselineStepMm(a, b)) * 1000) / 1000 });

/** Guide p. 2 §1.2: "Kağıdın solunda 4 santimetre, sağında ise 2.5 santimetre boşluk bırakılır. Üst ve alt kenarlara en fazla 3 santimetre yaklaşılabilir." */
const MARGINS = { topMm: 30, bottomMm: 30, leftMm: 40, rightMm: 25 };
/** Guide §1.2: first pages (önsöz, içindekiler, girişin/bölümlerin ilk sayfaları): title starts 5 cm below the top edge, centred, 3 cm gap before the text. */
const TITLE_TOP_MM = 50;
const TITLE_GAP_MM = 30;
/** Guide §1.3: "Paragrafta 5 harf boşluk bırakılarak başlanır" - read as five space glyphs of Arial 12 pt (0.2778 em each = 5.88 mm); INFERRED, see spec conflict. */
const PARA_INDENT_MM = Math.round(5 * 0.2778 * 12 * MM_PER_PT * 100) / 100;

const bold = { fontWeight: 700 };
const upper = { textTransform: "uppercase" };
const single = { lineHeight: 1 };
const noFlow = { firstLineIndentMm: 0, spaceBeforePt: 0, spaceAfterPt: 0 };

// ---- cover (Ek-1 "Dış ve iç Kapak Örneği", p. 6): outer cover (beyaz kuşe karton) and inner cover (beyaz kağıt) are "birbirinin benzeri" ----
// Vertical layout = baseline-to-baseline distances measured on the example (mm): university 0 -> anabilim dalı +10.24 -> title +47.25 (title lines 8.63 apart)
// -> UZMANLIK TEZİ +43.56 -> researcher +5.51 -> Tez Danışmanı +38.35 -> advisor +8.72 -> Manisa, Yıl +41.49. All lines centred, Arial.
// Sizes: university/anabilim dalı 12 pt (EXPLICIT), title 14 pt (EXPLICIT prose; the example is 12 pt: CONFLICT), "UZMANLIK TEZİ" 14 pt ("benzer yazı
// karakterinde", INFERRED), researcher / advisor / year 12 pt (example). The absolute distance from the page top and the exact bottom position
// ("Sayfanın en altına") are not fixed by the sources (the example sits inside the guide's own page): the body margins are used and the example's gaps kept.
const L12 = { size: 12, lines: 1 };
const L14T = { size: 14, lines: 1.5 };
const L14 = { size: 14, lines: 1 };
const coverBlocks = [
  { type: "metadata", field: "UNIVERSITY_FACULTY_LINE", fallback: "CELAL BAYAR ÜNİVERSİTESİ TIP FAKÜLTESİ", style: { ...upper } },
  spacerFor(L12, L12, 10.24),
  { type: "metadata", field: "DEPARTMENT_NAME", suffix: " Anabilim Dalı", fallback: "……………………………………….", style: { textTransform: "capitalize" } },
  spacerFor(L12, L14T, 47.25),
  { type: "metadata", field: "THESIS_TITLE", fallback: "TEZİN BAŞLIĞI", style: { ...upper, fontSizePt: 14, lineHeight: 1.5 } },
  spacerFor(L14T, L14, 43.56),
  { type: "text", value: "UZMANLIK TEZİ", style: { fontSizePt: 14 } },
  spacerFor(L14, L12, 5.51),
  { type: "metadata", field: "STUDENT_NAME", fallback: "Araştırma Görevlisinin Adı SOYADI" },
  spacerFor(L12, L12, 38.35),
  { type: "text", value: "Tez Danışmanı" },
  spacerFor(L12, L12, 8.72),
  { type: "text", value: "{{ADVISOR_TITLE}} {{ADVISOR_NAME}}" },
  spacerFor(L12, L12, 41.49),
  { type: "text", value: "Manisa, {{YEAR}}" },
];
const coverOverrides = { page: { numbering: { enabled: false } }, body: { ...noFlow, ...single, align: "center", fontSizePt: 12 } };
const coverSection = (id, type, title) => ({ id, type, title, status: "required", group: "cover", mode: "static", tocEntry: "none", overrides: coverOverrides, blocks: coverBlocks });

// ---- first-page titles: centred, starts 5 cm below the page top edge, 3 cm gap before the text (guide §1.2, EXPLICIT) ----
const unnumberedTitle = { "1": { numbering: { enabled: false } } };
const frontPage = { numbering: { enabled: false } };

const sections = () => [
  coverSection("outer-cover", "outerCover", "DIŞ KAPAK"),
  coverSection("inner-cover", "innerCover", "İÇ KAPAK"),
  // IV. ÖNSÖZ (guide p. 2): "İlk sayfa niteliğinde yazılır ve bir sayfayı geçmez." Not numbered (§1.4) and not listed in the sample contents (Ek-2).
  { id: "preface", type: "preface", title: "ÖNSÖZ", status: "required", group: "front", mode: "editable", showTitle: true, tocEntry: "none",
    overrides: { page: frontPage, headings: unnumberedTitle } },
  // V. İÇİNDEKİLER (p. 3, Ek-2 on p. 4): starts at the left edge, no leader/dash beside the page numbers, a bold "Sayfa" column heading, main headings 1.5 lines
  // apart, sub-headings one (single) line apart. ÖNSÖZ and İÇİNDEKİLER themselves are not listed in the Ek-2 example. Not numbered (§1.4).
  { id: "toc", type: "tableOfContents", title: "İÇİNDEKİLER", status: "required", group: "front", mode: "generated", tocEntry: "none",
    generatedIndex: { kind: "toc", title: "İÇİNDEKİLER", leader: "none", pageHeading: "Sayfa", pageNumberAlignment: "right", indentMm: 0, matchHeadingTransform: true,
      pageHeadingStyle: { ...bold, ...single, spaceBeforePt: 0, spaceAfterPt: 0 },
      // Rows are single lines; a main-heading row starts half a line lower (6.9 pt = 0.5 x 13.8 pt), so the distance before a main heading is 1.5 lines and before a sub-heading one line.
      style: { lineHeight: 1, spaceBeforePt: 0, spaceAfterPt: 0, align: "left" },
      levelStyles: { "1": { spaceBeforePt: 6.9 } } },
    overrides: { page: frontPage, headings: unnumberedTitle } },
  // VI-XI: GİRİŞ, GENEL BİLGİLER, GEREÇ VE YÖNTEM, BULGULAR, TARTIŞMA, SONUÇ VE ÖNERİLER are the author's Heading 1 chapters in this one editable section
  // ("I. GİRİŞ", "II. GENEL BİLGİLER" ...). Arabic numbering starts at 1 on GİRİŞ (§1.4: "girişin ikinci sayfasının ... 2 sayısı ile başlar").
  { id: "main", type: "mainContent", title: "Bölümler", status: "required", group: "body", mode: "editable",
    overrides: { page: { numbering: { format: "arabic", startAt: 1, restart: true } } } },
  // XII-XV continue the Roman chapter numbers exactly as in the Ek-2 list (VII. ÖZET, VIII. İNGİLİZCE ÖZET, IX. EKLER (Gerekiyorsa), X. KAYNAKLAR).
  { id: "abstract", type: "abstract", title: "ÖZET", status: "required", group: "back", mode: "editable", showTitle: true, titleNumbering: "continueH1" },
  { id: "abstract-en", type: "englishAbstract", title: "İNGİLİZCE ÖZET", status: "required", group: "back", mode: "editable", showTitle: true, titleNumbering: "continueH1" },
  { id: "appendices", type: "appendices", title: "EKLER", status: "optional", group: "back", mode: "editable", showTitle: true, titleNumbering: "continueH1" },
  { id: "bibliography", type: "bibliography", title: "KAYNAKLAR", status: "required", group: "back", mode: "editable", showTitle: true, titleNumbering: "continueH1" },
];

// ---- typography ----------------------------------------------------------------------------------------

/**
 * Chapter heading (H1): centred, capitals (every section title of the guide and of the Ek-2 list is printed in capitals), a new page, and the first-page
 * rule of §1.2: title 50 mm below the page top (30 mm margin + 20 mm space before), 30 mm gap after it. Bold: the guide's own headings (INFERRED, the
 * guide prescribes no weight); size 12 pt (§1.3 "12 punto", INFERRED for headings); single line so that 50 mm / 30 mm are measured to the line box.
 */
const h1 = {
  fontFamily: FONT, fontSizePt: 12, fontWeight: 700, align: "center", lineHeight: 1, textTransform: "uppercase", pageBreakBefore: true, keepWithNext: true, firstLineIndentMm: 0,
  spaceBeforePt: (TITLE_TOP_MM - MARGINS.topMm) / MM_PER_PT, spaceAfterPt: TITLE_GAP_MM / MM_PER_PT,
  numbering: { enabled: true, format: "{1}.", sequence: "roman-upper" },
};
/**
 * Sub-headings: the guide prints "1. 1. Kullanılacak Kağıt ..." under "I. GENEL YAZIM KURALLARI" (Arabic sub-numbers, §V "alt başlıklar ise arabik rakamlarla");
 * written here as "1.1." without the typing space (INFERRED; the shared engine test also requires unspaced labels), bold, left, without extra spacing
 * (measured on the guide's own pages). Levels 3-4 are not described; they continue the same pattern (INFERRED).
 */
const sub = (format) => ({ fontFamily: FONT, fontSizePt: 12, fontWeight: 700, align: "left", lineHeight: 1.5, spaceBeforePt: 0, spaceAfterPt: 0, firstLineIndentMm: 0, keepWithNext: true, numbering: { enabled: true, format, sequence: "arabic" } });

/** Captions (§1.5): figures/graphs/pictures and tables numbered consecutively in Arabic numerals; figure number+title below, table title above. Size 12 pt (§1.3 general rule). */
const captionNumbering = { scope: "document", format: "{n}", sequence: "arabic" };
const caption = (label, position) => ({
  label, position, numbering: captionNumbering, labelFormat: "{label} {number}", captionAlignment: "left", align: "left",
  style: { fontFamily: FONT, fontSizePt: 12, align: "left", lineHeight: 1.5, spaceBeforePt: 0, spaceAfterPt: 0 },
  spacingBeforePt: 0, spacingAfterPt: 0,
});

const base = {
  schemaVersion: 1,
  templateVersion: "1.0.0",
  id: "mcbu-tip-uzmanlik-tr-v1",
  universityId: "mcbu",
  universityName: "Manisa Celal Bayar Üniversitesi",
  instituteId: "tip",
  instituteName: "Tıp Fakültesi",
  degreeType: "specialization",
  language: "tr",
  status: "official",
  displayName: "Manisa Celal Bayar Üniversitesi · Tıp Fakültesi · Tıpta Uzmanlık Tezi",
  source: {
    type: "official",
    url: "https://tip.mcbu.edu.tr/db_images/file/asistantezyazimkilavuzu-43TR.pdf",
    documentName: "Celal Bayar Üniversitesi Tıp Fakültesi Uzmanlık Tez Yazım Kılavuzu - MCBU_Tip_Fakultesi_Uzmanlik_Tez_Yazim_Kilavuzu.pdf",
    revisionDate: "2014-08-27 (PDF creation/modification metadata; the text carries no date and still names the former university 'Celal Bayar Üniversitesi')",
    verifiedAt: "2026-10-02",
    notes: [
      "Tek kaynak: 6 sayfalık kılavuz PDF'i (düzyazı kurallar s.2-4, Ek-1 kapak örneği s.6, Ek-2 içindekiler/kaynak örnekleri s.4-5); resmi Word şablonu yoktur. Kılavuzun kendi sayfaları kuralları uygulamaz (Arial Narrow 11 pt, iki yana yaslı, tek aralık, kenar boşlukları ~18-20 mm): düzyazı kural kaynaktır, kendi sayfalarının geometrisi yalnızca örnek sayfalar (Ek-1, Ek-2) için kanıt sayılır. Kılavuz 2014 tarihlidir ve Tıp Fakültesi sayfasında hâlâ bağlantılıdır; açık bir iptal/yenileme yoktur. LEE kılavuzuyla ilişkisi UNKNOWN. Başka bir üniversitenin/birimin değeri alınmadı.",
      "Sayfa (EXPLICIT §1.1-1.2): A4, sol 40 mm, sağ 25 mm; 'Üst ve alt kenarlara en fazla 3 santimetre yaklaşılabilir' cümlesi üst/alt 30 mm olarak okundu (INFERRED, cümle iki yönlü okunabilir). Üstbilgi/altbilgi uzaklığı UNKNOWN (kılavuz sessiz); sayfa numarasını taşıyabilmek için Word varsayılanı 12,5 mm yer tutucu olarak kullanıldı, kaynak değeri değildir.",
      "Yazı (EXPLICIT §1.3): Arial 12 punto, sola yaslı, 1,5 satır aralığı. 'Paragraflar normal satır aralıklarıyla ayrılırlar' ek paragraf boşluğu yok olarak okundu (INFERRED, 0/0). 'Paragrafta 5 harf boşluk' = 5 boşluk karakteri = 5,88 mm girinti (INFERRED; 'harf' birimi tanımsız, harf genişliği okunursa ~10-12 mm olurdu: onay gerekir).",
      "Sayfa numaraları (§1.4): kapaklar, önsöz ve içindekiler numarasız; diğer tüm sayfalar Arap rakamıyla; GİRİŞ'in ilk sayfası 1 sayılır. ÇELİŞKİ: kural cümlesi 'alt orta' der, aynı paragraftaki örnek cümle '2 sayısı ... üst sağa' der; genel kural olan alt orta uygulandı (onay gerekir). 'Bölümlerin ilk sayfalarına numara konmaz' kuralı MOTOR AÇIĞI: numaralandırma bölüm bazında açılıp kapanır, bir bölümün/başlığın yalnız ilk sayfasında gizlenemez (README/rapor).",
      "İlk sayfalar (§1.2 EXPLICIT): önsöz, içindekiler ve her bölümün ilk sayfasında başlık sayfa üst kenarından 5 cm aşağıdan başlar (30 mm kenar boşluğu + 20 mm paragraf öncesi), ortalanır, başlıktan sonra 3 cm boşluk bırakılıp metne geçilir. Başlık biçimi (koyu, 12 pt, büyük harf) kılavuzda yazmaz: kılavuzun kendi başlıkları ve Ek-2 listesi örnek alındı (INFERRED). Alt başlıklar: Arap rakamlı '1.1. Başlık' (kılavuzun kendi sayfalarında '1. 1.' yazılmış, boşluk yazım payı sayıldı), koyu, sola yaslı, ekstra aralık yok (kılavuzun kendi sayfaları); 3./4. düzey tarif edilmemiştir, aynı kalıp sürdürüldü (INFERRED); alt başlık aralığı UNKNOWN (0).",
      "Bölüm sırası (§ I-XVI, Ek-2): Önsöz, İçindekiler, Giriş, Genel Bilgiler, Gereç ve Yöntem, Bulgular, Tartışma, Sonuç ve Öneriler, Özet, İngilizce Özet, Ekler (gerekiyorsa), Kaynaklar. Ek-2 listesi Giriş'ten Kaynaklar'a kadar hepsini Roman rakamıyla numaralar (I. GİRİŞ ... X. KAYNAKLAR): Özet, İngilizce Özet, Ekler ve Kaynaklar da numaralı ana başlık olarak yazılır (titleNumbering continueH1). Ek-2'de 'SONUÇLAR VE ÖNERİLER', s.3 metninde 'SONUÇ VE ÖNERİLER' yazar (ÇELİŞKİ; başlıkları yazar yazar). Özet ve İngilizce Özet'in bir sayfayı geçmemesi (§XII) yapısal kontrolü motorda yoktur.",
      "İçindekiler (§V, Ek-2): sol kenardan başlar; ana başlıklar arasında 1,5, alt başlıklar arasında tek aralık; ana başlıklar Roman, alt başlıklar Arap rakamlı; sayfa numaralarının yanında parantez/çizgi gibi işaret yoktur (nokta kılavuzu kullanılmadı, Ek-2 örneğinde de yok); sütun başlığı 'Sayfa' koyu. Başlık ortalı (kural cümlesi) – Ek-2 örneğinde sola dayalı (ÇELİŞKİ; kural cümlesi izlendi).",
      "Kapak (§II, Ek-1): dış kapak (beyaz kuşe karton) ve iç kapak (beyaz kağıt) 'birbirinin benzeri'; aynı düzen iki bölüm olarak üretildi. Üniversite adı örnekteki gibi 'CELAL BAYAR ÜNİVERSİTESİ TIP FAKÜLTESİ' (eski ad; kılavuz bu metni verir, alan düzenlenebilir). Başlık punto: düzyazı 14 punto, örnek 12 punto (ÇELİŞKİ; düzyazı uygulandı, onay gerekir). Dikey boşluklar Ek-1 örnek ölçümüdür (satır sayıları düzyazıdakiyle yaklaşık uyumludur; 'Sayfanın en altına Manisa ve yıl' ifadesi örneğin 41 mm'lik boşluğuyla uygulandı).",
      "Tablo/Şekil (§1.5): Arap rakamlı ve ardışık ('Tablo 1', 'Şekil 1'); tablo başlığı üstte, şekil/grafik/resim numara ve adı altta. Etiket ayracı, punto dışı biçim, hücre aralığı ve kenarlık UNKNOWN (genel 12 punto/sola yaslı kuralı). Dipnot punto/aralığı UNKNOWN (kaynaklar metinde numarayla verilir; genel 12 punto kuralı).",
      "Kaynaklar (§XV, Ek-2): metinde parantez içinde ve cümle sonunda numara, geçiş sırasına göre numaralı liste (Vancouver benzeri). Örnek kaynakların ölçümü: tek satır aralığı, devam satırı 6,35 mm asılı (numara 18,46 mm, metin 24,81 mm), girişler arası ek boşluk ~6,25 mm (17,7 pt; örnekte e2-e3 arasında yok, düzensiz). Örnek iki yana yaslıdır ancak kılavuzun kendi gövdesi de kuralına aykırı iki yana yaslıdır; genel 'sola hizalanarak' kuralı izlendi.",
      "Üretilmeyenler: Onay/jüri sayfası, bildirim, teşekkür, simgeler/kısaltmalar, şekil/tablo dizinleri (kılavuzda tanım yok). Fiziksel kurallar (tek yüz, 9 cilt, beyaz kuşe karton) belge içeriği değildir.",
    ],
  },
  page: {
    size: "A4", widthMm: 210, heightMm: 297, orientation: "portrait",
    margins: MARGINS,
    header: { heightMm: 0, distanceMm: 12.5, content: "", firstPage: "same" },
    footer: { heightMm: 8, distanceMm: 12.5, content: "", firstPage: "same" },
    numbering: { enabled: true, position: "bottom", align: "center", format: "arabic", startAt: 1, restart: false, omitOnChapterStart: true },
  },
  typography: {
    body: { fontFamily: FONT, fontSizePt: 12, fontWeight: 400, align: "left", lineHeight: 1.5, spaceBeforePt: 0, spaceAfterPt: 0, firstLineIndentMm: PARA_INDENT_MM },
    paragraph: { firstLineIndentMm: PARA_INDENT_MM, spaceBeforePt: 0, spaceAfterPt: 0, lineHeight: 1.5, align: "left" },
    headings: { "1": h1, "2": sub("{1}.{2}."), "3": sub("{1}.{2}.{3}."), "4": sub("{1}.{2}.{3}.{4}.") },
    footnotes: { placement: "pageBottom", numbering: "document", fontFamily: FONT, fontSizePt: 12 },
    lineSpacing: { mode: "word", singleLineEm: SINGLE_LINE_EM, baseline: "word", paragraphSpacing: "additive" },
  },
  placeholders: {
    UNIVERSITY_FACULTY_LINE: { label: "Kapak üst satırı (kılavuz örneği: eski ad)", type: "text", defaultValue: "CELAL BAYAR ÜNİVERSİTESİ TIP FAKÜLTESİ" },
    DEPARTMENT_NAME: { label: "Anabilim Dalı adı (… Anabilim Dalı)", type: "text", required: true },
    THESIS_TITLE: { label: "Tezin başlığı", type: "text", required: true },
    STUDENT_NAME: { label: "Araştırma Görevlisinin Adı SOYADI", type: "text", required: true },
    ADVISOR_TITLE: { label: "Tez danışmanının unvanı", type: "text", required: true },
    ADVISOR_NAME: { label: "Tez danışmanının Adı SOYADI", type: "text", required: true },
    YEAR: { label: "Tezin yapıldığı yıl (kapak)", type: "number", required: true },
  },
  tables: caption("Tablo", "above"),
  figures: { ...caption("Şekil", "below"), box: { align: "center", spaceBeforePt: 0, spaceAfterPt: 0 } },
  // Ek-2 reference examples (pp. 4-5, MEASURED): single spacing, 6.35 mm hanging indent, ~17.7 pt between entries; numeric citations, numbered in order of appearance (§XV).
  bibliography: { heading: "KAYNAKLAR", style: { fontFamily: FONT, fontSizePt: 12, align: "left", lineHeight: 1, spaceBeforePt: 0, spaceAfterPt: 17.7, firstLineIndentMm: 0, hangingIndentMm: 6.35 }, hangingIndentMm: 0, citationStyle: "numeric" },
  toc: { heading: "İÇİNDEKİLER", levels: [1, 2, 3, 4], showPageNumbers: true },
};

export const mcbuTipUzmanlik = { ...base, sections: sections() };
export default mcbuTipUzmanlik;
