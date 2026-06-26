import { useState, useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { Megaphone, Plus, Play, Pause, Trash2, BarChart2, Users, MessageSquare, Star, Upload } from 'lucide-react';
import { PageWrapper } from '@/components/layout/PageWrapper';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Drawer } from '@/components/ui/Drawer';
import { Input, Textarea, Select } from '@/components/ui/Input';
import { formatDate, formatRelativeTime } from '@/utils/formatters';
import { toast } from '@/stores/uiStore';
import { cn } from '@/utils/cn';
import api from '@/services/api';
import { Modal } from '@/components/ui/Modal';
import { ExcelUploader } from '@/components/leads/ExcelUploader';
import { ColumnMapper } from '@/components/leads/ColumnMapper';
import { Tooltip } from '@/components/ui/Tooltip';

const STATUS_TABS = ['All', 'Active', 'Scheduled', 'Completed', 'Paused'];
const TONE_OPTIONS = [
  { value: 'friendly', label: 'Friendly & Warm' },
  { value: 'professional', label: 'Professional' },
  { value: 'caring', label: 'Caring & Helpful' },
  { value: 'energetic', label: 'Energetic & Upbeat' },
];
const LANGUAGE_OPTIONS = [
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Spanish (Español)' },
  { value: 'hi', label: 'Hindi (हिन्दी)' },
  { value: 'gu', label: 'Gujarati (ગુજરાતી)' },
  { value: 'fr', label: 'French (Français)' },
  { value: 'de', label: 'German (Deutsch)' },
];

