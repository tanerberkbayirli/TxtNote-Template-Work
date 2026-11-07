import { useEffect, useMemo, useRef, useState } from 'react';
import { BookOpen, ChevronRight, Link2, Pencil, Plus, Quote, RotateCcw, Search, Trash2 } from 'lucide-react';
import { CITATION_MODE_LABELS, SOURCE_KINDS, THESIS_TYPES, citationLabel, formattedEntryText, normalizeSource, sourceFieldsFor } from '../../../../../engine/src/citations.js';

// Linked source pool (engine/src/citations.js). The bibliography page is derived: a source appears there once the text cites it
// and leaves when its last citation is removed. The panel edits the pool, inserts citations and corrects entries by hand.
// The kind's own fields (engine/src/citations.js SOURCE_KIND_FIELDS): `publication` is the kind's container.
const PUBLICATION_LABEL = { book: 'Yayınevi', article: 'Dergi adı', chapter: 'Kitap (editör, kitap adı)', thesis: 'Üniversite adı', web: 'Web sitesi adı', report: 'Kurum' };
const PUBLICATION_PLACEHOLDER = { thesis: 'Örn. Manisa Celal Bayar Üniversitesi', web: 'Örn. Wikipedia, BBC' };
const KIND_OWN_FIELDS = ['publication', 'volume', 'issue', 'pages', 'thesisType'];
const EMPTY = { kind: 'book', authors: '', year: '', title: '', publication: '', volume: '', issue: '', pages: '', doi: '', url: '' };

function SourceFields({ value, onChange }) {
  const kind = SOURCE_KINDS[value.kind] ? value.kind : 'book';
  const shown = new Set(sourceFieldsFor(kind));
  const set = (key) => (event) => onChange({ ...value, [key]: event.target.value });
  // Another kind starts with its own fields empty (a publisher must not turn into a journal name); the common fields stay.
  // A thesis asks for its degree, Yüksek Lisans first. Fields of other kinds are not stored (normalizeSource).
  const setKind = (event) => {
    const next = event.target.value;
    onChange({ ...value, ...Object.fromEntries(KIND_OWN_FIELDS.map((key) => [key, ''])), ...(next === 'web' ? { doi: '' } : {}), kind: next, ...(next === 'thesis' ? { thesisType: 'master' } : {}) });
  };
  const input = (key, label, props = {}) => <label>{label}<input aria-label={props.ariaLabel || label} value={value[key] || ''} onChange={set(key)} {...(props.placeholder ? { placeholder: props.placeholder } : {})} {...(props.inputMode ? { inputMode: props.inputMode } : {})}/></label>;
  return <div className="thesis-source-fields">
    <label>Tür<select aria-label="Kaynak türü" value={kind} onChange={setKind}>{Object.entries(SOURCE_KINDS).map(([id, label]) => <option key={id} value={id}>{label}</option>)}</select></label>
    {input('authors', 'Yazar(lar)', { ariaLabel: 'Yazarlar', placeholder: 'Soyad, Ad; Soyad, Ad' })}
    {input('year', 'Yıl', { placeholder: '2026', inputMode: 'numeric' })}
    {input('title', 'Başlık')}
    {shown.has('thesisType') && <label>Tez türü<select aria-label="Tez türü" value={value.thesisType || ''} onChange={set('thesisType')}>{!value.thesisType && <option value="" disabled>Seçin</option>}{Object.entries(THESIS_TYPES).map(([id, label]) => <option key={id} value={id}>{label}</option>)}</select></label>}
    {shown.has('publication') && input('publication', PUBLICATION_LABEL[kind], { placeholder: PUBLICATION_PLACEHOLDER[kind] })}
    {shown.has('volume') && <div className="thesis-source-row">{input('volume', 'Cilt (Volume)', { ariaLabel: 'Cilt' })}{input('issue', 'Sayı (Issue)', { ariaLabel: 'Sayı' })}</div>}
    {shown.has('pages') && input('pages', 'Sayfa aralığı', { placeholder: 'Örn. 15-30' })}
    {input('url', 'URL (isteğe bağlı)', { ariaLabel: 'URL' })}
    {shown.has('doi') && input('doi', 'DOI (isteğe bağlı)', { ariaLabel: 'DOI', placeholder: '10.xxxx/xxxx' })}
  </div>;
}

