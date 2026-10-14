/**
 * Turn LaTeX into copyable plain text for PDF/DOCX export.
 * Layout (fractions, matrices) is linearized; color is ignored.
 */

const SUP = {
  "0": "⁰",
  "1": "¹",
  "2": "²",
  "3": "³",
  "4": "⁴",
  "5": "⁵",
  "6": "⁶",
  "7": "⁷",
  "8": "⁸",
  "9": "⁹",
  "+": "⁺",
  "-": "⁻",
  "=": "⁼",
  "(": "⁽",
  ")": "⁾",
  n: "ⁿ",
  i: "ⁱ",
  k: "ᵏ",
  a: "ᵃ",
  b: "ᵇ",
  c: "ᶜ",
  d: "ᵈ",
  e: "ᵉ",
  f: "ᶠ",
  g: "ᵍ",
  h: "ʰ",
  j: "ʲ",
  l: "ˡ",
  m: "ᵐ",
  o: "ᵒ",
  p: "ᵖ",
  r: "ʳ",
  s: "ˢ",
  t: "ᵗ",
  u: "ᵘ",
  v: "ᵛ",
  w: "ʷ",
  x: "ˣ",
  y: "ʸ",
  z: "ᶻ",
};

const SUB = {
  "0": "₀",
  "1": "₁",
  "2": "₂",
  "3": "₃",
  "4": "₄",
  "5": "₅",
  "6": "₆",
  "7": "₇",
  "8": "₈",
  "9": "₉",
  "+": "₊",
  "-": "₋",
  "=": "₌",
  "(": "₍",
  ")": "₎",
  a: "ₐ",
  e: "ₑ",
  h: "ₕ",
  i: "ᵢ",
  j: "ⱼ",
  k: "ₖ",
  l: "ₗ",
  m: "ₘ",
  n: "ₙ",
  o: "ₒ",
  p: "ₚ",
  r: "ᵣ",
  s: "ₛ",
  t: "ₜ",
  u: "ᵤ",
  v: "ᵥ",
  x: "ₓ",
};

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
  varpi: "ϖ",
  rho: "ρ",
  varrho: "ϱ",
  sigma: "σ",
  varsigma: "ς",
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
  Upsilon: "Υ",
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
  cdotp: "·",
  ast: "∗",
  star: "⋆",
  circ: "∘",
  bullet: "•",
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
  simeq: "≃",
  propto: "∝",
  cong: "≅",
  ll: "≪",
  gg: "≫",
  in: "∈",
  notin: "∉",
  ni: "∋",
  subset: "⊂",
  subseteq: "⊆",
  supset: "⊃",
  supseteq: "⊇",
  cup: "∪",
  cap: "∩",
  emptyset: "∅",
  empty: "∅",
  forall: "∀",
  exists: "∃",
  nexists: "∄",
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
  longrightarrow: "⟶",
  sum: "∑",
  prod: "∏",
  int: "∫",
  iint: "∬",
  iiint: "∭",
  oint: "∮",
  ldots: "…",
  dots: "…",
  cdots: "⋯",
  vdots: "⋮",
  ddots: "⋱",
  ell: "ℓ",
  hbar: "ℏ",
  Re: "ℜ",
  Im: "ℑ",
  aleph: "ℵ",
  angle: "∠",
  perp: "⊥",
  parallel: "∥",
  degree: "°",
  lfloor: "⌊",
  rfloor: "⌋",
  lceil: "⌈",
  rceil: "⌉",
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
  ominus: "⊖",
  wedge: "∧",
  vee: "∨",
  land: "∧",
  lor: "∨",
  neg: "¬",
  lnot: "¬",
  colon: ":",
  percent: "%",
  sharp: "#",
  amp: "&",
  and: "&",
};

const BB = { N: "ℕ", Z: "ℤ", Q: "ℚ", R: "ℝ", C: "ℂ", P: "ℙ", H: "ℍ" };

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
  "Pr",
  "hom",
  "mod",
  "bmod",
  "pmod",
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
  "!",
  "quad",
  "qquad",
  "enspace",
  "thinspace",
  "negthinspace",
  "smallskip",
  "medskip",
  "bigskip",
]);

const SIZERS = new Set([
  "left",
  "right",
  "big",
  "Big",
  "bigg",
  "Bigg",
  "bigl",
  "bigr",
  "Bigl",
  "Bigr",
  "biggl",
  "biggr",
  "Biggl",
  "Biggr",
  "middle",
]);

