/**
 * Quiet search well shared by the note finder and the sidebar title filter.
 */

import { Search } from "lucide-react";
import { cn } from "../../lib/cn";

export const SearchField = ({
  value,
  onChange,
  onFocus,
  onKeyDown,
  placeholder,
  "aria-label": ariaLabel,
  inputRef,
  className,
  inputClassName,
  ...inputProps
}) => (
  <div
    className={cn(
      "flex h-8 min-w-0 items-center gap-2 rounded-lg px-2.5",
      "bg-neutral-100/90 text-neutral-400 ring-1 ring-inset ring-neutral-200/90",
      "transition-colors duration-150",
      "focus-within:bg-white focus-within:text-neutral-500 focus-within:ring-neutral-300",
      "dark:bg-white/5 dark:text-neutral-500 dark:ring-white/10",
      "dark:focus-within:bg-neutral-900 dark:focus-within:ring-neutral-600",
      className,
    )}
  >
    <Search className="h-3.5 w-3.5 shrink-0" strokeWidth={2} />
    <input
      ref={inputRef}
      type="text"
      value={value}
      placeholder={placeholder}
      aria-label={ariaLabel ?? placeholder}
      autoComplete="off"
      spellCheck={false}
      onChange={onChange}
      onFocus={onFocus}
      onKeyDown={onKeyDown}
      className={cn(
        "min-w-0 flex-1 bg-transparent text-[12.5px] text-neutral-800 outline-none",
        "placeholder:text-neutral-400 dark:text-neutral-100 dark:placeholder:text-neutral-500",
        inputClassName,
      )}
      {...inputProps}
    />
  </div>
);
