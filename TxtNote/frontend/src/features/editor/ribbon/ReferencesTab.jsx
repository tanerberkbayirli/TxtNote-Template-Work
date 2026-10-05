import { BookOpen } from "lucide-react";
import Tool from "./Tool.jsx";
import Group from "./Group.jsx";
import { control } from "./shared.js";

export default function ReferencesTab({
  activeSection,
  canInsertInline = Boolean(activeSection),
  detailsOpen,
  setDetailsOpen,
  citableItems,
  onInsertCitation,
  citeText,
  setCiteText,
  citeOpen,
  setCiteOpen,
  navigationOpen,
  setNavigationOpen,
  footnoteText,
  setFootnoteText,
  remember,
  keep,
  submitCitation,
}) {
  return (
    <>
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
          </div>
        </form>
      </Group>
      <Group label="Kaynak atfı (dipnot)" className="thesis-home-group">
        <div className="thesis-home-rows">
          <div className="thesis-home-row is-boxed">
            <Tool label="Kaynak atfı ekle" disabled={!canInsertInline} pressed={citeOpen} onMouseDown={keep} onClick={() => setCiteOpen(!citeOpen)}>
              Atıf (dipnot)
            </Tool>
          </div>
          {citableItems.length ? (
            <select
              aria-label="Kaynakçadan atıf seç"
              className={`${control} thesis-wide-input`}
              disabled={!canInsertInline}
              defaultValue=""
              onMouseDown={remember}
              onChange={(event) => {
                const value = event.target.value;
                event.target.value = "";
                if (canInsertInline && value) onInsertCitation(value);
              }}
            >
              <option value="">Kaynakçadan seç</option>
              {citableItems.map((item, index) => (
                <option key={index} value={item}>
                  {item}
                </option>
              ))}
            </select>
          ) : (
            <span className="thesis-ribbon-hint">Kaynak eklemek için Tez bilgileri panelini açın.</span>
          )}
        </div>
      </Group>
      <Group label="Kaynakça araçları" className="thesis-home-group">
        <div className="thesis-home-rows">
          <div className="thesis-reference-summary">
            <BookOpen size={22} aria-hidden="true" />
            <div>
              <strong>{citableItems.length} kaynak</strong>
              <span>Kaynak atıfları dipnot olarak eklenir.</span>
            </div>
          </div>
          <div className="thesis-home-row is-boxed">
            <Tool label="Tez bilgileri" onMouseDown={keep} onClick={() => setDetailsOpen(!detailsOpen)} pressed={detailsOpen}>
              Kaynakçayı yönet
            </Tool>
            <Tool label="Bölüm gezintisini aç veya kapat" onClick={() => setNavigationOpen(!navigationOpen)} pressed={navigationOpen}>
              Başlıklara git
            </Tool>
          </div>
        </div>
      </Group>
      {citeOpen && (
        <form
          className="thesis-citation-popover"
          aria-label="Kaynak atfını dipnot olarak ekle"
          onSubmit={(event) => {
            event.preventDefault();
            if (canInsertInline && citeText.trim()) onInsertCitation(citeText.trim());
          }}
        >
          <input
            autoFocus
            className={control}
            aria-label="Kaynak atfı metni"
            placeholder="Atıf metni (dipnot)"
            value={citeText}
            onChange={(event) => setCiteText(event.target.value)}
            onFocus={remember}
            onKeyDown={(event) => {
              if (event.key === "Escape") setCiteOpen(false);
            }}
          />
          <Tool type="submit" label="Kaynak atfını dipnot olarak ekle" disabled={!canInsertInline || !citeText.trim()} onMouseDown={keep}>
            Ekle
          </Tool>
        </form>
      )}
    </>
  );
}
