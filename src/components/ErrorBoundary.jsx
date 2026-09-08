import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary capturou um erro:", error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--light-bg, #F8F7F4)',
          padding: '2rem'
        }}>
          <div style={{
            maxWidth: '520px',
            background: '#FFF',
            padding: '2.5rem',
            borderRadius: '20px',
            border: '1px solid var(--light-border, #E5E0D5)',
            boxShadow: '0 20px 40px rgba(0,0,0,0.08)',
            textAlign: 'center'
          }}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: 'rgba(239, 68, 68, 0.1)',
              color: '#EF4444',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.25rem'
            }}>
              <AlertTriangle size={32} />
            </div>

            <h2 style={{
              fontSize: '1.6rem',
              fontWeight: 800,
              fontFamily: 'var(--font-serif, serif)',
              color: 'var(--text-dark, #1A1A20)',
              marginBottom: '0.75rem'
            }}>
              Ops! Algo inesperado aconteceu.
            </h2>

            <p style={{
              fontSize: '0.9rem',
              color: 'var(--text-muted, #646473)',
              marginBottom: '1.75rem',
              lineHeight: '1.5'
            }}>
              Não se preocupe, seus dados estão seguros. Ocorreu uma oscilação temporária na interface.
            </p>

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <button
                onClick={this.handleReload}
                className="btn btn-outline"
                style={{ padding: '0.65rem 1.25rem', gap: '6px' }}
              >
                <RefreshCw size={16} /> Recarregar Página
              </button>
              <button
                onClick={this.handleGoHome}
                className="btn btn-primary"
                style={{ padding: '0.65rem 1.5rem', gap: '6px' }}
              >
                <Home size={16} /> Página Inicial
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
