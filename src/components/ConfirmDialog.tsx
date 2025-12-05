import { motion, AnimatePresence } from 'framer-motion';
import { FaExclamationTriangle, FaInfoCircle, FaTimes } from 'react-icons/fa';

export type ConfirmType = 'danger' | 'warning' | 'info';

export interface ConfirmOptions {
  title: string;
  message: string;
  type?: ConfirmType;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel?: () => void;
}

interface ConfirmDialogProps {
  isOpen: boolean;
  options: ConfirmOptions | null;
  onClose: () => void;
  isDark: boolean;
}

export function ConfirmDialog({ isOpen, options, onClose, isDark }: ConfirmDialogProps) {
  if (!options) return null;

  const handleConfirm = () => {
    options.onConfirm();
    onClose();
  };

  const handleCancel = () => {
    if (options.onCancel) {
      options.onCancel();
    }
    onClose();
  };

  const icons = {
    danger: FaExclamationTriangle,
    warning: FaExclamationTriangle,
    info: FaInfoCircle,
  };

  const colors = {
    danger: {
      icon: 'text-red-500',
      button: isDark ? 'bg-red-600 hover:bg-red-700' : 'bg-red-600 hover:bg-red-700',
    },
    warning: {
      icon: 'text-yellow-500',
      button: isDark ? 'bg-yellow-600 hover:bg-yellow-700' : 'bg-yellow-600 hover:bg-yellow-700',
    },
    info: {
      icon: 'text-blue-500',
      button: isDark ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-600 hover:bg-blue-700',
    },
  };

  const type = options.type || 'warning';
  const Icon = icons[type];
  const color = colors[type];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleCancel}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
          />

          {/* Dialog */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className={`w-full max-w-md rounded-xl sm:rounded-2xl shadow-2xl pointer-events-auto ${
                isDark ? 'bg-slate-800 border border-slate-700' : 'bg-white border border-slate-200'
              }`}
            >
              {/* Header */}
              <div className="flex items-start gap-3 sm:gap-4 p-4 sm:p-5 border-b border-slate-200 dark:border-slate-700">
                <div className={`flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center ${
                  isDark ? 'bg-slate-700' : 'bg-slate-100'
                }`}>
                  <Icon className={`w-5 h-5 sm:w-6 sm:h-6 ${color.icon}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className={`text-base sm:text-lg font-semibold mb-1 ${
                    isDark ? 'text-white' : 'text-slate-900'
                  }`}>
                    {options.title}
                  </h3>
                  <p className={`text-xs sm:text-sm leading-relaxed ${
                    isDark ? 'text-slate-300' : 'text-slate-600'
                  }`}>
                    {options.message}
                  </p>
                </div>
                <button
                  onClick={handleCancel}
                  className={`flex-shrink-0 p-1.5 rounded-md transition-colors ${
                    isDark ? 'hover:bg-slate-700 text-slate-400' : 'hover:bg-slate-100 text-slate-500'
                  }`}
                  aria-label="Fechar"
                >
                  <FaTimes className="w-4 h-4" />
                </button>
              </div>

              {/* Actions */}
              <div className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 p-4 sm:p-5">
                <button
                  onClick={handleCancel}
                  className={`flex-1 px-4 sm:px-6 py-2.5 sm:py-3 text-sm sm:text-base font-medium rounded-lg transition-colors ${
                    isDark
                      ? 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {options.cancelText || 'Cancelar'}
                </button>
                <button
                  onClick={handleConfirm}
                  className={`flex-1 px-4 sm:px-6 py-2.5 sm:py-3 text-sm sm:text-base font-medium text-white rounded-lg transition-colors ${color.button}`}
                >
                  {options.confirmText || 'Confirmar'}
                </button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}

