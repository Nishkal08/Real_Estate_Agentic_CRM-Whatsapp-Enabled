import { cn } from '@/utils/cn';

const variantClasses = {
  qualified: 'badge-qualified',
  nurturing: 'badge-nurturing',
  hot:       'badge-hot',
  converted: 'badge-converted',
  cold:      'badge-cold',
  active:    'badge-active',
  scheduled: 'badge-scheduled',
  completed: 'badge-completed',
  paused:    'badge-paused',
  default:   'badge-nurturing',
};

const dotColors = {
  qualified: '#5E6AD2',
  nurturing: '#9EA3AE',
  hot:       '#DC2626',
  converted: '#16A34A',
  cold:      '#9EA3AE',
  active:    '#16A34A',
  scheduled: '#D97706',
  completed: '#9EA3AE',
  paused:    '#D97706',
  default:   '#9EA3AE',
};

/**
 * Status badge with optional pulse on 'hot'
 */
export function Badge({ variant = 'default', children, dot = true, className = '', pulse = false }) {
  const isHot = variant === 'hot';

  return (
    <span className={cn('badge', variantClasses[variant] || variantClasses.default, isHot && pulse && 'hot-badge', className)}>
      {dot && (
        <span
          className="inline-block w-1.5 h-1.5 rounded-full flex-shrink-0"
          style={{ background: dotColors[variant] || dotColors.default }}
          aria-hidden="true"
        />
      )}
      {children}
    </span>
  );
}

/**
 * Badge variants display name helper
 */
export const badgeLabel = {
  qualified: 'Qualified',
  nurturing: 'Nurturing',
  hot:       'Hot Lead',
  converted: 'Converted',
  cold:      'Cold',
  active:    'Active',
  scheduled: 'Scheduled',
  completed: 'Completed',
  paused:    'Paused',
};
