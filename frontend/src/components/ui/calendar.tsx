"use client";

import * as React from "react";
import { DayPicker } from "react-day-picker";
import { ChevronLeft, ChevronRight, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

/**
 * Calendar built on react-day-picker v10.
 *
 * Styled with Retentio's CSS custom properties so it follows light/dark mode.
 * Supports `captionLayout="dropdown"` for month/year select navigation.
 * Responsive sizing ensures perfect display across mobile screens and desktop.
 */
const CURRENT_YEAR = new Date().getFullYear();
const DEFAULT_START_MONTH = new Date(CURRENT_YEAR - 10, 0);
const DEFAULT_END_MONTH = new Date(CURRENT_YEAR + 10, 11);

export function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  captionLayout = "dropdown",
  startMonth,
  endMonth,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      captionLayout={captionLayout}
      startMonth={startMonth ?? DEFAULT_START_MONTH}
      endMonth={endMonth ?? DEFAULT_END_MONTH}
      className={cn("p-2 sm:p-3 select-none", className)}
      classNames={{
        root: "w-fit max-w-[calc(100vw-32px)]",
        months: "relative flex flex-col sm:flex-row gap-4",
        month: "flex flex-col gap-3",
        month_caption: "flex h-9 items-center justify-center px-8 relative",
        caption_label: "text-[13px] font-semibold text-[var(--text-primary)]",
        dropdowns: "flex items-center justify-center gap-1.5",
        dropdown_root: "relative inline-flex items-center gap-1 font-semibold text-[13px] text-[var(--text-primary)]",
        dropdown:
          "absolute inset-0 w-full cursor-pointer appearance-none opacity-0 z-20",
        months_dropdown: "text-[13px]",
        years_dropdown: "text-[13px]",
        nav: "absolute top-0 inset-x-0 flex items-center justify-between h-9 px-1 z-10",
        button_previous:
          "inline-flex h-7 w-7 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--bg-card)] text-[var(--text-secondary)] hover:bg-[var(--bg-raised)] disabled:opacity-40 cursor-pointer transition-colors z-30",
        button_next:
          "inline-flex h-7 w-7 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--bg-card)] text-[var(--text-secondary)] hover:bg-[var(--bg-raised)] disabled:opacity-40 cursor-pointer transition-colors z-30",
        month_grid: "w-full border-collapse",
        weekdays: "flex justify-between",
        weekday:
          "w-8 sm:w-9 text-center text-[11px] font-semibold uppercase tracking-wide text-[var(--text-muted)]",
        week: "flex w-full justify-between mt-1",
        day: "p-0 text-center w-8 sm:w-9 flex items-center justify-center",
        day_button:
          "inline-flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-lg text-[12px] sm:text-[13px] font-medium text-[var(--text-primary)] transition-colors hover:bg-[var(--bg-raised)] cursor-pointer",
        selected:
          "[&>button]:bg-[var(--solid-btn-bg)] [&>button]:text-[var(--solid-btn-text)] [&>button]:font-bold [&>button]:hover:opacity-90",
        today:
          "[&>button]:border [&>button]:border-[var(--border-focus)] [&>button]:font-bold",
        outside: "[&>button]:text-[var(--text-muted)] [&>button]:opacity-40",
        disabled: "[&>button]:opacity-25 [&>button]:cursor-not-allowed",
        hidden: "invisible",
        chevron: "h-3.5 w-3.5",
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation, className: chevronClass, ...chevronProps }) => {
          const Icon =
            orientation === "left"
              ? ChevronLeft
              : orientation === "right"
              ? ChevronRight
              : ChevronDown;
          return <Icon className={cn("h-3.5 w-3.5", chevronClass)} {...chevronProps} />;
        },
      }}
      {...props}
    />
  );
}

export function CalendarDemo() {
  const [date, setDate] = React.useState<Date | undefined>(() => new Date());

  return (
    <Calendar
      mode="single"
      selected={date}
      onSelect={setDate}
      className="rounded-lg border"
      captionLayout="dropdown"
    />
  );
}
