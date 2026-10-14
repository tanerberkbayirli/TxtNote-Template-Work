import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { alignLayoutElements, distributeLayoutElements, snapLayoutRect } from "../../../../../engine/src/layoutGeometry.js";
import { updateLayoutElements, deleteLayoutElement, duplicateLayoutElement } from "../../../../../engine/src/layoutDocument.js";
import { clampResizeRect, DRAG_THRESHOLD_PX, patchesForRects } from "../../../../../engine/src/layoutInteraction.js";
import { PX_PER_MM } from "../../../../../engine/src/pageLayout.js";
import { selectionClipPath } from "./LayoutSelectionOverlay.jsx";

const editable = (node) => node?.getAttribute("data-layout-id") && node.getAttribute("data-layout-type") !== "group" && node.getAttribute("data-layout-type") !== "spacer";

function sectionFor(model, id) { return model?.sections?.find((section) => section.id === id); }

function canonicalFor(section, id) {
  const visit = (nodes) => {
    for (const node of nodes || []) {
      if (node.id === id) return node;
      const found = visit(node.blocks);
      if (found) return found;
    }
    return null;
  };
  return visit(section?.layout) || visit(section?.layoutBlocks) || null;
}

/** Transforms on a page element live inside the zoomed page stack, so they use unzoomed px per mm. */
const localPxPerMm = (item) => item.scale / (item.zoom || 1);

function readRect(node, root, model, zoom, sheetCache) {
  const paper = node.closest(".thesis-paper[data-thesis-section]");
  if (!paper) return null;
  const sectionId = node.getAttribute("data-layout-section") || paper.getAttribute("data-thesis-section");
  const section = sectionFor(model, sectionId);
  const canonical = canonicalFor(section, node.getAttribute("data-layout-id"));
  const page = section?.rules?.page;
  if (!page?.widthMm || !page?.heightMm) return null;
  const stack = paper.closest(".thesis-page-stack");
  const paperBox = paper.getBoundingClientRect();
  const box = node.getBoundingClientRect();
  const scale = paperBox.width / page.widthMm || PX_PER_MM * zoom;
  const xMm = (box.left - paperBox.left) / scale;
  const yMm = (box.top - paperBox.top) / scale;
  const widthMm = box.width / scale;
  const heightMm = box.height / scale;
  const flow = node.closest(".thesis-flow-section");
  const sectionMode = flow?.getAttribute("data-thesis-section-mode");
  const explicitLock = canonical?.locked ?? node.getAttribute("data-layout-locked") === "true";
  // Sheet rects are cached per measurement pass (stack -> [{ top, bottom }]) so each sheet is read once.
  let sheetBoxes = stack && sheetCache?.get(stack);
  if (!sheetBoxes) {
    sheetBoxes = [...(stack?.querySelectorAll(".thesis-sheet") || [])].map((sheet) => { const sheetBox = sheet.getBoundingClientRect(); return { top: sheetBox.top, bottom: sheetBox.bottom }; });
    if (stack) sheetCache?.set(stack, sheetBoxes);
  }
  const sheetIndex = sheetBoxes.findIndex((sheetBox) => box.top >= sheetBox.top && box.top < sheetBox.bottom);
  const pageIndex = sheetIndex >= 0 ? sheetIndex : 0;
  const pageTopMm = sheetIndex >= 0 ? (sheetBoxes[sheetIndex].top - paperBox.top) / scale : 0;
  return {
    ...canonical, id: node.getAttribute("data-layout-id"), sectionId, type: node.getAttribute("data-layout-type"),
    xMm, yMm, widthMm: Math.max(1, widthMm), heightMm: Math.max(1, heightMm), page, pageIndex, pageTopMm,
    locked: explicitLock, editableLayout: (canonical?.editableLayout ?? true) && !explicitLock && sectionMode !== "fixed" && !node.closest('[data-layout-locked="true"]'),
    editableContent: (canonical?.editableContent ?? node.getAttribute("data-layout-type") === "text") && !explicitLock && !node.closest('[data-layout-locked="true"]'),
    canonical: canonical || { id: node.getAttribute("data-layout-id"), type: node.getAttribute("data-layout-type"), sectionId },
    measuredGeometry: { xMm, yMm, widthMm: Math.max(1, widthMm), heightMm: Math.max(1, heightMm), pageIndex },
    element: node, paper, stack, scale, zoom, measured: true,
  };
}

