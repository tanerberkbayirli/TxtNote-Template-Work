import assert from "node:assert/strict";
import { it } from "node:test";
import { thesisSourceHtml } from "../../../../engine/src/sourceHtml.js";

it("strips fragment boundary stamps while retaining authored cell borders", () => {
  const authored = '<tr><td style="border-bottom:1px solid black;color:red">Retained</td></tr>';
  assert.equal(thesisSourceHtml(authored.replace('<tr>', '<tr data-thesis-frag-last="">')), authored);
});
