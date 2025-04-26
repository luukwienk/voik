import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null 
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Je kunt hier loggen naar een externe service
    console.error("Error caught by boundary:", error, errorInfo);
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
  }

  render() {
    if (this.state.hasError) {
      // Toon een nette fallback UI
      return (
        <div style={{
          padding: '20px',
          maxWidth: '800px',
          margin: '0 auto',
          backgroundColor: '#fff0f0',
          border: '1px solid #ffcccc',
          borderRadius: '8px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
        }}>
          <h2 style={{ color: '#cc0000' }}>Er is iets misgegaan.</h2>
          <p>De applicatie heeft een fout gevonden. Je kunt proberen de pagina te verversen.</p>
          
          <details style={{ 
            marginTop: '20px', 
            backgroundColor: '#f5f5f5',
            padding: '10px',
            borderRadius: '4px'
          }}>
            <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>
              Foutdetails (voor ontwikkelaars)
            </summary>
            <p style={{ marginTop: '10px', fontFamily: 'monospace' }}>
              {this.state.error && this.state.error.toString()}
            </p>
            <div style={{ marginTop: '10px' }}>
              <p style={{ fontWeight: 'bold' }}>Component Stack:</p>
              <pre style={{ 
                whiteSpace: 'pre-wrap', 
                backgroundColor: '#333', 
                color: '#fff',
                padding: '10px',
                borderRadius: '4px',
                overflowX: 'auto'
              }}>
                {this.state.errorInfo && this.state.errorInfo.componentStack}
              </pre>
            </div>
          </details>
          
          <button 
            onClick={() => window.location.reload()} 
            style={{ 
              marginTop: '20px',
              padding: '10px 15px',
              backgroundColor: '#2196F3',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Pagina verversen
          </button>
        </div>
      );
    }
    // Geen fout: render children normaal
    return this.props.children;
  }
}

export default ErrorBoundary; 