// Campaign Builder — multi-step drawer
function CampaignBuilder({ isOpen, onClose }) {
  const [step, setStep] = useState(0);
  const [launching, setLaunching] = useState(false);
  const [form, setForm] = useState({
    name: '',
    description: '',
    tone: 'friendly',
    language: 'en',
    sendWindowStart: '09:00',
    sendWindowEnd: '18:00',
    followupDays: '1,3,7',
  });

  const launchBtnRef = useRef(null);
  const iconRef = useRef(null);

  const steps = ['Campaign Info', 'Schedule', 'Review & Launch'];

  const handleLaunch = async () => {
    if (!form.name) return;
    setLaunching(true);

    try {
      // POST to real API
      await api.post('/campaigns', {
        name: form.name,
        agentTone: form.tone,
        language: form.language,
        openingTemplate: form.description,
        sendWindowStart: form.sendWindowStart,
        sendWindowEnd: form.sendWindowEnd,
      });

      // GSAP launch animation
      const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (!prefersReduced && launchBtnRef.current) {
        const tl = gsap.timeline();
        tl.to(launchBtnRef.current, { scale: 0.96, duration: 0.1 })
          .to(launchBtnRef.current, { scale: 1, duration: 0.15 });
      }

      await new Promise((r) => setTimeout(r, 600));
      toast.success(`"${form.name}" campaign created successfully!`, { title: 'Campaign Created' });
      setStep(0);
      setForm({ name: '', description: '', tone: 'friendly', language: 'en', sendWindowStart: '09:00', sendWindowEnd: '18:00', followupDays: '1,3,7' });
      onClose(true); // pass true to trigger reload
    } catch (err) {
      toast.error(err.response?.data?.error || err.message, { title: 'Creation Failed' });
    } finally {
      setLaunching(false);
    }
  };

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title="New Campaign"
      description="Configure your AI agent outbound campaign"
      width="520px"
      footer={
        <div className="flex items-center justify-between w-full">
          {step > 0 ? (
            <Button variant="secondary" onClick={() => setStep(s => s - 1)}>Back</Button>
          ) : <div />}
          {step < steps.length - 1 ? (
            <Button variant="primary" onClick={() => setStep(s => s + 1)} disabled={!form.name && step === 0}>
              Continue
            </Button>
          ) : (
            <Button
              ref={launchBtnRef}
              variant="primary"
              loading={launching}
              icon={<Megaphone size={14} />}
              onClick={handleLaunch}
            >
              Launch Campaign
            </Button>
          )}
        </div>
      }
    >
      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-6">
        {steps.map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <div
              className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold transition-all"
              style={{
                background: i <= step ? 'var(--accent)' : 'var(--bg-surface)',
                color: i <= step ? '#fff' : 'var(--text-muted)',
                border: `1px solid ${i <= step ? 'var(--accent)' : 'var(--border-subtle)'}`,
              }}
            >
              {i + 1}
            </div>
            <span className="text-xs" style={{ color: i === step ? 'var(--text-primary)' : 'var(--text-muted)' }}>
              {s}
            </span>
            {i < steps.length - 1 && (
              <div className="w-6 h-px" style={{ background: 'var(--border-subtle)' }} />
            )}
          </div>
        ))}
      </div>

      {step === 0 && (
        <div className="space-y-4">
          <Input label="Campaign Name" placeholder="e.g. Summer Solar Push" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
          <Textarea label="Description" placeholder="What is this campaign about?" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3} />
          <div className="grid grid-cols-2 gap-3">
            <Select label="Agent Tone" value={form.tone} onChange={e => setForm(f => ({ ...f, tone: e.target.value }))}>
              {TONE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </Select>
            <Select label="Language" value={form.language} onChange={e => setForm(f => ({ ...f, language: e.target.value }))}>
              {LANGUAGE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </Select>
          </div>
        </div>
      )}

      {step === 1 && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Input label="Send Window Start" type="time" value={form.sendWindowStart} onChange={e => setForm(f => ({ ...f, sendWindowStart: e.target.value }))} />
            <Input label="Send Window End" type="time" value={form.sendWindowEnd} onChange={e => setForm(f => ({ ...f, sendWindowEnd: e.target.value }))} />
          </div>
          <Input label="Follow-up Days" placeholder="1,3,7" hint="Comma-separated days after no reply" value={form.followupDays} onChange={e => setForm(f => ({ ...f, followupDays: e.target.value }))} />
          <div className="p-3 rounded-xl" style={{ background: 'var(--accent-light)', border: '1px solid rgba(94,106,210,0.2)' }}>
            <p className="text-xs" style={{ color: 'var(--accent-text)' }}>
              Follow-ups will auto-send if the lead doesn't reply on Day {form.followupDays}
            </p>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl space-y-3" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
            {[
              { label: 'Name', val: form.name },
              { label: 'Tone', val: TONE_OPTIONS.find(o => o.value === form.tone)?.label },
              { label: 'Language', val: LANGUAGE_OPTIONS.find(o => o.value === form.language)?.label },
              { label: 'Send Window', val: `${form.sendWindowStart} – ${form.sendWindowEnd}` },
              { label: 'Follow-ups', val: `Day ${form.followupDays}` },
            ].map(m => (
              <div key={m.label} className="flex items-center justify-between">
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{m.label}</span>
                <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{m.val}</span>
              </div>
            ))}
          </div>
          <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
            Upload leads after launching. The AI agent will begin outreach within the send window.
          </p>
        </div>
      )}
    </Drawer>
  );
}

