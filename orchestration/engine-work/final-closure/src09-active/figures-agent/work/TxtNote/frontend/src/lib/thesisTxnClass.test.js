import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { contentNodesFromHtml, contentNodesToHtml, prepareThesisNote } from "../thesis/contentModel.js";
import { sameThesisEditorProjection, thesisSourceHtml } from "../thesis/sourceHtml.js";
import generic from "../thesis/templates/generic.js";

const stamped = '<h1 class="txn-n1 keep" data-txt-node-id="n1">Baslik</h1><p class="txn-n2" data-txt-node-id="n2">Metin <b class="txn-n3 txn-x:4">kalin</b></p><p class="own">Yeni</p>';
const noTxn = (value) => assert.ok(!/txn-/.test(typeof value === "string" ? value : JSON.stringify(value)), "txn- token leaked");

describe("display-only txn-<id> classes", () => {
  it("are stripped by the parser and never reach the model", () => {
    const nodes = contentNodesFromHtml(stamped);
    noTxn(nodes);
    assert.equal(nodes[0].attributes.class, "keep");
    assert.equal(nodes[1].attributes.class, undefined);
  });
  it("round-trip: stamp then parse again yields the same model and no txn- in saved html", () => {
    const first = contentNodesFromHtml(stamped);
    const html = contentNodesToHtml(first);
    assert.match(html, /txn-/);
    const second = contentNodesFromHtml(html, { previous: first });
    noTxn(second);
    assert.equal(contentNodesToHtml(second, { stampIds: false }), contentNodesToHtml(first, { stampIds: false }));
    noTxn(contentNodesToHtml(second, { stampIds: false }));
  });
  it("prepareThesisNote saves clean content and a clean model", () => {
    const note = prepareThesisNote({ title: "T", content: stamped, researchData: { thesis: { templateId: generic.id } } });
    noTxn(note.content); noTxn(note.researchData.thesis.document); noTxn(thesisSourceHtml(note.content));
  });
  it("sameThesisEditorProjection ignores the stamp class", () => {
    assert.ok(sameThesisEditorProjection('<p class="txn-n2" data-txt-node-id="n2">a</p>', "<p>a</p>"));
    assert.ok(sameThesisEditorProjection('<p class="txn-n2 keep" data-txt-node-id="n2">a</p>', '<p class="keep">a</p>'));
    assert.ok(!sameThesisEditorProjection('<p class="txn-n2 keep">a</p>', '<p class="other">a</p>'));
  });
});
