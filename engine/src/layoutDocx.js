/** Editable Word export primitives for positioned special-page layout nodes. */
import {
  AlignmentType, BorderStyle, FrameAnchorType, FrameWrap, HeightRule, HorizontalPositionRelativeFrom,
  HeadingLevel, ImageRun, LineRuleType, PageNumber, Paragraph, TextRun, TextWrappingType, VerticalPositionRelativeFrom, WpsShapeRun,
} from "./docx/runtime.js";
import { convertLength, mmToTwip, ptToTwip } from "./units.js";
import { transformThesisText } from "./engine.js";
import { FORMAT_HIGHLIGHTS } from "../../TxtNote/frontend/src/config/format.js";
import { conditionalPageNumberRuns } from './docx/pageNumberFields.js';

const aligned = (value) => ({ center: AlignmentType.CENTER, right: AlignmentType.RIGHT, justify: AlignmentType.JUSTIFIED }[value] || AlignmentType.LEFT);
const validGeometry = (node) => Number.isFinite(node.xMm) && Number.isFinite(node.yMm) && Number.isFinite(node.widthMm) && node.widthMm > 0;
const validImageBox = (node) => validGeometry(node) && Number.isFinite(node.heightMm) && node.heightMm > 0;
const relativeHeight = (value) => Math.max(0, Math.min(65535, Math.round((Number.isSafeInteger(value) ? value : 0) + 32768)));
const imageBytes = (source) => {
  const match = String(source || "").match(/^data:image\/(png|jpe?g);base64,(.+)$/i);
  if (!match) return null;
  const binary = typeof atob === "function" ? atob(match[2]) : Buffer.from(match[2], "base64").toString("binary");
  return { type: /png/i.test(match[1]) ? "png" : "jpg", data: Uint8Array.from(binary, (char) => char.charCodeAt(0)) };
};
const borderColor = (node) => (typeof node.style?.color === "string" && /^#[0-9a-f]{6}$/i.test(node.style.color) ? node.style.color.slice(1).toUpperCase() : "000000");

/** Split positioned leaves from flow groups so they never become nested in row tables. */
export function splitLayoutNodes(nodes) {
  const flow = [];
  const positioned = [];
  for (const node of nodes || []) {
    if (!node || typeof node !== "object") continue;
    if (node.type === "group") {
      if (["absolute", "anchored"].includes(node.layoutMode)) throw new Error(`Pozisyonlu grup ${node.id || "?"} dışa aktarılamıyor; grup içindeki öğeleri ayrı konumlandırın`);
      const split = splitLayoutNodes(node.blocks);
      positioned.push(...split.positioned);
      if (split.flow.length) flow.push({ ...node, blocks: split.flow });
      else if (Number(node.marginTopMm) > 0 || Number(node.marginBottomMm) > 0) {
        flow.push({ type: "spacer", heightMm: Number(node.marginTopMm || 0) + Number(node.marginBottomMm || 0), marginTopMm: 0, marginBottomMm: 0 });
      }
    } else if (["absolute", "anchored"].includes(node.layoutMode)) {
      if (!["text", "image", "separator"].includes(node.type)) throw new Error(`Pozisyonlu öğe türü ${node.type || "?"} dışa aktarılamıyor`);
      positioned.push(node);
    }
    else flow.push(node);
  }
  return { flow, positioned };
}

function textRuns(text, style = {}, language = "tr") {
  const fontSizePt = Number(style.fontSizePt) || 12;
  const highlight = FORMAT_HIGHLIGHTS.find((entry) => entry.id === style.highlight)?.swatch || style.highlight;
  if (!Number.isInteger(fontSizePt * 2)) throw new Error(`Word metin boyutu ${fontSizePt} pt yarım punto biriminde saklanamıyor`);
  const common = {
    font: style.fontFamily,
    size: fontSizePt * 2,
    bold: Number(style.fontWeight) >= 600,
    italics: Boolean(style.italic),
    ...(style.color && /^#[0-9a-f]{6}$/i.test(style.color) ? { color: style.color.slice(1).toUpperCase() } : {}),
    ...(typeof highlight === "string" && /^#[0-9a-f]{6}$/i.test(highlight) ? { shading: { fill: highlight.slice(1).toUpperCase(), type: "clear" } } : {}),
    ...(Number.isFinite(style.characterSpacingPt) && style.characterSpacingPt ? { characterSpacing: ptToTwip(style.characterSpacingPt) } : {}),
    underline: /\bunderline\b/.test(style.decoration || "") ? {} : undefined,
    strike: /\bline-through\b/.test(style.decoration || ""),
    language: { value: language },
  };
  const transformed = transformThesisText(text, style, language).split("\n");
  return transformed.flatMap((part, index) => [...(index ? [new TextRun({ break: 1 })] : []), ...(part ? [new TextRun({ ...common, text: part })] : [])]);
}

function linePitch(style, lineSpacing) {
  const factor = Number(style.lineHeight) || 1.5;
  return lineSpacing?.mode === "word"
    ? { line: Math.round(240 * factor), lineRule: LineRuleType.AUTO }
    : { line: ptToTwip((Number(style.fontSizePt) || 12) * factor), lineRule: LineRuleType.AT_LEAST };
}

function textFrame(node, { language = "tr", lineSpacing = null } = {}) {
  if (!validGeometry(node) || node.type !== "text") throw new Error(`Pozisyonlu metin ${node.id || "?"} için x/y/genişlik ölçüleri gerekli`);
  const style = node.style || {};
  const widthMm = node.widthMm;
  const lineHeightMm = (Number(style.fontSizePt) || 12) * ((Number(style.lineHeight) || 1.5) * (25.4 / 72));
  const heightMm = Number.isFinite(node.heightMm) && node.heightMm > 0 ? node.heightMm : lineHeightMm;
  const paragraphs = (["ul", "ol"].includes(node.list) ? String(node.text || "").split("\n") : [node.text]).map((text, index) => new Paragraph({
    ...(node.headingLevel ? { heading: HeadingLevel[`HEADING_${node.headingLevel}`] } : {}),
    alignment: aligned(style.align),
    spacing: { before: ptToTwip(style.spaceBeforePt || 0), after: ptToTwip(style.spaceAfterPt || 0), ...linePitch(style, lineSpacing) },
    indent: { firstLine: mmToTwip(style.firstLineIndentMm || 0), left: mmToTwip(style.leftIndentMm || 0), right: mmToTwip(style.rightIndentMm || 0) },
    children: textRuns(node.list === "ul" ? `• ${text}` : node.list === "ol" ? `${index + 1}. ${text}` : text, style, language),
  }));
  // DrawingML's editable text box has zero insets; x/y are measured from the page edge.
  return new WpsShapeRun({
    type: "wps",
    transformation: { width: convertLength(widthMm, "mm", "px"), height: convertLength(heightMm, "mm", "px") },
    floating: {
      horizontalPosition: { relative: HorizontalPositionRelativeFrom.PAGE, offset: Math.round(convertLength(node.xMm, "mm", "emu")) },
      verticalPosition: { relative: VerticalPositionRelativeFrom.PAGE, offset: Math.round(convertLength(node.yMm, "mm", "emu")) },
      allowOverlap: true, lockAnchor: false, layoutInCell: false,
      wrap: { type: TextWrappingType.NONE }, zIndex: relativeHeight(node.zIndex),
    },
    nonVisualProperties: { txBox: "1" },
    altText: { name: node.id || "TxtNote positioned text", title: node.id || "TxtNote positioned text" },
    bodyProperties: { margins: { top: 0, bottom: 0, left: 0, right: 0 }, noAutoFit: false },
    children: paragraphs,
  });
}

function imageFrame(node, options = {}) {
  if (!validImageBox(node) || node.type !== "image") throw new Error(`Pozisyonlu görsel ${node.id || "?"} için geometri gerekli`);
  const image = imageBytes(node.source);
  if (!image) throw new Error(`Pozisyonlu görsel ${node.id || "?"} için gömülü PNG/JPEG kaynak gerekli`);
  const widthPx = convertLength(node.widthMm, "mm", "px");
  const heightPx = convertLength(node.heightMm, "mm", "px");
  const pageMargins = node.positionOrigin === "content" ? (options.pageMargins || {}) : {};
  const xMm = node.xMm + (Number(pageMargins.leftMm) || 0);
  const yMm = node.yMm + (Number(pageMargins.topMm) || 0);
  const floating = {
    horizontalPosition: { relative: HorizontalPositionRelativeFrom.PAGE, offset: Math.round(convertLength(xMm, "mm", "emu")) },
    verticalPosition: { relative: VerticalPositionRelativeFrom.PAGE, offset: Math.round(convertLength(yMm, "mm", "emu")) },
    allowOverlap: true, lockAnchor: false, layoutInCell: false,
    wrap: { type: TextWrappingType.NONE },
    zIndex: relativeHeight(node.zIndex),
  };
  return new Paragraph({ spacing: { before: 0, after: 0, line: 1, lineRule: LineRuleType.EXACT }, children: [new ImageRun({ ...image, transformation: { width: widthPx, height: heightPx }, floating, altText: { name: node.id || "TxtNote positioned image", title: node.id || "TxtNote positioned image" } })] });
}

function lineFrame(node) {
  if (!validGeometry(node) || node.type !== "separator") throw new Error(`Pozisyonlu çizgi ${node.id || "?"} için x/y/genişlik ölçüleri gerekli`);
  const height = Math.max(0.25, Number(node.heightMm) || 0.25);
  const thicknessPt = Number(node.thicknessPt) > 0 ? Number(node.thicknessPt) : 0.75;
  return new Paragraph({
    frame: {
      type: "absolute", position: { x: mmToTwip(node.xMm), y: mmToTwip(node.yMm) },
      width: mmToTwip(node.widthMm), height: mmToTwip(height),
      anchor: { horizontal: FrameAnchorType.PAGE, vertical: FrameAnchorType.PAGE },
      wrap: FrameWrap.NONE, rule: HeightRule.EXACT,
    },
    spacing: { before: 0, after: 0, line: 1, lineRule: LineRuleType.EXACT },
    border: { bottom: { style: BorderStyle.SINGLE, size: Math.max(2, Math.round(thicknessPt * 8)), color: borderColor(node), space: 0 } },
    children: [new TextRun({ text: "", size: 2 })],
  });
}

/** Word document children for positioned leaves; flow children stay with specialPageDocx. */
export function positionedLayoutDocx(nodes, options = {}) {
  const out = [];
  for (const node of nodes || []) {
    if (node.type === "text") out.push(new Paragraph({
      spacing: { before: 0, after: 0, line: 1, lineRule: LineRuleType.EXACT },
      children: [textFrame(node, options)],
    }));
    else if (node.type === "image") { const frame = imageFrame(node, options); if (frame) out.push(frame); }
    else if (node.type === "separator") { const frame = lineFrame(node); if (frame) out.push(frame); }
  }
  return out;
}

/** Page-anchored flow text box. Unlike a positioned leaf, all paragraphs retain Word's natural wrapping. */
export function positionedFlowTextBoxDocx(paragraphs, frame) {
  if (!Array.isArray(paragraphs) || !paragraphs.length || paragraphs.some((paragraph) => !(paragraph instanceof Paragraph))) {
    throw new Error("Sabit yükseklikli Word metin kutusu yalnızca paragraf akışı kabul eder");
  }
  if (![frame?.xMm, frame?.yMm, frame?.widthMm, frame?.heightMm].every(Number.isFinite)
    || frame.xMm < 0 || frame.yMm < 0 || frame.widthMm <= 0 || frame.heightMm <= 0) {
    throw new Error("Sabit yükseklikli Word metin kutusu için geçerli geometri gerekli");
  }
  return new Paragraph({
    spacing: { before: 0, after: 0, line: 1, lineRule: LineRuleType.EXACT },
    children: [new WpsShapeRun({
      type: "wps",
      transformation: { width: convertLength(frame.widthMm, "mm", "px"), height: convertLength(frame.heightMm, "mm", "px") },
      floating: {
        horizontalPosition: { relative: HorizontalPositionRelativeFrom.PAGE, offset: Math.round(convertLength(frame.xMm, "mm", "emu")) },
        verticalPosition: { relative: VerticalPositionRelativeFrom.PAGE, offset: Math.round(convertLength(frame.yMm, "mm", "emu")) },
        allowOverlap: true, lockAnchor: false, layoutInCell: false,
        wrap: { type: TextWrappingType.NONE }, zIndex: relativeHeight(frame.zIndex),
      },
      nonVisualProperties: { txBox: "1" },
      altText: { name: frame.id || "TxtNote flow text frame", title: frame.id || "TxtNote flow text frame" },
      bodyProperties: { margins: { top: 0, bottom: 0, left: 0, right: 0 }, noAutoFit: true },
      children: paragraphs,
    })],
  });
}

/** A real PAGE field inside a page-anchored editable text box. */
export function positionedPageNumberDocx({ xMm, yMm, widthMm, heightMm, fontFamily, fontSizePt, fontWeight, italic, color, onlyLabel, excludeLabels, align = "right" }, language = "tr") {
  if (![xMm, yMm, widthMm, heightMm, fontSizePt].every(Number.isFinite) || xMm < 0 || yMm < 0 || widthMm <= 0 || heightMm <= 0 || fontSizePt <= 0 || !fontFamily) {
    throw new Error("Pozisyonlu sayfa numarası için kutu geometrisi ve tipografi gerekli");
  }
  if (!Number.isInteger(fontSizePt * 2)) throw new Error(`Word metin boyutu ${fontSizePt} pt yarım punto biriminde saklanamıyor`);
  const content = new Paragraph({
    alignment: aligned(align),
    spacing: { before: 0, after: 0, line: 240, lineRule: LineRuleType.AUTO },
    children: onlyLabel !== undefined || excludeLabels?.length ? conditionalPageNumberRuns({ fontFamily, fontSizePt, fontWeight, italic, color }, onlyLabel, excludeLabels) : [new TextRun({ font: fontFamily, size: fontSizePt * 2, language: { value: language }, children: [PageNumber.CURRENT] })],
  });
  const shape = new WpsShapeRun({
    type: "wps",
    transformation: { width: convertLength(widthMm, "mm", "px"), height: convertLength(heightMm, "mm", "px") },
    floating: {
      horizontalPosition: { relative: HorizontalPositionRelativeFrom.PAGE, offset: Math.round(convertLength(xMm, "mm", "emu")) },
      verticalPosition: { relative: VerticalPositionRelativeFrom.PAGE, offset: Math.round(convertLength(yMm, "mm", "emu")) },
      allowOverlap: true, lockAnchor: false, layoutInCell: false,
      wrap: { type: TextWrappingType.NONE }, zIndex: relativeHeight(0),
    },
    nonVisualProperties: { txBox: "1" },
    altText: { name: "TxtNote page number", title: "TxtNote page number" },
    bodyProperties: { margins: { top: 0, bottom: 0, left: 0, right: 0 }, noAutoFit: true },
    children: [content],
  });
  return new Paragraph({ spacing: { before: 0, after: 0, line: 1, lineRule: LineRuleType.EXACT }, children: [shape] });
}
