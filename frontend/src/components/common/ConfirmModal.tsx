import React, { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';

export interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  description?: string;
  children?: React.ReactNode;
  error?: string | null;
  confirmLabel?: string;
  loadingLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'primary';
  loading?: boolean;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
}

const VARIANT_STYLES = {
  danger: {
    iconWrap: 'bg-[#ffebe9] border-[#ff8182]/40 text-[#cf222e]',
    confirmBtn: 'bg-[#cf222e] hover:bg-[#a40e26] text-white',
  },
  warning: {
    iconWrap: 'bg-[#fff8c5] border-[#d4a72c]/40 text-[#9a6700]',
    confirmBtn: 'bg-[#9a6700] hover:bg-[#7d5300] text-white',
  },
  primary: {
    iconWrap: 'bg-[#ddf4ff] border-[#54aeff]/40 text-[#0969da]',
    confirmBtn: 'bg-[#1a7f37] hover:bg-[#1a7f37]/90 text-white',
  },
} as const;

/**
 * Reusable confirmation dialog modal with backdrop scroll lock and async loading state.
 */
export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  description,
  children,
  error,
  confirmLabel = 'Ya, Lanjutkan',
  loadingLabel = 'Memproses...',
  cancelLabel = 'Batal',
  variant = 'danger',
  loading = false,
  onConfirm,
  onCancel,
}) => {
  useBodyScrollLock(isOpen);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !loading) {
        onCancel();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, loading, onCancel]);

  const styles = VARIANT_STYLES[variant];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          onClick={() => {
            if (!loading) onCancel();
          }}
          className="no-print fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4"
          role="dialog"
          aria-modal="true"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="bg-white border border-[#d0d7de] shadow-2xl max-w-md w-full p-5 sm:p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-3.5">
              <div className={`p-2.5 border rounded-full shrink-0 ${styles.iconWrap}`}>
                {variant === 'danger' ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M12 9v2m0 4h.01M10.29 3.86l-7.5 13A1 1 0 003.65 18.5h16.7a1 1 0 00.86-1.5l-7.5-13a1 1 0 00-1.72 0z"
                    />
                  </svg>
                )}
              </div>
              <div className="min-w-0">
                <h3 className="font-bold text-base text-[#1f2328]">{title}</h3>
                {description && (
                  <p className="text-xs text-[#57606a] mt-0.5 leading-relaxed">{description}</p>
                )}
              </div>
            </div>

            {children}

            {error && (
              <div className="p-3 bg-[#ffebe9] border border-[#ff8182]/40 text-xs text-[#cf222e]">
                {error}
              </div>
            )}

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                disabled={loading}
                onClick={onCancel}
                className="px-4 py-2 border border-[#d0d7de] text-xs font-semibold text-[#1f2328] hover:bg-[#f6f8fa] transition-colors cursor-pointer disabled:opacity-50"
              >
                {cancelLabel}
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={onConfirm}
                className={`inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold transition-colors shadow-2xs cursor-pointer disabled:opacity-50 ${styles.confirmBtn}`}
              >
                {loading ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>{loadingLabel}</span>
                  </>
                ) : (
                  <span>{confirmLabel}</span>
                )}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
