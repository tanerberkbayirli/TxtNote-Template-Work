// Patch for engine/src/docx/projection.js (importedContentCss): applied at serve time by overlay.mjs.
export default [{
  file: 'src/thesis/docx/projection.js',
  find: `for (let at = 0; at < emptyParagraphs.length; at += 200)`,
  replace: `  // Word does not push the empty paragraph that only carries a page-breaking section break onto an extra sheet: measured (SRC09 s.89,
  // body ends 3 pt above the carrier's bottom) it stays on the section's last page, while the same paragraph holding a character moves.
  // The carrier is the last paragraph of the section and nothing follows it on the sheet, so it takes no height.
  (document.sections || []).forEach((section, index, all) => {
    const next = all[index + 1]?.properties?.breakType;
    if (!next || next === "continuous") return;
    const { last } = edgeParagraphs(section.nodes);
    if (!last || !last.id || !/^[A-Za-z0-9_:-]+$/.test(last.id) || paragraphHasContent(last) || vanishesInWord(last)) return;
    const target = '.thesis-paper .thesis-body p[data-txt-node-id="' + last.id + '"][data-txt-node-id]';
    rules.push(target + '{height:0 !important;min-height:0 !important;margin:0 !important;padding:0 !important;line-height:0 !important;overflow:hidden}', target + '::before,' + target + '::after{display:none !important}');
  });
for (let at = 0; at < emptyParagraphs.length; at += 200)`
}];
