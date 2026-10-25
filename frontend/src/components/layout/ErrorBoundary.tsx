import React from 'react';
import { RefreshCw, RotateCcw, Home, Sparkles } from 'lucide-react';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  message: string;
  errorInfo?: string;
}

/**
 * Friendly, resilient Error Boundary.
 * Catches render crashes, displays comforting human-centric messaging with high contrast,
 * and tucks technical stack traces inside a collapsed details disclosure.
 */
export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false, message: '' };

  static getDerivedStateFromError(error: unknown): State {
    return {
      hasError: true,
      message: error instanceof Error ? error.message : String(error),
    };
  }

  componentDidCatch(error: unknown, info: React.ErrorInfo) {
    console.error('[ErrorBoundary] Caught render error:', error, info);
    this.setState({
      errorInfo: info?.componentStack || undefined,
    });
  }

  private handleReload = () => {
    try {
      const keys = ['retentio_local_expenses', 'retentio_local_invoices', 'retentio_local_payments'];
      keys.forEach((key) => {
        const raw = localStorage.getItem(key);
        if (raw) {
          try {
            const arr = JSON.parse(raw);
            if (Array.isArray(arr)) {
              const clean = arr.filter((item) => item != null && typeof item === 'object' && item.id);
              localStorage.setItem(key, JSON.stringify(clean));
            }
          } catch {}
        }
      });
    } catch {}
    this.setState({ hasError: false, message: '' });
    window.location.reload();
  };

  private handleGoDashboard = () => {
    this.setState({ hasError: false, message: '' });
    window.location.href = '/dashboard';
  };

  private handleClearAndReload = () => {
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && (k.startsWith('retentio_local_') || k.startsWith('retentio_clean_') || k.includes('cache'))) {
          keysToRemove.push(k);
        }
      }
      keysToRemove.forEach((k) => localStorage.removeItem(k));
    } catch {}
    this.setState({ hasError: false, message: '' });
    window.location.href = '/dashboard';
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          width: '100%',
          padding: '24px 16px',
          boxSizing: 'border-box',
          background: 'var(--bg, #090d16)',
          color: 'var(--text-primary, #ffffff)',
          fontFamily: 'var(--font-sans, system-ui, -apple-system, sans-serif)',
        }}
      >
        <div
          style={{
            maxWidth: 520,
            width: '100%',
            background: 'var(--bg-card, #111827)',
            border: '1px solid var(--border, rgba(255, 255, 255, 0.08))',
            borderRadius: 20,
            padding: '36px 28px',
            boxShadow: '0 20px 45px rgba(0, 0, 0, 0.4)',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            boxSizing: 'border-box',
          }}
        >
          {/* Calm friendly icon badge */}
          <div
            style={{
              width: 58,
              height: 58,
              borderRadius: '50%',
              background: 'rgba(34, 197, 94, 0.12)',
              border: '1px solid rgba(34, 197, 94, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 20,
              color: '#22c55e',
            }}
          >
            <Sparkles size={28} />
          </div>

          {/* High-contrast empathetic headline */}
          <h2
            style={{
              fontSize: 22,
              fontWeight: 800,
              color: 'var(--text-primary, #ffffff)',
              margin: '0 0 10px',
              letterSpacing: '-0.02em',
            }}
          >
            Workspace Encountered a Quick Pause
          </h2>

          {/* Reassuring human-centric copy */}
          <p
            style={{
              fontSize: 14,
              color: 'var(--text-secondary, #94a3b8)',
              margin: '0 0 24px',
              lineHeight: 1.6,
              maxWidth: 420,
            }}
          >
            Don't worry — your data and configurations are completely safe. A quick reload
            or returning to the dashboard will restore your session seamlessly.
          </p>

          {/* Recovery Actions */}
          <div
            style={{
              display: 'flex',
              gap: 10,
              flexWrap: 'wrap',
              justifyContent: 'center',
              width: '100%',
              marginBottom: 20,
            }}
          >
            <button
              onClick={this.handleReload}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '11px 22px',
                background: 'var(--solid-btn-bg, #22c55e)',
                color: 'var(--solid-btn-text, #ffffff)',
                border: 'none',
                borderRadius: 10,
                fontSize: 14,
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'transform 0.15s ease, opacity 0.15s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.92')}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
            >
              <RefreshCw size={15} />
              Reload Workspace
            </button>

            <button
              onClick={this.handleGoDashboard}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '11px 18px',
                background: 'var(--bg-subtle, rgba(255, 255, 255, 0.05))',
                color: 'var(--text-primary, #ffffff)',
                border: '1px solid var(--border, rgba(255, 255, 255, 0.1))',
                borderRadius: 10,
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'background 0.15s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-raised, rgba(255, 255, 255, 0.1))')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--bg-subtle, rgba(255, 255, 255, 0.05))')}
            >
              <Home size={15} />
              Dashboard
            </button>

            <button
              onClick={this.handleClearAndReload}
              title="Clears cached local data and re-syncs fresh state"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '11px 16px',
                background: 'transparent',
                color: 'var(--text-muted, #64748b)',
                border: '1px solid transparent',
                borderRadius: 10,
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'color 0.15s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-secondary, #94a3b8)')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted, #64748b)')}
            >
              <RotateCcw size={14} />
              Reset Cache & Sync
            </button>
          </div>

          {/* Technical Diagnostics (Collapsible for Developers, hidden by default from users) */}
          {this.state.message && (
            <details
              style={{
                width: '100%',
                marginTop: 8,
                textAlign: 'left',
                borderTop: '1px solid var(--border, rgba(255, 255, 255, 0.08))',
                paddingTop: 14,
                fontSize: 12,
                color: 'var(--text-muted, #64748b)',
              }}
            >
              <summary
                style={{
                  cursor: 'pointer',
                  userSelect: 'none',
                  fontSize: 12,
                  fontWeight: 600,
                  color: 'var(--text-muted, #94a3b8)',
                  outline: 'none',
                }}
              >
                Technical diagnostics
              </summary>
              <div
                style={{
                  marginTop: 10,
                  padding: '10px 14px',
                  borderRadius: 8,
                  background: 'rgba(0, 0, 0, 0.3)',
                  border: '1px solid var(--border, rgba(255, 255, 255, 0.08))',
                  fontFamily: 'var(--font-mono, monospace)',
                  fontSize: 11,
                  color: 'var(--text-secondary, #cbd5e1)',
                  wordBreak: 'break-word',
                  whiteSpace: 'pre-wrap',
                  maxHeight: 180,
                  overflowY: 'auto',
                }}
              >
                {this.state.message}
                {this.state.errorInfo && `\n\nComponent Stack:${this.state.errorInfo}`}
              </div>
            </details>
          )}
        </div>
      </div>
    );
  }
}

export default ErrorBoundary;
