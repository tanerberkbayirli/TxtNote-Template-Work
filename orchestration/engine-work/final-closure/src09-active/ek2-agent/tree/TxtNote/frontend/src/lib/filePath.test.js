import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { basenameOf, dirnameOf, prefixPath, shouldSkipArchiveEntry, splitSafePath } from "./filePath.js";

describe("splitSafePath", () => {
  it("keeps Turkish letters, spaces and punctuation", () => {
    assert.deepEqual(splitSafePath("Çalışma belgelerim/src/app.js"), [
      "Çalışma belgelerim",
      "src",
      "app.js",
    ]);
  });

  it("rejects zip-slip and absolute paths", () => {
    assert.equal(splitSafePath("../etc/passwd"), null);
    assert.equal(splitSafePath("foo/../../secret"), null);
    assert.equal(splitSafePath("/etc/passwd"), null);
    assert.equal(splitSafePath("C:/Windows/system32"), null);
    assert.equal(splitSafePath("\\\\server\\share"), null);
  });

  it("normalises backslashes", () => {
    assert.deepEqual(splitSafePath("klasör\\alt\\a.py"), ["klasör", "alt", "a.py"]);
  });
});

describe("path helpers", () => {
  it("reads basename and dirname", () => {
    assert.equal(basenameOf("a/b/c.ts"), "c.ts");
    assert.equal(dirnameOf("a/b/c.ts"), "a/b");
  });

  it("prefixes a zip stem", () => {
    assert.deepEqual(prefixPath("Proje", "src/index.js"), ["Proje", "src", "index.js"]);
  });

  it("skips junk archive names", () => {
    assert.equal(shouldSkipArchiveEntry(["__MACOSX", "._x"]), true);
    assert.equal(shouldSkipArchiveEntry(["src", ".DS_Store"]), true);
    assert.equal(shouldSkipArchiveEntry(["src", "app.js"]), false);
  });
});
