// "Bu şablonun yazım kuralları" içeriği. Yalnız seçili gerçek şablonun kaydından okunur;
// başka üniversiteden değer ödünç alınmaz, motor varsayılanı resmî kural gibi sunulmaz.
// Kayıtta olmayan bilgi "Henüz doğrulanmadı" olarak gösterilir. İç JSON anahtarları metne sızmaz.
import { buildThesisGuide } from "./thesisGuide.js";
import { TEMPLATE_RULE_OVERLAYS } from "./templateRuleOverlays.js";

export const NOT_VERIFIED = "Henüz doğrulanmadı";
const NOT_RECORDED = "Şablon kaydında yok — resmî kılavuzda varsa henüz işlenmedi";

const DEGREE = { master: "Yüksek lisans", doctorate: "Doktora", phd: "Doktora", undergraduate: "Lisans", specialization: "Uzmanlık" };
const LANGUAGE = { tr: "Türkçe", en: "İngilizce" };
const SECTION_GROUPS = {
  cover: ["outerCover", "innerCover", "approval", "declaration", "ethicsDeclaration", "preface", "acknowledgements", "custom", "dedication"],
  indexes: ["tableOfContents", "listOfFigures", "listOfTables", "listOfAbbreviations", "listOfSymbols"],
  back: ["appendices", "curriculumVitae"],
};
const TYPE_LABEL = { outerCover: "Dış kapak", innerCover: "İç kapak", approval: "Onay sayfası", declaration: "Beyan/taahhütname", ethicsDeclaration: "Etik beyanı", preface: "Önsöz/teşekkür", acknowledgements: "Teşekkür", dedication: "Adama", appendices: "Ekler", curriculumVitae: "Özgeçmiş" };
const INDEX_LABEL = { toc: "içindekiler", figures: "şekiller dizini", tables: "tablolar dizini", abbreviations: "kısaltmalar dizini", symbols: "simgeler dizini" };

const date = (value) => (/^\d{4}-\d{2}-\d{2}/.test(String(value)) ? String(value).slice(0, 10) : String(value || ""));
const item = (label, value, extra = {}) => ({ label, value: value || NOT_VERIFIED, known: Boolean(value), ...extra });

/** Resmî belgeler: bağlantısı olanlar tıklanır; yalnız depo yolu olanlar ad olarak gösterilir. */
export function templateSourceDocuments(template) {
  const source = template?.source || {};
  const found = [];
  const add = (label, url, path, sha256, revisionDate) => {
    if (!url && !path && !label) return;
    const same = found.find((entry) => (sha256 && entry.sha256 === sha256) || (url && entry.url === url) || (path && entry.path === path));
    const safeUrl = /^https:\/\//.test(url || "") ? url : null;
    if (same) { same.url ||= safeUrl; same.path ||= path || null; same.sha256 ||= sha256 || null; same.revisionDate ||= revisionDate || null; return; }
    found.push({ key: url || path || label, label: label || (path ? path.split("/").pop() : url), url: safeUrl, path: path || null, sha256: sha256 || null, revisionDate: revisionDate || null });
  };
  add(source.documentName, source.url, null, null, source.revisionDate);
  for (const file of source.currentVerification?.files || []) add(file.label, file.url, file.path, file.sha256);
  for (const file of source.currentSourceVerification?.documents || source.currentSourceVerification?.files || []) add(file.label, file.url, file.path, file.sha256);
  for (const file of source.regionalAudit?.documents || []) add(null, null, file.path, file.sha256);
  for (const file of source.relatedDocuments || []) add(null, file.url, file.path, file.sha256);
  return found;
}

/** Kaynak kapsamı: hiçbir durumda "tam rehber" denmez; kayıttaki izlenebilirliği olduğu gibi söyler. */
export function templateRuleStatus(template) {
  const source = template?.source || {};
  const documents = templateSourceDocuments(template);
  const hasLink = documents.some((entry) => entry.url);
  const audit = source.regionalAudit?.status;
  const live = source.currentVerification?.checkedAt || source.currentSourceVerification?.checkedAt;
  if (template?.status === "official" && audit) {
    return { level: "checked", label: "Resmî kaynakla kontrol edilmiş kayıt", detail: `Kayıtlı kontrol tarihi: ${date(live || source.regionalAudit.checkedAt)}. Her kuralın canlı resmî sayfayla bu sürümde yeniden doğrulandığı iddia edilmez.`, hasLink };
  }
  if (source.rebuildKind === "guide-rules") return { level: "draft", label: "Kılavuzdan oluşturulmuş taslak", detail: "Kurallar kılavuzdan otomatik çıkarıldı; kurum onayı ve tam doğrulama yok.", hasLink };
  if (source.rebuildKind === "docx-template") return { level: "draft", label: "Resmî Word şablonundan oluşturulmuş taslak", detail: "Değerler şablon dosyasından ölçüldü; kılavuz metni karşılaştırması tamamlanmadı.", hasLink };
  return { level: "unverified", label: NOT_VERIFIED, detail: "Bu şablonun resmî kaynak incelemesi tamamlanmadı; aşağıdaki değerler kesin kural sayılmamalıdır.", hasLink };
}

