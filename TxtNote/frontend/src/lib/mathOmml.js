/**
 * Convert LaTeX into Word equation objects (OMML), so export keeps
 * superscripts, sums and binomials instead of a broken one-line string.
 */

import {
  Math as WordMath,
  MathCurlyBrackets,
  MathFraction,
  MathFunction,
  MathIntegral,
  MathRadical,
  MathRoundBrackets,
  MathRun,
  MathSquareBrackets,
  MathSubScript,
  MathSubSuperScript,
  MathSum,
  MathSuperScript,
} from "docx";
import { latexToPlainText } from "./mathPlainText.js";

const GREEK = {
  alpha: "α",
  beta: "β",
  gamma: "γ",
  delta: "δ",
  epsilon: "ε",
  varepsilon: "ε",
  zeta: "ζ",
  eta: "η",
  theta: "θ",
  vartheta: "ϑ",
  iota: "ι",
  kappa: "κ",
  lambda: "λ",
  mu: "μ",
  nu: "ν",
  xi: "ξ",
  pi: "π",
  rho: "ρ",
  sigma: "σ",
  tau: "τ",
  upsilon: "υ",
  phi: "φ",
  varphi: "ϕ",
  chi: "χ",
  psi: "ψ",
  omega: "ω",
  Gamma: "Γ",
  Delta: "Δ",
  Theta: "Θ",
  Lambda: "Λ",
  Xi: "Ξ",
  Pi: "Π",
  Sigma: "Σ",
  Phi: "Φ",
  Psi: "Ψ",
  Omega: "Ω",
};

const SYMBOLS = {
  infty: "∞",
  pm: "±",
  mp: "∓",
  times: "×",
  cdot: "·",
  ast: "∗",
  circ: "∘",
  div: "÷",
  leq: "≤",
  le: "≤",
  geq: "≥",
  ge: "≥",
  neq: "≠",
  ne: "≠",
  approx: "≈",
  equiv: "≡",
  sim: "∼",
  propto: "∝",
  in: "∈",
  notin: "∉",
  subset: "⊂",
  subseteq: "⊆",
  supset: "⊃",
  supseteq: "⊇",
  cup: "∪",
  cap: "∩",
  emptyset: "∅",
  forall: "∀",
  exists: "∃",
  nabla: "∇",
  partial: "∂",
  to: "→",
  rightarrow: "→",
  leftarrow: "←",
  leftrightarrow: "↔",
  Rightarrow: "⇒",
  Leftarrow: "⇐",
  Leftrightarrow: "⇔",
  mapsto: "↦",
  ldots: "…",
  dots: "…",
  cdots: "⋯",
  ell: "ℓ",
  hbar: "ℏ",
  langle: "⟨",
  rangle: "⟩",
  vert: "|",
  Vert: "‖",
  mid: "|",
  lbrace: "{",
  rbrace: "}",
  because: "∵",
  therefore: "∴",
  oplus: "⊕",
  otimes: "⊗",
  wedge: "∧",
  vee: "∨",
  neg: "¬",
  lnot: "¬",
};

const BB = { N: "ℕ", Z: "ℤ", Q: "ℚ", R: "ℝ", C: "ℂ", P: "ℙ" };

const FNS = new Set([
  "sin",
  "cos",
  "tan",
  "cot",
  "sec",
  "csc",
  "arcsin",
  "arccos",
  "arctan",
  "sinh",
  "cosh",
  "tanh",
  "log",
  "ln",
  "exp",
  "lim",
  "max",
  "min",
  "sup",
  "inf",
  "det",
  "dim",
  "ker",
  "arg",
  "deg",
  "gcd",
]);

const SKIP = new Set([
  "displaystyle",
  "textstyle",
  "scriptstyle",
  "scriptscriptstyle",
  "limits",
  "nolimits",
  "notag",
  "nonumber",
  "relax",
  "mathstrut",
  "strut",
]);

const SIZERS = new Set(["left", "right", "big", "Big", "bigg", "Bigg", "bigl", "bigr", "middle"]);

const EMPTY = [new MathRun("")];

function expandMacros(src) {
  return String(src ?? "")
    .replace(/\\N(?![A-Za-z])/g, "\\mathbb{N}")
    .replace(/\\Z(?![A-Za-z])/g, "\\mathbb{Z}")
    .replace(/\\Q(?![A-Za-z])/g, "\\mathbb{Q}")
    .replace(/\\R(?![A-Za-z])/g, "\\mathbb{R}")
    .replace(/\\C(?![A-Za-z])/g, "\\mathbb{C}");
}

function wrapBrackets(open, inner) {
  const children = inner.length ? inner : EMPTY;
  if (open === "(" || open === ")") return [new MathRoundBrackets({ children })];
  if (open === "[") return [new MathSquareBrackets({ children })];
  if (open === "{" || open === "\\{") return [new MathCurlyBrackets({ children })];
  if (open === "|") return [new MathRun("|"), ...children, new MathRun("|")];
  return children;
}

