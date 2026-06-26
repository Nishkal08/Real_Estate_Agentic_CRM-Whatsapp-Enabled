import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap, Building2, Phone, BookOpen, Megaphone, CheckCircle2, ArrowRight, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input, Textarea } from '@/components/ui/Input';
import { toast } from '@/stores/uiStore';
import { cn } from '@/utils/cn';

const STEPS = [
  {
    id: 0,
    title: 'Business Profile',
    description: 'Tell us about your business',
    icon: <Building2 size={20} />,
  },
  {
    id: 1,
    title: 'Connect WhatsApp',
    description: 'Link your Twilio WhatsApp sandbox',
    icon: <Phone size={20} />,
  },
  {
    id: 2,
    title: 'Upload Knowledge Base',
    description: 'Feed the AI your product info',
    icon: <BookOpen size={20} />,
  },
  {
    id: 3,
    title: 'First Campaign',
    description: "You're ready to launch!",
    icon: <Megaphone size={20} />,
  },
];

export default function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [completing, setCompleting] = useState(false);

  const handleNext = () => {
    if (step < STEPS.length - 1) setStep(s => s + 1);
  };

  const handleBack = () => {
    if (step > 0) setStep(s => s - 1);
  };

  const handleComplete = async () => {
    setCompleting(true);
    await new Promise(r => setTimeout(r, 800));
    toast.success("Setup complete! Welcome to AiOps.", { title: 'Setup Complete' });
    navigate('/dashboard');
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        background: 'var(--bg-page)',
        backgroundImage: `radial-gradient(at 30% 30%, rgba(94, 106, 210, 0.1) 0px, transparent 50%)`,
      }}
    >
      <div className="w-full max-w-lg">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'var(--accent)' }}>
            <Zap size={16} color="#fff" strokeWidth={2.5} />
          </div>
          <span className="text-lg font-semibold" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-display)', letterSpacing: '-0.03em' }}>
            Ai<span style={{ color: 'var(--accent)' }}>Ops</span>
          </span>
        </div>

        {/* Steps indicator */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {STEPS.map((s, i) => (
            <div key={s.id} className="flex items-center gap-2">
              <div
                className="flex items-center justify-center w-7 h-7 rounded-full text-xs font-semibold transition-all"
                style={{
                  background: i < step ? 'var(--success)' : i === step ? 'var(--accent)' : 'var(--bg-surface)',
                  color: i <= step ? '#fff' : 'var(--text-muted)',
                  border: `1.5px solid ${i < step ? 'var(--success)' : i === step ? 'var(--accent)' : 'var(--border-subtle)'}`,
                }}
              >
                {i < step ? <CheckCircle2 size={14} /> : i + 1}
              </div>
              {i < STEPS.length - 1 && (
                <div
                  className="w-12 h-px transition-all"
                  style={{ background: i < step ? 'var(--success)' : 'var(--border-subtle)' }}
                />
              )}
            </div>
          ))}
        </div>

        {/* Card */}
        <div className="rounded-[18px] overflow-hidden" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', boxShadow: 'var(--shadow-float)' }}>
          {/* Step header */}
          <div className="px-7 py-6" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'var(--accent-light)', color: 'var(--accent)' }}>
                {STEPS[step].icon}
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide mb-0.5" style={{ color: 'var(--text-muted)' }}>Step {step + 1} of {STEPS.length}</p>
                <h2 className="text-lg" style={{ color: 'var(--text-primary)' }}>{STEPS[step].title}</h2>
              </div>
            </div>
          </div>

          {/* Step content */}
          <div className="p-7 min-h-[240px]">
            {step === 0 && (
              <div className="space-y-4">
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Your profile is set up. Customize it anytime in Settings.</p>
                <div className="p-4 rounded-xl" style={{ background: 'var(--success-bg)', border: '1px solid rgba(22,163,74,0.2)' }}>
                  <p className="text-xs font-medium" style={{ color: 'var(--success)' }}>Profile created — SolarBright Solutions, Ahmedabad</p>
                </div>
              </div>
            )}
            {step === 1 && (
              <div className="space-y-4">
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  Add this webhook URL to your Twilio WhatsApp sandbox console to receive inbound messages.
                </p>
                <div className="p-3 rounded-xl font-mono text-xs" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', color: 'var(--accent)', wordBreak: 'break-all' }}>
                  https://your-backend.railway.app/webhook/whatsapp/incoming
                </div>
                <div className="p-4 rounded-xl" style={{ background: 'var(--success-bg)', border: '1px solid rgba(22,163,74,0.2)' }}>
                  <p className="text-xs font-medium" style={{ color: 'var(--success)' }}>WhatsApp Sandbox connected via Twilio</p>
                </div>
              </div>
            )}
            {step === 2 && (
              <div className="space-y-4">
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  Upload product PDFs, FAQs, or add URLs. The AI will use this to answer customer questions.
                </p>
                <div
                  className="border-2 border-dashed rounded-2xl p-8 text-center"
                  style={{ borderColor: 'var(--border-subtle)', background: 'var(--bg-surface)' }}
                >
                  <BookOpen size={24} className="mx-auto mb-2" style={{ color: 'var(--accent)' }} />
                  <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                    Sample KB already loaded for demo
                  </p>
                  <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>4 documents · 93 chunks</p>
                </div>
              </div>
            )}
            {step === 3 && (
              <div className="space-y-4">
                <div className="text-center py-4">
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: 'var(--accent-light)' }}>
                    <Megaphone size={28} style={{ color: 'var(--accent)' }} />
                  </div>
                  <h3 className="text-lg mb-2" style={{ color: 'var(--text-primary)' }}>You're all set!</h3>
                  <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                    Import leads and launch your first campaign to start engaging customers with AI.
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {['Profile created', 'WhatsApp connected', 'KB loaded (4 docs)', 'AI Agent ready'].map(item => (
                    <div key={item} className="text-xs px-3 py-2 rounded-lg" style={{ background: 'var(--success-bg)', color: 'var(--success)' }}>
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-7 py-5" style={{ borderTop: '1px solid var(--border-subtle)' }}>
            <div className="flex items-center gap-3">
              {step > 0 && (
                <Button variant="secondary" size="sm" icon={<ArrowLeft size={13} />} onClick={handleBack}>
                  Back
                </Button>
              )}
              <button
                className="text-xs"
                style={{ color: 'var(--text-muted)' }}
                onClick={() => navigate('/dashboard')}
              >
                Skip for now
              </button>
            </div>
            {step < STEPS.length - 1 ? (
              <Button variant="primary" iconRight={<ArrowRight size={13} />} onClick={handleNext}>
                Continue
              </Button>
            ) : (
              <Button variant="primary" loading={completing} iconRight={<ArrowRight size={13} />} onClick={handleComplete}>
                Go to Dashboard
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
