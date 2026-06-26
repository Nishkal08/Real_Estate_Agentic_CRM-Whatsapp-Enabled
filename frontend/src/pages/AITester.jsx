import { useState } from 'react';
import { Send, Settings, Terminal, Activity, FileText } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { PageWrapper } from '@/components/layout/PageWrapper';
import { Input, Textarea, Select } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { toast } from '@/stores/uiStore';
import { cn } from '@/utils/cn';
import axios from 'axios';

// AI Service API is running on 8000
const aiServiceUrl = import.meta.env.VITE_AI_SERVICE_URL || 'http://localhost:8000';
const aiClient = axios.create({ baseURL: aiServiceUrl });

export default function AITester() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [threadId, setThreadId] = useState(() => `test-${Math.random().toString(36).substring(7)}`);

  // Settings
  const [campaignType, setCampaignType] = useState('lead');
  const [tone, setTone] = useState('friendly');
  const [language, setLanguage] = useState('en');

  // State Viewer
  const [agentState, setAgentState] = useState(null);
  const [agentStatus, setAgentStatus] = useState('');

  // KB Testing
  const [file, setFile] = useState(null);
  const [url, setUrl] = useState('');
  const [kbId, setKbId] = useState('main-kb');
  const [uploading, setUploading] = useState(false);
  const [sandboxKeyword, setSandboxKeyword] = useState('pain-breeze');

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg = input.trim();
    // Add an empty agent message placeholder to stream tokens into
    setMessages(prev => [
      ...prev,
      { role: 'user', content: userMsg },
      { role: 'agent', content: '' }
    ]);
    setInput('');
    setLoading(true);
    setAgentStatus('🧠 Analyzing intent...');

    try {
      const res = await fetch(`${aiServiceUrl}/agent/message/stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          thread_id: threadId,
          business_id: 'Horizon Group',
          lead_id: 'test-lead',
          lead_name: 'Demo User',
          message: userMsg,
          kb_id: kbId,
          campaign_config: { type: campaignType, agentTone: tone, language }
        })
      });

      const reader = res.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));

              if (data.type === 'thinking') {
                setAgentStatus('🧠 ' + data.text);
              } else if (data.type === 'token') {
                setAgentStatus('Generating response...');
                setMessages(prev => {
                  const newMsgs = [...prev];
                  const lastIndex = newMsgs.length - 1;
                  newMsgs[lastIndex] = {
                    ...newMsgs[lastIndex],
                    content: newMsgs[lastIndex].content + data.text
                  };
                  return newMsgs;
                });
              } else if (data.type === 'images') {
                if (data.urls && data.urls.length > 0) {
                  const imageMarkdown = data.urls.map(item => {
                    const imgUrl = typeof item === 'object' && item !== null ? item.url : item;
                    const caption = typeof item === 'object' && item !== null ? (item.caption || item.description || 'Project Image') : 'Project Image';
                    return `\n\n![${caption}](${imgUrl})`;
                  }).join('');
                  setMessages(prev => {
                    const newMsgs = [...prev];
                    const lastIndex = newMsgs.length - 1;
                    newMsgs[lastIndex] = {
                      ...newMsgs[lastIndex],
                      content: newMsgs[lastIndex].content + imageMarkdown
                    };
                    return newMsgs;
                  });
                }
              } else if (data.type === 'brochure') {
                if (data.url) {
                  const brochureMarkdown = `\n\n[📋 View Official Brochure](${data.url})`;
                  setMessages(prev => {
                    const newMsgs = [...prev];
                    const lastIndex = newMsgs.length - 1;
                    newMsgs[lastIndex] = {
                      ...newMsgs[lastIndex],
                      content: newMsgs[lastIndex].content + brochureMarkdown
                    };
                    return newMsgs;
                  });
                }
              } else if (data.type === 'done') {
                setAgentStatus('');
                fetchState(); // Fetch the full state after generation is complete
              }
            } catch (e) {
              // Ignore partial JSON parse errors
            }
          }
        }
      }
    } catch (err) {
      toast.error('Failed to communicate with AI service');
      // Remove the empty placeholder if failed
      setMessages(prev => prev.slice(0, prev.length - 1));
    } finally {
      setLoading(false);
      setAgentStatus('');
    }
  };

  const fetchState = async () => {
    try {
      const res = await aiClient.get(`/agent/state/${threadId}`);
      console.log('Full State:', res.data.state);
      setAgentState(res.data.state);
      toast.success('State updated successfully');
    } catch (err) {
      toast.error('Could not fetch state');
    }
  };

  const handleUploadKB = async () => {
    if (!file && !url) return toast.error('Please select a PDF file or enter a URL');
    setUploading(true);
    try {
      if (url) {
        const res = await aiClient.post(`/kb/ingest/url`, { url, kb_id: kbId });
        toast.success(`Embedded ${res.data.chunk_count} chunks from URL into ${res.data.collection_name}`);
      } else {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('kb_id', kbId);
        const res = await aiClient.post(`/kb/ingest/pdf`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        toast.success(`Embedded ${res.data.chunk_count} chunks from PDF into ${res.data.collection_name}`);
      }
    } catch (err) {
      toast.error('Failed to embed document');
    } finally {
      setUploading(false);
      setFile(null);
      setUrl('');
    }
  };

  return (
    <PageWrapper>
      <div className="page-header pb-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>AI Agent Sandbox</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
            Test LLM reasoning, view internal state, and debug RAG embeddings in real-time.
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={() => {
            setThreadId(`test-${Math.random().toString(36).substring(7)}`);
            setMessages([]);
            setAgentState(null);
            toast.success('Thread reset');
          }}>
            Reset Session
          </Button>
          <Button variant="primary" icon={<Activity size={14} />} onClick={fetchState}>
            Dump State
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left Column - Chat & Tools */}
        <div className="lg:col-span-2 space-y-6">

          {/* Chat Window */}
          <div className="card-no-hover flex flex-col h-[600px] p-0 overflow-hidden">
            <div className="p-4 flex items-center justify-between" style={{ borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-surface)' }}>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Lead Agent Simulator</span>
              </div>
              <div className="text-xs" style={{ color: 'var(--text-muted)' }}>ID: {threadId}</div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-center">
                  <Terminal size={32} style={{ color: 'var(--border-strong)' }} className="mb-3" />
                  <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Send a message to start the simulation.</p>
                </div>
              )}
              {messages.map((m, i) => (
                <div key={i} className={cn('flex gap-3 max-w-[85%]', m.role === 'user' ? 'ml-auto flex-row-reverse' : '')}>
                  <div className="p-3 rounded-2xl text-sm whitespace-pre-wrap leading-relaxed shadow-sm"
                    style={{
                      background: m.role === 'user' ? 'var(--accent)' : 'var(--bg-elevated)',
                      color: m.role === 'user' ? '#fff' : 'var(--text-primary)',
                      border: m.role === 'user' ? 'none' : '1px solid var(--border-subtle)'
                    }}>
                    <ReactMarkdown components={{
                      img: ({ node, ...props }) => <img style={{ maxWidth: '100%', borderRadius: '8px', marginTop: '8px' }} {...props} />
                    }}>{m.content}</ReactMarkdown>
                  </div>
                </div>
              ))}
              {loading && agentStatus && (
                <div className="flex gap-3">
                  <div className="flex flex-col gap-1">
                    <div className="p-3 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-xs text-[var(--text-secondary)] font-medium animate-pulse shadow-sm">
                      {agentStatus}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="p-4" style={{ borderTop: '1px solid var(--border-subtle)' }}>
              <div className="flex gap-2 relative">
                <Input
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSend()}
                  placeholder="Type a message..."
                  className="flex-1"
                />
                <Button variant="primary" icon={<Send size={14} />} onClick={handleSend} disabled={loading || !input.trim()}>
                  Send
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - State & Settings */}
        <div className="space-y-6">

          {/* Internal State Viewer */}
          <div className="card-no-hover">
            <div className="flex items-center gap-2 mb-4">
              <Activity size={16} style={{ color: 'var(--text-primary)' }} />
              <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Live Internal State</h3>
            </div>

            {agentState ? (
              <div className="space-y-4">
                <div>
                  <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Pipeline Stage</p>
                  <div className="px-3 py-1.5 rounded text-xs font-medium inline-block" style={{ background: 'var(--accent-light)', color: 'var(--accent)' }}>
                    {(agentState.stage || '').toUpperCase() || 'OPENER'}
                  </div>
                </div>

                <div>
                  <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Qualification Score</p>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4].map(s => (
                      <div key={s} className="h-2 w-8 rounded-full transition-all"
                        style={{ background: s <= (agentState.qualification_score || 0) ? 'var(--success)' : 'var(--border-subtle)' }} />
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Detected Intent Signals</p>
                  <div className="flex flex-wrap gap-2">
                    {agentState.intent_signals && agentState.intent_signals.length > 0 ? agentState.intent_signals.map(s => (
                      <span key={s} className="text-[10px] px-2 py-1 rounded-md" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
                        {s.replace('_', ' ')}
                      </span>
                    )) : <span className="text-xs" style={{ color: 'var(--text-muted)' }}>No signals detected yet</span>}
                  </div>
                </div>

                {(agentState.needs_human || agentState.human_handoff) && (
                  <div className="p-3 rounded-lg text-xs font-medium animate-pulse" style={{ background: 'var(--danger-bg)', color: 'var(--danger)' }}>
                    🚨 Human Handoff Triggered
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Awaiting first interaction...</p>
            )}
          </div>

          {/* Configuration */}
          <div className="card-no-hover">
            <div className="flex items-center gap-2 mb-4">
              <Settings size={16} style={{ color: 'var(--text-primary)' }} />
              <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Agent Configuration</h3>
            </div>
            <div className="space-y-4">
              <Select label="Campaign Type" value={campaignType} onChange={e => setCampaignType(e.target.value)}>
                <option value="lead">Sales & Lead Qualification</option>
                <option value="conversation">Customer Support & FAQ</option>
              </Select>
              <Select label="Agent Tone" value={tone} onChange={e => setTone(e.target.value)}>
                <option value="friendly">Friendly & Warm</option>
                <option value="professional">Professional</option>
                <option value="caring">Caring & Helpful</option>
                <option value="energetic">Energetic & Upbeat</option>
              </Select>
              <Select label="Language" value={language} onChange={e => setLanguage(e.target.value)}>
                <option value="en">English</option>
                <option value="es">Spanish (Español)</option>
                <option value="hi">Hindi (हिन्दी)</option>
                <option value="gu">Gujarati (ગુજરાતી)</option>
                <option value="fr">French (Français)</option>
                <option value="de">German (Deutsch)</option>
              </Select>
            </div>
          </div>

          {/* Twilio Sandbox Helper */}
          <div className="card-no-hover">
            <div className="flex items-center gap-2 mb-4">
              <Terminal size={16} style={{ color: 'var(--text-primary)' }} />
              <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Twilio Sandbox Helper</h3>
            </div>
            <div className="space-y-4">
              <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                Twilio sandbox requires phone numbers to explicitly join before they can receive outbound messages.
              </p>
              <Input
                label="Sandbox Keyword"
                placeholder="e.g. panhandle-pulse"
                value={sandboxKeyword}
                onChange={e => setSandboxKeyword(e.target.value)}
              />
              <Button
                variant="secondary"
                className="w-full font-medium"
                onClick={() => {
                  const kw = sandboxKeyword.trim() || 'pain-breeze';
                  window.open(`https://wa.me/14155238886?text=join%20${encodeURIComponent(kw)}`, '_blank');
                }}
              >
                📱 Join Sandbox on WhatsApp
              </Button>
            </div>
          </div>

          {/* KB Testing */}
          <div className="card-no-hover">
            <div className="flex items-center gap-2 mb-4">
              <FileText size={16} style={{ color: 'var(--text-primary)' }} />
              <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>RAG Knowledge Base</h3>
            </div>

            {uploading ? (
              <div className="flex flex-col items-center justify-center p-6 space-y-3 bg-[var(--bg-elevated)] rounded-lg border border-[var(--border-subtle)]">
                <div className="w-8 h-8 border-4 border-[var(--accent-light)] border-t-[var(--accent)] rounded-full animate-spin"></div>
                <p className="text-xs font-medium text-[var(--text-secondary)] animate-pulse">Chunking & Embedding Data...</p>
              </div>
            ) : (
              <div className="space-y-4">
                <Input label="KB ID (Collection)" value={kbId} onChange={e => setKbId(e.target.value)} />
                <Input label="Webpage URL" placeholder="https://example.com" value={url} onChange={e => setUrl(e.target.value)} disabled={!!file} />
                <div className="text-xs text-center text-[var(--text-muted)]">- OR -</div>
                <div>
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={e => setFile(e.target.files[0])}
                    disabled={!!url}
                    className="block w-full text-xs text-gray-500 file:mr-4 file:py-1.5 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-[var(--accent-light)] file:text-[var(--accent)] hover:file:bg-[var(--accent)] hover:file:text-white transition-all cursor-pointer disabled:opacity-50"
                  />
                </div>
                <Button variant="secondary" className="w-full" disabled={(!file && !url)} onClick={handleUploadKB}>
                  Chunk & Embed Data
                </Button>
              </div>
            )}
          </div>

        </div>
      </div>
    </PageWrapper>
  );
}
