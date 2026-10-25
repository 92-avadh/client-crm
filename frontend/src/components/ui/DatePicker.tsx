"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { CalendarIcon, X, Check } from "lucide-react";
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
    const popoverWidth = popoverRef.current?.offsetWidth || 270;
    const popoverHeight = popoverRef.current?.offsetHeight || 260;

    // Vertical placement: prefer below unless space below is tight
    const spaceBelow = viewportHeight - rect.bottom;
    const spaceAbove = rect.top;
    let top: number;

    if (spaceBelow >= popoverHeight + 8 || spaceBelow >= spaceAbove) {
      top = Math.min(rect.bottom + 4, viewportHeight - popoverHeight - 8);
    } else {
      top = Math.max(8, rect.top - popoverHeight - 4);
    }

    // Horizontal placement with viewport clamping
    const maxLeft = Math.max(8, viewportWidth - popoverWidth - 8);
    let left = rect.left;

    if (left > maxLeft) {
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

  const handleSelectToday = React.useCallback(() => {
    if (onChange) {
      onChange(format(new Date(), "yyyy-MM-dd"));
    }
    setOpen(false);
  }, [onChange]);

  const triggerText = selectedDate ? format(selectedDate, "dd MMM yyyy") : placeholder;
  const showClear = (allowClear || (!required && Boolean(value))) && !disabled && Boolean(value);

  return (
    <div ref={containerRef} className={cn("relative w-full block", className)}>
      {label && (
        <label
          htmlFor={inputId}
          style={{
            display: "block",
            fontWeight: 600,
            color: "var(--text-primary)",
            fontSize: 12,
            marginBottom: 6,
          }}
        >
          {label}
          {required && <span style={{ color: "var(--danger-text, #ef4444)", marginLeft: 2 }}>*</span>}
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
        style={{
          width: "100%",
          padding: "9px 14px",
          border: error
            ? "1px solid var(--danger-border, #ef4444)"
            : open
            ? "1px solid var(--brand-green, #059639)"
            : "1px solid var(--border)",
          borderRadius: 10,
          fontSize: 13,
          color: selectedDate ? "var(--text-primary)" : "var(--text-muted)",
          background: error ? "var(--danger-bg, #fef2f2)" : "var(--bg-subtle)",
          boxShadow: open ? "0 0 0 3px rgba(5, 150, 57, 0.12)" : "none",
          outline: "none",
          boxSizing: "border-box",
          cursor: disabled ? "not-allowed" : "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          fontFamily: "inherit",
          textAlign: "left",
          transition: "border-color 0.15s, box-shadow 0.15s",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0, flex: 1 }}>
          <CalendarIcon style={{ width: 15, height: 15, color: "var(--text-muted)", flexShrink: 0 }} />
          <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontWeight: selectedDate ? 600 : 400 }}>
            {triggerText}
          </span>
        </div>

        {showClear && (
          <span
            role="button"
            tabIndex={0}
            onClick={handleClear}
            style={{
              borderRadius: 6,
              padding: 3,
              color: "var(--text-muted)",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
            }}
            title="Clear date"
          >
            <X style={{ width: 14, height: 14 }} />
          </span>
        )}
      </button>

      {error && (
        <span
          style={{
            fontSize: 11,
            color: "var(--danger-text, #ef4444)",
            marginTop: 4,
            display: "block",
            fontWeight: 500,
          }}
        >
          {error}
        </span>
      )}

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
              background: "var(--bg-card)",
              border: "1px solid var(--border)",
              borderRadius: 12,
              boxShadow: "0 18px 38px -8px rgba(0, 0, 0, 0.35), 0 0 0 1px var(--border)",
              padding: "8px 10px",
            }}
            className="animate-fade-in"
          >
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={handleSelect}
            />

            {/* Quick action bar */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                paddingTop: 6,
                marginTop: 4,
                borderTop: "1px solid var(--border)",
                fontSize: 11,
              }}
            >
              <button
                type="button"
                onClick={handleSelectToday}
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--brand-green, #059639)",
                  fontWeight: 700,
                  cursor: "pointer",
                  padding: "3px 6px",
                  borderRadius: 6,
                  fontSize: 11,
                }}
              >
                Today
              </button>

              <div style={{ display: "flex", gap: 4 }}>
                {Boolean(value) && !required && (
                  <button
                    type="button"
                    onClick={() => {
                      if (onChange) onChange("");
                      setOpen(false);
                    }}
                    style={{
                      background: "none",
                      border: "none",
                      color: "var(--text-muted)",
                      cursor: "pointer",
                      padding: "3px 6px",
                      borderRadius: 6,
                      fontSize: 11,
                    }}
                  >
                    Clear
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  style={{
                    background: "var(--bg-subtle)",
                    border: "1px solid var(--border)",
                    color: "var(--text-primary)",
                    fontWeight: 600,
                    cursor: "pointer",
                    padding: "3px 8px",
                    borderRadius: 6,
                    fontSize: 11,
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                  }}
                >
                  <Check style={{ width: 11, height: 11 }} />
                  Done
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}

export default DatePicker;
