import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';

/**
 * GSAP typing indicator — 3-dot bounce animation
 */
export function TypingIndicator() {
  const dot1 = useRef(null);
  const dot2 = useRef(null);
  const dot3 = useRef(null);

  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) return;

    const tl = gsap.timeline({ repeat: -1 });
    tl.to(dot1.current, { y: -5, duration: 0.25, ease: 'power2.out' })
      .to(dot1.current, { y: 0, duration: 0.2 })
      .to(dot2.current, { y: -5, duration: 0.25, ease: 'power2.out' }, '-=0.3')
      .to(dot2.current, { y: 0, duration: 0.2 })
      .to(dot3.current, { y: -5, duration: 0.25, ease: 'power2.out' }, '-=0.3')
      .to(dot3.current, { y: 0, duration: 0.2 });

    return () => { tl.kill(); };
  }, []);

  return (
    <div className="bubble-agent flex items-center gap-1 px-3 py-3" style={{ width: 56 }}>
      <span
        ref={dot1}
        className="dot-1 w-1.5 h-1.5 rounded-full inline-block"
        style={{ background: 'var(--text-muted)' }}
      />
      <span
        ref={dot2}
        className="dot-2 w-1.5 h-1.5 rounded-full inline-block"
        style={{ background: 'var(--text-muted)' }}
      />
      <span
        ref={dot3}
        className="dot-3 w-1.5 h-1.5 rounded-full inline-block"
        style={{ background: 'var(--text-muted)' }}
      />
    </div>
  );
}
