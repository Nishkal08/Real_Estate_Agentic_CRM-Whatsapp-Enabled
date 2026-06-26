import { formatDateTime } from '@/utils/formatters';
import { cn } from '@/utils/cn';

/**
 * Chat bubble — 3 variants: agent / lead / human
 */
export function ChatBubble({ message }) {
  const { role, content, timestamp } = message;

  if (role === 'agent') {
    return (
      <div className="flex flex-col items-end gap-1 max-w-[80%] self-end">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>AI Agent</span>
          <div
            className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-semibold"
            style={{ background: 'var(--accent-light)', color: 'var(--accent)' }}
          >
            AI
          </div>
        </div>
        <div className="bubble-agent whitespace-pre-wrap">{content}</div>
        <span className="text-xs pr-1" style={{ color: 'var(--text-muted)' }}>
          {formatDateTime(timestamp)}
        </span>
      </div>
    );
  }

  if (role === 'human') {
    return (
      <div className="flex flex-col items-end gap-1 max-w-[80%] self-end">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>You</span>
          <div
            className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-semibold"
            style={{ background: 'var(--accent)', color: '#fff' }}
          >
            Y
          </div>
        </div>
        <div className="bubble-human whitespace-pre-wrap">{content}</div>
        <span className="text-xs pr-1" style={{ color: 'var(--text-muted)' }}>
          {formatDateTime(timestamp)}
        </span>
      </div>
    );
  }

  // role === 'lead'
  return (
    <div className="flex flex-col items-start gap-1 max-w-[80%] self-start">
      <div className="bubble-lead whitespace-pre-wrap">{content}</div>
      <span className="text-xs pl-1" style={{ color: 'var(--text-muted)' }}>
        {formatDateTime(timestamp)}
      </span>
    </div>
  );
}
