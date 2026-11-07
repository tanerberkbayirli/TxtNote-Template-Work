import { useState } from 'react';
import { Check, ChevronRight, ListTree, Plus, Search, Sparkles, X } from 'lucide-react';
import { headingLabels, requiredHeadingChoices } from '../../lib/thesisWriting.js';

export default function ThesisNavigation({ sections = [], sectionGroups = [], headings = [], activeSectionId, template, panel = 'outline', hidden, ribbon = false, onPanelChange, onNavigate, onClose, onAddHeading, onDetails, onCheck, missingCount = 0 }) {
  const [query, setQuery] = useState('');
  const [adding, setAdding] = useState(false);
  const [heading, setHeading] = useState('');
  const [level, setLevel] = useState('1');
  const main = sections.find(section => section.type === 'mainContent');
  const [targetId, setTargetId] = useState('');
  const target = sections.find(section => section.id === targetId && section.editable) || main || sections.find(section => section.editable);
  const levels = Object.keys(target?.rules?.headings || template.typography?.headings || {});
  const effectiveLevel = levels.includes(level) ? level : levels[0] || '1';
  const suggested = requiredHeadingChoices(template, main?.id, main?.editableHtml);
  const normalize = text => text.toLocaleLowerCase('tr');
  const matches = text => normalize(text).includes(normalize(query.trim()));
  const toc = sections.find(section => section.type === 'tableOfContents');
  const planSections = sectionGroups.length ? sectionGroups.map(group => ({...(group.sections.find(section => section.editable) || group.sections[0]), title:group.sections[0].title, memberIds:group.sections.map(section => section.id)})) : sections.map(section => ({...section,memberIds:[section.id]}));
  const planRows = [
    ...planSections.map(section => ({ section, ...headings.find(item => item.kind === 'section' && item.sectionId === section.id) })),
    ...headings.filter(item => item.layoutId).map(item => ({ item, top: item.top, left: item.left })),
  ].sort((a, b) => (a.top ?? Number.MAX_SAFE_INTEGER) - (b.top ?? Number.MAX_SAFE_INTEGER) || (a.left || 0) - (b.left || 0));
  const submit = event => {
    event.preventDefault();
    if (!heading.trim() || !target) return;
    if (onAddHeading(target.id, Number(effectiveLevel), heading.trim())) { setHeading(''); setAdding(false); }
  };
  return <section hidden={hidden} className={`thesis-workspace-panel ${ribbon ? 'thesis-ribbon-workspace' : 'thesis-navigation'}`} aria-label="Tez çalışma paneli" data-workspace-panel={panel} data-thesis-editor-only="true">
    {!ribbon ? <><div className="thesis-workspace-heading"><div><span className="thesis-eyebrow">TEZ ÇALIŞMA ALANI</span><h2>Adım adım yazın</h2></div><button type="button" className="thesis-icon-button" aria-label="Çalışma panelini kapat" onClick={onClose}><X size={17}/></button></div>
    <nav className="thesis-workspace-tabs" aria-label="Çalışma panelleri">
      {[['outline', ListTree, 'Yazım planı']].map(([id, Icon, label]) => <button key={id} type="button" aria-current={panel === id ? 'page' : undefined} onClick={() => onPanelChange(id)}><Icon size={16} aria-hidden="true"/>{label}</button>)}
    </nav></> : null}
    <div className="thesis-workspace-content">
      {<>
        {missingCount > 0 && <button type="button" className="thesis-setup-card" onClick={onDetails}><span><strong>Tez bilgilerini tamamlayın</strong><small>{missingCount} bilgi eksik · Kapak ve ön sayfalar için</small></span><ChevronRight size={16}/></button>}
        <label className="thesis-panel-search"><Search size={15} aria-hidden="true"/><input aria-label="Bölüm veya başlık ara" placeholder="Bölüm veya başlık ara…" value={query} onChange={event => setQuery(event.target.value)}/></label>
        <div className="thesis-panel-section-title"><h3>Belge planı</h3><button type="button" className="thesis-panel-link" onClick={() => setAdding(value => !value)} aria-expanded={adding}><Plus size={14}/> Başlık ekle</button></div>
        {adding && <form className="thesis-heading-form" onSubmit={submit}>
          <label>Eklenecek bölüm<select aria-label="Başlığın ekleneceği bölüm" value={target?.id || ''} onChange={event => setTargetId(event.target.value)}>{sections.filter(section => section.editable && section.type !== 'bibliography').map(section => <option key={section.id} value={section.id}>{section.title}</option>)}</select></label>
          <label>Başlık düzeyi<select aria-label="Yeni başlığın düzeyi" value={effectiveLevel} onChange={event => setLevel(event.target.value)}>{levels.map(item => <option key={item} value={item}>Başlık {item} · {headingLabels[item]}</option>)}</select></label>
          <label>Başlık metni<input autoFocus aria-label="Yeni başlık metni" placeholder="Örn. Araştırmanın amacı" value={heading} onChange={event => setHeading(event.target.value)}/></label>
          <p>Seçtiğiniz bölümün sonuna eklenir. İçindekiler otomatik güncellenir.</p>
          <button type="submit" className="thesis-primary-button" disabled={!heading.trim() || !target}>Başlığı ekle</button>
        </form>}
        <ul className="thesis-plan-list">{planRows.map(row => {
          if (row.item) {
            const item = row.item;
            return matches(item.text) ? <li key={item.id}><button type="button" className="thesis-plan-section" data-writing-plan-layout-id={item.layoutId} onClick={() => onNavigate(item.sectionId, item.id, item.layoutId)} title={item.text}><span className="thesis-plan-dot" aria-hidden="true"/><span>{item.text}</span></button></li> : null;
          }
          const section = row.section;
          const children = headings.filter(item => !item.layoutId && item.kind !== 'section' && section.memberIds.includes(item.sectionId) && !item.unnumbered && matches(item.text));
          if (!matches(section.title) && !children.length) return null;
          const generated = section.mode === 'generated';
          const current = section.memberIds.includes(activeSectionId);
          return <li key={section.id}><button type="button" className={`thesis-plan-section ${current ? 'is-current' : ''}`} onClick={() => onNavigate(section.id)} aria-current={current ? 'location' : undefined}><span className={`thesis-plan-dot ${generated ? 'is-auto' : ''}`} aria-hidden="true"/><span>{section.title}</span>{generated ? <small>Otomatik</small> : section.mode === 'static' ? <small>Tez bilgileri</small> : null}</button>
            {children.length > 0 && <ul className="thesis-plan-headings">{children.map(item => <li key={item.id}><button type="button" className={`thesis-navigation-link thesis-heading-level-${item.level}`} data-writing-plan-layout-id={item.layoutId} onClick={() => onNavigate(item.sectionId, item.id, item.layoutId)} title={item.text}>{item.text}</button></li>)}</ul>}
          </li>;
        })}</ul>
        {query && !sections.some(section => matches(section.title)) && !headings.some(item => matches(item.text)) && <p className="thesis-panel-empty">Bu aramayla eşleşen başlık yok.</p>}
        {suggested.length > 0 && !query && <section className="thesis-required-headings"><h3>Şablondaki ana başlıklar</h3><p>Eksik başlıklar kılavuz sırasındaki yerine eklenir.</p>{suggested.map((item,index) => <div key={item.title}><span className={item.present ? 'is-present' : ''}>{item.present ? <Check size={14}/> : <span className="thesis-empty-check"/>}{item.title}</span>{!item.present && <button type="button" aria-label={`${item.title} başlığını ekle`} onClick={() => onAddHeading(main.id, item.level, item.title, {beforeTitles:suggested.slice(index+1).flatMap(next=>next.alternatives)})}><Plus size={14}/></button>}</div>)}</section>}
        <div className="thesis-info-card"><Sparkles size={17} aria-hidden="true"/><div><strong>İçindekiler kendiliğinden güncellenir</strong><p>Başlık metnini veya düzeyini değiştirmeniz yeterli.</p>{toc && <button type="button" onClick={() => onNavigate(toc.id)}>İçindekileri göster <ChevronRight size={13}/></button>}</div></div>
      </>}
    </div>
  </section>;
}
