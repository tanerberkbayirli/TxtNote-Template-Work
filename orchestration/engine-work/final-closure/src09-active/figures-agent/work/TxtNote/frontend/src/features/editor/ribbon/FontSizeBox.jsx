import { useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import FloatingMenu from "./FloatingMenu.jsx";
import { control, fontSizePresets } from "./shared.js";

const clampSize = (num) => Math.max(1, Math.min(400, Math.round(num * 2) / 2));
const parseSize = (str) => {
  const value = String(str).trim().replace(/^pt\s*/i, "").replace(",", ".");
  if (!/^(?:\d+(?:\.\d*)?|\.\d+)$/.test(value)) return null;
  const num = Number(value);
  return Number.isFinite(num) ? clampSize(num) : null;
};

export default function FontSizeBox({ activeFormat, remember, keep, invoke, disabled = false }) {
  const [draft, setDraft] = useState(null);
  const [invalid, setInvalid] = useState(false);
  const cancelBlurCommit = useRef(false);
  const currentSizePt = activeFormat?.sizePt ?? activeFormat?.sizeComputedPt;
  const shown = draft ?? (currentSizePt ? String(currentSizePt) : "");

  const apply = (size) => {
    if (size !== currentSizePt) invoke("applySize", size);
    setDraft(null);
    setInvalid(false);
  };
  const commit = () => {
    if (draft === null) return;
    const size = parseSize(draft);
    if (size === null) {
      setInvalid(true);
      setDraft(null);
      setTimeout(() => setInvalid(false), 1500);
    } else apply(size);
  };

  return (
    <FloatingMenu
      className="thesis-size-box"
      trigger={({ toggle }) => (
        <>
          <input
            type="text"
            inputMode="decimal"
            className={`${control} thesis-size-input`}
            aria-label="Yazı boyutu (pt)"
            title="Yazı boyutu (pt)"
            aria-invalid={invalid}
            placeholder="pt"
            value={shown}
            disabled={disabled}
            onMouseDown={remember}
            onFocus={(event) => {
              cancelBlurCommit.current = false;
              setDraft(shown);
              event.target.select();
            }}
            onChange={(event) => setDraft(event.target.value)}
            onBlur={() => {
              if (cancelBlurCommit.current) cancelBlurCommit.current = false;
              else commit();
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                event.currentTarget.blur();
              } else if (event.key === "Escape") {
                cancelBlurCommit.current = true;
                setDraft(null);
                event.currentTarget.blur();
              }
            }}
          />
          <button
            type="button"
            className="thesis-size-caret"
            aria-label="Boyut önayarları"
            title="Boyut önayarları"
            disabled={disabled}
            onMouseDown={(event) => {
              event.preventDefault();
              keep(event);
            }}
            onClick={toggle}
          >
            <ChevronDown size={13} aria-hidden="true" />
          </button>
        </>
      )}
    >
      {(close) =>
        fontSizePresets.map((size) => (
          <button
            key={size}
            type="button"
            role="menuitemradio"
            aria-checked={size === currentSizePt}
            className={`thesis-menu-item ${size === currentSizePt ? "is-active" : ""}`}
            onMouseDown={keep}
            onClick={() => {
              apply(size);
              close();
            }}
          >
            {size}
          </button>
        ))
      }
    </FloatingMenu>
  );
}

/** Next preset above/below the current size, like Word's grow/shrink buttons. */
export const stepFontSize = (current, direction) => {
  const size = Number(current) || 12;
  if (direction > 0) return fontSizePresets.find((preset) => preset > size) ?? clampSize(size + 2);
  return [...fontSizePresets].reverse().find((preset) => preset < size) ?? clampSize(size - 1);
};
