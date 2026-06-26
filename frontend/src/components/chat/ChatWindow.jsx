import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChatBubble } from './ChatBubble';
import { TypingIndicator } from './TypingIndicator';
import { Send, Bot } from 'lucide-react';

/**
 * Full conversation window — scrollable thread + input
 */
export function ChatWindow({ messages = [], loadingMessages = false, isTyping = false, isHumanMode = false, onSend, onTakeOver, onRelease }) {
  const bottomRef = useRef(null);
  const [value, setValue] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const textareaRef = useRef(null);

  // Auto scroll to bottom when messages change
  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isTyping]);

  const handleSend = () => {
    const trimmed = value.trim();
    if (!trimmed) return;
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

  const handleChange = (e) => {
    setValue(e.target.value);
    const ta = textareaRef.current;
    if (ta) {
      ta.style.height = 'auto';
      ta.style.height = `${Math.min(ta.scrollHeight, 120)}px`;
    }
  };

  return (
    <div className="relative flex flex-col h-full bg-transparent overflow-hidden">
      {/* Messages */}
      <div 
        className="flex-1 overflow-y-auto p-4 flex flex-col gap-3"
        style={{ paddingBottom: '128px' }}
      >
        {loadingMessages ? (
          <div className="flex flex-col gap-4">
            {/* Left Skeleton */}
            <div className="flex flex-col items-start gap-1 max-w-[60%] self-start w-full">
              <div className="skeleton h-8 w-48 rounded-[16px_16px_16px_4px]" />
              <div className="skeleton h-3 w-16 rounded ml-1" />
            </div>
            {/* Right Skeleton */}
            <div className="flex flex-col items-end gap-1 max-w-[60%] self-end w-full">
              <div className="skeleton h-12 w-64 rounded-[16px_4px_16px_16px]" />
              <div className="skeleton h-3 w-16 rounded mr-1" />
            </div>
            {/* Left Skeleton */}
            <div className="flex flex-col items-start gap-1 max-w-[60%] self-start w-full">
              <div className="skeleton h-6 w-36 rounded-[16px_16px_16px_4px]" />
              <div className="skeleton h-3 w-16 rounded ml-1" />
            </div>
            {/* Right Skeleton */}
            <div className="flex flex-col items-end gap-1 max-w-[60%] self-end w-full">
              <div className="skeleton h-8 w-44 rounded-[16px_4px_16px_16px]" />
              <div className="skeleton h-3 w-16 rounded mr-1" />
            </div>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className={`flex ${msg.role === 'lead' ? 'justify-start' : 'justify-end'}`}
              >
                <ChatBubble message={msg} />
              </motion.div>
            ))}
          </AnimatePresence>
        )}

        {/* Typing indicator */}
        <AnimatePresence>
          {isTyping && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex justify-start"
            >
              <TypingIndicator />
            </motion.div>
          )}
        </AnimatePresence>

        <div ref={bottomRef} />
      </div>

      {/* Floating Glassmorphic Pill Composer */}
      <div className="absolute bottom-5 left-5 right-5 z-10 pointer-events-none">
        <div className="pointer-events-auto">
          {!isHumanMode ? (
            <div
              className="flex flex-col rounded-[24px] overflow-hidden transition-all duration-200"
              style={{
                background: 'var(--bg-glass-strong)',
                border: '1px solid var(--border-glass)',
                boxShadow: 'var(--shadow-float)',
                backdropFilter: 'var(--blur-md)',
                WebkitBackdropFilter: 'var(--blur-md)',
              }}
            >
              {/* AI Handling Info Row */}
              <div className="flex items-center gap-2 p-3 min-h-[48px]" style={{ color: 'var(--text-muted)' }}>
                <Bot size={15} className="text-[var(--accent)] animate-pulse" />
                <span className="text-xs font-medium">AI agent is handling this conversation</span>
              </div>

              {/* AI Control Status Bar */}
              <div
                className="flex items-center justify-between px-3.5 py-1.5"
                style={{
                  borderTop: '1px solid var(--border-subtle)',
                  background: 'rgba(74, 103, 65, 0.03)',
                }}
              >
                <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--success)' }}>
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--success)] opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[var(--success)]"></span>
                  </span>
                  <span>AI Active</span>
                </div>
                {onTakeOver && (
                  <button
                    id="btn-take-over"
                    onClick={onTakeOver}
                    className="flex items-center gap-1 px-3 py-1 rounded-lg text-[10px] font-semibold transition-all duration-150 hover:bg-[var(--accent-light)] active:scale-[0.98]"
                    style={{
                      background: 'var(--bg-glass)',
                      border: '1px solid var(--border-glass)',
                      color: 'var(--text-primary)',
                      cursor: 'pointer',
                    }}
                  >
                    Take Over
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div
              className="flex flex-col rounded-[24px] overflow-hidden transition-all duration-200"
              style={{
                background: 'var(--bg-glass-strong)',
                border: isFocused ? '1px solid var(--accent)' : '1px solid var(--border-glass)',
                boxShadow: isFocused ? '0 0 0 3px var(--accent-light), var(--shadow-float)' : 'var(--shadow-float)',
                backdropFilter: 'var(--blur-md)',
                WebkitBackdropFilter: 'var(--blur-md)',
              }}
            >
              {/* Input Textarea Row */}
              <div className="flex items-end gap-2 p-3">
                <textarea
                  ref={textareaRef}
                  value={value}
                  onChange={handleChange}
                  onKeyDown={handleKeyDown}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                  placeholder="Reply as yourself…"
                  rows={1}
                  className="flex-1 bg-transparent resize-none text-sm leading-relaxed focus:outline-none focus:ring-0 focus-visible:outline-none"
                  style={{
                    color: 'var(--text-primary)',
                    fontFamily: 'var(--font-body)',
                    maxHeight: 120,
                    minHeight: 24,
                    border: 'none',
                    outline: 'none',
                    boxShadow: 'none',
                  }}
                />
                <button
                  onClick={handleSend}
                  disabled={!value.trim()}
                  className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-150"
                  style={{
                    background: value.trim() ? 'var(--accent)' : 'var(--bg-surface)',
                    color: value.trim() ? '#fff' : 'var(--text-muted)',
                    cursor: !value.trim() ? 'not-allowed' : 'pointer',
                    border: 'none',
                  }}
                  aria-label="Send message"
                >
                  <Send size={14} />
                </button>
              </div>

              {/* Human Control Status Bar */}
              <div
                className="flex items-center justify-between px-3.5 py-1.5"
                style={{
                  borderTop: '1px solid var(--border-subtle)',
                  background: 'rgba(196, 101, 74, 0.03)',
                }}
              >
                <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--accent)' }}>
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--accent)] opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[var(--accent)]"></span>
                  </span>
                  <span>Human Mode Active</span>
                </div>
                <button
                  id="btn-release-inline"
                  onClick={onRelease}
                  className="flex items-center gap-1 px-3 py-1 rounded-lg text-[10px] font-semibold transition-all duration-150 hover:opacity-90 active:scale-[0.98]"
                  style={{
                    background: 'var(--accent)',
                    color: '#ffffff',
                    boxShadow: 'var(--shadow-sm)',
                    border: 'none',
                    cursor: 'pointer',
                  }}
                >
                  🤖 Handover to AI
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
