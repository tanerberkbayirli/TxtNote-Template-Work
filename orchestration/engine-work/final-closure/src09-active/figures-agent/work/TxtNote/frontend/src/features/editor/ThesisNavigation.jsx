export default function ThesisNavigation({ sections = [], headings = [], onNavigate, onClose }) {
  return <aside className="thesis-navigation" aria-label="Gezinti bölmesi" data-thesis-editor-only="true">
    <div className="thesis-navigation-heading"><h2>Gezinti</h2><button type="button" aria-label="Gezinti bölmesini kapat" onClick={onClose}>×</button></div>
    {headings.length > 0 && <section><h3>Başlıklar</h3><ul>{headings.map((item, index) => <li key={`${item.sectionId}-${item.id || index}`}><button type="button" className={`thesis-navigation-link thesis-heading-level-${item.level}`} onClick={() => onNavigate(item.sectionId, item.id)} title={item.text}>{item.text}</button></li>)}</ul></section>}
    <section><h3>Bölümler</h3><ul>{sections.map((item) => <li key={item.id}><button type="button" className="thesis-navigation-link" onClick={() => onNavigate(item.id)} title={item.title}>{item.title}</button></li>)}</ul></section>
  </aside>;
}
