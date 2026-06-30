import { Zap } from 'lucide-react';

export function BrandPanel({
  bgColor,
  headline,
  subtitle,
  accentColor = '#D85A30',
  stats = []
}) {
  const hasStats = stats && stats.length > 0;

  return (
    <div
      style={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        userSelect: 'none',
        background: bgColor,
        width: '40%',
        minHeight: '100vh',
        padding: '40px 44px',
        flexShrink: 0,
      }}
    >
      {/* Keyframes */}
      <style>{`
        @keyframes aurionDrift1 {
          0%   { transform: translate(0px, 0px); }
          50%  { transform: translate(14px, -14px); }
          100% { transform: translate(0px, 0px); }
        }
        @keyframes aurionDrift2 {
          0%   { transform: translate(0px, 0px); }
          50%  { transform: translate(-12px, 18px); }
          100% { transform: translate(0px, 0px); }
        }
        @keyframes aurionDrift3 {
          0%   { transform: translate(0px, 0px); }
          50%  { transform: translate(16px, 10px); }
          100% { transform: translate(0px, 0px); }
        }
        @keyframes aurionFadeUp {
          0%   { opacity: 0; transform: translateY(18px); }
          100% { opacity: 1; transform: translateY(0px); }
        }
      `}</style>

      {/* Decorative drifting orbs */}
      <div
        style={{
          position: 'absolute',
          top: '-60px', left: '-80px',
          width: 340, height: 340,
          borderRadius: '50%',
          background: accentColor,
          opacity: 0.18,
          filter: 'blur(90px)',
          animation: 'aurionDrift1 20s ease-in-out infinite',
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: '5%', right: '-60px',
          width: 300, height: 300,
          borderRadius: '50%',
          background: accentColor,
          opacity: 0.14,
          filter: 'blur(80px)',
          animation: 'aurionDrift2 26s ease-in-out infinite',
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: '42%', left: '30%',
          width: 200, height: 200,
          borderRadius: '50%',
          background: accentColor,
          opacity: 0.10,
          filter: 'blur(70px)',
          animation: 'aurionDrift3 16s ease-in-out infinite',
          pointerEvents: 'none',
        }}
      />

      {/* ── Soft blending edge on the right side ── */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          right: 0,
          width: 80,
          height: '100%',
          background: 'linear-gradient(to right, transparent 0%, rgba(255,255,255,0.04) 50%, rgba(255,255,255,0.10) 100%)',
          pointerEvents: 'none',
          zIndex: 1,
        }}
      />

      {/* Logo — fade-in */}
      <div
        style={{
          position: 'relative',
          zIndex: 10,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          marginBottom: 'auto',
          animation: 'aurionFadeUp 0.6s ease-out both',
        }}
      >
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            background: accentColor,
            boxShadow: `0 4px 14px ${accentColor}55`,
          }}
        >
          <Zap size={16} color="#fff" strokeWidth={2.5} />
        </div>
        <span
          style={{
            fontWeight: 800,
            fontSize: 18,
            letterSpacing: '-0.03em',
            color: '#ffffff',
          }}
        >
          Aurion
        </span>
      </div>

      {/* Centre copy — staggered fade-in */}
      <div
        style={{
          position: 'relative',
          zIndex: 10,
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          paddingTop: 56,
          paddingBottom: 56,
        }}
      >
        <h1
          style={{
            fontWeight: 800,
            fontSize: 'clamp(26px, 3.5vw, 38px)',
            color: '#ffffff',
            lineHeight: 1.18,
            letterSpacing: '-0.02em',
            marginBottom: 16,
            animation: 'aurionFadeUp 0.7s 0.15s ease-out both',
          }}
        >
          {headline}
        </h1>
        <p
          style={{
            fontSize: 14,
            color: 'rgba(255,255,255,0.6)',
            lineHeight: 1.75,
            fontWeight: 400,
            maxWidth: 310,
            animation: 'aurionFadeUp 0.7s 0.3s ease-out both',
          }}
        >
          {subtitle}
        </p>
      </div>

      {/* Footer stats or tag */}
      {hasStats ? (
        <div
          style={{
            position: 'relative',
            zIndex: 10,
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: 20,
            paddingTop: 24,
            borderTop: '1px solid rgba(255,255,255,0.10)',
            animation: 'aurionFadeUp 0.7s 0.45s ease-out both',
          }}
        >
          {stats.map((stat, i) => (
            <div key={i}>
              <div style={{ fontSize: 26, fontWeight: 800, color: '#fff', letterSpacing: '-0.02em' }}>
                {stat.value}
              </div>
              <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(255,255,255,0.45)', marginTop: 4, fontWeight: 600 }}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div
          style={{
            position: 'relative',
            zIndex: 10,
            fontSize: 10,
            textTransform: 'uppercase',
            letterSpacing: '0.12em',
            color: 'rgba(255,255,255,0.25)',
            fontWeight: 700,
            animation: 'aurionFadeUp 0.7s 0.45s ease-out both',
          }}
        >
          Intelligence Platform · Aurion CRM
        </div>
      )}
    </div>
  );
}
