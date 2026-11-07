import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { citationInsertionOffset } from "./citationPlacement.js";

const place = (text, caret, placement) => {
  const { offset, space, stop } = citationInsertionOffset(text, caret, placement);
  const mark = placement === "after" ? "¹" : `${space ? " " : ""}(A, 2026)${stop ? "." : ""}`;
  return `${text.slice(0, offset)}${mark}${text.slice(offset)}`;
};

describe("citation placement at the end of the caret's sentence", () => {
  it("parenthetical goes just before the full stop, with a space", () => {
    assert.equal(place("Bu bir cümle. İkinci cümle.", 3, "before"), "Bu bir cümle (A, 2026). İkinci cümle.");
  });
  it("footnote goes just after the full stop", () => {
    assert.equal(place("Bu bir cümle. İkinci cümle.", 3, "after"), "Bu bir cümle.¹ İkinci cümle.");
  });
  it("a caret right after a full stop cites that sentence", () => {
    assert.equal(place("Bir. İki.", 4, "before"), "Bir (A, 2026). İki.");
    assert.equal(place("Bir. İki.", 4, "after"), "Bir.¹ İki.");
  });
  it("the second sentence when the caret is in it", () => {
    assert.equal(place("Bir. İki cümle.", 7, "before"), "Bir. İki cümle (A, 2026).");
  });
  it("decimal dots and ellipses are not sentence ends / are one mark", () => {
    assert.equal(place("Oran 3.5 arttı. Son.", 2, "before"), "Oran 3.5 arttı (A, 2026). Son.");
    assert.equal(place("Bekledi... Sonra.", 1, "before"), "Bekledi (A, 2026)... Sonra.");
    assert.equal(place("Bekledi... Sonra.", 1, "after"), "Bekledi...¹ Sonra.");
  });
  it("a closing quote after the stop still ends the sentence", () => {
    assert.equal(place("“Alıntı.” Sonra.", 2, "after"), "“Alıntı.”¹ Sonra.");
    assert.equal(place("“Alıntı.” Sonra.", 2, "before"), "“Alıntı (A, 2026).” Sonra.");
  });
  it("no full stop: the end of the block (trailing spaces ignored)", () => {
    assert.equal(place("Başlıksız metin  ", 0, "before"), "Başlıksız metin (A, 2026).  ");
    assert.equal(place("", 0, "before"), "(A, 2026)");
    assert.equal(citationInsertionOffset("Bir. İki.", 0, "before").stop, false, "an existing stop is not doubled");
    assert.equal(citationInsertionOffset("metin", 0, "after").stop, false, "footnote marks add no stop");
  });
  it("an earlier citation atom (U+FFFC) does not hide the sentence end", () => {
    // "metin.¹" with the mark as an atom: a caret after it still cites that sentence; a second note goes after the first.
    assert.equal(place("Metin.￼ Sonra.", 7, "after"), "Metin.￼¹ Sonra.");
    assert.equal(place("Metin￼￼. Sonra.", 0, "before"), "Metin￼￼ (A, 2026). Sonra.");
  });
  it("no double space when one already precedes", () => {
    assert.equal(citationInsertionOffset("Metin .", 0, "before").space, false);
  });
});
