"use client";

import * as React from "react";
import { DayPicker } from "react-day-picker";
import { ChevronLeft, ChevronRight, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

const CURRENT_YEAR = new Date().getFullYear();
const DEFAULT_START_MONTH = new Date(CURRENT_YEAR - 10, 0);
const DEFAULT_END_MONTH = new Date(CURRENT_YEAR + 10, 11);

const WEEKDAY_NAMES = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

/**
 * Premium Calendar component built on react-day-picker v10.
 *
 * Designed with fixed 7-column proportions to guarantee 1:1 alignment between
 * weekday headers and day numbers without text clipping or width overflow.
 */
export function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  captionLayout = "dropdown",
  startMonth,
  endMonth,
  formatters,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      captionLayout={captionLayout}
      startMonth={startMonth ?? DEFAULT_START_MONTH}
      endMonth={endMonth ?? DEFAULT_END_MONTH}
      className={cn("p-1.5 select-none", className)}
      formatters={{
        formatWeekdayName: (date) => WEEKDAY_NAMES[date.getDay()],
        ...formatters,
      }}
      classNames={{
        root: "w-full max-w-[270px] select-none",
        months: "relative flex flex-col w-full",
        month: "flex flex-col w-full relative",
        month_caption: "flex h-7 items-center justify-start pr-16 relative w-full mb-1",
        caption_label: "text-[12px] font-bold text-[var(--text-primary)]",
        dropdowns: "flex items-center gap-1",
        dropdown_root:
          "relative inline-flex items-center gap-0.5 font-semibold text-[11px] text-[var(--text-primary)] px-1.5 py-0.5 rounded-md bg-[var(--bg-subtle)] border border-[var(--border)] hover:border-[var(--border-focus)] transition-colors cursor-pointer",
        dropdown: "absolute inset-0 w-full h-full cursor-pointer appearance-none opacity-0 z-20",
        months_dropdown: "text-[11px]",
        years_dropdown: "text-[11px]",
        nav: "absolute right-0 top-0 flex items-center gap-1 z-20",
        button_previous:
          "inline-flex h-6.5 w-6.5 items-center justify-center rounded-md border border-[var(--border)] bg-[var(--bg-card)] text-[var(--text-secondary)] hover:bg-[var(--bg-raised)] hover:text-[var(--text-primary)] disabled:opacity-25 cursor-pointer transition-colors",
        button_next:
          "inline-flex h-6.5 w-6.5 items-center justify-center rounded-md border border-[var(--border)] bg-[var(--bg-card)] text-[var(--text-secondary)] hover:bg-[var(--bg-raised)] hover:text-[var(--text-primary)] disabled:opacity-25 cursor-pointer transition-colors",
        month_grid:
          "w-full border-collapse table-fixed mt-0.5 [&_td]:!p-0 [&_td]:!border-none [&_td]:!bg-transparent [&_th]:!p-0 [&_th]:!border-none [&_th]:!bg-transparent [&_tr]:!border-none",
        weekdays: "table-row border-none",
        weekday:
          "w-[14.28%] text-center text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)] h-5 align-middle select-none border-none p-0 bg-transparent",
        weeks: "table-row-group border-none",
        week: "table-row border-none",
        day: "w-[14.28%] h-7 p-0 text-center align-middle border-none",
        day_button:
          "w-6.5 h-6.5 sm:w-7 sm:h-7 mx-auto rounded-md text-[11px] sm:text-[12px] font-medium text-[var(--text-primary)] transition-colors hover:bg-[var(--bg-raised)] cursor-pointer flex items-center justify-center border-none",
        selected:
          "[&>button]:!bg-[var(--solid-btn-bg,var(--brand-green,#059639))] [&>button]:!text-[var(--solid-btn-text,#ffffff)] [&>button]:font-bold [&>button]:shadow-sm",
        today:
          "[&>button]:border [&>button]:border-[var(--brand-green,#059639)] [&>button]:font-bold",
        outside: "[&>button]:text-[var(--text-muted)] [&>button]:opacity-30",
        disabled: "[&>button]:opacity-20 [&>button]:cursor-not-allowed",
        hidden: "invisible",
        chevron: "h-3 w-3 text-[var(--text-secondary)]",
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
          return <Icon className={cn("h-3 w-3", chevronClass)} {...chevronProps} />;
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

export default Calendar;
