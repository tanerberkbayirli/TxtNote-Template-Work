/** Read-only table-to-following-block evidence for the shared conformance export path. */
export async function blockGapDiagnostics(page, regex = ".") {
  return page.evaluate((pattern) => {
    const filter = new RegExp(pattern);
    const rect = (r) => ({ x: r.x, y: r.y, width: r.width, height: r.height });
    const properties = ["fontSize", "lineHeight", "top", "marginTop", "marginBottom", "paddingTop", "paddingBottom", "borderBottomWidth", "display", "overflow"];
    const describe = (node) => {
      if (!node) return null;
      const style = getComputedStyle(node), after = getComputedStyle(node, "::after");
      return { tag: node.tagName, text: node.textContent.trim().slice(-160),
        rects: [...node.getClientRects()].map(rect),
        style: Object.fromEntries(properties.map((key) => [key, style[key]])),
        after: { content: after.content, height: after.height, marginBottom: after.marginBottom, display: after.display } };
    };
    return [...document.querySelectorAll(".thesis-body table")]
      .filter((node) => filter.test(node.textContent))
      .map((node) => {
        const wrapper = node.closest(".academic-table-wrap") || node;
        return { wrapper: describe(wrapper), table: describe(node),
          lastCell: describe(node.rows[node.rows.length - 1]?.cells[0]),
          next: describe(wrapper.nextElementSibling) };
      });
  }, regex);
}

/** Diagnostics must finish even when the stalled page no longer produces frames. */
export async function paginationDiagnostics(page, { sampleMs = 500, timeoutMs = 1500 } = {}) {
  let timeout;
  try {
    return await Promise.race([
      page.evaluate((duration) => new Promise((resolve) => {
        const root = document.querySelector('[aria-label="Belge sayfaları"]');
        let frames = 0, frame = 0;
        const tick = () => { frames += 1; frame = requestAnimationFrame(tick); };
        frame = requestAnimationFrame(tick);
        setTimeout(() => {
          cancelAnimationFrame(frame);
          resolve({ frames500ms: frames, visibility: document.visibilityState,
            ready: root?.getAttribute("data-thesis-pagination-ready") ?? "missing",
            sheets: document.querySelectorAll(".thesis-sheet").length,
            stamps: document.querySelectorAll("[data-thesis-fn-stamp]").length,
            stampDetails: [...document.querySelectorAll("[data-thesis-fn-stamp]")].map((node) => ({
              kind: node.getAttribute("data-thesis-fn-stamp"), tag: node.tagName,
              text: node.textContent.trim().slice(0, 90),
              marginTop: getComputedStyle(node).marginTop,
              breakBefore: getComputedStyle(node).breakBefore,
            })),
            spacers: document.querySelectorAll("[data-thesis-fn-spacer],[data-thesis-mirror-narrow]").length });
        }, duration);
      }), sampleMs),
      new Promise((resolve) => { timeout = setTimeout(() => resolve({ diagnostics: "page unresponsive" }), timeoutMs); }),
    ]);
  } catch {
    return { diagnostics: "page unavailable" };
  } finally {
    clearTimeout(timeout);
  }
}
