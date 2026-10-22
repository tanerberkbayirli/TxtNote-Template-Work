// Deterministic validation document for any registered thesis template.
//
// usage: node engine/tools/make-fixture.mjs <registryId> <out.json> [overrides.json]
//
// Every editable section of the template receives deterministic content chosen by its
// section `type`; every placeholder receives a deterministic value (overrides.json may
// set `values`, `sectionContent`, `content`, `title`, `enabledSections`). The main body
// has 5 chapters with H1–H4, short/long/multi-page paragraphs, lists, a short and a
// multi-page table, figures, an equation, footnotes and citations, so cumulative
// spacing errors show up as pagination drift.
import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath, pathToFileURL } from "node:url";
import { deflateSync } from "node:zlib";

const root = fileURLToPath(new URL("../..", import.meta.url));
const { THESIS_TEMPLATE_REGISTRY } = await import(pathToFileURL(`${root}/engine/src/registry.js`).href);

const [registryId, out, overridesPath] = process.argv.slice(2);
if (!registryId || !out) { console.error("usage: make-fixture.mjs <registryId> <out.json> [overrides.json]"); process.exit(2); }
const descriptor = THESIS_TEMPLATE_REGISTRY.find((entry) => entry.id === registryId);
if (!descriptor) { console.error(`unknown registry id ${registryId}`); process.exit(2); }
const module = await descriptor.load();
const template = module.default ?? module;
const overrides = overridesPath ? JSON.parse(await readFile(overridesPath, "utf8")) : {};
const tr = template.language !== "en";

