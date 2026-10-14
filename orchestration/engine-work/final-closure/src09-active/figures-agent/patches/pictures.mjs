// Patch for engine/src/docx/projection.js (picture-only paragraphs). Applied at serve time to the Vite-served text.
export default [{
  file: 'src/thesis/docx/projection.js',
  apply(text) {
    // 1. Hidden subtrees (the cx1 / AlternateContent Choice branch of a native chart) draw nothing: they must not make the paragraph "not picture-only".
    const re1 = /(function pictureOnlyParagraph\(node\) \{\s*let picture = false, other = false;\s*const visit = \(child\) => \{)/;
    if (!re1.test(text)) throw new Error('pictures patch 1 miss');
    text = text.replace(re1, (m) => m + '\n\t\tif (child.attributes?.hidden !== undefined) return;');
    // 2. The paint-only Word baseline lift of text lines must not move a picture line; a centred picture line centres its block image.
    const marker = 'for (let at = 0; at < emptyParagraphs.length; at += 200)';
    if (!text.includes(marker)) throw new Error('pictures patch 2 miss');
    const block = `
	const pictureLines = (nodes) => {
		for (const node of nodes || []) {
			if (node.type === "table") continue;
			if (node.type === "paragraph") {
				if (node.id && /^[A-Za-z0-9_:-]+$/.test(node.id) && pictureOnlyParagraph(node)) {
					const style = document.formatMode === "source" ? node.properties?.resolvedSource : node.properties?.direct;
					const target = '.thesis-paper .thesis-body p[data-txt-node-id="' + node.id + '"][data-txt-node-id]';
					rules.push(target + "{top:0 !important}");
					if (style?.align === "center") rules.push(target + " img{margin-left:auto;margin-right:auto}");
				}
				continue;
			}
			pictureLines(node.children);
		}
	};
	for (const section of document.sections || []) pictureLines(section.nodes);
	`;
    return text.replace(marker, () => block + marker);
  }
}];
