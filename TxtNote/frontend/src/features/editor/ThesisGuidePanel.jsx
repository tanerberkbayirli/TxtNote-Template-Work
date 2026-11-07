import { useMemo, useRef } from "react";
import { BookOpen, FileText, X } from "lucide-react";
import { buildTemplateRules } from "../../lib/templateRulesGuide.js";
import AppGuideModal from "./AppGuideModal.jsx";

function RulesSection({ section, defaultOpen }) {
  return <details className="thesis-guide-section" open={defaultOpen} data-guide-section={section.id}>
    <summary>{section.title}</summary>
    {section.items.length ? <dl className="thesis-guide-items">{section.items.map((entry, index) => <div key={`${entry.label}:${index}`} className={entry.known ? "" : "is-unknown"}><dt>{entry.label}</dt><dd>{entry.value}{entry.source ? <span className="thesis-guide-rule-source"> · {entry.source.url ? <a href={entry.source.url} target="_blank" rel="noopener noreferrer">Kaynak</a> : <span>Kaynak</span>}<small>{entry.source.name}, {entry.source.location}; doğrulama {entry.source.checkedAt}</small></span> : null}</dd></div>)}</dl> : null}
    {section.note ? <p className="thesis-guide-note">{section.note}</p> : null}
    {section.documents?.length ? <ul className="thesis-guide-sources" aria-label="Kaynak belgeler">{section.documents.map((doc) => <li key={doc.key}>
      <span>{doc.label}</span>
      {doc.url ? <a href={doc.url} target="_blank" rel="noopener noreferrer">Kaynak</a> : <small>Bağlantı kayıtlı değil</small>}
      {doc.path || doc.sha256 || doc.revisionDate ? <details><summary>Teknik kanıt</summary><dl>{doc.revisionDate ? <><dt>Belge tarihi</dt><dd>{String(doc.revisionDate).slice(0, 10)}</dd></> : null}{doc.path ? <><dt>Depo yolu</dt><dd>{doc.path}</dd></> : null}{doc.sha256 ? <><dt>SHA-256</dt><dd>{doc.sha256}</dd></> : null}</dl></details> : null}
    </li>)}</ul> : null}
  </details>;
}

/** Sağ sütundaki Rehber: "Uygulama rehberi" (ortak modal) ve "Bu şablonun yazım kuralları" (panel içinde). */
export default function ThesisGuidePanel({ template, view, onView, onClose }) {
  const rules = useMemo(() => buildTemplateRules(template), [template]);
  const appButtonRef = useRef(null);
  const appOpen = view === "app";
  return <section className="thesis-guide-panel" aria-label="Rehber" data-thesis-editor-only="true" data-guide-view={view}>
    <header><h3>Rehber</h3><button type="button" className="thesis-guide-close" aria-label="Rehberi kapat" onClick={onClose}><X size={16} aria-hidden="true" /></button></header>
    <div className="thesis-guide-choices" role="group" aria-label="Rehber türü">
      <button ref={appButtonRef} type="button" aria-pressed={appOpen} aria-haspopup="dialog" onClick={() => onView("app")}><BookOpen size={15} aria-hidden="true" /><span><strong>Uygulama rehberi</strong><small>Ortak kullanım adımları</small></span></button>
      <button type="button" aria-pressed={!appOpen} onClick={() => onView("template")}><FileText size={15} aria-hidden="true" /><span><strong>Bu şablonun yazım kuralları</strong><small>Seçili şablona özel</small></span></button>
    </div>
    {rules ? <div className="thesis-guide-rules-view" key={rules.id} data-guide-template-id={rules.id}>
      <div className="thesis-guide-identity"><strong>{rules.identity.university || rules.identity.title}</strong><span>{[rules.identity.institute, rules.identity.degree, rules.identity.language].filter(Boolean).join(" · ")}</span></div>
      <p className={`thesis-guide-status is-${rules.status.level}`}><b>{rules.status.label}.</b> {rules.status.detail}</p>
      {rules.sections.map((section, index) => <RulesSection key={section.id} section={section} defaultOpen={index === 0} />)}
    </div> : null}
    {appOpen ? <AppGuideModal returnFocusRef={appButtonRef} onClose={() => onView("template")} /> : null}
  </section>;
}
