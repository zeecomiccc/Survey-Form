'use client';

import { useEffect } from 'react';
import { X, AlertTriangle } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm?: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'info' | 'warning';
  showCancel?: boolean;
}

export default function Modal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'danger',
  showCancel = true,
}: ModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm();
    }
    onClose();
  };

  const typeStyles = {
    danger: {
      icon: 'text-red-600',
      button: 'bg-red-600 hover:bg-red-700 text-white',
      iconBg: 'bg-red-100',
    },
    warning: {
      icon: 'text-yellow-600',
      button: 'bg-yellow-600 hover:bg-yellow-700 text-white',
      iconBg: 'bg-yellow-100',
    },
    info: {
      icon: 'text-blue-600',
      button: 'bg-blue-600 hover:bg-blue-700 text-white',
      iconBg: 'bg-blue-100',
    },
  };

  const styles = typeStyles[type];

  return (
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black bg-opacity-50 animate-in fade-in duration-200"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      aria-describedby="modal-message"
    >
      <div
        className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-4">
          <div className={`flex-shrink-0 ${styles.iconBg} rounded-full p-3`}>
            <AlertTriangle size={24} className={styles.icon} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 id="modal-title" className="text-lg font-semibold text-gray-900 mb-2">
              {title}
            </h3>
            <p id="modal-message" className="text-sm text-gray-600 whitespace-pre-wrap">
              {message}
            </p>
          </div>
          <button
            onClick={onClose}
            className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close dialog"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex gap-3 mt-6 justify-end">
          {showCancel && (
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              {cancelText}
            </button>
          )}
          <button
            onClick={handleConfirm}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${styles.button}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

