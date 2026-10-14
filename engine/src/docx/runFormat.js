// Imported Word run formatting -> the inline format attributes every exporter already understands
// (fmt-* classes, data-fmt-color / data-fmt-bg / data-fmt-valign). The editor shows imported run formatting
// through node-id CSS (projection.js), but DOCX/PDF export reads the HTML, so the format must also travel as markup.
// Word highlight names -> the exact colour Word paints for them.
const HIGHLIGHT_HEX = Object.freeze({
  yellow: "#FFFF00", green: "#00FF00", cyan: "#00FFFF", magenta: "#FF00FF", blue: "#0000FF", red: "#FF0000",
  darkBlue: "#000080", darkCyan: "#008080", darkGreen: "#008000", darkMagenta: "#800080", darkRed: "#800000", darkYellow: "#808000",
  darkGray: "#808080", lightGray: "#C0C0C0", black: "#000000", white: "#FFFFFF",
});
/** Attributes (including a `class` fragment) for the direct run properties of an imported `w:r`; `{}` when nothing applies. */
export function runFormatAttributes(direct) {
  if (!direct || typeof direct !== "object") return {};
  const classes = [];
  if (direct.bold === true) classes.push("fmt-bold");
  if (direct.italic === true) classes.push("fmt-italic");
  if (direct.underline === true) classes.push("fmt-underline");
  if (direct.strike === true) classes.push("fmt-strike");
  const result = {};
  if (classes.length) result.class = classes.join(" ");
  if (/^#[\da-f]{6}$/i.test(direct.color || "")) result["data-fmt-color"] = direct.color.toLowerCase();
  const fill = HIGHLIGHT_HEX[direct.highlight];
  if (fill) result["data-fmt-bg"] = fill.toLowerCase();
  if (direct.verticalAlign === "superscript") result["data-fmt-valign"] = "super";
  else if (direct.verticalAlign === "subscript") result["data-fmt-valign"] = "sub";
  return result;
}

/**
 * Markup the exporter's field folding (fields.js foldFieldMarkup) recognises: the begin/separate/end kind and the instruction
 * of a complex field, or the instruction of a simple field, so imported REF/SEQ/PAGEREF/TOC fields stay live instead of becoming cached text.
 */
export function fieldMarkerAttributes(node, attr) {
  if (node.localName === "fldChar") return { "data-docx-fldchar": attr(node, "fldCharType") };
  if (node.localName === "instrText") return { "data-docx-instruction": safeFieldInstruction(node.textContent || "") };
  if (node.localName === "fldSimple") return { "data-docx-fldsimple": safeFieldInstruction(attr(node, "instr") || "") };
  return {};
}

const BLOCKED_FIELDS = new Set(["INCLUDETEXT", "INCLUDEPICTURE", "LINK", "DDE", "DDEAUTO", "IMPORT", "MACROBUTTON", "RD", "AUTOTEXT"]);
/** Field code that may travel as markup: fields that load external content or hyperlinks to unsafe schemes become an inert placeholder (the cached result stays). */
export function safeFieldInstruction(instruction) {
  const text = String(instruction ?? ""), name = text.trim().split(/\s+/)[0]?.toUpperCase() || "";
  if (BLOCKED_FIELDS.has(name)) return " ADDIN TxtNote.BlockedField ";
  if (name === "HYPERLINK" && !/\\l\b/i.test(text) && !/^\s*HYPERLINK\s+"?(?:https?:|mailto:)/i.test(text)) return " ADDIN TxtNote.BlockedField ";
  return text;
}
