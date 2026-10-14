import { useState } from "react";
import { ChevronDown, Highlighter } from "lucide-react";
import FloatingMenu from "./FloatingMenu.jsx";
import { FORMAT_COLORS, FORMAT_HIGHLIGHTS, normalizeHex } from "../../../config/format.js";
import { tool } from "./shared.js";

const standardColors = ["#c00000", "#ff0000", "#ffc000", "#ffff00", "#92d050", "#00b050", "#00b0f0", "#0070c0", "#002060", "#7030a0"];
const grayColors = ["#000000", "#404040", "#595959", "#808080", "#a6a6a6", "#d9d9d9", "#ffffff"];
const namedColor = Object.fromEntries(FORMAT_COLORS.map(({ id, swatch }) => [id, swatch]));
const namedHighlight = Object.fromEntries(FORMAT_HIGHLIGHTS.map(({ id, swatch }) => [id, swatch]));
namedHighlight.none = "";

function ColorSwatch({ color, value = color, activeHex, keep, apply }) {
  return (
    <button
      type="button"
      role="menuitem"
      className={`thesis-swatch ${activeHex.toLowerCase() === color.toLowerCase() ? "is-active" : ""}`}
      style={{ background: color }}
      aria-label={`Renk ${color}`}
      title={color}
      onMouseDown={keep}
      onClick={() => apply(value)}
    />
  );
}

export default function ColorSplitButton({ mode, activeFormat, remember, keep, invoke, disabled = false, disabledReason = "" }) {
  const isColor = mode === "color";
  const [lastColor, setLastColor] = useState(isColor ? "red" : "yellow");
  const current = isColor ? activeFormat?.color : activeFormat?.highlight;
  const hex = current?.startsWith("#") ? current : (isColor ? namedColor : namedHighlight)[current] || "";
  const lastHex = lastColor?.startsWith("#") ? lastColor : (isColor ? namedColor : namedHighlight)[lastColor] || "";
  const swatch = lastHex || (isColor ? "#000000" : "transparent");

  const apply = (value) => {
    invoke(isColor ? "applyTextColor" : "applyHighlight", value);
    setLastColor(value || (isColor ? "black" : "none"));
  };
  const [hexDraft, setHexDraft] = useState(null);
  const hexShown = hexDraft ?? (hex || "").toUpperCase();
  const hexValid = normalizeHex(hexShown.startsWith("#") ? hexShown : `#${hexShown}`);
  return (
    <FloatingMenu
      className="thesis-color-split"
      disabled={disabled}
      trigger={({ toggle }) => (
        <>
          <button
            type="button"
            className={`${tool} thesis-color-main`}
            aria-label={isColor ? "Yazı rengi" : "Vurgu rengi"}
            title={disabledReason || (isColor ? "Yazı rengi (son seçilen rengi uygular)" : "Vurgu rengi (son seçilen vurguyu uygular)")}
            disabled={disabled}
            onMouseDown={keep}
            onClick={() => apply(lastColor)}
          >
            {isColor ? <span className="thesis-color-letter">A</span> : <Highlighter size={15} aria-hidden="true" />}
            <i className={`thesis-color-bar ${!swatch || swatch === "transparent" ? "is-none" : ""}`} style={{ background: swatch }} />
          </button>
          <button
            type="button"
            className={`${tool} thesis-color-caret`}
            aria-label={disabledReason || (isColor ? "Yazı rengi seçenekleri" : "Vurgu rengi seçenekleri")}
            title={disabledReason || undefined}
            disabled={disabled}
            onMouseDown={keep}
            onClick={toggle}
          >
            <ChevronDown size={12} aria-hidden="true" />
          </button>
        </>
      )}
    >
      {(close) => (
        <div className="thesis-palette" onClick={(event) => event.target.closest(".thesis-swatch,.thesis-palette-auto") && close()}>
          <button type="button" role="menuitem" className="thesis-menu-item thesis-palette-auto" onMouseDown={keep} onClick={() => apply(isColor ? "black" : "none")}>
            {isColor ? "Otomatik (siyah)" : "Vurgu yok"}
          </button>
          <div className="thesis-palette-label">{isColor ? "Belge renkleri" : "Vurgu renkleri"}</div>
          <div className="thesis-swatch-row">
            {(isColor ? FORMAT_COLORS : FORMAT_HIGHLIGHTS).map(({ id, swatch }) => <ColorSwatch key={id} color={swatch} value={id} activeHex={hex} keep={keep} apply={apply} />)}
          </div>
          <div className="thesis-palette-label">Gri tonlar</div>
          <div className="thesis-swatch-row">{grayColors.map((c) => <ColorSwatch key={c} color={c} activeHex={hex} keep={keep} apply={apply} />)}</div>
          <div className="thesis-palette-label">Standart renkler</div>
          <div className="thesis-swatch-row">{standardColors.map((c) => <ColorSwatch key={c} color={c} activeHex={hex} keep={keep} apply={apply} />)}</div>
          <form
            className="thesis-hex-row"
            onSubmit={(event) => {
              event.preventDefault();
              if (!hexValid) return;
              apply(hexValid);
              setHexDraft(null);
              close();
            }}
          >
            <i className="thesis-hex-preview" style={{ background: hexValid || "transparent" }} />
            <input
              type="text"
              className="thesis-hex-input"
              aria-label="HEX renk kodu"
              aria-invalid={hexShown !== "" && !hexValid}
              placeholder="#000000"
              maxLength={7}
              spellCheck={false}
              value={hexShown}
              onMouseDown={remember}
              onFocus={(event) => { remember(event); event.target.select(); }}
              onChange={(event) => setHexDraft(event.target.value.toUpperCase())}
            />
            <button type="submit" className="thesis-hex-apply" disabled={!hexValid} onMouseDown={keep}>Uygula</button>
          </form>
          <label className="thesis-menu-item thesis-palette-custom">
            Diğer renkler…
            <input type="color" value={hex.startsWith("#") && hex.length === 7 ? hex : "#000000"} onMouseDown={remember} onFocus={remember} onChange={(event) => apply(event.target.value)} />
          </label>
        </div>
      )}
    </FloatingMenu>
  );
}
