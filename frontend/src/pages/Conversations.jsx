import { useState, useEffect } from 'react';
import { MessageSquare, Search, UserCheck, Bot } from 'lucide-react';
import { PageWrapper } from '@/components/layout/PageWrapper';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { ChatWindow } from '@/components/chat/ChatWindow';
import { formatPhone, formatRelativeTime, getInitials, truncate } from '@/utils/formatters';
import { toast } from '@/stores/uiStore';
import { cn } from '@/utils/cn';
import api from '@/services/api';
import useActivityStore from '@/stores/activityStore';

export default function Conversations() {
  const [leads, setLeads] = useState([]);
  const [selected, setSelected] = useState(null);
  const [conversation, setConversation] = useState([]);
  const [isHumanMode, setIsHumanMode] = useState(false);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const latestActivity = useActivityStore(state => state.activities[0]);

  // Real-time message & status sync via SSE activity store subscription
  useEffect(() => {
    if (!latestActivity) return;

    const eventType = latestActivity.rawType || latestActivity.type;

    // 1. Update active chat window in real-time
    if (selected && latestActivity.conversationId === selected.conversationId) {
      if (eventType === 'new_message' || eventType === 'message_received') {
        const newMsg = {
          id: latestActivity.id || `msg_sse_${Date.now()}`,
          role: latestActivity.role || 'lead',
          content: latestActivity.message,
          timestamp: latestActivity.timestamp || new Date().toISOString()
        };
        setConversation(prev => {
          if (prev.some(m => m.content === newMsg.content && m.role === newMsg.role && Math.abs(new Date(m.timestamp) - new Date(newMsg.timestamp)) < 2000)) {
            return prev;
          }
          return [...prev, newMsg];
        });
      } else if (eventType === 'agent_replied' || eventType === 'message_sent') {
        const isHumanRole = latestActivity.role === 'human';
        const newMsg = {
          id: latestActivity.id || `msg_sse_${Date.now()}`,
          role: isHumanRole ? 'human' : 'agent',
          content: latestActivity.reply || latestActivity.message || '',
          timestamp: latestActivity.timestamp || new Date().toISOString()
        };
        setConversation(prev => {
          if (prev.some(m => m.content === newMsg.content && m.role === newMsg.role && Math.abs(new Date(m.timestamp) - new Date(newMsg.timestamp)) < 2000)) {
            return prev;
          }
          return [...prev, newMsg];
        });
        setSelected(prevSelected => {
          if (!prevSelected) return null;
          return {
            ...prevSelected,
            stage: latestActivity.stage || prevSelected.stage,
            status: latestActivity.status || (latestActivity.stage === 'handoff' ? 'hot' : prevSelected.status),
            qualificationScore: latestActivity.qualificationScore !== undefined ? latestActivity.qualificationScore : prevSelected.qualificationScore,
            intentSignals: latestActivity.intentSignals || prevSelected.intentSignals
          };
        });
      } else if (eventType === 'human_takeover') {
        setIsHumanMode(true);
        setSelected(prevSelected => prevSelected ? { ...prevSelected, isHuman: true } : null);
      } else if (eventType === 'human_released') {
        setIsHumanMode(false);
        setSelected(prevSelected => prevSelected ? { ...prevSelected, isHuman: false } : null);
      }
    }

    // 2. Update conversation list sidebar item status / score / lastMessage / lastMessageAt in real-time
    if (['new_message', 'message_received', 'agent_replied', 'message_sent', 'human_takeover', 'human_released'].includes(eventType)) {
      setLeads(prev => prev.map(l => {
        if (l.conversationId === latestActivity.conversationId) {
          return {
            ...l,
            lastMessage: latestActivity.message || latestActivity.reply || l.lastMessage,
            lastMessageAt: latestActivity.timestamp || new Date().toISOString(),
            isHuman: eventType === 'human_takeover' ? true : (eventType === 'human_released' ? false : l.isHuman),
            stage: latestActivity.stage || l.stage,
            status: latestActivity.status || (latestActivity.stage === 'handoff' ? 'hot' : l.status),
            qualificationScore: latestActivity.qualificationScore !== undefined ? latestActivity.qualificationScore : l.qualificationScore,
            intentSignals: latestActivity.intentSignals || l.intentSignals
          };
        }
        return l;
      }));
    }
  }, [latestActivity, selected]);

  useEffect(() => {
    const fetchThreads = async () => {
      try {
        setLoading(true);
        const res = await api.get('/conversations');
        if (res.data.success) {
          // Backend returns conversations, map to expected lead format
          const formatted = res.data.data.conversations.map(c => {
            let parsedSignals = [];
            try {
              if (c.lead?.intentSignals) {
                parsedSignals = typeof c.lead.intentSignals === 'string'
                  ? JSON.parse(c.lead.intentSignals)
                  : c.lead.intentSignals;
              }
            } catch (e) {
              console.error("Error parsing intent signals", e);
            }
            return {
              ...c.lead,
              conversationId: c.id,
              lastMessageAt: c.lastMessageAt,
              lastMessage: c.lastMessage?.content,
              isHuman: c.isHumanActive,
              intentSignals: parsedSignals,
              stage: c.stage || 'opener'
            };
          });
          setLeads(formatted);
        }
      } catch (err) {
        console.error("Failed to load conversations", err);
      } finally {
        setLoading(false);
      }
    };
    fetchThreads();
  }, []);

  // Auto-select first lead
  useEffect(() => {
    if (!loading && leads.length > 0 && !selected) {
      handleSelect(leads[0]);
    }
  }, [loading, leads]);

  const filtered = leads.filter(l =>
    !search || l.name?.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelect = async (lead) => {
    setSelected(lead);
    setConversation([]);
    setIsHumanMode(lead.isHuman || false);
    
    try {
      if (lead.conversationId) {
        const res = await api.get(`/conversations/${lead.conversationId}/messages`);
        if (res.data.success) {
          setConversation(res.data.data.messages || []);
          // Update selected lead details with fresh data from response
          const convObj = res.data.data.conversation;
          if (convObj) {
            let parsedSignals = [];
            try {
              if (convObj.lead?.intentSignals) {
                parsedSignals = typeof convObj.lead.intentSignals === 'string'
                  ? JSON.parse(convObj.lead.intentSignals)
                  : convObj.lead.intentSignals;
              }
            } catch (e) {}
            setSelected({
              ...lead,
              ...convObj.lead,
              intentSignals: parsedSignals,
              stage: convObj.stage || 'opener',
              isHuman: convObj.isHumanActive
            });
            setIsHumanMode(convObj.isHumanActive || false);
          }
        }
      }
    } catch (err) {
      console.error("Failed to load messages", err);
    }
  };

  const handleTakeOver = async () => {
    try {
      if (!selected?.conversationId) return;
      await api.post(`/conversations/${selected.conversationId}/takeover`);
      setIsHumanMode(true);
      setSelected(prev => prev ? { ...prev, isHuman: true } : null);
      setLeads(prev => prev.map(l => l.conversationId === selected.conversationId ? { ...l, isHuman: true } : l));
      toast.success(`You've taken over the conversation with ${selected?.name}`, { title: 'Human Mode Active' });
    } catch (err) {
      toast.error('Failed to take over conversation');
    }
  };

  const handleRelease = async () => {
    try {
      if (!selected?.conversationId) return;
      await api.post(`/conversations/${selected.conversationId}/release`);
      setIsHumanMode(false);
      setSelected(prev => prev ? { ...prev, isHuman: false } : null);
      setLeads(prev => prev.map(l => l.conversationId === selected.conversationId ? { ...l, isHuman: false } : l));
      toast.success(`AI agent has resumed control of the conversation with ${selected?.name}`, { title: 'AI Agent Active' });
    } catch (err) {
      toast.error('Failed to release conversation');
    }
  };

  const handleSend = async (msg) => {
    try {
      if (!selected?.conversationId) return;
      const newMsg = {
        id: `msg_new_${Date.now()}`,
        role: 'human',
        content: msg,
        timestamp: new Date().toISOString(),
      };
      setConversation(prev => [...prev, newMsg]);
      await api.post(`/conversations/${selected.conversationId}/human-message`, { content: msg });
    } catch (err) {
      toast.error('Failed to send message');
    }
  };

  return (
    <PageWrapper>
      <div className="page-header">
        <div>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>
            {leads.length} active threads · {leads.filter(l => l.status === 'hot').length} hot
          </p>
        </div>
      </div>

      <div
        className="rounded-[18px] overflow-hidden"
        style={{
          border: '1px solid var(--border-glass)',
          background: 'var(--bg-glass)',
          backdropFilter: 'blur(8px)',
          height: 'calc(100vh - 200px)',
          display: 'flex',
        }}
      >
        {/* Left panel — conversation list */}
        <div
          className="flex flex-col w-72 flex-shrink-0"
          style={{ borderRight: '1px solid var(--border-subtle)' }}
        >
          {/* Search */}
          <div className="p-3" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
            <div className="relative">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
              <input className="input pl-8 py-1.5 text-xs" placeholder="Search conversations…" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto">
            {filtered.map(lead => (
              <div
                key={lead.id}
                className={cn(
                  'flex items-start gap-3 p-3 cursor-pointer transition-all relative',
                  selected?.id === lead.id ? 'bg-[var(--accent-light)]' : 'hover:bg-[var(--bg-surface)]',
                  lead.stage === 'handoff' && !lead.isHuman && 'handoff-pending-card'
                )}
                style={{
                  borderLeft: lead.stage === 'handoff' && !lead.isHuman
                    ? '4px solid #ef4444'
                    : '4px solid transparent',
                }}
                onClick={() => handleSelect(lead)}
              >
                <div className={cn('avatar flex-shrink-0', (lead.status === 'hot' || lead.stage === 'handoff') && 'hot-badge')}>
                  {getInitials(lead.name)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <div className="flex items-center gap-1 min-w-0">
                      <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>{lead.name}</p>
                      {lead.stage === 'handoff' && !lead.isHuman && (
                        <span style={{ position: 'relative', display: 'inline-flex', width: 8, height: 8, marginLeft: 6 }}>
                          <span
                            className="animate-pulse"
                            style={{
                              position: 'absolute',
                              top: 0,
                              left: 0,
                              width: '100%',
                              height: '100%',
                              borderRadius: '50%',
                              background: '#ef4444',
                              opacity: 0.75,
                              animation: 'pulse-ring 1.2s cubic-bezier(0.24, 0, 0.38, 1) infinite'
                            }}
                          />
                          <span style={{
                            position: 'relative',
                            width: 8,
                            height: 8,
                            borderRadius: '50%',
                            background: '#ef4444'
                          }} />
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] flex-shrink-0 ml-1" style={{ color: 'var(--text-muted)' }}>
                      {formatRelativeTime(lead.lastMessageAt)}
                    </span>
                  </div>
                  <p className="text-xs truncate" style={{ color: 'var(--text-secondary)' }}>
                    {truncate(lead.lastMessage, 50)}
                  </p>
                  <div className="flex items-center gap-1.5 flex-wrap mt-1">
                    <Badge variant={lead.status} dot={false} className="text-[9px] py-0">
                      {lead.status}
                    </Badge>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-[var(--social-bg)] text-[var(--text-secondary)] font-medium">
                      Stage: {lead.stage || 'opener'}
                    </span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-[var(--social-bg)] text-[var(--text-secondary)] font-medium">
                      Score: {lead.qualificationScore || 0}/4
                    </span>
                    {lead.isHuman ? (
                      <span className="flex items-center gap-0.5 text-[9px] font-medium ml-auto" style={{ color: 'var(--accent)' }}>
                        <UserCheck size={9} /> Human
                      </span>
                    ) : (
                      <span className="flex items-center gap-0.5 text-[9px] font-medium ml-auto" style={{ color: 'var(--text-muted)' }}>
                        <Bot size={9} /> AI
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right panel — chat */}
        <div className="flex-1 overflow-hidden">
          {selected ? (
            <div className="flex flex-col h-full">
              {/* Conversation header */}
              <div
                className="flex items-center justify-between px-4 py-3 flex-shrink-0"
                style={{ borderBottom: '1px solid var(--border-subtle)' }}
              >
                <div className="flex items-center gap-3">
                  <div className={cn('avatar', selected.status === 'hot' && 'hot-badge')}>
                    {getInitials(selected.name)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{selected.name}</p>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-[var(--social-bg)] text-[var(--text-secondary)] font-medium">
                        Stage: {selected.stage || 'opener'}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-[var(--social-bg)] text-[var(--text-secondary)] font-medium">
                        Score: {selected.qualificationScore || 0}/4
                      </span>
                    </div>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{formatPhone(selected.phone)}</p>
                    {selected.intentSignals && selected.intentSignals.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {selected.intentSignals.map((sig, idx) => (
                          <span
                            key={idx}
                            className="text-[9px] px-1.5 py-0.2 rounded font-medium border"
                            style={{
                              background: 'var(--success-bg)',
                              color: 'var(--success)',
                              borderColor: 'rgba(74, 103, 65, 0.2)'
                            }}
                          >
                            {sig.replace(/_/g, ' ')}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={selected.status} pulse={selected.status === 'hot'}>
                    {selected.status}
                  </Badge>
                  {!isHumanMode ? (
                    <button
                      id="btn-take-over-conv"
                      className="btn btn-secondary btn-sm"
                      onClick={handleTakeOver}
                    >
                      Take Over
                    </button>
                  ) : (
                    <button
                      id="btn-release-conv"
                      className="btn btn-secondary btn-sm"
                      onClick={handleRelease}
                    >
                      Release to AI
                    </button>
                  )}
                </div>
              </div>

              {selected.stage === 'handoff' && !isHumanMode && (
                <div
                  style={{
                    background: 'rgba(239, 68, 68, 0.08)',
                    borderBottom: '1px solid rgba(239, 68, 68, 0.15)',
                    padding: '8px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 12,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span
                      className="animate-pulse"
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        background: '#ef4444',
                        boxShadow: '0 0 8px #ef4444',
                      }}
                    />
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#ef4444', fontFamily: 'var(--font-body)' }}>
                      ⚠️ Handoff Triggered: Lead has met qualification criteria and is waiting for response.
                    </span>
                  </div>
                  <button
                    onClick={handleTakeOver}
                    style={{
                      border: 'none',
                      background: '#ef4444',
                      color: '#fff',
                      fontSize: 11,
                      fontWeight: 600,
                      padding: '4px 10px',
                      borderRadius: 6,
                      cursor: 'pointer',
                      fontFamily: 'var(--font-body)',
                      transition: 'background 0.14s',
                      boxShadow: '0 2px 6px rgba(239, 68, 68, 0.25)',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#dc2626')}
                    onMouseLeave={e => (e.currentTarget.style.background = '#ef4444')}
                  >
                    Take Over Now
                  </button>
                </div>
              )}

              <ChatWindow
                messages={conversation}
                isHumanMode={isHumanMode}
                onSend={handleSend}
                onTakeOver={handleTakeOver}
                onRelease={handleRelease}
              />
            </div>
          ) : (
            <EmptyState
              icon={<MessageSquare size={22} />}
              title="Select a conversation"
              description="Choose a lead from the left panel to view their conversation thread."
            />
          )}
        </div>
      </div>
    </PageWrapper>
  );
}
