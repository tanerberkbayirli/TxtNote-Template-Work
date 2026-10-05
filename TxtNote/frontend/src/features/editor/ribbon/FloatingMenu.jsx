import { useEffect, useLayoutEffect, useRef, useState } from "react";

/**
 * Dropdown anchored to a trigger and drawn with position:fixed, because the ribbon panel clips its overflow.
 * Closes on outside press, Escape and scroll/resize. `children` is a render prop receiving `close`.
 */
export default function FloatingMenu({ trigger, children, label, disabled = false, className = "" }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const anchorRef = useRef(null);
  const menuRef = useRef(null);
  useEffect(() => {
    if (disabled) setOpen(false);
  }, [disabled]);
  useLayoutEffect(() => {
    if (!open) return;
    const anchor = anchorRef.current?.getBoundingClientRect();
    const menu = menuRef.current?.getBoundingClientRect();
    if (!anchor || !menu) return;
    const margin = 4;
    const left = Math.max(margin, Math.min(anchor.left, window.innerWidth - menu.width - margin));
    const below = anchor.bottom + 3;
    const top = below + menu.height <= window.innerHeight - margin
      ? below
      : Math.max(margin, anchor.top - menu.height - 3);
    setPos((current) => current.left === left && current.top === top ? current : { left, top });
  }, [open, children]);
  useEffect(() => {
    if (!open) return undefined;
    const outside = (event) => {
      if (!menuRef.current?.contains(event.target) && !anchorRef.current?.contains(event.target)) setOpen(false);
    };
    const close = (event) => {
      if (event && menuRef.current?.contains(event.target)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", outside);
    window.addEventListener("resize", close);
    window.addEventListener("scroll", close, true);
    return () => {
      document.removeEventListener("mousedown", outside);
      window.removeEventListener("resize", close);
      window.removeEventListener("scroll", close, true);
    };
  }, [open]);
  const toggle = () => {
    if (disabled) return;
    if (!open) {
      const rect = anchorRef.current?.getBoundingClientRect();
      if (rect) setPos({ top: rect.bottom + 3, left: Math.max(4, Math.min(rect.left, window.innerWidth - 300)) });
    }
    setOpen(!open);
  };
  return (
    <span ref={anchorRef} className={`thesis-menu-anchor ${className}`}>
      {trigger({ open, toggle, disabled, label })}
      {open && (
        <div
          ref={menuRef}
          role="menu"
          className="thesis-floating-menu"
          style={{ top: pos.top, left: pos.left }}
          onMouseDown={(event) => { if (!event.target.closest?.("input,label")) event.preventDefault(); }}
          onKeyDown={(event) => event.key === "Escape" && setOpen(false)}
        >
          {children(() => setOpen(false))}
        </div>
      )}
    </span>
  );
}
