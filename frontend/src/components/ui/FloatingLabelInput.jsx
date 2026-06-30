import { useState, useId } from 'react';
import { Eye, EyeOff, Check } from 'lucide-react';

/**
 * FloatingLabelInput — A polished text input with animated floating label.
 *
 * The label IS the placeholder. When the field is empty and blurred the label
 * sits at vertical‑centre. On focus or when a value exists the label floats to
 * the top. An optional `hint` string is shown as faint placeholder text only
 * while the field is focused AND empty to give the user an example format.
 */
export function FloatingLabelInput({
  label,
  hint,              // e.g. "you@company.com" — only appears while focused & empty
  type = 'text',
  icon: Icon,
  value = '',
  onChange,
  accentColor = '#C4654A',
  isValid = false,
  showSuccessCheckmark = false,
  error = '',
  required,
  ...rest            // any extra attrs — but NOT placeholder (we control that)
}) {
  const [focused, setFocused] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const id = useId();

  const isFilled = value !== undefined && value !== null && String(value).length > 0;
  const isFloated = focused || isFilled;
  const isPassword = type === 'password';
  const inputType = isPassword ? (showPwd ? 'text' : 'password') : type;

  const hasRight = isPassword || (showSuccessCheckmark && isValid);
  const leftPad = Icon ? 44 : 18;
  const rightPad = hasRight ? 44 : 18;

  // Determine the native placeholder — only show the hint when focused & empty
  const nativePlaceholder = (focused && !isFilled && hint) ? hint : '';

  // Remove `placeholder` from rest so the parent's placeholder doesn't leak through
  const { placeholder: _ignored, ...cleanRest } = rest;

  return (
    <div style={{ width: '100%' }}>
      <div
        style={{
          position: 'relative',
          height: 56,
          borderRadius: 14,
          transition: 'box-shadow 0.25s ease, transform 0.2s ease',
          boxShadow: focused
            ? `0 0 0 3.5px ${accentColor}1A, 0 4px 16px rgba(0,0,0,0.06)`
            : '0 1px 4px rgba(0,0,0,0.04)',
          transform: focused ? 'translateY(-1px)' : 'none',
        }}
      >
        {/* Left icon */}
        {Icon && (
          <div
            style={{
              position: 'absolute',
              left: 15,
              top: '50%',
              transform: 'translateY(-50%)',
              color: focused ? accentColor : 'rgba(0,0,0,0.28)',
              transition: 'color 0.2s',
              zIndex: 2,
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <Icon size={16} strokeWidth={2} />
          </div>
        )}

        {/* Floating label */}
        <label
          htmlFor={id}
          style={{
            position: 'absolute',
            left: leftPad,
            top: isFloated ? 8 : '50%',
            transform: isFloated ? 'none' : 'translateY(-50%)',
            fontSize: isFloated ? 9.5 : 14,
            fontWeight: isFloated ? 700 : 400,
            color: error
              ? '#EF4444'
              : isFloated
                ? accentColor
                : 'rgba(0,0,0,0.38)',
            letterSpacing: isFloated ? '0.06em' : 0,
            textTransform: isFloated ? 'uppercase' : 'none',
            transition: 'all 0.2s cubic-bezier(0.4,0,0.2,1)',
            zIndex: 2,
            pointerEvents: 'none',
            userSelect: 'none',
            whiteSpace: 'nowrap',
            lineHeight: 1,
          }}
        >
          {label}
        </label>

        {/* The actual <input> */}
        <input
          id={id}
          type={inputType}
          value={value}
          onChange={onChange}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          required={required}
          aria-label={label}
          placeholder={nativePlaceholder}
          autoComplete={isPassword ? 'current-password' : type === 'email' ? 'email' : 'off'}
          {...cleanRest}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            borderRadius: 14,
            paddingLeft: leftPad,
            paddingRight: rightPad,
            paddingTop: isFloated ? 20 : 0,
            paddingBottom: 0,
            background: '#ffffff',
            border: `1.5px solid ${error ? '#EF4444' : focused ? accentColor : 'rgba(0,0,0,0.12)'}`,
            color: '#111111',
            fontSize: 14,
            fontWeight: 500,
            fontFamily: 'inherit',
            outline: 'none',
            transition: 'border-color 0.2s, padding-top 0.2s',
            caretColor: accentColor,
            // Placeholder styling (via WebKit pseudo)
            WebkitTextFillColor: undefined,
            ...(cleanRest.style || {}),
          }}
        />

        {/* Right slot — eye toggle or green checkmark */}
        {hasRight && (
          <div
            style={{
              position: 'absolute',
              right: 14,
              top: '50%',
              transform: 'translateY(-50%)',
              zIndex: 3,
              display: 'flex',
              alignItems: 'center',
            }}
          >
            {isPassword ? (
              <button
                type="button"
                onClick={() => setShowPwd(v => !v)}
                aria-label={showPwd ? 'Hide password' : 'Show password'}
                style={{
                  background: 'none',
                  border: 'none',
                  padding: 5,
                  borderRadius: 8,
                  cursor: 'pointer',
                  color: 'rgba(0,0,0,0.36)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'color 0.15s',
                }}
                onMouseEnter={e => (e.currentTarget.style.color = 'rgba(0,0,0,0.6)')}
                onMouseLeave={e => (e.currentTarget.style.color = 'rgba(0,0,0,0.36)')}
              >
                {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            ) : (
              showSuccessCheckmark && isValid && (
                <div
                  style={{
                    background: 'rgba(16,185,129,0.12)',
                    borderRadius: '50%',
                    width: 22,
                    height: 22,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#10B981',
                    animation: 'aurionPopIn 0.3s cubic-bezier(0.34,1.56,0.64,1)',
                  }}
                >
                  <Check size={12} strokeWidth={3} />
                </div>
              )
            )}
          </div>
        )}
      </div>

      {error && (
        <p style={{ fontSize: 11, color: '#EF4444', marginTop: 6, paddingLeft: 4, fontWeight: 500 }}>
          {error}
        </p>
      )}

      {/* Inline keyframe for green-check pop-in */}
      <style>{`
        @keyframes aurionPopIn {
          0%   { transform: scale(0); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
