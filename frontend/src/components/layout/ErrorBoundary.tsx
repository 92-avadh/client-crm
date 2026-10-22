import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  message: string;
}

/**
 * Catches render-time crashes so the user sees a recoverable message
 * instead of a blank white screen. The real error is logged for developers.
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
    console.error('[ErrorBoundary] Uncaught render error:', error, info);
  }

  private handleReload = () => {
    this.setState({ hasError: false, message: '' });
    window.location.reload();
  };

  private handleClearAndReload = () => {
    try {
      localStorage.removeItem('retentio_local_brands');
      localStorage.removeItem('retentio_local_users');
      localStorage.removeItem('retentio_local_projects');
      localStorage.removeItem('retentio_local_tasks');
    } catch {}
    this.setState({ hasError: false, message: '' });
    window.location.reload();
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
          flex: 1,
          textAlign: 'center',
          padding: 24,
          boxSizing: 'border-box',
          color: 'var(--text-primary)',
        }}
      >
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: '50%',
            background: 'var(--danger-bg)',
            border: '1px solid var(--danger-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 18,
          }}
        >
          <AlertTriangle size={26} style={{ color: 'var(--danger-text)' }} />
        </div>

        <h2 style={{ fontSize: 20, fontWeight: 800, margin: '0 0 8px' }}>
          Something went wrong
        </h2>
        <p
          style={{
            fontSize: 14,
            color: 'var(--text-secondary)',
            margin: '0 0 16px',
            maxWidth: 420,
            lineHeight: 1.6,
          }}
        >
          This page ran into an unexpected problem. Reloading usually fixes it —
          if it keeps happening, please reset cache or check server status.
        </p>

        {this.state.message && (
          <div
            style={{
              fontSize: 12,
              fontFamily: 'monospace',
              color: 'var(--danger-text)',
              background: 'var(--danger-bg)',
              border: '1px solid var(--danger-border)',
              borderRadius: 8,
              padding: '8px 14px',
              maxWidth: 480,
              margin: '0 0 20px',
              wordBreak: 'break-word',
            }}
          >
            {this.state.message}
          </div>
        )}

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
          <button
            onClick={this.handleReload}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '10px 20px',
              background: 'var(--solid-btn-bg)',
              color: 'var(--solid-btn-text)',
              border: 'none',
              borderRadius: 10,
              fontSize: 14,
              fontWeight: 700,
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            <RefreshCw size={15} />
            Reload page
          </button>
          <button
            onClick={this.handleClearAndReload}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '10px 16px',
              background: 'var(--bg-subtle)',
              color: 'var(--text-secondary)',
              border: '1px solid var(--border)',
              borderRadius: 10,
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            Reset cache & reload
          </button>
        </div>
      </div>
    );
  }
}

export default ErrorBoundary;
