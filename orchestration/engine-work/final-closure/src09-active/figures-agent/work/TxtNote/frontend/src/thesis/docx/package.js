import { applyImageCrops } from "./imageRuns.js";
import { preserveNativeDrawingParts } from "./nativeDrawings.js";
import { strFromU8, strToU8, unzipSync, zipSync } from "fflate";

/**
 * docx 9.7 creates a fresh ID generator for each bookmark/drawing and writes
 * percentage/boolean spellings rejected by the installed Office SDK. Normalize
 * these serialization details without changing content, fields or relationships.
 */
/**
 * The package's own footnote separator. Without `w:footnotePr` references in settings.xml Word ignores the separator footnotes and draws
 * its built-in one (a 12 pt Normal paragraph, 13.8 pt tall in Times New Roman), which is taller than the editor's reserved
 * spaceBefore + rule + spaceAfter and moves lines to the next page on pages with notes (AFSÜ page 22). The rule is a top border of the
 * separator paragraph (width = widthPercent of the text width via the right indent); the exact line height carries spaceAfter.
 */
export function noteSeparatorXml({ separator, widthPt }) {
  const twips = (pt) => Math.max(0, Math.round(pt * 20));
  const enabled = separator.enabled !== false;
  const line = enabled ? Math.max(1, twips(separator.spaceAfterPt)) : 20;
  const border = enabled ? `<w:pBdr><w:top w:val="single" w:sz="${Math.max(2, Math.round(separator.thicknessPt * 8))}" w:space="0" w:color="111111"/></w:pBdr>` : "";
  const right = enabled ? twips(widthPt * (1 - Math.min(100, Math.max(1, separator.widthPercent)) / 100)) : 0;
  const before = enabled ? twips(separator.spaceBeforePt) : 0;
  return `<w:p><w:pPr>${border}<w:spacing w:before="${before}" w:after="0" w:line="${line}" w:lineRule="exact"/><w:ind w:left="0" w:right="${right}"/></w:pPr><w:r><w:rPr><w:sz w:val="2"/><w:szCs w:val="2"/></w:rPr></w:r></w:p>`;
}

