import sys
p=sys.argv[1]
s=open(p,encoding='utf8',newline='').read()
nl='\r\n' if '\r\n' in s else '\n'
marker="  for (let at = 0; at < emptyParagraphs.length; at += 200) rules.push("
assert s.count(marker)==1
block=r'''  // Word does not push the empty paragraph that only carries a page-breaking section break onto an extra sheet: measured (SRC09 s.89,
  // the body ends 3 pt above the carrier's bottom edge) it stays on the section's last page, while the same paragraph holding one
  // character moves to the next one. The carrier is the last paragraph of its section and nothing follows it on the sheet.
  (document.sections || []).forEach((section, index, all) => {
    const next = all[index + 1]?.properties?.breakType;
    if (!next || next === "continuous") return;
    const { last } = edgeParagraphs(section.nodes);
    if (!last || !last.id || !/^[\w:-]+$/.test(last.id) || paragraphHasContent(last) || vanishesInWord(last)) return;
    const target = `.thesis-paper .thesis-body p[data-txt-node-id="${last.id}"][data-txt-node-id]`;
    rules.push(`${target}{height:0 !important;min-height:0 !important;margin:0 !important;padding:0 !important;line-height:0 !important;overflow:hidden}`, `${target}::before,${target}::after{display:none !important}`);
  });
  // A picture line is drawn at its line top: the paint-only Word baseline lift of text lines (engineCss wordBaselineCss) must not move
  // the picture (measured, SRC09 s.91: Word 70.8 pt, editor 67.9 pt). A centred picture line centres its block image (also under bidi).
  const pictureLines = (nodes) => {
    for (const node of nodes || []) {
      if (node.type === "table") continue;
      if (node.type === "paragraph") {
        if (node.id && /^[\w:-]+$/.test(node.id) && pictureOnlyParagraph(node)) {
          const style = document.formatMode === "source" ? node.properties?.resolvedSource : node.properties?.direct;
          const target = `.thesis-paper .thesis-body p[data-txt-node-id="${node.id}"][data-txt-node-id]`;
          rules.push(`${target}{top:0 !important}`);
          if (style?.align === "center") rules.push(`${target} img{margin-left:auto;margin-right:auto}`);
        }
        continue;
      }
      pictureLines(node.children);
    }
  };
  for (const section of document.sections || []) pictureLines(section.nodes);
'''.replace('\n',nl)
s=s.replace(marker,block+marker)
old="  const visit = (child) => {"+nl+'    if (child.type === "image" && child.tag === "img" && !child.attributes?.["data-img-wrap"]) { picture = true; return; }'
assert s.count(old)==1
s=s.replace(old,"  const visit = (child) => {"+nl+"    if (child.attributes?.hidden !== undefined) return; // hidden branches (a native chart's mc:Choice) draw nothing"+nl+'    if (child.type === "image" && child.tag === "img" && !child.attributes?.["data-img-wrap"]) { picture = true; return; }')
open(p,'w',encoding='utf8',newline='').write(s)
