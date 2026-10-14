import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { decodeFileBytes, encodeFileText, isProbablyText } from "./fileText.js";

describe("isProbablyText", () => {
  it("accepts UTF-8 source and rejects NUL-heavy binaries", () => {
    assert.equal(isProbablyText(new TextEncoder().encode("print('merhaba')\n")), true);
    assert.equal(isProbablyText(new Uint8Array([0x4d, 0x5a, 0x00, 0x00, 0x90])), false);
  });
});

describe("decodeFileBytes", () => {
  it("strips a UTF-8 BOM and keeps Turkish text", () => {
    const body = new TextEncoder().encode("İş dosyası");
    const bytes = new Uint8Array(3 + body.length);
    bytes.set([0xef, 0xbb, 0xbf], 0);
    bytes.set(body, 3);
    const decoded = decodeFileBytes(bytes);
    assert.equal(decoded.encoding, "utf-8-bom");
    assert.equal(decoded.text, "İş dosyası");
  });

  it("round-trips UTF-8", () => {
    const original = "const adı = 'çağrı';\n";
    const encoded = encodeFileText(original, "utf-8");
    assert.equal(decodeFileBytes(encoded).text, original);
  });
});
