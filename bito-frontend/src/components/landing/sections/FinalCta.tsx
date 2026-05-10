import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import Splitting from 'splitting'
import { EASE_OUT_EXPO, reduceMotion } from '../../../lib/landing/motion'

/**
 * Section 10 - Final CTA (spec section 15).
 *
 * Aurora background drift (paused on prefers-reduced-motion).
 * H2 word stagger via Splitting. CTA shimmer loops every 3.5s.
 */

export function FinalCta() {
  const headingRef = useRef<HTMLHeadingElement | null>(null)

  useEffect(() => {
    const h = headingRef.current
    if (!h || reduceMotion) return
    const results = Splitting({ target: h, by: 'words' })
    const words = results[0]?.words ?? []
    words.forEach((wordEl, i) => {
      const el = wordEl as HTMLElement
      el.style.animationName = 'final-cta-word'
      el.style.animationDelay = `${i * 60}ms`
      el.style.animationDuration = '700ms'
    })
  }, [])

  return (
    <section
      id="section-cta"
      style={{
        position: 'relative',
        padding: '160px 24px',
        overflow: 'hidden',
        background:
          'radial-gradient(ellipse 65% 50% at 28% 50%, rgba(79, 70, 229, 0.2) 0%, transparent 60%), radial-gradient(ellipse 55% 60% at 72% 50%, rgba(99, 102, 241, 0.14) 0%, transparent 60%), var(--color-bg-primary)',
        backgroundSize: '200% 200%',
        animation: reduceMotion ? 'none' : 'aurora-drift 14s ease-in-out infinite alternate',
      }}
    >
      <style>{`
        @keyframes aurora-drift {
          from { background-position: 0% 50%; }
          to   { background-position: 100% 50%; }
        }
        @keyframes final-cta-word {
          from { opacity: 0; transform: scale(0.93); }
          to   { opacity: 1; transform: scale(1); }
        }
        @media (prefers-reduced-motion: reduce) {
          #section-cta { animation: none !important; }
        }
        #section-cta .split-words .word {
          animation-fill-mode: forwards;
          animation-timing-function: var(--ease-out-expo);
          opacity: 0;
        }
      `}</style>

      <div className="relative mx-auto max-w-205 text-center" style={{ zIndex: 1 }}>
        <h2
          ref={headingRef}
          className="font-garamond split-words"
          style={{
            fontSize: 'clamp(2.5rem, 6vw, 4.5rem)',
            lineHeight: 1,
            letterSpacing: '-0.03em',
            color: 'var(--color-text-primary)',
            margin: 0,
          }}
        >
          Ready to build the life you keep putting off?
        </h2>

        <motion.p
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: reduceMotion ? 0 : 0.5, delay: reduceMotion ? 0 : 0.5, ease: EASE_OUT_EXPO }}
          className="font-spartan mx-auto mt-6 text-base md:text-lg"
          style={{ color: 'var(--color-text-secondary)', maxWidth: '480px' }}
        >
          Free to start. No credit card. Two minutes to set up.
        </motion.p>

        <motion.a
          href="/login"
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: reduceMotion ? 0 : 0.5, delay: reduceMotion ? 0 : 0.7, ease: EASE_OUT_EXPO }}
          className="cta-shimmer-loop font-spartan mt-10 inline-flex items-center justify-center text-[15px] font-medium text-white"
          style={{
            background: 'var(--color-brand-500)',
            borderRadius: '100px',
            padding: '14px 32px',
            transition: 'background-color 200ms ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'var(--color-brand-600)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'var(--color-brand-500)'
          }}
        >
          Get started free
        </motion.a>
      </div>

      {/* CTA shimmer-loop styles */}
      <style>{`
        .cta-shimmer-loop { position: relative; overflow: hidden; }
        .cta-shimmer-loop::after {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: inherit;
          pointer-events: none;
          background: linear-gradient(
            105deg,
            transparent 40%,
            rgba(255, 255, 255, 0.2) 50%,
            transparent 60%
          );
          background-size: 200% 100%;
          background-position: 200% center;
          animation: cta-shimmer-sweep 3.5s ease-in-out infinite;
        }
        .cta-shimmer-loop:hover::after { animation-play-state: paused; }
        @keyframes cta-shimmer-sweep {
          0%   { background-position: 200% center; }
          50%  { background-position: -200% center; }
          100% { background-position: -200% center; }
        }
        @media (prefers-reduced-motion: reduce) {
          .cta-shimmer-loop::after { animation: none; }
        }
      `}</style>
    </section>
  )
}
