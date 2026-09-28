import assert from "node:assert/strict";
import { test } from "node:test";
import { latexToMathComponents, mathFromLatex } from "./mathOmml.js";

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
