import { useLayoutEffect, useState } from "react";

/** Merge authored box bookmarks with headings in their rendered reading order.
 * Only membership is persisted; labels and positions follow the live document.
 */
export function useWritingPlan(rootRef, model, zoom, sectionGroups) {
  const [entries, setEntries] = useState([]);
  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root || !model) return;
    let frame = 0;
    const read = () => {
      frame = 0;
      const origin = root.getBoundingClientRect();
      const position = node => {
        const box = node?.getBoundingClientRect();
        return { top: box ? Math.round((box.top - origin.top) * 10) / 10 : Number.MAX_SAFE_INTEGER,
          left: box ? Math.round((box.left - origin.left) * 10) / 10 : 0 };
      };
      const automatic = (model.indexSources || []).filter(item => item.kind === "toc" && !item.unnumbered).map(item => {
        const node = root.querySelector(`[data-thesis-anchor="${CSS.escape(item.anchor)}"]`);
        return { sectionId: item.sectionId, id: item.anchor, text: [item.label, item.title].filter(Boolean).join(" "), level: item.level, node, ...position(node) };
      });
      const layout = model.documentLayout || {};
      const stored = new Map((layout.additions || []).map(item => [item.id, item]));
      for (const [id, override] of Object.entries(layout.elements || {})) stored.set(id, { ...stored.get(id), ...override });
      const manual = [...stored].flatMap(([id, item]) => {
        if (!item.inWritingPlan || item.deleted) return [];
        const node = root.querySelector(`[data-layout-id="${CSS.escape(id)}"][data-layout-type="text"]`);
        if (!node || automatic.some(heading => heading.node === node || node.contains(heading.node))) return [];
        const text = (node.querySelector("[data-layout-content]") || node).textContent.replace(/\s+/g, " ").trim();
        return [{ id: `writing-plan:${id}`, layoutId: id, sectionId: node.getAttribute("data-layout-section"),
          text: text || "Boş metin kutusu", level: item.headingLevel || 1, ...position(node) }];
      });
      const groups = sectionGroups?.length ? sectionGroups : model.sections.map(section => ({ sections: [section] }));
      const sectionPositions = groups.map(group => {
        const first = group.sections[0], representative = group.sections.find(section => section.editable) || first;
        const sectionNode = root.querySelector(`[data-thesis-flow-section="${CSS.escape(first.id)}"]`);
        // A positioned box can precede a section's title on the same paper.
        // Compare it to the title, rather than assigning it to the section's tree.
        const title = sectionNode?.querySelector('h1, .thesis-layout-text:not([data-thesis-block^="layout-addition-"])') || sectionNode;
        return { kind: "section", sectionId: representative.id, id: `writing-plan-section:${representative.id}`, text: first.title, ...position(title) };
      });
      const next = [...sectionPositions, ...automatic, ...manual].sort((a, b) => a.top - b.top || a.left - b.left)
        .map(({ node, ...entry }) => entry);
      setEntries(previous => JSON.stringify(previous) === JSON.stringify(next) ? previous : next);
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(read); };
    read();
    const resize = new ResizeObserver(schedule); resize.observe(root);
    const mutation = new MutationObserver(schedule);
    mutation.observe(root, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ["style", "class", "data-thesis-anchor"] });
    window.addEventListener("resize", schedule);
    return () => { if (frame) cancelAnimationFrame(frame); resize.disconnect(); mutation.disconnect(); window.removeEventListener("resize", schedule); };
  }, [rootRef, model, zoom, sectionGroups]);
  return entries;
}
