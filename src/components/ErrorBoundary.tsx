import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error captured by ErrorBoundary:", error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 p-6 font-sans">
          <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-700 p-8 text-center">
            <div className="w-16 h-16 bg-rose-50 dark:bg-rose-950/30 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="w-8 h-8 text-rose-500 dark:text-rose-400" />
            </div>
            
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight mb-2">
              Something went wrong
            </h1>
            
            <p className="text-slate-500 dark:text-slate-400 text-sm mb-6 leading-relaxed">
              An unexpected error occurred while rendering the application. We have safely caught it to prevent a total system crash.
            </p>

            {this.state.error && (
              <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-4 mb-6 text-left border border-slate-100 dark:border-slate-800">
                <p className="text-xs font-mono text-rose-600 dark:text-rose-400 break-all font-semibold">
                  {this.state.error.name}: {this.state.error.message}
                </p>
              </div>
            )}

            <button
              onClick={this.handleReset}
              className="w-full flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 active:scale-[0.98] transition-all text-white font-semibold py-3 px-6 rounded-xl shadow-md shadow-emerald-500/10 cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              Reload Application
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