// `ids` (optional) limits measurement to those layout ids instead of every element in the document.
function measureAll(root, model, zoom, ids) {
  if (!root) return [];
  const sheetCache = new Map();
  const selector = "[data-layout-id][data-layout-section][data-layout-type]";
  const nodes = ids
    ? [...new Set(ids)].flatMap((id) => [...root.querySelectorAll(`[data-layout-id="${CSS.escape(String(id))}"]`)].filter((node) => node.matches(selector)))
    : [...root.querySelectorAll(selector)];
  return nodes.filter(editable).map((node) => readRect(node, root, model, zoom, sheetCache)).filter(Boolean);
}

function publish(thesis, callback, next, reason = "action") {
  if (typeof callback === "function") callback(next, reason);
}

function withLayoutSnapshot(thesis, layout) { return { ...(thesis || {}), layout }; }

/** Delegated, document-scoped selection, move, resize, text edit, history, and keyboard behavior. */
export function useLayoutInteraction({ rootRef, model, thesis, onThesisChange, zoom = 1 }) {
  const [selectedIds, setSelectedIds] = useState([]);
  const [geometry, setGeometry] = useState([]);
  const [editingId, setEditingId] = useState("");
  const [contextMenu, setContextMenu] = useState(null);
  const [, setHistoryVersion] = useState(0);
  const selectionRef = useRef([]);
  const editRef = useRef(null);
  const gestureRef = useRef(null);
  const overlayRef = useRef(null);
  const clipboardRef = useRef([]);
  const historyRef = useRef({ past: [], future: [], current: thesis });
  const latestRef = useRef({ model, thesis, onThesisChange, zoom });
  latestRef.current = { model, thesis, onThesisChange, zoom };

  const selectIds = useCallback((ids) => {
    const next = [...new Set(ids.filter(Boolean))];
    selectionRef.current = next;
    setSelectedIds(next);
    const { model: currentModel, zoom: currentZoom } = latestRef.current;
    setGeometry(measureAll(rootRef.current, currentModel, currentZoom, next));
  }, [rootRef]);

  const commitThesis = useCallback((next, reason = "action") => {
    const current = latestRef.current.thesis || {};
    if (next === current) return;
    // Ribbon buttons preserve focus, so blur may never flush the edited frame.
    // Publish its visible text in the same transaction as the layout/format pick.
    const edit = editRef.current;
    if (edit) {
      const content = edit.node.innerText.replace(/\r\n?/g, "\n");
      if (content !== edit.original) {
        next = updateLayoutElements(next, [{ id: edit.id, text: content, content }]);
        edit.original = content;
      }
    }
    historyRef.current.past.push(current.layout);
    if (historyRef.current.past.length > 100) historyRef.current.past.shift();
    historyRef.current.future = [];
    historyRef.current.current = next;
    setHistoryVersion((version) => version + 1);
    publish(current, latestRef.current.onThesisChange, next, reason);
  }, []);

  const patchElements = useCallback((patches, reason = "action") => {
    if (!patches?.length) return;
    const current = latestRef.current.thesis || {};
    const bounds = measureAll(rootRef.current, latestRef.current.model, latestRef.current.zoom, patches.map((patch) => patch.id));
    const materialized = patches.flatMap((patch) => {
      const measured = bounds.find((item) => item.id === patch.id);
      if (measured?.locked) return typeof patch.locked === "boolean" ? [{ id: patch.id, locked: patch.locked }] : [];
      if (measured && !measured.editableLayout && Object.keys(patch).some((key) => !["id", "locked", "content", "text"].includes(key))) return [];
      if (measured && !measured.editableContent && ("content" in patch || "text" in patch)) return [];
      if (!["absolute", "anchored"].includes(patch.layoutMode) || !measured || measured.canonical?.layoutMode !== "flow") return patch;
      return { xMm: measured.xMm, yMm: measured.yMm, widthMm: measured.widthMm, heightMm: measured.heightMm, flowHeightMm: measured.heightMm, ...patch };
    });
    if (!materialized.length) return;
    const next = updateLayoutElements(current, materialized);
    commitThesis(next, reason);
    requestAnimationFrame(() => {
      const selected = selectionRef.current;
      setGeometry(measureAll(rootRef.current, latestRef.current.model, latestRef.current.zoom, selected));
    });
  }, [rootRef, commitThesis]);

  const performAction = useCallback((action) => {
    const selected = measureAll(rootRef.current, latestRef.current.model, latestRef.current.zoom, selectionRef.current);
    if (!selected.length) return;
    // Whole-document measurement is only needed to find z-order extremes or newly created copies.
    const measureEvery = () => measureAll(rootRef.current, latestRef.current.model, latestRef.current.zoom);
    if (action === "copy") {
      clipboardRef.current = selected.map((item) => ({ ...item.canonical, ...item.measuredGeometry, layoutMode: "absolute" }));
      const text = clipboardRef.current.map((item) => item.text ?? item.content ?? "").filter(Boolean).join("\n");
      if (text) navigator.clipboard?.writeText(text).catch(() => {});
      return;
    }
    const movable = selected.filter((item) => item.editableLayout && !item.locked);
    const page = selected[0].page;
    let patches = [];
    if (action === "delete") {
      const next = selected.filter((item) => item.editableLayout && !item.locked).reduce((value, item) => deleteLayoutElement(value, item.id), latestRef.current.thesis || {});
      commitThesis(next);
      selectIds([]); return;
    }
    if (action === "duplicate") {
      const all = measureEvery();
      let next = latestRef.current.thesis || {};
      for (const item of movable) next = duplicateLayoutElement(next, { ...item.canonical, ...item.measuredGeometry,
        xMm: item.xMm + 2, yMm: item.yMm + 2, layoutMode: "absolute", content: item.canonical.text ?? item.element.textContent ?? "" });
      commitThesis(next);
      requestAnimationFrame(() => selectIds(measureAll(rootRef.current, latestRef.current.model, latestRef.current.zoom).filter((entry) => !all.some((prior) => prior.id === entry.id)).map((entry) => entry.id)));
      return;
    }
    if (["lock", "unlock"].includes(action)) patches = selected.map((item) => ({ id: item.id, locked: action === "lock" }));
    else if (["bringForward", "sendBackward", "bringToFront", "sendToBack"].includes(action)) {
      const max = Math.max(0, ...measureEvery().map((item) => Number(item.canonical?.zIndex) || 0));
      patches = selected.filter((item) => item.editableLayout && !item.locked).map((item, index) => ({ id: item.id, layoutMode: "absolute", zIndex: action === "bringToFront" ? max + index + 1 : action === "sendToBack" ? -max - index - 1 : (Number(item.canonical?.zIndex) || 0) + (action === "bringForward" ? 1 : -1) }));
    } else if (action.startsWith("align")) {
      const alignMap = { alignLeft: "left", alignCenter: "centerX", alignRight: "right", alignTop: "top", alignMiddle: "centerY", alignBottom: "bottom" };
      const pageAlignMap = { alignLeft: "pageLeft", alignCenter: "pageCenterX", alignRight: "pageRight", alignTop: "pageTop", alignMiddle: "pageCenterY", alignBottom: "pageBottom" };
      const aligned = alignLayoutElements(selected, movable.length === 1 ? pageAlignMap[action] : alignMap[action], page);
      patches = patchesForRects(selected, aligned);
    } else if (action === "distributeHorizontal" || action === "distributeVertical") {
      const distributed = distributeLayoutElements(selected, action === "distributeHorizontal" ? "x" : "y");
      patches = patchesForRects(selected, distributed);
    }
    if (patches.length) patchElements(patches);
  }, [patchElements, selectIds, rootRef, commitThesis]);

  const undo = useCallback(() => {
    const history = historyRef.current;
    if (!history.past.length) return;
    const layout = history.past.pop();
    const current = latestRef.current.thesis || {};
    history.future.push(current.layout); history.current = withLayoutSnapshot(current, layout);
    setHistoryVersion((version) => version + 1);
    publish(null, latestRef.current.onThesisChange, history.current);
  }, []);
  const redo = useCallback(() => {
    const history = historyRef.current;
    if (!history.future.length) return;
    const layout = history.future.pop();
    const current = latestRef.current.thesis || {};
    history.past.push(current.layout); history.current = withLayoutSnapshot(current, layout);
    setHistoryVersion((version) => version + 1);
    publish(null, latestRef.current.onThesisChange, history.current);
  }, []);

  // Re-attach when the page root mounts or changes, not on every model change.
  const mountedRoot = rootRef.current;
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return undefined;
    if (!root.hasAttribute("tabindex")) root.tabIndex = 0;
    root.setAttribute("data-undo-owner", "local");
    let geometryFrame = 0, moveFrame = 0, pendingMove = null;
    const updateGeometry = () => {
      if (geometryFrame) return;
      geometryFrame = requestAnimationFrame(() => { geometryFrame = 0; setGeometry(measureAll(root, latestRef.current.model, latestRef.current.zoom, selectionRef.current)); });
    };
    const clearTransient = (selector) => overlayRef.current?.querySelectorAll(selector).forEach((node) => node.remove());
    const drawMarquee = (rect) => {
      let box = overlayRef.current?.querySelector("[data-layout-transient-marquee]");
      if (!rect) { box?.remove(); return; }
      if (!box) { box = document.createElement("div"); box.setAttribute("data-layout-transient-marquee", ""); box.setAttribute("data-thesis-editor-only", ""); box.setAttribute("data-export-ignore", ""); overlayRef.current?.append(box); }
      Object.assign(box.style, { position: "fixed", left: `${rect.left}px`, top: `${rect.top}px`, width: `${rect.width}px`, height: `${rect.height}px`, border: "1px solid #2563eb", background: "rgba(37,99,235,.08)" });
    };
    const drawGuides = (items) => {
      clearTransient("[data-layout-transient-guide]");
      for (const guide of items) {
        const paper = guide.paper?.getBoundingClientRect(); if (!paper) continue;
        const line = document.createElement("div"); line.setAttribute("data-layout-transient-guide", ""); line.setAttribute("data-thesis-editor-only", ""); line.setAttribute("data-export-ignore", "");
        const coordinate = guide.axis === "x" ? paper.left + guide.positionMm * guide.scale : paper.top + guide.positionMm * guide.scale;
        Object.assign(line.style, guide.axis === "x"
          ? { position: "fixed", left: `${coordinate}px`, top: `${paper.top}px`, height: `${paper.height}px`, borderLeft: "1px dashed #db2777" }
          : { position: "fixed", left: `${paper.left}px`, top: `${coordinate}px`, width: `${paper.width}px`, borderTop: "1px dashed #db2777" });
        if (guide.kind === "gap" && Number.isFinite(guide.gapMm)) { const label = document.createElement("span"); label.textContent = `${guide.gapMm.toFixed(1)} mm gap`; Object.assign(label.style, { position: "absolute", left: "3px", top: "3px", padding: "1px 4px", background: "#be185d", color: "white", font: "10px system-ui,sans-serif", whiteSpace: "nowrap" }); line.append(label); }
        overlayRef.current?.append(line);
      }
    };
    const updateSelectionBox = (item) => {
      const box = [...(overlayRef.current?.querySelectorAll("[data-layout-selection-box]") || [])].find((entry) => entry.getAttribute("data-layout-selection-box") === item.id);
      if (!box) return;
      const rect = item.element.getBoundingClientRect(); Object.assign(box.style, { left: `${rect.left}px`, top: `${rect.top}px`, width: `${rect.width}px`, height: `${rect.height}px` });
    };
    // Scrolling moves the selected nodes without re-rendering React; follow them directly in the DOM.
    let scrollFrame = 0;
    const followScroll = () => {
      if (scrollFrame || !overlayRef.current?.querySelector("[data-layout-selection-box]")) return;
      scrollFrame = requestAnimationFrame(() => {
        scrollFrame = 0;
        let first = null;
        for (const box of overlayRef.current?.querySelectorAll("[data-layout-selection-box]") || []) {
          const element = root.querySelector(`[data-layout-id="${CSS.escape(box.getAttribute("data-layout-selection-box"))}"][data-layout-section][data-layout-type]`);
          if (!element) continue;
          first ||= element;
          const rect = element.getBoundingClientRect(); Object.assign(box.style, { left: `${rect.left}px`, top: `${rect.top}px`, width: `${rect.width}px`, height: `${rect.height}px` });
        }
        const clip = overlayRef.current?.querySelector("[data-layout-selection-clip]");
        if (clip && first) clip.style.clipPath = selectionClipPath(first);
      });
    };
    const nodeAt = (target) => target?.closest?.("[data-layout-id][data-layout-section][data-layout-type]");
    const findSheetPage = (target, clientY) => {
      const paper = target.closest?.(".thesis-paper");
      const stack = paper?.closest(".thesis-page-stack");
      const sheet = stack && [...stack.querySelectorAll(".thesis-sheet")].find((entry) => {
        const box = entry.getBoundingClientRect(); return clientY >= box.top && clientY <= box.bottom;
      });
      return sheet?.getAttribute("data-thesis-page") || "1";
    };
    const pointerDown = (event) => {
      if (event.button !== 0 || event.target.closest("[data-thesis-editor-only]")) return;
      const node = nodeAt(event.target);
      if (node && editable(node)) {
        if (editRef.current?.node === node) return;
        const rect = readRect(node, root, latestRef.current.model, latestRef.current.zoom);
        const additive = event.shiftKey;
        const ids = additive ? [...selectionRef.current, rect.id] : selectionRef.current.includes(rect.id) ? selectionRef.current : [rect.id];
        selectIds(ids);
        root.focus({ preventScroll: true });
        if (!rect.editableLayout || rect.locked) return;
        const everything = measureAll(root, latestRef.current.model, latestRef.current.zoom);
        const snapshot = everything.filter((item) => ids.includes(item.id));
        // Peer geometry is static during a move (only selected elements get transforms), so take it once.
        const peers = everything.filter((item) => item.sectionId === rect.sectionId && item.pageIndex === rect.pageIndex && !ids.includes(item.id));
        gestureRef.current = { kind: "move", startX: event.clientX, startY: event.clientY, node, rect, snapshot, peers, ids, pageKey: `${rect.sectionId}:${findSheetPage(node, event.clientY)}`, moved: false,
          inlineStyles: new Map(snapshot.map((item) => [item.id, { transform: item.element.style.transform, width: item.element.style.width, height: item.element.style.height }])) };
        event.preventDefault();
        return;
      }
      if (event.target.closest(".thesis-paper")) {
        const paper = event.target.closest(".thesis-paper");
        if (!event.shiftKey) selectIds([]);
        const box = paper.getBoundingClientRect();
        const page = findSheetPage(paper, event.clientY);
        gestureRef.current = { kind: "marquee", startX: event.clientX, startY: event.clientY, paper, page, box, moved: false };
      }
    };
    const pointerMove = (event) => {
      pendingMove = event;
      if (!moveFrame) moveFrame = requestAnimationFrame(() => { moveFrame = 0; flushMove(); });
    };
    const flushMove = () => {
      const event = pendingMove; pendingMove = null;
      if (moveFrame) { cancelAnimationFrame(moveFrame); moveFrame = 0; }
      const gesture = gestureRef.current;
      if (!gesture || !event) return;
      const dx = event.clientX - gesture.startX, dy = event.clientY - gesture.startY;
      if (!gesture.moved && Math.hypot(dx, dy) <= DRAG_THRESHOLD_PX) return;
      gesture.moved = true;
      if (gesture.kind === "resize") {
        const rect = clampResizeRect(gesture.start, gesture.handle, dx / gesture.item.scale, dy / gesture.item.scale, gesture.item.lockAspectRatio === true);
        const item = gesture.item;
        item.element.style.width = `${rect.widthMm}mm`;
        item.element.style.height = `${rect.heightMm}mm`;
        item.element.style.transform = `translate(${(rect.xMm - gesture.start.xMm) * localPxPerMm(item)}px, ${(rect.yMm - gesture.start.yMm) * localPxPerMm(item)}px)`;
        updateSelectionBox(item);
        gesture.final = rect;
        return;
      }
      if (gesture.kind === "marquee") {
        drawMarquee({ left: Math.min(gesture.startX, event.clientX), top: Math.min(gesture.startY, event.clientY), width: Math.abs(dx), height: Math.abs(dy) });
        return;
      }
      const scale = gesture.rect.scale;
      const deltaX = dx / scale, deltaY = dy / scale;
      const moved = gesture.snapshot.map((item) => item.editableLayout && !item.locked ? ({ ...item, xMm: item.xMm + deltaX, yMm: item.yMm + deltaY }) : item);
      const primary = moved.find((item) => item.id === gesture.rect.id);
      const peers = gesture.peers;
      const guides = (latestRef.current.thesis?.layout?.guides || []).filter((guide) => (guide.sectionId == null || guide.sectionId === primary.sectionId) && (guide.pageIndex == null || guide.pageIndex === primary.pageIndex));
      const localPrimary = { ...primary, yMm: primary.yMm - primary.pageTopMm };
      const localPeers = peers.map((peer) => ({ ...peer, yMm: peer.yMm - primary.pageTopMm }));
      const snapped = snapLayoutRect(localPrimary, localPeers, primary.page, guides);
      const snapDx = snapped.rect.xMm - localPrimary.xMm, snapDy = snapped.rect.yMm - localPrimary.yMm;
      const final = moved.map((item) => ({ ...item, xMm: item.xMm + snapDx, yMm: item.yMm + snapDy }));
      for (const item of final) {
        const start = gesture.snapshot.find((entry) => entry.id === item.id);
        const elem = item.element;
        elem.style.transform = `translate(${(item.xMm - start.xMm) * localPxPerMm(start)}px, ${(item.yMm - start.yMm) * localPxPerMm(start)}px)`;
        updateSelectionBox(item);
      }
      gesture.final = final;
      drawGuides(snapped.guides.map((guide) => ({ ...guide, positionMm: guide.axis === "y" ? guide.positionMm + primary.pageTopMm : guide.positionMm, page: primary.page, paper: primary.paper, scale: primary.scale })));
    };
    const pointerUp = (event) => {
      flushMove();
      const gesture = gestureRef.current;
      if (!gesture) return;
      gestureRef.current = null;
      if (gesture.kind === "resize") {
        gesture.item.element.style.transform = gesture.inlineStyles?.transform || "";
        gesture.item.element.style.width = gesture.inlineStyles?.width || "";
        gesture.item.element.style.height = gesture.inlineStyles?.height || "";
        updateSelectionBox(gesture.item);
        if (gesture.moved && gesture.final) patchElements([{ id: gesture.item.id, xMm: gesture.final.xMm, yMm: gesture.final.yMm, widthMm: gesture.final.widthMm, heightMm: gesture.final.heightMm, layoutMode: "absolute" }]);
        return;
      }
      if (gesture.kind === "marquee") {
        drawMarquee(null);
        if (gesture.moved) {
          const box = { left: Math.min(gesture.startX, event.clientX), right: Math.max(gesture.startX, event.clientX), top: Math.min(gesture.startY, event.clientY), bottom: Math.max(gesture.startY, event.clientY) };
          const ids = measureAll(root, latestRef.current.model, latestRef.current.zoom).filter((item) => item.sectionId === gesture.paper.getAttribute("data-thesis-section") && findSheetPage(item.element, item.element.getBoundingClientRect().top) === gesture.page)
            .filter((item) => { const r = item.element.getBoundingClientRect(); return r.right >= box.left && r.left <= box.right && r.bottom >= box.top && r.top <= box.bottom; }).map((item) => item.id);
          selectIds(ids);
        }
        return;
      }
      for (const item of gesture.snapshot) { item.element.style.transform = gesture.inlineStyles.get(item.id)?.transform || ""; updateSelectionBox(item); }
      drawGuides([]);
      if (!gesture.moved || !gesture.final?.length) return;
      const patches = gesture.final.filter((item) => item.editableLayout && !item.locked).map((item) => ({ id: item.id, xMm: item.xMm, yMm: item.yMm, layoutMode: "absolute" }));
      patchElements(patches);
    };
    const pointerCancel = () => {
      pendingMove = null; if (moveFrame) { cancelAnimationFrame(moveFrame); moveFrame = 0; }
      const gesture = gestureRef.current;
      if (!gesture) return;
      gestureRef.current = null; drawMarquee(null); drawGuides([]);
      if (gesture.kind === "resize") {
        gesture.item.element.style.transform = gesture.inlineStyles?.transform || "";
        gesture.item.element.style.width = gesture.inlineStyles?.width || "";
        gesture.item.element.style.height = gesture.inlineStyles?.height || "";
      } else for (const item of gesture.snapshot || []) {
        const styles = gesture.inlineStyles?.get(item.id);
        item.element.style.transform = styles?.transform || "";
        item.element.style.width = styles?.width || "";
        item.element.style.height = styles?.height || "";
        updateSelectionBox(item);
      }
    };
    const onDoubleClick = (event) => {
      const node = nodeAt(event.target);
      if (!editable(node) || node.getAttribute("data-layout-type") !== "text") return;
      const rect = readRect(node, root, latestRef.current.model, latestRef.current.zoom);
      if (!rect?.editableContent || rect.locked) return;
      selectIds([rect.id]);
      node.setAttribute("contenteditable", "plaintext-only");
      node.setAttribute("data-layout-editing", "true");
      node.setAttribute("data-undo-owner", "local");
      node.focus({ preventScroll: true });
      setEditingId(rect.id); editRef.current = { node, id: rect.id, original: node.innerText };
      node.addEventListener("blur", blurText, { once: true });
      const selection = document.getSelection();
      const range = document.createRange(); range.selectNodeContents(node); range.collapse(false); selection?.removeAllRanges(); selection?.addRange(range);
      event.stopPropagation();
    };
    const finishTextEdit = (commit) => {
      const edit = editRef.current;
        if (!edit) return;
      edit.node.removeAttribute("contenteditable"); edit.node.removeAttribute("data-layout-editing"); edit.node.removeAttribute("data-undo-owner");
      edit.node.removeEventListener("blur", blurText);
      const content = edit.node.innerText.replace(/\r\n?/g, "\n");
      editRef.current = null; setEditingId("");
      if (commit && content !== edit.original) patchElements([{ id: edit.id, text: content, content }], "text");
      else if (!commit) edit.node.innerText = edit.original;
    };
    const blurText = () => finishTextEdit(true);
    const onKeyDown = (event) => {
      const edit = editRef.current;
      if (edit) {
        if (event.key === "Escape") { event.preventDefault(); finishTextEdit(true); selectIds([edit.id]); }
        else if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); finishTextEdit(true); }
        return;
      }
      const focused = root.contains(document.activeElement) || root === document.activeElement;
      if (!focused || event.target.closest("input,textarea,select,[contenteditable='true'],[contenteditable='plaintext-only']")) return;
      const mod = event.ctrlKey || event.metaKey;
      if (mod && event.key.toLowerCase() === "z") { event.preventDefault(); event.stopPropagation(); event.shiftKey ? redo() : undo(); }
      else if (mod && event.key.toLowerCase() === "y") { event.preventDefault(); event.stopPropagation(); redo(); }
      else if (mod && event.key.toLowerCase() === "a") { event.preventDefault(); event.stopPropagation(); selectIds(measureAll(root, latestRef.current.model, latestRef.current.zoom).map((item) => item.id)); }
      else if (mod && event.key.toLowerCase() === "c") { clipboardRef.current = measureAll(root, latestRef.current.model, latestRef.current.zoom, selectionRef.current).map((item) => ({ ...item.canonical, ...item.measuredGeometry, layoutMode: "absolute" })); }
      else if (mod && event.key.toLowerCase() === "x") { clipboardRef.current = measureAll(root, latestRef.current.model, latestRef.current.zoom, selectionRef.current); performAction("delete"); }
      else if (mod && event.key.toLowerCase() === "v" && clipboardRef.current.length) {
        event.preventDefault(); let next = latestRef.current.thesis || {};
        for (const item of clipboardRef.current) next = duplicateLayoutElement(next, { ...item, xMm: item.xMm + 2, yMm: item.yMm + 2, content: item.text ?? item.content ?? "" });
        commitThesis(next);
      } else if (event.key === "Escape") { selectIds([]); setContextMenu(null); }
      else if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(event.key) && selectionRef.current.length) {
        event.preventDefault(); const delta = event.shiftKey ? 2.5 : 0.25;
        patchElements(measureAll(root, latestRef.current.model, latestRef.current.zoom, selectionRef.current).filter((item) => item.editableLayout && !item.locked).map((item) => ({ id: item.id, xMm: item.xMm + (event.key === "ArrowLeft" ? -delta : event.key === "ArrowRight" ? delta : 0), yMm: item.yMm + (event.key === "ArrowUp" ? -delta : event.key === "ArrowDown" ? delta : 0), layoutMode: "absolute" })));
      } else if (["Delete", "Backspace"].includes(event.key) && selectionRef.current.length) { event.preventDefault(); performAction("delete"); }
    };
    const onContextMenu = (event) => {
      const node = nodeAt(event.target);
      if (!editable(node)) return;
      event.preventDefault();
      const id = node.getAttribute("data-layout-id");
      if (!selectionRef.current.includes(id)) selectIds([id]);
      setContextMenu({ x: event.clientX, y: event.clientY, id });
    };
    const suppressObjectClick = (event) => { if (editable(nodeAt(event.target))) event.stopPropagation(); };
    root.addEventListener("pointerdown", pointerDown);
    root.addEventListener("click", suppressObjectClick, true);
    window.addEventListener("pointermove", pointerMove);
    window.addEventListener("pointerup", pointerUp);
    window.addEventListener("pointercancel", pointerCancel);
    root.addEventListener("dblclick", onDoubleClick);
    root.addEventListener("keydown", onKeyDown, true);
    root.addEventListener("contextmenu", onContextMenu);
    root.addEventListener("focusin", updateGeometry);
    window.addEventListener("resize", updateGeometry);
    document.addEventListener("scroll", followScroll, true);
    const observer = new ResizeObserver(updateGeometry); observer.observe(root);
    return () => {
      root.removeEventListener("pointerdown", pointerDown); root.removeEventListener("click", suppressObjectClick, true); window.removeEventListener("pointermove", pointerMove); window.removeEventListener("pointerup", pointerUp); window.removeEventListener("pointercancel", pointerCancel);
      root.removeEventListener("dblclick", onDoubleClick); root.removeEventListener("keydown", onKeyDown, true); root.removeEventListener("contextmenu", onContextMenu);
      root.removeEventListener("focusin", updateGeometry); window.removeEventListener("resize", updateGeometry); document.removeEventListener("scroll", followScroll, true); observer.disconnect();
      if (scrollFrame) cancelAnimationFrame(scrollFrame);
      if (geometryFrame) cancelAnimationFrame(geometryFrame); if (moveFrame) cancelAnimationFrame(moveFrame); pendingMove = null; drawMarquee(null); drawGuides([]);
      if (gestureRef.current?.kind === "resize") {
        const { item, inlineStyles } = gestureRef.current; item.element.style.transform = inlineStyles?.transform || ""; item.element.style.width = inlineStyles?.width || ""; item.element.style.height = inlineStyles?.height || "";
      }
      for (const item of gestureRef.current?.snapshot || []) {
        const styles = gestureRef.current.inlineStyles?.get(item.id); item.element.style.transform = styles?.transform || ""; item.element.style.width = styles?.width || ""; item.element.style.height = styles?.height || "";
      }
      gestureRef.current = null;
    };
  // model, thesis and zoom are read through latestRef: re-running on every model change
  // (e.g. a page count update while an element is resized) would cancel the gesture.
  }, [rootRef, mountedRoot, selectIds, patchElements, performAction, undo, redo, commitThesis]);

  const selectedElements = useMemo(() => geometry.map((item) => ({ ...item.canonical, id: item.id, locked: item.locked, editableLayout: item.editableLayout, editableContent: item.editableContent,
    measuredGeometry: item.measuredGeometry, canonical: item.canonical, page: item.page, element: item.element, pageIndex: item.pageIndex, sectionId: item.sectionId })), [geometry]);
  const overlayProps = { selectedElements, selectedIds, overlayRef, editingId, onResizeStart: (id, handle, event) => {
    const item = geometry.find((entry) => entry.id === id);
    if (!item?.editableLayout || item.locked) return;
    event.preventDefault(); event.stopPropagation();
    gestureRef.current = { kind: "resize", item, handle, startX: event.clientX, startY: event.clientY, start: item, moved: false,
      inlineStyles: { transform: item.element.style.transform, width: item.element.style.width, height: item.element.style.height } };
  }, onAction: performAction, contextMenu, setContextMenu };
  // One local history item per call from this editor; the host still owns persisted undo.
  const canUndo = historyRef.current.past.length > 0;
  const canRedo = historyRef.current.future.length > 0;
  return { selectedIds, selectedElements, geometry, editingId, contextMenu, setContextMenu, selectIds, patchElements, commitThesis, performAction, canUndo, canRedo, undo, redo, overlayProps };
}

export default useLayoutInteraction;
