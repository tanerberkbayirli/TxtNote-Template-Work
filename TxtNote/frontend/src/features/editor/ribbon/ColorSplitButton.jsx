import { useEffect, useState, useRef } from "react";
import { Highlighter } from "lucide-react";
import { tool } from "./shared.js";

export default function ColorSplitButton({ mode, activeFormat, remember, keep, invoke, disabled = false }) {
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [lastColor, setLastColor] = useState(mode === "color" ? "#be123c" : "#ffff00");
  const popoverRef = useRef(null);
  const anchorRef = useRef(null);
  const [anchor, setAnchor] = useState(null);
  const isColor = mode === "color";
  // The ribbon clips overflow, so the palette is positioned against the viewport and closes on any outside press.
  useEffect(() => {
    if (!popoverOpen) return undefined;
    const close = (event) => {
      if (!popoverRef.current?.contains(event.target) && !anchorRef.current?.contains(event.target))
        setPopoverOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [popoverOpen]);
  const current = isColor ? activeFormat?.color : activeFormat?.highlight;
  const hexValue = current?.startsWith("#")
    ? current
    : mode === "color"
      ? { black: "#000000", red: "#be123c", blue: "#0369a1", green: "#047857" }[current] || "#000000"
      : { yellow: "#ffff00", green: "#92d050", cyan: "#00b0f0", magenta: "#f5c8ee", none: "" }[current] || "";
  const displayHex =
    (isColor && activeFormat?.colorMixed) || (!isColor && activeFormat?.highlightMixed) ? undefined : hexValue;

  const standardColors = [
    "#c00000",
    "#ff0000",
    "#ffc000",
    "#ffff00",
    "#92d050",
    "#00b050",
    "#00b0f0",
    "#0070c0",
    "#002060",
    "#7030a0",
  ];
  const grayColors = ["#000000", "#404040", "#808080"];

  const applyColor = (value) => {
    invoke(isColor ? "applyTextColor" : "applyHighlight", value);
    setLastColor(value || (isColor ? "#be123c" : "#ffff00"));
    setPopoverOpen(false);
  };

  return (
    <div
      ref={anchorRef}
      style={{ position: "relative", display: "inline-flex", alignItems: "center", gap: "1px", height: "24px" }}
    >
      <button
        type="button"
        className={tool}
        aria-label={isColor ? "Yazı rengini uygula" : "Vurgu rengini uygula"}
        disabled={disabled}
        onMouseDown={keep}
        onClick={() => applyColor(lastColor)}
        title={isColor ? "Son kullanılan rengi uygula" : "Son kullanılan vurguyu uygula"}
        style={{ minWidth: "30px", position: "relative" }}
      >
        {isColor ? <span style={{ fontSize: "16px", fontWeight: "bold" }}>A</span> : <Highlighter size={15} />}
        <div
          style={{
            position: "absolute",
            bottom: "2px",
            left: "6px",
            right: "6px",
            height: "3px",
            background: displayHex || "transparent",
            borderRadius: "1px",
            border: displayHex ? "none" : "1px solid #d9e0e9",
          }}
        />
      </button>
      <button
        type="button"
        className={tool}
        aria-label="Renk seçenekleri"
        disabled={disabled}
        onMouseDown={keep}
        onClick={() => {
          const rect = anchorRef.current?.getBoundingClientRect();
          setAnchor(rect ? { top: rect.bottom + 4, left: rect.left } : null);
          setPopoverOpen(!popoverOpen);
        }}
        style={{ minWidth: "20px", padding: "3px 4px" }}
      >
        ▼
      </button>
      {popoverOpen && (
        <div
          ref={popoverRef}
          role="menu"
          style={{
            position: "fixed",
            top: anchor?.top ?? 0,
            left: anchor?.left ?? 0,
            background: "var(--bg-popover, #fff)",
            border: "1px solid var(--border-popover, #d7dee8)",
            borderRadius: "6px",
            padding: "8px",
            zIndex: 1000,
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
            minWidth: "280px",
          }}
          onKeyDown={(e) => e.key === "Escape" && setPopoverOpen(false)}
        >
          <div style={{ marginBottom: "8px" }}>
            <button
              type="button"
              role="menuitem"
              onMouseDown={keep}
              onClick={() => applyColor(isColor ? "black" : "none")}
              style={{
                display: "block",
                width: "100%",
                padding: "6px 8px",
                border: "1px solid var(--border-popover, #d7dee8)",
                borderRadius: "4px",
                background: "var(--bg-popover, #fff)",
                textAlign: "left",
                cursor: "pointer",
                fontSize: "12px",
              }}
            >
              {isColor ? "Otomatik (Siyah)" : "Renk yok"}
            </button>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(10, 1fr)", gap: "4px", marginBottom: "8px" }}>
            {standardColors.map((color) => (
              <button
                key={color}
                type="button"
                role="menuitem"
                onMouseDown={keep}
                onClick={() => applyColor(color)}
                aria-label={`Renk ${color}`}
                style={{
                  width: "20px",
                  height: "20px",
                  border: displayHex === color ? "2px solid #000" : "1px solid #ccc",
                  borderRadius: "3px",
                  background: color,
                  cursor: "pointer",
                }}
              />
            ))}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "4px", marginBottom: "8px" }}>
            {grayColors.map((color) => (
              <button
                key={color}
                type="button"
                role="menuitem"
                onMouseDown={keep}
                onClick={() => applyColor(color)}
                aria-label={`Renk ${color}`}
                style={{
                  width: "100%",
                  height: "20px",
                  border: displayHex === color ? "2px solid #000" : "1px solid #ccc",
                  borderRadius: "3px",
                  background: color,
                  cursor: "pointer",
                }}
              />
            ))}
          </div>
          <div style={{ display: "flex", gap: "4px", marginBottom: "8px" }}>
            <label style={{ flex: 1, display: "flex", alignItems: "center", gap: "4px", fontSize: "11px" }}>
              Diğer renkler…
              <input
                type="color"
                onMouseDown={keep}
                onChange={(e) => applyColor(e.target.value)}
                style={{ width: "20px", height: "20px", border: "1px solid #ccc", cursor: "pointer" }}
              />
            </label>
          </div>
        </div>
      )}
    </div>
  );
}
