import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Zap, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import useAuthStore from '@/stores/authStore';
import { toast } from '@/stores/uiStore';

export default function Login() {
  const navigate = useNavigate();
  const { login, isLoading } = useAuthStore();
  const [form, setForm] = useState({ email: 'demo@solarbright.in', password: 'demo123' });
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('expired') === 'true') {
      // Small timeout to let UI mount
      setTimeout(() => {
        toast.error('Your session has expired. Please sign in again.', { title: 'Session Expired' });
      }, 200);
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const result = await login(form.email, form.password);
    if (result.success) {
      toast.success('Signed in successfully!');
      navigate('/dashboard');
    } else {
      const errMsg = result.error || 'Invalid credentials. Please try again.';
      setError(errMsg);
      toast.error(errMsg);
    }
  };

  const handleDemoLogin = async () => {
    setError('');
    const demoEmail = 'demo@solarbright.in';
    const demoPassword = 'demo123';
    setForm({ email: demoEmail, password: demoPassword });

    const result = await login(demoEmail, demoPassword);
    if (result.success) {
      toast.success('Welcome back! Signed in with Demo Account.');
      navigate('/dashboard');
    } else {
      const errMsg = result.error || 'Demo login failed.';
      setError(errMsg);
      toast.error(errMsg);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        backgroundColor: 'var(--bg-page)',
        backgroundImage: `
          var(--grain-url),
          radial-gradient(at 15% 15%, rgba(196, 101, 74, 0.08) 0px, transparent 55%),
          radial-gradient(at 85% 85%, rgba(74, 103, 65, 0.05) 0px, transparent 50%),
          radial-gradient(at 50% 0%,   rgba(196, 101, 74, 0.03) 0px, transparent 60%)
        `,
      }}
    >
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2.5 mb-8">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{ background: 'var(--accent)', boxShadow: '0 2px 8px rgba(196,101,74,0.3)' }}
          >
            <Zap size={15} color="#fff" strokeWidth={2.5} />
          </div>
          <span
            className="text-xl font-bold"
            style={{
              color: 'var(--text-primary)',
              fontFamily: 'var(--font-display)',
              letterSpacing: '-0.02em',
            }}
          >
            Aurion
          </span>
        </div>

        {/* Card */}
        <div
          className="rounded-[16px] p-7"
          style={{
            background: 'var(--bg-glass-strong)',
            border: '1px solid var(--border-subtle)',
            boxShadow: 'var(--shadow-float)',
            backdropFilter: 'var(--blur-md)',
            WebkitBackdropFilter: 'var(--blur-md)',
          }}
        >
          <h1
            className="text-xl mb-1 font-semibold"
            style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-display)', letterSpacing: '-0.01em' }}
          >
            Welcome back
          </h1>
          <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
            Sign in to your AI operations dashboard
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email"
              type="email"
              value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              placeholder="you@company.com"
              required
            />
            <div className="relative">
              <Input
                label="Password"
                type={showPass ? 'text' : 'password'}
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                placeholder="Your password"
                required
                iconRight={
                  <button type="button" onClick={() => setShowPass(v => !v)} className="btn-icon p-0">
                    {showPass ? <EyeOff size={13} /> : <Eye size={13} />}
                  </button>
                }
              />
            </div>

            {error && (
              <p className="text-xs" style={{ color: 'var(--danger)' }}>{error}</p>
            )}

            <Button
              type="submit"
              variant="primary"
              className="w-full justify-center"
              loading={isLoading}
              iconRight={<ArrowRight size={14} />}
            >
              Sign in
            </Button>
          </form>

          {/* Quick Demo Action Alert */}
          <div
            className="mt-5 p-3 rounded-xl flex flex-col gap-2 items-center"
            style={{
              background: 'var(--accent-light)',
              border: '1px solid rgba(196, 101, 74, 0.15)',
            }}
          >
            <p className="text-xs text-center" style={{ color: 'var(--accent-text)', fontWeight: 500 }}>
              Testing the platform?
            </p>
            <div className="w-full text-[10px] font-mono text-center" style={{ color: 'var(--text-muted)', lineHeight: 1.8 }}>
              <span style={{ color: 'var(--text-secondary)' }}>demo@solarbright.in</span>
              {' · '}
              <span style={{ color: 'var(--text-secondary)' }}>demo123</span>
            </div>
            <button
              type="button"
              onClick={handleDemoLogin}
              disabled={isLoading}
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: 12,
                fontWeight: 600,
                color: '#fff',
                background: 'var(--accent)',
                border: 'none',
                borderRadius: '6px',
                padding: '6.5px 12px',
                cursor: 'pointer',
                transition: 'background 0.14s',
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--accent-hover)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'var(--accent)')}
            >
              Sign in as Demo User <ArrowRight size={13} />
            </button>
          </div>

          <div className="divider my-5" style={{ opacity: 0.6 }} />

          <p className="text-xs text-center" style={{ color: 'var(--text-muted)' }}>
            New to Aurion?{' '}
            <Link to="/register" className="font-semibold" style={{ color: 'var(--accent)' }}>
              Create account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
