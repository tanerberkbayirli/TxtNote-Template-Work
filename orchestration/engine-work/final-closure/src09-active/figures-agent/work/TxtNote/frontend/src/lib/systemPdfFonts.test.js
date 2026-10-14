import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { readFile } from "node:fs/promises";
import { extractTrueTypeCollectionFace, systemFontIdentity } from "./systemPdfFonts.js";

const align4 = (value) => (value + 3) & ~3;

function syntheticCollection(font, count = 2) {
  const headerLength = align4(12 + count * 4);
  const source = new DataView(font.buffer, font.byteOffset, font.byteLength);
  const tableCount = source.getUint16(4);
  const output = new Uint8Array(headerLength + align4(font.byteLength) * count);
  const view = new DataView(output.buffer);
  view.setUint32(0, 0x74746366); // ttcf
  view.setUint32(4, 0x00010000);
  view.setUint32(8, count);
  for (let faceIndex = 0; faceIndex < count; faceIndex += 1) {
    const faceOffset = headerLength + align4(font.byteLength) * faceIndex;
    view.setUint32(12 + faceIndex * 4, faceOffset);
    output.set(font, faceOffset);
    for (let tableIndex = 0; tableIndex < tableCount; tableIndex += 1) {
      const record = faceOffset + 12 + tableIndex * 16;
      view.setUint32(record + 8, view.getUint32(record + 8) + faceOffset);
    }
  }
  return output;
}

describe("TrueType collection face extraction", () => {
  it("extracts the requested TTC face and restores standalone table offsets", async () => {
    const font = new Uint8Array(await readFile(new URL("../assets/fonts/Tinos-Regular.ttf", import.meta.url)));
    const identity = systemFontIdentity(font);
    const collection = syntheticCollection(font);
    const extracted = extractTrueTypeCollectionFace(collection, 1);
    assert.equal(systemFontIdentity(extracted).family, identity.family);
    assert.equal(systemFontIdentity(extracted).postscript, identity.postscript);
    assert.ok(extracted.byteLength >= font.byteLength - 3 && extracted.byteLength <= font.byteLength + 3);
  });

  it("leaves standalone SFNT data intact and rejects an invalid TTC index", async () => {
    const font = new Uint8Array(await readFile(new URL("../assets/fonts/Tinos-Regular.ttf", import.meta.url)));
    assert.equal(extractTrueTypeCollectionFace(font), font);
    assert.throws(() => extractTrueTypeCollectionFace(syntheticCollection(font), 2), /koleksiyon yüzü geçersiz/i);
  });
});
