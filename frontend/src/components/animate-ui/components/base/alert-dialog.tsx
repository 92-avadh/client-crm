"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

/* ------------------------------------------------------------------ */
/*  Context                                                            */
/* ------------------------------------------------------------------ */
interface AlertDialogContextType {
  open: boolean;
  setOpen: (open: boolean) => void;
}

const AlertDialogContext = React.createContext<AlertDialogContextType | undefined>(undefined);

const useAlertDialog = (component: string) => {
  const ctx = React.useContext(AlertDialogContext);
  if (!ctx) throw new Error(`${component} must be used inside <AlertDialog>`);
  return ctx;
};

/* ------------------------------------------------------------------ */
/*  Root — supports controlled and uncontrolled usage                  */
/* ------------------------------------------------------------------ */
export interface AlertDialogProps {
  children: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export const AlertDialog = ({ children, open: openProp, onOpenChange }: AlertDialogProps) => {
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(false);
  const isControlled = openProp !== undefined;
  const open = isControlled ? openProp : uncontrolledOpen;

  const setOpen = React.useCallback(
    (val: boolean) => {
      if (!isControlled) setUncontrolledOpen(val);
      onOpenChange?.(val);
    },
    [isControlled, onOpenChange]
  );

  return (
    <AlertDialogContext.Provider value={{ open, setOpen }}>
      {children}
    </AlertDialogContext.Provider>
  );
};

/* ------------------------------------------------------------------ */
/*  Trigger — clones a single element and wires up onClick             */
/* ------------------------------------------------------------------ */
export interface AlertDialogTriggerProps {
  /** A single React element to use as the trigger, e.g. <Button /> */
  render?: React.ReactElement<{ onClick?: (e: React.MouseEvent) => void }>;
  children?: React.ReactNode;
  className?: string;
}

export const AlertDialogTrigger = ({ render, children, className }: AlertDialogTriggerProps) => {
  const { setOpen } = useAlertDialog("AlertDialogTrigger");

  if (render && React.isValidElement(render)) {
    return React.cloneElement(render, {
      onClick: (e: React.MouseEvent) => {
        render.props.onClick?.(e);
        setOpen(true);
      },
    });
  }

  return (
    <button type="button" className={className} onClick={() => setOpen(true)}>
      {children}
    </button>
  );
};

/* ------------------------------------------------------------------ */
/*  Popup — portaled, spring-animated, direction-aware                 */
/* ------------------------------------------------------------------ */
export interface AlertDialogPopupProps extends React.HTMLAttributes<HTMLDivElement> {
  from?: "bottom" | "top" | "left" | "right" | "center";
}

const backdropVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

const popupVariants: Variants = {
  hidden: (from: string) => {
    switch (from) {
      case "bottom": return { y: 50, opacity: 0, scale: 0.98 };
      case "top": return { y: -50, opacity: 0, scale: 0.98 };
      case "left": return { x: -50, opacity: 0 };
      case "right": return { x: 50, opacity: 0 };
      default: return { scale: 0.95, opacity: 0 };
    }
  },
  visible: {
    y: 0,
    x: 0,
    scale: 1,
    opacity: 1,
    transition: { type: "spring", duration: 0.35, bounce: 0.15 } as const,
  },
  exit: (from: string) => {
    switch (from) {
      case "bottom": return { y: 30, opacity: 0, scale: 0.98, transition: { duration: 0.2 } };
      case "top": return { y: -30, opacity: 0, scale: 0.98, transition: { duration: 0.2 } };
      case "left": return { x: -30, opacity: 0, transition: { duration: 0.2 } };
      case "right": return { x: 30, opacity: 0, transition: { duration: 0.2 } };
      default: return { scale: 0.95, opacity: 0, transition: { duration: 0.15 } };
    }
  },
};

export const AlertDialogPopup = React.forwardRef<HTMLDivElement, AlertDialogPopupProps>(
  ({ className, children, from = "center", ...props }, ref) => {
    const { open, setOpen } = useAlertDialog("AlertDialogPopup");
    const [mounted, setMounted] = React.useState(false);

    React.useEffect(() => {
      setMounted(true);
      return () => setMounted(false);
    }, []);

    // Lock body scroll + close on Escape while open
    React.useEffect(() => {
      if (!open) return;
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";

      const onKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") setOpen(false);
      };
      document.addEventListener("keydown", onKeyDown);

      return () => {
        document.body.style.overflow = prevOverflow;
        document.removeEventListener("keydown", onKeyDown);
      };
    }, [open, setOpen]);

    if (!mounted) return null;

    return createPortal(
      <AnimatePresence>
        {open && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial="hidden"
              animate="visible"
              exit="hidden"
              variants={backdropVariants}
              transition={{ duration: 0.2 }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 backdrop-blur-sm"
              style={{ background: "var(--overlay)" }}
            />

            {/* Dialog content */}
            <motion.div
              ref={ref}
              role="alertdialog"
              aria-modal="true"
              custom={from}
              initial="hidden"
              animate="visible"
              exit="exit"
              variants={popupVariants}
              className={cn(
                "relative z-[101] w-full max-w-lg overflow-hidden rounded-3xl border p-6 shadow-2xl md:p-8",
                "border-[var(--border)] bg-[var(--bg-card)] text-[var(--text-primary)]",
                className
              )}
              {...(props as any)}
            >
              {children}
            </motion.div>
          </div>
        )}
      </AnimatePresence>,
      document.body
    );
  }
);
AlertDialogPopup.displayName = "AlertDialogPopup";

