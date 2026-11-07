import { BookOpen, ListTree, ClipboardCheck, Sparkles } from "lucide-react";
import Tool from "./Tool.jsx";
import Group from "./Group.jsx";
import { control } from "./shared.js";
import { CITATION_MODE_LABELS } from "../../../../../../engine/src/citations.js";

export default function ReferencesTab({
  activeSection,
  canInsertInline = Boolean(activeSection),
  citableItems,
  onInsertCitation,
  onInsertEndnote,
  navigationOpen,
  setNavigationOpen,
  footnoteText,
  setFootnoteText,
  remember,
  keep,
  onManageSources,
  onCheckDocument,
  citationMode = "parenthetical",
  citationModes = ["footnote", "parenthetical"],
  onCitationModeChange,
}) {
  return (
    <>
      <Group label="Kaynakça ve atıflar" className="thesis-home-group">
        <div className="thesis-home-rows">
          <div className="thesis-reference-summary"><BookOpen size={22} aria-hidden="true"/><div><strong>{citableItems.length} kaynak</strong><span>Kaynakça atıflardan otomatik oluşur</span></div></div>
          <div className="thesis-home-row">
            <div className="thesis-home-row is-boxed" role="group" aria-label="Atıf biçimi">
              {citationModes.map((mode) => (
                <Tool key={mode} label={`Atıf biçimi: ${CITATION_MODE_LABELS[mode]}`} pressed={citationMode === mode} onMouseDown={keep} onClick={() => onCitationModeChange?.(mode)}>
                  {mode === "footnote" ? "Dipnotlu" : mode === "numeric" ? "Numaralı" : "Parantezli"}
                </Tool>
              ))}
            </div>
            <Tool label="Kaynakları ve atıfları yönet" onMouseDown={keep} onClick={onManageSources}>Kaynak ekle / Atıf yap</Tool>
          </div>
        </div>
      </Group>
      <Group label="Dipnotlar" className="thesis-home-group">
        <form className="thesis-home-rows" onSubmit={(event) => {
          event.preventDefault();
          const text = footnoteText.trim();
          if (!canInsertInline || !text) return;
          onInsertCitation(text);
          setFootnoteText("");
        }}>
          <input className={`${control} thesis-wide-input`} aria-label="Dipnot metni" placeholder="Dipnot metni" value={footnoteText} onChange={(event) => setFootnoteText(event.target.value)} onMouseDown={remember} onFocus={remember} />
          <div className="thesis-home-row is-boxed">
            <Tool type="submit" label="Dipnot ekle" disabled={!canInsertInline || !footnoteText.trim()} onMouseDown={keep}>
              Dipnot ekle
            </Tool>
            <Tool label="Sonnot ekle" disabled={!canInsertInline || !footnoteText.trim()} onMouseDown={keep} onClick={() => { const text = footnoteText.trim(); if (!canInsertInline || !text) return; onInsertEndnote?.(text); setFootnoteText(""); }}>
              Sonnot ekle
            </Tool>
          </div>
        </form>
      </Group>
      <Group label="İçindekiler ve başlıklar" className="thesis-home-group">
        <div className="thesis-home-rows">
          <div className="thesis-reference-summary">
            <Sparkles size={22} aria-hidden="true" />
            <div>
              <strong>İçindekiler otomatik güncellenir</strong>
              <span>Başlıkları metin içinde düzenleyin.</span>
            </div>
          </div>
          <div className="thesis-home-row is-boxed">
            <Tool label="Bölüm gezintisini aç veya kapat" onClick={() => setNavigationOpen(!navigationOpen)} pressed={navigationOpen}>
              <ListTree size={15} aria-hidden="true"/> Yazım planı
            </Tool>
            <Tool label="Belgeyi kontrol et" onClick={onCheckDocument}><ClipboardCheck size={15} aria-hidden="true"/> Kontrol et</Tool>
          </div>
        </div>
      </Group>
    </>
  );
}