function CampaignCard({ campaign, onView }) {
  const [isHovered, setIsHovered] = useState(false);

  // Correct messagesSent property name (case-sensitive matching backend)
  const messagesSentCount = campaign.messagesSent || 0;
  const totalLeadsCount = campaign.totalLeads || 0;

  // Calculate outreach progress compared to max possible capacity (3 messages per lead)
  const progress = totalLeadsCount > 0
    ? Math.round((messagesSentCount / (totalLeadsCount * 3)) * 100)
    : 0;

  // Status visual styles
  const statusConfig = {
    active: {
      border: isHovered ? '1px solid rgba(74, 103, 65, 0.6)' : '1px solid rgba(74, 103, 65, 0.25)',
      glow: isHovered ? 'rgba(74, 103, 65, 0.15)' : 'rgba(74, 103, 65, 0.05)',
      dotColor: 'var(--success)',
      progressColor: 'var(--success)'
    },
    paused: {
      border: isHovered ? '1px solid rgba(176, 125, 42, 0.6)' : '1px solid rgba(176, 125, 42, 0.25)',
      glow: isHovered ? 'rgba(176, 125, 42, 0.15)' : 'rgba(176, 125, 42, 0.05)',
      dotColor: 'var(--warning)',
      progressColor: 'var(--warning)'
    },
    scheduled: {
      border: isHovered ? '1px solid rgba(61, 107, 142, 0.6)' : '1px solid rgba(61, 107, 142, 0.25)',
      glow: isHovered ? 'rgba(61, 107, 142, 0.15)' : 'rgba(61, 107, 142, 0.05)',
      dotColor: 'var(--info)',
      progressColor: 'var(--info)'
    },
    completed: {
      border: isHovered ? '1px solid var(--text-primary)' : '1px solid var(--border-glass)',
      glow: isHovered ? 'rgba(31, 20, 12, 0.08)' : 'none',
      dotColor: 'var(--text-muted)',
      progressColor: 'var(--accent)'
    },
    draft: {
      border: isHovered ? '1px solid var(--accent)' : '1px solid var(--border-glass)',
      glow: isHovered ? 'rgba(196, 101, 74, 0.12)' : 'none',
      dotColor: 'var(--text-muted)',
      progressColor: 'var(--accent)'
    }
  };

  const currentStyle = statusConfig[campaign.status] || {
    border: isHovered ? '1px solid var(--accent)' : '1px solid var(--border-glass)',
    glow: isHovered ? 'rgba(196, 101, 74, 0.08)' : 'none',
    dotColor: 'var(--accent)',
    progressColor: 'var(--accent)'
  };

  return (
    <div
      className="card cursor-pointer transition-all duration-300 ease-out"
      onClick={onView}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        transform: isHovered ? 'translateY(-4px)' : 'translateY(0)',
        border: currentStyle.border,
        boxShadow: isHovered
          ? `0 12px 30px ${currentStyle.glow}, var(--shadow-float)`
          : `var(--shadow-card)`,
        background: 'var(--bg-glass-strong)',
        fontFamily: 'var(--font-body)'
      }}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1 min-w-0">
          <p
            className="text-[15px] font-semibold mb-1 truncate transition-colors duration-200"
            style={{
              color: isHovered ? 'var(--accent)' : 'var(--text-primary)',
              fontFamily: 'var(--font-display)'
            }}
          >
            {campaign.name}
          </p>
          <p className="text-xs line-clamp-2 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            {campaign.description || "No description provided."}
          </p>
        </div>
        <Badge variant={campaign.status} className="ml-3 flex-shrink-0 flex items-center gap-1 font-semibold uppercase tracking-wider text-[10px]">
          {campaign.status}
          {campaign.status === 'active' && (
            <span className="flex h-1.5 w-1.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--success)] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[var(--success)]"></span>
            </span>
          )}
        </Badge>
      </div>

      {/* Metrics Row with Tooltips */}
      <div className="grid grid-cols-3 gap-2.5 mb-4">
        {[
          {
            icon: <Users size={12} />,
            label: 'Leads',
            val: campaign.totalLeads || 0,
            tooltip: "Total leads imported for this campaign"
          },
          {
            icon: <MessageSquare size={12} />,
            label: 'Replies',
            val: `${campaign.replyRate?.toFixed(0) || 0}%`,
            tooltip: "Percentage of leads who replied to agent"
          },
          {
            icon: <Star size={12} />,
            label: 'Qualified',
            val: campaign.qualified || 0,
            tooltip: "Leads with qualification score of 3/4 or higher"
          },
        ].map(m => (
          <Tooltip key={m.label} content={m.tooltip} side="top" align="center" delayDuration={200}>
            <div
              className="text-center p-2 rounded-xl transition-all duration-200"
              style={{
                background: isHovered ? 'var(--bg-glass)' : 'var(--bg-surface)',
                border: '1px solid var(--border-glass)',
              }}
            >
              <div className="flex items-center justify-center gap-1 mb-0.5" style={{ color: 'var(--text-muted)' }}>
                {m.icon}
                <span className="text-[10px] uppercase tracking-wider font-medium">{m.label}</span>
              </div>
              <p className="text-[14px] font-bold stat-value" style={{ color: 'var(--text-primary)' }}>{m.val}</p>
            </div>
          </Tooltip>
        ))}
      </div>

      {/* Progress Section */}
      <div className="mt-3.5 mb-2">
        <div className="flex items-center justify-between text-[11px] font-semibold tracking-wide mb-1.5" style={{ color: 'var(--text-secondary)' }}>
          <span className="flex items-center gap-1">
            <span>Progress</span>
            <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>
              ({messagesSentCount} / {totalLeadsCount * 3 || 0} messages)
            </span>
          </span>
          <span className="font-bold" style={{ color: currentStyle.progressColor }}>
            {Math.min(progress, 100)}%
          </span>
        </div>
        <div
          className="w-full h-1.5 rounded-full overflow-hidden"
          style={{ background: 'var(--border-subtle)' }}
        >
          <div
            className="h-full rounded-full transition-all duration-500 ease-out"
            style={{
              width: `${Math.min(progress, 100)}%`,
              background: currentStyle.progressColor || 'var(--accent)',
            }}
          />
        </div>
      </div>

      {/* Footer & Info */}
      <div
        className="flex items-center justify-between mt-3 pt-3"
        style={{ borderTop: '1px solid var(--border-subtle)' }}
      >
        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
          {campaign.status === 'active'
            ? `Launched ${formatDate(campaign.createdAt)}`
            : `Created ${formatDate(campaign.createdAt)}`}
        </span>

        <span
          className="text-xs font-semibold transition-colors duration-200 flex items-center gap-0.5"
          style={{ color: isHovered ? 'var(--accent)' : 'var(--text-muted)' }}
        >
          View Details <span className="transition-transform duration-200" style={{ transform: isHovered ? 'translateX(2px)' : 'translateX(0)', display: 'inline-block' }}>→</span>
        </span>
      </div>
    </div>
  );
}

