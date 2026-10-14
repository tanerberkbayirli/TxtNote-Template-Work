import assert from "node:assert/strict";
import { inflateSync } from "node:zlib";
import { systemFontIdentity } from "../src/lib/systemPdfFonts.js";

/** Inspect actual FontFile2 programs, including their original embedded SFNT names. */
export function embeddedPdfFonts(bytes) {
  const buffer = Buffer.from(bytes);
  const text = buffer.toString("latin1");
  const fonts = [];
  for (const match of text.matchAll(/(?:^|\n)\d+ 0 obj\r?\n([\s\S]*?)\r?\nendobj/g)) {
    const dictionary = match[1];
    if (!/\/Type\s*\/FontDescriptor\b/.test(dictionary)) continue;
    const name = dictionary.match(/\/FontName\s*\/(\S+)/)?.[1];
    const streamId = dictionary.match(/\/FontFile2\s+(\d+)\s+0\s+R/)?.[1];
    assert.ok(streamId, `FontFile2 missing: ${name}`);
    const object = new RegExp(`(?:^|\\n)${streamId} 0 obj\\s*([\\s\\S]*?)stream\\r?\\n`).exec(text);
    assert.ok(object, `Font stream missing: ${name}`);
    const length = Number(object[1].match(/\/Length\s+(\d+)\b/)?.[1]);
    assert.ok(length > 0, `Font stream length: ${name}`);
    const start = object.index + object[0].length;
    let program = buffer.subarray(start, start + length);
    if (/\/FlateDecode/.test(object[1])) program = inflateSync(program);
    const identity = systemFontIdentity(program);
    fonts.push({ name, embedded: true, bytes: program.length, ...identity });
  }
  assert.ok(fonts.length, "No embedded font programs");
  return fonts;
}

export function assertTimesNewRomanEmbedded(bytes) {
  const fonts = embeddedPdfFonts(bytes);
  assert.ok(fonts.every((font) => font.family === "Times New Roman" && /^TimesNewRomanPS/.test(font.postscript)), JSON.stringify(fonts));
  assert.ok(fonts.every((font) => font.name === font.postscript), "PDF aliases must match the embedded programs");
  assert.doesNotMatch(Buffer.from(bytes).toString("latin1"), /\/BaseFont\s+\/Tinos/);
  return fonts;
}
