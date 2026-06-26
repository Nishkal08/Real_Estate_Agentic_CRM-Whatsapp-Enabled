import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '@/utils/cn';

const overlayVariants = {
  hidden:  { opacity: 0 },
  visible: { opacity: 1 },
};

const modalVariants = {
  hidden:  { opacity: 0, scale: 0.95, y: 10 },
  visible: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.2, ease: [0.4, 0, 0.2, 1] } },
  exit:    { opacity: 0, scale: 0.96, y: 6, transition: { duration: 0.15 } },
};

/**
 * Glass modal with Framer Motion entrance
 */
export function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  size = 'md',     // 'sm' | 'md' | 'lg' | 'xl'
  footer,
  className = '',
  closeOnOverlayClick = true,
}) {
  // Trap scroll
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  // Esc to close
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const sizeClass = {
    sm:  'max-w-sm',
    md:  'max-w-lg',
    lg:  'max-w-2xl',
    xl:  'max-w-4xl',
  }[size] || 'max-w-lg';

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="overlay flex items-center justify-center p-4"
          variants={overlayVariants}
          initial="hidden"
          animate="visible"
          exit="hidden"
          transition={{ duration: 0.18 }}
          onClick={closeOnOverlayClick ? onClose : undefined}
          style={{ zIndex: 50 }}
        >
          <motion.div
            className={cn(
              'relative w-full rounded-[18px] overflow-hidden',
              sizeClass,
              className
            )}
            style={{
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border-subtle)',
              boxShadow: 'var(--shadow-float)',
            }}
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            {(title || onClose) && (
              <div
                className="flex items-start justify-between p-6 pb-4"
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
                <button
                  onClick={onClose}
                  className="btn-icon ml-4 flex-shrink-0"
                  aria-label="Close modal"
                >
                  <X size={16} />
                </button>
              </div>
            )}

            {/* Body */}
            <div className="p-6 overflow-y-auto custom-scrollbar" style={{ maxHeight: 'calc(100vh - 140px)' }}>
              {children}
            </div>

            {/* Footer */}
            {footer && (
              <div
                className="flex items-center justify-end gap-3 px-6 pb-6 pt-2"
                style={{ borderTop: '1px solid var(--border-subtle)' }}
              >
                {footer}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
