import { FilePlus2, Image as ImageIcon, Link2, Minus, SquareDashed, Table2 } from "lucide-react";
import Tool from "./Tool.jsx";
import Group from "./Group.jsx";
import { control } from "./shared.js";

export default function InsertTab({
  activeSection,
  canInsertInline = Boolean(activeSection),
  template,
  onImage,
  captionKinds,
  pickedFigure,
  onFigureKind,
  pickedEquation,
  onEquationNumber,
  onAddFrame,
  tableRows,
  setTableRows,
  tableCols,
  setTableCols,
  clampInt,
  handleTableRowsBlur,
  handleTableRowsKeyDown,
  handleTableColsBlur,
  handleTableColsKeyDown,
  tableCaption,
  setTableCaption,
  linkHref,
  setLinkHref,
  linkText,
  setLinkText,
  remember,
  keep,
  invoke,
  headingOptions,
}) {
  const off = !canInsertInline;
  const normalizedLink = normalizeLink(linkHref);
  const linkOk = Boolean(normalizedLink);
  const safeTableSize = (value, min, max, fallback) => Math.trunc(clampInt(value, min, max, fallback));
  return (
    <>
      <Group label="Sayfalar" className="thesis-home-group">
        <div className="thesis-home-rows">
          <Tool label="Sayfa sonu ekle" disabled={off} onMouseDown={keep} onClick={() => invoke("insertPageBreak")}>
            <FilePlus2 size={15} aria-hidden="true" /> Sayfa sonu
          </Tool>
          <select
            className={control}
            aria-label="Başlık ekle"
            disabled={off}
            defaultValue=""
            onMouseDown={remember}
            onChange={(event) => {
              const level = event.target.value;
              if (level) invoke("insertHeading", Number(level));
              event.target.value = "";
            }}
          >
            <option value="" disabled>
              Başlık ekle
            </option>
            {headingOptions.map((level) => (
              <option key={level} value={level}>
                Başlık {level}
              </option>
            ))}
          </select>
        </div>
      </Group>
      <Group label="Tablo" className="thesis-home-group">
        <div className="thesis-home-rows">
          <div className="thesis-home-row">
            <label className="thesis-ribbon-field">
              Satır
              <input aria-label="Tablo satır sayısı" type="number" min="1" max="30" disabled={off} value={tableRows} onChange={(e) => setTableRows(e.target.value)} onMouseDown={remember} onFocus={remember} onBlur={handleTableRowsBlur} onKeyDown={handleTableRowsKeyDown} />
            </label>
            <label className="thesis-ribbon-field">
              Sütun
              <input aria-label="Tablo sütun sayısı" type="number" min="1" max="12" disabled={off} value={tableCols} onChange={(e) => setTableCols(e.target.value)} onMouseDown={remember} onFocus={remember} onBlur={handleTableColsBlur} onKeyDown={handleTableColsKeyDown} />
            </label>
            <div className="thesis-home-row is-boxed">
              <Tool
                label="Tablo"
                disabled={off}
                onMouseDown={keep}
                onClick={() => {
                  invoke("insertTable", safeTableSize(tableRows, 1, 30, 3), safeTableSize(tableCols, 1, 12, 3), tableCaption);
                  setTableCaption("");
                }}
              >
                <Table2 size={15} aria-hidden="true" /> Tablo
              </Tool>
            </div>
          </div>
          <input className={`${control} thesis-wide-input`} aria-label="Tablo başlığı" placeholder="Tablo başlığı (isteğe bağlı)" disabled={off} value={tableCaption} onChange={(event) => setTableCaption(event.target.value)} onMouseDown={remember} onFocus={remember} />
        </div>
      </Group>
      <Group label="Medya" className="thesis-home-group">
        <div className="thesis-home-rows">
          <div className="thesis-home-row is-boxed">
            <Tool label="Görsel" onMouseDown={keep} onClick={() => onImage("")}>
              <ImageIcon size={15} aria-hidden="true" /> Görsel
            </Tool>
            {captionKinds.map(([id, rule]) => (
              <Tool key={id} label={`${rule.label} ekle`} onMouseDown={keep} onClick={() => onImage(id)}>
                {rule.label}
              </Tool>
            ))}
          </div>
          {captionKinds.length ? (
            <select aria-label="Görsel türü" className={control} disabled={!pickedFigure?.isConnected} defaultValue="" onMouseDown={remember} onChange={(event) => onFigureKind?.(event.target.value)}>
              <option value="">Seçili görselin türü</option>
              {captionKinds.map(([id, rule]) => (
                <option key={id} value={id}>
                  {rule.label}
                </option>
              ))}
            </select>
          ) : null}
        </div>
      </Group>
      <Group label="Bağlantı" className="thesis-home-group">
        <form
          className="thesis-home-rows"
          onSubmit={(event) => {
            event.preventDefault();
            if (off || !linkOk) return;
            invoke("insertLink", normalizedLink, linkText);
            setLinkHref("");
            setLinkText("");
          }}
        >
          <div className="thesis-home-row">
            <input
              className={control}
              aria-label="Bağlantı adresi"
              disabled={off}
              placeholder="https://adres"
              aria-invalid={Boolean(linkHref.trim()) && !linkOk}
              value={linkHref}
              onChange={(event) => setLinkHref(event.target.value)}
              onMouseDown={remember}
              onFocus={(event) => {
                const selected = window.getSelection()?.toString();
                if (!linkText.trim() && selected) setLinkText(selected);
                remember(event);
              }}
            />
            <input className={control} aria-label="Bağlantı metni" placeholder="Bağlantı metni" disabled={off} value={linkText} onChange={(event) => setLinkText(event.target.value)} onMouseDown={remember} onFocus={remember} />
          </div>
          <div className="thesis-home-row is-boxed">
            <Tool type="submit" label="Bağlantı ekle" disabled={off || !linkOk} onMouseDown={keep}>
              <Link2 size={15} aria-hidden="true" /> Bağlantı ekle
            </Tool>
            {linkHref.trim() && !linkOk && <span className="thesis-ribbon-hint">Geçerli bir bağlantı adresi girin</span>}
          </div>
        </form>
      </Group>
      {template.equations ? (
        <Group label="Denklem" className="thesis-home-group">
          <div className="thesis-home-rows">
            <Tool label="Blok denklem ekle" disabled={off} onMouseDown={keep} onClick={() => invoke("insertFormula", true, true)}>
              ∑ Denklem
            </Tool>
            <Tool label="Denklem numarasını aç veya kapat" disabled={!pickedEquation?.isConnected} onMouseDown={keep} onClick={onEquationNumber}>
              Denklem no
            </Tool>
          </div>
        </Group>
      ) : null}
      <Group label="Sayfa öğeleri" className="thesis-home-group">
        <div className="thesis-home-rows">
          <Tool label="Metin çerçevesi ekle" onMouseDown={keep} onClick={() => onAddFrame("text")}>
            <SquareDashed size={15} aria-hidden="true" /> Metin çerçevesi
          </Tool>
          <Tool label="Çizgi ekle" onMouseDown={keep} onClick={() => onAddFrame("separator")}>
            <Minus size={15} aria-hidden="true" /> Çizgi
          </Tool>
        </div>
      </Group>
    </>
  );
}

function normalizeLink(value) {
  const raw = String(value ?? "").trim();
  if (!raw || /[\s\u0000-\u001f]/.test(raw)) return "";
  const href = /^(https?:|mailto:)/i.test(raw) ? raw : raw.startsWith("//") ? `https:${raw}` : `https://${raw}`;
  try {
    const parsed = new URL(href);
    if (parsed.protocol === "mailto:") return parsed.pathname.includes("@") ? href : "";
    if ((parsed.protocol === "https:" || parsed.protocol === "http:") && parsed.hostname) return href;
  } catch { /* malformed or unsupported address */ }
  return "";
}
