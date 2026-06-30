import { Zap } from 'lucide-react';

export function BrandPanel({
  headline,
  subtitle,
  accentColor = '#D85A30',
  iconBg = 'rgba(216, 90, 48, 0.1)',
  stats = []
}) {
  const hasStats = stats && stats.length > 0;

  return (
    <div
      className="relative flex flex-col justify-between p-10 overflow-hidden select-none w-full md:w-[40%] min-h-[220px] md:min-h-screen text-white transition-colors duration-300"
      style={{ background: 'var(--page-secondary)' }}
    >
      {/* Drift Background Orbs */}
      <style>{`
        @keyframes drift1 {
          0% { transform: translate(0px, 0px) scale(1); }
          50% { transform: translate(15px, -15px) scale(1.05); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        @keyframes drift2 {
          0% { transform: translate(0px, 0px) scale(1.05); }
          50% { transform: translate(-15px, 15px) scale(0.95); }
          100% { transform: translate(0px, 0px) scale(1.05); }
        }
        .orb-1 {
          animation: drift1 18s ease-in-out infinite;
        }
        .orb-2 {
          animation: drift2 22s ease-in-out infinite;
        }
      `}</style>

      {/* SVG Background Orbs */}
      <div className="absolute inset-0 pointer-events-none">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <circle
            cx="20%"
            cy="30%"
            r="160"
            fill={accentColor}
            opacity="0.12"
            className="orb-1"
            style={{ filter: 'blur(75px)' }}
          />
          <circle
            cx="80%"
            cy="80%"
            r="180"
            fill={accentColor}
            opacity="0.10"
            className="orb-2"
            style={{ filter: 'blur(80px)' }}
          />
        </svg>
      </div>

      {/* Logo Section */}
      <div className="relative z-10 flex items-center gap-2.5">
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ background: accentColor, boxShadow: `0 2px 10px ${accentColor}4D` }}
        >
          <Zap size={15} color="#fff" strokeWidth={2.5} />
        </div>
        <span
          style={{
            fontWeight: 800,
            fontSize: 18,
            letterSpacing: '-0.02em',
            fontFamily: 'var(--font-body)',
          }}
        >
          Aurion
        </span>
      </div>

      {/* Center Copy */}
      <div className="relative z-10 my-auto max-w-[320px]">
        <h1 className="text-xl md:text-3xl font-extrabold tracking-tight leading-tight" style={{ fontFamily: 'var(--font-body)' }}>
          {headline}
        </h1>
        <p className="text-xs md:text-sm mt-3 opacity-80 leading-relaxed font-medium" style={{ color: '#F0EBE6' }}>
          {subtitle}
        </p>
      </div>

      {/* Footer Stats Row (Omitted if empty) */}
      {hasStats ? (
        <div className="relative z-10 grid grid-cols-2 gap-4 pt-6 border-t border-white/10 mt-6">
          {stats.map((stat, i) => (
            <div key={i}>
              <div className="text-2xl font-bold tracking-tight">{stat.value}</div>
              <div className="text-[10px] uppercase font-bold tracking-wider opacity-60 mt-1">{stat.label}</div>
            </div>
          ))}
        </div>
      ) : (
        <div className="relative z-10 text-[10px] font-semibold opacity-40 uppercase tracking-widest mt-6">
          Intelligence Platform
        </div>
      )}
    </div>
  );
}
