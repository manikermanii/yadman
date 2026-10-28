import React, { ReactNode } from 'react';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Uncaught component error in Yadman:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    } else {
      window.location.reload();
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div
          className="bg-[#FAF8F5] min-h-[60vh] flex flex-col items-center justify-center p-8 text-center space-y-4"
          dir="rtl"
        >
          <div className="w-16 h-16 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto shadow-sm">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-extrabold text-[#0F4C3A]">
            {this.props.fallbackTitle || 'خطایی در نمایش این بخش رخ داده است'}
          </h2>
          <p className="text-xs text-[#6A7873] max-w-md mx-auto leading-relaxed">
            لطفاً مجدداً تلاش فرمایید یا به صفحه اصلی بازگردید.
          </p>
          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={this.handleReset}
              className="bg-[#0F4C3A] hover:bg-[#0B3C2E] text-white px-5 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-xs cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>تلاش مجدد</span>
            </button>
            <button
              type="button"
              onClick={() => {
                window.location.href = '/';
              }}
              className="border border-[#0F4C3A] text-[#0F4C3A] hover:bg-[#0F4C3A]/5 px-5 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer"
            >
              <Home className="w-3.5 h-3.5" />
              <span>صفحه اصلی</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
