import { createContext, useContext, useState, useCallback } from 'react';
import type { ReactNode } from 'react';
import type { Toast, ToastType } from '../components/Toast';
import type { ConfirmOptions } from '../components/ConfirmDialog';

interface ToastContextType {
  showToast: (message: string, type?: ToastType, duration?: number) => void;
  showSuccess: (message: string, duration?: number) => void;
  showError: (message: string, duration?: number) => void;
  showWarning: (message: string, duration?: number) => void;
  showInfo: (message: string, duration?: number) => void;
  confirm: (options: ConfirmOptions) => Promise<boolean>;
  toasts: Toast[];
  confirmOptions: ConfirmOptions | null;
  isConfirmOpen: boolean;
  closeConfirm: () => void;
  closeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [confirmOptions, setConfirmOptions] = useState<ConfirmOptions | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [confirmResolve, setConfirmResolve] = useState<((value: boolean) => void) | null>(null);

  const showToast = useCallback((message: string, type: ToastType = 'info', duration: number = 5000) => {
    const id = Math.random().toString(36).substring(7);
    const newToast: Toast = { id, message, type, duration };
    setToasts((prev) => [...prev, newToast]);
  }, []);

  const showSuccess = useCallback((message: string, duration?: number) => {
    showToast(message, 'success', duration);
  }, [showToast]);

  const showError = useCallback((message: string, duration?: number) => {
    showToast(message, 'error', duration);
  }, [showToast]);

  const showWarning = useCallback((message: string, duration?: number) => {
    showToast(message, 'warning', duration);
  }, [showToast]);

  const showInfo = useCallback((message: string, duration?: number) => {
    showToast(message, 'info', duration);
  }, [showToast]);

  const confirm = useCallback((options: ConfirmOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setConfirmOptions(options);
      setIsConfirmOpen(true);
      setConfirmResolve(() => resolve);
    });
  }, []);

  const closeConfirm = useCallback(() => {
    setIsConfirmOpen(false);
    if (confirmResolve) {
      confirmResolve(false);
      setConfirmResolve(null);
    }
    setConfirmOptions(null);
  }, [confirmResolve]);

  const handleConfirm = useCallback(() => {
    if (confirmOptions) {
      confirmOptions.onConfirm();
      setIsConfirmOpen(false);
      if (confirmResolve) {
        confirmResolve(true);
        setConfirmResolve(null);
      }
      setConfirmOptions(null);
    }
  }, [confirmOptions, confirmResolve]);

  const closeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  // Atualiza o onConfirm do confirmOptions para usar handleConfirm
  const updatedConfirmOptions = confirmOptions
    ? { ...confirmOptions, onConfirm: handleConfirm }
    : null;

  return (
    <ToastContext.Provider
      value={{
        showToast,
        showSuccess,
        showError,
        showWarning,
        showInfo,
        confirm,
        toasts,
        confirmOptions: updatedConfirmOptions,
        isConfirmOpen,
        closeConfirm,
        closeToast,
      }}
    >
      {children}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
}