// ---- deterministic 420×210 PNG (three bars on a light background), no canvas needed
function png(width, height, paint) {
  const crcTable = Array.from({ length: 256 }, (_, n) => { let c = n; for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c >>> 0; });
  const crc = (buf) => { let c = 0xffffffff; for (const b of buf) c = crcTable[(c ^ b) & 0xff] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
  const chunk = (type, data) => { const len = Buffer.alloc(4); len.writeUInt32BE(data.length); const td = Buffer.concat([Buffer.from(type), data]); const c = Buffer.alloc(4); c.writeUInt32BE(crc(td)); return Buffer.concat([len, td, c]); };
  const raw = Buffer.alloc((width * 3 + 1) * height);
  for (let y = 0; y < height; y += 1) { raw[y * (width * 3 + 1)] = 0; for (let x = 0; x < width; x += 1) { const [r, g, b] = paint(x, y); const o = y * (width * 3 + 1) + 1 + x * 3; raw[o] = r; raw[o + 1] = g; raw[o + 2] = b; } }
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(width, 0); ihdr.writeUInt32BE(height, 4); ihdr[8] = 8; ihdr[9] = 2; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  return `data:image/png;base64,${Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk("IHDR", ihdr), chunk("IDAT", deflateSync(raw)), chunk("IEND", Buffer.alloc(0))]).toString("base64")}`;
}
const bars = [[20, 130, 40, [31, 78, 121]], [155, 255, 70, [192, 57, 43]], [290, 400, 20, [46, 139, 87]]];
const IMAGE = png(420, 210, (x, y) => { for (const [a, b, top, color] of bars) if (x >= a && x < b && y >= top && y < 200) return color; return [221, 231, 243]; });

// ---- text building blocks (deterministic)
const P = (text) => `<p>${text}</p>`;
const fn = (id, text) => `<sup class="academic-footnote" contenteditable="false" data-fn-id="${id}" data-fn-text="${text}">1</sup>`;
const figure = (caption, kind = "") => `<figure class="academic-figure" data-kind="figure"${kind ? ` data-caption-kind="${kind}"` : ""} contenteditable="false"><img width="420" height="210" src="${IMAGE}" alt=""><figcaption>${caption}</figcaption></figure>`;
const table = (caption, head, rows) => `<div class="academic-table-wrap" data-academic-table="true"><table class="academic-table" data-kind="table"><caption>${caption}</caption><thead><tr>${head.map((h) => `<th>${h}</th>`).join("")}</tr></thead><tbody>${rows.map((row) => `<tr>${row.map((cell) => `<td>${cell}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`;
const pageBreak = `<div class="academic-page-break" data-academic-page-break="true"></div>`;
const equation = `<span class="math-formula math-formula--block" data-display="block" data-latex="E = mc^2" data-eq-numbered="true">(E = mc^2)</span>`;
const S_TR = "Çevrimiçi öğrenme ortamlarında öğretmen adaylarının dijital okuryazarlık düzeyleri; öz yeterlik, erişim olanakları ve ölçme araçlarının güvenirliği açısından ayrıntılı biçimde incelenmiştir.";
const S_EN = "The digital literacy levels of pre-service teachers in online learning environments were examined in detail with respect to self-efficacy, access and the reliability of measurement instruments.";
const S = tr ? S_TR : S_EN;
const CHARS = "Işık, ığdır, şişe, ÇĞİÖŞÜ çğıöşü karakterleri doğru görünmelidir.";
const para = (tag, i, n = 2) => P(`${tag} ${i}. ${Array.from({ length: n }, () => S).join(" ")} ${CHARS}`);
const paras = (count, tag, n = 2) => Array.from({ length: count }, (_, i) => para(tag, i + 1, n)).join("");
const cite = (tr ? "(Karasar, 2020, s. 45)" : "(Karasar, 2020, p. 45)");
const L = tr
  ? { ch: ["Kuramsal Çerçeve", "Yöntem", "Bulgular", "Tartışma", "Sonuç ve Öneriler"], sub: "Alt Başlık", fig: "Dijital okuryazarlık boyutları", figLong: "Araştırma sürecinin aşamaları: veri toplama, çözümleme, raporlama ve bulguların uzman görüşleriyle karşılaştırılarak doğrulanması adımlarını gösteren ayrıntılı akış şeması", tab: "Katılımcıların demografik özellikleri", tabLong: "Ölçek maddelerine ilişkin betimsel istatistikler (çok sayfalı tablo)", head: ["Değişken", "Grup", "f", "%"], ul: ["Birinci madde", "İkinci madde", "Üçüncü madde"], ol: ["Veri toplandı", "Veri çözümlendi", "Sonuçlar raporlandı"] }
  : { ch: ["Theoretical Framework", "Method", "Findings", "Discussion", "Conclusion and Recommendations"], sub: "Subheading", fig: "Dimensions of digital literacy", figLong: "Stages of the research process: data collection, analysis, reporting and the verification of findings against expert opinion, shown as a detailed flow chart", tab: "Demographic characteristics of the participants", tabLong: "Descriptive statistics of the scale items (multi-page table)", head: ["Variable", "Group", "f", "%"], ul: ["First item", "Second item", "Third item"], ol: ["Data were collected", "Data were analysed", "Results were reported"] };
const list = (tag, items) => `<${tag}>${items.map((item) => `<li>${item}</li>`).join("")}</${tag}>`;
const longRows = Array.from({ length: 45 }, (_, i) => [`${tr ? "Madde" : "Item"} ${i + 1}`, ["A", "B", "C"][i % 3], String(10 + ((i * 7) % 50)), `${(i * 1.7 + 3).toFixed(1).replace(".", tr ? "," : ".")}`]);

function mainBody() {
  const parts = [];
  L.ch.forEach((title, c) => {
    const n = c + 1;
    parts.push(`<h1>${title}</h1>`, paras(2, `${n}.0`), P(`${S} ${cite}${fn(`f${n}`, `${tr ? "Açıklama dipnotu" : "Explanatory footnote"} ${n}: ${S}`)} ${S}`));
    parts.push(`<h2>${L.sub} ${n}.1</h2>`, paras(2, `${n}.1`), `<h3>${L.sub} ${n}.1.1</h3>`, paras(1, `${n}.1.1`), `<h4>${L.sub} ${n}.1.1.1</h4>`, P(tr ? "Kısa paragraf." : "Short paragraph."));
    if (c === 0) parts.push(list("ul", L.ul), list("ol", L.ol), figure(L.fig), P(S), table(L.tab, L.head, [["Cinsiyet", "Kadın", "64", "53,3"], ["", "Erkek", "56", "46,7"], ["Sınıf", "3", "70", "58,3"], ["", "4", "50", "41,7"]]));
    if (c === 1) parts.push(P(`${S}`), equation, P(S), figure(L.figLong));
    if (c === 3 && template.captionKinds?.photo) parts.push(P(S), figure(tr ? "Deney düzeneğinin fotoğrafı" : "Photograph of the experimental set-up", "photo"), P(S));
    if (c === 0 && template.typography?.paragraphStyles?.tableNote) parts.push(`<p data-thesis-style="tableNote">${tr ? "Not: Yüzdeler sütun toplamına göre hesaplanmıştır." : "Note: Percentages are column-based."}</p>`);
    if (c === 2) parts.push(P(Array.from({ length: 14 }, () => S).join(" ")), table(L.tabLong, L.head, longRows));
    parts.push(`<h2>${L.sub} ${n}.2</h2>`, paras(3, `${n}.2`, 3));
  });
  return parts.join("");
}

const bibliography = [
  "Gilster, P. (1997). <i>Digital literacy</i>. Wiley.",
  "Karasar, N. (2020). <i>Bilimsel araştırma yöntemi</i> (35. baskı). Nobel Yayıncılık.",
  "Özdemir, Ş. ve Işık, Ç. (2024). Öğretmen adaylarının dijital okuryazarlığı ve çevrimiçi öğrenme ortamlarında öz yeterlik algılarının çok boyutlu incelenmesi. <i>Eğitim ve Bilim, 49</i>(1), 1–20. https://doi.org/10.15390/EB.2024.00001",
  "Yıldırım, A. ve Şimşek, H. (2021). <i>Sosyal bilimlerde nitel araştırma yöntemleri</i> (12. baskı). Seçkin Yayıncılık.",
].map(P).join("");

/** Content for one editable section, chosen by its type (never by university). */
function sectionHtml(section) {
  const t = section.type;
  if (t === "mainContent") return null;
  if (t === "abstract") return paras(2, tr ? "Özet" : "Abstract", 2);
  if (t === "englishAbstract") return P(`Abstract 1. ${S_EN}`) + P(`Abstract 2. ${S_EN} ${S_EN}`);
  if (t === "preface" || t === "acknowledgements") return paras(2, tr ? "Önsöz" : "Preface", 1);
  if (t === "dedication") return P(tr ? "Aileme" : "To my family");
  if (t === "listOfSymbols" || t === "listOfAbbreviations") return P("<b>Simgeler</b>") + [["f", "Frekans"], ["%", "Yüzde"], ["α", "Anlamlılık düzeyi; bu tanım iki satıra yayılacak kadar uzun tutulmuştur ki asılı girinti görülebilsin"]].map(([a, b]) => P(`${a}\t${b}`)).join("") + P("") + P("<b>Kısaltmalar</b>") + [["BAP", "Bilimsel Araştırma Projeleri"], ["ÖSYM", "Ölçme, Seçme ve Yerleştirme Merkezi"]].map(([a, b]) => P(`${a}\t${b}`)).join("");
  if (t === "bibliography") return bibliography;
  if (t === "appendices") return P(tr ? "<b>EK 1.</b> Dijital Okuryazarlık Ölçeği" : "APPENDIX 1. Digital Literacy Scale") + P(S) + pageBreak + P(tr ? "<b>EK 2.</b> Etik Kurul Onayı" : "APPENDIX 2. Ethics Committee Approval") + P(S);
  // Colons at 50 mm with Word's default 12.5 mm tab stops; education rows start one tab in.
  if (t === "curriculumVitae") return tr ? ["Adı Soyadı\t\t\t: Çağrı Şükrü ÖZDOĞAN", "Doğum Yeri ve Tarihi\t\t: Afyonkarahisar, 01.01.1995", "Yabancı Dili\t\t\t: İngilizce", "İletişim (Telefon / e-posta)\t: 0 555 000 00 00 / ornek@aku.edu.tr", "Eğitim Durumu (Kurum ve Yıl)", "\tLise\t\t\t: Afyon Anadolu Lisesi, 2013", "\tLisans\t\t\t: Afyon Kocatepe Üniversitesi, Fen Fakültesi, 2018"].map(P).join("") : P(S);
  if (t === "introduction") return paras(3, tr ? "Giriş" : "Introduction") + P(`${S}${fn("fi", tr ? "Giriş dipnotu." : "Introduction footnote.")}`);
  if (t === "conclusion") return paras(2, tr ? "Sonuç" : "Conclusion");
  return paras(1, section.title || t);
}

function placeholderValue(key, definition) {
  const known = {
    YEAR: "2026", STUDENT_NAME: "Çağrı Şükrü ÖZDOĞAN", STUDENT_NUMBER: "220101001", DEPARTMENT_NAME: tr ? "Eğitim Bilimleri" : "Educational Sciences", DEPARTMENT_NAME_EN: "Educational Sciences",
    PROGRAM_NAME: tr ? "Eğitim Programları ve Öğretim" : "Curriculum and Instruction", ADVISOR_TITLE: "Doç. Dr.", ADVISOR_NAME: "İlknur ÇİÇEK", CO_ADVISOR_TITLE: "Dr. Öğr. Üyesi", CO_ADVISOR_NAME: "Gökhan IŞIK",
    CITY: "Afyonkarahisar", KEYWORDS: "dijital okuryazarlık, çevrimiçi öğrenme, öğretmen adayı, öz yeterlik, uzaktan eğitim", KEYWORDS_EN: "digital literacy, online learning, pre-service teacher, self-efficacy, distance education",
    DEFENSE_MONTH: "Ocak", DEFENSE_YEAR: "2026", DECISION: "oy birliği", SIGN_DATE: "15 / 01 / 2026", INSTITUTE_DIRECTOR: "Prof. Dr. Ahmet YILDIZ",
    ADVISOR_TITLE_EN: "Assoc. Prof.", CO_ADVISOR_TITLE_EN: "Asst. Prof.", PROJECT_NUMBER: "26.FEN.01", PROJECT_FUNDER: "BAP",
    THESIS_TITLE_EN: "Examining The Digital Literacy Levels Of Pre-Service Teachers In Online Learning Environments", MONTH: tr ? "Ocak" : "January",
  };
  if (definition.derived) return undefined;
  if (known[key] !== undefined) return known[key];
  if (definition.defaultValue !== undefined) return definition.defaultValue;
  if (key === "DEFENSE_DATE" && definition.type !== "date") return "15 / 01 / 2026";
  // Jury rows: five by default, rows 6-7 (doctorate with a second advisor) only for doctoral templates.
  const juror = key.match(/^JURY_(\d+)_(TITLE_NAME|AFFILIATION)$/);
  if (juror) return Number(juror[1]) > 5 && template.degreeType !== "phd" ? undefined : juror[2] === "AFFILIATION" ? `Örnek Üniversitesi, Fen Fakültesi ${juror[1]}` : `Prof. Dr. Jüri ÜYESİ ${juror[1]}`;
  if (definition.type === "date") return "2026-01-15";
  if (definition.type === "number") return "1";
  if (/MEMBER|JURY|JURI/.test(key)) return /TITLE/.test(key) ? "Prof. Dr." : `Üye ${key.replace(/\D/g, "") || "1"} ADI SOYADI`;
  if (/TITLE/.test(key)) return "Prof. Dr.";
  if (/NAME/.test(key)) return "Ayşe YILMAZ";
  return `${definition.label || key}`;
}

const values = {};
for (const [key, definition] of Object.entries(template.placeholders || {})) {
  const value = placeholderValue(key, definition);
  if (value !== undefined) values[key] = value;
}
const sectionContent = {};
const enabledSections = [];
for (const section of template.sections) {
  if (section.status === "optional") enabledSections.push(section.id);
  const mode = section.mode || (section.editable === false ? "static" : section.blocks || section.content ? "static" : "editable");
  if (mode !== "editable") continue;
  const html = sectionHtml(section);
  if (html !== null && section.type !== "mainContent") sectionContent[section.id] = html;
}
const doc = {
  title: tr ? "Çevrimiçi Öğrenme Ortamlarında Öğretmen Adaylarının Dijital Okuryazarlık Düzeylerinin İncelenmesi" : "Examining the Digital Literacy Levels of Pre-Service Teachers in Online Learning Environments",
  content: mainBody(),
  researchData: {
    thesis: {
      templateId: template.id, templateVersion: template.templateVersion,
      selection: { universityId: template.universityId, instituteId: template.instituteId, degreeType: template.degreeType, language: template.language, ...(template.selectors || {}) },
      values: { ...values, ...(overrides.values || {}) },
      sectionContent: { ...sectionContent, ...(overrides.sectionContent || {}) },
      enabledSections: overrides.enabledSections || enabledSections,
      ...(overrides.captionNumbering ? { captionNumbering: overrides.captionNumbering } : {}),
    },
  },
};
// Fixture titles that fit the reviewed layouts (AKÜ FBE: a two-line title on the covers and in the abstracts).
const TITLES = { "aku-fbe-": "Dijital Okuryazarlık Düzeylerinin Çevrimiçi Öğrenme Ortamlarına Etkisi" };
const titled = Object.entries(TITLES).find(([prefix]) => registryId.startsWith(prefix));
if (titled && tr) doc.title = titled[1];
// AKÜ types the English title in capitals (no case transform: Turkish casing would turn i into İ).
if (registryId.startsWith("aku-fbe-")) { const v = doc.researchData.thesis.values; Object.assign(v, { DEPARTMENT_NAME: "Biyoloji", DEPARTMENT_NAME_EN: "Biology" }); v.THESIS_TITLE_EN = String(v.THESIS_TITLE_EN || "").toUpperCase(); }
if (overrides.title) doc.title = overrides.title;
if (overrides.content) doc.content = overrides.content;
await writeFile(out, JSON.stringify(doc, null, 1));
console.log(`fixture ${registryId} → ${out} (${Object.keys(sectionContent).length} editable sections, ${Object.keys(values).length} values)`);
