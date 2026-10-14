import { Document, Packer, PageOrientation, SectionType, TabStopType, LeaderType, VerticalAlign } from "./docx/runtime.js";
import { groupThesisSections, resolveChromeText } from "./engine.js";
import { thesisGroupHasPageContent } from "./pageLayout.js";
import { indexRowStyle, indexTargetMap } from "./generatedIndex.js";
import { ENGINE_DEFAULT_HEADER_DISTANCE_MM } from "./engineDefaults.js";
import { halfPointSize, twip } from "./docx/xml.js";
import { headingStyle, listLevels, paragraphProps, runProps, thesisHeadingStyleId } from "./docx/paragraphs.js";
import { auditDocxFields, indexFieldInstruction } from "./docx/fields.js";
import { chromeDocx, pageFormat } from "./docx/sections.js";
import { docxChildren } from "./docx/body.js";
import { finalizeThesisDocx } from "./docx/package.js";
export { buildThesisPdf } from "./pdfFallback.js";
export { bookmarkName } from "./docx/paragraphs.js";

/**
 * Word document from the compiled model. One Word section per thesis section: a
 * new page group starts with a next-page or odd-page section break, sections sharing a page
 * flow use continuous breaks. Number format and restarts are Word section
 * properties (pgNumType), so cover → roman → arabic restarts are real Word numbering.
 */
