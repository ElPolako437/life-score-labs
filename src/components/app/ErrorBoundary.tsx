import React from 'react';

interface State {
  hasError: boolean;
  errorMessage: string;
}

export default class ErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, errorMessage: error?.message || 'Unbekannter Fehler' };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('ErrorBoundary caught:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-background px-6 text-center gap-5">
          <div className="w-14 h-14 rounded-full bg-destructive/10 border border-destructive/20 flex items-center justify-center text-2xl">
            ⚠️
          </div>
          <div className="space-y-2">
            <h2 className="font-outfit text-lg font-bold text-foreground">Etwas ist schiefgelaufen</h2>
            <p className="text-sm text-muted-foreground max-w-xs">
              Ein unerwarteter Fehler ist aufgetreten. Bitte lade die Seite neu.
            </p>
            {this.state.errorMessage && (
              <p className="text-xs text-muted-foreground/60 font-mono bg-secondary/40 rounded px-3 py-1.5 mt-2 max-w-xs break-words">
                {this.state.errorMessage}
              </p>
            )}
          </div>
          <button
            onClick={() => window.location.reload()}
            className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors"
          >
            Seite neu laden
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
