import { Button } from './Button';

/**
 * Contextual empty state — every empty page/list has this
 */
export function EmptyState({
  icon,
  title,
  description,
  action,
  actionLabel,
  secondaryAction,
  secondaryLabel,
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-8 text-center">
      {icon && (
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5"
          style={{ background: 'var(--accent-light)', color: 'var(--accent)' }}
        >
          {icon}
        </div>
      )}

      <h3 className="text-md mb-2" style={{ color: 'var(--text-primary)' }}>
        {title}
      </h3>

      {description && (
        <p className="text-sm mb-6 max-w-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
          {description}
        </p>
      )}

      <div className="flex items-center gap-3">
        {action && (
          <Button onClick={action} variant="primary">
            {actionLabel || 'Get Started'}
          </Button>
        )}
        {secondaryAction && (
          <Button onClick={secondaryAction} variant="secondary">
            {secondaryLabel || 'Learn More'}
          </Button>
        )}
      </div>
    </div>
  );
}
