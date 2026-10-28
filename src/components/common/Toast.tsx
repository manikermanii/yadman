import React, { useEffect, useState } from 'react';
import { Check, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastItem {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

interface ToastCardProps {
  toast: ToastItem;
  onDismiss: (id: string) => void;
}

export const ToastCard: React.FC<ToastCardProps> = ({ toast, onDismiss }) => {
  const duration = toast.duration ?? 2800;
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (isPaused) return;

    const timer = setTimeout(() => {
      onDismiss(toast.id);
    }, duration);

    return () => clearTimeout(timer);
  }, [toast.id, duration, onDismiss, isPaused]);

  // Color tokens and icon configuration
  const config = {
    success: {
      cardBg: 'bg-[#FAF8F5]/98 border-[#0F4C3A]/20 ring-1 ring-[#D4AF37]/35 shadow-[#0F4C3A]/10',
      iconBg: 'bg-[#0F4C3A] text-[#D4AF37] ring-2 ring-[#D4AF37]/20',
      titleColor: 'text-[#0F4C3A]',
      msgColor: 'text-[#556560]',
      progressBg: 'bg-[#D4AF37]',
      Icon: Check,
    },
    error: {
      cardBg: 'bg-[#FFF9F9]/98 border-rose-200 ring-1 ring-rose-400/25 shadow-rose-900/10',
      iconBg: 'bg-rose-600 text-white ring-2 ring-rose-200',
      titleColor: 'text-rose-950',
      msgColor: 'text-rose-700',
      progressBg: 'bg-rose-500',
      Icon: AlertCircle,
    },
    warning: {
      cardBg: 'bg-[#FFFDF7]/98 border-amber-200 ring-1 ring-amber-400/30 shadow-amber-900/10',
      iconBg: 'bg-amber-500 text-white ring-2 ring-amber-200',
      titleColor: 'text-amber-950',
      msgColor: 'text-amber-800',
      progressBg: 'bg-amber-500',
      Icon: AlertTriangle,
    },
    info: {
      cardBg: 'bg-[#F7FAFC]/98 border-sky-200 ring-1 ring-sky-400/25 shadow-sky-900/10',
      iconBg: 'bg-sky-600 text-white ring-2 ring-sky-200',
      titleColor: 'text-sky-950',
      msgColor: 'text-sky-700',
      progressBg: 'bg-sky-500',
      Icon: Info,
    },
  }[toast.type];

  const { Icon } = config;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -18, scale: 0.94 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -12, scale: 0.94, transition: { duration: 0.2 } }}
      transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className={`pointer-events-auto w-full max-w-sm sm:max-w-md backdrop-blur-md rounded-2xl border shadow-xl p-3.5 relative overflow-hidden transition-shadow select-none ${config.cardBg}`}
      role="status"
      aria-live="polite"
      id={`toast-${toast.id}`}
    >
      <div className="flex items-start gap-3">
        {/* Type Icon Badge */}
        <div
          className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-xs ${config.iconBg}`}
        >
          <Icon className="w-4 h-4 stroke-[2.5]" />
        </div>

        {/* Text Content */}
        <div className="flex-1 min-w-0 pt-0.5 text-right">
          <h4 className={`text-xs sm:text-sm font-extrabold leading-snug ${config.titleColor}`}>
            {toast.title}
          </h4>
          {toast.message && (
            <p className={`text-[11px] sm:text-xs leading-relaxed mt-0.5 ${config.msgColor}`}>
              {toast.message}
            </p>
          )}
        </div>

        {/* Subtle Dismiss Button */}
        <button
          type="button"
          onClick={() => onDismiss(toast.id)}
          className="text-[#889893] hover:text-[#1C2826] p-1 -mr-1 -mt-1 rounded-lg hover:bg-black/5 transition cursor-pointer shrink-0"
          aria-label="بستن اعلان"
          id={`toast-dismiss-${toast.id}`}
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Micro Progress Bar */}
      <div className="absolute bottom-0 inset-x-0 h-[2.5px] bg-black/5 overflow-hidden">
        <motion.div
          initial={{ width: '100%' }}
          animate={{ width: isPaused ? undefined : '0%' }}
          transition={{ duration: duration / 1000, ease: 'linear' }}
          className={`h-full ${config.progressBg}`}
        />
      </div>
    </motion.div>
  );
};

interface ToastContainerProps {
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onDismiss }) => {
  return (
    <div
      dir="rtl"
      className="fixed top-5 left-1/2 -translate-x-1/2 z-[9999] flex flex-col items-center gap-2.5 pointer-events-none px-4 w-full max-w-sm sm:max-w-md"
      aria-label="اعلان‌های سیستم"
    >
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <ToastCard key={toast.id} toast={toast} onDismiss={onDismiss} />
        ))}
      </AnimatePresence>
    </div>
  );
};