function CampaignDetailsDrawer({ campaign, isOpen, onClose, onStatusChange }) {
  const [loadingAction, setLoadingAction] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploadStep, setUploadStep] = useState('upload');
  const [parsedData, setParsedData] = useState(null);

  if (!campaign) return null;

  const messagesSentCount = campaign.messagesSent || 0;
  const totalLeadsCount = campaign.totalLeads || 0;
  const progress = totalLeadsCount > 0
    ? Math.round((messagesSentCount / (totalLeadsCount * 3)) * 100)
    : 0;

  const handleLaunch = async () => {
    setLoadingAction(true);
    try {
      await api.post(`/campaigns/${campaign.id}/launch`);
      toast.success('Campaign outreach launched successfully!');
      onStatusChange();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to launch campaign');
    } finally {
      setLoadingAction(false);
    }
  };

  const handlePause = async () => {
    setLoadingAction(true);
    try {
      await api.post(`/campaigns/${campaign.id}/pause`);
      toast.success('Campaign outreach paused.');
      onStatusChange();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to pause campaign');
    } finally {
      setLoadingAction(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this campaign?')) return;
    setLoadingAction(true);
    try {
      await api.delete(`/campaigns/${campaign.id}`);
      toast.success('Campaign deleted.');
      onClose(true); // Close and refresh list
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to delete campaign');
    } finally {
      setLoadingAction(false);
    }
  };

  const handleParsed = (data) => {
    setParsedData(data);
    setUploadStep('map');
  };

  const handleImportConfirm = async ({ mapping }) => {
    try {
      const file = parsedData?.file;
      if (!file) throw new Error("File missing");

      const formData = new FormData();
      formData.append('file', file);
      formData.append('mapping', JSON.stringify(mapping));
      formData.append('campaignId', campaign.id);

      const res = await api.post('/leads/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      if (res.data.success) {
        toast.success(`${res.data.data.inserted} leads imported successfully.`, { title: 'Import Successful' });
        onStatusChange(); // reload details and list
      }
    } catch (err) {
      toast.error(err.response?.data?.error || err.message, { title: 'Import Failed' });
    } finally {
      setUploadOpen(false);
      setUploadStep('upload');
      setParsedData(null);
    }
  };

  return (
    <>
      <Drawer
        isOpen={isOpen}
        onClose={() => onClose(false)}
        title={campaign.name}
        description={campaign.description || 'AI Outreach Campaign'}
        width="560px"
        footer={
          <div className="flex items-center justify-between w-full">
            <Button variant="danger" icon={<Trash2 size={14} />} onClick={handleDelete} loading={loadingAction}>
              Delete
            </Button>
            {campaign.status === 'active' ? (
              <Button variant="secondary" icon={<Pause size={14} />} onClick={handlePause} loading={loadingAction}>
                Pause Campaign
              </Button>
            ) : (
              <Button variant="primary" icon={<Play size={14} />} onClick={handleLaunch} loading={loadingAction}>
                Launch Campaign
              </Button>
            )}
          </div>
        }
      >
        <div className="space-y-6">
          {/* Metadata Grid */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Status', value: <Badge variant={campaign.status}>{campaign.status}</Badge> },
              { label: 'Agent Tone', value: campaign.agentTone },
              { label: 'Language', value: campaign.language === 'en' ? 'English' : campaign.language },
              { label: 'Knowledge Base', value: campaign.kb?.name || 'Main Knowledge Base' },
              { label: 'Send Window', value: `${campaign.sendWindowStart} – ${campaign.sendWindowEnd}` },
            ].map(m => (
              <div key={m.label} className="px-3 py-2 rounded-xl" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
                <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>{m.label}</p>
                <div className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{m.value}</div>
              </div>
            ))}
          </div>

          {/* Stats overview */}
          <div className="card-no-hover">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Outreach Analytics</h3>
              <Button variant="secondary" size="sm" icon={<Upload size={12} />} onClick={() => { setUploadOpen(true); setUploadStep('upload'); }}>
                Upload Leads
              </Button>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Total Leads', val: campaign.totalLeads || 0 },
                { label: 'Reply Rate', val: `${campaign.replyRate?.toFixed(0) || 0}%` },
                { label: 'Qualified Leads', val: campaign.qualified || 0 },
              ].map(s => (
                <div key={s.label} className="text-center p-3 rounded-lg" style={{ background: 'var(--bg-surface)' }}>
                  <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>{s.label}</p>
                  <p className="text-xl font-semibold stat-value" style={{ color: 'var(--text-primary)' }}>{s.val}</p>
                </div>
              ))}
            </div>

            {/* Progress bar inside details drawer */}
            {totalLeadsCount > 0 && (
              <div className="mt-4 pt-3.5" style={{ borderTop: '1px solid var(--border-subtle)' }}>
                <div className="flex items-center justify-between text-xs font-semibold tracking-wide mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                  <span className="flex items-center gap-1">
                    <span>Campaign Outreach Progress</span>
                    <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>
                      ({messagesSentCount} / {totalLeadsCount * 3} messages sent)
                    </span>
                  </span>
                  <span className="font-bold" style={{ color: 'var(--accent)' }}>
                    {Math.min(progress, 100)}%
                  </span>
                </div>
                <div
                  className="w-full h-1.5 rounded-full overflow-hidden"
                  style={{ background: 'var(--border-subtle)' }}
                >
                  <div
                    className="h-full rounded-full transition-all duration-500 ease-out"
                    style={{
                      width: `${Math.min(progress, 100)}%`,
                      background: 'var(--accent)',
                    }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Timeline & schedule */}
          <div className="p-4 rounded-xl space-y-2" style={{ background: 'var(--accent-light)', border: '1px solid rgba(196,101,74,0.15)' }}>
            <h4 className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--accent-text)' }}>
              Follow-Up Auto-Scheduler
            </h4>
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
              Leads who do not respond to the initial outreach message will automatically receive follow-ups scheduled at:
            </p>
            <div className="flex gap-2 mt-2">
              {['Day 1', 'Day 3', 'Day 7'].map((day, i) => {
                const schedule = campaign.followupSchedule || {};
                const active = schedule[`day${[1,3,7][i]}`];
                return (
                  <span
                    key={day}
                    className="text-[11px] px-2.5 py-0.5 rounded-full font-medium"
                    style={{
                      background: active ? 'var(--accent)' : 'var(--bg-surface)',
                      color: active ? '#fff' : 'var(--text-muted)',
                      border: active ? 'none' : '1px solid var(--border-subtle)'
                    }}
                  >
                    {day}: {active ? 'Enabled' : 'Disabled'}
                  </span>
                );
              })}
            </div>
          </div>
        </div>
      </Drawer>

      <Modal
        isOpen={uploadOpen}
        onClose={() => { setUploadOpen(false); setUploadStep('upload'); setParsedData(null); }}
        title="Upload Leads for Campaign"
        description={`Upload a spreadsheet to import leads specifically for "${campaign.name}".`}
        size="md"
      >
        {uploadStep === 'upload' ? (
          <ExcelUploader onParsed={handleParsed} onCancel={() => setUploadOpen(false)} />
        ) : (
          <ColumnMapper
            headers={parsedData?.headers || []}
            rows={parsedData?.rows || []}
            fileName={parsedData?.fileName || ''}
            onConfirm={handleImportConfirm}
            onBack={() => setUploadStep('upload')}
          />
        )}
      </Modal>
    </>
  );
}

