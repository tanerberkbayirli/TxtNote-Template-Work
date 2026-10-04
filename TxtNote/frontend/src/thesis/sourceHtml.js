export const plainThesisText = (html) => String(html || "").replace(/<br\b[^>]*>/gi, " ").replace(/<[^>]*>/g, "").replace(/&nbsp;/gi, " ").replace(/&amp;/gi, "&").replace(/&lt;/gi, "<").replace(/&gt;/gi, ">").replace(/&quot;/gi, '"').replace(/&#(?:39|x27);/gi, "'").replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Math.min(0x10ffff, Number(n)))).replace(/\s+/g, " ").trim();

/** Strip only presentation stamps. No DOM round trip (images may be multi-MB). */
export function thesisSourceHtml(html) {
  return String(html || "")
    .replace(/<span\b[^>]*\sdata-thesis-mirror=["'][^"']*["'][^>]*>([^<]*)<\/span>/gi, "$1")
    .replace(/<\/?txt-table-cell-content\b[^>]*>/gi, "")
    .replace(/(<col\b[^>]*?)\sstyle=["'][^"']*["']/gi, "$1")
    .replace(/<span\b[^>]*\sdata-thesis-tab=["'][^"']*["'][^>]*>[\s\S]*?<\/span>/gi, "\t")
    .replace(/<span\b[^>]*class=["'][^"']*\bacademic-caption-label\b[^"']*["'][^>]*>[\s\S]*?<\/span>/gi, "")
    .replace(/<span\b[^>]*\sdata-thesis-lower=["'][^"']*["'][^>]*>([^<]*)<\/span>/gi, "$1")
    .replace(/<tr\b[^>]*\sdata-thesis-cont=["'][^"']*["'][^>]*>[\s\S]*?<\/tr>/gi, "")
    .replace(/<span\b[^>]*\sdata-thesis-fn-spacer(?:=["'][^"']*["'])?[^>]*><\/span>/gi, "")
    .replace(/<span\b[^>]*\sdata-thesis-eq-probe(?:=["'][^"']*["'])?[^>]*><\/span>/gi, "")
    .replace(/\sdata-thesis-(?:number|anchor|caption|caption-auto|caption-hang|eq|eq-side|eq-pad-before|eq-pad-after|eq-lift|eq-drop|eq-base|eq-fit|fn-stamp|fn-reserve|fn-margin|mirror-object|mirror-heading)=["'][^"']*["']/gi, "");
}

