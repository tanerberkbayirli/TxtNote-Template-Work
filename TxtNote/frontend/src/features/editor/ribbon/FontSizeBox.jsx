import { useState, useRef } from "react";
import { control, fontSizePresets } from "./shared.js";

export default function FontSizeBox({ activeFormat, remember, keep, invoke, disabled = false }) {
  const [draft, setDraft] = useState("");
  const [editing, setEditing] = useState(false);
  const [invalid, setInvalid] = useState(false);
  const inputRef = useRef(null);
  const currentSizePt = activeFormat?.sizePt ?? activeFormat?.sizeComputedPt;
  const displaySize = editing ? draft : currentSizePt ? String(currentSizePt) : activeFormat?.sizeMixed ? "" : "";

  const parseSize = (str) => {
    const normalized = str.replace(",", ".");
    const num = parseFloat(normalized);
    return isNaN(num) ? null : Math.max(1, Math.min(400, Math.round(num * 2) / 2));
  };

  const applySize = (size) => {
    if (size !== currentSizePt) invoke("applySize", size);
    setEditing(false);
    setInvalid(false);
  };

  const handleChange = (e) => setDraft(e.target.value);

  const handleBlur = () => {
    const size = parseSize(draft);
    if (size !== null) {
      applySize(size);
    } else {
      setInvalid(true);
      setDraft("");
      setEditing(false);
      setTimeout(() => setInvalid(false), 1500);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const size = parseSize(draft);
      if (size !== null) {
        applySize(size);
      } else {
        setInvalid(true);
        setTimeout(() => setInvalid(false), 1500);
      }
    } else if (e.key === "Escape") {
      setDraft("");
      setEditing(false);
      setInvalid(false);
    }
  };

  return (
    <div style={{ position: "relative", display: "inline-block" }}>
      <input
        ref={inputRef}
        type="text"
        className={control}
        aria-label="Yazı boyutu"
        aria-invalid={invalid}
        placeholder="Boyut"
        value={displaySize}
        disabled={disabled}
        onMouseDown={(e) => {
          remember(e);
          setEditing(true);
          setDraft(displaySize);
        }}
        onFocus={() => {
          setEditing(true);
          setDraft(displaySize);
        }}
        onChange={handleChange}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        style={{ width: "64px", paddingRight: "22px" }}
      />
      <button
        type="button"
        aria-label="Boyut önayarları"
        disabled={disabled}
        onMouseDown={(e) => {
          e.preventDefault();
          keep(e);
        }}
        onClick={(e) => {
          e.preventDefault();
          const menu = e.currentTarget.nextElementSibling;
          menu.style.display = menu.style.display === "block" ? "none" : "block";
        }}
        style={{
          position: "absolute",
          right: "2px",
          top: "50%",
          transform: "translateY(-50%)",
          background: "none",
          border: "none",
          cursor: "pointer",
          padding: "4px",
          fontSize: "12px",
        }}
      >
        ▼
      </button>
      <div
        style={{
          display: "none",
          position: "absolute",
          top: "100%",
          left: 0,
          background: "white",
          border: "1px solid #ccc",
          borderRadius: "4px",
          maxHeight: "200px",
          overflowY: "auto",
          zIndex: 1000,
          minWidth: "60px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
        }}
      >
        {fontSizePresets.map((size) => (
          <button
            key={size}
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              keep(e);
            }}
            onClick={(e) => {
              e.preventDefault();
              applySize(size);
              e.currentTarget.parentElement.style.display = "none";
              inputRef.current?.focus();
            }}
            style={{
              display: "block",
              width: "100%",
              padding: "6px 8px",
              border: "none",
              background: "none",
              cursor: "pointer",
              textAlign: "left",
              fontSize: "13px",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#f0f0f0")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
          >
            {size} pt
          </button>
        ))}
      </div>
    </div>
  );
}
