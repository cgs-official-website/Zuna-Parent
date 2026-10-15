import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX } from 'react-icons/fi';

export const Modal = ({ isOpen, onClose, title, children, maxWidth = '550px' }) => {
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

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="modal-overlay-container">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(43, 33, 24, 0.45)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)'
            }}
          />

          {/* Modal Card / Mobile Sheet */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 24 }}
            transition={{ type: 'spring', stiffness: 350, damping: 28 }}
            className="modal-dialog-panel"
            style={{
              maxWidth
            }}
          >
            {/* Mobile Bottom-Sheet Pull Handle */}
            <div className="modal-sheet-handle" />

            {/* Header */}
            <div className="modal-header-bar">
              <h3 style={{ fontSize: '1.125rem', margin: 0, fontWeight: 700, color: 'var(--text-heading)' }}>{title}</h3>
              <button
                onClick={onClose}
                aria-label="Close modal"
                className="btn-ghost"
                style={{ padding: '6px', borderRadius: 'var(--radius-full)' }}
              >
                <FiX size={20} />
              </button>
            </div>

            {/* Content Body */}
            <div className="modal-body-content">
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
