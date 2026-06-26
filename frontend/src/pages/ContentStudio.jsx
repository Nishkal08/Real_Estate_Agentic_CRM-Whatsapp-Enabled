import { useState } from 'react';
import {
  Copy, CheckCheck, Wand2, RefreshCw, MessageCircle, Briefcase,
  MessageSquare, Mail, AtSign, Heart, ThumbsUp, Send, Share2,
  MoreHorizontal, Bookmark
} from 'lucide-react';
import { PageWrapper } from '@/components/layout/PageWrapper';
import { Button } from '@/components/ui/Button';
import { Textarea, Select } from '@/components/ui/Input';
import { toast } from '@/stores/uiStore';
import api from '@/services/api';

const PLATFORMS = [
  { key: 'whatsapp', label: 'WhatsApp', Icon: MessageCircle, color: '#25D366' },
  { key: 'instagram', label: 'Instagram', Icon: AtSign, color: '#E1306C' },
  { key: 'linkedin', label: 'LinkedIn', Icon: Briefcase, color: '#0A66C2' },
  { key: 'sms', label: 'SMS', Icon: MessageSquare, color: '#3D6B8E' },
  { key: 'email', label: 'Email', Icon: Mail, color: 'var(--accent)' },
];

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('Copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <Button
      variant="secondary"
      size="sm"
      onClick={handleCopy}
      icon={copied ? <CheckCheck size={13} style={{ color: 'var(--success)' }} /> : <Copy size={13} />}
    >
      {copied ? 'Copied' : 'Copy'}
    </Button>
  );
}

/* ──────────────── MOCKUP RENDERING COMPONENTS ──────────────── */

