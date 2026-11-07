// Resmî kılavuzdan doğrudan doğrulanmış, şablon kaydında eksik/belirsiz kalan yazım kuralları.
// Her kayıt gerçek şablon kimliğine, o şablonun kayıtlı bir kaynak belgesine (`doc`: SHA-256 öneki) ve
// belge içi konuma bağlıdır; şablon kaydı bu belgeyi içermiyorsa kayıt gösterilmez.
// Kaynak adı + konum + doğrulama tarihi her kuralın yanında "Kaynak" olarak görünür.
// Uydurma değer eklemeyin: yalnız kılavuzu açıp okuduğunuz ve konumunu yazabildiğiniz kuralı ekleyin.

const CHECKED = "2026-10-25";
const TR = "Türkçe özet", EN = "Yabancı dilde özet";
const rule = (guide, section, label, value, location) => ({ section, label, value, known: true, source: { doc: guide.doc, name: guide.name, location, checkedAt: CHECKED } });
const kw = (guide, label, value, location) => rule(guide, "ozet", `${label} — anahtar kelime`, value, location);
const pages = (guide, label, value, location) => rule(guide, "ozet", `${label} — sayfa sınırı`, value, location);
const words = (guide, label, value, location) => rule(guide, "ozet", `${label} — kelime sınırı`, value, location);

const AKU_FBE = { doc: "2532ade9", name: "AKÜ Fen Bilimleri Enstitüsü Tez Yazım Kılavuzu (Ocak 2020)" };
const AKU_SBE = { doc: "55d13410", name: "AKÜ Sosyal Bilimler Enstitüsü Tez Hazırlama Yazım ve Basım Kılavuzu (2026)" };
const AKU_SAGBIL = { doc: "b9ce1b78", name: "AKÜ Sağlık Bilimleri Enstitüsü Tez Yazım Kılavuzu (2022)" };
const AKU_MBG = { doc: "b631d3c7", name: "AKÜ Moleküler Biyoloji ve Genetik Bitirme Tezi Kılavuzu (2025)" };
const AKU_COG = { doc: "6d010f61", name: "AKÜ Coğrafya Bitirme Tezi Yazım Kılavuzu (2024)" };
const AKU_KIM = { doc: "1b4b3c25", name: "AKÜ Kimya Bitirme Tezi Yazım Kılavuzu (2023)" };
const AKU_SOS = { doc: "95bc988c", name: "AKÜ Sosyoloji Lisans Tez Yazım Kılavuzu (2022)" };
const AKU_FEL = { doc: "03eec8c6", name: "AKÜ Felsefe Seminer Hazırlama Kılavuzu (2019)" };
const AFSU_LEE = { doc: "31379b7a", name: "AFSÜ Lisansüstü Tez Yazım Kılavuzu (2025)" };
const AFSU_TIP = { doc: "9003829e", name: "AFSÜ Tıp Fakültesi Uzmanlık Tezi Yazım Kılavuzu (2021)" };
const AFSU_DIS = { doc: "26df7edd", name: "AFSÜ Diş Hekimliği Fakültesi Uzmanlık Tezi Yazım Kılavuzu (2021)" };
const AFSU_ECZ = { doc: "ec76ed61", name: "AFSÜ Eczacılık Araştırma Projesi Dersleri Yönergesi (2024)" };
const MCBU = { doc: "e607f8f7", name: "MCBÜ Lisansüstü Tez Yazım Kılavuzu (22.10.2025)" };
const MCBU_TIP = { doc: "67f08792", name: "MCBÜ Tıp Fakültesi Uzmanlık Tezi Yazım Kılavuzu" };

