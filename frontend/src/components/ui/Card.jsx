import { cn } from '@/utils/cn';

/**
 * Glass card wrapper
 * @param {boolean} hover - Enable hover lift effect
 * @param {boolean} clickable - Show pointer cursor
 */
export function Card({ children, hover = true, clickable = false, className = '', padding = true, onClick }) {
  return (
    <div
      className={cn(
        hover ? 'card' : 'card-no-hover',
        clickable && 'cursor-pointer',
        !padding && '!p-0',
        className
      )}
      onClick={onClick}
    >
      {children}
    </div>
  );
}

/**
 * Card header row
 */
export function CardHeader({ children, className = '' }) {
  return (
    <div className={cn('flex items-center justify-between mb-4', className)}>
      {children}
    </div>
  );
}

/**
 * Card title
 */
export function CardTitle({ children, className = '' }) {
  return (
    <h3 className={cn('text-md font-semibold', className)} style={{ color: 'var(--text-primary)' }}>
      {children}
    </h3>
  );
}

/**
 * Card section divider
 */
export function CardDivider() {
  return <div className="divider -mx-6 my-4" />;
}
