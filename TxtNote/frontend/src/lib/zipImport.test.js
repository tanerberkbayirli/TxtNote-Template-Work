import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { zipSync, strToU8 } from "fflate";
import { extractZipEntries } from "./zipImport.js";

/** A stored (uncompressed) archive whose directory claims `claimed` bytes for its one entry. */
function forgedZip(claimed) {
  const body = new Uint8Array(100 * 1024).map((_, i) => (i * 2654435761) >>> 24);
  const zip = zipSync({ "a.bin": [body, { level: 0 }] });
  const view = new DataView(zip.buffer, zip.byteOffset, zip.byteLength);
  for (let i = 0; i < zip.length - 4; i += 1) {
    const signature = view.getUint32(i, true);
    if (signature === 0x04034b50) view.setUint32(i + 22, claimed, true); // local header: uncompressed size
    if (signature === 0x02014b50) view.setUint32(i + 24, claimed, true); // central directory: uncompressed size
  }
  return zip;
}

const arrayBufferGrowth = async (work) => {
  globalThis.gc?.();
  const before = process.memoryUsage().arrayBuffers;
  const result = await work();
  const after = process.memoryUsage().arrayBuffers;
  return { result, grownMb: (after - before) / 1048576 };
};

describe("extractZipEntries limits (HE-VB-07)", () => {
  it("refuses a 100 KB archive that declares 1 GB before inflating anything", async () => {
    const zip = forgedZip(1024 * 1024 * 1024);
    assert.ok(zip.length < 110 * 1024);
    const { result, grownMb } = await arrayBufferGrowth(() => extractZipEntries(zip, { compressedSize: zip.length }));
    assert.deepEqual(result.entries, []);
    assert.match(result.errors[0], /çok büyüyor/);
    assert.ok(grownMb < 32, `${grownMb.toFixed(1)} MB allocated`);
  });

  it("refuses a real high-ratio archive from its directory, without inflating it", async () => {
    const zip = zipSync({ "zeros.bin": new Uint8Array(40 * 1024 * 1024) });
    const { result, grownMb } = await arrayBufferGrowth(() => extractZipEntries(zip, { compressedSize: zip.length }));
    assert.deepEqual(result.entries, []);
    assert.match(result.errors[0], /şüpheli ölçüde sıkıştırılmış/);
    assert.ok(grownMb < 20, `${grownMb.toFixed(1)} MB allocated`);
  });

  it("still extracts an ordinary archive and drops unsafe paths", async () => {
    const zip = zipSync({ "notlar/a.txt": strToU8("merhaba dünya ".repeat(20)), "../kacak.txt": strToU8("x") });
    const { entries, skipped } = await extractZipEntries(zip, { compressedSize: zip.length });
    assert.deepEqual(entries.map((entry) => entry.parts.join("/")), ["notlar/a.txt"]);
    assert.equal(new TextDecoder().decode(entries[0].bytes), "merhaba dünya ".repeat(20));
    assert.equal(skipped, 1);
  });
});
