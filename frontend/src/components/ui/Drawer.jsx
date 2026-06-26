import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '@/utils/cn';

const overlayVariants = {
  hidden:  { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.2 } },
  exit:    { opacity: 0, transition: { duration: 0.15 } },
};

const drawerVariants = {
  hidden:  { x: '100%' },
  visible: { x: 0, transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] } },
  exit:    { x: '100%', transition: { duration: 0.22, ease: [0.4, 0, 0.2, 1] } },
};

/**
 * Right-side slide-in drawer
 */
export function Drawer({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  width = '520px',
  className = '',
}) {
  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  useEffect(() => {
    const handleKey = (e) => { if (e.key === 'Escape' && isOpen) onClose(); };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            key="drawer-overlay"
            className="overlay"
            variants={overlayVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={onClose}
            style={{ zIndex: 50 }}
          />

          {/* Drawer panel */}
          <motion.div
            key="drawer-panel"
            className={cn('fixed top-0 right-0 bottom-0 flex flex-col', className)}
            style={{
              width,
              maxWidth: '100vw',
              background: 'var(--bg-elevated)',
              borderLeft: '1px solid var(--border-subtle)',
              boxShadow: 'var(--shadow-float)',
              zIndex: 51,
            }}
            variants={drawerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            {/* Header */}
            <div
              className="flex items-start justify-between p-6 flex-shrink-0"
              style={{ borderBottom: '1px solid var(--border-subtle)' }}
            >
              <div>
                {title && (
                  <h2 className="text-lg" style={{ color: 'var(--text-primary)' }}>
                    {title}
                  </h2>
                )}
                {description && (
                  <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
                    {description}
                  </p>
                )}
              </div>
              <button onClick={onClose} className="btn-icon ml-4 flex-shrink-0" aria-label="Close drawer">
                <X size={16} />
              </button>
            </div>

            {/* Body — scrollable */}
            <div className="flex-1 overflow-y-auto p-6">
              {children}
            </div>

            {/* Footer */}
            {footer && (
              <div
                className="flex items-center justify-end gap-3 p-6 flex-shrink-0"
                style={{ borderTop: '1px solid var(--border-subtle)' }}
              >
                {footer}
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
