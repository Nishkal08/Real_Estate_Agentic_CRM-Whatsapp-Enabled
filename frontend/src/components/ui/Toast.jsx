import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from 'lucide-react';
import useUIStore from '@/stores/uiStore';
import { cn } from '@/utils/cn';

const icons = {
  success: <CheckCircle2 size={15} />,
  error:   <XCircle size={15} />,
  warning: <AlertTriangle size={15} />,
  info:    <Info size={15} />,
};

const styles = {
  success: { color: 'var(--success)',  bg: 'var(--success-bg)',  border: 'rgba(22, 163, 74, 0.25)' },
  error:   { color: 'var(--danger)',   bg: 'var(--danger-bg)',   border: 'rgba(220, 38, 38, 0.25)' },
  warning: { color: 'var(--warning)',  bg: 'var(--warning-bg)',  border: 'rgba(217, 119, 6, 0.25)' },
  info:    { color: 'var(--info)',     bg: 'var(--info-bg)',     border: 'rgba(2, 132, 199, 0.25)' },
};

/**
 * Individual toast item
 */
function ToastItem({ toast }) {
  const { removeToast } = useUIStore();
  const style = styles[toast.type] || styles.info;

  return (
    <motion.div
      key={toast.id}
      layout
      initial={{ opacity: 0, y: 15, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
      className="flex items-center gap-2.5 px-4 py-2.5 rounded-full shadow-xl max-w-[380px] pointer-events-auto"
      style={{
        background: 'var(--bg-glass-strong)',
        backdropFilter: 'var(--blur-md)',
        WebkitBackdropFilter: 'var(--blur-md)',
        border: '1px solid var(--border-glass)',
        color: 'var(--text-primary)',
        boxShadow: 'var(--shadow-float)',
      }}
      role="alert"
      aria-live="polite"
    >
      {/* Icon */}
      <span className="flex-shrink-0" style={{ color: style.color }}>
        {icons[toast.type]}
      </span>

      {/* Message */}
      <div className="flex-1 min-w-0 pr-2">
        <p className="text-[13px] font-medium leading-tight text-primary">
          {toast.title ? `${toast.title} - ${toast.message}` : toast.message}
        </p>
      </div>
    </motion.div>
  );
}

/**
 * Toast container — renders all active toasts top-right
 */
export function ToastContainer() {
  const { toasts } = useUIStore();

  return (
    <div
      className="fixed bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 pointer-events-none"
      style={{ zIndex: 100 }}
      aria-label="Notifications"
    >
      <AnimatePresence mode="popLayout">
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} />
        ))}
      </AnimatePresence>
    </div>
  );
}
