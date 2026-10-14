export const plainThesisText = (html) => String(html || "").replace(/<br\b[^>]*>/gi, " ").replace(/<[^>]*>/g, "").replace(/&nbsp;/gi, " ").replace(/&amp;/gi, "&").replace(/&lt;/gi, "<").replace(/&gt;/gi, ">").replace(/&quot;/gi, '"').replace(/&#(?:39|x27);/gi, "'").replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Math.min(0x10ffff, Number(n)))).replace(/\s+/g, " ").trim();

/** Model identity annotations acknowledge an editor edit without replacing its
 * live DOM/caret or resetting undo. All authored text/format attributes still count. */
export function sameThesisEditorProjection(left, right) {
  const withoutIds = (html) => thesisSourceHtml(html).replace(/\sdata-txt-node-id=["'][^"']*["']/gi, "").replace(/(\sclass=["'])txn-[\w:-]+\s?/gi, "$1").replace(/\sclass=["']["']/gi, "");
  const a = withoutIds(left), b = withoutIds(right);
  if (a === b) return true;
  if (typeof document === "undefined") return false;
  const first = document.createElement("template"), second = document.createElement("template");
  first.innerHTML = a; second.innerHTML = b;
  return first.content.isEqualNode(second.content);
}

import { stripMathPresentation } from "./contentMarkup.js";

/** Strip only presentation stamps. No DOM round trip (images may be multi-MB). */
export function thesisSourceHtml(html) {
  return stripMathPresentation(html)
    .replace(/\sstyle=(["'])([^"']*--thesis-source-row-tail\s*:[^"']*)\1/gi, (_, quote, style) => {
      const kept = style.replace(/(?:^|;)\s*--thesis-source-row-tail\s*:[^;]*(?:;|$)/gi, ";").replace(/^\s*;|;\s*$/g, "").trim();
      return kept ? ` style=${quote}${kept}${quote}` : "";
    })
    .replace(/(\sclass=)(["'])([^"']*)\2/gi, (all, head, quote, value) => {
      if (!value.includes("txn-")) return all;
      const kept = value.split(/\s+/).filter((token) => token && !token.startsWith("txn-")).join(" ");
      return kept ? `${head}${quote}${kept}${quote}` : "";
    })
    .replace(/<wbr\b[^>]*\sdata-thesis-word-fit-break(?:=["'][^"']*["'])?[^>]*>/gi, "")
    .replace(/<span\b[^>]*\sdata-thesis-word-fit=["'][^"']*["'][^>]*>([^<]*)<\/span>/gi, "$1")
    .replace(/<div\b[^>]*\sdata-academic-page-gap(?:=["'][^"']*["'])?[^>]*>\s*<\/div>/gi, "")
    .replace(/<span\b[^>]*\sdata-thesis-mirror=["'][^"']*["'][^>]*>([^<]*)<\/span>/gi, "$1")
    .replace(/<\/?txt-table-cell-content\b[^>]*>/gi, "")
    .replace(/(<col\b[^>]*?)\sstyle=["'][^"']*["']/gi, "$1")
    .replace(/<span\b[^>]*\sdata-thesis-tab=["'][^"']*["'][^>]*>[\s\S]*?<\/span>/gi, "\t")
    .replace(/<span\b[^>]*class=["'][^"']*\bacademic-caption-label\b[^"']*["'][^>]*>[\s\S]*?<\/span>/gi, "")
    .replace(/<span\b[^>]*\sdata-thesis-lower=["'][^"']*["'][^>]*>([^<]*)<\/span>/gi, "$1")
    .replace(/<tr\b[^>]*\sdata-thesis-cont=["'][^"']*["'][^>]*>[\s\S]*?<\/tr>/gi, "")
    .replace(/<tr\b[^>]*\sdata-thesis-head-break(?:=["'][^"']*["'])?[^>]*>[\s\S]*?<\/tr>/gi, "")
    .replace(/<span\b[^>]*\sdata-thesis-fn-spacer(?:=["'][^"']*["'])?[^>]*><\/span>/gi, "")
    .replace(/<span\b[^>]*\sdata-thesis-mirror-narrow(?:=["'][^"']*["'])?[^>]*><\/span>/gi, "")
    .replace(/<span\b[^>]*\sdata-thesis-eq-probe(?:=["'][^"']*["'])?[^>]*><\/span>/gi, "")
    .replace(/\sdata-thesis-(?:row-min-break|number|anchor|caption|caption-auto|caption-hang|eq|eq-side|(?:i?eq)-(?:pad-before|pad-after|lift|drop|base|fit|shift)|fn-stamp|fn-reserve|fn-margin|fn-push|keep-lines|mirror-object|mirror-heading|cont-at|frag-first|frag-last|tall)(?![\w-])(?:=["'][^"']*["'])?/gi, "");
}

