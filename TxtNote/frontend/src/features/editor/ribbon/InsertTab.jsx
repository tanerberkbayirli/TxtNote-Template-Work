import { FilePlus2, Image as ImageIcon, Link2, Minus, SquareDashed, Table2 } from "lucide-react";
import Tool from "./Tool.jsx";
import Group from "./Group.jsx";
import { control } from "./shared.js";

export default function InsertTab({
  activeSection,
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
  return (
    <>
      <Group label="Sayfalar">
        <Tool
          label="Sayfa sonu ekle"
          disabled={!activeSection}
          onMouseDown={keep}
          onClick={() => invoke("insertPageBreak")}
        >
          <FilePlus2 size={16} /> Sayfa sonu
        </Tool>
        <select
          className={control}
          aria-label="Başlık ekle"
          disabled={!activeSection}
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
      </Group>
      <Group label="Tablo">
        <label className="thesis-ribbon-field">
          Satır{" "}
          <input
            aria-label="Tablo satır sayısı"
            type="number"
            min="1"
            max="30"
            value={tableRows}
            onChange={(e) => setTableRows(e.target.value)}
            onBlur={handleTableRowsBlur}
            onKeyDown={handleTableRowsKeyDown}
          />
        </label>
        <label className="thesis-ribbon-field">
          Sütun{" "}
          <input
            aria-label="Tablo sütun sayısı"
            type="number"
            min="1"
            max="12"
            value={tableCols}
            onChange={(e) => setTableCols(e.target.value)}
            onBlur={handleTableColsBlur}
            onKeyDown={handleTableColsKeyDown}
          />
        </label>
        <input
          className={control}
          aria-label="Tablo başlığı"
          placeholder="Tablo başlığı (isteğe bağlı)"
          value={tableCaption}
          onChange={(event) => setTableCaption(event.target.value)}
        />
        <Tool
          label="Tablo"
          disabled={!activeSection}
          onMouseDown={keep}
          onClick={() => {
            invoke("insertTable", clampInt(tableRows, 1, 30, 3), clampInt(tableCols, 1, 12, 3), tableCaption);
            setTableCaption("");
          }}
        >
          <Table2 size={16} /> Tablo
        </Tool>
      </Group>
      <Group label="Medya">
        <Tool label="Görsel" onMouseDown={keep} onClick={() => onImage("")}>
          <ImageIcon size={16} /> Görsel
        </Tool>
        {captionKinds.map(([id, rule]) => (
          <Tool key={id} label={`${rule.label} ekle`} onMouseDown={keep} onClick={() => onImage(id)}>
            {rule.label}
          </Tool>
        ))}
        {captionKinds.length ? (
          <select
            aria-label="Görsel türü"
            className={control}
            disabled={!pickedFigure?.isConnected}
            defaultValue=""
            onMouseDown={remember}
            onChange={(event) => onFigureKind?.(event.target.value)}
          >
            <option value="">Görsel türünü seç</option>
            {captionKinds.map(([id, rule]) => (
              <option key={id} value={id}>
                {rule.label}
              </option>
            ))}
          </select>
        ) : null}
      </Group>
      <Group label="Bağlantı">
        <form
          onSubmit={(event) => {
            event.preventDefault();
            invoke("insertLink", linkHref, linkText);
            setLinkHref("");
            setLinkText("");
          }}
        >
          <input
            className={control}
            aria-label="Bağlantı adresi"
            placeholder="https://adres"
            value={linkHref}
            onChange={(event) => setLinkHref(event.target.value)}
            onMouseDown={remember}
            onFocus={(event) => {
              const selected = window.getSelection()?.toString();
              if (!linkText.trim() && selected) setLinkText(selected);
              remember(event);
            }}
          />
          <input
            className={control}
            aria-label="Bağlantı metni"
            placeholder="Bağlantı metni"
            value={linkText}
            onChange={(event) => setLinkText(event.target.value)}
            onMouseDown={remember}
            onFocus={remember}
          />
          {linkHref.trim() && !/^(https?:\/\/|mailto:)/i.test(linkHref) && (
            <span className="thesis-ribbon-hint">Adres http://, https:// veya mailto: ile başlamalı</span>
          )}
          <Tool
            type="submit"
            label="Bağlantı ekle"
            disabled={!activeSection || !linkHref.trim() || !/^(https?:\/\/|mailto:)/i.test(linkHref)}
            onMouseDown={keep}
          >
            <Link2 size={16} /> Bağlantı ekle
          </Tool>
        </form>
      </Group>
      {template.equations ? (
        <Group label="Denklem">
          <Tool
            label="Blok denklem ekle"
            disabled={!activeSection}
            onMouseDown={keep}
            onClick={() => invoke("insertFormula", true, true)}
          >
            ∑ Denklem
          </Tool>
          <Tool
            label="Denklem numarasını aç veya kapat"
            disabled={!pickedEquation?.isConnected}
            onClick={onEquationNumber}
          >
            Denklem no
          </Tool>
        </Group>
      ) : null}
      <Group label="Sayfa öğeleri">
        <Tool label="Metin çerçevesi ekle" onClick={() => onAddFrame("text")}>
          <SquareDashed size={16} /> Metin çerçevesi
        </Tool>
        <Tool label="Çizgi ekle" onClick={() => onAddFrame("separator")}>
          <Minus size={16} /> Çizgi
        </Tool>
      </Group>
    </>
  );
}
