/**
 * Paginate academic blocks into A4 pages using shared PAGE metrics.
 * Measurement is injected so PDF can use the real embedded font widths.
 */

import { PAGE } from "./academicLayout.js";
import { joinCaptionText } from "./academicDocument.js";

export const PT_MM = 25.4 / 72;

export const PDF_TYPE = {
  body: 12,
  h1: 14,
  h2: 12.5,
  h3: 12,
  title: 16,
  caption: 10,
  code: 10.5,
  footnote: 9,
  pageNumber: 10,
  abstract: 11,
};

const lineHeight = (pt, factor = 1.75) => pt * factor * PT_MM;

export function contentSize(margin = PAGE.marginMm) {
  return {
    width: PAGE.widthMm - 2 * margin,
    height: PAGE.heightMm - 2 * margin,
    margin,
  };
}

export function approximateWidth(text, fontSizePt, { bold = false, mono = false } = {}) {
  const em = fontSizePt * PT_MM;
  let width = 0;
  for (const ch of String(text ?? "")) {
    if (ch === " " || ch === "\t") width += em * (mono ? 0.6 : 0.28);
    else if ("ilI.,;:'`!|".includes(ch)) width += em * (mono ? 0.6 : 0.3);
    else if ("mwMW@%".includes(ch)) width += em * (mono ? 0.6 : 0.88);
    else width += em * (mono ? 0.6 : bold ? 0.56 : 0.5);
  }
  return width;
}

export function wrapText(text, widthMm, fontSizePt, measure, style) {
  const source = String(text ?? "").replace(/\r\n/g, "\n");
  const paragraphs = source.split("\n");
  const lines = [];
  const widthOf = (value) => measure(value, fontSizePt, style);
  for (const para of paragraphs) {
    if (!para) {
      lines.push("");
      continue;
    }
    const tokens = para.split(/(\s+)/);
    let current = "";
    for (const token of tokens) {
      const next = current + token;
      if (current.trim() && widthOf(next) > widthMm) {
        lines.push(current.replace(/\s+$/g, ""));
        current = token.replace(/^\s+/g, "");
        while (current && widthOf(current) > widthMm) {
          let cut = current.length - 1;
          while (cut > 1 && widthOf(current.slice(0, cut)) > widthMm) cut -= 1;
          lines.push(current.slice(0, cut));
          current = current.slice(cut);
        }
      } else {
        current = next;
      }
    }
    if (current) lines.push(current.replace(/\s+$/g, ""));
  }
  return lines.length ? lines : [""];
}

function flattenRuns(runs = []) {
  const bits = [];
  const footnotes = [];
  for (const run of runs) {
    if (run.type === "break") {
      bits.push({ text: "\n", bold: false, italic: false, underline: false });
      continue;
    }
    if (run.type === "footnote") {
      bits.push({ text: String(run.index || ""), bold: false, italic: false, superscript: true });
      footnotes.push({ index: run.index, text: run.text || "" });
      continue;
    }
    if (run.type === "xref") {
      bits.push({ text: run.text || "", italic: true, underline: false, bold: false });
      continue;
    }
    if (run.type === "math") {
      bits.push({ text: run.text || run.latex || "", italic: true, bold: false });
      continue;
    }
    if (run.type === "link") {
      const text = (run.children || []).map((child) => child.text || "").join("");
      bits.push({ text, underline: true, bold: false, italic: false });
      continue;
    }
    bits.push({
      text: run.text || "",
      bold: Boolean(run.bold),
      italic: Boolean(run.italic),
      underline: Boolean(run.underline),
      strike: Boolean(run.strike),
    });
  }
  return { bits, footnotes, text: bits.map((bit) => bit.text).join("") };
}

function boxFromLines(lines, lineH, extra = {}) {
  return {
    ...extra,
    lines,
    height: Math.max(lineH, lines.length * lineH) + (extra.after || 0) + (extra.before || 0),
    lineHeight: lineH,
  };
}

