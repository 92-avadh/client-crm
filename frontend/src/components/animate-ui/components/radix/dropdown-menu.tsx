"use client";

import * as React from "react";
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import { ChevronRight, Check } from "lucide-react";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/*  Context — tracks open state so AnimatePresence can animate exits   */
/* ------------------------------------------------------------------ */
const DropdownMenuContext = React.createContext<{ open: boolean }>({ open: false });

export const DropdownMenu = ({
  open: openProp,
  onOpenChange,
  ...props
}: DropdownMenuPrimitive.DropdownMenuProps) => {
  const [open, setOpen] = React.useState(openProp ?? false);
  const isControlled = openProp !== undefined;

  React.useEffect(() => {
    if (openProp !== undefined) setOpen(openProp);
  }, [openProp]);

  const handleOpenChange = React.useCallback(
    (val: boolean) => {
      if (!isControlled) setOpen(val);
      onOpenChange?.(val);
    },
    [isControlled, onOpenChange]
  );

  return (
    <DropdownMenuContext.Provider value={{ open }}>
      <DropdownMenuPrimitive.Root open={open} onOpenChange={handleOpenChange} {...props} />
    </DropdownMenuContext.Provider>
  );
};

export const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger;
export const DropdownMenuGroup = DropdownMenuPrimitive.Group;
export const DropdownMenuRadioGroup = DropdownMenuPrimitive.RadioGroup;

const DropdownMenuSubContext = React.createContext<{ open: boolean }>({ open: false });

export const DropdownMenuSub = ({
  open: openProp,
  onOpenChange,
  ...props
}: DropdownMenuPrimitive.DropdownMenuSubProps) => {
  const [open, setOpen] = React.useState(openProp ?? false);
  const isControlled = openProp !== undefined;

  React.useEffect(() => {
    if (openProp !== undefined) setOpen(openProp);
  }, [openProp]);

  const handleOpenChange = React.useCallback(
    (val: boolean) => {
      if (!isControlled) setOpen(val);
      onOpenChange?.(val);
    },
    [isControlled, onOpenChange]
  );

  return (
    <DropdownMenuSubContext.Provider value={{ open }}>
      <DropdownMenuPrimitive.Sub open={open} onOpenChange={handleOpenChange} {...props} />
    </DropdownMenuSubContext.Provider>
  );
};

/* ------------------------------------------------------------------ */
/*  Shared spring animation                                            */
/* ------------------------------------------------------------------ */
const contentVariants: Variants = {
  hidden: { opacity: 0, scale: 0.95, y: -8 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { type: "spring", duration: 0.25, bounce: 0.12 },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: -8,
    transition: { duration: 0.12, ease: "easeOut" },
  },
};

/* ------------------------------------------------------------------ */
/*  Content — portaled, spring-animated                                */
/* ------------------------------------------------------------------ */
export const DropdownMenuContent = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Content>
>(({ className, children, sideOffset = 6, ...props }, ref) => {
  const { open } = React.useContext(DropdownMenuContext);

  return (
    <DropdownMenuPrimitive.Portal>
      <AnimatePresence>
        {open && (
          <DropdownMenuPrimitive.Content
            ref={ref}
            forceMount
            sideOffset={sideOffset}
            asChild
            {...props}
          >
            <motion.div
              initial="hidden"
              animate="visible"
              exit="exit"
              variants={contentVariants}
              className={cn(
                "z-50 min-w-[8rem] max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl p-1.5 shadow-xl",
                "border border-[var(--border)] bg-[var(--bg-card)] text-[var(--text-primary)]",
                className
              )}
            >
              {children}
            </motion.div>
          </DropdownMenuPrimitive.Content>
        )}
      </AnimatePresence>
    </DropdownMenuPrimitive.Portal>
  );
});
DropdownMenuContent.displayName = "DropdownMenuContent";

export const DropdownMenuSubContent = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.SubContent>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.SubContent>
>(({ className, children, ...props }, ref) => {
  const { open } = React.useContext(DropdownMenuSubContext);

  return (
    <AnimatePresence>
      {open && (
        <DropdownMenuPrimitive.SubContent ref={ref} forceMount asChild {...props}>
          <motion.div
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={contentVariants}
            className={cn(
              "z-50 min-w-[8rem] max-w-[calc(100vw-2rem)] overflow-hidden rounded-xl p-1.5 shadow-lg",
              "border border-[var(--border)] bg-[var(--bg-card)] text-[var(--text-primary)]",
              className
            )}
          >
            {children}
          </motion.div>
        </DropdownMenuPrimitive.SubContent>
      )}
    </AnimatePresence>
  );
});
DropdownMenuSubContent.displayName = "DropdownMenuSubContent";

/* ------------------------------------------------------------------ */
/*  Items                                                              */
/* ------------------------------------------------------------------ */
export const DropdownMenuItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Item> & {
    variant?: "default" | "destructive";
    inset?: boolean;
  }
