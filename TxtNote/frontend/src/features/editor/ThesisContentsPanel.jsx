import { useEffect, useRef, useState } from "react";
import { contentsTitleParts, manualTocEntries, normalizeManualTocRows, sortManualTocRows } from "../../../../../engine/src/manualToc.js";
import "./thesisContents.css";

export default function ThesisContentsPanel({ rows, authoredRows, universityName, onChange, onPlace, onAutomatic, onClose }) {
  const recovered = authoredRows === undefined ? null : normalizeManualTocRows(authoredRows);
  const legacyPreview = recovered ? new Map(manualTocEntries(recovered).map(row => [row.anchor, row])) : null;
  const draft = sortManualTocRows(recovered ? recovered.map(row => {
    if (row.literalTitle) return row;
    const entry = legacyPreview.get(`manual-toc-${encodeURIComponent(row.id)}`);
    return { ...row, title:[entry?.label, row.title].filter(Boolean).join(' '), literalTitle:true };
  }) : (Array.isArray(rows) ? rows : []).map(row => ({ id:row.manualPage ? decodeURIComponent(row.anchor.slice('manual-toc-'.length)) : row.anchor,
    title:[row.unnumbered ? '' : row.label, row.rowTitle ?? row.title ?? ''].filter(Boolean).join(' '), page:String(row.page ?? ''), literalTitle:true })));
  const [expandedId, setExpandedId] = useState(null);
  const rowsRef = useRef(null);
  const addedRef = useRef(false);
  useEffect(() => {
    if (!addedRef.current) return;
    addedRef.current = false;
    rowsRef.current?.querySelector('.thesis-contents-detail input')?.focus();
  }, [draft.length]);
  const setDraft = (next, reason = 'action') => onChange(sortManualTocRows(next), reason);
  const patch = (id, values) => setDraft(draft.map(row => row.id === id ? {...row,...values} : row), 'input');
  const add = () => {
    const row = { id:crypto.randomUUID(), title:'', page:'', literalTitle:true, bodyLinked:true };
    addedRef.current = true;
    setExpandedId(row.id);
    setDraft([...draft,row]);
  };
  return <section className="thesis-contents-panel" aria-label="İçindekiler düzenleyici">
    <header><strong>İçindekiler · {universityName}</strong><button type="button" onClick={onClose} aria-label="İçindekiler panelini kapat">✕</button></header>
    <div ref={rowsRef} className="thesis-contents-rows"><ol className="thesis-contents-tree">{draft.map(row => {
      const parts = contentsTitleParts(row.title), expanded = expandedId === row.id;
      const detailId = `contents-detail-${row.id}`;
      return <li key={row.id} data-depth={parts.level || 1}>
        <button type="button" className={`thesis-contents-summary${expanded ? ' is-expanded' : ''}`} aria-expanded={expanded} aria-controls={detailId} onClick={() => setExpandedId(expanded ? null : row.id)}>
          {parts.label && <span className="thesis-contents-number">{parts.label}</span>}
          <span className="thesis-contents-title">{parts.title || (parts.label ? '' : 'Yeni başlık')}</span>
          <span className="thesis-contents-page">{row.page || '—'}</span>
        </button>
        {expanded && <div id={detailId} className="thesis-contents-detail" role="group" aria-label={`${row.title || 'Yeni başlık'} ayrıntıları`}>
          <label>Başlık<input value={row.title} placeholder="Özet veya 1. Özet" onChange={event => patch(row.id, { title:event.target.value })}/></label>
          <div className="thesis-contents-row-bottom"><label>Sayfa<input value={row.page} placeholder="12 / IV" onChange={event => patch(row.id, { page:event.target.value })} onBlur={() => onPlace?.(row.id)} onKeyDown={event => { if (event.key === 'Enter') { event.preventDefault(); onPlace?.(row.id); } }}/></label>
            <button type="button" onClick={() => { setDraft(draft.filter(item => item.id !== row.id)); setExpandedId(null); }} aria-label={`${row.title || 'Başlık'} satırını sil`}>Sil</button></div>
        </div>}
      </li>;
    })}</ol></div>
    <div className="thesis-contents-actions"><button type="button" onClick={add}>+ Başlık ekle</button></div>
    <footer><span className="thesis-contents-live-status">Sayfaya göre sıralanır · Anında uygulanır</span><button type="button" onClick={onAutomatic}>Otomatik içindekilere dön</button></footer>
  </section>;
}
