import React, { Component, type ReactNode } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('CalorieSnap Error caught by ErrorBoundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#faf9f6',
          fontFamily: "'Inter', sans-serif",
          padding: 24,
          color: '#1e293b',
          textAlign: 'center',
        }}>
          <div style={{
            maxWidth: 480,
            backgroundColor: '#ffffff',
            borderRadius: 24,
            padding: 32,
            border: '1px solid #eaede9',
            boxShadow: '0 10px 30px rgba(0,0,0,0.08)',
          }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>⚠️</div>
            <h2 style={{ fontSize: 20, fontWeight: 800, margin: '0 0 8px 0' }}>Something went wrong</h2>
            <p style={{ color: '#64748b', fontSize: 14, margin: '0 0 16px 0', lineHeight: 1.5 }}>
              {this.state.error?.message || 'An unexpected rendering error occurred.'}
            </p>
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.reload();
              }}
              style={{
                backgroundColor: '#fdf0a6',
                border: '1px solid #fdf0a6',
                borderRadius: 20,
                padding: '10px 24px',
                fontWeight: 700,
                fontSize: 14,
                cursor: 'pointer',
              }}
            >
              Reload CalorieSnap
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
