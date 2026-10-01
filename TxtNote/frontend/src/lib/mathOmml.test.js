import assert from "node:assert/strict";
import { test } from "node:test";
import { latexToMathComponents, mathFromLatex } from "./mathOmml.js";

function mathText(component) {
  if (Array.isArray(component)) return component.map(mathText).join("");
  if (component?.constructor?.name === "MathText") return (component.root || []).join("");
  return (Array.isArray(component?.root) ? component.root : []).map(mathText).join("");
}

test("mathFromLatex builds a Word equation from the binomial theorem", () => {
  const latex = "\\left(x+y\\right)^{n}=\\sum_{k=0}^{n}{\\binom{n}{k}x^{n-k}y^{k}}";
  const math = mathFromLatex(latex);
  assert.ok(math);
  const parts = latexToMathComponents(latex);
  const names = parts.map((part) => part.constructor?.name);
  assert.ok(names.includes("MathSum"));
  assert.ok(names.includes("MathRoundBrackets") || names.includes("MathSuperScript"));
  assert.equal(names.includes("MathRun") || names.length > 0, true);
});

test("mathFromLatex returns null for empty latex", () => {
  assert.equal(mathFromLatex(""), null);
  assert.equal(mathFromLatex("   "), null);
});

test("legacy non-thesis parsing keeps its previous flattening behavior by default", () => {
  const binom = latexToMathComponents("\\binom{n}{k}");
  assert.equal(mathText(binom), "Cn,k");
  assert.ok(binom.some((part) => part.constructor?.name === "MathRoundBrackets"), "the legacy path keeps the C(n,k) binomial approximation");
  assert.equal(mathText(latexToMathComponents("\\hat{x}")), "x");
  assert.equal(mathText(latexToMathComponents("\\text{kg}")), "kg");
  assert.equal(mathText(latexToMathComponents("\\mathbf{x}")), "x");
  const matrix = latexToMathComponents("\\begin{matrix}a&b\\\\c&d\\end{matrix}");
  assert.equal(mathText(matrix), "abcd");
  assert.ok(matrix.some((part) => part.constructor?.name === "MathRoundBrackets"));
  const cases = latexToMathComponents("\\begin{cases}x\\end{cases}");
  assert.equal(mathText(cases), "x");
  assert.ok(cases.some((part) => part.constructor?.name === "MathCurlyBrackets"));
});