const TEXT_CMDS = new Set([
  "text",
  "mathrm",
  "operatorname",
  "mbox",
  "textrm",
  "textit",
  "textbf",
  "mathit",
  "mathbf",
  "mathsf",
  "mathtt",
  "textnormal",
  "operatornamewithlimits",
  "textrm",
]);

function toScript(text, map) {
  const chars = [...String(text ?? "")];
  if (!chars.length) return "";
  const converted = chars.map((ch) => {
    if (map[ch]) return map[ch];
    if (/[\u0080-\uFFFF]/.test(ch)) return ch;
    return null;
  });
  if (converted.every(Boolean)) return converted.join("");
  const mark = map === SUP ? "^" : "_";
  return chars.length === 1 ? `${mark}${text}` : `${mark}(${text})`;
}

function applyOver(inner, mark) {
  return [...inner].map((ch) => (ch.trim() ? `${ch}${mark}` : ch)).join("");
}

function fenceMatrix(body, open, close) {
  const rows = String(body)
    .replace(/^\n+|\n+$/g, "")
    .split("\n")
    .map((row) => row.replace(/\s+/g, " ").trim())
    .filter(Boolean);
  if (!rows.length) return `${open}${close}`;
  if (rows.length === 1) return `${open}${rows[0]}${close}`;
  return rows.map((row, index) => `${index === 0 ? open : open} ${row} ${index === rows.length - 1 ? close : ""}`.trimEnd()).join("\n");
}

function formatEnv(env, body) {
  const name = String(env ?? "").replace(/\*$/, "").trim();
  const trimmed = String(body ?? "").replace(/^\n+|\n+$/g, "");
  if (
    /^(align|aligned|alignat|alignedat|gather|gathered|equation|split|multline)$/.test(name)
  ) {
    return trimmed.replace(/ {2}=/g, " = ");
  }
  if (name === "cases" || name === "dcases" || name === "rcases") {
    const rows = trimmed.split("\n").map((row) => row.trim()).filter(Boolean);
    return `{ ${rows.join("; ")} }`;
  }
  const fences = {
    pmatrix: ["(", ")"],
    bmatrix: ["[", "]"],
    Bmatrix: ["{", "}"],
    vmatrix: ["|", "|"],
    Vmatrix: ["‖", "‖"],
    matrix: ["[", "]"],
    smallmatrix: ["[", "]"],
    array: ["[", "]"],
    darray: ["[", "]"],
  };
  if (fences[name]) return fenceMatrix(trimmed, fences[name][0], fences[name][1]);
  return trimmed;
}

function chemToText(value) {
  return String(value ?? "")
    .replace(/->/g, "→")
    .replace(/<-/g, "←")
    .replace(/([A-Za-z)\]]\s*)(\d+)/g, (_, left, digits) => `${left}${toScript(digits, SUB)}`);
}

function expandMacros(src) {
  return String(src ?? "")
    .replace(/\\N(?![A-Za-z])/g, "\\mathbb{N}")
    .replace(/\\Z(?![A-Za-z])/g, "\\mathbb{Z}")
    .replace(/\\Q(?![A-Za-z])/g, "\\mathbb{Q}")
    .replace(/\\R(?![A-Za-z])/g, "\\mathbb{R}")
    .replace(/\\C(?![A-Za-z])/g, "\\mathbb{C}");
}

