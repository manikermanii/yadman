import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, ChevronDown, ChevronUp } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  showDetails: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
    showDetails: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null, showDetails: false };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in application component tree:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  private handleGoHome = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.href = '/';
  };

  private toggleDetails = () => {
    this.setState((prev) => ({ showDetails: !prev.showDetails }));
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div
          dir="rtl"
          className="min-h-screen bg-[#FAF8F5] text-[#1C2826] font-sans flex items-center justify-center p-4 sm:p-6"
        >
          <div className="max-w-md w-full bg-white rounded-3xl border border-[#EAE6DF] shadow-xl p-6 sm:p-8 text-center animate-fadeIn">
            <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center mx-auto mb-5 shadow-xs">
              <AlertTriangle className="w-8 h-8" />
            </div>

            <h1 className="text-xl font-bold text-[#0F4C3A] mb-2">
              مشکلی در بارگذاری پیش آمد
            </h1>

            <p className="text-xs sm:text-sm text-[#6A7873] leading-relaxed mb-6">
              متأسفانه خطایی در اجرای صفحه رخ داده است. جای نگرانی نیست؛ اطلاعات شما محفوظ است. می‌توانید صفحه را تازه کنید یا به صفحه اصلی برگردید.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-3 mb-4">
              <button
                onClick={this.handleReset}
                className="w-full sm:flex-1 py-3 px-4 bg-[#0F4C3A] hover:bg-[#0B3C2E] text-white rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition cursor-pointer shadow-2xs"
                id="error-boundary-reload-btn"
              >
                <RefreshCw className="w-4 h-4" />
                <span>بارگذاری مجدد صفحه</span>
              </button>

              <button
                onClick={this.handleGoHome}
                className="w-full sm:flex-1 py-3 px-4 bg-[#F4EFE6] hover:bg-[#EAE6DF] text-[#0F4C3A] rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition cursor-pointer"
                id="error-boundary-home-btn"
              >
                <Home className="w-4 h-4 text-[#D4AF37]" />
                <span>صفحه اصلی</span>
              </button>
            </div>

            {/* Error Technical Details (Collapsible) */}
            {this.state.error && (
              <div className="mt-4 pt-4 border-t border-[#EAE6DF] text-right">
                <button
                  onClick={this.toggleDetails}
                  className="flex items-center justify-between w-full text-[11px] text-[#6A7873] hover:text-[#0F4C3A] py-1 transition"
                  id="error-boundary-details-btn"
                >
                  <span>جزئیات فنی خطا</span>
                  {this.state.showDetails ? (
                    <ChevronUp className="w-3.5 h-3.5" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5" />
                  )}
                </button>

                {this.state.showDetails && (
                  <div className="mt-2 p-3 bg-[#FAF8F5] border border-[#EAE6DF] rounded-xl font-mono text-[10px] text-rose-700 overflow-x-auto text-left ltr max-h-40">
                    <p className="font-bold">{this.state.error.toString()}</p>
                    {this.state.errorInfo?.componentStack && (
                      <pre className="mt-1.5 whitespace-pre-wrap text-[#6A7873]">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
