import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(_: Error): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('App crashed:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      const currentUrl = window.location.href;
      return (
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'hsl(222, 47%, 6%)',
            color: '#fff',
            fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
            padding: 24,
            textAlign: 'center',
          }}
        >
          <div style={{ maxWidth: 340 }}>
            <div style={{ fontSize: 48, marginBottom: 20 }}>⚠️</div>
            <h1 style={{ fontSize: 20, fontWeight: 700, margin: '0 0 12px' }}>
              Something went wrong
            </h1>
            <p style={{ fontSize: 14, color: '#9ca3af', lineHeight: 1.6, margin: '0 0 20px' }}>
              This browser may not be fully supported. Try opening in Safari or Chrome.
            </p>
            <button
              onClick={() => {
                if (navigator.clipboard && navigator.clipboard.writeText) {
                  navigator.clipboard.writeText(currentUrl);
                }
              }}
              style={{
                display: 'block',
                width: '100%',
                padding: '14px 16px',
                borderRadius: 12,
                background: 'linear-gradient(135deg, hsl(250,70%,50%), hsl(280,70%,50%))',
                color: '#fff',
                fontWeight: 600,
                fontSize: 14,
                border: 'none',
                cursor: 'pointer',
                marginBottom: 12,
              }}
            >
              Copy Linking
            </button>
            <button
              onClick={() => window.location.reload()}
              style={{
                background: 'none',
                border: 'none',
                color: '#9ca3af',
                fontSize: 14,
                cursor: 'pointer',
                padding: '12px 16px',
                width: '100%',
              }}
            >
              Try again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
