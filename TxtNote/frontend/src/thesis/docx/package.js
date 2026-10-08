import { strFromU8, strToU8, unzipSync, zipSync } from "fflate";

/**
 * docx 9.7 creates a fresh ID generator for each bookmark/drawing and writes
 * percentage/boolean spellings rejected by the installed Office SDK. Normalize
 * these serialization details without changing content, fields or relationships.
 */
export async function finalizeThesisDocx(blob) {
  const files = unzipSync(new Uint8Array(await blob.arrayBuffer()));
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
    xml = xml.replace(/<wp:docPr\b[^>]*>/g, (tag) => tag.replace(/\bid="[^"]+"/, `id="${++drawingId}"`));
    xml = xml.replace(/<w:(?:tblW|tcW|tblInd)\b[^>]*\/>/g, (tag) => {
      if (!/\bw:type="pct"/.test(tag)) return tag;
      return tag.replace(/\bw:w="([\d.]+)%"/, (_, value) => `w:w="${Math.round(Number(value) * 50)}"`);
    });
    // CT_OnOffOnly permits only the on value; omission is the off value.
    xml = xml.replace(/<w:(?:noWrap|tcFitText|hideMark|cantSplit|tblHeader|bidiVisual|noResizeAllowed|linkedToFile|noBorder|flatBorders|autoRedefine|hidden|semiHidden|unhideWhenUsed|qFormat|locked|personal|personalCompose|personalReply)\b[^>]*\bw:val="(?:false|0|off)"[^>]*\/>/g, "");
    xml = xml.replace(/(<w:[\w]+\b[^>]*\bw:val=")(true|false)(")/g, (_, before, value, after) => `${before}${value === "true" ? "1" : "0"}${after}`);
    files[name] = strToU8(xml);
  }
  return new Blob([zipSync(files)], { type: blob.type });
}