/* ------------------------------------------------------------------ */
/*  Layout primitives                                                  */
/* ------------------------------------------------------------------ */
export const AlertDialogHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("flex flex-col space-y-2 text-center sm:text-left", className)} {...props} />
);
AlertDialogHeader.displayName = "AlertDialogHeader";

export const AlertDialogTitle = ({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
  <h2 className={cn("text-lg font-semibold text-[var(--text-primary)]", className)} {...props} />
);
AlertDialogTitle.displayName = "AlertDialogTitle";

export const AlertDialogDescription = ({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) => (
  <p className={cn("text-sm leading-relaxed text-[var(--text-secondary)]", className)} {...props} />
);
AlertDialogDescription.displayName = "AlertDialogDescription";

export const AlertDialogFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn("mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:gap-3", className)}
    {...props}
  />
);
AlertDialogFooter.displayName = "AlertDialogFooter";

/* ------------------------------------------------------------------ */
/*  Cancel — dismisses the dialog                                      */
/* ------------------------------------------------------------------ */
export const AlertDialogCancel = ({
  className,
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) => {
  const { setOpen } = useAlertDialog("AlertDialogCancel");

  return (
    <button
      type="button"
      className={cn(
        "inline-flex h-10 cursor-pointer items-center justify-center rounded-xl px-4 text-[13px] font-semibold transition-colors",
        "border border-[var(--border-strong)] bg-[var(--bg-card)] text-[var(--text-primary)]",
        "hover:bg-[var(--bg-raised)] focus-visible:outline-none focus-visible:ring-2",
        className
      )}
      onClick={(e) => {
        props.onClick?.(e);
        setOpen(false);
      }}
      {...props}
    >
      {children}
    </button>
  );
};
AlertDialogCancel.displayName = "AlertDialogCancel";

/* ------------------------------------------------------------------ */
/*  Action — runs onClick then dismisses                               */
/* ------------------------------------------------------------------ */
export const AlertDialogAction = ({
  className,
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) => {
  const { setOpen } = useAlertDialog("AlertDialogAction");

  return (
    <button
      type="button"
      className={cn(
        "inline-flex h-10 cursor-pointer items-center justify-center rounded-xl px-4 text-[13px] font-semibold transition-colors",
        "border border-transparent bg-[var(--solid-btn-bg)] text-[var(--solid-btn-text)]",
        "hover:opacity-90 focus-visible:outline-none focus-visible:ring-2",
        className
      )}
      onClick={(e) => {
        props.onClick?.(e);
        setOpen(false);
      }}
      {...props}
    >
      {children}
    </button>
  );
};
AlertDialogAction.displayName = "AlertDialogAction";

/* ------------------------------------------------------------------ */
/*  Demo                                                               */
/* ------------------------------------------------------------------ */
export interface BaseAlertDialogDemoProps {
  from: AlertDialogPopupProps["from"];
}

export const BaseAlertDialogDemo = ({ from }: BaseAlertDialogDemoProps) => {
  return (
    <AlertDialog>
      <AlertDialogTrigger
        render={<Button variant="outline">Open Dialog</Button>}
      />
      <AlertDialogPopup from={from} className="sm:max-w-[425px]">
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete your
            account and remove your data from our servers.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction>Continue</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogPopup>
    </AlertDialog>
  );
};