function attachScripts(base, sub, sup) {
  const children = base.length ? base : EMPTY;
  if (sub.length && sup.length) {
    return [new MathSubSuperScript({ children, subScript: sub, superScript: sup })];
  }
  if (sup.length) return [new MathSuperScript({ children, superScript: sup })];
  if (sub.length) return [new MathSubScript({ children, subScript: sub })];
  return children;
}

export function latexToMathComponents(latex) {
  const src = expandMacros(latex);
  let i = 0;

  function skipSpaces() {
    while (i < src.length && /\s/.test(src[i])) i += 1;
  }

  function readDelim() {
    skipSpaces();
    if (src[i] === "\\") {
      i += 1;
      if (src[i] === "{" || src[i] === "}") return src[i++];
      if (src[i] === "|") return src[i++];
      let name = "";
      while (i < src.length && /[A-Za-z]/.test(src[i])) {
        name += src[i];
        i += 1;
      }
      if (name === "langle") return "⟨";
      if (name === "rangle") return "⟩";
      if (name === "lvert" || name === "vert") return "|";
      if (name === "lVert" || name === "Vert") return "‖";
      return name || src[i - 1] || "(";
    }
    if (i < src.length) return src[i++];
    return "(";
  }

  function peekEndEnv() {
    skipSpaces();
    if (!src.startsWith("\\end", i)) return null;
    let j = i + 4;
    while (j < src.length && /\s/.test(src[j])) j += 1;
    if (src[j] !== "{") return "";
    const close = src.indexOf("}", j + 1);
    if (close < 0) return "";
    return src.slice(j + 1, close);
  }

  function parseGroupRaw() {
    skipSpaces();
    if (src[i] !== "{") return "";
    i += 1;
    const start = i;
    let depth = 1;
    while (i < src.length && depth) {
      if (src[i] === "{") depth += 1;
      else if (src[i] === "}") depth -= 1;
      if (depth) i += 1;
    }
    const raw = src.slice(start, i);
    if (src[i] === "}") i += 1;
    return raw;
  }

  function parseScripts(base) {
    let sub = [];
    let sup = [];
    for (;;) {
      skipSpaces();
      if (src[i] === "_") {
        i += 1;
        sub = parsePrimary();
        continue;
      }
      if (src[i] === "^") {
        i += 1;
        sup = parsePrimary();
        continue;
      }
      break;
    }
    return attachScripts(base, sub, sup);
  }

  function parsePrimary() {
    skipSpaces();
    if (i >= src.length) return [];
    if (src[i] === "{") {
      i += 1;
      const inner = parseExpr();
      if (src[i] === "}") i += 1;
      return inner.length ? inner : EMPTY;
    }
    if (src[i] === "(") {
      i += 1;
      const inner = parseExpr({ stop: (ch) => ch === ")" });
      if (src[i] === ")") i += 1;
      return wrapBrackets("(", inner);
    }
    if (src[i] === "[") {
      i += 1;
      const inner = parseExpr({ stop: (ch) => ch === "]" });
      if (src[i] === "]") i += 1;
      return wrapBrackets("[", inner);
    }
    if (src[i] === "\\") return parseCommand();
    const ch = src[i++];
    if (ch === "}") return [];
    return [new MathRun(ch)];
  }

  function parseCommand() {
    i += 1;
    if (i >= src.length) return [];
    if (!/[A-Za-z]/.test(src[i])) {
      const ch = src[i++];
      if (ch === "," || ch === ":" || ch === ";" || ch === " " || ch === "!") return [];
      if (ch === "{" || ch === "}" || ch === "_" || ch === "%" || ch === "&" || ch === "#" || ch === "$") {
        return [new MathRun(ch)];
      }
      if (ch === "\\") return [new MathRun("")];
      if (ch === "(" || ch === "[" || ch === "|") {
        const inner = parseExpr({
          stop: (next) => next === ")" || next === "]" || next === "|",
        });
        if (")]}|".includes(src[i])) i += 1;
        return wrapBrackets(ch === "[" ? "[" : "(", inner);
      }
      return [new MathRun(ch)];
    }
    let name = "";
    while (i < src.length && /[A-Za-z]/.test(src[i])) {
      name += src[i];
      i += 1;
    }
    if (src[i] === "*") i += 1;

    if (SKIP.has(name) || name === "quad" || name === "qquad") {
      return name === "quad" || name === "qquad" ? [new MathRun("  ")] : [];
    }
    if (name === "left") {
      const open = readDelim();
      const inner = parseExpr({ stopRight: true });
      skipSpaces();
      if (src.startsWith("\\right", i)) {
        i += 6;
        readDelim();
      }
      return wrapBrackets(open, inner);
    }
    if (name === "right") {
      readDelim();
      return [];
    }
    if (SIZERS.has(name)) {
      const open = readDelim();
      return wrapBrackets(open, parsePrimary());
    }
    if (name === "begin") {
      const env = parseGroupRaw();
      const body = parseExpr({ endEnv: env });
      skipSpaces();
      if (src.startsWith("\\end", i)) {
        i += 4;
        parseGroupRaw();
      }
      const kind = env.replace(/\*$/, "");
      if (kind === "bmatrix" || kind === "Bmatrix") return wrapBrackets("[", body);
      if (kind === "vmatrix" || kind === "cases") return wrapBrackets("{", body);
      if (/matrix|array|pmatrix/.test(kind)) return wrapBrackets("(", body);
      return body.length ? body : EMPTY;
    }
    if (name === "end") {
      parseGroupRaw();
      return [];
    }
    if (name === "frac" || name === "dfrac" || name === "tfrac" || name === "cfrac") {
      return [
        new MathFraction({
          numerator: parsePrimary(),
          denominator: parsePrimary(),
        }),
      ];
    }
    if (name === "binom" || name === "dbinom" || name === "tbinom") {
      const n = parsePrimary();
      const k = parsePrimary();
      return [
        new MathRun("C"),
        new MathRoundBrackets({
          children: [...n, new MathRun(","), ...k],
        }),
      ];
    }
    if (name === "sqrt") {
      skipSpaces();
      let degree;
      if (src[i] === "[") {
        i += 1;
        degree = parseExpr({ stop: (ch) => ch === "]" });
        if (src[i] === "]") i += 1;
      }
      return [new MathRadical({ children: parsePrimary(), degree })];
    }
    if (
      name === "text" ||
      name === "mathrm" ||
      name === "operatorname" ||
      name === "mathbf" ||
      name === "mathit" ||
      name === "textrm"
    ) {
      return parsePrimary();
    }
    if (name === "mathbb") {
      const raw = parseGroupRaw() || latexToPlainText("");
      const mapped = [...raw].map((ch) => BB[ch] || ch).join("");
      return [new MathRun(mapped || "ℝ")];
    }
    if (name === "abs") {
      return wrapBrackets("|", parsePrimary());
    }
    if (name === "norm") {
      const inner = parsePrimary();
      return [new MathRun("‖"), ...inner, new MathRun("‖")];
    }
    if (name === "sum" || name === "prod" || name === "int" || name === "oint" || name === "iint") {
      let sub = [];
      let sup = [];
      skipSpaces();
      if (src[i] === "_") {
        i += 1;
        sub = parsePrimary();
      }
      skipSpaces();
      if (src[i] === "^") {
        i += 1;
        sup = parsePrimary();
      }
      const options = {
        children: EMPTY,
        ...(sub.length ? { subScript: sub } : {}),
        ...(sup.length ? { superScript: sup } : {}),
      };
      if (name === "int" || name === "oint" || name === "iint") return [new MathIntegral(options)];
      if (name === "prod") return attachScripts([new MathRun("∏")], sub, sup);
      return [new MathSum(options)];
    }
    if (name === "ce") {
      return [new MathRun(latexToPlainText(`\\ce{${parseGroupRaw()}}`))];
    }
    if (GREEK[name]) return [new MathRun(GREEK[name])];
    if (SYMBOLS[name]) return [new MathRun(SYMBOLS[name])];
    if (FNS.has(name)) {
      skipSpaces();
      if (src[i] === "(" || src[i] === "{") {
        return [new MathFunction({ name: [new MathRun(name)], children: parsePrimary() })];
      }
      return [new MathRun(name)];
    }
    skipSpaces();
    if (src[i] === "{") return parsePrimary();
    return [new MathRun(name)];
  }

  function parseExpr(opts = {}) {
    const out = [];
    while (i < src.length) {
      skipSpaces();
      const ch = src[i];
      if (!ch) break;
      if (opts.stop?.(ch, src, i)) break;
      if (opts.stopRight && src.startsWith("\\right", i)) break;
      if (opts.endEnv && peekEndEnv() != null) {
        const endName = peekEndEnv();
        if (endName === opts.endEnv || endName.replace(/\*$/, "") === String(opts.endEnv).replace(/\*$/, "")) {
          break;
        }
      }
      if (ch === "}") break;
      if (ch === "%") {
        while (i < src.length && src[i] !== "\n") i += 1;
        continue;
      }
      if (ch === "&") {
        i += 1;
        continue;
      }
      if (ch === "$") {
        i += 1;
        continue;
      }
      out.push(...parseScripts(parsePrimary()));
    }
    return out;
  }

  const parts = parseExpr();
  return parts.length ? parts : EMPTY;
}

export function mathFromLatex(latex) {
  const source = String(latex ?? "").trim();
  if (!source) return null;
  try {
    return new WordMath({ children: latexToMathComponents(source) });
  } catch {
    const text = latexToPlainText(source);
    if (!text) return null;
    return new WordMath({ children: [new MathRun(text)] });
  }
}
