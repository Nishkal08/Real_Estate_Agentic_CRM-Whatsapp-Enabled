import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, ArrowRight, Shield, Zap } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { FloatingLabelInput } from '@/components/ui/FloatingLabelInput';
import { BrandPanel } from '@/components/ui/BrandPanel';
import useAuthStore from '@/stores/authStore';
import { toast } from '@/stores/uiStore';
import api from '@/services/api';

export default function Login() {
  const navigate = useNavigate();
  const { login, demoLogin, isLoading, isAuthenticated } = useAuthStore();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [demoSigningIn, setDemoSigningIn] = useState(false);
  const [liveStats, setLiveStats] = useState(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  // Entrance animation trigger
  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 60);
    return () => clearTimeout(t);
  }, []);

  // Session expiry check
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('expired') === 'true') {
      setTimeout(() => {
        toast.error('Your session has expired. Please sign in again.', { title: 'Session Expired' });
      }, 200);
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  // Pull live stats (silent fail)
  useEffect(() => {
    const fetchPublicStats = async () => {
      try {
        const res = await api.get('/analytics/public-overview');
        if (res.data?.success) {
          setLiveStats([
            { value: res.data.data.messagesToday || '0', label: 'Messages Today' },
            { value: res.data.data.activeLeads || '0', label: 'Active Leads' }
          ]);
        }
      } catch {
        setLiveStats(null);
      }
    };
    fetchPublicStats();
  }, []);

  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const isEmailValid = validateEmail(form.email);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const result = await login(form.email, form.password);
    if (result.success) {
      toast.success('Welcome back!');
      navigate('/dashboard');
    } else {
      const errMsg = result.error || 'Invalid credentials. Please try again.';
      setError(errMsg);
      toast.error(errMsg);
    }
  };

  const handleDemoLogin = async () => {
    setError('');
    setDemoSigningIn(true);
    const result = await demoLogin();
    if (result.success) {
      toast.success('Signed in successfully with Demo Account.');
      navigate('/dashboard');
    } else {
      const errMsg = result.error || 'Demo login failed.';
      setError(errMsg);
      toast.error(errMsg);
      setDemoSigningIn(false);
    }
  };

  // Stagger helper
  const stagger = (i) => ({
    opacity: mounted ? 1 : 0,
    transform: mounted ? 'translateY(0)' : 'translateY(16px)',
    transition: `opacity 0.5s ${0.1 + i * 0.08}s ease-out, transform 0.5s ${0.1 + i * 0.08}s ease-out`,
  });

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'row', background: '#1A140E' }}>

      {/* ── Inline keyframes ── */}
      <style>{`
        .login-btn-primary {
          transition: transform 0.18s ease, box-shadow 0.18s ease, background 0.2s !important;
        }
        .login-btn-primary:hover:not(:disabled) {
          transform: translateY(-1px) !important;
          box-shadow: 0 6px 24px rgba(216,90,48,0.35) !important;
        }
        .login-btn-primary:active:not(:disabled) {
          transform: translateY(0) !important;
        }
        .login-btn-outline {
          transition: transform 0.18s ease, border-color 0.2s, background 0.2s !important;
        }
        .login-btn-outline:hover:not(:disabled) {
          border-color: rgba(0,0,0,0.22) !important;
          background: rgba(0,0,0,0.025) !important;
          transform: translateY(-1px) !important;
        }
        .login-link:hover {
          text-decoration: underline !important;
        }
      `}</style>

      {/* Left brand panel */}
      <BrandPanel
        bgColor="#1A140E"
        headline="Your AI sales team never sleeps"
        subtitle="WhatsApp-first lead qualification for your business, running 24/7."
        accentColor="#D85A30"
        stats={liveStats || []}
      />

      {/* ── Right form panel ── */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '48px 52px',
          background: '#ffffff',
          position: 'relative',
        }}
      >
        {/* Very subtle warm tint on left edge for panel blending */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: 60,
            height: '100%',
            background: 'linear-gradient(to right, rgba(26,20,14,0.035), transparent)',
            pointerEvents: 'none',
          }}
        />

        <div style={{ width: '100%', maxWidth: 400, position: 'relative', zIndex: 1 }}>

          {/* Header */}
          <div style={{ marginBottom: 36, ...stagger(0) }}>
            <h2
              style={{
                fontSize: 28,
                fontWeight: 800,
                letterSpacing: '-0.025em',
                color: '#0F0F0F',
                lineHeight: 1.15,
                marginBottom: 8,
              }}
            >
              Welcome back
            </h2>
            <p style={{ fontSize: 14, color: '#888888', fontWeight: 400, lineHeight: 1.5 }}>
              Sign in to your AI operations dashboard
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, ...stagger(1) }}>
              <FloatingLabelInput
                label="Email Address"
                hint="you@company.com"
                type="email"
                icon={Mail}
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                accentColor="#D85A30"
                isValid={isEmailValid}
                showSuccessCheckmark={true}
                required
              />

              <FloatingLabelInput
                label="Password"
                hint="Enter your password"
                type="password"
                icon={Lock}
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                accentColor="#D85A30"
                required
              />
            </div>

            {/* Forgot password row */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                marginTop: 10,
                marginBottom: 4,
                ...stagger(2),
              }}
            >
              <button
                type="button"
                className="login-link"
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: 12,
                  fontWeight: 600,
                  color: '#D85A30',
                  padding: 0,
                  textDecoration: 'none',
                }}
                onClick={() => toast.info('Password reset coming soon.', { title: 'Coming Soon' })}
              >
                Forgot password?
              </button>
            </div>

            {error && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '10px 14px',
                  borderRadius: 10,
                  background: 'rgba(239,68,68,0.07)',
                  border: '1px solid rgba(239,68,68,0.15)',
                  marginBottom: 8,
                }}
              >
                <Shield size={14} style={{ color: '#EF4444', flexShrink: 0 }} />
                <span style={{ fontSize: 12, color: '#DC2626', fontWeight: 500 }}>{error}</span>
              </div>
            )}

            {/* Sign in button */}
            <div style={stagger(3)}>
              <Button
                type="submit"
                variant="primary"
                className="login-btn-primary"
                style={{
                  width: '100%',
                  height: 50,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 14,
                  fontSize: 14,
                  fontWeight: 700,
                  background: '#D85A30',
                  borderColor: '#D85A30',
                  color: '#ffffff',
                  letterSpacing: '-0.01em',
                  marginTop: 8,
                }}
                loading={isLoading && !demoSigningIn}
                iconRight={<ArrowRight size={15} />}
              >
                Sign in
              </Button>
            </div>
          </form>

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', margin: '28px 0', ...stagger(4) }}>
            <div style={{ flex: 1, height: 1, background: 'rgba(0,0,0,0.08)' }} />
            <span style={{ padding: '0 14px', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(0,0,0,0.25)' }}>
              or
            </span>
            <div style={{ flex: 1, height: 1, background: 'rgba(0,0,0,0.08)' }} />
          </div>

          {/* Demo login */}
          <div style={stagger(5)}>
            <Button
              type="button"
              variant="outline"
              className="login-btn-outline"
              style={{
                width: '100%',
                height: 50,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 14,
                fontSize: 14,
                fontWeight: 600,
                borderColor: 'rgba(0,0,0,0.12)',
                color: '#333',
              }}
              onClick={handleDemoLogin}
              loading={demoSigningIn}
              icon={<Zap size={14} style={{ color: '#D85A30' }} />}
            >
              {demoSigningIn ? 'Signing in as demo…' : 'Try instant demo'}
            </Button>
          </div>

          {/* Footer */}
          <p style={{ fontSize: 13, textAlign: 'center', marginTop: 32, color: 'rgba(0,0,0,0.38)', fontWeight: 450, ...stagger(6) }}>
            New to Aurion?{' '}
            <Link
              to="/signup"
              className="login-link"
              style={{ color: '#D85A30', fontWeight: 700, textDecoration: 'none' }}
            >
              Create account
            </Link>
          </p>

          {/* Trust badges */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 20,
              marginTop: 28,
              ...stagger(7),
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <Shield size={11} style={{ color: 'rgba(0,0,0,0.2)' }} />
              <span style={{ fontSize: 10, color: 'rgba(0,0,0,0.25)', fontWeight: 600, letterSpacing: '0.02em' }}>
                256-bit encrypted
              </span>
            </div>
            <div style={{ width: 3, height: 3, borderRadius: '50%', background: 'rgba(0,0,0,0.12)' }} />
            <span style={{ fontSize: 10, color: 'rgba(0,0,0,0.25)', fontWeight: 600, letterSpacing: '0.02em' }}>
              SOC 2 Compliant
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
