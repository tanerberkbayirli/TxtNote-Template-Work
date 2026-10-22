// Builds the "Rehber" content from the active thesis template, so every rule
// shown to the writer is read from that template instead of being generic.

const ORDINALS_TR = ["", "BİRİNCİ", "İKİNCİ", "ÜÇÜNCÜ", "DÖRDÜNCÜ", "BEŞİNCİ", "ALTINCI", "YEDİNCİ", "SEKİZİNCİ", "DOKUZUNCU", "ONUNCU"];
const ROMAN_UPPER = ["", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"];

const num = (value) => (typeof value === "number" && Number.isFinite(value) ? String(value).replace(".", ",") : null);
const mm = (value) => num(value) && `${num(value)} mm`;

export function headingNumberExample(rule) {
  const numbering = rule?.numbering;
  if (!numbering?.enabled || !numbering.format) return null;
  const first = numbering.sequence === "ordinal-tr-upper" ? ORDINALS_TR[1] : numbering.sequence === "roman-upper" ? ROMAN_UPPER[1] : "1";
  return numbering.format.replace(/\{(\d)\}/g, (_, level) => (level === "1" || numbering.format.startsWith("{1}") ? first : "1"));
}

function describeHeading(level, rule) {
  const bits = [];
  const example = headingNumberExample(rule);
  bits.push(example ? `numara “${example}”${rule.numbering.placement === "ownLine" ? " (ayrı satırda)" : ""}` : "numarasız");
  if (rule.textTransform === "uppercase") bits.push("BÜYÜK HARF");
  else if (rule.textTransform === "capitalize") bits.push("Her Sözcük Büyük Harfle");
  if (rule.fontWeight >= 600) bits.push("kalın");
  if (rule.fontSizePt) bits.push(`${num(rule.fontSizePt)} punto`);
  bits.push({ center: "ortalı", left: "sola yaslı", justify: "iki yana yaslı", right: "sağa yaslı" }[rule.align] || null);
  if (rule.pageBreakBefore) bits.push("yeni sayfada başlar");
  return { label: `Başlık ${level}`, value: bits.filter(Boolean).join(" · ") };
}

function captionRule(kind, rule, defaultLabel) {
  if (!rule) return null;
  const label = rule.label || defaultLabel;
  const scope = rule.numbering?.scope;
  const example = scope === "chapter" ? `${label} 1.1` : `${label} 1`;
  const place = rule.position === "above" ? "üstüne" : "altına";
  return `${kind} açıklaması ${place} yazılır; numaralandırma ${scope === "chapter" ? "bölüme göre" : "belge boyunca"} sürer (ör. ${example}).`;
}

function citationGuide(template) {
  const bibliography = template.bibliography || {};
  const style = String(bibliography.citationStyle || "").trim();
  const lower = style.toLowerCase();
  const bibStyle = bibliography.style || {};
  const typography = [];
  if (bibStyle.fontSizePt) typography.push(`${num(bibStyle.fontSizePt)} punto`);
  if (bibStyle.lineHeight) typography.push(bibStyle.lineHeight === 1 ? "tek satır aralığı" : `${num(bibStyle.lineHeight)} satır aralığı`);
  const hanging = bibStyle.hangingIndentMm || bibliography.hangingIndentMm;
  if (hanging) typography.push(`sarkık girinti ${mm(hanging)}`);
  if (num(bibStyle.spaceAfterPt)) typography.push(`kaynaklar arası ${num(bibStyle.spaceAfterPt)} nk`);

  let method;
  let numeric = false;
  if (lower === "numeric") {
    numeric = true;
    method = "Metin içinde (1), (2) biçiminde sayısal atıf kullanılır. Numaralar kaynakların metinde ilk geçiş sırasını izler; Kaynaklar panelinde kayıtlar bu sırayla tutulur.";
  } else if (lower === "vancouver") {
    method = "Vancouver: kaynaklar metinde geçiş sırasına göre numaralanır. Bu şablonda numaraları hem metinde hem kaynakçada siz tutarlı biçimde yazarsınız; uygulama otomatik numaralamaz.";
  } else if (lower) {
    method = `${style === "author-year" || style === "author-date" ? "Yazar-yıl" : style} atıf biçimi kullanılır: metin içinde (Yılmaz, 2024, s. 18) gibi yazar ve yıl verilir, ayrıntı kaynakçada yer alır. Kaynaklar panelinden metin içi atıf veya dipnot atfı ekleyebilirsiniz.`;
  } else {
    method = "Şablon belirli bir atıf biçimi tanımlamıyor. Danışmanınızın istediği biçimi seçin ve tüm metinde tutarlı kullanın.";
  }
  return { heading: bibliography.heading || "Kaynakça", method, typography: typography.join(" · "), numeric };
}

export function buildThesisGuide(template) {
  if (!template) return null;
  const page = template.page || {};
  const margins = page.margins || {};
  const body = template.typography?.body || {};
  const headings = template.typography?.headings || {};
  const sections = template.sections || [];
  const citation = citationGuide(template);

  const degree = { master: "Yüksek Lisans", doctorate: "Doktora", phd: "Doktora", undergraduate: "Lisans", specialization: "Uzmanlık" }[template.degreeType];
  const title = template.displayName || [template.universityName, template.instituteName, degree].filter(Boolean).join(" · ") || "Tez şablonu";

  const layout = [];
  if (page.size) layout.push({ label: "Sayfa", value: `${page.size}${page.orientation === "landscape" ? " yatay" : ""}` });
  if (num(margins.topMm) && num(margins.leftMm)) {
    layout.push({ label: "Kenar boşlukları", value: `üst ${num(margins.topMm)} · alt ${num(margins.bottomMm)} · sol ${num(margins.leftMm)} · sağ ${num(margins.rightMm)} mm` });
  }
  const text = [body.fontFamily, body.fontSizePt && `${num(body.fontSizePt)} punto`].filter(Boolean).join(" ");
  if (text) layout.push({ label: "Metin", value: text });
  if (body.lineHeight) layout.push({ label: "Satır aralığı", value: body.lineHeight === 1 ? "Tek" : num(body.lineHeight) });
  layout.push({ label: "Paragraf", value: [body.align === "justify" ? "iki yana yaslı" : body.align === "left" ? "sola yaslı" : null, body.firstLineIndentMm ? `ilk satır girintisi ${mm(body.firstLineIndentMm)}` : "ilk satır girintisi yok"].filter(Boolean).join(" · ") });
  const pn = page.numbering;
  if (pn?.enabled) {
    layout.push({ label: "Sayfa numarası", value: `${pn.format === "roman-lower" ? "küçük Romen rakamı (i, ii…)" : "Arap rakamı"} · ${pn.position === "top" ? "üstte" : "altta"}${pn.align === "center" ? " ortada" : pn.align === "right" ? " sağda" : ""}` });
  }

  const headingRules = Object.keys(headings).sort().slice(0, 4).map((level) => describeHeading(level, headings[level]));

  const captions = [
    captionRule("Tablo", template.tables, "Tablo"),
    captionRule("Şekil", template.figures, "Şekil"),
    template.equations?.numbering ? `Denklemler ${template.equations.numbering.scope === "chapter" ? "bölüme göre" : "belge boyunca"} numaralanır; numara denklemin ${template.equations.numberAlign === "left" ? "soluna" : "sağına"} yazılır.` : null,
  ].filter(Boolean);

  const unique = (items) => [...new Set(items)];
  const sectionName = (section) => ({ abstract: "Özet", englishAbstract: "Abstract", mainContent: "Ana metin (bölümler)" }[section.type] || section.title);
  const writing = sections.filter((section) => section.mode === "editable" && section.title);
  const writable = unique(writing.map(sectionName)).map((name) => ({
    name,
    optional: writing.filter((section) => sectionName(section) === name).every((section) => section.status === "optional"),
  }));
  const generated = unique(sections.filter((section) => section.mode === "generated" && section.title).map((section) => section.title));
  const infoLabels = { outerCover: "dış kapak", innerCover: "iç kapak", approval: "onay sayfası", declaration: "beyan sayfası", ethicsDeclaration: "etik beyanı" };
  const infoPages = unique(sections.filter((section) => section.mode === "static" && infoLabels[section.type]).map((section) => infoLabels[section.type]));

  const main = sections.find((section) => section.type === "mainContent");
  const expected = (template.validation?.[main?.id]?.headingSequence || []).map((group) => (Array.isArray(group) ? group[0] : group));
  const fieldRules = Object.values(template.validation || {}).map((rule) => rule?.message).filter(Boolean);

  const toc = template.toc?.heading;
  return { title, layout, headingRules, captions, citation, writable, generated, infoPages, expected, fieldRules, tocHeading: toc || null };
}
