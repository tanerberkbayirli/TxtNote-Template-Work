// Suggest the generation profile of an official source (orchestration/motor/ALTYAPI.md, "Üretim hattı").
//
// usage: node engine/tools/profile-suggest.mjs --extracted <target.extracted.json> --identity <identity.json> [--out <profile.json>]
//
// spec2template.mjs needs a profile: which paragraph is the body text, the headings, the captions, where each section starts, which
// rendered page holds a fixed page. Until now a person chose these paragraph numbers by hand. This tool reads them from the extracted
// source (docx2spec.py output with the verified Word render): paragraph text and styles, the section properties, and the lines Word
// drew on each page. It never invents a role: a role the generation cannot do without and that it cannot find is listed in `missing`
// (the tool stops); an optional role it does not find (a fixed page this template simply does not have, a fourth heading level) is
// listed in `absent`; and everything it picked is
// listed with the reason in `evidence`, so a person only has to look at what is flagged.
//
// What it cannot know and takes from `--identity`: university, institute, degree, language, template id.
// Heuristics (all generic, none depends on a university): headings by style name ("Heading N" / "Başlık N") or by their number
// ("1.", "2.1.", "2.1.1."); table-of-contents lines by their dot leaders; section titles by a Turkish/English vocabulary of the
// section types the engine knows; fixed pages (cover, approval, ethics declaration) by the standalone line Word drew.
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

const collapse = (text) => String(text ?? "").replace(/\s+/g, " ").trim();
const upper = (text) => collapse(text).toLocaleUpperCase("tr");
const squash = (text) => collapse(text).replace(/\s/g, "").toLocaleLowerCase("tr");
const isTocLine = (text) => /[…]{3,}|\.{4,}/.test(text) || /\t\s*\d+\s*$/.test(text);

// Section vocabulary: the section types the engine knows, with the ids used for them in profiles. `kind`: "title" = a title paragraph
// followed by text, "index" = a generated list (no text of its own).
const TITLES = [
  { id: "thanks", type: "acknowledgements", pattern: /^(TEŞEKKÜR|ÖNSÖZ VE TEŞEKKÜR|TEŞEKKÜR VE ÖNSÖZ|ACKNOWLEDG?E?MENTS?)$/ },
  { id: "preface", type: "preface", pattern: /^(ÖNSÖZ|PREFACE|FOREWORD)$/ },
  { id: "toc", type: "tableOfContents", indexKind: "toc", pattern: /^(İÇİNDEKİLER|CONTENTS|TABLE OF CONTENTS)$/ },
  { id: "symbols", type: "listOfAbbreviations", pattern: /^(SİMGELER VE KISALTMALAR( DİZİNİ| LİSTESİ)?|KISALTMALAR( DİZİNİ| LİSTESİ)?|SİMGELER( DİZİNİ| LİSTESİ)?|SYMBOLS AND ABBREVIATIONS|LIST OF ABBREVIATIONS|ABBREVIATIONS)$/ },
  { id: "figures", type: "listOfFigures", indexKind: "figures", pattern: /^(ŞEKİLLER( DİZİNİ| LİSTESİ)?|ŞEKİL LİSTESİ|LIST OF FIGURES)$/ },
  { id: "photos", type: "custom", indexKind: "photo", pattern: /^(RESİMLER( DİZİNİ| LİSTESİ)?|FOTOĞRAFLAR( DİZİNİ| LİSTESİ)?)$/ },
  { id: "tables", type: "listOfTables", indexKind: "tables", pattern: /^(TABLOLAR( DİZİNİ| LİSTESİ)?|ÇİZELGELER( DİZİNİ| LİSTESİ)?|TABLO LİSTESİ|LIST OF TABLES)$/ },
  { id: "abstract", type: "abstract", pattern: /^(ÖZET|ÖZ)$/ },
  { id: "english-abstract", type: "englishAbstract", pattern: /^ABSTRACT$/ },
  { id: "bibliography", type: "bibliography", group: "back", pattern: /^(KAYNAKLAR|KAYNAKÇA|REFERENCES|BIBLIOGRAPHY)$/ },
  { id: "appendices", type: "appendices", group: "back", pattern: /^(EKLER( DİZİNİ| LİSTESİ)?|EK|APPENDICES|APPENDIX)$/ },
  { id: "cv", type: "curriculumVitae", group: "back", pattern: /^(ÖZ ?GEÇMİŞ|CURRICULUM VITAE|CV)$/ },
];
const FIXED = [
  // A fixed page is found by one short line that names it (the title can be part of a longer line: "YÜKSEK LİSANS TEZİ SINAV SONUÇ FORMU").
  { id: "approval", type: "approval", group: "front", pattern: /^(ONAY|KABUL|APPROVAL)$|KABUL VE ONAY|ONAY SAYFASI|TEZ ONAY|SINAV SONUÇ|SAVUNMA TUTANAĞ|SINAV TUTANAĞ|JÜRİ ONAY|THESIS APPROVAL|APPROVAL PAGE|EXAMINATION RESULT/, maxPage: 8 },
  { id: "ethics", type: "ethicsDeclaration", group: "back", pattern: /ETİK.*BEYAN|^BEYAN$|TAAHHÜTNAME|DECLARATION( OF ORIGINALITY)?|ETHICAL DECLARATION/ },
];
const CAPTION_TABLE = /^\s*(Tablo|Çizelge|Table)\s*\d/i;
const CAPTION_FIGURE = /^\s*(Şekil|Figure)\s*\d/i;
const KEYWORDS = /^\s*(Anahtar\s*kelimeler|Keywords?|Key\s*words)\s*:/i;
const BIBLIOGRAPHY = TITLES.find((t) => t.id === "bibliography");

