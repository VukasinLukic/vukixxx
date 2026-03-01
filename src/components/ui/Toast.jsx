import React, { useEffect } from 'react';
import { Check, AlertCircle, Info, X } from 'lucide-react';
import './Toast.css';

const ICONS = {
    success: Check,
    error: AlertCircle,
    info: Info
};

export const Toast = ({ message, type = 'success', duration = 3000, onClose }) => {
    const Icon = ICONS[type] || Check;

    useEffect(() => {
        if (duration > 0) {
            const timer = setTimeout(onClose, duration);
            return () => clearTimeout(timer);
        }
    }, [duration, onClose]);

    return (
        <div className={`toast toast-${type}`}>
            <Icon size={16} className="toast-icon" />
            <span className="toast-message">{message}</span>
            <button className="toast-close" onClick={onClose}>
                <X size={14} />
            </button>
        </div>
    );
};

export const ToastContainer = ({ toasts, removeToast }) => {
    if (!toasts || toasts.length === 0) return null;

    return (
        <div className="toast-container">
            {toasts.map(toast => (
                <Toast
                    key={toast.id}
                    message={toast.message}
                    type={toast.type}
                    duration={toast.duration}
                    onClose={() => removeToast(toast.id)}
                />
            ))}
        </div>
    );
};
