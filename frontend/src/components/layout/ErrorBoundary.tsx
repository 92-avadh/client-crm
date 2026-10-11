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

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '60vh',
          textAlign: 'center',
          padding: 24,
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
            margin: '0 0 22px',
            maxWidth: 400,
            lineHeight: 1.6,
          }}
        >
          This page ran into an unexpected problem. Reloading usually fixes it —
          if it keeps happening, please contact support.
        </p>

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
      </div>
    );
  }
}

export default ErrorBoundary;
