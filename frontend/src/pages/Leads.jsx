import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import {
  Users, Upload, Search, Grid, List, X
} from 'lucide-react';
import { PageWrapper } from '@/components/layout/PageWrapper';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Drawer } from '@/components/ui/Drawer';
import { Modal } from '@/components/ui/Modal';
import { ChatWindow } from '@/components/chat/ChatWindow';
import { ExcelUploader } from '@/components/leads/ExcelUploader';
import { ColumnMapper } from '@/components/leads/ColumnMapper';
import { formatPhone, formatRelativeTime, getInitials } from '@/utils/formatters';
import { toast } from '@/stores/uiStore';
import useActivityStore from '@/stores/activityStore';
import { cn } from '@/utils/cn';
import api from '@/services/api';

gsap.registerPlugin(ScrollTrigger);

const STATUS_FILTERS = ['All', 'Hot', 'Qualified', 'Nurturing', 'Cold', 'Converted'];

function QualScore({ score, isHot }) {
  const displayScore = score !== undefined && score !== null ? score : 0;
  return (
    <div className="flex items-center gap-2">
      <div className="qual-score">
        {Array.from({ length: 4 }).map((_, i) => (
          <span
            key={i}
            className={cn('score-dot', i < displayScore && (isHot ? 'hot' : 'filled'))}
          />
        ))}
      </div>
      <span className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>
        {displayScore}/4
      </span>
    </div>
  );
}

