import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { ToastItem, ToastType, ToastContainer } from '../components/common/Toast';

export interface ToastOptions {
  type?: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

interface ToastContextValue {
  showToast: (options: ToastOptions) => string;
  success: (title: string, message?: string, duration?: number) => string;
  error: (title: string, message?: string, duration?: number) => string;
  warning: (title: string, message?: string, duration?: number) => string;
  info: (title: string, message?: string, duration?: number) => string;
  dismissToast: (id: string) => void;
  clearAll: () => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

// Global event bus for triggering toasts outside React context tree if needed
type ToastListener = (action: { type: 'add'; item: ToastItem } | { type: 'remove'; id: string } | { type: 'clear' }) => void;
const listeners = new Set<ToastListener>();

let idCounter = 0;
const generateId = () => `toast_${Date.now()}_${++idCounter}`;

/**
 * Global toast dispatcher usable anywhere (even outside React components)
 */
export const toast = {
  show: (options: ToastOptions): string => {
    const id = generateId();
    const item: ToastItem = {
      id,
      type: options.type || 'info',
      title: options.title,
      message: options.message,
      duration: options.duration ?? 2800,
    };
    listeners.forEach((listener) => listener({ type: 'add', item }));
    return id;
  },
  success: (title: string, message?: string, duration?: number): string => {
    return toast.show({ type: 'success', title, message, duration });
  },
  error: (title: string, message?: string, duration?: number): string => {
    return toast.show({ type: 'error', title, message, duration });
  },
  warning: (title: string, message?: string, duration?: number): string => {
    return toast.show({ type: 'warning', title, message, duration });
  },
  info: (title: string, message?: string, duration?: number): string => {
    return toast.show({ type: 'info', title, message, duration });
  },
  dismiss: (id: string) => {
    listeners.forEach((listener) => listener({ type: 'remove', id }));
  },
  clearAll: () => {
    listeners.forEach((listener) => listener({ type: 'clear' }));
  },
};

/**
 * Standardized Authentication Toasts according to Yadman specifications:
 * 1. Customer Login: "خوش آمدید 🌿" / "با موفقیت وارد حساب کاربری شدید"
 * 2. Customer Register: "خوش آمدید 🌿" / "حساب کاربری شما با موفقیت ایجاد شد"
 * 3. Logout: "با موفقیت خارج شدید" / "امیدواریم به‌زودی دوباره ببینیمتان 🌿"
 */
export const authToast = {
  loginSuccess: () => {
    return toast.success('خوش آمدید 🌿', 'با موفقیت وارد حساب کاربری شدید');
  },
  registerSuccess: () => {
    return toast.success('خوش آمدید 🌿', 'حساب کاربری شما با موفقیت ایجاد شد');
  },
  logoutSuccess: () => {
    return toast.success('با موفقیت خارج شدید', 'امیدواریم به‌زودی دوباره ببینیمتان 🌿');
  },
  loginError: (message?: string) => {
    return toast.error('خطا در ورود', message || 'ایمیل/شماره موبایل یا رمز عبور اشتباه است.');
  },
  registerError: (message?: string) => {
    return toast.error('خطا در ثبت‌نام', message || 'خطایی در ساخت حساب کاربری رخ داد.');
  },
  logoutError: (message?: string) => {
    return toast.error('خطا در خروج', message || 'مشکلی در خروج از حساب کاربری پیش آمد.');
  },
};

interface ToastProviderProps {
  children: ReactNode;
}

export const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setToasts([]);
  }, []);

  const showToast = useCallback(
    (options: ToastOptions): string => {
      const id = generateId();
      const item: ToastItem = {
        id,
        type: options.type || 'info',
        title: options.title,
        message: options.message,
        duration: options.duration ?? 2800,
      };

      setToasts((prev) => {
        // Cap max simultaneous toasts at 3 to prevent clutter
        const next = [item, ...prev];
        return next.slice(0, 3);
      });

      return id;
    },
    []
  );

  const success = useCallback(
    (title: string, message?: string, duration?: number) => {
      return showToast({ type: 'success', title, message, duration });
    },
    [showToast]
  );

  const error = useCallback(
    (title: string, message?: string, duration?: number) => {
      return showToast({ type: 'error', title, message, duration });
    },
    [showToast]
  );

  const warning = useCallback(
    (title: string, message?: string, duration?: number) => {
      return showToast({ type: 'warning', title, message, duration });
    },
    [showToast]
  );

  const info = useCallback(
    (title: string, message?: string, duration?: number) => {
      return showToast({ type: 'info', title, message, duration });
    },
    [showToast]
  );

  // Subscribe to global singleton dispatcher
  useEffect(() => {
    const handleAction: ToastListener = (action) => {
      if (action.type === 'add') {
        setToasts((prev) => {
          const next = [action.item, ...prev.filter((t) => t.id !== action.item.id)];
          return next.slice(0, 3);
        });
      } else if (action.type === 'remove') {
        dismissToast(action.id);
      } else if (action.type === 'clear') {
        clearAll();
      }
    };

    listeners.add(handleAction);
    return () => {
      listeners.delete(handleAction);
    };
  }, [dismissToast, clearAll]);

  const value: ToastContextValue = {
    showToast,
    success,
    error,
    warning,
    info,
    dismissToast,
    clearAll,
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextValue => {
  const context = useContext(ToastContext);
  if (!context) {
    // Graceful fallback to static dispatcher if used outside Provider
    return {
      showToast: toast.show,
      success: toast.success,
      error: toast.error,
      warning: toast.warning,
      info: toast.info,
      dismissToast: toast.dismiss,
      clearAll: toast.clearAll,
    };
  }
  return context;
};
