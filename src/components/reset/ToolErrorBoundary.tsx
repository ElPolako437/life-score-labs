import { Component, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  /** Called when the user chooses to reset this tool's stored data. */
  onReset?: () => void;
}
interface State {
  hasError: boolean;
}

/**
 * Catches render errors inside a day tool (e.g. legacy/corrupt saved data after
 * a tool rewrite) so a single broken tool never blanks the whole app. Offers a
 * one-tap recovery that clears the tool's data and re-renders it fresh.
 */
export default class ToolErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    console.warn('[ToolErrorBoundary] caught tool error:', error);
  }

  handleReset = () => {
    this.props.onReset?.();
    this.setState({ hasError: false });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-5 rounded-2xl border border-border/50 bg-card/60 text-center">
          <p className="text-sm font-semibold text-foreground mb-1">Hier ist etwas durcheinandergeraten.</p>
          <p className="text-xs text-muted-foreground/70 mb-4 leading-relaxed">
            Kein Problem — setz diesen Tag einmal neu auf, dann läuft alles wieder.
          </p>
          <button
            onClick={this.handleReset}
            className="min-h-[44px] px-6 rounded-xl bg-primary text-primary-foreground font-semibold text-sm transition-all active:scale-[0.98]"
            style={{ boxShadow: '0 0 20px hsl(142 76% 46% / 0.3)' }}
          >
            Tag neu starten
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