export default function Leads() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('table');
  const [search, setSearch] = useState('');
  const [selectedLead, setSelectedLead] = useState(null);
  const [conversation, setConversation] = useState([]);
  const [isHumanMode, setIsHumanMode] = useState(false);
  const tableRef = useRef(null);

  const latestActivity = useActivityStore((state) => state.activities[0]);

  useEffect(() => {
    if (!latestActivity) return;
    const eventType = latestActivity.rawType || latestActivity.type;

    if (['new_message', 'message_received', 'agent_replied', 'message_sent', 'human_takeover', 'human_released', 'hot_lead'].includes(eventType)) {
      setLeads((prev) =>
        prev.map((l) => {
          if (l.id === latestActivity.leadId || l.phone === latestActivity.leadId || l.conversationId === latestActivity.conversationId || l.conversation?.id === latestActivity.conversationId) {
            const updated = {
              ...l,
              status: latestActivity.status || (latestActivity.stage === 'handoff' ? 'hot' : l.status),
              qualificationScore: latestActivity.qualificationScore !== undefined ? latestActivity.qualificationScore : l.qualificationScore,
              intentSignals: latestActivity.intentSignals ? JSON.stringify(latestActivity.intentSignals) : l.intentSignals,
              conversation: l.conversation ? {
                ...l.conversation,
                isHumanActive: eventType === 'human_takeover' ? true : (eventType === 'human_released' ? false : l.conversation.isHumanActive),
                stage: latestActivity.stage || l.conversation.stage
              } : l.conversation
            };

            // If this is the currently selected lead in the details drawer, update it
            if (selectedLead && selectedLead.id === l.id) {
              setSelectedLead(updated);
              setIsHumanMode(updated.conversation?.isHumanActive || false);

              // Also update the chat window conversation messages in real-time
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
              } else if (eventType === 'human_takeover') {
                setIsHumanMode(true);
              } else if (eventType === 'human_released') {
                setIsHumanMode(false);
              }
            }

            return updated;
          }
          return l;
        })
      );
    }
  }, [latestActivity, selectedLead]);

  // Import flow state
  const [importOpen, setImportOpen] = useState(false);
  const [importStep, setImportStep] = useState('upload'); // 'upload' | 'map'
  const [parsedData, setParsedData] = useState(null);
  const [campaigns, setCampaigns] = useState([]);
  const [selectedCampaignId, setSelectedCampaignId] = useState('');

  const statusFilter = searchParams.get('status') || 'All';

  useEffect(() => {
    const fetchLeads = async () => {
      try {
        setLoading(true);
        const res = await api.get('/leads');
        if (res.data.success) {
          setLeads(res.data.data.leads || []);
        }
      } catch (err) {
        console.error("Failed to load leads", err);
      } finally {
        setLoading(false);
      }
    };

    const fetchCampaigns = async () => {
      try {
        const res = await api.get('/campaigns');
        if (res.data.success && res.data.data?.length > 0) {
          setCampaigns(res.data.data);
          setSelectedCampaignId(res.data.data[0].id);
        }
      } catch (err) {
        console.error("Failed to load campaigns", err);
      }
    };

    fetchLeads();
    fetchCampaigns();
  }, []);

  // GSAP scroll reveal on rows
  useEffect(() => {
    if (!loading && tableRef.current && viewMode === 'table') {
      const rows = tableRef.current.querySelectorAll('.reveal-row');
      const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (!prefersReduced && rows.length > 0) {
        gsap.fromTo(
          rows,
          { opacity: 0, y: 14 },
          { opacity: 1, y: 0, stagger: 0.05, duration: 0.3, ease: 'power2.out', clearProps: 'transform' }
        );
      }
    }
  }, [loading, leads, viewMode]);

  const filtered = leads.filter((l) => {
    const matchStatus = statusFilter === 'All' || l.status === statusFilter.toLowerCase();
    const matchSearch =
      !search ||
      l.name.toLowerCase().includes(search.toLowerCase()) ||
      l.phone.includes(search);
    return matchStatus && matchSearch;
  });

  const handleLeadClick = async (lead) => {
    setSelectedLead(lead);
    setConversation([]);
    setIsHumanMode(lead.conversation?.isHumanActive || false);
    
    // Fetch conversation messages
    try {
      if (lead.conversation?.id) {
        const res = await api.get(`/conversations/${lead.conversation.id}/messages`);
        if (res.data.success) {
          setConversation(res.data.data.messages || []);
        }
      }
    } catch (err) {
      console.error("Failed to fetch messages", err);
    }
  };

  const handleTakeOver = async () => {
    try {
      if (!selectedLead?.conversation?.id) return;
      await api.post(`/conversations/${selectedLead.conversation.id}/takeover`);
      setIsHumanMode(true);
      toast.success(`You've taken over the conversation with ${selectedLead.name}`, { title: 'Human Mode' });
    } catch (err) {
      toast.error('Failed to take over conversation');
    }
  };

  const handleSendMessage = async (msg) => {
    try {
      if (!selectedLead?.conversation?.id) return;
      
      // Optimistic update
      const newMsg = {
        id: `msg_new_${Date.now()}`,
        role: 'human',
        content: msg,
        timestamp: new Date().toISOString(),
      };
      setConversation((prev) => [...prev, newMsg]);

      await api.post(`/conversations/${selectedLead.conversation.id}/human-message`, { content: msg });
    } catch (err) {
      toast.error('Failed to send message');
    }
  };

  // Import handlers
  const handleParsed = (data) => {
    setParsedData(data);
    setImportStep('map');
  };

  const handleImportConfirm = async ({ mapping }) => {
    try {
      const file = parsedData?.file;
      if (!file) throw new Error("File missing from memory");

      const formData = new FormData();
      formData.append('file', file);
      formData.append('mapping', JSON.stringify(mapping));
      if (selectedCampaignId) {
        formData.append('campaignId', selectedCampaignId);
      }

      const res = await api.post('/leads/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      if (res.data.success) {
        toast.success(`${res.data.data.inserted} leads imported successfully.`, { title: 'Import Successful' });
        // Refresh leads
        const leadsRes = await api.get('/leads');
        if (leadsRes.data.success) setLeads(leadsRes.data.data.leads || []);
      }
    } catch (err) {
      console.error("Import failed", err);
      toast.error(err.response?.data?.error || err.message, { title: 'Import Failed' });
    } finally {
      setImportOpen(false);
      setImportStep('upload');
      setParsedData(null);
    }
  };

  return (
    <PageWrapper>
      {/* Header */}
      <div className="page-header">
        <div>
          {loading ? (
            <div className="skeleton h-4 w-44 rounded mt-1" />
          ) : (
            <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>
              {leads.length} total leads across {new Set(leads.map((l) => l.campaignId).filter(Boolean)).size} campaigns
            </p>
          )}
        </div>
        <Button
          variant="primary"
          size="sm"
          icon={<Upload size={14} />}
          onClick={() => { setImportOpen(true); setImportStep('upload'); setParsedData(null); }}
        >
          Import Leads
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center justify-between gap-4 mb-4 flex-wrap">
        {/* Status tabs */}
        <div className="flex items-center gap-1 overflow-x-auto">
          {STATUS_FILTERS.map((s) => (
            <button
              key={s}
              onClick={() => setSearchParams(s === 'All' ? {} : { status: s.toLowerCase() })}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap',
                statusFilter === s || (statusFilter === 'All' && s === 'All')
                  ? 'text-white'
                  : ''
              )}
              style={{
                background: (statusFilter === s || (statusFilter === 'All' && s === 'All'))
                  ? 'var(--accent)'
                  : 'var(--bg-glass)',
                color: (statusFilter === s || (statusFilter === 'All' && s === 'All'))
                  ? '#fff'
                  : 'var(--text-secondary)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              {s}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          {/* Search */}
          <div className="relative">
            <Search
              size={13}
              className="absolute left-2.5 top-1/2 -translate-y-1/2"
              style={{ color: 'var(--text-muted)' }}
            />
            <input
              className="input pl-8 py-1.5 text-xs w-48"
              placeholder="Search leads…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* View toggle */}
          <div
            className="flex items-center rounded-lg overflow-hidden"
            style={{ border: '1px solid var(--border-subtle)' }}
          >
            {[{ mode: 'table', icon: <List size={14} /> }, { mode: 'grid', icon: <Grid size={14} /> }].map(({ mode, icon }) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className="btn-icon rounded-none px-2.5"
                style={{
                  background: viewMode === mode ? 'var(--accent-light)' : 'transparent',
                  color: viewMode === mode ? 'var(--accent)' : 'var(--text-muted)',
                }}
                aria-label={`${mode} view`}
              >
                {icon}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="card-no-hover">
          <table className="data-table">
            <tbody>
              {Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  {Array.from({ length: 6 }).map((__, j) => (
                    <td key={j} style={{ padding: '14px 16px' }}>
                      <div className="skeleton h-3 rounded" style={{ width: j === 0 ? 140 : 80 }} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<Users size={22} />}
          title="No leads found"
          description="Import leads from an Excel file or start a campaign to generate leads automatically."
          action={() => navigate('/campaigns')}
          actionLabel="Create Campaign"
        />
      ) : viewMode === 'table' ? (
        <div className="card-no-hover !p-0 overflow-hidden" ref={tableRef}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Lead</th>
                <th>Phone</th>
                <th>Status</th>
                <th>Score</th>
                <th>Campaign</th>
                <th>Last Activity</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((lead) => (
                <tr
                  key={lead.id}
                  className="reveal-row"
                  onClick={() => handleLeadClick(lead)}
                >
                  <td>
                    <div className="flex items-center gap-3">
                      <div className={cn('avatar', lead.status === 'hot' && 'hot-badge')}>
                        {getInitials(lead.name)}
                      </div>
                      <div>
                        <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                          {lead.name}
                        </p>
                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                          {lead.city}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className="text-xs font-mono" style={{ color: 'var(--text-secondary)' }}>
                      {formatPhone(lead.phone)}
                    </span>
                  </td>
                  <td>
                    <Badge variant={lead.status} pulse={lead.status === 'hot'}>
                      {lead.status === 'hot' ? 'Hot' : lead.status.charAt(0).toUpperCase() + lead.status.slice(1)}
                    </Badge>
                  </td>
                  <td>
                    <QualScore score={lead.qualificationScore} isHot={lead.status === 'hot'} />
                  </td>
                  <td>
                    <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                      {lead.campaignName}
                    </span>
                  </td>
                  <td>
                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      {formatRelativeTime(lead.lastMessageAt)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((lead) => (
            <div
              key={lead.id}
              className="card cursor-pointer"
              onClick={() => handleLeadClick(lead)}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={cn('avatar', lead.status === 'hot' && 'hot-badge')}>
                    {getInitials(lead.name)}
                  </div>
                  <div>
                    <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{lead.name}</p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{lead.city}</p>
                  </div>
                </div>
                <Badge variant={lead.status} pulse={lead.status === 'hot'}>
                  {lead.status.charAt(0).toUpperCase() + lead.status.slice(1)}
                </Badge>
              </div>
              <p className="text-xs line-clamp-2 mb-3" style={{ color: 'var(--text-secondary)' }}>
                {lead.lastMessage}
              </p>
              <div className="flex items-center justify-between">
                <QualScore score={lead.qualificationScore} isHot={lead.status === 'hot'} />
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  {formatRelativeTime(lead.lastMessageAt)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Lead detail drawer */}
      <Drawer
        isOpen={!!selectedLead}
        onClose={() => setSelectedLead(null)}
        title={selectedLead?.name}
        description={selectedLead ? `${formatPhone(selectedLead.phone)}${selectedLead.city ? ` · ${selectedLead.city}` : ''}` : ''}
        width="560px"
      >
        {selectedLead && (
          <div className="flex flex-col gap-4 h-full">
            {/* Lead meta */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Status', value: <Badge variant={selectedLead.status}>{selectedLead.status}</Badge> },
                { label: 'Score', value: <QualScore score={selectedLead.qualificationScore} isHot={selectedLead.status === 'hot'} /> },
                { label: 'Campaign', value: selectedLead.campaignName },
                { label: 'Source', value: selectedLead.source },
              ].map((m) => (
                <div key={m.label} className="px-3 py-2 rounded-xl" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
                  <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>{m.label}</p>
                  <div className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{m.value}</div>
                </div>
              ))}
            </div>

            {/* Conversation */}
            <div
              className="flex-1 rounded-2xl overflow-hidden"
              style={{ border: '1px solid var(--border-subtle)', minHeight: 400 }}
            >
              <ChatWindow
                messages={conversation}
                isHumanMode={isHumanMode}
                onSend={handleSendMessage}
                onTakeOver={handleTakeOver}
              />
            </div>
          </div>
        )}
      </Drawer>

      {/* Excel Import Modal */}
      <Modal
        isOpen={importOpen}
        onClose={() => { setImportOpen(false); setImportStep('upload'); setParsedData(null); }}
        title={importStep === 'upload' ? 'Import Leads from Excel' : 'Map Columns'}
        description={
          importStep === 'upload'
            ? 'Upload your leads spreadsheet and the AI agent will begin WhatsApp outreach.'
            : 'Match your spreadsheet columns to the required fields.'
        }
        size="md"
      >
        {importStep === 'upload' ? (
          <div className="space-y-4">
            {campaigns.length > 0 && (
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>
                  Target Campaign
                </label>
                <select
                  value={selectedCampaignId}
                  onChange={e => setSelectedCampaignId(e.target.value)}
                  className="input py-2"
                >
                  {campaigns.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.status})
                    </option>
                  ))}
                </select>
              </div>
            )}
            <ExcelUploader
              onParsed={handleParsed}
              onCancel={() => setImportOpen(false)}
            />
          </div>
        ) : (
          <ColumnMapper
            headers={parsedData?.headers || []}
            rows={parsedData?.rows || []}
            fileName={parsedData?.fileName || ''}
            onConfirm={handleImportConfirm}
            onBack={() => setImportStep('upload')}
          />
        )}
      </Modal>
    </PageWrapper>
  );
}