export default function ThesisSources({ pool = [], citations, mode = 'parenthetical', onModeChange, legacyItems = [], authored = [], bibliographyId, canInsert, focusId, onFocusHandled, onAdd, onUpdate, onRemove, onCite, onLinkLegacy, onRemoveLegacy, onNavigate, onPickPosition, onCitingChange }) {
  const listRef = useRef(null);
  const [query, setQuery] = useState('');
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState(EMPTY);
  const [editing, setEditing] = useState(null);
  const [manual, setManual] = useState(null);
  const [manualText, setManualText] = useState('');
  const [citing, setCiting] = useState(null);
  const [locator, setLocator] = useState('');
  const [removing, setRemoving] = useState(null);
  // While a cite form is open the editor marks the insertion point in the text (ThesisEditor CitationCaretMarker).
  useEffect(() => { onCitingChange?.(citing !== null); }, [citing]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => () => onCitingChange?.(false), []); // eslint-disable-line react-hooks/exhaustive-deps
  const context = useMemo(() => citations || { mode, lang: 'tr', sources: pool, cited: [], counts: {}, numbers: {} }, [citations, mode, pool]);
  const counts = context.counts || {};
  const legacy = legacyItems.map((text, index) => ({ text: String(text || '').trim(), index })).filter((item) => item.text);
  const matches = (source) => `${source.authors} ${source.title} ${source.year} ${source.entryOverride || ''}`.toLocaleLowerCase('tr').includes(query.trim().toLocaleLowerCase('tr'));
  const entryText = (source) => (source.entryOverride || '').trim() || formattedEntryText(context, source);
  const previewContext = (source) => ({ ...context, sources: [...context.sources.filter((item) => item.id !== source.id), source], cited: [...new Set([...(context.cited || []), source.id])] });

  // A double click on an entry of the bibliography page opens that source's hand edit here.
  useEffect(() => {
    if (!focusId) return;
    const source = pool.find((item) => item.id === focusId);
    if (source) { setManual(source.id); setManualText(entryText(source)); requestAnimationFrame(() => listRef.current?.querySelector(`[data-source-card="${CSS.escape(source.id)}"]`)?.scrollIntoView({ block: 'nearest' })); }
    onFocusHandled?.();
  }, [focusId]); // eslint-disable-line react-hooks/exhaustive-deps

  const canSave = draft.title.trim() || draft.authors.trim();
  const draftSource = normalizeSource({ ...draft, id: 'draft' });
  const listed = pool.filter(matches);
  const citedCount = pool.filter((source) => counts[source.id]).length;

  return <>
    <div className="thesis-panel-intro"><span className="thesis-eyebrow">KAYNAKÇA VE ATIFLAR</span><h3>Atıf yapın, kaynakça kendini kursun.</h3><p>Metinde atıf yaptığınız her kaynak kaynakçaya eklenir, son atfı silinen kaynak listeden çıkar. Liste yazar soyadına göre A’dan Z’ye sıralanır.</p></div>
    {!bibliographyId ? <p className="thesis-info-card">Bu şablonda kaynakça bölümü bulunmuyor.</p> : <>
      <fieldset className="thesis-cite-mode" aria-label="Atıf biçimi">
        <legend>Atıf biçimi</legend>
        {['footnote', 'parenthetical', ...(context.templateMode === 'numeric' || mode === 'numeric' ? ['numeric'] : [])].map((id) => <label key={id} className={mode === id ? 'is-selected' : ''}><input type="radio" name="thesis-cite-mode" checked={mode === id} onChange={() => onModeChange?.(id)}/>{CITATION_MODE_LABELS[id]}</label>)}
        <p>{mode === 'footnote' ? 'Cümle sonuna üst simge numara; kısa künye aynı sayfanın altında.' : mode === 'numeric' ? 'Cümle sonuna, noktadan önce (1); kaynakça atıf sırasıyla numaralı.' : 'Cümle sonuna, noktadan önce (Yazar, Yıl).'}{context.templateMode && context.templateMode !== mode ? ` Şablonunuzun önerdiği: ${CITATION_MODE_LABELS[context.templateMode]}.` : ''}</p>
      </fieldset>

      <div className="thesis-source-actions"><button type="button" className="thesis-primary-button" onClick={() => setAdding((value) => !value)} aria-expanded={adding}><Plus size={15}/> Kaynak ekle</button><button type="button" className="thesis-panel-link" onClick={() => onNavigate(bibliographyId)}>Kaynakça sayfası <ChevronRight size={13}/></button></div>
      {adding && <form className="thesis-heading-form" onSubmit={(event) => { event.preventDefault(); if (!canSave) return; onAdd(normalizeSource(draft)); setDraft(EMPTY); setAdding(false); }}>
        <SourceFields value={draft} onChange={setDraft}/>
        {canSave && <div className="thesis-source-preview"><span>Metinde</span><strong>{citationLabel(previewContext(draftSource), 'draft', '')}</strong><span>Kaynakçada</span><p>{formattedEntryText(previewContext(draftSource), draftSource)}</p></div>}
        <div className="thesis-source-actions"><button type="submit" className="thesis-primary-button" disabled={!canSave}>Kaynağı kaydet</button><button type="button" className="thesis-panel-link" onClick={() => setAdding(false)}>Vazgeç</button></div>
      </form>}

      <label className="thesis-panel-search"><Search size={15} aria-hidden="true"/><input aria-label="Kaynak ara" placeholder="Yazar, eser veya yıl ara…" value={query} onChange={(event) => setQuery(event.target.value)}/></label>
      <div className="thesis-panel-section-title"><h3>{pool.length} kaynak · {citedCount} kaynakçada</h3></div>
      {!pool.length && <div className="thesis-source-empty"><BookOpen size={28}/><strong>İlk kaynağınızı ekleyin</strong><p>Kaynağı bir kez girin; atıf yaptığınızda kısa künye metne, ayrıntılı künye kaynakçaya yazılır.</p></div>}
      {pool.length > 0 && !listed.length && <p className="thesis-panel-empty">Bu aramayla eşleşen kaynak yok.</p>}
      <ul ref={listRef} className="thesis-source-list">{listed.map((source) => {
        const count = counts[source.id] || 0;
        return <li key={source.id} data-source-card={source.id} className={[citing === source.id || manual === source.id ? 'is-selected' : '', count ? '' : 'is-unused'].join(' ')}>
          <div className="thesis-source-card-heading"><span className="thesis-source-short">{citationLabel(context, source.id, '')}</span><span className={`thesis-source-status${count ? ' is-cited' : ''}`}>{count ? `${count} atıf · kaynakçada` : 'Atıf yok · kaynakçada değil'}</span></div>
          <p className="thesis-source-entry">{entryText(source)}{source.entryOverride ? <em className="thesis-source-manual"> (elle düzenlendi)</em> : null}</p>
          <div className="thesis-source-actions">
            <button type="button" className="thesis-panel-link" onMouseDown={(event) => event.preventDefault()} onClick={() => { setCiting(citing === source.id ? null : source.id); setLocator(''); }}><Quote size={13}/> Atıf yap</button>
            <button type="button" className="thesis-panel-link" onClick={() => setEditing(editing === source.id ? null : source.id)}><Pencil size={13}/> Bilgiler</button>
            <button type="button" className="thesis-panel-link" onClick={() => { setManual(manual === source.id ? null : source.id); setManualText(entryText(source)); }}>Künyeyi elle düzenle</button>
            <button type="button" className="thesis-icon-button" aria-label={`${citationLabel(context, source.id, '')} kaynağını sil`} onClick={() => setRemoving(removing === source.id ? null : source.id)}><Trash2 size={14}/></button>
          </div>
          {citing === source.id && <form className="thesis-cite-form" onSubmit={(event) => { event.preventDefault(); if (canInsert && onCite(source.id, locator)) { setCiting(null); setLocator(''); } }}>
            <label>Sayfa (isteğe bağlı)<input aria-label="Atıf sayfası" placeholder="45 ya da 45-47" value={locator} onChange={(event) => setLocator(event.target.value)}/></label>
            <p className="thesis-cite-source">Metinde: <strong>{mode === 'footnote' ? `¹ — ${citationLabel(context, source.id, locator)}` : citationLabel(context, source.id, locator)}</strong></p>
            <p>{canInsert ? `Metinde koyu çizgiyle gösterilen yere (cümlenin sonuna, noktadan ${mode === 'footnote' ? 'sonra' : 'önce'}) eklenir. Yeri değiştirmek için metinde başka bir cümleye tıklayın.` : 'Önce metinde atıf yapacağınız cümleye tıklayın.'}</p>
            {!canInsert && <button type="button" className="thesis-panel-link" onClick={onPickPosition}>Metinde konum seç <ChevronRight size={13}/></button>}
            <button type="submit" className="thesis-primary-button" disabled={!canInsert}>Atfı ekle</button>
          </form>}
          {editing === source.id && <div className="thesis-heading-form"><SourceFields value={{ ...EMPTY, ...source }} onChange={(next) => onUpdate(source.id, next)}/><p>Değişiklik metindeki bütün atıflara ve kaynakçaya hemen yansır.</p></div>}
          {manual === source.id && <form className="thesis-heading-form" onSubmit={(event) => { event.preventDefault(); const text = manualText.trim(); onUpdate(source.id, { entryOverride: text && text !== formattedEntryText(context, source) ? text : '' }); setManual(null); }}>
            <label>Kaynakçadaki künye<textarea aria-label="Kaynakçadaki künye" rows={4} value={manualText} onChange={(event) => setManualText(event.target.value)}/></label>
            <p>Yalnız kaynakçadaki metin değişir; atıflarla bağı korunur, atıf silinirse künye de listeden çıkar. Kaynakça sayfasında bir künyeye çift tıklayarak da buraya gelebilirsiniz.</p>
            <div className="thesis-source-actions"><button type="submit" className="thesis-primary-button">Künyeyi kaydet</button>{source.entryOverride && <button type="button" className="thesis-panel-link" onClick={() => { onUpdate(source.id, { entryOverride: '' }); setManual(null); }}><RotateCcw size={13}/> Şablon biçimine dön</button>}<button type="button" className="thesis-panel-link" onClick={() => setManual(null)}>Vazgeç</button></div>
          </form>}
          {removing === source.id && <div className="thesis-inline-notice"><p>{count ? `Kaynak silinirse metindeki ${count} atfı da silinir ve kaynakçadan çıkar.` : 'Kaynak havuzdan silinsin mi?'}</p><button type="button" className="thesis-danger-button" onClick={() => { onRemove(source.id); setRemoving(null); setCiting(null); setManual(null); }}>Kaynağı sil</button><button type="button" className="thesis-panel-link" onClick={() => setRemoving(null)}>Vazgeç</button></div>}
        </li>;
      })}</ul>

      {legacy.length > 0 && <section className="thesis-source-legacy">
        <div className="thesis-panel-section-title"><h3>Bağlantısız eski kayıtlar · {legacy.length}</h3></div>
        <p className="thesis-panel-footnote">Bu satırlar atıflara bağlı değil; kaynakçada her zaman görünür. Havuza bağlayınca atıf yapılabilir ve eşitlemeye katılır (metni elle düzenlenmiş künye olarak korunur).</p>
        <ul className="thesis-source-list">{legacy.map((item) => <li key={item.index}><p>{item.text}</p><div className="thesis-source-actions"><button type="button" className="thesis-panel-link" onClick={() => onLinkLegacy(item.index)}><Link2 size={13}/> Havuza bağla</button><button type="button" className="thesis-icon-button" aria-label="Eski kaydı sil" onClick={() => onRemoveLegacy(item.index)}><Trash2 size={14}/></button></div></li>)}</ul>
      </section>}
      {authored.length > 0 && <p className="thesis-panel-footnote">Kaynakça sayfasına doğrudan yazılmış {authored.length} satır var; bunlar atıflarla eşleşmez. <button type="button" className="thesis-panel-link" onClick={() => onNavigate(bibliographyId)}>Sayfada gör</button></p>}
    </>}
  </>;
}
