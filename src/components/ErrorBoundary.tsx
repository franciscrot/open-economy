import React from 'react';

type ErrorBoundaryProps = {
  children: React.ReactNode;
};

type ErrorBoundaryState = {
  hasError: boolean;
  error?: Error;
};

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error) {
    console.error('Open Economy Lab failed to load.', error);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="app">
          <section className="panel error-boundary">
            <h1>Open Economy Lab</h1>
            <p>
              We hit a snag while loading the model. Try reloading the page, or reset any custom
              formulas if the issue persists.
            </p>
            <button type="button" onClick={this.handleReload}>
              Reload the lab
            </button>
            {this.state.error && (
              <pre className="error-boundary-details">{this.state.error.message}</pre>
            )}
          </section>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
