import { useEffect, useRef, useState } from "react";
import { fitImageSize } from "../../lib/academicLayout";

/** Rendered size / layout size: 1 in AcademicEditor, the page zoom in ThesisEditor. */
function zoomOf(el) {
  const scale = el?.offsetWidth ? el.getBoundingClientRect().width / el.offsetWidth : 1;
  return Number.isFinite(scale) && scale > 0 ? scale : 1;
}

/** Controls are siblings of contenteditable, so they never enter saved HTML. */
export function AcademicImageControls({ rootRef, onChange }) {
  const [image, setImage] = useState(null);
  const [box, setBox] = useState(null);
  const [width, setWidth] = useState("");
  const drag = useRef(null);
  useEffect(() => {
    const root = rootRef.current;
    const pick = (event) => {
      const target = event.target.closest?.(".academic-figure img");
      if (target && root.contains(target)) { event.preventDefault(); setImage(target); }
      else if (!event.target.closest?.(".academic-image-controls")) setImage(null);
    };
    const escape = (event) => { if (event.key === "Escape") setImage(null); };
    document.addEventListener("pointerdown", pick);
    document.addEventListener("keydown", escape);
    return () => { document.removeEventListener("pointerdown", pick); document.removeEventListener("keydown", escape); };
  }, [rootRef]);
  useEffect(() => {
    if (!image) { setBox(null); return; }
    const update = () => {
      if (!image.isConnected) { setImage(null); return; }
      const r = image.getBoundingClientRect();
      // The controls share the editor's containing block: its frame, or the page surface in a paged thesis.
      const parent = (rootRef.current.offsetParent || rootRef.current.parentElement).getBoundingClientRect();
      // ThesisEditor renders pages inside transform: scale(zoom); rects are screen px, the box is CSS px.
      const scale = zoomOf(rootRef.current);
      setBox({ left:(r.left-parent.left)/scale, top:(r.top-parent.top)/scale, width:r.width/scale, height:r.height/scale });
      setWidth(String(Math.round(r.width/scale)));
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(image);
    observer.observe(rootRef.current);
    return () => observer.disconnect();
  }, [image, rootRef]);

  const resize = (nextWidth, persist) => {
    if (!image?.isConnected) return;
    const ratio = (image.naturalHeight || image.height) / (image.naturalWidth || image.width);
    const size = fitImageSize(Math.max(24, nextWidth), Math.max(24, nextWidth) * ratio, rootRef.current.clientWidth);
    image.width = size.width;
    image.height = size.height;
    image.style.width = `${size.width}px`;
    image.style.height = `${size.height}px`;
    if (persist) onChange("format");
  };
  if (!box || !image) return null;
  return <div className="academic-image-controls" style={box} aria-label="Görsel boyutlandırma">
    <div className="absolute -top-10 left-0 flex h-8 items-center gap-1 whitespace-nowrap rounded border border-blue-300 bg-white px-2 text-xs text-neutral-900 shadow">
      <label>Genişlik <input aria-label="Görsel genişliği (px)" className="w-14 border px-1" type="number" min="24" max="605" value={width} onChange={(e) => setWidth(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); resize(Number(width), true); } }} /></label>
      <button type="button" onClick={() => resize(Number(width), true)}>Uygula</button>
      <span>px · Oran kilitli</span>
    </div>
    {[[-1,-1],[1,-1],[-1,1],[1,1]].map(([x,y]) => <button
      type="button" key={`${x},${y}`} aria-label={`Görseli boyutlandır ${x < 0 ? "sol" : "sağ"} ${y < 0 ? "üst" : "alt"}`}
      className="academic-resize-handle"
      style={{ [x<0?"left":"right"]:-7, [y<0?"top":"bottom"]:-7, cursor:x===y?"nwse-resize":"nesw-resize" }}
      onPointerDown={(e) => { e.preventDefault(); e.currentTarget.setPointerCapture(e.pointerId); drag.current={ start:e.clientX, width:box.width, direction:x, scale:zoomOf(rootRef.current) }; }}
      onPointerMove={(e) => { if (drag.current) resize(drag.current.width+(e.clientX-drag.current.start)/drag.current.scale*drag.current.direction, false); }}
      onPointerUp={(e) => { if (drag.current) { drag.current=null; e.currentTarget.releasePointerCapture(e.pointerId); onChange("format"); } }}
      onPointerCancel={() => { drag.current=null; onChange("format"); }}
      onKeyDown={(e) => { if (e.key === "ArrowLeft" || e.key === "ArrowRight") { e.preventDefault(); resize(box.width+(e.key === "ArrowLeft"?-10:10), true); } }}
    />)}
  </div>;
}