export default function Campaigns() {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('All');
  const [builderOpen, setBuilderOpen] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const fetchCampaigns = async () => {
    try {
      setLoading(true);
      const res = await api.get('/campaigns');
      if (res.data.success) {
        setCampaigns(res.data.data || []);
      }
    } catch (err) {
      console.error('Failed to load campaigns', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const filtered = campaigns.filter(c =>
    activeTab === 'All' || c.status === activeTab.toLowerCase()
  );

  return (
    <PageWrapper>
      <div className="page-header">
        <div>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>
            {campaigns.filter(c => c.status === 'active').length} active · {campaigns.length} total
          </p>
        </div>
        <Button variant="primary" size="sm" icon={<Plus size={14} />} onClick={() => setBuilderOpen(true)} id="btn-new-campaign">
          New Campaign
        </Button>
      </div>

      {/* Status tabs */}
      <div className="flex items-center gap-1 mb-6 overflow-x-auto">
        {STATUS_TABS.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap"
            style={{
              background: activeTab === tab ? 'var(--accent)' : 'var(--bg-glass)',
              color: activeTab === tab ? '#fff' : 'var(--text-secondary)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="card-no-hover space-y-3">
              <div className="skeleton h-4 w-40 rounded" />
              <div className="skeleton h-3 w-full rounded" />
              <div className="skeleton h-3 w-3/4 rounded" />
              <div className="grid grid-cols-3 gap-2">
                {Array.from({ length: 3 }).map((__, j) => <div key={j} className="skeleton h-12 rounded-lg" />)}
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<Megaphone size={22} />}
          title="No campaigns yet"
          description="Create your first AI-powered outbound campaign to start engaging leads automatically."
          action={() => setBuilderOpen(true)}
          actionLabel="Create Campaign"
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(c => (
            <CampaignCard key={c.id} campaign={c} onView={() => { setSelectedCampaign(c); setDetailOpen(true); }} />
          ))}
        </div>
      )}

      <CampaignBuilder isOpen={builderOpen} onClose={(reload) => {
        setBuilderOpen(false);
        if (reload === true) fetchCampaigns();
      }} />

      <CampaignDetailsDrawer
        campaign={selectedCampaign}
        isOpen={detailOpen}
        onClose={(refresh) => {
          setDetailOpen(false);
          setSelectedCampaign(null);
          if (refresh === true) fetchCampaigns();
        }}
        onStatusChange={() => {
          fetchCampaigns();
          if (selectedCampaign) {
            api.get(`/campaigns/${selectedCampaign.id}`).then(res => {
              if (res.data.success) setSelectedCampaign(res.data.data);
            });
          }
        }}
      />
    </PageWrapper>
  );
}
