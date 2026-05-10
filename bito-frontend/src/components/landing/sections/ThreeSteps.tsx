import { motion } from 'framer-motion'
import { EASE_OUT_EXPO, reduceMotion } from '../../../lib/landing/motion'

/**
 * Section 06 - Three steps (spec section 11).
 *
 * Cards stagger in left-to-right. Step numbers (01/02/03) sit at
 * brand-500 with opacity 0.3 - they're decoration, not chrome.
 * Connector lines draw scaleX 0->1 between cards on desktop only.
 */

const STEPS = [
  {
    n: '01',
    title: 'Add your habits',
    desc: 'Pick from smart templates or create your own. Set frequency, reminders, and goals in under a minute.',
  },
  {
    n: '02',
    title: 'Check in daily',
    desc: 'Open bito, tap to complete. Streaks, progress rings, and weekly overview update in real time.',
  },
  {
    n: '03',
    title: 'Grow with insights',
    desc: 'As data accumulates, bito surfaces patterns and suggestions. The longer you use bito, the more it understands you.',
  },
]

export function ThreeSteps() {
  return (
    <section
      id="section-three-steps"
      style={{ background: 'var(--color-bg-primary)', padding: '120px 24px' }}
    >
      <div className="mx-auto max-w-300">
        <div className="mx-auto max-w-170 text-center">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: reduceMotion ? 0 : 0.6, ease: EASE_OUT_EXPO }}
            className="font-garamond"
            style={{
              fontSize: 'clamp(2rem, 5vw, 3.5rem)',
              lineHeight: 1.05,
              letterSpacing: '-1.6px',
              color: 'var(--color-text-primary)',
              margin: 0,
            }}
          >
            Three steps. That's it.
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: reduceMotion ? 0 : 0.6, delay: reduceMotion ? 0 : 0.1, ease: EASE_OUT_EXPO }}
            className="font-spartan mx-auto mt-6 text-base md:text-lg"
            style={{ color: 'var(--color-text-secondary)', maxWidth: '560px' }}
          >
            No complex setup, no learning curve. You'll be tracking habits in under two minutes.
          </motion.p>
        </div>

        <div className="mt-16 grid grid-cols-1 items-stretch gap-6 md:grid-cols-3 md:gap-4">
          {STEPS.map((step, i) => (
            <div key={step.n} className="relative flex flex-col">
              <motion.div
                layout
                initial={{ opacity: 0, y: 28 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.4 }}
                transition={{
                  duration: reduceMotion ? 0 : 0.55,
                  delay: reduceMotion ? 0 : i * 0.12,
                  ease: EASE_OUT_EXPO,
                }}
                className="liquid-glass flex h-full flex-col"
                style={{
                  borderRadius: '16px',
                  padding: '28px 24px',
                }}
              >
                <span
                  className="font-garamond text-5xl"
                  style={{
                    color: 'var(--color-brand-500)',
                    opacity: 0.3,
                    lineHeight: 1,
                  }}
                >
                  {step.n}
                </span>
                <h3
                  className="font-garamond mt-5 text-[24px]"
                  style={{ color: 'var(--color-text-primary)', margin: '20px 0 0 0' }}
                >
                  {step.title}
                </h3>
                <p
                  className="font-spartan mt-3 text-[14px]"
                  style={{ color: 'var(--color-text-secondary)' }}
                >
                  {step.desc}
                </p>
              </motion.div>

              {/* Connector line on desktop only */}
              {i < STEPS.length - 1 && (
                <motion.span
                  aria-hidden
                  initial={{ scaleX: 0 }}
                  whileInView={{ scaleX: 1 }}
                  viewport={{ once: true, amount: 0.4 }}
                  transition={{
                    duration: reduceMotion ? 0 : 0.6,
                    delay: reduceMotion ? 0 : i * 0.12 + 0.2,
                    ease: EASE_OUT_EXPO,
                  }}
                  className="step-connector"
                  style={{
                    position: 'absolute',
                    top: '50%',
                    right: '-2rem',
                    width: '2rem',
                    height: '1px',
                    background: 'var(--color-border-primary)',
                    transformOrigin: 'left',
                  }}
                />
              )}
              <style>{`
                @media (max-width: 767px) { .step-connector { display: none; } }
              `}</style>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
