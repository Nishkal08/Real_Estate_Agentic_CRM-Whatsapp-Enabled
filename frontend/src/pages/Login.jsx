import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, ArrowRight, Activity } from 'lucide-react';
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

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  // Load session expiry warnings or messages
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('expired') === 'true') {
      setTimeout(() => {
        toast.error('Your session has expired. Please sign in again.', { title: 'Session Expired' });
      }, 200);
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  // Try to pull live values if available (unauthenticated call will fail, which is expected/handled by omitting)
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
      } catch (err) {
        // Silent fall-through: stats row is omitted as per requirement
        setLiveStats(null);
      }
    };
    fetchPublicStats();
  }, []);

  const validateEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

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

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[var(--page-primary)]">
      {/* Brand left panel (40% width) */}
      <BrandPanel
        headline="Your AI sales team never sleeps"
        subtitle="WhatsApp-first lead qualification for your business, running 24/7."
        accentColor="#D85A30" // Terracotta Orange
        iconBg="rgba(216, 90, 48, 0.15)"
        stats={liveStats || []}
      />

      {/* Form right panel (60% width) */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-12 lg:p-20 bg-[var(--page-primary)]">
        <div className="w-full max-w-[420px] py-8">
          {/* Form Header */}
          <div className="mb-8">
            <h2
              className="text-2xl font-extrabold tracking-tight"
              style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-body)' }}
            >
              Welcome back
            </h2>
            <p className="text-xs mt-1.5 font-medium" style={{ color: 'var(--text-secondary)' }}>
              Sign in to your AI operations dashboard
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <FloatingLabelInput
              label="Email Address"
              type="email"
              icon={Mail}
              value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              placeholder="you@company.com"
              accentColor="#D85A30"
              isValid={isEmailValid}
              showSuccessCheckmark={true}
              required
            />

            <FloatingLabelInput
              label="Password"
              type="password"
              icon={Lock}
              value={form.password}
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              placeholder="••••••••"
              accentColor="#D85A30"
              required
            />

            {error && (
              <p className="text-xs text-[var(--danger)] font-medium pl-1.5">
                ⚠️ {error}
              </p>
            )}

            <Button
              type="submit"
              variant="primary"
              className="w-full h-12 justify-center rounded-xl text-sm font-semibold mt-6 transition-all"
              style={{ background: 'var(--accent)', borderColor: 'var(--accent)' }}
              loading={isLoading && !demoSigningIn}
              iconRight={<ArrowRight size={15} />}
            >
              Sign in
            </Button>
          </form>

          {/* Divider */}
          <div className="relative my-6 flex items-center justify-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[var(--border-subtle)]" />
            </div>
            <span
              className="relative px-3 text-[10px] font-bold uppercase tracking-wider bg-[var(--page-primary)]"
              style={{ color: 'var(--text-disabled)' }}
            >
              or
            </span>
          </div>

          {/* Try Instant Demo Action */}
          <Button
            type="button"
            variant="outline"
            className="w-full h-12 justify-center rounded-xl text-sm font-semibold transition-all hover:bg-[rgba(216,90,48,0.06)]"
            style={{ borderColor: 'var(--border-subtle)' }}
            onClick={handleDemoLogin}
            loading={demoSigningIn}
          >
            {demoSigningIn ? 'Signing in as demo user...' : 'Try instant demo'}
          </Button>

          {/* Footer Link */}
          <p className="text-xs text-center mt-8 font-medium" style={{ color: 'var(--text-disabled)' }}>
            New to Aurion?{' '}
            <Link
              to="/signup"
              className="font-bold hover:underline transition-all ml-1"
              style={{ color: 'var(--accent)' }}
            >
              Create account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
