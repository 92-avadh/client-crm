"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { CalendarIcon, X } from "lucide-react";
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
  name?: string;
  allowClear?: boolean;
}

/**
 * Robust date picker built on react-day-picker.
 *
 * Renders via React Portal with dynamic viewport clamping so the calendar
 * never clips or overflows the screen on mobile, inside modals, or in grid columns.
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
  name,
  allowClear,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const popoverRef = React.useRef<HTMLDivElement>(null);

  const generatedId = React.useId();
  const inputId = id ?? generatedId;

  // Selected date parsed safely into local time to prevent UTC day-shift
  const selectedDate = React.useMemo(() => {
    if (!value) return undefined;
    try {
      const cleanValue = value.includes("T") ? value.split("T")[0] : value;
      const parts = cleanValue.split("-").map(Number);
      if (parts.length === 3 && parts[0] && parts[1] && parts[2]) {
        return new Date(parts[0], parts[1] - 1, parts[2]);
      }
      const parsed = parse(cleanValue, "yyyy-MM-dd", new Date(0));
      return isNaN(parsed.getTime()) ? undefined : parsed;
    } catch {
      return undefined;
    }
  }, [value]);

  const [coords, setCoords] = React.useState<{
    top: number;
    left: number;
  } | null>(null);

  const updatePosition = React.useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // Measured or fallback dimensions
    const popoverWidth = popoverRef.current?.offsetWidth || 292;
    const popoverHeight = popoverRef.current?.offsetHeight || 320;

    // Vertical placement
    const spaceBelow = viewportHeight - rect.bottom;
    const spaceAbove = rect.top;
    let top: number;

    if (spaceBelow >= popoverHeight + 8 || spaceBelow >= spaceAbove) {
      top = rect.bottom + 6;
    } else {
      top = Math.max(8, rect.top - popoverHeight - 6);
    }

    // Horizontal placement with viewport clamping
    const maxLeft = Math.max(8, viewportWidth - popoverWidth - 8);
    let left = rect.left;

    if (left > maxLeft) {
      // Align to right edge of trigger button
      left = Math.max(8, rect.right - popoverWidth);
      if (left > maxLeft) {
        left = maxLeft;
      }
    } else if (left < 8) {
      left = 8;
    }

    setCoords({ top, left });
  }, []);

  React.useLayoutEffect(() => {
    if (open) {
      updatePosition();
    }
  }, [open, updatePosition]);

  React.useEffect(() => {
    if (!open) return;

    const onScrollOrResize = () => {
      updatePosition();
    };

    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node;
      if (
        containerRef.current &&
        !containerRef.current.contains(target) &&
        popoverRef.current &&
        !popoverRef.current.contains(target)
      ) {
        setOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
      }
    };

    window.addEventListener("resize", onScrollOrResize);
    window.addEventListener("scroll", onScrollOrResize, true);
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside, { passive: true });
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("resize", onScrollOrResize);
      window.removeEventListener("scroll", onScrollOrResize, true);
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, updatePosition]);

  const handleSelect = React.useCallback(
    (date: Date | undefined) => {
      if (date && onChange) {
        onChange(format(date, "yyyy-MM-dd"));
      }
      setOpen(false);
    },
    [onChange]
  );

  const handleClear = React.useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (onChange) {
        onChange("");
      }
    },
    [onChange]
  );

  const triggerText = selectedDate ? format(selectedDate, "dd MMM yyyy") : placeholder;
  const showClear = (allowClear || (!required && Boolean(value))) && !disabled && Boolean(value);

  return (
    <div ref={containerRef} className={cn("relative w-full block", className)}>
      {label && (
        <label
          htmlFor={inputId}
          className="mb-1.5 block text-xs font-bold text-[var(--text-primary)]"
        >
          {label}
          {required && <span className="ml-0.5 text-[var(--danger-text)]">*</span>}
        </label>
      )}

      {name && (
        <input
          type="hidden"
          name={name}
          value={value || ""}
          required={required}
        />
      )}

      <button
        ref={triggerRef}
        id={inputId}
        type="button"
        disabled={disabled}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "flex w-full items-center justify-between gap-2 rounded-lg border bg-[var(--bg-card)] px-3 py-2 text-left text-sm text-[var(--text-primary)] transition-colors",
          error
            ? "border-red-500 hover:border-red-500"
            : "border-[var(--border)] hover:border-[var(--border-focus)]",
          "focus:outline-none focus:ring-2 focus:ring-[var(--border-focus)]/20",
          disabled && "cursor-not-allowed opacity-50"
        )}
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <CalendarIcon className="h-4 w-4 shrink-0 text-[var(--text-muted)]" />
          <span className={cn("truncate", !selectedDate && "text-[var(--text-muted)]")}>
            {triggerText}
          </span>
        </div>

        {showClear && (
          <span
            role="button"
            tabIndex={0}
            onClick={handleClear}
            className="rounded p-0.5 text-[var(--text-muted)] hover:bg-[var(--bg-raised)] hover:text-[var(--text-primary)] transition-colors"
            title="Clear date"
          >
            <X className="h-3.5 w-3.5" />
          </span>
        )}
      </button>

      {error && <p className="mt-1 text-sm text-red-500">{error}</p>}

      {open && typeof document !== "undefined" &&
        createPortal(
          <div
            ref={popoverRef}
            style={{
              position: "fixed",
              top: coords ? `${coords.top}px` : "0px",
              left: coords ? `${coords.left}px` : "0px",
              visibility: coords ? "visible" : "hidden",
              zIndex: 99999,
              maxWidth: "calc(100vw - 16px)",
            }}
            className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-1.5 sm:p-2 shadow-2xl backdrop-blur-md animate-fade-in"
          >
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={handleSelect}
            />
          </div>,
          document.body
        )}
    </div>
  );
}

export default DatePicker;
