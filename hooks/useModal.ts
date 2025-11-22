'use client';

import { useState, useCallback } from 'react';

interface ModalOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'info' | 'warning';
  showCancel?: boolean;
}

export function useModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [modalOptions, setModalOptions] = useState<ModalOptions>({
    title: '',
    message: '',
  });
  const [onConfirmCallback, setOnConfirmCallback] = useState<(() => void) | null>(null);

  const openModal = useCallback((options: ModalOptions, onConfirm?: () => void) => {
    setModalOptions(options);
    setOnConfirmCallback(() => onConfirm || null);
    setIsOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setIsOpen(false);
    setModalOptions({ title: '', message: '' });
    setOnConfirmCallback(null);
  }, []);

  const confirm = useCallback(() => {
    if (onConfirmCallback) {
      onConfirmCallback();
    }
    closeModal();
  }, [onConfirmCallback, closeModal]);

  return {
    isOpen,
    modalOptions,
    openModal,
    closeModal,
    confirm,
  };
}