function sectionRows(template, types, describe) {
  const rows = [];
  for (const section of template.sections || []) {
    if (!types.includes(section.type) || !section.title) continue;
    const key = TYPE_LABEL[section.type] || section.title;
    if (rows.some((row) => row.key === key)) continue;
    rows.push({ key, section, ...describe(section) });
  }
  return rows;
}

const requirement = (section) => (section.status === "optional" ? "isteğe bağlı" : "zorunlu");
const authoring = (section) => (section.mode === "generated" ? "kendiliğinden hazırlanır" : section.mode === "static" ? "Tez bilgilerinden doldurulur" : "siz yazarsınız");

export function buildTemplateRules(template) {
  if (!template) return null;
  const guide = buildThesisGuide(template);
  const source = template.source || {};
  const status = templateRuleStatus(template);
  const documents = templateSourceDocuments(template);
  const sections = template.sections || [];
  const validation = template.validation || {};
  const review = source.review || {};
  const open = [];

  const identity = {
    title: guide.title,
    university: template.universityName || "",
    institute: template.instituteName || "",
    degree: DEGREE[template.degreeType] || "",
    language: LANGUAGE[template.language] || String(template.language || "").toUpperCase(),
  };

  const out = [];
  out.push({
    id: "kaynak", title: "Kaynak ve kapsam",
    items: [
      item("Belge türü", [identity.degree, identity.institute].filter(Boolean).join(" · ")),
      item("Dil", identity.language),
      item("Kaynak belge", source.documentName || null),
      item("Sürüm/tarih", source.revisionDate ? `${date(source.revisionDate)} (belge tarihi)` : null),
      item("Kayıtlı kontrol", source.verifiedAt ? `${date(source.verifiedAt)}` : null),
    ],
    documents,
  });

  out.push({ id: "sayfa", title: "Sayfa ve metin düzeni", items: guide.layout.map((row) => item(row.label, row.value)) });

  const order = sections.filter((section) => section.title && !/Header|Footer|header|footer/.test(section.id)).reduce((list, section) => {
    const name = TYPE_LABEL[section.type] || (section.type === "abstract" ? "Türkçe özet" : section.type === "englishAbstract" ? "Yabancı dilde özet" : section.title);
    if (!list.some((row) => row.name === name)) list.push({ name, section });
    return list;
  }, []);
  out.push({
    id: "sira", title: "Tez bölümlerinin sırası",
    items: order.map(({ name, section }, index) => item(`${index + 1}. ${name}`, [requirement(section), section.mode === "generated" ? "otomatik" : null, section.pageBreakBefore ? "yeni sayfadan başlar" : null].filter(Boolean).join(" · "))),
    note: "Yeni sayfadan başlama yalnız şablonda açıkça kayıtlı olduğunda belirtilir.",
  });

  const front = sectionRows(template, SECTION_GROUPS.cover, (section) => ({ value: `${requirement(section)} · ${authoring(section)}` }));
  const frontRules = Object.entries(validation).filter(([field]) => !/KEYWORD/.test(field)).map(([, rule]) => rule?.message).filter(Boolean);
  out.push({
    id: "kapak", title: "Kapak ve ön sayfalar",
    items: [...front.map((row) => item(row.key, row.value)), ...frontRules.map((message, index) => item(`Koşul ${index + 1}`, message))],
    note: guide.infoPages.length ? `Tez bilgileri ${guide.infoPages.join(", ")} sayfalarına yansır.` : undefined,
  });

  const abstractRows = [];
  for (const [type, label] of [["abstract", "Türkçe özet"], ["englishAbstract", "Yabancı dilde özet"]]) {
    const present = sections.filter((section) => section.type === type);
    if (!present.length) { abstractRows.push(item(label, "Bu şablonda ayrı bölüm yok")); continue; }
    const pages = present.map((section) => section.maxPages).find(Boolean);
    const words = present.map((section) => section.minWords).find(Boolean);
    const keywordKey = type === "abstract" ? "KEYWORDS" : "KEYWORDS_EN";
    const keywords = validation[keywordKey]?.minItems;
    abstractRows.push(item(`${label} — kelime sınırı`, words ? `en az ${words} kelime` : null, words ? {} : { value: NOT_RECORDED, known: false }));
    abstractRows.push(item(`${label} — sayfa sınırı`, pages ? `en fazla ${pages} sayfa` : null, pages ? {} : { value: NOT_RECORDED, known: false }));
    abstractRows.push(item(`${label} — anahtar kelime`, keywords ? `en az ${keywords} tane${validation[keywordKey].separator === "," ? ", virgülle ayrılır" : ""}` : null, keywords ? {} : { value: NOT_RECORDED, known: false }));
  }
  out.push({ id: "ozet", title: "Türkçe özet ve yabancı dilde özet", items: abstractRows });

  const indexRows = sectionRows(template, SECTION_GROUPS.indexes, (section) => ({ value: `${requirement(section)}${section.generatedIndex?.kind ? ` · ${INDEX_LABEL[section.generatedIndex.kind] || "dizin"} ${section.mode === "generated" ? "otomatik" : "elle"}` : ""}` }));
  const toc = template.toc || {};
  out.push({
    id: "icindekiler", title: "İçindekiler ve diğer dizinler",
    items: [
      item("İçindekiler başlığı", toc.heading || null),
      item("Başlık düzeyleri", toc.levels?.length ? toc.levels.map((level) => `Başlık ${level}`).join(", ") : null),
      item("Sayfa numaraları", toc.showPageNumbers === undefined ? null : toc.showPageNumbers ? "gösterilir" : "gösterilmez"),
      ...indexRows.map((row) => item(row.key, row.value)),
    ],
  });

  out.push({
    id: "ana-metin", title: "Ana metin",
    items: [...guide.headingRules.map((row) => item(row.label, row.value)), ...(guide.expected.length ? [item("Beklenen ana başlıklar", guide.expected.join(" → "))] : [])],
  });

  out.push({ id: "gorseller", title: "Şekil, tablo/çizelge, resim ve denklemler", items: guide.captions.length ? guide.captions.map((text, index) => item(`Kural ${index + 1}`, text)) : [item("Açıklama biçimi", null)] });

  out.push({
    id: "atif", title: "Alıntı, atıf ve kaynakça",
    items: [item("Atıf sistemi", guide.citation.method), item("Kaynakça başlığı", guide.citation.heading), item("Kaynakça yazı düzeni", guide.citation.typography || null)],
  });

  const back = sectionRows(template, SECTION_GROUPS.back, (section) => ({ value: `${requirement(section)} · ${authoring(section)}` }));
  out.push({ id: "ekler", title: "Ekler, özgeçmiş ve teslim koşulları", items: [...back.map((row) => item(row.key, row.value)), item("Teslim koşulları", null)] });

  const conflictText = (entry) => (typeof entry === "string" ? entry : entry && entry.field ? `${entry.field}: şablonda ${entry.measured}, kılavuzda ${entry.guide}${entry.guideSource ? ` (${entry.guideSource})` : ""}` : "");
  for (const entry of [...(review.conflicts || []), ...(source.regionalAudit?.conflicts || [])]) { const text = conflictText(entry); if (text) open.push({ kind: "Çelişki", text }); }
  for (const entry of review.unknown || []) open.push({ kind: "Doğrulanamadı", text: `${entry.field}: ${entry.reason}` });
  if (status.level !== "checked") open.unshift({ kind: NOT_VERIFIED, text: status.detail });
  out.push({ id: "belirsizlik", title: "Belirsizlikler ve çelişkiler", items: open.length ? open.map((entry) => item(entry.kind, entry.text, { known: entry.kind !== NOT_VERIFIED && entry.kind !== "Doğrulanamadı" })) : [item("Açık nokta", "Kayıtta açık nokta veya çelişki işaretlenmemiş")] });

  for (const overlay of TEMPLATE_RULE_OVERLAYS[template.id] || []) {
    const doc = documents.find((entry) => entry.sha256?.startsWith(overlay.source.doc));
    const target = out.find((section) => section.id === overlay.section);
    if (!doc || !target) continue; // kayıtlı kaynak belgesi yoksa kural gösterilmez
    const row = item(overlay.label, overlay.value, { known: overlay.known, source: { name: overlay.source.name, location: overlay.source.location, checkedAt: overlay.source.checkedAt, url: doc.url } });
    const at = target.items.findIndex((entry) => entry.label === overlay.label);
    if (at >= 0) target.items[at] = row; else target.items.push(row);
  }

  return { id: template.id, identity, status, sections: out, documents, guideVersion: 1 };
}
