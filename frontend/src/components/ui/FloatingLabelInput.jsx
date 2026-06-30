import { useState, useId } from 'react';
import { Eye, EyeOff, Check } from 'lucide-react';

export function FloatingLabelInput({
  label,
  type = 'text',
  icon: Icon,
  value = '',
  onChange,
  accentColor = '#C4654A', // Default brand accent
  isValid = false,
  showSuccessCheckmark = false,
  error = '',
  ...props
}) {
  const [focused, setFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const id = useId();

  const isFilled = value && String(value).length > 0;
  const isFloating = focused || isFilled;
  const isPassword = type === 'password';
  const inputType = isPassword ? (showPassword ? 'text' : 'password') : type;

  return (
    <div className="w-full">
      <div className="relative flex items-center" style={{ minHeight: 52 }}>
        {/* Left Icon */}
        {Icon && (
          <div
            className="absolute left-3.5 flex items-center justify-center pointer-events-none"
            style={{ color: focused ? accentColor : 'var(--text-disabled)' }}
          >
            <Icon size={16} strokeWidth={2} />
          </div>
        )}

        {/* The floating label */}
        <label
          htmlFor={id}
          className="absolute pointer-events-none transition-all duration-200 select-none"
          style={{
            left: Icon ? '40px' : '16px',
            top: isFloating ? '7px' : '50%',
            transform: isFloating ? 'none' : 'translateY(-50%)',
            fontSize: isFloating ? '10px' : '13px',
            fontWeight: isFloating ? 600 : 400,
            color: isFloating ? accentColor : 'var(--text-disabled)',
            letterSpacing: isFloating ? '0.04em' : 'normal',
            textTransform: isFloating ? 'uppercase' : 'none',
          }}
        >
          {label}
        </label>

        {/* Input Field */}
        <input
          id={id}
          type={inputType}
          value={value}
          onChange={onChange}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          className="w-full h-[52px] rounded-xl text-sm font-medium transition-all"
          style={{
            paddingLeft: Icon ? '40px' : '16px',
            paddingRight: isPassword || showSuccessCheckmark ? '40px' : '16px',
            paddingTop: isFloating ? '16px' : '0px',
            background: 'var(--bg-elevated)',
            border: `1.5px solid ${focused ? accentColor : 'var(--border-subtle)'}`,
            color: 'var(--text-primary)',
            outline: 'none',
            boxShadow: focused ? `0 0 0 3px ${accentColor}1C` : 'none',
          }}
          {...props}
        />

        {/* Right Action Slot */}
        <div className="absolute right-3.5 flex items-center justify-center">
          {isPassword ? (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              className="p-1 rounded hover:bg-black/5 text-[var(--text-secondary)] transition-colors focus:outline-none"
            >
              {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          ) : showSuccessCheckmark && isValid ? (
            <div className="text-[var(--success)] flex items-center justify-center p-0.5 rounded-full bg-[rgba(16,185,129,0.1)]">
              <Check size={14} strokeWidth={3} />
            </div>
          ) : null}
        </div>
      </div>
      {error && (
        <p className="text-xs text-[var(--danger)] mt-1.5 pl-1.5 font-medium flex items-center gap-1">
          ⚠️ {error}
        </p>
      )}
    </div>
  );
}