const aku = (guide, location) => [kw(guide, TR, "4–6 tane, virgülle ayrılır", location), kw(guide, EN, "4–6 tane, virgülle ayrılır", location)];
const mcbuNone = (label) => rule(MCBU, "ozet", `${label} — kelime sınırı`, "Kılavuzda açık bir kelime/sayfa sınırı bulunmadı (yalnız anahtar kelime sayısı belirtilmiş)", "Özet ve Abstract örnek sayfaları (anahtar kelime satırları); kılavuz metni tarandı");
const afsuLee = [
  words(AFSU_LEE, TR, "en az 250 kelime (başlık ve anahtar kelimeler hariç)", "“Tezin Özetleri” bölümü"),
  words(AFSU_LEE, EN, "en az 250 kelime (başlık ve anahtar kelimeler hariç)", "“Tezin Özetleri” bölümü"),
  pages(AFSU_LEE, TR, "bir sayfayı aşmaz", "“Tezin Özetleri” bölümü"),
  pages(AFSU_LEE, EN, "bir sayfayı aşmaz", "“Tezin Özetleri” bölümü"),
  kw(AFSU_LEE, TR, "en az 3, en fazla 5 tane, alfabetik, virgülle ayrılır", "“Tezin Özetleri” bölümü"),
  kw(AFSU_LEE, EN, "en az 3, en fazla 5 tane, alfabetik, virgülle ayrılır", "“Tezin Özetleri” bölümü"),
];
const afsuUzmanlik = (guide) => [
  pages(guide, TR, "bir sayfayı geçmez", "PDF s.9, §3.1.6 Özet"),
  pages(guide, EN, "bir sayfayı geçmez", "PDF s.10, §3.1.7 Abstract"),
  kw(guide, TR, "3–5 tane, alfabetik, virgülle ayrılır", "PDF s.9, §3.1.6 Özet"),
];
const sbe = [
  pages(AKU_SBE, TR, "zorunlu haller dışında bir sayfayı aşmaz", "PDF s.5, §2.4 Özet"),
  kw(AKU_SBE, TR, "en fazla 5 tane", "PDF s.5, §2.4 Özet"),
  kw(AKU_SBE, EN, "en fazla 5 tane", "PDF s.5, §2.5 Abstract"),
];
const sbeEn = [...sbe, rule(AKU_SBE, "ozet", "Genişletilmiş Türkçe özet (yabancı dilde eğitim)", "zorunlu; en az 2000 kelime, eklerden sonra verilir (giriş ≥200, literatür ≥300, amaç ≥200, tartışma/sonuç ≥500 kelime)", "PDF s.11 §5.4 ve PDF s.52 EK-12")];
const sagbil = [
  pages(AKU_SAGBIL, TR, "bir sayfaya sığdırılmaya çalışılır, iki sayfayı kesinlikle aşmaz", "PDF s.15, Özet"),
  kw(AKU_SAGBIL, TR, "3–6 tane, alfabetik", "PDF s.15, Özet"),
  pages(AKU_SAGBIL, EN, "Türkçe özetle aynı düzen (iki sayfayı aşmaz)", "PDF s.15, Summary"),
];

export const TEMPLATE_RULE_OVERLAYS = Object.freeze({
  "aku-fbe-master-tr-v1": aku(AKU_FBE, "PDF s.18 (özet/abstract biçim kuralları)"),
  "aku-fbe-phd-tr-v1": aku(AKU_FBE, "PDF s.18 (özet/abstract biçim kuralları)"),
  "aku-sbe-master-tr-v1": sbe, "aku-sbe-phd-tr-v1": sbe, "aku-sbe-sanatta-yeterlik-tr-v1": sbe,
  "aku-sbe-master-en-v1": sbeEn, "aku-sbe-phd-en-v1": sbeEn,
  "aku-sagbil-master-tr-v1": sagbil, "aku-sagbil-phd-tr-v1": sagbil,
  "aku-mbg-lisans-tr-v1": aku(AKU_MBG, "PDF s.14 (özet/abstract biçim kuralları)"),
  "aku-cografya-lisans-tr-v1": aku(AKU_COG, "PDF s.10 (özet/abstract biçim kuralları)"),
  "aku-kimya-lisans-tr-v1": aku(AKU_KIM, "PDF s.18 (özet/abstract biçim kuralları)"),
  "aku-sosyoloji-lisans-tr-v1": [rule(AKU_SOS, "ana-metin", "Tez uzunluğu", "en az 60 sayfa ve en az 40 kaynak", "kılavuzun ilk bölümü (genel koşullar)")],
  "aku-felsefe-seminer-tr-v1": [rule(AKU_FEL, "ana-metin", "Seminer uzunluğu", "10 sayfadan az olmaz; kapak ve kaynakça eklenir", "kılavuzun genel koşulları")],
  "afsu-lee-master-tr-v1": afsuLee, "afsu-lee-phd-tr-v1": afsuLee,
  "afsu-tip-uzmanlik-tr-v1": afsuUzmanlik(AFSU_TIP),
  "afsu-dis-hekimligi-uzmanlik-tr-v1": afsuUzmanlik(AFSU_DIS),
  "afsu-eczacilik-proje-lisans-tr-v1": [
    rule(AFSU_ECZ, "ana-metin", "Rapor uzunluğu", "en az 20 sayfa (beyan, önsöz, özet, abstract, içindekiler ve dizinler hariç)", "PDF s.3, Madde 20"),
    pages(AFSU_ECZ, TR, "bir sayfayı geçmez", "PDF s.10, Özet"), pages(AFSU_ECZ, EN, "bir sayfayı geçmez", "PDF s.10, Abstract"),
    kw(AFSU_ECZ, TR, "en fazla 5 tane, alfabetik, virgülle ayrılır", "PDF s.10, Özet"), kw(AFSU_ECZ, EN, "en fazla 5 tane, alfabetik, virgülle ayrılır", "PDF s.10, Abstract"),
  ],
  "mcbu-lee-master-tr-v1": [mcbuNone(TR), mcbuNone(EN)],
  "mcbu-lee-phd-tr-v1": [mcbuNone(TR), mcbuNone(EN)],
  "mcbu-tip-uzmanlik-tr-v1": [pages(MCBU_TIP, TR, "bir sayfayı geçmez", "PDF s.3, XII. Özet")],
});
