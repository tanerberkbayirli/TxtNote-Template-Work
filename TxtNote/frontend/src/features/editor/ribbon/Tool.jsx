import { tool } from "./shared.js";

export default function Tool({
  children,
  label,
  onClick,
  onMouseDown,
  disabled = false,
  pressed,
  title,
  type = "button",
}) {
  return (
    <button
      type={type}
      className={tool}
      aria-label={label}
      title={title || label}
      aria-pressed={pressed}
      disabled={disabled}
      onMouseDown={onMouseDown}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
