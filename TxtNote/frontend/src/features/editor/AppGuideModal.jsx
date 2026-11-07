import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { APP_GUIDE_SECTIONS, APP_GUIDE_VERSION } from "../../lib/appGuideContent.js";

const FOCUSABLE = 'a[href],button:not([disabled]),summary,[tabindex]:not([tabindex="-1"])';

/** Ortak uygulama rehberi: ekran ortasında, arka planı bulanık, kendi içinde kaydırılan modal. Belge durumuna dokunmaz. */
export default function AppGuideModal({ onClose, returnFocusRef }) {
  const dialogRef = useRef(null);
  const closeRef = useRef(null);
  useEffect(() => {
    const opener = returnFocusRef?.current || document.activeElement;
    closeRef.current?.focus({ preventScroll: true });
    return () => { if (opener?.isConnected) opener.focus({ preventScroll: true }); };
  }, []);
  const onKeyDown = (event) => {
    if (event.key === "Escape") { event.preventDefault(); event.stopPropagation(); onClose(); return; }
    if (event.key !== "Tab") return;
    const nodes = [...dialogRef.current.querySelectorAll(FOCUSABLE)].filter((node) => node.offsetParent !== null);
    if (!nodes.length) return;
    const first = nodes[0], last = nodes[nodes.length - 1];
    if (event.shiftKey && (document.activeElement === first || !dialogRef.current.contains(document.activeElement))) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && (document.activeElement === last || !dialogRef.current.contains(document.activeElement))) { event.preventDefault(); first.focus(); }
  };
  return createPortal(
    <div className="app-guide-backdrop" data-thesis-editor-only="true" data-export-ignore="" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }} onKeyDown={onKeyDown}>
      <div ref={dialogRef} className="app-guide-dialog" role="dialog" aria-modal="true" aria-labelledby="app-guide-title" aria-describedby="app-guide-intro">
        <header className="app-guide-head">
          <div><h2 id="app-guide-title">Uygulama rehberi</h2><p id="app-guide-intro">Bütün şablonlarda aynıdır; şablona özgü kurallar için “Bu şablonun yazım kuralları”na bakın.</p></div>
          <button ref={closeRef} type="button" className="app-guide-close" aria-label="Uygulama rehberini kapat" title="Kapat (Esc)" onClick={onClose}><X size={20} aria-hidden="true" /></button>
        </header>
        <div className="app-guide-body" tabIndex={0} aria-label="Uygulama rehberi içeriği">
          <nav aria-label="Rehber bölümleri" className="app-guide-toc"><ol>{APP_GUIDE_SECTIONS.map((section, index) => <li key={section.id}><a href={`#app-guide-${section.id}`} onClick={(event) => { event.preventDefault(); dialogRef.current.querySelector(`#app-guide-${section.id}`)?.scrollIntoView({ block: "start" }); }}>{index + 1}. {section.title}</a></li>)}</ol></nav>
          {APP_GUIDE_SECTIONS.map((section, index) => <section key={section.id} id={`app-guide-${section.id}`} className="app-guide-section"><h3><span aria-hidden="true">{index + 1}</span>{section.title}</h3><ol>{section.steps.map((step) => <li key={step}>{step}</li>)}</ol></section>)}
          <p className="app-guide-version">Rehber sürümü: {APP_GUIDE_VERSION}</p>
        </div>
      </div>
    </div>,
    document.body,
  );
}
