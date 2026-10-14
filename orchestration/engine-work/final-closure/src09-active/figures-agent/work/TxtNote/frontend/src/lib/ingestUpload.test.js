import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { zipSync } from "fflate";
import { extractZipEntries } from "./zipImport.js";
import { buildFolderRecords, collectDirectoryPaths, parentIdForPath } from "./folderImport.js";
import { ingestUploads } from "./ingestUpload.js";

describe("extractZipEntries", () => {
  it("keeps nested folders and Turkish names", async () => {
    const packed = zipSync({
      "Çalışma/src/app.py": new TextEncoder().encode("print(1)\n"),
      "Çalışma/README.md": new TextEncoder().encode("# merhaba\n"),
    });
    const result = await extractZipEntries(packed, { compressedSize: packed.length });
    assert.equal(result.errors.length, 0);
    const paths = result.entries.map((entry) => entry.parts.join("/")).sort();
    assert.deepEqual(paths, ["Çalışma/README.md", "Çalışma/src/app.py"]);
  });

  it("drops zip-slip paths", async () => {
    const packed = zipSync({
      "../secret.py": new TextEncoder().encode("x"),
      "ok/a.js": new TextEncoder().encode("const a = 1;\n"),
    });
    const result = await extractZipEntries(packed, { compressedSize: packed.length });
    assert.equal(result.entries.length, 1);
    assert.deepEqual(result.entries[0].parts, ["ok", "a.js"]);
    assert.ok(result.skipped >= 1);
  });
});

describe("buildFolderRecords", () => {
  it("nests folders from relative paths", () => {
    let n = 0;
    const { folders, idByPath } = buildFolderRecords(
      [
        ["Proje", "src", "app.js"],
        ["Proje", "src", "util.ts"],
      ],
      {
        workspaceId: "ws-1",
        parentId: null,
        createId: () => `itm-${(n += 1)}`,
        now: () => 1,
      },
    );
    assert.equal(folders.length, 2);
    assert.equal(folders[0].title, "Proje");
    assert.equal(folders[1].title, "src");
    assert.equal(folders[1].parentId, folders[0].id);
    assert.equal(parentIdForPath(["Proje", "src", "app.js"], idByPath, null), folders[1].id);
  });

  it("collects unique directory prefixes", () => {
    assert.deepEqual(collectDirectoryPaths([["a", "b", "c.py"], ["a", "d.txt"]]), ["a", "a/b"]);
  });
});

describe("ingestUploads", () => {
  it("builds a tree from relative paths without reading file bytes", async () => {
    const files = [
      new File(["print('hi')\n"], "app.py", { type: "text/x-python" }),
      new File(["const x = 1;\n"], "index.js", { type: "text/javascript" }),
    ];
    files[0].relativePath = "Ödev/src/app.py";
    files[1].relativePath = "Ödev/src/index.js";

    const written = [];
    const result = await ingestUploads({
      files,
      workspaceId: "ws-1",
      parentId: null,
      isTauri: false,
      writeMedia: async (id, file) => {
        written.push(file.name);
        return `blob:${id}`;
      },
      saveNote: async () => {},
    });

    const folders = result.items.filter((item) => item.type === "folder");
    const uploaded = result.items.filter((item) => item.type === "file");
    assert.equal(folders.length, 2);
    assert.equal(uploaded.length, 2);
    assert.ok(folders.some((folder) => folder.title === "Ödev"));
    assert.equal(uploaded.every((item) => item.parentId), true);
    assert.equal(Object.keys(result.notes).length, 0);
    assert.equal(written.length, 0);
    assert.equal(uploaded.every((item) => !item.url), true);
  });

  it("does not persist video bytes in the browser", async () => {
    const file = new File([new Uint8Array(4096)], "clip.mp4", { type: "video/mp4" });
    let wrote = false;
    const result = await ingestUploads({
      files: [file],
      workspaceId: "ws-1",
      isTauri: false,
      writeMedia: async () => {
        wrote = true;
        return "blob:nope";
      },
    });
    assert.equal(wrote, false);
    assert.equal(result.items[0].storageMode, "session");
    assert.equal(result.items[0].url, null);
  });

  it("keeps a zip closed until it is extracted", async () => {
    const packed = zipSync({
      "src/app.py": new TextEncoder().encode("print(1)\n"),
    });
    const file = new File([packed], "proje.zip", { type: "application/zip" });
    const closed = await ingestUploads({
      files: [file],
      workspaceId: "ws-1",
      extractArchives: false,
    });
    assert.equal(closed.items.filter((item) => item.type === "file").length, 1);
    assert.equal(closed.items[0].fileName, "proje.zip");

    const opened = await ingestUploads({
      files: [file],
      workspaceId: "ws-1",
      extractArchives: true,
    });
    assert.ok(opened.items.some((item) => item.type === "folder"));
    assert.ok(opened.items.some((item) => item.fileName === "app.py"));
  });
});
