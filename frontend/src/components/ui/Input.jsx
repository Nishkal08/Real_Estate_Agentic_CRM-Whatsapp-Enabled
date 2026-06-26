import { forwardRef } from 'react';
import { cn } from '@/utils/cn';

/**
 * Glass input with label, error state, and optional icon slots
 */
export const Input = forwardRef(function Input(
  {
    label,
    error,
    hint,
    icon,          // left icon
    iconRight,     // right icon
    className = '',
    inputClassName = '',
    required = false,
    id,
    ...props
  },
  ref
) {
  const inputId = id || `input-${label?.toLowerCase().replace(/\s+/g, '-')}`;

  return (
    <div className={cn('flex flex-col gap-1', className)}>
      {label && (
        <label
          htmlFor={inputId}
          className="text-xs font-medium"
          style={{ color: 'var(--text-secondary)' }}
        >
          {label}
          {required && <span className="ml-1" style={{ color: 'var(--danger)' }}>*</span>}
        </label>
      )}

      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center pointer-events-none" style={{ color: 'var(--text-muted)' }}>
            {icon}
          </div>
        )}

        <input
          id={inputId}
          ref={ref}
          className={cn(
            'input',
            icon && 'pl-9',
            iconRight && 'pr-9',
            error && '!border-[var(--danger)] focus:!box-shadow-[0_0_0_3px_var(--danger-bg)]',
            inputClassName
          )}
          style={error ? { borderColor: 'var(--danger)' } : {}}
          {...props}
        />

        {iconRight && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center" style={{ color: 'var(--text-muted)' }}>
            {iconRight}
          </div>
        )}
      </div>

      {error && (
        <span className="text-xs" style={{ color: 'var(--danger)' }}>
          {error}
        </span>
      )}

      {hint && !error && (
        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
          {hint}
        </span>
      )}
    </div>
  );
});

/**
 * Textarea variant
 */
export const Textarea = forwardRef(function Textarea(
  { label, error, hint, className = '', required = false, id, rows = 4, ...props },
  ref
) {
  const inputId = id || `textarea-${label?.toLowerCase().replace(/\s+/g, '-')}`;

  return (
    <div className={cn('flex flex-col gap-1', className)}>
      {label && (
        <label htmlFor={inputId} className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
          {label}
          {required && <span className="ml-1" style={{ color: 'var(--danger)' }}>*</span>}
        </label>
      )}
      <textarea
        id={inputId}
        ref={ref}
        rows={rows}
        className="input resize-none"
        style={{ ...(error ? { borderColor: 'var(--danger)' } : {}), lineHeight: 1.6 }}
        {...props}
      />
      {error && <span className="text-xs" style={{ color: 'var(--danger)' }}>{error}</span>}
      {hint && !error && <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{hint}</span>}
    </div>
  );
});

/**
 * Select dropdown
 */
export const Select = forwardRef(function Select(
  { label, error, children, className = '', required = false, id, ...props },
  ref
) {
  const inputId = id || `select-${label?.toLowerCase().replace(/\s+/g, '-')}`;

  return (
    <div className={cn('flex flex-col gap-1', className)}>
      {label && (
        <label htmlFor={inputId} className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
          {label}
          {required && <span className="ml-1" style={{ color: 'var(--danger)' }}>*</span>}
        </label>
      )}
      <select
        id={inputId}
        ref={ref}
        className="input appearance-none cursor-pointer"
        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%239EA3AE' stroke-width='2'%3E%3Cpolyline points='6,9 12,15 18,9'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 10px center', paddingRight: '32px', ...(error ? { borderColor: 'var(--danger)' } : {}) }}
        {...props}
      >
        {children}
      </select>
      {error && <span className="text-xs" style={{ color: 'var(--danger)' }}>{error}</span>}
    </div>
  );
});
