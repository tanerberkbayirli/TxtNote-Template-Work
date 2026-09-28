// Deterministic real-browser fixtures for the Batch B engine extensions (custom templates, no university).
//
// usage: node tests/batchb-fixture.mjs <scenario> <out.json>
//        THESIS_FIXTURE_PAGE=/tests/thesis-batchb.html node ../../orchestration/tools/export.mjs <out.json> <prefix>
// The fixture carries its template (`__template`); thesis-batchb-fixture.jsx serves it to the real ThesisEditor.
import { writeFile } from "node:fs/promises";
import { deflateSync } from "node:zlib";
import generic from "../src/thesis/templates/generic.js";

function png(width, height, paint) {
  const table = Array.from({ length: 256 }, (_, n) => { let c = n; for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c >>> 0; });
  const crc = (buf) => { let c = 0xffffffff; for (const b of buf) c = table[(c ^ b) & 0xff] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
  const chunk = (type, data) => { const len = Buffer.alloc(4); len.writeUInt32BE(data.length); const td = Buffer.concat([Buffer.from(type), data]); const c = Buffer.alloc(4); c.writeUInt32BE(crc(td)); return Buffer.concat([len, td, c]); };
  const raw = Buffer.alloc((width * 3 + 1) * height);
  for (let y = 0; y < height; y += 1) for (let x = 0; x < width; x += 1) { const [r, g, b] = paint(x, y); const o = y * (width * 3 + 1) + 1 + x * 3; raw[o] = r; raw[o + 1] = g; raw[o + 2] = b; }
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(width, 0); ihdr.writeUInt32BE(height, 4); ihdr[8] = 8; ihdr[9] = 2;
  return `data:image/png;base64,${Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk("IHDR", ihdr), chunk("IDAT", deflateSync(raw)), chunk("IEND", Buffer.alloc(0))]).toString("base64")}`;
}
export const IMAGE = png(300, 150, (x, y) => (x > 40 && x < 260 && y > 30 && y < 120 ? [31, 78, 121] : [221, 231, 243]));
export const P = (text) => `<p>${text}</p>`;
export const S = "Çevrimiçi öğrenme ortamlarında öğretmen adaylarının dijital okuryazarlık düzeyleri; öz yeterlik ve erişim olanakları açısından ayrıntılı biçimde incelenmiştir.";
export const paras = (count, tag, n = 2) => Array.from({ length: count }, (_, i) => P(`${tag} ${i + 1}. ${Array.from({ length: n }, () => S).join(" ")}`)).join("");
export const figure = (caption, kind = "") => `<figure class="academic-figure" data-kind="figure"${kind ? ` data-caption-kind="${kind}"` : ""} contenteditable="false"><img width="300" height="150" src="${IMAGE}" alt=""><figcaption>${caption}</figcaption></figure>`;
export const table = (caption, head, rows) => `<div class="academic-table-wrap" data-academic-table="true"><table class="academic-table" data-kind="table"><caption>${caption}</caption><thead><tr>${head.map((h) => `<th>${h}</th>`).join("")}</tr></thead><tbody>${rows.map((row) => `<tr>${row.map((cell) => `<td>${cell}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`;
export const fn = (id, text) => `<sup class="academic-footnote" contenteditable="false" data-fn-id="${id}" data-fn-text="${text}">1</sup>`;

/** Generic template without cover/abstract, plus optional generated lists, edited by `patch`. */
export function baseTemplate(id, patch = () => {}) {
  const t = structuredClone(generic);
  t.id = id; t.status = "demo"; t.source = { type: "manual", documentName: "Batch B test" };
  t.sections = t.sections.filter((s) => !["cover", "abstract", "bibliography", "appendices"].includes(s.id));
  for (const s of t.sections) if (s.overrides?.page?.numbering) s.overrides.page.numbering.format = "arabic";
  patch(t);
  return t;
}
export function documentFor(template, content, extra = {}) {
  return {
    title: "Batch B", content, __template: template,
    researchData: { thesis: { templateId: template.id, templateVersion: template.templateVersion, selection: { universityId: template.universityId, degreeType: template.degreeType, language: template.language }, values: { YEAR: "2026" }, sectionContent: extra.sectionContent || {}, enabledSections: template.sections.filter((s) => s.status === "optional").map((s) => s.id) } },
  };
}

const scenarios = {
  // B1: photographs are a caption kind ("Resim 1.1") with their own list.
  photo() {
    const t = baseTemplate("batchb-photo-v1", (t) => {
      t.captionKinds = { photo: { ...structuredClone(t.figures), label: "Resim", position: "below", numbering: { scope: "chapter", format: "{chapter}.{n}", sequence: "arabic" }, labelFormat: "{label} {number}", labelStyle: { fontWeight: 700 }, hangingIndent: "label" } };
      t.figures.labelFormat = "{label} {number}"; t.figures.labelStyle = { fontWeight: 700, italic: false };
      t.sections.push({ id: "index-photos", type: "listOfPhotos", title: "RESİMLER DİZİNİ", status: "optional", order: 2.3, group: "front", mode: "generated", generatedIndex: { kind: "photo" }, overrides: { page: { numbering: { format: "arabic" } } } });
    });
    const body = `<h1>Giriş</h1>${paras(1, "A")}${figure("Kavramsal model")}${figure("Örnek fotoğraf çekimi", "photo")}${figure("İkinci fotoğraf: uzun açıklama satırı, etiket genişliğinden sonra hizalanmalıdır ve ikinci satıra taşmalıdır", "photo")}<h1>Yöntem</h1>${figure("Akış şeması")}${figure("Alan çalışması", "photo")}${paras(1, "B")}`;
    return documentFor(t, body);
  },
  // B2: a multi-page table (header row repeats natively) with a continuation caption.
  continuation() {
    const t = baseTemplate("batchb-continuation-v1", (t) => {
      t.tables.labelFormat = "{label} {number}"; t.tables.labelStyle = { fontWeight: 700, italic: false };
      t.tables.numbering = { scope: "chapter", format: "{chapter}.{n}", sequence: "arabic" };
      t.tables.continuation = { format: "{label} {number} (Devam) {title}" };
    });
    const rows = Array.from({ length: 120 }, (_, i) => [`Madde ${i + 1}`, ["A", "B", "C"][i % 3], String(10 + ((i * 7) % 50)), `${(i * 1.7 + 3).toFixed(1).replace(".", ",")}`]);
    const head = ["Değişken", "Grup", "f", "%"];
    const body = `<h1>Bulgular</h1>${paras(2, "A")}${table("Ölçek maddelerine ilişkin betimsel istatistikler ve ayrıntılı açıklamalar", head, rows)}${paras(2, "B")}${table("Kısa tablo", head, rows.slice(0, 4))}<h1>Sonuç</h1>${table("Küçük tablo", head, rows.slice(0, 3))}`;
    return documentFor(t, body);
  },
  // B3: numbered display equations, centered with the number flush right, per-chapter counter.
  equation() {
    const t = baseTemplate("batchb-equation-v1", (t) => { t.equations = { numbering: { scope: "chapter", format: "({chapter}.{n})" }, numberAlign: "right", style: { fontFamily: "Cambria Math", fontSizePt: 12 } }; });
    const eq = (latex, numbered = true) => `<span class="math-formula math-formula--block" data-display="block" data-latex="${latex}"${numbered ? ' data-eq-numbered="true"' : ""}>${latex}</span>`;
    const body = `<h1>Giriş</h1>${paras(1, "A")}${eq("E = mc^2")}${P("Metin arası.")}${eq("a^2 + b^2 = c^2")}${eq("x = \\frac{a}{b}", false)}<h1>Yöntem</h1>${paras(1, "B")}${eq("\\sum_{i=1}^{n} i = \\frac{n(n+1)}{2}")}${P("Denklem (2.1) yukarıdadır.")}`;
    return documentFor(t, body);
  },
  // B4: "BİRİNCİ BÖLÜM" on its own line above the (uppercase) chapter title, five heading levels, TOC rows.
  ordinal() {
    const t = baseTemplate("batchb-ordinal-v1", (t) => {
      const heading = (level, numbering, extra = {}) => ({ ...structuredClone(t.typography.headings["2"]), fontSizePt: 12, spaceBeforePt: 6, spaceAfterPt: 6, lineHeight: 1.15, align: "left", numbering, ...extra });
      t.typography.headings = {
        1: heading(1, { enabled: true, format: "{1} BÖLÜM", sequence: "ordinal-tr-upper", placement: "ownLine" }, { align: "center", textTransform: "uppercase", spaceBeforePt: 12, spaceAfterPt: 12, pageBreakBefore: true }),
        2: heading(2, { enabled: true, format: "{2}." }), 3: heading(3, { enabled: true, format: "{2}.{3}." }, { fontWeight: 400 }),
        4: heading(4, { enabled: true, format: "{2}.{3}.{4}." }), 5: heading(5, { enabled: true, format: "{2}.{3}.{4}.{5}." }, { fontWeight: 400 }),
      };
      t.toc.levels = [1, 2, 3, 4, 5];
      t.sections.find((s) => s.id === "toc").generatedIndex = { kind: "toc", matchHeadingTransform: true, levelStyles: { 1: { align: "center", includePageNumber: false, fontWeight: 700, spaceBeforePt: 12, spaceAfterPt: 12 } }, indentMm: 0 };
    });
    const chapter = (title, n) => `<h1>${title}</h1>${paras(1, `${n}.0`, 1)}<h2>Alt başlık ${n}</h2>${paras(1, `${n}.1`, 1)}<h3>Üçüncü düzey</h3><h4>Dördüncü Düzey Başlık</h4><h5>Beşinci Düzey Başlık</h5>${paras(1, `${n}.5`, 1)}`;
    return documentFor(t, [["Kuramsal çerçeve", 1], ["Yöntem", 2], ["Bulgular ve tartışma", 3]].map(([title, n]) => chapter(title, n)).join(""));
  },
};
if (process.argv[1] && process.argv[1].endsWith("batchb-fixture.mjs")) {
  const [name, out] = process.argv.slice(2);
  if (!scenarios[name] || !out) { console.error(`usage: batchb-fixture.mjs <${Object.keys(scenarios).join("|")}> <out.json>`); process.exit(2); }
  await writeFile(out, JSON.stringify(scenarios[name](), null, 1));
  console.log(`fixture ${name} -> ${out}`);
}
export { scenarios };
