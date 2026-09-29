import { writeFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";
const [rid, out] = process.argv.slice(2);
const SP = process.env.SP;
const P = (t) => `<p>${t}</p>`;
const eq = (latex) => `<span class="math-formula math-formula--block" data-display="block" data-latex="${latex}" data-eq-numbered="true">(${latex})</span>`;
const items = [
  ["sq", "x = \\sqrt{y}"],
  ["ss", "x_i^2 + y_j"],
  ["fr", "x = \\frac{a}{b}"],
  ["in", "x = \\int_0^1 f(x)dx"],
  ["su", "x = \\sum_{i=1}^{n} y_i"],
  ["gr", "\\alpha \\beta \\gamma \\delta \\epsilon \\zeta \\eta \\theta \\iota \\kappa \\lambda \\mu \\nu \\xi \\pi \\rho \\sigma \\tau \\upsilon \\phi \\chi \\psi \\omega"],
  ["wd", "a_1 + a_2 + a_3 + a_4 + a_5 + a_6 + a_7 + a_8 + a_9 + a_{10} + a_{11} + a_{12} + a_{13} + a_{14} + a_{15} + a_{16} + a_{17} + a_{18}"],
  ["xw", "a_1 + a_2 + a_3 + a_4 + a_5 + a_6 + a_7 + a_8 + a_9 + a_{10} + a_{11} + a_{12} + a_{13} + a_{14} + a_{15} + a_{16} + a_{17} + a_{18} + a_{19} + a_{20} + a_{21} + a_{22}"],
  ["sy", "\\pm \\times \\leq \\geq \\neq \\cdot \\approx \\infty \\partial \\nabla \\in \\subset \\cup \\forall \\exists \\Rightarrow \\propto \\oint"],
];
let c = `<h1>Denklem Turleri</h1>`;
for (const [k, l] of items) c += P(`${k}1 onceki paragraf.`) + eq(l) + P(`${k}2 sonraki paragraf.`) + `<div class="academic-page-break" data-academic-page-break="true"></div>`;
await writeFile(`${SP}/adv/ovq.json`, JSON.stringify({ title: "Kısa Başlık", content: c }));
execFileSync("node", ["/home/user/TxtNote-Template-Work/orchestration/tools/make-fixture.mjs", rid, out, `${SP}/adv/ovq.json`], { stdio: "ignore" });
