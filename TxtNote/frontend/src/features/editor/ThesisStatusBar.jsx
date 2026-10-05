import { useEffect, useState } from "react";

// Keep document reads out of editor renders. Panel/selection/zoom updates do not
// change the count; coalesce typing and pagination mutations into one read.
function WordCount({ papersRef, title }) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    const root = papersRef.current;
    if (!root) return undefined;
    let timer;
    const measure = () => {
      const text = `${title} ${[...root.querySelectorAll('[contenteditable="true"]')]
        .map((node) => node.innerText || node.textContent || "").join(" ")}`;
      setCount(text.trim().split(/\s+/u).filter(Boolean).length);
    };
    const schedule = () => {
      clearTimeout(timer);
      timer = setTimeout(measure, 200);
    };
    const observer = new MutationObserver(schedule);
    observer.observe(root, { subtree: true, childList: true, characterData: true });
    root.addEventListener("input", schedule);
    schedule();
    return () => { clearTimeout(timer); observer.disconnect(); root.removeEventListener("input", schedule); };
  }, [papersRef, title]);
  return <span data-thesis-word-count={count}>{count.toLocaleString("tr-TR")} sözcük</span>;
}

export default function ThesisStatusBar({ papersRef, title, totalPages, zoom, zoomChoice, setZoomChoice, stepZoom, keepSelection, saveSelection }) {
  return <footer className="thesis-statusbar" aria-label="Belge durumu">
    <div className="thesis-status-left"><WordCount papersRef={papersRef} title={title} /><span aria-hidden="true">·</span><span data-thesis-total-pages={totalPages}>{totalPages} sayfa</span><span className="thesis-status-page">A4</span></div>
    <div className="thesis-status-right"><button type="button" aria-label="Uzaklaştır" disabled={zoom <= 0.5} onMouseDown={keepSelection} onClick={() => stepZoom(-1)}>−</button><input aria-label="Yakınlaştırma düzeyi" type="range" min="50" max="150" step="25" value={zoomChoice === "fit" ? Math.round(zoom * 100 / 25) * 25 : Number(zoomChoice)} onMouseDown={saveSelection} onChange={(event) => setZoomChoice(event.target.value)} /><button type="button" aria-label="Yakınlaştır artır" disabled={zoom >= 1.5} onMouseDown={keepSelection} onClick={() => stepZoom(1)}>+</button><select aria-label="Yakınlaştır" value={zoomChoice} onMouseDown={saveSelection} onChange={(event) => setZoomChoice(event.target.value)}><option value="fit">Genişliğe sığdır</option>{[50, 75, 100, 125, 150].map((value) => <option key={value} value={String(value)}>%{value}</option>)}</select></div>
  </footer>;
}
