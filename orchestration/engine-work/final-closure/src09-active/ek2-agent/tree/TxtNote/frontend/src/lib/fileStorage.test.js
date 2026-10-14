import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { FILE_KIND } from "./fileType.js";
import {
  accessKindFor,
  shouldPersistBytes,
  shouldStoreBytesInline,
  storageModeFor,
} from "./fileStorage.js";

describe("shouldStoreBytesInline", () => {
  it("allows modest text and images", () => {
    assert.equal(
      shouldStoreBytesInline({ name: "app.js", type: "text/javascript", size: 1200 }),
      true,
    );
    assert.equal(shouldStoreBytesInline({ name: "foto.png", type: "image/png", size: 800_000 }), true);
  });

  it("refuses video, archives, executables and oversize files", () => {
    assert.equal(
      shouldStoreBytesInline({ name: "clip.mp4", type: "video/mp4", size: 4000, kind: FILE_KIND.VIDEO }),
      false,
    );
    assert.equal(shouldStoreBytesInline({ name: "a.zip", type: "application/zip", size: 100 }), false);
    assert.equal(shouldStoreBytesInline({ name: "setup.exe", size: 2048, kind: FILE_KIND.BINARY }), false);
    assert.equal(
      shouldStoreBytesInline({ name: "big.png", type: "image/png", size: 20 * 1024 * 1024 }),
      false,
    );
  });
});

describe("shouldPersistBytes", () => {
  it("lets the desktop keep large files on disk, not the browser", () => {
    const video = { name: "clip.mp4", type: "video/mp4", size: 12 * 1024 * 1024, kind: FILE_KIND.VIDEO };
    assert.equal(shouldPersistBytes({ ...video, isTauri: false }), false);
    assert.equal(shouldPersistBytes({ ...video, isTauri: true }), true);
  });
});

describe("accessKindFor", () => {
  it("uses a file handle when bytes stay out of IndexedDB", () => {
    assert.equal(
      accessKindFor({
        name: "setup.exe",
        size: 4096,
        kind: FILE_KIND.BINARY,
        isTauri: false,
        hasHandle: true,
      }),
      "fileHandle",
    );
    assert.equal(
      storageModeFor({
        name: "setup.exe",
        size: 4096,
        kind: FILE_KIND.BINARY,
        isTauri: false,
        hasHandle: false,
      }),
      "session",
    );
  });
});
