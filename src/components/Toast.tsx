import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaCheckCircle, FaExclamationTriangle, FaInfoCircle, FaTimes, FaTimesCircle } from 'react-icons/fa';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

interface ToastProps {
  toast: Toast;
  onClose: (id: string) => void;
  isDark: boolean;
}

function ToastItem({ toast, onClose, isDark }: ToastProps) {
  useEffect(() => {
    if (toast.duration !== 0) {
      const timer = setTimeout(() => {
        onClose(toast.id);
      }, toast.duration || 5000);
      return () => clearTimeout(timer);
    }
  }, [toast.id, toast.duration, onClose]);

  const icons = {
    success: FaCheckCircle,
    error: FaTimesCircle,
    warning: FaExclamationTriangle,
    info: FaInfoCircle,
  };

  const colors = {
    success: {
      bg: isDark ? 'bg-green-900/90' : 'bg-green-50',
      border: isDark ? 'border-green-700' : 'border-green-200',
      text: isDark ? 'text-green-100' : 'text-green-800',
      icon: 'text-green-500',
    },
    error: {
      bg: isDark ? 'bg-red-900/90' : 'bg-red-50',
      border: isDark ? 'border-red-700' : 'border-red-200',
      text: isDark ? 'text-red-100' : 'text-red-800',
      icon: 'text-red-500',
    },
    warning: {
      bg: isDark ? 'bg-yellow-900/90' : 'bg-yellow-50',
      border: isDark ? 'border-yellow-700' : 'border-yellow-200',
      text: isDark ? 'text-yellow-100' : 'text-yellow-800',
      icon: 'text-yellow-500',
    },
    info: {
      bg: isDark ? 'bg-blue-900/90' : 'bg-blue-50',
      border: isDark ? 'border-blue-700' : 'border-blue-200',
      text: isDark ? 'text-blue-100' : 'text-blue-800',
      icon: 'text-blue-500',
    },
  };

  const Icon = icons[toast.type];
  const color = colors[toast.type];

  return (
    <motion.div
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
      className={`flex items-start gap-3 p-3 sm:p-4 rounded-lg border shadow-lg backdrop-blur-sm max-w-sm w-full ${color.bg} ${color.border} ${color.text}`}
    >
      <Icon className={`flex-shrink-0 w-5 h-5 sm:w-6 sm:h-6 mt-0.5 ${color.icon}`} />
      <p className="flex-1 text-xs sm:text-sm font-medium leading-relaxed break-words">
        {toast.message}
      </p>
      <button
        onClick={() => onClose(toast.id)}
        className={`flex-shrink-0 p-1 rounded-md transition-colors ${isDark ? 'hover:bg-white/10' : 'hover:bg-black/5'}`}
        aria-label="Fechar"
      >
        <FaTimes className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
      </button>
    </motion.div>
  );
}

interface ToastContainerProps {
  toasts: Toast[];
  onClose: (id: string) => void;
  isDark: boolean;
}

export function ToastContainer({ toasts, onClose, isDark }: ToastContainerProps) {
  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-sm px-3 sm:px-4 pointer-events-none">
      <div className="flex flex-col gap-2 sm:gap-3 pointer-events-auto">
        <AnimatePresence>
          {toasts.map((toast) => (
            <ToastItem key={toast.id} toast={toast} onClose={onClose} isDark={isDark} />
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

