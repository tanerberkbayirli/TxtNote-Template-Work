import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  conflictMessage,
  languageFromExtension,
  languagesCompatible,
  resolveFileLanguage,
} from "./codeLanguage.js";

describe("languageFromExtension", () => {
  it("maps common source extensions", () => {
    assert.equal(languageFromExtension("app.py"), "python");
    assert.equal(languageFromExtension("main.js"), "javascript");
    assert.equal(languageFromExtension("main.ts"), "typescript");
    assert.equal(languageFromExtension("index.html"), "html");
    assert.equal(languageFromExtension("Program.cs"), "csharp");
    assert.equal(languageFromExtension("main.cpp"), "cpp");
    assert.equal(languageFromExtension(".eslintrc"), "json");
    assert.equal(languageFromExtension(".dockerignore"), "plaintext");
  });
});

describe("resolveFileLanguage", () => {
  it("uses the extension when content agrees", () => {
    const result = resolveFileLanguage({
      fileName: "hi.py",
      content: "def hello():\n    print(1)\n",
    });
    assert.equal(result.language, "python");
    assert.equal(result.conflict, null);
  });

  it("keeps the extension and reports a quiet conflict when content disagrees", () => {
    const result = resolveFileLanguage({
      fileName: "page.py",
      content: "<html><body><h1>Merhaba</h1></body></html>",
    });
    assert.equal(result.language, "python");
    assert.equal(result.conflict.extension, "python");
    assert.equal(result.conflict.content, "html");
    assert.match(conflictMessage(result.conflict), /Python/);
    assert.match(conflictMessage(result.conflict), /HTML/);
  });

  it("lets a manual choice win", () => {
    const result = resolveFileLanguage({
      fileName: "page.py",
      content: "<html></html>",
      manualLanguage: "html",
      languageLocked: true,
    });
    assert.equal(result.language, "html");
    assert.equal(result.source, "manual");
    assert.equal(result.conflict, null);
  });

  it("treats javascript and typescript as compatible", () => {
    assert.equal(languagesCompatible("javascript", "typescript"), true);
  });
});