export async function buildThesisDocx(model, { captionAlignments = {}, captionHangs = {}, indexHangs = {}, elasticSpacers = {}, elasticContentMm = {}, specialPagePositions = {}, tableContinuations = {}, blockPageBreaks = [], totalPages } = {}) {
  const main = model.sections.find((section) => section.type === "mainContent") || model.sections[0];
  const base = main?.rules;
  const nativeToc = model.sections.find((section) => section.generatedIndex?.kind === "toc");
  const tocRowsByAnchor = new Map();
  const tocStyleLevels = [];
  const tocNoPageLevels = new Set();
  if (nativeToc) {
    const rule = nativeToc.generatedIndex;
    const sourceProfiles = (nativeToc.indexRows || []).filter((row) => row.kind === "toc" && !row.tocTitle).map((row) => ({
      row,
      includePageNumber: Boolean(rule.includePageNumbers) && indexRowStyle(rule, row)?.includePageNumber !== false,
    }));
    const noPageProfiles = [...new Map(sourceProfiles.filter((profile) => !profile.includePageNumber).map((profile) => [Number(profile.row.level || 1), profile])).values()];
    if (noPageProfiles.length > 3) throw new Error("This thesis TOC has more than three distinct no-page heading levels; Word's remaining TOC levels cannot represent them faithfully.");
    const outputLevelByProfile = new Map();
    for (const profile of sourceProfiles.filter((profile) => profile.includePageNumber)) {
      const sourceLevel = Number(profile.row.level || 1);
      outputLevelByProfile.set(`${sourceLevel}:page`, sourceLevel);
    }
    noPageProfiles.forEach((profile, index) => outputLevelByProfile.set(`${Number(profile.row.level || 1)}:noPage`, 9 - index));
    for (const row of nativeToc.indexRows || []) {
      if (!row.anchor) continue;
      const includePageNumber = Boolean(rule.includePageNumbers) && indexRowStyle(rule, row)?.includePageNumber !== false;
      const wordTocLevel = row.tocTitle ? (includePageNumber ? Number(row.level || 1) : 9) : outputLevelByProfile.get(`${Number(row.level || 1)}:${includePageNumber ? "page" : "noPage"}`) || Number(row.level || 1);
      tocRowsByAnchor.set(row.anchor, { ...row, includePageNumber, wordTocLevel });
      if (!row.tocTitle && row.kind === "toc") {
        const id = thesisHeadingStyleId(row.level || 1, true, !includePageNumber);
        if (!tocStyleLevels.some((entry) => entry.id === id && entry.level === wordTocLevel)) tocStyleLevels.push({ id, level: wordTocLevel });
      }
      if (!includePageNumber) tocNoPageLevels.add(wordTocLevel);
    }
    // Word users who add a normal built-in heading after export still get a live entry,
    // with the only page-number behavior established for that source heading level.
    const sourceLevels = [...new Set(sourceProfiles.map(({ row }) => Number(row.level || 1)))];
    for (const level of sourceLevels) {
      const profiles = new Set(sourceProfiles.filter(({ row }) => Number(row.level || 1) === level).map(({ includePageNumber }) => includePageNumber));
      if (profiles.size === 1) {
        const includePageNumber = profiles.has(true);
        const outputLevel = outputLevelByProfile.get(`${level}:${includePageNumber ? "page" : "noPage"}`) || level;
        tocStyleLevels.push({ id: `Heading ${level}`, level: outputLevel });
        if (!includePageNumber) tocNoPageLevels.add(outputLevel);
      }
    }
  }
  const hasWordHeaders = model.sections.some((section) => {
    const { page } = section.rules;
    const header = page.header || {};
    const hasText = [header.content, header.firstContent, header.evenContent]
      .some((content) => typeof content === "string" && resolveChromeText(content, model.values || {}).trim());
    const topNumber = page.numbering.enabled && page.numbering.position === "top";
    return hasText || Boolean(header.paragraphs?.length) || Number(header.trailingBlankLines) > 0 || topNumber;
  });
  const context = {
    nativeDocument: model.nativeDocument, nativeDrawings: [],
    language: model.language || "tr", body: base?.body || {}, footnotes: {}, nextFootnote: 1, endnotes: {}, nextEndnote: 1, nextList: 1,
    evenAndOddHeaders: model.sections.some((section) => section.rules.page.header?.evenContent !== undefined || section.rules.page.footer?.evenContent !== undefined),
    omitEmptyHeaderParts: !hasWordHeaders,
    totalPages: totalPages ?? model.values?.TOTAL_PAGES,
    captionAlignments, captionHangs, indexHangs, elasticSpacers, elasticContentMm, specialPagePositions, tableContinuations, blockPageBreaks: new Set(blockPageBreaks),
    tocRowsByAnchor, targets: indexTargetMap(model.indexSources),
    nativeTocField: nativeToc ? { instruction: indexFieldInstruction(nativeToc.generatedIndex, tocStyleLevels, [...tocNoPageLevels], (model.language || "tr") === "tr" ? ";" : ",", nativeToc.indexRows.some(row => row.labelLine)) } : null,
    nativeTocLevels: new Set((nativeToc?.indexRows || []).filter((row) => row.kind === "toc" && !row.tocTitle).map((row) => Number(row.level || 1))),
    thesisHeadingStyles: new Map(),
    tocParagraphStyles: new Map(),
  };
  const pageStarts = new Set(groupThesisSections(model.sections).filter(thesisGroupHasPageContent).map((group) => group.id));
  const noteRestarts = [];
  // Word has one separator for the whole document: the first section that places notes at the page bottom defines it.
  let noteSeparator = null;
  const sections = model.sections.flatMap((section, index) => {
    const page = section.rules.page;
    // A measured, impossible fixed-height frame must remain editable and visible
    // on continuation pages. Its authored content rectangle becomes the normal
    // Word section area; fitting frames retain the source margins and text box.
    context.naturalSpecialPageFlow = Number.isFinite(page.docxContentFrame?.heightMm)
      && specialPagePositions[`${section.id}:~flow`]?.overflow === true;
    const frame = page.docxContentFrame;
    const wordMargins = context.naturalSpecialPageFlow ? {
      topMm: frame.yMm, leftMm: frame.xMm,
      rightMm: page.widthMm - frame.xMm - frame.widthMm,
      bottomMm: page.heightMm - frame.yMm - frame.heightMm,
    } : page.docxMargins || page.margins;
    const groupStart = pageStarts.has(section.id);
    // Word starts this section on a new page (first section or a page group start): its first block sits at a page top.
    context.sectionStartsPage = index === 0 || groupStart;
    context.body = section.rules.body;
    context.lineSpacing = section.rules.lineSpacing || null;
    context.footnoteStyle = section.rules.footnotes?.style || null;
    context.bodyBox = { widthPt: (page.widthMm - wordMargins.leftMm - wordMargins.rightMm) / 25.4 * 72, heightPt: (page.heightMm - wordMargins.topMm - wordMargins.bottomMm) / 25.4 * 72 };
    if (!noteSeparator && section.rules.footnotes?.placement === "pageBottom" && section.rules.footnotes.separator) noteSeparator = { separator: section.rules.footnotes.separator, widthPt: context.bodyBox.widthPt };
    const content = docxChildren(section, context);
    const properties = (type, titlePage, continued = false) => ({
      type,
      titlePage,
      ...(section.verticalAlign ? { verticalAlign: { top: VerticalAlign.TOP, center: VerticalAlign.CENTER, bottom: VerticalAlign.BOTTOM }[section.verticalAlign] } : {}),
      page: {
        // docx swaps width/height itself for LANDSCAPE: pass them swapped so w:pgSz carries the physical width/height the editor and PDF use.
        size: page.orientation === "landscape"
          ? { width: twip(page.heightMm), height: twip(page.widthMm), orientation: PageOrientation.LANDSCAPE }
          : { width: twip(page.widthMm), height: twip(page.heightMm), orientation: PageOrientation.PORTRAIT },
        margin: { top: twip(wordMargins.topMm), bottom: twip(wordMargins.bottomMm), left: twip(wordMargins.leftMm), right: twip(wordMargins.rightMm), header: twip(page.header?.distanceMm ?? ENGINE_DEFAULT_HEADER_DISTANCE_MM), footer: twip(page.footer?.docxDistanceMm ?? page.footer?.distanceMm ?? ENGINE_DEFAULT_HEADER_DISTANCE_MM) },
        pageNumbers: { start: continued ? undefined : page.numbering.restart ? (page.numbering.startAt ?? 1) : undefined, formatType: pageFormat(page.numbering.format) },
      },
    });
    const firstChrome = chromeDocx(section, model.values, context, groupStart, groupStart && Boolean(content.startsWithChapter));
    // numbering.omitOnChapterStart: every later chapter opening is a Word section of its own (numbering continues, first page prints no number).
    const splits = content.chapterSplits || [];
    const bounds = [0, ...splits, content.length];
    const result = [{
      children: content.slice(0, bounds[1]),
      ...(firstChrome.headers ? { headers: firstChrome.headers } : {}), footers: firstChrome.footers,
      properties: properties(index === 0 ? undefined : groupStart ? section.pageBreakBefore === "oddPage" ? SectionType.ODD_PAGE : section.pageBreakBefore === "evenPage" ? SectionType.EVEN_PAGE : SectionType.NEXT_PAGE : SectionType.CONTINUOUS, firstChrome.titlePage),
    }];
    for (let part = 1; part < bounds.length - 1; part += 1) {
      const chrome = chromeDocx(section, model.values, context, false, true);
      result.push({ children: content.slice(bounds[part], bounds[part + 1]), ...(chrome.headers ? { headers: chrome.headers } : {}), footers: chrome.footers, properties: properties(SectionType.NEXT_PAGE, chrome.titlePage, true) });
    }
    noteRestarts.push(...result.map(() => section.rules.footnotes?.numbering === "section" ? "section" : "document"));
    return result;
  });
  if (nativeToc) {
    const rule = nativeToc.generatedIndex;
    for (const row of nativeToc.indexRows || []) {
      const fieldRow = tocRowsByAnchor.get(row.anchor);
      if (!fieldRow) continue;
      const outputLevel = fieldRow.wordTocLevel;
      const levelStyle = indexRowStyle(rule, row) || {};
      const style = { ...rule.style, ...levelStyle, leftIndentMm: Number.isFinite(levelStyle.leftIndentMm) ? levelStyle.leftIndentMm : (row.level - 1 || 0) * rule.indentMm };
      const id = `TOC${outputLevel}`;
      if (!context.tocParagraphStyles.has(id)) {
        const widthMm = nativeToc.rules.page.widthMm - nativeToc.rules.page.margins.leftMm - nativeToc.rules.page.margins.rightMm;
        const tabPosition = rule.pageColumnWidthMm > 0 && rule.pageNumberAlignment === "center" ? widthMm - rule.pageColumnWidthMm / 2 : widthMm;
        const tabStops = fieldRow.includePageNumber ? [{ type: TabStopType[rule.pageNumberAlignment.toUpperCase()] || TabStopType.RIGHT, position: twip(tabPosition), leader: rule.leader === "dots" ? LeaderType.DOT : LeaderType.NONE }] : [];
        context.tocParagraphStyles.set(id, { id, name: `TOC ${outputLevel}`, basedOn: "Normal", quickFormat: false, run: runProps(style, context.language), paragraph: paragraphProps(style, { tabStops }, nativeToc.rules.lineSpacing) });
      }
    }
  }
  const styles = base ? {
    default: {
      document: { run: { font: base.body.fontFamily, size: halfPointSize(base.body.fontSizePt) } },
      ...Object.fromEntries(Object.keys(base.headings).filter((level) => Number(level) <= 6).map((level) => [`heading${level}`, headingStyle(base.headings[level], context.language, level)])),
    },
    ...((context.namedParagraphStyles?.size || context.footnoteParagraphStyles?.size || context.thesisHeadingStyles.size || context.tocParagraphStyles.size) ? { paragraphStyles: [...(context.namedParagraphStyles?.values() || []), ...(context.footnoteParagraphStyles?.values() || []), ...context.thesisHeadingStyles.values(), ...context.tocParagraphStyles.values()] } : {}),
  } : undefined;
  const blob = await finalizeThesisDocx(await Packer.toBlob(new Document({
    // Preserve cached results on opening; explicit Word field updates remain available.
    title: model.title || "Tez", creator: "TxtNote", features: { updateFields: false }, evenAndOddHeaderAndFooters: context.evenAndOddHeaders, styles,
    numbering: { config: [{ reference: "thesis-ordered", levels: listLevels(true) }, { reference: "thesis-bullet", levels: listLevels(false) }] },
    footnotes: context.footnotes, ...(Object.keys(context.endnotes).length ? { endnotes: context.endnotes } : {}), sections,
  })), { noteRestarts, noteSeparator, nativeDocument: context.nativeDocument, nativeDrawings: context.nativeDrawings });
  // What could not be written as a live Word field/bookmark is reported, never dropped silently; the audit proves
  // every written REF / PAGEREF / HYPERLINK \l target is a bookmark of the package (Word's field update finds it).
  blob.exportIssues = { fieldIssues: context.fieldIssues || [], fieldAudit: auditDocxFields(blob.wordXmlParts || []) };
  return blob;
}
