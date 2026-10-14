import assert from "node:assert/strict";
import { test } from "node:test";
import { codeToPlainText, latexToPlainText } from "./mathPlainText.js";

test("latexToPlainText linearizes common academic formulas", () => {
  assert.equal(latexToPlainText("x^2"), "x²");
  assert.equal(latexToPlainText("E=mc^2"), "E=mc²");
  assert.equal(latexToPlainText("\\frac{1}{2}"), "(1)/(2)");
  assert.equal(latexToPlainText("\\sqrt{a^2+b^2}"), "√(a²+b²)");
  assert.equal(latexToPlainText("\\sum_{n=1}^{\\infty}"), "∑ₙ₌₁∞");
  assert.equal(latexToPlainText("x^{n-k} y^k"), "xⁿ⁻ᵏ yᵏ");
  assert.equal(latexToPlainText("x \\in \\R"), "x ∈ ℝ");
  assert.equal(latexToPlainText("\\abs{x}"), "|x|");
  assert.equal(latexToPlainText("\\ce{H2O}"), "H₂O");
});

test("latexToPlainText keeps align and matrix as text", () => {
  const align = latexToPlainText("\\begin{align} x &= 1 \\\\ y &= 2 \\end{align}");
  assert.match(align, /x\s*=\s*1/);
  assert.match(align, /y\s*=\s*2/);
  const matrix = latexToPlainText("\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}");
  assert.match(matrix, /\(/);
  assert.match(matrix, /a/);
  assert.match(matrix, /d/);
  assert.match(matrix, /\)/);
});

test("codeToPlainText keeps line breaks and drops caret pads", () => {
  assert.equal(codeToPlainText("a\r\n\u200Bb"), "a\nb");
});
