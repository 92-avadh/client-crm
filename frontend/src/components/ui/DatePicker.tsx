"use client";

import * as React from "react";
import { CalendarIcon } from "lucide-react";
import { format, parse } from "date-fns";
import { Calendar } from "./calendar";
import { cn } from "@/lib/utils";

export interface DatePickerProps {
  value?: string;
  onChange?: (date: string) => void;
  label?: string;
  placeholder?: string;
  required?: boolean;
  error?: string;
  id?: string;
  disabled?: boolean;
  className?: string;
}

/**
 * Date picker built on react-day-picker.
 *
 * Displays a styled input trigger; clicking it opens a calendar popover.
 * The selected date is emitted as an ISO-ish string (yyyy-MM-dd) via `onChange`.
 */
export function DatePicker({
  value,
  onChange,
  label,
  placeholder = "Select date",
  required,
  error,
  id,
  disabled,
  className,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  // Close popover on outside click
  React.useEffect(() => {
    if (!open) return;

    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const generatedId = React.useId();
  const inputId = id ?? generatedId;

  const selectedDate = React.useMemo(() => {
    if (!value) return undefined;
    try {
      return parse(value, "yyyy-MM-dd", new Date());
    } catch {
      return undefined;
    }
  }, [value]);

  const handleSelect = React.useCallback(
    (date: Date | undefined) => {
      if (date && onChange) {
        onChange(format(date, "yyyy-MM-dd"));
      }
      setOpen(false);
    },
    [onChange]
  );

  const triggerText = selectedDate ? format(selectedDate, "dd MMM yyyy") : placeholder;

  return (
    <div ref={containerRef} className={cn("relative inline-block", className)}>
      {label && (
        <label
          htmlFor={inputId}
          className="mb-1.5 block text-xs font-bold text-[var(--text-primary)]"
        >
          {label}
          {required && <span className="ml-0.5 text-[var(--danger-text)]">*</span>}
        </label>
      )}
      <button
        id={inputId}
        type="button"
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "flex w-full items-center gap-2 rounded-lg border bg-[var(--bg-card)] px-3 py-2 text-left text-sm text-[var(--text-primary)] transition-colors",
          error
            ? "border-red-500 hover:border-red-500"
            : "border-[var(--border)] hover:border-[var(--border-focus)]",
          "focus:outline-none",
          disabled && "cursor-not-allowed opacity-50"
        )}
      >
        <CalendarIcon className="h-4 w-4 text-[var(--text-muted)]" />
        <span className={cn(!selectedDate && "text-[var(--text-muted)]")}>
          {triggerText}
        </span>
      </button>

      {error && <p className="mt-1 text-sm text-red-500">{error}</p>}

      {open && (
        <div className="absolute left-0 z-50 mt-1 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-2 shadow-lg">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={handleSelect}
          />
        </div>
      )}
    </div>
  );
}

export default DatePicker;
