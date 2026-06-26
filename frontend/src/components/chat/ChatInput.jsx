import { useState, useRef, useEffect } from 'react';
import { Send, Paperclip } from 'lucide-react';

/**
 * Chat input — glass textarea with send button
 * Enter to send, Shift+Enter for newline
 */
export function ChatInput({ onSend, disabled = false, placeholder = 'Type a message…' }) {
  const [value, setValue] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const textareaRef = useRef(null);

  const handleSend = () => {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setValue('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Auto-resize textarea
  const handleChange = (e) => {
    setValue(e.target.value);
    const ta = textareaRef.current;
    if (ta) {
      ta.style.height = 'auto';
      ta.style.height = `${Math.min(ta.scrollHeight, 120)}px`;
    }
  };

  return (
    <div
      className="flex items-end gap-2 p-3 rounded-[14px] transition-all duration-150"
      style={{
        background: 'var(--bg-glass)',
        border: isFocused ? '1px solid var(--accent)' : '1px solid var(--border-glass)',
        boxShadow: isFocused ? '0 0 0 3px var(--accent-light)' : 'none',
        backdropFilter: 'blur(8px)',
      }}
    >
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        placeholder={placeholder}
        disabled={disabled}
        rows={1}
        className="flex-1 bg-transparent resize-none text-sm leading-relaxed focus:outline-none focus:ring-0 focus-visible:outline-none"
        style={{
          color: 'var(--text-primary)',
          fontFamily: 'var(--font-body)',
          maxHeight: 120,
          minHeight: 20,
          border: 'none',
          boxShadow: 'none',
          outline: 'none',
        }}
      />

      <button
        onClick={handleSend}
        disabled={!value.trim() || disabled}
        className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-150"
        style={{
          background: value.trim() && !disabled ? 'var(--accent)' : 'var(--bg-surface)',
          color: value.trim() && !disabled ? '#fff' : 'var(--text-muted)',
          cursor: !value.trim() || disabled ? 'not-allowed' : 'pointer',
        }}
        aria-label="Send message"
      >
        <Send size={14} />
      </button>
    </div>
  );
}
