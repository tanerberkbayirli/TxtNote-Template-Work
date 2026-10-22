import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { isDangerousUrl } from "./safeUrl.js";

// HE-GV-01: the browser drops tab/newline anywhere and C0 controls/spaces at the ends before reading a URL scheme.
describe("isDangerousUrl", () => {
  it("catches script schemes hidden by whitespace, controls and case", () => {
    for (const value of ["javascript:alert(1)", "jav\tascript:alert(1)", "jav\nascript:alert(1)", "\u0001javascript:alert(1)", " JaVaScRiPt:x", "vbscript:x", "data:text/html,<b>", "data:image/svg+xml,<svg>"]) {
      assert.equal(isDangerousUrl(value), true, JSON.stringify(value));
    }
  });
  it("keeps ordinary links and images", () => {
    for (const value of ["https://example.org/a", "#bolum-1", "mailto:a@b.c", "data:image/png;base64,AAAA", "/x/javascript:y"]) {
      assert.equal(isDangerousUrl(value), false, value);
    }
  });
});

describe("stripActiveMarkup (HE-GV-02)", async () => {
  const { stripActiveMarkup } = await import("./activeMarkup.js");
  it("drops scripts, handlers and script URLs, entity-encoded ones too", () => {
    const out = stripActiveMarkup('<p>a</p><script>alert(1)</script><img src=x onerror=alert(1)><a href="javascript:alert(2)">l</a><a href="&#x6A;avascript:alert(3)">m</a><a href="jav&#x09;ascript:alert(4)">n</a><svg onload="alert(5)"><g/></svg><iframe srcdoc="<b>"></iframe>');
    assert.doesNotMatch(out, /<script|onerror|onload|javascript|&#x6A;avascript|ascript:|<iframe|srcdoc/i);
    assert.match(out, /<p>a<\/p>/);
    assert.match(out, /<img src=x>/);
    assert.match(out, /<a>l<\/a>/);
  });
  it("returns ordinary editor HTML unchanged", () => {
    const html = '<h1 data-thesis-number="1">Giriş</h1><p class="fmt-align-justify">Metin <a href="https://example.org">b</a> <img src="data:image/png;base64,AAAA" width="10"></p><svg><g data-docx-group-text="source"><text>x</text></g></svg>';
    assert.equal(stripActiveMarkup(html), html);
  });
});

describe("compiled model and print copy (HE-GV-02)", async () => {
  const { default: generic } = await import("./templates/generic.js");
  const { compileThesisDocument, buildThesisPrintHtml } = await import("./engine.js");
  it("carry no script from a stored note", () => {
    const model = compileThesisDocument(generic, {}, "B", '<p>a</p><script>alert(1)</script><img src=x onerror=alert(1)><a href="javascript:alert(2)">l</a>', []);
    const main = model.sections.find((section) => section.type === "mainContent").html;
    assert.doesNotMatch(main, /<script|onerror|javascript:/i);
    assert.doesNotMatch(buildThesisPrintHtml(model, {}), /<script|onerror|javascript:/i);
  });
});