>(({ className, variant = "default", inset, ...props }, ref) => (
  <DropdownMenuPrimitive.Item
    ref={ref}
    className={cn(
      "group relative flex cursor-pointer select-none items-center gap-2 rounded-xl px-3 py-2 text-[13px] font-medium outline-none transition-colors duration-150",
      "text-[var(--text-secondary)] focus:bg-[var(--bg-raised)] focus:text-[var(--text-primary)]",
      "data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      inset && "pl-8",
      variant === "destructive" &&
        "text-[var(--danger-text)] focus:bg-[var(--danger-bg)] focus:text-[var(--danger-text)]",
      className
    )}
    {...props}
  />
));
DropdownMenuItem.displayName = "DropdownMenuItem";

export const DropdownMenuCheckboxItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.CheckboxItem>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.CheckboxItem>
>(({ className, children, checked, ...props }, ref) => (
  <DropdownMenuPrimitive.CheckboxItem
    ref={ref}
    checked={checked}
    className={cn(
      "relative flex cursor-pointer select-none items-center rounded-xl py-2 pl-8 pr-3 text-[13px] font-medium outline-none transition-colors",
      "text-[var(--text-secondary)] focus:bg-[var(--bg-raised)] focus:text-[var(--text-primary)]",
      "data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className
    )}
    {...props}
  >
    <span className="absolute left-2.5 flex h-3.5 w-3.5 items-center justify-center">
      <DropdownMenuPrimitive.ItemIndicator>
        <Check className="h-3.5 w-3.5" />
      </DropdownMenuPrimitive.ItemIndicator>
    </span>
    {children}
  </DropdownMenuPrimitive.CheckboxItem>
));
DropdownMenuCheckboxItem.displayName = "DropdownMenuCheckboxItem";

export const DropdownMenuSubTrigger = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.SubTrigger>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.SubTrigger>
>(({ className, children, ...props }, ref) => (
  <DropdownMenuPrimitive.SubTrigger
    ref={ref}
    className={cn(
      "group flex cursor-pointer select-none items-center justify-between gap-2 rounded-xl px-3 py-2 text-[13px] font-medium outline-none transition-colors duration-150",
      "text-[var(--text-secondary)] focus:bg-[var(--bg-raised)] focus:text-[var(--text-primary)]",
      "data-[state=open]:bg-[var(--bg-raised)] data-[state=open]:text-[var(--text-primary)]",
      className
    )}
    {...props}
  >
    {children}
    <ChevronRight className="ml-auto h-3.5 w-3.5 shrink-0 opacity-60" />
  </DropdownMenuPrimitive.SubTrigger>
));
DropdownMenuSubTrigger.displayName = "DropdownMenuSubTrigger";

export const DropdownMenuLabel = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Label> & {
    inset?: boolean;
  }
>(({ className, inset, ...props }, ref) => (
  <DropdownMenuPrimitive.Label
    ref={ref}
    className={cn(
      "px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]",
      inset && "pl-8",
      className
    )}
    {...props}
  />
));
DropdownMenuLabel.displayName = "DropdownMenuLabel";

export const DropdownMenuSeparator = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <DropdownMenuPrimitive.Separator
    ref={ref}
    className={cn("-mx-1 my-1 h-px bg-[var(--border)]", className)}
    {...props}
  />
));
DropdownMenuSeparator.displayName = "DropdownMenuSeparator";

export const DropdownMenuShortcut = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) => (
  <span
    className={cn(
      "ml-auto text-[11px] font-medium tracking-wide text-[var(--text-muted)]",
      className
    )}
    {...props}
  />
);
DropdownMenuShortcut.displayName = "DropdownMenuShortcut";

/* ------------------------------------------------------------------ */
/*  Demo                                                               */
/* ------------------------------------------------------------------ */
export interface RadixDropdownMenuDemoProps {
  side?: "top" | "bottom" | "left" | "right";
  sideOffset?: number;
  align?: "start" | "center" | "end";
  alignOffset?: number;
}

export function RadixDropdownMenuDemo({
  side,
  sideOffset,
  align,
  alignOffset,
}: RadixDropdownMenuDemoProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="rounded-xl border border-[var(--border-strong)] px-4 py-2 text-[13px] font-semibold text-[var(--text-primary)]">
          Open
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-56"
        align={align}
        alignOffset={alignOffset}
        side={side}
        sideOffset={sideOffset}
      >
        <DropdownMenuLabel>My Account</DropdownMenuLabel>
        <DropdownMenuGroup>
          <DropdownMenuItem>
            Profile
            <DropdownMenuShortcut>⇧⌘P</DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuItem>
            Billing
            <DropdownMenuShortcut>⌘B</DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuItem>
            Settings
            <DropdownMenuShortcut>⌘S</DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuItem>
            Keyboard shortcuts
            <DropdownMenuShortcut>⌘K</DropdownMenuShortcut>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem>Team</DropdownMenuItem>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>Invite users</DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <DropdownMenuItem>Email</DropdownMenuItem>
              <DropdownMenuItem>Message</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>More...</DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
          <DropdownMenuItem>
            New Team
            <DropdownMenuShortcut>⌘+T</DropdownMenuShortcut>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem>GitHub</DropdownMenuItem>
        <DropdownMenuItem>Support</DropdownMenuItem>
        <DropdownMenuItem disabled>API</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive">
          Log out
          <DropdownMenuShortcut>⇧⌘Q</DropdownMenuShortcut>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