function WhatsAppMockup({ content }) {
  return (
    <div className="flex flex-col rounded-2xl overflow-hidden border border-[var(--border-subtle)] shadow-xs bg-[#efeae2] max-w-sm mx-auto w-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-[#005c4b] text-white">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-full bg-[#128C7E] flex items-center justify-center font-bold text-xs">
            L
          </div>
          <div>
            <p className="text-[11px] font-semibold leading-tight">Prospect Lead (WhatsApp)</p>
            <p className="text-[8px] opacity-80 leading-none">online</p>
          </div>
        </div>
        <div className="flex gap-3 opacity-95 text-xs">
          <span>📞</span>
          <span>📹</span>
          <MoreHorizontal size={14} />
        </div>
      </div>

      {/* Chat Thread */}
      <div className="p-4 flex flex-col gap-2 min-h-[220px] overflow-y-auto max-h-[360px]">
        <div className="self-center bg-[#e1f3fb] text-[9px] text-gray-600 px-2 py-0.5 rounded shadow-2xs my-1 font-medium">
          TODAY
        </div>
        <div
          className="relative max-w-[85%] self-end bg-[#d9fdd3] text-gray-800 p-2.5 rounded-lg rounded-tr-none shadow-2xs text-[11.5px] leading-relaxed font-normal"
          style={{ whiteSpace: 'pre-wrap', fontFamily: 'var(--font-body)' }}
        >
          {content}
          <div className="flex items-center justify-end gap-1 mt-1 text-[8px] text-gray-500 text-right">
            <span>12:30 PM</span>
            <span className="text-[#53bdeb] font-bold">✓✓</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function InstagramMockup({ content }) {
  return (
    <div className="flex flex-col rounded-2xl overflow-hidden border border-[var(--border-subtle)] bg-[var(--bg-elevated)] shadow-xs max-w-sm mx-auto w-full">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-[var(--border-subtle)]">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-[var(--accent)] flex items-center justify-center">
            <span className="text-[9px] text-white font-bold">A</span>
          </div>
          <div>
            <p className="text-[11px] font-bold text-[var(--text-primary)] leading-tight">aurion_marketing</p>
            <p className="text-[8px] text-[var(--text-muted)] leading-none">Sponsored</p>
          </div>
        </div>
        <MoreHorizontal size={14} className="text-[var(--text-muted)]" />
      </div>

      {/* Media Gradient Card */}
      <div className="aspect-square bg-gradient-to-tr from-[#f09433] via-[#e6683c] to-[#bc1888] flex flex-col items-center justify-center p-6 text-white text-center">
        <div className="w-11 h-11 rounded-full bg-white/20 flex items-center justify-center mb-2">
          <span className="text-xl">✨</span>
        </div>
        <h3 className="font-display font-semibold text-base tracking-tight leading-tight">Campaign Concept</h3>
        <p className="text-[8px] opacity-80 mt-1 uppercase tracking-widest font-bold">Horizon Group Real Estate</p>
      </div>

      {/* Interactive Controls */}
      <div className="flex items-center justify-between px-3 py-2">
        <div className="flex gap-3 text-[var(--text-secondary)]">
          <Heart size={16} className="cursor-pointer hover:text-red-500 transition-colors" />
          <MessageCircle size={16} className="cursor-pointer" />
          <Send size={16} className="cursor-pointer" />
        </div>
        <Bookmark size={16} className="text-[var(--text-secondary)]" />
      </div>

      {/* Caption Content */}
      <div className="px-3 pb-3 text-[11px] leading-relaxed text-[var(--text-primary)] max-h-[120px] overflow-y-auto">
        <p className="mb-0.5 font-bold">aurion_marketing</p>
        <div style={{ whiteSpace: 'pre-wrap' }}>{content}</div>
      </div>
    </div>
  );
}

function LinkedInMockup({ content }) {
  return (
    <div className="flex flex-col rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-4 shadow-xs max-w-md mx-auto w-full">
      {/* Profile Info */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex gap-2">
          <div className="w-8 h-8 rounded-full bg-[var(--accent-light)] border border-[var(--border-glass)] flex items-center justify-center text-[var(--accent)] font-bold text-xs">
            A
          </div>
          <div>
            <div className="flex items-center gap-1 leading-tight">
              <span className="text-[11px] font-bold text-[var(--text-primary)]">Aurion AI Specialist</span>
              <span className="text-[9px] text-[var(--text-muted)]">• 1st</span>
            </div>
            <p className="text-[9px] text-[var(--text-muted)] leading-none mt-0.5">Automated Sales Consultant at Horizon Group</p>
            <p className="text-[8px] text-[var(--text-muted)] mt-0.5">1h • Edited • 🌐</p>
          </div>
        </div>
        <MoreHorizontal size={14} className="text-[var(--text-muted)]" />
      </div>

      {/* Post Text */}
      <div
        className="text-[11px] leading-relaxed text-[var(--text-primary)] mb-3 max-h-[220px] overflow-y-auto"
        style={{ whiteSpace: 'pre-wrap' }}
      >
        {content}
      </div>

      <div className="border-t border-[var(--border-subtle)] my-2" />

      {/* Action Footer */}
      <div className="flex items-center justify-between text-[var(--text-secondary)] px-1">
        <button className="flex items-center gap-1 text-[10px] font-semibold hover:bg-[var(--bg-surface)] py-1 px-2 rounded transition-colors">
          <ThumbsUp size={12} /> Like
        </button>
        <button className="flex items-center gap-1 text-[10px] font-semibold hover:bg-[var(--bg-surface)] py-1 px-2 rounded transition-colors">
          <MessageCircle size={12} /> Comment
        </button>
        <button className="flex items-center gap-1 text-[10px] font-semibold hover:bg-[var(--bg-surface)] py-1 px-2 rounded transition-colors">
          <Share2 size={12} /> Share
        </button>
        <button className="flex items-center gap-1 text-[10px] font-semibold hover:bg-[var(--bg-surface)] py-1 px-2 rounded transition-colors">
          <Send size={12} /> Send
        </button>
      </div>
    </div>
  );
}

function SMSMockup({ content }) {
  return (
    <div className="flex flex-col rounded-2xl overflow-hidden border border-[var(--border-subtle)] bg-[var(--bg-page)] shadow-xs max-w-[240px] mx-auto w-full">
      {/* Phone Header */}
      <div className="flex flex-col items-center px-3 py-1 bg-[var(--bg-surface)] border-b border-[var(--border-subtle)] text-center">
        <span className="text-[8px] text-[var(--text-secondary)] font-semibold leading-tight">9:41 AM</span>
        <div className="w-4 h-4 rounded-full bg-[var(--text-muted)] flex items-center justify-center text-white text-[8px] font-bold mt-0.5">
          C
        </div>
        <span className="text-[8px] font-semibold text-[var(--text-primary)] mt-0.5 leading-none">Campaign Partner</span>
      </div>

      {/* Bubble Area */}
      <div className="p-3 flex flex-col gap-2 min-h-[160px] bg-[var(--bg-elevated)] justify-end">
        <div
          className="max-w-[90%] self-end bg-[#007AFF] text-white p-2.5 rounded-2xl rounded-tr-none shadow-2xs text-[11px] leading-relaxed font-normal"
          style={{ whiteSpace: 'pre-wrap' }}
        >
          {content}
        </div>
        <span className="self-end text-[8px] text-[var(--text-muted)] mr-1 -mt-1 font-semibold">Delivered</span>
      </div>
    </div>
  );
}

function EmailMockup({ content }) {
  return (
    <div className="flex flex-col rounded-2xl overflow-hidden border border-[var(--border-subtle)] bg-[var(--bg-elevated)] shadow-xs w-full max-w-lg mx-auto">
      {/* Client Frame */}
      <div
        className="flex items-center justify-between px-3 py-2"
        style={{ background: 'var(--bg-surface)', borderBottom: '1px solid var(--border-subtle)' }}
      >
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-red-400" />
          <div className="w-2 h-2 rounded-full bg-yellow-400" />
          <div className="w-2 h-2 rounded-full bg-green-400" />
        </div>
        <span className="text-[10px] text-[var(--text-secondary)] font-semibold font-mono">Mail Composer</span>
        <div style={{ width: 32 }} />
      </div>

      {/* Email Headers */}
      <div className="flex flex-col text-[11px] text-[var(--text-primary)] border-b border-[var(--border-subtle)] bg-[var(--bg-glass)]">
        <div className="flex items-center px-3 py-1.5 border-b border-[var(--border-subtle)] gap-1.5">
          <span className="text-[var(--text-muted)] font-semibold">To:</span>
          <span>leads.database@horizon.in</span>
        </div>
        <div className="flex items-center px-3 py-1.5 gap-1.5">
          <span className="text-[var(--text-muted)] font-semibold">Subject:</span>
          <span className="font-semibold text-[var(--accent-text)]">Premium Launch Update</span>
        </div>
      </div>

      {/* Body text */}
      <div className="p-4 min-h-[180px] bg-[var(--bg-glass-strong)] overflow-y-auto max-h-[300px]">
        <div
          className="text-[11.5px] leading-relaxed text-[var(--text-primary)] font-normal"
          style={{ whiteSpace: 'pre-wrap', fontFamily: 'var(--font-body)' }}
        >
          {content}
        </div>
      </div>
    </div>
  );
}

/* ──────────────── MAIN WORKSPACE ──────────────── */

export default function ContentStudio() {
  const [brief, setBrief] = useState('');
  const [tone, setTone] = useState('Persuasive');
  const [audience, setAudience] = useState('Homeowners');
  const [generatedContent, setGeneratedContent] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('whatsapp');

  const handleGenerate = async () => {
    const trimmedBrief = brief.trim();
    if (!trimmedBrief) return;
    setLoading(true);
    try {
      const res = await api.post('/content/generate', {
        type: 'generator',
        brief: `${trimmedBrief} Target Audience: ${audience}.`,
        tone,
      });
      if (res.data.success) {
        setGeneratedContent(res.data.data);
        toast.success('Content generated for 5 platforms!');
      }
    } catch (err) {
      toast.error('Failed to generate content. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const activePlatform = PLATFORMS.find(p => p.key === activeTab);
  const activeContent = generatedContent ? generatedContent[activeTab] : null;

  // Render correct device mockup based on active tab
  const renderDeviceMockup = () => {
    if (!activeContent) return null;
    switch (activeTab) {
      case 'whatsapp':
        return <WhatsAppMockup content={activeContent} />;
      case 'instagram':
        return <InstagramMockup content={activeContent} />;
      case 'linkedin':
        return <LinkedInMockup content={activeContent} />;
      case 'sms':
        return <SMSMockup content={activeContent} />;
      case 'email':
        return <EmailMockup content={activeContent} />;
      default:
        return null;
    }
  };

  // Convert content to flat string display format
  let rawDisplayText = activeContent;
  if (typeof activeContent === 'object' && activeContent !== null) {
    rawDisplayText = Object.entries(activeContent)
      .map(([key, val]) => {
        const formattedKey = key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
        return `[${formattedKey}]\n${val}`;
      })
      .join('\n\n');
  }

  return (
    <PageWrapper>
      {/* Clean Aesthetic Header */}
      <div className="page-header mb-8">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-[var(--accent)] mb-1">
            Marketing Suite
          </p>
          <h1 className="text-2xl md:text-3xl font-display font-semibold tracking-tight text-[var(--text-primary)]">
            Campaign Content Studio
          </h1>
          <p className="text-sm mt-1 text-[var(--text-secondary)]">
            AI-powered multichannel real estate content copywriter
          </p>
        </div>
      </div>

      {/* Two Column Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Config Panel — STICKY */}
        <div className="lg:col-span-5 lg:sticky lg:top-[88px] card-no-hover space-y-5 p-6 rounded-2xl bg-[var(--bg-glass-strong)] border border-[var(--border-subtle)] shadow-xs">
          <div className="flex items-center gap-3 pb-3 border-b border-[var(--border-subtle)]">
            <div className="p-2 rounded-xl bg-[var(--accent-light)] text-[var(--accent)]">
              <Wand2 size={18} />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-[var(--text-primary)]">Campaign Configuration</h3>
              <p className="text-[11px] text-[var(--text-muted)]">Configure content inputs & parameters</p>
            </div>
          </div>

          <Textarea
            label="What is this campaign about?"
            placeholder="e.g. give me content ideas for digital marketing of 3 bhk residential project named life in blue."
            value={brief}
            onChange={e => setBrief(e.target.value)}
            rows={5}
            className="w-full text-sm rounded-xl focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select label="Tone" value={tone} onChange={e => setTone(e.target.value)}>
              <option value="Persuasive">Persuasive</option>
              <option value="Informative">Informative</option>
              <option value="Urgency-driven">Urgency-driven</option>
              <option value="Conversational">Conversational</option>
            </Select>
            <Select label="Target Audience" value={audience} onChange={e => setAudience(e.target.value)}>
              <option value="Homeowners">Homeowners</option>
              <option value="Business owners">Business owners</option>
              <option value="Industrial clients">Industrial clients</option>
              <option value="General public">General public</option>
            </Select>
          </div>

          <Button
            variant="primary"
            icon={<Wand2 size={14} />}
            loading={loading}
            onClick={handleGenerate}
            disabled={!brief.trim()}
            className="w-full py-3 rounded-xl font-medium tracking-wide shadow-sm hover:shadow transition-all bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)]"
          >
            Generate Content
          </Button>

          {/* Jump Navigation List (renders only after content generation) */}
          {generatedContent && (
            <div className="pt-4 border-t border-[var(--border-subtle)] space-y-2">
              <p className="text-[10px] uppercase tracking-wider text-[var(--text-muted)] font-bold">
                Platform Selection
              </p>
              <div className="flex flex-col gap-1.5">
                {PLATFORMS.map(p => {
                  const isSelected = activeTab === p.key;
                  return (
                    <button
                      key={p.key}
                      onClick={() => setActiveTab(p.key)}
                      className="flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition-all"
                      style={{
                        background: isSelected ? 'var(--accent-light)' : 'transparent',
                        color: isSelected ? 'var(--accent-text)' : 'var(--text-primary)',
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <p.Icon size={13} style={{ color: isSelected ? 'var(--accent)' : p.color }} />
                        <span>{p.label}</span>
                      </div>
                      {isSelected && <span className="text-[9px] px-1.5 py-0.5 rounded bg-[var(--accent)] text-white font-mono">Active</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Unified Platform Preview Arena */}
        <div className="lg:col-span-7 space-y-6 w-full">
          {!generatedContent ? (
            <div className="card-no-hover flex flex-col items-center justify-center text-center p-8 sm:p-12 rounded-2xl bg-[var(--bg-glass)] border border-[var(--border-subtle)] min-h-[420px] shadow-xs">
              <div className="w-14 h-14 rounded-2xl bg-[var(--accent-light)] flex items-center justify-center text-[var(--accent)] mb-6 animate-pulse">
                <Wand2 size={24} />
              </div>
              <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">
                Generate Multichannel Concepts
              </h3>
              <p className="text-sm text-[var(--text-secondary)] max-w-md mb-8 leading-relaxed">
                Describe your project, campaign topic, or copywriting goal. The AI Copywriter will generate platform-optimized concepts and content outlines for all platforms instantly.
              </p>

              <div className="w-full max-w-lg">
                <p className="text-[10px] uppercase tracking-wider text-[var(--text-muted)] font-bold mb-4">
                  Optimized for platforms
                </p>
                <div className="flex flex-wrap items-center justify-center gap-3">
                  {PLATFORMS.map(p => (
                    <div
                      key={p.key}
                      className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] transition-all hover:-translate-y-[1px] shadow-2xs"
                    >
                      <p.Icon size={14} style={{ color: p.color }} />
                      <span className="text-xs font-semibold text-[var(--text-primary)]">
                        {p.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-5 animate-slide-up w-full">
              {/* Tab Header Controls */}
              <div className="flex flex-wrap items-center justify-between gap-4 pb-3 border-b border-[var(--border-subtle)]">
                <div className="flex items-center gap-2">
                  <h3 className="text-md font-semibold text-[var(--text-primary)]">Platform Preview Arena</h3>
                  <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-[var(--success-bg)] text-[var(--success)] font-semibold uppercase tracking-wider">
                    Ready
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    icon={<RefreshCw size={13} />}
                    onClick={handleGenerate}
                    loading={loading}
                  >
                    Regenerate
                  </Button>
                </div>
              </div>

              {/* Horizontal platform tabs for quick layout switching */}
              <div className="flex items-center gap-1.5 p-1 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl overflow-x-auto">
                {PLATFORMS.map(p => {
                  const isSelected = activeTab === p.key;
                  return (
                    <button
                      key={p.key}
                      onClick={() => setActiveTab(p.key)}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all"
                      style={{
                        background: isSelected ? 'var(--bg-glass-strong)' : 'transparent',
                        boxShadow: isSelected ? '0 1px 3px rgba(0,0,0,0.05)' : 'none',
                        color: isSelected ? 'var(--accent)' : 'var(--text-secondary)',
                      }}
                    >
                      <p.Icon size={13} style={{ color: isSelected ? 'var(--accent)' : p.color }} />
                      <span>{p.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Display visual Device Mockup & copy action */}
              <div className="card-no-hover p-6 rounded-2xl bg-[var(--bg-glass-strong)] border border-[var(--border-subtle)] shadow-xs space-y-6">
                <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-4">
                  <div className="flex items-center gap-2">
                    {activePlatform && <activePlatform.Icon size={16} style={{ color: activePlatform.color }} />}
                    <span className="text-xs font-bold uppercase tracking-wider" style={{ color: activePlatform?.color }}>
                      {activePlatform?.label} Visual Preview
                    </span>
                  </div>
                  <CopyButton text={rawDisplayText || ''} />
                </div>

                {/* Device Mockup rendering area */}
                <div className="py-2 flex justify-center w-full">
                  {renderDeviceMockup()}
                </div>

                {/* Raw Copy Block Area */}
                <div className="space-y-2 pt-4 border-t border-[var(--border-subtle)]">
                  <p className="text-[10px] uppercase tracking-wider text-[var(--text-muted)] font-bold">
                    Raw Copy Text
                  </p>
                  <div className="p-4 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)]">
                    <pre
                      className="text-xs leading-relaxed whitespace-pre-wrap select-all font-normal font-sans"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      {rawDisplayText}
                    </pre>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </PageWrapper>
  );
}
