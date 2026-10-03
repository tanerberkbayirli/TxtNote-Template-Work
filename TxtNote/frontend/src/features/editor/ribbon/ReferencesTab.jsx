import { BookOpen } from "lucide-react";
import Tool from "./Tool.jsx";
import Group from "./Group.jsx";
import { control } from "./shared.js";

export default function ReferencesTab({
  activeSection,
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
      <Group label="Dipnotlar">
        <form className="thesis-inline-form" onSubmit={submitCitation}>
          <input
            className={control}
            aria-label="Dipnot metni"
            placeholder="Dipnot metni"
            value={footnoteText}
            onChange={(event) => setFootnoteText(event.target.value)}
            onMouseDown={remember}
            onFocus={remember}
          />
          <Tool type="submit" label="Dipnot ekle" disabled={!activeSection || !footnoteText.trim()} onMouseDown={keep}>
            Ekle
          </Tool>
        </form>
      </Group>
      <Group label="Kaynakça">
        <Tool
          label="Atıf"
          disabled={!activeSection}
          pressed={citeOpen}
          onMouseDown={keep}
          onClick={() => setCiteOpen(!citeOpen)}
        >
          Atıf
        </Tool>
        {citableItems.length ? (
          <select
            aria-label="Kaynakçadan atıf seç"
            className={control}
            defaultValue=""
            onMouseDown={remember}
            onChange={(event) => {
              const value = event.target.value;
              event.target.value = "";
              if (value) onInsertCitation(value);
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
      </Group>
      <Group label="Kaynakça araçları" className="thesis-ribbon-reference-tools">
        <div className="thesis-reference-summary">
          <BookOpen size={22} />
          <div>
            <strong>{citableItems.length} kaynak kullanılabilir</strong>
            <span>Atıflar belge içeriğine eklenir.</span>
          </div>
        </div>
        <Tool label="Tez bilgileri" onMouseDown={keep} onClick={() => setDetailsOpen(!detailsOpen)}>
          Kaynakça bilgilerini yönet
        </Tool>
        <Tool
          label="Bölüm gezintisini aç veya kapat"
          onClick={() => setNavigationOpen(!navigationOpen)}
          pressed={navigationOpen}
        >
          Başlıklara git
        </Tool>
      </Group>
      {citeOpen && (
        <form
          className="thesis-citation-popover"
          aria-label="Atıf ekle"
          onSubmit={(event) => {
            event.preventDefault();
            onInsertCitation(citeText);
          }}
        >
          <input
            autoFocus
            className={control}
            aria-label="Atıf veya dipnot metni"
            placeholder="Atıf metni"
            value={citeText}
            onChange={(event) => setCiteText(event.target.value)}
            onFocus={remember}
            onKeyDown={(event) => {
              if (event.key === "Escape") setCiteOpen(false);
            }}
          />
          <Tool type="submit" label="Atıf ekle" disabled={!citeText.trim()} onMouseDown={keep}>
            Ekle
          </Tool>
        </form>
      )}
    </>
  );
}
