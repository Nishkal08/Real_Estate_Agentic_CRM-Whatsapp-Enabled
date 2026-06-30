import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Zap, ArrowRight, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import useAuthStore from '@/stores/authStore';
import { toast } from '@/stores/uiStore';

export default function Register() {
  const navigate = useNavigate();
  const { register, isAuthenticated } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    businessName: '',
    phone: '',
  });

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const result = await register(form.name, form.email, form.password, form.businessName, form.phone);
    setLoading(false);
    
    if (result.success) {
      toast.success('Account created successfully! Welcome to AiOps.');
      navigate('/dashboard');
    } else {
      if (result.error === 'Email already registered') {
        toast.error('This email is already registered. Redirecting to login...', { duration: 3000 });
        setTimeout(() => navigate('/login'), 1500);
      } else {
        toast.error(result.error || 'Registration failed. Please try again.');
      }
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
      <div className="w-full max-w-md">
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
            Create your account
          </h1>
          <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
            Get your AI operations platform up in 2 minutes
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Your Name"
                placeholder="Raj Sharma"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                required
              />
              <Input
                label="Business Name"
                placeholder="SolarBright"
                value={form.businessName}
                onChange={e => setForm(f => ({ ...f, businessName: e.target.value }))}
                required
              />
            </div>
            <Input
              label="Work Email"
              type="email"
              placeholder="raj@company.in"
              value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              required
            />
            <Input
              label="Phone"
              type="tel"
              placeholder="+91 98765 43210"
              value={form.phone}
              onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
              required
            />
            <Input
              label="Password"
              type="password"
              placeholder="Min. 8 characters"
              value={form.password}
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              required
              hint="Use a strong password with letters and numbers"
            />

            <Button
              type="submit"
              variant="primary"
              className="w-full justify-center"
              loading={loading}
              iconRight={<ArrowRight size={14} />}
            >
              Create Account
            </Button>
          </form>

          <div className="divider my-5" style={{ opacity: 0.6 }} />
          <p className="text-xs text-center" style={{ color: 'var(--text-muted)' }}>
            Already have an account?{' '}
            <Link to="/login" className="font-semibold" style={{ color: 'var(--accent)' }}>
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
