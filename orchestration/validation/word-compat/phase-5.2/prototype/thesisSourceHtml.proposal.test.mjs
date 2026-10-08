import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { plainThesisText, thesisSourceHtml } from "../../../../../TxtNote/frontend/src/thesis/sourceHtml.js";

// Unit-test the exact proposed patch while production remains unchanged.
const proposedSourceHtml = (html) => thesisSourceHtml(String(html || "").replace(/<\/?thesis-line\b[^>]*>/gi, ""));

describe("proposed thesis-line serializer patch", () => {
  it("removes transient model-line wrappers while retaining nested rich text and paragraph structure", () => {
    const view = '<p>Alpha <thesis-line data-thesis-fit-line="1" style="display:block">beta <strong>gamma</strong></thesis-line></p><p><thesis-line data-thesis-fit-line="2">delta</thesis-line></p>';
    const source = proposedSourceHtml(view);
    assert.equal(source, '<p>Alpha beta <strong>gamma</strong></p><p>delta</p>');
    assert.equal(plainThesisText(source), 'Alpha beta gammadelta');
    assert.equal((source.match(/<p\b/g) || []).length, 2);
    assert.doesNotMatch(source, /thesis-line|data-thesis-fit-line/);
  });
});
