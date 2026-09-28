import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  detectFileKind,
  FILE_KIND,
  getFileExtension,
  isTextEditableFile,
} from "./fileType.js";

describe("dotfile config names", () => {
  it("treats .eslintrc as code with eslintrc pseudo-extension", () => {
    assert.equal(getFileExtension(".eslintrc"), "eslintrc");
    assert.equal(detectFileKind({ name: ".eslintrc", type: "" }), FILE_KIND.CODE);
    assert.equal(
      isTextEditableFile({ type: "file", fileName: ".eslintrc", fileKind: FILE_KIND.CODE }),
      true,
    );
  });

  it("treats .prettierrc and .dockerignore as editable code files", () => {
    assert.equal(detectFileKind({ name: ".prettierrc", type: "" }), FILE_KIND.CODE);
    assert.equal(detectFileKind({ name: ".dockerignore", type: "" }), FILE_KIND.CODE);
    assert.equal(isTextEditableFile({ type: "file", fileName: ".dockerignore" }), true);
  });
});
