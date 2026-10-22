import { tool } from "./shared.js";

export default function Tool({
  children,
  label,
  onClick,
  onMouseDown,
  disabled = false,
  disabledReason,
  pressed,
  title,
  type = "button",
}) {
  return (
    <button
      type={type}
      className={tool}
      aria-label={label}
      title={disabled && disabledReason ? `${title || label} · ${disabledReason}` : title || label}
      aria-description={disabled ? disabledReason : undefined}
      aria-pressed={pressed}
      disabled={disabled}
      onMouseDown={onMouseDown}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