export function boxesFromBlocks(blocks, measure, options = {}) {
  const { width } = contentSize(options.margin);
  const boxes = [];
  let frontMatter = Boolean(options.frontMatter);

  for (const block of blocks) {
    if (block.type === "pageBreak") {
      boxes.push({ type: "pageBreak", height: 0, frontMatter });
      if (options.endFrontMatterOnBreak) frontMatter = false;
      continue;
    }
    if (block.type === "heading") {
      if (!block.unnumbered) frontMatter = false;
      const size = block.level === 1 ? PDF_TYPE.h1 : block.level === 2 ? PDF_TYPE.h2 : PDF_TYPE.h3;
      const label = `${block.number ? `${block.number} ` : ""}${block.text}`;
      const lines = wrapText(label, width, size, measure, { bold: true });
      boxes.push(
        boxFromLines(lines, lineHeight(size, 1.4), {
          type: "heading",
          level: block.level,
          id: block.id,
          number: block.number,
          text: block.text,
          size,
          bold: true,
          keepWithNext: true,
          before: 10 * PT_MM,
          after: 6 * PT_MM,
          frontMatter,
        }),
      );
      continue;
    }
    if (block.type === "toc") {
      const entries = options.tocEntries || [];
      const lines = entries.map((entry) => entry.title);
      const wrapped = lines.flatMap((line) => wrapText(line, width, PDF_TYPE.body, measure, {}));
      boxes.push(
        boxFromLines(wrapped.length ? wrapped : ["İçindekiler"], lineHeight(PDF_TYPE.body, 1.5), {
          type: "toc",
          entries,
          size: PDF_TYPE.body,
          frontMatter,
        }),
      );
      continue;
    }
    if (block.type === "figure") {
      const maxW = width;
      const maxH = 160;
      const rawW = (Number(block.width) || 320) * (25.4 / 96);
      const rawH = (Number(block.height) || 180) * (25.4 / 96);
      const scale = Math.min(1, maxW / rawW, maxH / (rawH || 1));
      const imgW = rawW * scale;
      const imgH = rawH * scale;
      const caption = joinCaptionText(block.label, block.caption);
      const capLines = caption ? wrapText(caption, width, PDF_TYPE.caption, measure, { italic: true }) : [];
      const capH = capLines.length * lineHeight(PDF_TYPE.caption, 1.5);
      boxes.push({
        type: "figure",
        src: block.src,
        width: imgW,
        imgHeight: imgH,
        height: imgH + capH + 8 * PT_MM,
        captionLines: capLines,
        align: block.align || "center",
        unbreakable: imgH + capH < contentSize(options.margin).height,
        frontMatter,
      });
      continue;
    }
    if (block.type === "table") {
      const rows = block.rows || [];
      const cols = Math.max(1, ...rows.map((row) => row.length));
      const colW = width / cols;
      const rowH = lineHeight(PDF_TYPE.body, 1.35) + 4 * PT_MM;
      const caption = joinCaptionText(block.label, block.caption);
      const capLines = caption ? wrapText(caption, width, PDF_TYPE.caption, measure, { italic: true }) : [];
      boxes.push({
        type: "table",
        rows,
        cols,
        colW,
        rowH,
        captionLines: capLines,
        height: capLines.length * lineHeight(PDF_TYPE.caption, 1.5) + rows.length * rowH + 6 * PT_MM,
        unbreakable: rows.length * rowH < contentSize(options.margin).height * 0.7,
        splitRows: true,
        frontMatter,
      });
      continue;
    }
    if (block.type === "code") {
      const lines = wrapText(block.text || " ", width, PDF_TYPE.code, measure, { mono: true });
      boxes.push(
        boxFromLines(lines, lineHeight(PDF_TYPE.code, 1.55), {
          type: "code",
          size: PDF_TYPE.code,
          mono: true,
          after: 6 * PT_MM,
          frontMatter,
        }),
      );
      continue;
    }
    if (block.type === "math") {
      const body = wrapText(block.text || block.latex || "", width - 18, PDF_TYPE.body, measure, { italic: true });
      boxes.push(
        boxFromLines(body, lineHeight(PDF_TYPE.body, 1.5), {
          type: "math",
          number: block.number,
          size: PDF_TYPE.body,
          italic: true,
          align: "center",
          after: 6 * PT_MM,
          unbreakable: true,
          frontMatter,
        }),
      );
      continue;
    }
    if (block.type === "list") {
      const indent = 8;
      const items = (block.items || []).map((item, index) => {
        const marker = block.ordered ? `${index + 1}. ` : "• ";
        const text = item.text || flattenRuns(item.runs).text;
        return wrapText(marker + text, width - indent, PDF_TYPE.body, measure, {}).map((line, lineIndex) =>
          lineIndex ? `   ${line}` : line,
        );
      });
      const lines = items.flat();
      boxes.push(
        boxFromLines(lines, lineHeight(PDF_TYPE.body), {
          type: "list",
          size: PDF_TYPE.body,
          after: 6 * PT_MM,
          frontMatter,
        }),
      );
      continue;
    }
    const { bits, footnotes, text } = flattenRuns(block.runs || [{ type: "text", text: block.text || "" }]);
    const size = block.type === "quote" ? PDF_TYPE.abstract : PDF_TYPE.body;
    const lines = wrapText(text, width, size, measure, { italic: block.type === "quote" });
    boxes.push(
      boxFromLines(lines, lineHeight(size), {
        type: "paragraph",
        bits,
        footnotes,
        size,
        align: block.align || "left",
        after: 8 * PT_MM,
        frontMatter,
      }),
    );
  }
  return boxes;
}

