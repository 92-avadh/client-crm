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
          <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
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
                "relative z-[10001] w-full text-[var(--text-primary)]",
                className
              )}
              style={{
                maxWidth: 'min(480px, calc(100vw - 32px))',
                width: '100%',
                background: 'var(--bg-card, #ffffff)',
                border: '1px solid var(--border)',
                borderRadius: 20,
                padding: '24px 26px 22px 26px',
                boxShadow: '0 24px 60px -12px rgba(0, 0, 0, 0.22), 0 8px 24px -6px rgba(0, 0, 0, 0.1)',
                boxSizing: 'border-box',
                overflow: 'hidden',
                ...(props.style || {}),
              }}
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
export const AlertDialogHeader = ({ className, style, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn("flex flex-col text-left", className)}
    style={{
      display: 'flex',
      flexDirection: 'column',
      gap: 6,
      width: '100%',
      ...style,
    }}
    {...props}
  />
);
AlertDialogHeader.displayName = "AlertDialogHeader";

export const AlertDialogTitle = ({ className, style, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
  <h2
    className={cn("font-bold text-[var(--text-primary)]", className)}
    style={{
      fontSize: 18,
      fontWeight: 800,
      color: 'var(--text-primary)',
      lineHeight: 1.3,
      margin: 0,
      letterSpacing: '-0.015em',
      ...style,
    }}
    {...props}
  />
);
AlertDialogTitle.displayName = "AlertDialogTitle";

export const AlertDialogDescription = ({ className, style, ...props }: React.HTMLAttributes<HTMLParagraphElement>) => (
  <p
    className={cn("text-[var(--text-secondary)]", className)}
    style={{
      fontSize: 13.5,
      color: 'var(--text-secondary)',
      lineHeight: 1.55,
      margin: '4px 0 0 0',
      ...style,
    }}
    {...props}
  />
);
AlertDialogDescription.displayName = "AlertDialogDescription";

export const AlertDialogFooter = ({ className, style, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn("flex items-center justify-end", className)}
    style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'flex-end',
      gap: 10,
      marginTop: 24,
      width: '100%',
      flexWrap: 'wrap',
      ...style,
    }}
    {...props}
  />
);
AlertDialogFooter.displayName = "AlertDialogFooter";

/* ------------------------------------------------------------------ */
/*  Cancel — dismisses the dialog                                      */
/* ------------------------------------------------------------------ */
export const AlertDialogCancel = ({
  className,
  style,
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) => {
  const { setOpen } = useAlertDialog("AlertDialogCancel");

  return (
    <button
      type="button"
      className={cn(
        "cursor-pointer transition-colors",
        className
      )}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: 38,
        padding: '0 18px',
        borderRadius: 10,
        fontSize: 13,
        fontWeight: 650,
        border: '1px solid var(--border-strong)',
        background: 'var(--bg-card)',
        color: 'var(--text-primary)',
        cursor: 'pointer',
        transition: 'all 0.15s ease',
        ...style,
      }}
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
  style,
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) => {
  const { setOpen } = useAlertDialog("AlertDialogAction");

  return (
    <button
      type="button"
      className={cn(
        "cursor-pointer transition-colors",
        className
      )}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: 38,
        padding: '0 20px',
        borderRadius: 10,
        fontSize: 13,
        fontWeight: 700,
        border: 'none',
        background: 'var(--solid-btn-bg)',
        color: 'var(--solid-btn-text)',
        cursor: 'pointer',
        whiteSpace: 'nowrap',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        transition: 'all 0.15s ease',
        ...style,
      }}
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