export function latexToPlainText(latex) {
  const src = expandMacros(latex);
  let i = 0;

  function skipSpaces() {
    while (i < src.length && /\s/.test(src[i])) i += 1;
  }

  function peekEndEnv() {
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
    if (src[i] !== "{") return parseAtom();
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

  function parseAtom() {
    skipSpaces();
    if (src[i] === "{") {
      i += 1;
      const inner = parseExpr();
      if (src[i] === "}") i += 1;
      return inner;
    }
    if (src[i] === "\\") return parseCommand();
    if (i < src.length) {
      const ch = src[i];
      i += 1;
      return ch;
    }
    return "";
  }

  function parseOptional() {
    skipSpaces();
    if (src[i] !== "[") return "";
    i += 1;
    const inner = parseExpr({ stop: (ch) => ch === "]" });
    if (src[i] === "]") i += 1;
    return inner;
  }

  function parseCommand() {
    i += 1;
    if (i >= src.length) return "";
    if (!/[A-Za-z]/.test(src[i])) {
      const ch = src[i];
      i += 1;
      if (ch === "\\") {
        if (src[i] === "*") i += 1;
        parseOptional();
        return "\n";
      }
      if (ch === "," || ch === ":" || ch === ";" || ch === " ") return " ";
      if (ch === "!") return "";
      if (ch === "{" || ch === "}" || ch === "_" || ch === "%" || ch === "&" || ch === "#" || ch === "$") return ch;
      return ch;
    }
    let name = "";
    while (i < src.length && /[A-Za-z]/.test(src[i])) {
      name += src[i];
      i += 1;
    }
    if (src[i] === "*") i += 1;

    if (SIZERS.has(name)) return parseAtom();
    if (name === "quad") return "  ";
    if (name === "qquad") return "    ";
    if (SKIP.has(name)) return name === "quad" || name === "qquad" ? "  " : "";
    if (name === "begin") {
      const env = parseGroupRaw();
      const body = parseExpr({ endEnv: env });
      skipSpaces();
      if (src.startsWith("\\end", i)) {
        i += 4;
        parseGroupRaw();
      }
      return formatEnv(env, body);
    }
    if (name === "end") {
      parseGroupRaw();
      return "";
    }
    if (name === "frac" || name === "dfrac" || name === "tfrac" || name === "cfrac") {
      return `(${parseAtom()})/(${parseAtom()})`;
    }
    if (name === "binom" || name === "dbinom" || name === "tbinom") {
      return `C(${parseAtom()},${parseAtom()})`;
    }
    if (name === "sqrt") {
      const n = parseOptional();
      const inner = parseAtom();
      return n ? `${toScript(n, SUP)}√(${inner})` : `√(${inner})`;
    }
    if (TEXT_CMDS.has(name)) return parseAtom();
    if (name === "mathbb") {
      return [...parseAtom()].map((ch) => BB[ch] || ch).join("");
    }
    if (name === "overline" || name === "bar") return applyOver(parseAtom(), "\u0305");
    if (name === "hat" || name === "widehat") return applyOver(parseAtom(), "\u0302");
    if (name === "tilde" || name === "widetilde") return applyOver(parseAtom(), "\u0303");
    if (name === "vec") return applyOver(parseAtom(), "\u20D7");
    if (name === "dot") return applyOver(parseAtom(), "\u0307");
    if (name === "ddot") return applyOver(parseAtom(), "\u0308");
    if (name === "underline") return applyOver(parseAtom(), "\u0332");
    if (name === "abs") return `|${parseAtom()}|`;
    if (name === "norm") return `‖${parseAtom()}‖`;
    if (name === "ce") return chemToText(parseAtom());
    if (name === "overset" || name === "underset" || name === "stackrel") {
      const a = parseAtom();
      const b = parseAtom();
      return `${b}(${a})`;
    }
    if (["hspace", "vspace", "kern", "mkern", "hskip", "vskip", "phantom", "hphantom", "vphantom"].includes(name)) {
      parseAtom();
      return name.startsWith("v") ? "" : " ";
    }
    if (name === "color" || name === "textcolor" || name === "colorbox" || name === "fcolorbox") {
      parseAtom();
      if (name === "fcolorbox") parseAtom();
      return name === "color" ? "" : parseAtom();
    }
    if (name === "newline" || name === "linebreak") return "\n";
    if (GREEK[name]) return GREEK[name];
    if (SYMBOLS[name]) return SYMBOLS[name];
    if (FNS.has(name)) return name;
    if (src[i] === "{") return parseAtom();
    return name;
  }

  function parseExpr(opts = {}) {
    let out = "";
    while (i < src.length) {
      const ch = src[i];
      if (opts.stop?.(ch, src, i)) break;
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
      if (ch === "{") {
        i += 1;
        out += parseExpr();
        if (src[i] === "}") i += 1;
        continue;
      }
      if (ch === "$") {
        i += 1;
        continue;
      }
      if (ch === "&") {
        out += "  ";
        i += 1;
        continue;
      }
      if (ch === "^") {
        i += 1;
        out += toScript(parseAtom(), SUP);
        continue;
      }
      if (ch === "_") {
        i += 1;
        out += toScript(parseAtom(), SUB);
        continue;
      }
      if (ch === "\\") {
        out += parseCommand();
        continue;
      }
      if (ch === "~") {
        out += " ";
        i += 1;
        continue;
      }
      out += ch;
      i += 1;
    }
    return out;
  }

  return parseExpr()
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, "  ")
    .trim();
}

export function codeToPlainText(code) {
  return String(code ?? "").replace(/\u200B/g, "").replace(/\r\n/g, "\n");
}