export function paginateBoxes(boxes, options = {}) {
  const { height: contentH } = contentSize(options.margin);
  const footnoteH = (list) => (list.length ? 3 + list.length * lineHeight(PDF_TYPE.footnote, 1.35) : 0);
  const pages = [];
  let page = { items: [], footnotes: [], height: 0, frontMatter: true };

  const flush = () => {
    pages.push(page);
    page = { items: [], footnotes: [], height: 0, frontMatter: page.frontMatter };
  };

  const used = () => page.height + footnoteH(page.footnotes);

  const pushBox = (box) => {
    page.items.push(box);
    page.height += box.height;
    if (box.footnotes?.length) page.footnotes.push(...box.footnotes);
    if (box.frontMatter === false) page.frontMatter = false;
  };

  for (let index = 0; index < boxes.length; index += 1) {
    const box = boxes[index];
    if (box.type === "pageBreak") {
      if (page.items.length) flush();
      if (box.frontMatter === false) page.frontMatter = false;
      continue;
    }

    const next = boxes[index + 1];
    if (box.keepWithNext && next && next.type !== "pageBreak") {
      const need = box.height + Math.min(next.height, (next.lineHeight || 6) * 2);
      if (page.items.length && used() + need + footnoteH(box.footnotes || []) > contentH) flush();
    }

    if (box.unbreakable || !box.lines || box.lines.length <= 1 || box.type === "figure") {
      if (page.items.length && used() + box.height + footnoteH(box.footnotes || []) > contentH) flush();
      pushBox(box);
      continue;
    }

    if (box.type === "table" && box.splitRows && box.rows?.length) {
      const capH = (box.captionLines?.length || 0) * lineHeight(PDF_TYPE.caption, 1.5);
      let start = 0;
      while (start < box.rows.length) {
        const avail = contentH - used() - 4;
        const room = Math.max(1, Math.floor((avail - (start === 0 ? capH : 0)) / box.rowH));
        if (room < 1 && page.items.length) {
          flush();
          continue;
        }
        const count = Math.min(box.rows.length - start, Math.max(1, room));
        const slice = {
          ...box,
          rows: box.rows.slice(start, start + count),
          captionLines: start === 0 ? box.captionLines : [],
          height: (start === 0 ? capH : 0) + count * box.rowH + 4 * PT_MM,
        };
        if (page.items.length && used() + slice.height > contentH) flush();
        pushBox(slice);
        start += count;
      }
      continue;
    }

    const lineH = box.lineHeight || lineHeight(box.size || PDF_TYPE.body);
    let remaining = [...box.lines];
    while (remaining.length) {
      const avail = contentH - used() - footnoteH(box.footnotes || []) - (box.after || 0);
      let count = Math.max(0, Math.floor(avail / lineH));
      if (count <= 0) {
        if (page.items.length) {
          flush();
          continue;
        }
        count = 1;
      }
      if (count < 2 && remaining.length >= 2 && page.items.length) {
        flush();
        continue;
      }
      if (remaining.length - count === 1 && count > 1) count -= 1;
      const sliceLines = remaining.slice(0, count);
      remaining = remaining.slice(count);
      const slice = {
        ...box,
        lines: sliceLines,
        footnotes: remaining.length ? [] : box.footnotes,
        before: page.items.length ? 0 : box.before,
        after: remaining.length ? 0 : box.after,
        height: sliceLines.length * lineH + (remaining.length ? 0 : box.after || 0),
      };
      pushBox(slice);
      if (remaining.length) flush();
    }
  }

  if (page.items.length || pages.length === 0) pages.push(page);
  return pages;
}

export function toRoman(value) {
  const n = Math.max(1, Math.floor(Number(value) || 1));
  const map = [
    [1000, "m"],
    [900, "cm"],
    [500, "d"],
    [400, "cd"],
    [100, "c"],
    [90, "xc"],
    [50, "l"],
    [40, "xl"],
    [10, "x"],
    [9, "ix"],
    [5, "v"],
    [4, "iv"],
    [1, "i"],
  ];
  let rest = n;
  let out = "";
  for (const [amount, glyph] of map) {
    while (rest >= amount) {
      out += glyph;
      rest -= amount;
    }
  }
  return out;
}

export function pageNumberLabel(page, index, numbering = {}) {
  const front = numbering.front === "roman";
  if (front && page.frontMatter) {
    const romanIndex = index + 1;
    return toRoman(romanIndex);
  }
  if (front) {
    const bodyIndex = index - numbering.frontCount;
    return String(Math.max(1, bodyIndex + 1));
  }
  return String(index + 1);
}

export function applyPageNumbering(pages, numbering = {}) {
  const frontCount = numbering.front === "roman" ? pages.filter((page) => page.frontMatter).length : 0;
  const spec = { ...numbering, frontCount };
  return pages.map((page, index) => ({
    ...page,
    numberLabel: pageNumberLabel(page, index, spec),
  }));
}