function pStyleName(paragraph, styleNames) {
  const node = paragraph.properties?.pPr?.children?.find((c) => c.tag === "w:pStyle");
  const id = node?.attributes?.["w:val"];
  return id ? { id, name: styleNames.get(id) ?? id } : null;
}

export function suggestProfile(extracted, { identity } = {}) {
  const evidence = {};
  const missing = []; // roles the generation cannot do without
  const absent = []; // optional roles the source does not seem to have
  const note = (field, reason) => { evidence[field] = reason; };
  const styleNames = new Map(extracted.styles.map((s) => [s.id, s.properties?.children?.find((c) => c.tag === "w:name")?.attributes?.["w:val"] ?? s.id]));
  // Table-of-contents entries: by their "toc N" style, or by dot leaders / a trailing tab and page number.
  const tocStyleIds = new Set(extracted.styles.filter((st) => /^(toc|içindekiler)\s*\d$/i.test(collapse(styleNames.get(st.id)))).map((st) => st.id));
  const isTocParagraph = (paragraph) => { const style = pStyleName(paragraph, styleNames); return Boolean(style && tocStyleIds.has(style.id)) || isTocLine(paragraph.text); };
  const defaultStyle = extracted.styles.find((s) => s.type === "paragraph" && ["1", "true"].includes(s.default));
  const paragraphs = extracted.paragraphs;
  const at = (index) => paragraphs[index - 1];
  const pages = extracted.wordRender?.pages ?? [];
  const pageText = pages.map((page) => squash(page.lines.map((l) => l.text).join(" ")));
  const pageOf = (text) => { const key = squash(text).slice(0, 30); return key.length < 8 ? 0 : pageText.findIndex((t) => t.includes(key)) + 1; };
  const standalonePage = (pattern, from = 1, to = pages.length) => {
    for (let n = from; n <= Math.min(to, pages.length); n++) {
      const line = pages[n - 1].lines.find((l) => !isTocLine(l.text) && collapse(l.text).length <= 60 && pattern.test(upper(l.text)));
      if (line) return { page: n, title: collapse(line.text) };
    }
    return null;
  };

  // --- section titles (first occurrence outside the table of contents) -------------------------------------------------------------
  const titleParagraphs = new Map();
  for (const entry of TITLES) {
    const found = paragraphs.find((p) => { const text = upper(p.text); return text.length > 0 && text.length <= 60 && !isTocParagraph(p) && entry.pattern.test(text); });
    if (found) titleParagraphs.set(entry.id, found.index);
  }
  // A short word such as "ÖZ" or "EK" can also start a numbered heading ("1. EK"); a section title is a match only when the paragraph
  // does not start with a number. (A title styled "Heading 1" is still a section title.)
  for (const [id, index] of [...titleParagraphs]) if (/^\s*\d/.test(at(index).text)) titleParagraphs.delete(id);

  // --- the body starts at the first level-1 heading after the front matter --------------------------------------------------------
  const frontEnd = Math.max(0, ...["abstract", "english-abstract", "symbols", "tables", "figures", "thanks", "preface", "toc"].map((id) => titleParagraphs.get(id) ?? 0));
  // --- headings: the printed number says the level; without one, the heading style says it ----------------------------------------
  // A heading style number is not the level: a template may use "Heading 2" for front-matter titles and "Heading 3" for the 1.1
  // sections of the chapters. The style levels the body really uses are therefore ranked (1, 3, 4 -> 1, 2, 3), while a printed number
  // ("1.1", "3.2.1") always gives its own depth.
  const textOf = (paragraph) => collapse(paragraph.text);
  const headingShape = (paragraph) => {
    const text = textOf(paragraph);
    return !text || text.length > 110 || isTocParagraph(paragraph) ? null : text;
  };
  const styleLevelOf = (paragraph) => {
    const style = pStyleName(paragraph, styleNames);
    const found = style && /^(heading|başlık|baslik)\s*([1-9])$/i.exec(collapse(style.name));
    return found ? Number(found[2]) : 0;
  };
  const numberDepthOf = (paragraph) => {
    const text = headingShape(paragraph);
    const numbered = text && /^(\d+(?:\.\d+){0,3})\.?\s+\S/.exec(text);
    return numbered && !/[.;:,]$/.test(text) ? numbered[1].split(".").length : 0;
  };
  const titleIndexes = new Set([...titleParagraphs.values()]);
  const bodyStyleLevels = [...new Set(paragraphs.filter((p) => p.index > frontEnd && headingShape(p) && !titleIndexes.has(p.index)).map(styleLevelOf).filter(Boolean))].sort((a, b) => a - b);
  const roleOfStyleLevel = new Map(bodyStyleLevels.map((level, i) => [level, i + 1]));
  // The document's own table of contents lists every heading with its number ("1. GİRİŞ ....... 1", "1.7. Tanımlar ....... 3"), whatever
  // the styles are called. Each numbered entry is matched, in order, with the heading paragraph of the same text; the number is the level.
  // Used only when neither styles nor printed numbers give a level-1 heading.
  // An entry is "number title", with or without dot leaders, and the page number may be glued to the title ("1.1.Problem Durumu1").
  const tocOutline = new Map();
  {
    const entries = paragraphs.filter((p) => isTocParagraph(p)).map((p) => {
      const found = /^\s*(\d+(?:\.\d+){0,4})\.?\s*(\S.*)$/.exec(collapse(p.text));
      return found && { depth: found[1].split(".").length, rest: upper(found[2].replace(/\s*[….]{3,}.*$/, "")) };
    }).filter(Boolean);
    const sameTitle = (paragraph, rest) => {
      const title = upper(paragraph.text);
      return title.length > 0 && (rest === title || (rest.startsWith(title) && /^[0-9IVXLCDM]{1,5}$/.test(rest.slice(title.length))));
    };
    let from = frontEnd;
    for (const entry of entries) {
      const hit = paragraphs.find((p) => p.index > from && !isTocParagraph(p) && sameTitle(p, entry.rest));
      if (hit) { tocOutline.set(hit.index, entry.depth); from = hit.index; }
    }
  }
  let viaToc = false;
  const headingLevel = (paragraph) => {
    if (!headingShape(paragraph)) return 0;
    return numberDepthOf(paragraph) || roleOfStyleLevel.get(styleLevelOf(paragraph)) || (viaToc ? tocOutline.get(paragraph.index) ?? 0 : 0);
  };
  if (bodyStyleLevels.some((level, i) => level !== i + 1)) note("headingLevels", `the body uses heading styles ${bodyStyleLevels.join(", ")}; they are ranked as levels 1..${bodyStyleLevels.length}`);
  let level1 = paragraphs.filter((p) => p.index > frontEnd && headingLevel(p) === 1);
  if (!level1.length && tocOutline.size >= 3) {
    viaToc = true;
    level1 = paragraphs.filter((p) => p.index > frontEnd && headingLevel(p) === 1);
    note("headingLevels", `no heading styles or printed numbers: levels taken from the table of contents (${tocOutline.size} entries matched to headings)`);
  }
  const firstChapter = level1[0];
  if (!firstChapter) missing.push("headingParagraphs (no numbered level-1 heading after the front matter)");
  const bodyStart = firstChapter?.index ?? 0;
  const bodyHeadings = paragraphs.filter((p) => p.index >= bodyStart && headingLevel(p) > 0);

  const headingParagraphs = [];
  for (let level = 1; level <= 4; level++) {
    const heading = bodyHeadings.find((p) => headingLevel(p) === level);
    if (!heading) { (level === 1 ? missing : absent).push(`headingParagraphs[${level}]`); break; }
    headingParagraphs.push(heading.index);
  }
  if (headingParagraphs.length) note("headingParagraphs", `first heading of each level after paragraph ${frontEnd}: ${headingParagraphs.map((i) => `${i} "${collapse(at(i).text).slice(0, 24)}"`).join(", ")}`);
  const backStart = Math.min(...["bibliography", "appendices", "cv"].map((id) => titleParagraphs.get(id) ?? Infinity));
  const chapterParagraphs = bodyHeadings.filter((p) => headingLevel(p) === 1 && p.index < backStart).map((p) => p.index);

  // --- body paragraph, style, section, rendered page ------------------------------------------------------------------------------
  const bodyParagraph = paragraphs.find((p) => p.index > bodyStart && collapse(p.text).length >= 100 && !headingLevel(p) && !CAPTION_TABLE.test(p.text) && !CAPTION_FIGURE.test(p.text));
  if (!bodyParagraph) missing.push("bodyParagraph (no long paragraph after the first chapter heading)");
  const bodyStyleId = (bodyParagraph && pStyleName(bodyParagraph, styleNames)?.id) ?? defaultStyle?.id ?? "Normal";
  if (bodyParagraph) note("bodyParagraph", `first paragraph of 100+ characters after the first chapter heading (${bodyParagraph.index})`);
  note("bodyStyle", bodyParagraph && pStyleName(bodyParagraph, styleNames) ? "style of the body paragraph" : "default paragraph style (the body paragraph has direct formatting only)");
  let bodySection = 0;
  if (bodyParagraph) {
    const bodyP = Number(/\/w:body\[1\]\/w:p\[(\d+)\]/.exec(bodyParagraph.locator)?.[1] ?? 0);
    const ends = extracted.sections.map((s) => Number(/\/w:body\[1\]\/w:p\[(\d+)\]\/w:pPr/.exec(s.locator)?.[1] ?? Infinity));
    bodySection = ends.findIndex((end) => bodyP <= end) + 1 || extracted.sections.length;
    note("bodySection", `section whose last paragraph is at or after body paragraph p[${bodyP}] (section ends: ${ends.map((e) => (Number.isFinite(e) ? e : "last")).join(", ")})`);
  }
  const bodySourcePage = bodyParagraph ? pageOf(bodyParagraph.text) : 0;
  if (bodyParagraph && !bodySourcePage) missing.push("bodySourcePage (body text not found on a rendered page)");

  // --- captions, bibliography, table probe ----------------------------------------------------------------------------------------
  const tableCaption = paragraphs.find((p) => p.index > bodyStart && CAPTION_TABLE.test(p.text) && !isTocParagraph(p));
  const figureCaption = paragraphs.find((p) => p.index > bodyStart && CAPTION_FIGURE.test(p.text) && !isTocParagraph(p));
  if (!tableCaption) missing.push("tableCaption");
  if (!figureCaption) missing.push("figureCaption");
  const bibliographyTitle = titleParagraphs.get("bibliography");
  const bibliographyParagraph = bibliographyTitle && paragraphs.find((p) => p.index > bibliographyTitle && collapse(p.text));
  if (!bibliographyParagraph) missing.push("bibliographyParagraph");
  let tableProbe;
  if (tableCaption) {
    const inCell = paragraphs.find((p) => p.index > tableCaption.index && /\/w:body\[1\]\/w:tbl\[\d+\]\//.test(p.locator) && collapse(p.text));
    if (inCell) { tableProbe = { table: Number(/\/w:tbl\[(\d+)\]\//.exec(inCell.locator)[1]), firstCellParagraph: inCell.index }; note("tableProbe", `first non-empty cell paragraph after the table caption (${inCell.index})`); }
    else absent.push("tableProbe (no table with text after the first table caption)");
  }

  // --- fixed pages and the section list --------------------------------------------------------------------------------------------
  const fixedPages = [];
  if (pages.length) fixedPages.push({ id: "cover", type: "outerCover", title: "KAPAK", group: "cover", sourcePage: 1 });
  // An inner cover is an early page that repeats the title lines of the first (page 2 to 4; a page in between may be something else).
  if (pages.length > 1) {
    const lines = (page) => page.lines.map((l) => collapse(l.text)).filter((t) => t.length >= 8);
    const first = new Set(lines(pages[0]));
    for (let n = 2; n <= Math.min(4, pages.length); n++) {
      const here = lines(pages[n - 1]);
      const shared = here.filter((t) => first.has(t)).length;
      if (shared >= 3 && shared >= here.length * 0.4) { fixedPages.push({ id: "inner-cover", type: "innerCover", title: "İÇ KAPAK", group: "cover", sourcePage: n }); break; }
    }
  }
  for (const entry of FIXED) {
    const hit = standalonePage(entry.pattern, 1, entry.maxPage ?? pages.length);
    if (!hit) { absent.push(`fixed page ${entry.id} (no line that names it; the template may not have one)`); continue; }
    const group = entry.group === "back" && bodySourcePage && hit.page < bodySourcePage ? "front" : entry.group;
    fixedPages.push({ id: entry.id, type: entry.type, title: upper(hit.title), group, sourcePage: hit.page });
  }
  const allTitleIndexes = new Set([...titleParagraphs.values()]);
  const sectionOf = (entry) => {
    const titleParagraph = titleParagraphs.get(entry.id);
    const title = collapse(at(titleParagraph).text);
    const out = { id: entry.id, type: entry.type, title };
    if (entry.group) out.group = entry.group;
    if (entry.indexKind) {
      out.indexKind = entry.indexKind;
      if (entry.indexKind === "toc") {
        const tocStyle = extracted.styles.find((s) => /^(toc 1|içindekiler 1)$/i.test(collapse(styleNames.get(s.id))));
        if (tocStyle) out.styleId = tocStyle.id;
      }
    }
    // The engine draws the list pages (figures, tables, pictures) itself, so their title follows the chapter heading style and the
    // title paragraph is not measured; only the table of contents keeps its own title style.
    if (!entry.indexKind || entry.indexKind === "toc") out.titleParagraph = titleParagraph;
    if (!entry.indexKind) {
      const content = [];
      let blanks = 0;
      for (let i = titleParagraph + 1; i <= paragraphs.length && content.length < 6; i++) {
        const p = at(i);
        // Three empty paragraphs in a row after some text end the block (the next thing on the page is not part of this section).
        blanks = collapse(p.text) ? 0 : blanks + 1;
        if (blanks >= 3 && content.length) break;
        if (allTitleIndexes.has(i) || headingLevel(p) === 1 || FIXED.some((f) => f.pattern.test(upper(p.text)))) break;
        const text = collapse(p.text);
        if (!text || KEYWORDS.test(text)) { if (KEYWORDS.test(text)) break; continue; }
        if (text === upper(text) && text.length > 15 && entry.type !== "listOfAbbreviations") continue;
        content.push(i);
      }
      if (content.length) out.paragraphs = content;
    }
    return out;
  };
  const found = TITLES.filter((e) => titleParagraphs.has(e.id));
  const placed = [];
  for (const f of fixedPages) placed.push({ key: [f.sourcePage, 0], section: { id: f.id } });
  for (const entry of found) {
    const index = titleParagraphs.get(entry.id);
    // The rendered title may carry the number Word adds to it ("6. KAYNAKÇA"); a bare text search would find the table of contents.
    const page = standalonePage(new RegExp(`^(\\d+(?:\\.\\d+)*\\.?\\s*)?${entry.pattern.source.replace(/^\^|\$$/g, "")}$`), 1, pages.length)?.page ?? (pageOf(at(index).text) || 999);
    placed.push({ key: [page, index], section: sectionOf(entry) });
  }
  // Pages in front of the first titled section that are neither the cover nor a recognised fixed page: say so instead of dropping them.
  const firstTitlePage = Math.min(...placed.filter((p) => p.key[1] > 0).map((p) => p.key[0]));
  const classified = new Set(fixedPages.map((f) => f.sourcePage));
  for (let n = 1; n < firstTitlePage && n <= pages.length; n++) {
    if (!classified.has(n)) absent.push(`front page ${n} is not classified (first line "${collapse(pages[n - 1].lines[0]?.text ?? "").slice(0, 40)}")`);
  }
  const mainPage = pageOf(at(headingParagraphs[0] ?? 1)?.text ?? "") || bodySourcePage || 999;
  placed.push({ key: [mainPage, bodyStart], section: { id: "main", title: "ANA METİN" } });
  placed.sort((a, b) => a.key[0] - b.key[0] || a.key[1] - b.key[1]);
  const sections = placed.map((p) => p.section);
  note("sections", `${sections.length} sections ordered by the rendered page of their title: ${sections.map((s) => s.id).join(", ")}`);
  for (const f of fixedPages) {
    note(`fixedPages.${f.id}`, f.id === "cover" ? "the first rendered page"
      : f.id === "inner-cover" ? `rendered page ${f.sourcePage} repeats the title lines of page 1`
        : `standalone line "${f.title}" on rendered page ${f.sourcePage}`);
  }

  const profile = {
    target: extracted.target,
    reviewedAt: new Date().toISOString().slice(0, 10),
    identity,
    bodyStyle: bodyStyleId,
    bodyParagraph: bodyParagraph?.index,
    bodySection,
    bodySourcePage,
    headingParagraphs,
    chapterParagraphs,
    tableCaption: tableCaption?.index,
    figureCaption: figureCaption?.index,
    bibliographyParagraph: bibliographyParagraph?.index,
    ...(tableProbe ? { tableProbe } : {}),
    fixedPages,
    sections,
  };
  // The bibliography title is not part of the vocabulary's body; keep the reference so the type is not lost when only a title exists.
  void BIBLIOGRAPHY;
  return { profile, evidence, missing, absent };
}

function parseArgs(argv) {
  const values = {};
  for (let i = 0; i < argv.length; i += 2) {
    if (!argv[i].startsWith("--")) throw new Error(`Beklenmeyen argüman: ${argv[i]}`);
    values[argv[i].slice(2)] = argv[i + 1];
  }
  return values;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const args = parseArgs(process.argv.slice(2));
  if (!args.extracted || !args.identity) throw new Error("usage: profile-suggest.mjs --extracted <file> --identity <identity.json> [--out <profile.json>]");
  const extracted = JSON.parse(readFileSync(args.extracted, "utf8"));
  const identity = JSON.parse(readFileSync(args.identity, "utf8"));
  const { profile, evidence, missing, absent } = suggestProfile(extracted, { identity });
  console.log(`profile for ${profile.target}: ${profile.sections.length} sections, ${profile.fixedPages.length} fixed pages`);
  for (const [field, reason] of Object.entries(evidence)) console.log(`  ${field.padEnd(22)} ${reason}`);
  if (absent.length) console.log(`not found, optional (${absent.length}):\n  ${absent.join("\n  ")}`);
  console.log(missing.length ? `NEEDS A PERSON (${missing.length}):\n  ${missing.join("\n  ")}` : "nothing missing");
  if (args.out) { writeFileSync(args.out, `${JSON.stringify(profile, null, 2)}\n`); console.log(`written: ${args.out}`); }
}
