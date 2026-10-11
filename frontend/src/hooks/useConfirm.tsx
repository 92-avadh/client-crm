import * as React from 'react';
import { AlertTriangle, LogOut, Trash2, HelpCircle } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogPopup,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/animate-ui/components/base/alert-dialog';

export interface ConfirmOptions {
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  /** Renders the action button in the danger style. */
  destructive?: boolean;
  /** Chooses the header icon. Defaults to a warning triangle. */
  icon?: 'warning' | 'logout' | 'trash' | 'question';
}

const ICONS = {
  warning: AlertTriangle,
  logout: LogOut,
  trash: Trash2,
  question: HelpCircle,
} as const;

/**
 * Imperative confirmation dialog.
 *
 *   const confirm = useConfirm();
 *   if (await confirm({ title: 'Log out?' })) logout();
 *   ...
 *   {confirm.element}
 *
 * Uses the same spring-animated dialog as the rest of the app, so it replaces
 * window.confirm() without losing the animation.
 */
export function useConfirm() {
  const [options, setOptions] = React.useState<ConfirmOptions | null>(null);
  const resolver = React.useRef<((value: boolean) => void) | null>(null);

  const confirm = React.useCallback((opts: ConfirmOptions) => {
    setOptions(opts);
    return new Promise<boolean>((resolve) => {
      resolver.current = resolve;
    });
  }, []);

  const settle = React.useCallback((value: boolean) => {
    resolver.current?.(value);
    resolver.current = null;
    setOptions(null);
  }, []);

  const element = options ? (
    <AlertDialog open onOpenChange={(o) => { if (!o) settle(false); }}>
      <AlertDialogPopup from="bottom" className="sm:max-w-[440px]">
        <AlertDialogHeader>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {(() => {
              const Icon = ICONS[options.icon ?? (options.destructive ? 'warning' : 'question')];
              return (
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 10,
                    flexShrink: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: options.destructive ? 'var(--danger-bg)' : 'var(--bg-raised)',
                    color: options.destructive ? 'var(--danger-text)' : 'var(--text-primary)',
                  }}
                >
                  <Icon style={{ width: 18, height: 18 }} />
                </div>
              );
            })()}
            <div style={{ textAlign: 'left' }}>
              <AlertDialogTitle>{options.title}</AlertDialogTitle>
              {options.description && (
                <AlertDialogDescription>{options.description}</AlertDialogDescription>
              )}
            </div>
          </div>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{options.cancelText ?? 'Cancel'}</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => settle(true)}
            style={
              options.destructive
                ? { background: 'var(--danger-text)', color: 'var(--solid-btn-text)' }
                : undefined
            }
          >
            {options.confirmText ?? 'Confirm'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogPopup>
    </AlertDialog>
  ) : null;

  return { confirm, element };
}
