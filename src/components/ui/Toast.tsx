import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, AlertCircle, Info, X } from 'lucide-react';
import type { ToastType, Toast as ToastData } from '@/types';
import type { LucideIcon } from 'lucide-react';
import './Toast.css';

const ICONS: Record<ToastType, LucideIcon> = {
  success: Check,
  error: AlertCircle,
  info: Info,
};

interface ToastProps {
  message: string;
  type?: ToastType;
  duration?: number;
  onClose: () => void;
}

export const Toast = React.forwardRef<HTMLDivElement, ToastProps>(
  ({ message, type = 'success', duration = 3000, onClose }, ref) => {
    const Icon = ICONS[type] || Check;

    useEffect(() => {
      if (duration > 0) {
        const timer = setTimeout(onClose, duration);
        return () => clearTimeout(timer);
      }
    }, [duration, onClose]);

    return (
      <motion.div
        ref={ref}
        className={`toast toast-${type}`}
        initial={{ opacity: 0, x: 100, scale: 0.9 }}
        animate={{ opacity: 1, x: 0, scale: 1 }}
        exit={{ opacity: 0, x: 100, scale: 0.9 }}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
      >
        <Icon size={16} className="toast-icon" />
        <span className="toast-message">{message}</span>
        <button className="toast-close" onClick={onClose}>
          <X size={14} />
        </button>
      </motion.div>
    );
  }
);

Toast.displayName = 'Toast';

interface ToastContainerProps {
  toasts: ToastData[];
  removeToast: (id: number) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, removeToast }) => {
  return (
    <div className="toast-container">
      <AnimatePresence mode="popLayout">
        {toasts.map(toast => (
          <Toast
            key={toast.id}
            message={toast.message}
            type={toast.type}
            duration={toast.duration}
            onClose={() => removeToast(toast.id)}
          />
        ))}
      </AnimatePresence>
    </div>
  );
};
