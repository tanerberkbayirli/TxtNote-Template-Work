import { useRef, useState } from 'react';
import { BookOpen, ChevronRight, Plus, Search, Trash2 } from 'lucide-react';
import { managedReferences } from '../../lib/thesisWriting.js';

export default function ThesisSources({ items = [], authored = [], authoredHtml = false, bibliographyId, numeric, canInsert, onAdd, onUpdate, onRemove, onCite, onNavigate, onPickPosition }) {
  const citeFormRef = useRef(null);
  const [query, setQuery] = useState('');
  const [draft, setDraft] = useState('');
  const [adding, setAdding] = useState(false);
  const [selected, setSelected] = useState(null);
  const [citation, setCitation] = useState('');
  const [mode, setMode] = useState('inline');
  const [removeIndex, setRemoveIndex] = useState(null);
  const records = [...authored.map((entry, index) => ({...entry, key:`body-${index}`, authored:true, index})), ...managedReferences(items)];
  const count = records.length;
  const matches = record => record.text.toLocaleLowerCase('tr').includes(query.trim().toLocaleLowerCase('tr'));
  const selectedRecord = records.find(record => record.key === selected);
  const ambiguousNumbers = numeric && authoredHtml && items.some(item => item.trim());
  const numericOrderValid = !numeric || !authoredHtml || (authored.length > 0 && authored.every((entry,index) => entry.number === index+1));
  const canAdd = bibliographyId && numericOrderValid && !ambiguousNumbers;
  return <>
    <div className="thesis-panel-intro"><span className="thesis-eyebrow">KAYNAKÇA VE ATIFLAR</span><h3>Kaynaklarınız bir arada.</h3><p>{numeric ? 'Bu şablon metin içinde (1), (2) biçiminde atıf kullanır. Kaynakları ilk kullanım sırasıyla ekleyin.' : 'Kaynakça kaydını ekleyin; metin içindeki kısa atfı ayrıca belirtin.'}</p></div>
    {!bibliographyId ? <p className="thesis-info-card">Bu şablonda kaynakça bölümü bulunmuyor.</p> : <>
      <div className="thesis-source-actions"><button type="button" className="thesis-primary-button" disabled={!canAdd} onClick={() => setAdding(value => !value)} aria-expanded={adding}><Plus size={15}/> Kaynak ekle</button><button type="button" className="thesis-panel-link" onClick={() => onNavigate(bibliographyId)}>Kaynakça sayfası <ChevronRight size={13}/></button></div>
      {adding && <form className="thesis-heading-form" onSubmit={event => {event.preventDefault(); if (draft.trim() && onAdd(draft.trim())) {setDraft(''); setAdding(false);}}}>
        <label>Kaynakça kaydı<textarea autoFocus aria-label="Yeni kaynakça kaydı" rows={5} placeholder="Yazar, yıl, eser adı, yayın bilgisi ve varsa DOI / URL…" value={draft} onChange={event => setDraft(event.target.value)}/></label><p>Tam kaydı kullandığınız kaynak gösterme stiline göre yazın.</p><div className="thesis-source-actions"><button type="submit" className="thesis-primary-button" disabled={!draft.trim()}>Kaynağı kaydet</button><button type="button" className="thesis-panel-link" onClick={() => setAdding(false)}>Vazgeç</button></div>
      </form>}
      {!canAdd && <div className="thesis-inline-notice">{ambiguousNumbers ? 'Kaynakça hem sayfada hem listede yazılmış. Atıf numaralarını kullanmadan önce kaynakça sırasını sayfada birleştirin.' : 'Mevcut kaynakçanın numaralarını sayfada düzenleyin. Ardından buradan kaynak ekleyebilirsiniz.'}</div>}
      <label className="thesis-panel-search"><Search size={15} aria-hidden="true"/><input aria-label="Kaynak ara" placeholder="Yazar, eser veya yıl ara…" value={query} onChange={event => setQuery(event.target.value)}/></label>
      <div className="thesis-panel-section-title"><h3>{count} kaynak</h3></div>
      {!count && <div className="thesis-source-empty"><BookOpen size={28}/><strong>İlk kaynağınızı ekleyin</strong><p>Eklediğiniz kayıt kaynakça sayfasında görünür. Ardından metninizde atıf yapabilirsiniz.</p></div>}
      {count > 0 && !records.some(matches) && <p className="thesis-panel-empty">Bu aramayla eşleşen kaynak yok.</p>}
      <ul className="thesis-source-list">{records.filter(matches).map(record => <li className={selected === record.key ? 'is-selected' : ''} key={record.key}>
        <div className="thesis-source-card-heading"><span>Kaynak {numeric ? record.number || '?' : records.indexOf(record)+1}</span>{!record.authored && <button type="button" className="thesis-icon-button" aria-label={`Kaynak ${record.index+1} sil`} onClick={() => setRemoveIndex(removeIndex === record.index ? null : record.index)}><Trash2 size={14}/></button>}</div>
        <p>{record.text}</p>
        <div className="thesis-source-actions"><button type="button" className="thesis-panel-link" onMouseDown={event => event.preventDefault()} disabled={ambiguousNumbers || !numericOrderValid || (numeric && !record.number)} onClick={() => {setSelected(record.key);setCitation(numeric ? `(${record.number})` : '');requestAnimationFrame(() => citeFormRef.current?.scrollIntoView({block:'nearest'}));}}>Atıf yap</button>{record.authored ? <button type="button" className="thesis-panel-link" onClick={() => onNavigate(bibliographyId)}>Sayfada düzenle</button> : <details><summary className="thesis-panel-link">Kaydı düzenle</summary><textarea aria-label={`Kaynakça maddesi ${record.index+1}`} value={items[record.index]} rows={4} onChange={event => onUpdate(record.index,event.target.value)}/></details>}</div>
        {removeIndex === record.index && !record.authored && <div className="thesis-inline-notice"><p>Kaynak silinsin mi? Metindeki atıflar sabit metindir; silme sonrası atıfları ve numaraları kontrol edin.</p><button type="button" className="thesis-danger-button" onClick={() => {onRemove(record.index);setRemoveIndex(null);setSelected(null);}}>Kaynağı sil</button><button type="button" className="thesis-panel-link" onClick={() => setRemoveIndex(null)}>Vazgeç</button></div>}
      </li>)}</ul>
      {selectedRecord && <form ref={citeFormRef} className="thesis-cite-form" onSubmit={event => {event.preventDefault(); if (canInsert && citation.trim()) onCite(citation.trim(), numeric ? 'inline' : mode);}}>
        <strong>Seçili kaynağa atıf</strong><p className="thesis-cite-source">{selectedRecord.text}</p>
        {!numeric && <label>Atıf türü<select aria-label="Atıf türü" value={mode} onChange={event => setMode(event.target.value)}><option value="inline">Metin içi atıf</option><option value="footnote">Dipnot atfı</option></select></label>}
        <label>Metinde görünecek atıf<input aria-label="Metin içi atıf metni" value={citation} readOnly={numeric} placeholder="Örn. (Yılmaz, 2024, s. 18)" onChange={event => setCitation(event.target.value)}/></label>
        <p>{canInsert ? 'Atıf, metinde en son seçtiğiniz konuma eklenir.' : 'Önce metinde atfın ekleneceği yere tıklayın.'}</p>
        {!canInsert && <button type="button" className="thesis-panel-link" onClick={onPickPosition}>Metinde konum seç <ChevronRight size={13}/></button>}
        <button type="submit" className="thesis-primary-button" disabled={!canInsert || !citation.trim()}>Atfı metne ekle</button>
      </form>}
      {count > 0 && <p className="thesis-panel-footnote">Atıflar metin olarak eklenir. Kaynağı değiştirir veya silerseniz ilgili atıfları da kontrol edin.</p>}
    </>}
  </>;
}
