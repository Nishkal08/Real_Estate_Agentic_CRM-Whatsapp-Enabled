import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { PageWrapper } from '@/components/layout/PageWrapper';
import { ChatWindow } from '@/components/chat/ChatWindow';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { formatPhone, getInitials } from '@/utils/formatters';
import { toast } from '@/stores/uiStore';
import { cn } from '@/utils/cn';
import api from '@/services/api';

export default function ConversationDetail() {
  const { leadId } = useParams();
  const navigate = useNavigate();
  const [lead, setLead] = useState(null);
  const [conversation, setConversation] = useState([]);
  const [isHumanMode, setIsHumanMode] = useState(false);

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        const res = await api.get(`/conversations/${leadId}/messages`);
        if (res.data.success) {
          const { conversation: conv, messages } = res.data.data;
          setLead({ ...conv.lead, conversationId: conv.id });
          setConversation(messages);
          setIsHumanMode(conv.isHumanActive);
        }
      } catch (err) {
        console.error("Failed to load conversation details", err);
      }
    };
    if (leadId) fetchDetail();
  }, [leadId]);

  const handleTakeOver = async () => {
    try {
      if (!lead?.conversationId) return;
      await api.post(`/conversations/${lead.conversationId}/takeover`);
      setIsHumanMode(true);
      toast.success(`You've taken over the conversation with ${lead?.name}`, { title: 'Human Mode' });
    } catch (err) {
      toast.error('Failed to take over conversation');
    }
  };

  const handleSend = async (msg) => {
    try {
      if (!lead?.conversationId) return;
      const newMsg = {
        id: `msg_${Date.now()}`,
        role: 'human',
        content: msg,
        timestamp: new Date().toISOString(),
      };
      setConversation(prev => [...prev, newMsg]);
      await api.post(`/conversations/${lead.conversationId}/human-message`, { content: msg });
    } catch (err) {
      toast.error('Failed to send message');
    }
  };

  if (!lead) return (
    <PageWrapper>
      <div className="flex items-center gap-3 py-8">
        <p style={{ color: 'var(--text-muted)' }}>Lead not found.</p>
        <Button variant="secondary" onClick={() => navigate('/conversations')}>Back</Button>
      </div>
    </PageWrapper>
  );

  return (
    <PageWrapper>
      <div className="page-header">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" icon={<ArrowLeft size={14} />} onClick={() => navigate('/conversations')}>
            Back
          </Button>
          <div className={cn('avatar', lead.status === 'hot' && 'hot-badge')}>
            {getInitials(lead.name)}
          </div>
          <div>
            <h1 className="page-title">{lead.name}</h1>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{formatPhone(lead.phone)}</p>
          </div>
          <Badge variant={lead.status} pulse={lead.status === 'hot'}>{lead.status}</Badge>
        </div>
      </div>

      <div
        className="rounded-[18px] overflow-hidden"
        style={{ border: '1px solid var(--border-subtle)', height: 'calc(100vh - 200px)' }}
      >
        <ChatWindow
          messages={conversation}
          isHumanMode={isHumanMode}
          onSend={handleSend}
          onTakeOver={handleTakeOver}
        />
      </div>
    </PageWrapper>
  );
}
