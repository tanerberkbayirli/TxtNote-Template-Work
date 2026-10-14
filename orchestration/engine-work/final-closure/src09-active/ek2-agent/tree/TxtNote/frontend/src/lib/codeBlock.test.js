import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  academicCodeHtml,
  autoLanguageLabel,
  codeBlockHtml,
  codeMarkerAt,
  codeOpenAt,
  guessLanguage,
  hasCodeFence,
  looksLikeSourceCode,
  normalizeLanguage,
  splitCodeSegments,
  codeFromElement,
} from "./codeBlock.js";

describe("normalizeLanguage", () => {
  it("maps aliases to the canonical id", () => {
    assert.equal(normalizeLanguage("js"), "javascript");
    assert.equal(normalizeLanguage("C++"), "cpp");
    assert.equal(normalizeLanguage("c#"), "csharp");
    assert.equal(normalizeLanguage("py"), "python");
    assert.equal(normalizeLanguage(""), "auto");
    assert.equal(normalizeLanguage("unknown"), "auto");
  });
});

describe("autoLanguageLabel", () => {
  it("stays unset until a language is detected", () => {
    assert.equal(autoLanguageLabel("auto"), "seçilmedi");
    assert.equal(autoLanguageLabel(""), "seçilmedi");
  });

  it("uses short oto- labels when detection succeeds", () => {
    assert.equal(autoLanguageLabel("javascript"), "oto-Js");
    assert.equal(autoLanguageLabel("js"), "oto-Js");
    assert.equal(autoLanguageLabel("html"), "oto-html");
    assert.equal(autoLanguageLabel("python"), "oto-Py");
  });
});

describe("splitCodeSegments", () => {
  it("extracts a ##code## block", () => {
    const parts = splitCodeSegments("önce\n##code##\nconst x = 1;\n##code##\nsonra");
    assert.equal(parts.length, 3);
    assert.equal(parts[0].type, "text");
    assert.equal(parts[1].type, "code");
    assert.equal(parts[1].language, "auto");
    assert.equal(parts[1].code, "const x = 1;");
    assert.match(parts[2].text, /sonra/);
  });

  it("extracts a same-line ##code## pair", () => {
    const parts = splitCodeSegments("##code##print(1)##code##");
    assert.equal(parts[0].type, "code");
    assert.equal(parts[0].language, "auto");
    assert.equal(parts[0].code, "print(1)");
  });
});

describe("codeOpenAt", () => {
  it("matches ##code## at the caret", () => {
    const text = "önce ##code##";
    const hit = codeOpenAt(text, text.length);
    assert.equal(hit.start, 5);
    assert.equal(hit.end, text.length);
  });

  it("ignores a half-typed opener", () => {
    assert.equal(codeOpenAt("##cod", 5), null);
  });
});

describe("codeMarkerAt", () => {
  it("closes a ##code## pair at the caret", () => {
    const text = "##code##\nprint(1)\n##code##";
    const hit = codeMarkerAt(text, text.length);
    assert.equal(hit.language, "auto");
    assert.equal(hit.code, "print(1)");
    assert.equal(hit.start, 0);
    assert.equal(hit.end, text.length);
  });

  it("ignores an unfinished ##code## pair", () => {
    assert.equal(codeMarkerAt("##code##\nconst x = 1", 20), null);
  });
});

describe("looksLikeSourceCode", () => {
  it("accepts a typical function paste", () => {
    assert.equal(
      looksLikeSourceCode("function add(a, b) {\n  return a + b;\n}"),
      true,
    );
  });

  it("accepts a short one-liner", () => {
    assert.equal(looksLikeSourceCode("const x = 1;"), true);
    assert.equal(looksLikeSourceCode('print("hi")'), true);
  });

  it("rejects ordinary prose", () => {
    assert.equal(looksLikeSourceCode("Merhaba\nbugün hava güzel."), false);
    assert.equal(looksLikeSourceCode("Tamam, anladım."), false);
    assert.equal(hasCodeFence("##code##\n"), true);
  });
});

describe("guessLanguage", () => {
  it("picks a language from short snippets", () => {
    assert.equal(guessLanguage("const x = 1;"), "javascript");
    assert.equal(guessLanguage('print("hi")'), "python");
    assert.equal(guessLanguage("SELECT * FROM users"), "sql");
    assert.equal(guessLanguage('{"a": 1}'), "json");
    assert.equal(guessLanguage("fn main() {}"), "rust");
    assert.equal(guessLanguage("Tamam, anladım."), "auto");
  });
});

describe("academicCodeHtml", () => {
  it("emits a plain pre listing without language chrome", () => {
    const html = academicCodeHtml('print("hi")');
    assert.match(html, /class="academic-code"/);
    assert.match(html, /print\("hi"\)/);
    assert.equal(html.includes("data-language"), false);
    assert.equal(html.includes("code-block"), false);
  });
});

describe("codeBlockHtml", () => {
  it("escapes the source into data attributes", () => {
    const html = codeBlockHtml('say("hi")', "js");
    assert.match(html, /class="code-block"/);
    assert.match(html, /data-language="javascript"/);
    assert.match(html, /data-code="say\(&quot;hi&quot;\)"/);
  });
});

describe("codeFromElement", () => {
  it("prefers data-code over toolbar chrome", () => {
    const el = {
      getAttribute: (name) => (name === "data-code" ? "a = 5\nprint(a)" : null),
      querySelector: () => ({ textContent: "Kopyala seçilmedi" }),
    };
    assert.equal(codeFromElement(el), "a = 5\nprint(a)");
  });

  it("keeps indentation and expands tabs", () => {
    const el = {
      getAttribute: (name) => (name === "data-code" ? "def f():\n\treturn 1" : null),
      querySelector: () => null,
    };
    assert.equal(codeFromElement(el), "def f():\n    return 1");
  });
});
