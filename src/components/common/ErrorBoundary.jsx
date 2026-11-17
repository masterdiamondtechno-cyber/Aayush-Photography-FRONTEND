import React from 'react';

/**
 * Global ErrorBoundary Component
 * Catches JavaScript errors anywhere in the child component tree,
 * logs them, and displays a graceful fallback UI instead of crashing the app.
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('🛑 [React ErrorBoundary Caught Error]:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/login';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen w-full items-center justify-center bg-[#090909] p-4 text-white">
          <div className="w-full max-w-lg rounded-2xl border border-[#303030] bg-[#141414] p-6 sm:p-8 text-center shadow-2xl backdrop-blur-xl">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#ffc629]/15 border border-[#ffc629]/40 text-[#FFC629] text-2xl font-bold">
              !
            </div>
            
            <h2 className="font-['Cinzel'] text-xl font-bold text-white mb-2">
              Something Went Wrong
            </h2>
            <p className="text-xs text-[#A0A0A0] leading-relaxed mb-6">
              An unexpected error occurred while rendering this page. You can reload the page or return to the sign in portal.
            </p>

            {this.state.error && (
              <div className="mb-6 rounded-xl bg-[#0a0a0a] border border-[#262626] p-3 text-left overflow-x-auto max-h-36">
                <p className="text-[11px] font-mono text-red-400">
                  {this.state.error.toString()}
                </p>
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                type="button"
                onClick={this.handleReset}
                className="w-full sm:w-auto rounded-xl bg-gradient-to-r from-[#FFC629] to-[#FFB703] px-6 py-2.5 text-xs font-bold text-black transition hover:opacity-90 shadow-md shadow-[#ffc629]/20"
              >
                Reload Page
              </button>
              <button
                type="button"
                onClick={this.handleGoHome}
                className="w-full sm:w-auto rounded-xl border border-[#404040] bg-[#202020] px-6 py-2.5 text-xs font-semibold text-white transition hover:bg-[#303030]"
              >
                Go to Sign In
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
