import { useState } from 'react';
import { BookOpen, Check, ChevronRight, CircleHelp, ListTree, Plus, Search, Sparkles, X } from 'lucide-react';
import { headingLabels, requiredHeadingChoices } from '../../lib/thesisWriting.js';
import ThesisSources from './ThesisSources.jsx';

export default function ThesisNavigation({ sections = [], sectionGroups = [], headings = [], activeSectionId, template, panel = 'outline', hidden, onPanelChange, onNavigate, onClose, onAddHeading, onDetails, onCheck, missingCount = 0, sourcesProps }) {
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
  const submit = event => {
    event.preventDefault();
    if (!heading.trim() || !target) return;
    if (onAddHeading(target.id, Number(effectiveLevel), heading.trim())) { setHeading(''); setAdding(false); }
  };
  return <aside hidden={hidden} className="thesis-navigation thesis-workspace-panel" aria-label="Tez çalışma paneli" data-thesis-editor-only="true">
    <div className="thesis-workspace-heading"><div><span className="thesis-eyebrow">TEZ ÇALIŞMA ALANI</span><h2>Adım adım yazın</h2></div><button type="button" className="thesis-icon-button" aria-label="Çalışma panelini kapat" onClick={onClose}><X size={17}/></button></div>
    <nav className="thesis-workspace-tabs" aria-label="Çalışma panelleri">
      {[['outline', ListTree, 'Yazım planı'], ['sources', BookOpen, 'Kaynaklar'], ['guide', CircleHelp, 'Rehber']].map(([id, Icon, label]) => <button key={id} type="button" aria-current={panel === id ? 'page' : undefined} onClick={() => onPanelChange(id)}><Icon size={16} aria-hidden="true"/>{label}</button>)}
    </nav>
    <div className="thesis-workspace-content">
      <div hidden={panel !== 'sources'}><ThesisSources {...sourcesProps} onNavigate={onNavigate}/></div>
      {panel === 'sources' ? null : panel === 'guide' ? <>
        <div className="thesis-panel-intro"><span className="thesis-eyebrow">NEREDEN BAŞLAMALI?</span><h3>Biçime değil, tezinize odaklanın.</h3><p>Sayfa düzeni ve başlık biçimleri seçtiğiniz şablondan gelir.</p></div>
        <ol className="thesis-guide-steps">
          <li><b>1</b><div><strong>Tez bilgilerinizi tamamlayın</strong><p>Başlık, öğrenci ve danışman bilgileri kapaklara ve ilgili sayfalara yansır.</p><button type="button" onClick={onDetails}>Tez bilgilerini aç <ChevronRight size={13}/></button></div></li>
          <li><b>2</b><div><strong>Bölümlere geçip yazın</strong><p>Yazım planında bir bölüm seçin. Metninizi sayfa üzerinde düzenleyin.</p><button type="button" onClick={() => onPanelChange('outline')}>Yazım planına git <ChevronRight size={13}/></button></div></li>
          <li><b>3</b><div><strong>Başlık düzeylerini kullanın</strong><p>Ana bölüm için Başlık 1, alt başlık için Başlık 2 seçin. Numaraları başlığın içine yazmayın; şablon numaralandırır.</p></div></li>
          <li><b>4</b><div><strong>Kaynağı ekleyin, ardından atıf yapın</strong><p>Kaynaklar panelinde kaydı ekleyin. Metinde atıf yapılacak yere tıklayıp atfı yerleştirin.</p><button type="button" onClick={() => onPanelChange('sources')}>Kaynakları aç <ChevronRight size={13}/></button></div></li>
          <li><b>5</b><div><strong>Kontrol edip dışa aktarın</strong><p>Eksik bilgileri ve belge uyarılarını gözden geçirin. Word veya PDF çıktısını Dosya sekmesinden alın.</p><button type="button" onClick={onCheck}>Belgeyi kontrol et <ChevronRight size={13}/></button></div></li>
        </ol>
        <div className="thesis-info-card"><Sparkles size={17} aria-hidden="true"/><div><strong>İçindekiler otomatik hazırlanır</strong><p>Başlıkları metinde değiştirin. İçindekiler ve sayfa numaraları yerleşim tamamlandığında güncellenir.</p></div></div>
      </> : <>
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
        <ul className="thesis-plan-list">{planSections.map(section => {
          const children = headings.filter(item => section.memberIds.includes(item.sectionId) && !item.unnumbered && matches(item.text));
          if (!matches(section.title) && !children.length) return null;
          const generated = section.mode === 'generated';
          const current = section.memberIds.includes(activeSectionId);
          return <li key={section.id}><button type="button" className={`thesis-plan-section ${current ? 'is-current' : ''}`} onClick={() => onNavigate(section.id)} aria-current={current ? 'location' : undefined}><span className={`thesis-plan-dot ${generated ? 'is-auto' : ''}`} aria-hidden="true"/><span>{section.title}</span>{generated ? <small>Otomatik</small> : section.mode === 'static' ? <small>Tez bilgileri</small> : null}</button>
            {children.length > 0 && <ul className="thesis-plan-headings">{children.map(item => <li key={item.id}><button type="button" className={`thesis-navigation-link thesis-heading-level-${item.level}`} onClick={() => onNavigate(item.sectionId, item.id)} title={item.text}>{item.text}</button></li>)}</ul>}
          </li>;
        })}</ul>
        {query && !sections.some(section => matches(section.title)) && !headings.some(item => matches(item.text)) && <p className="thesis-panel-empty">Bu aramayla eşleşen başlık yok.</p>}
        {suggested.length > 0 && !query && <section className="thesis-required-headings"><h3>Şablondaki ana başlıklar</h3><p>Eksik başlıklar kılavuz sırasındaki yerine eklenir.</p>{suggested.map((item,index) => <div key={item.title}><span className={item.present ? 'is-present' : ''}>{item.present ? <Check size={14}/> : <span className="thesis-empty-check"/>}{item.title}</span>{!item.present && <button type="button" aria-label={`${item.title} başlığını ekle`} onClick={() => onAddHeading(main.id, item.level, item.title, {beforeTitles:suggested.slice(index+1).flatMap(next=>next.alternatives)})}><Plus size={14}/></button>}</div>)}</section>}
        <div className="thesis-info-card"><Sparkles size={17} aria-hidden="true"/><div><strong>İçindekiler kendiliğinden güncellenir</strong><p>Başlık metnini veya düzeyini değiştirmeniz yeterli.</p>{toc && <button type="button" onClick={() => onNavigate(toc.id)}>İçindekileri göster <ChevronRight size={13}/></button>}</div></div>
      </>}
    </div>
  </aside>;
}