export async function finalizeThesisDocx(blob, { noteRestart = false, noteRestarts = [], nativeDocument, nativeDrawings, noteSeparator = null } = {}) {
  const files = unzipSync(new Uint8Array(await blob.arrayBuffer()));
  await preserveNativeDrawingParts(files, { nativeDocument, nativeDrawings });
  let drawingId = 0;
  let bookmarkId = 0;
  for (const name of Object.keys(files).sort()) {
    if (!/^word\/.*\.xml$/.test(name)) continue;
    const openBookmarks = new Map();
    let xml = strFromU8(files[name]);
    xml = xml.replace(/<w:bookmark(Start|End)\b[^>]*\/>/g, (tag, edge) => {
      const oldId = tag.match(/\bw:id="([^"]+)"/)?.[1];
      if (oldId === undefined) throw new Error(`Bookmark without ID in ${name}`);
      const stack = openBookmarks.get(oldId) || [];
      let id;
      if (edge === "Start") {
        id = ++bookmarkId;
        stack.push(id);
        openBookmarks.set(oldId, stack);
      } else {
        id = stack.pop();
        if (id === undefined) throw new Error(`Unpaired bookmark end in ${name}`);
      }
      return tag.replace(/\bw:id="[^"]+"/, `w:id="${id}"`);
    });
    if ([...openBookmarks.values()].some((stack) => stack.length)) throw new Error(`Unclosed bookmark in ${name}`);
    xml = applyImageCrops(xml);
    xml = xml.replace(/<wp:docPr\b[^>]*>/g, (tag) => tag.replace(/\bid="[^"]+"/, `id="${++drawingId}"`));
    xml = xml.replace(/<w:(?:tblW|tcW|tblInd)\b[^>]*\/>/g, (tag) => {
      if (!/\bw:type="pct"/.test(tag)) return tag;
      return tag.replace(/\bw:w="([\d.]+)%"/, (_, value) => `w:w="${Math.round(Number(value) * 50)}"`);
    });
    // CT_OnOffOnly permits only the on value; omission is the off value.
    xml = xml.replace(/<w:(?:noWrap|tcFitText|hideMark|cantSplit|tblHeader|bidiVisual|noResizeAllowed|linkedToFile|noBorder|flatBorders|autoRedefine|hidden|semiHidden|unhideWhenUsed|qFormat|locked|personal|personalCompose|personalReply)\b[^>]*\bw:val="(?:false|0|off)"[^>]*\/>/g, "");
    xml = xml.replace(/(<w:[\w]+\b[^>]*\bw:val=")(true|false)(")/g, (_, before, value, after) => `${before}${value === "true" ? "1" : "0"}${after}`);
    // The empty paragraph that carries a section break still takes one body line in Word; after a page-filling cover that line
    // pushes the last 1-3 words onto an extra page. The editor has no such paragraph, so it gets a 1 pt exact height.
    if (name === "word/document.xml") xml = xml.replace(/<w:p><w:pPr>(<w:sectPr\b)/g, '<w:p><w:pPr><w:spacing w:before="0" w:after="0" w:line="20" w:lineRule="exact"/>$1');
    // Section properties precede type/geometry, after all header/footer references.
    // A later section may return to document numbering; do not apply one global
    // restart flag to every source section just because one section requests it.
    if (name === "word/document.xml" && (noteRestart || noteRestarts.length)) {
      let sectionIndex = 0;
      xml = xml.replace(/<w:sectPr\b[^>]*>[\s\S]*?<\/w:sectPr>/g, (sect) => {
        const mode = noteRestarts[sectionIndex++] ?? (noteRestart ? "section" : "document");
        const restart = `<w:numRestart w:val="${mode === "section" ? "eachSect" : "continuous"}"/>`;
        for (const kind of ["footnote", "endnote"]) {
          const pattern = new RegExp(`<w:${kind}Pr\\b[^>]*(?:/>|>[\\s\\S]*?</w:${kind}Pr>)`);
          const existing = sect.match(pattern)?.[0];
          const properties = existing
            ? (existing.endsWith("/>") ? existing.slice(0, -2) + `>${restart}</w:${kind}Pr>` : existing.replace(/<w:numRestart\b[^>]*\/>/g, "").replace(`</w:${kind}Pr>`, `${restart}</w:${kind}Pr>`))
            : `<w:${kind}Pr>${restart}</w:${kind}Pr>`;
          if (existing) sect = sect.replace(existing, properties);
          else {
            // The final endnote properties follow footnote properties, while
            // both precede type/page geometry and the remaining section children.
            const insertion = kind === "endnote" && /<w:footnotePr\b/.test(sect)
              ? /(<w:footnotePr\b[^>]*>[\s\S]*?<\/w:footnotePr>)/
              : /(^<w:sectPr\b[^>]*>(?:(?:<w:(?:headerReference|footerReference)\b[^>]*\/>))*)/;
            sect = sect.replace(insertion, `$1${properties}`);
          }
        }
        return sect;
      });
    }
    if (noteSeparator && files["word/footnotes.xml"]) {
      if (name === "word/footnotes.xml") {
        for (const type of ["separator", "continuationSeparator"]) {
          xml = xml.replace(new RegExp(`(<w:footnote\\b[^>]*\\bw:type="${type}"[^>]*>)[\\s\\S]*?(</w:footnote>)`), (_, open, close) => open + noteSeparatorXml(noteSeparator) + close);
        }
      } else if (name === "word/settings.xml" && !/<w:footnotePr\b/.test(xml)) {
        const references = '<w:footnotePr><w:footnote w:id="-1"/><w:footnote w:id="0"/></w:footnotePr>';
        xml = /<w:compat\b/.test(xml) ? xml.replace(/<w:compat\b/, references + "<w:compat") : xml.replace("</w:settings>", references + "</w:settings>");
      }
    }
    // Word stretches a justified line that ends in a manual line break ("BİRİNCİ ..... BÖLÜM"); LibreOffice and the preview never do.
    if (name === "word/settings.xml" && !/<w:doNotExpandShiftReturn/.test(xml)) xml = xml.replace(/<w:compat>/, "<w:compat><w:doNotExpandShiftReturn/>");
    files[name] = strToU8(xml);
  }
  const result = new Blob([zipSync(files)], { type: blob.type });
  // Written XML parts, for the field/bookmark audit of the export (not part of the package).
  result.wordXmlParts = Object.keys(files).filter((name) => /^word\/.*\.xml$/.test(name)).map((name) => strFromU8(files[name]));
  return result;
}
