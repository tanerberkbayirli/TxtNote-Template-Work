/** DOCX writer for pictures: inline or anchored `ImageRun`s with size, wrap, anchor position, alt text and crop.
 * docx 9.7 has no crop option, so a crop is carried as a marker in `wp:docPr/@name` and written as `a:srcRect`
 * by `applyImageCrops` while the package is finalized (package.js). */
import { HorizontalPositionAlign, HorizontalPositionRelativeFrom, ImageRun, TextWrappingSide, TextWrappingType, VerticalPositionAlign, VerticalPositionRelativeFrom } from "./runtime.js";
import { parseCrop } from "./images.js";
import { imageBytes } from "./xml.js";

const MARK = "txnCrop";
const EMU_PT = 12700;
const H_FROM = { page: HorizontalPositionRelativeFrom.PAGE, margin: HorizontalPositionRelativeFrom.MARGIN, column: HorizontalPositionRelativeFrom.COLUMN, character: HorizontalPositionRelativeFrom.CHARACTER, leftMargin: HorizontalPositionRelativeFrom.LEFT_MARGIN, rightMargin: HorizontalPositionRelativeFrom.RIGHT_MARGIN, insideMargin: HorizontalPositionRelativeFrom.INSIDE_MARGIN, outsideMargin: HorizontalPositionRelativeFrom.OUTSIDE_MARGIN };
const V_FROM = { page: VerticalPositionRelativeFrom.PAGE, margin: VerticalPositionRelativeFrom.MARGIN, paragraph: VerticalPositionRelativeFrom.PARAGRAPH, line: VerticalPositionRelativeFrom.LINE, topMargin: VerticalPositionRelativeFrom.TOP_MARGIN, bottomMargin: VerticalPositionRelativeFrom.BOTTOM_MARGIN, insideMargin: VerticalPositionRelativeFrom.INSIDE_MARGIN, outsideMargin: VerticalPositionRelativeFrom.OUTSIDE_MARGIN };
const H_ALIGN = { left: HorizontalPositionAlign.LEFT, center: HorizontalPositionAlign.CENTER, right: HorizontalPositionAlign.RIGHT, inside: HorizontalPositionAlign.INSIDE, outside: HorizontalPositionAlign.OUTSIDE };
const V_ALIGN = { top: VerticalPositionAlign.TOP, center: VerticalPositionAlign.CENTER, bottom: VerticalPositionAlign.BOTTOM, inside: VerticalPositionAlign.INSIDE, outside: VerticalPositionAlign.OUTSIDE };
const WRAP = { square: TextWrappingType.SQUARE, tight: TextWrappingType.TIGHT, through: TextWrappingType.TIGHT, topAndBottom: TextWrappingType.TOP_AND_BOTTOM, none: TextWrappingType.NONE, behind: TextWrappingType.NONE };
const emu = (pt) => Math.round(Number(pt || 0) * EMU_PT);

function position(spec, from, align, fallbackFrom) {
  const [relativeFrom, mode, value] = String(spec || "").split(":");
  const relative = from[relativeFrom] || fallbackFrom;
  if (mode === "align" && align[value]) return { relative, align: align[value] };
  return { relative, offset: emu(value) };
}

/** Floating options from the image's wrap/anchor fields, or undefined for an inline picture. */
export function floatingFromImage(image) {
  const wrap = image.wrap;
  if (!wrap || !image.h || !image.v) return undefined;
  const margins = {};
  for (const [key, name] of [["distT", "top"], ["distB", "bottom"], ["distL", "left"], ["distR", "right"]]) if (Number(image[key]) > 0) margins[name] = emu(image[key]);
  return {
    horizontalPosition: position(image.h, H_FROM, H_ALIGN, HorizontalPositionRelativeFrom.COLUMN),
    verticalPosition: position(image.v, V_FROM, V_ALIGN, VerticalPositionRelativeFrom.PARAGRAPH),
    wrap: { type: WRAP[wrap] ?? TextWrappingType.NONE, ...(["square", "tight", "through"].includes(wrap) ? { side: TextWrappingSide.BOTH_SIDES } : {}) },
    behindDocument: wrap === "behind", allowOverlap: true, lockAnchor: false, layoutInCell: true,
    ...(Object.keys(margins).length ? { margins } : {}),
  };
}

/** ImageRun for a model image (`{ src, width, height, alt, title, crop, wrap, h, v, distT.. }`); null for an unsupported source. */
export function imageRun(image, { maxWidthPx } = {}) {
  const bytes = imageBytes(image.src);
  if (!bytes) return null;
  const crop = parseCrop(image.crop);
  const floating = floatingFromImage(image);
  let width = Number(image.width) || 0, height = Number(image.height) || 0;
  if (!(width > 0 && height > 0)) { width = 400; height = 250; }
  if (maxWidthPx && !floating && width > maxWidthPx) { height = height * maxWidthPx / width; width = maxWidthPx; }
  const description = String(image.alt || "").replace(/[\u0000-\u001f]/g, " ").trim();
  return new ImageRun({
    ...bytes, transformation: { width: Math.max(1, Math.round(width)), height: Math.max(1, Math.round(height)) },
    altText: { name: crop ? `${MARK}:${crop.l},${crop.t},${crop.r},${crop.b}` : "Picture", description, ...(image.title ? { title: image.title } : {}) },
    ...(floating ? { floating } : {}),
  });
}

/** Rewrites the crop markers of `imageRun` into `a:srcRect` inside the same drawing and restores the picture name. */
export function applyImageCrops(xml) {
  if (!xml.includes(MARK)) return xml;
  return xml.replace(/<w:drawing>[\s\S]*?<\/w:drawing>/g, (drawing) => {
    const marker = drawing.match(new RegExp(`name="${MARK}:(\\d+),(\\d+),(\\d+),(\\d+)"`));
    if (!marker) return drawing;
    const [, l, t, r, b] = marker;
    const rect = `<a:srcRect${[["l", l], ["t", t], ["r", r], ["b", b]].filter(([, v]) => Number(v)).map(([k, v]) => ` ${k}="${v}"`).join("")}/>`;
    // docx already writes an empty `<a:srcRect/>` after the blip; CT_BlipFillProperties allows exactly one, so it is
    // replaced (a second srcRect makes Word refuse to open the file).
    return drawing.replace(marker[0], 'name="Picture"').replace(/(<pic:blipFill>\s*<a:blip\b[^>]*\/>|<pic:blipFill>\s*<a:blip\b[\s\S]*?<\/a:blip>)(\s*<a:srcRect\b[^>]*?(?:\/>|>[\s\S]*?<\/a:srcRect>))?/, `$1${rect}`);
  });
}
