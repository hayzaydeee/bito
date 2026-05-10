import { motion } from 'framer-motion'
import { EASE_OUT_EXPO, reduceMotion } from '../../../lib/landing/motion'

/**
 * Section 07 - Testimonials (spec section 12).
 *
 * Three real people, three quotes, exact copy. Avatar uses the spec
 * gradient (brand-500 -> brand-700, 135deg).
 */

const TESTIMONIALS = [
  {
    name: 'Stephanie Ndubuisi',
    role: 'Student',
    quote: 'Bito completely changed how I approach personal development. The visual progress tracking keeps me motivated every single day.',
    initials: 'SN',
  },
  {
    name: 'Henry Nwokolo',
    role: 'Software Engineer',
    quote: 'The analytics are incredible. I can finally see exactly which habits are driving real results in my routines.',
    initials: 'HN',
  },
  {
    name: 'David Arochukwu',
    role: 'Writer',
    quote: 'Beautiful design and incredibly intuitive. Building habits has never felt this engaging and rewarding.',
    initials: 'DA',
  },
]

export function Testimonials() {
  return (
    <section
      id="section-testimonials"
      style={{ background: 'var(--color-bg-primary)', padding: '120px 24px' }}
    >
      <div className="mx-auto max-w-300">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: reduceMotion ? 0 : 0.6, ease: EASE_OUT_EXPO }}
          className="font-garamond mx-auto max-w-190 text-center"
          style={{
            fontSize: 'clamp(2rem, 5vw, 3.5rem)',
            lineHeight: 1.05,
            letterSpacing: '-1.6px',
            color: 'var(--color-text-primary)',
            margin: 0,
          }}
        >
          From the people using it every day.
        </motion.h2>

        <div className="mt-16 grid grid-cols-1 gap-6 md:grid-cols-3">
          {TESTIMONIALS.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 32, scale: 0.98 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{
                duration: reduceMotion ? 0 : 0.6,
                delay: reduceMotion ? 0 : i * 0.1,
                ease: EASE_OUT_EXPO,
              }}
              className="liquid-glass flex flex-col rounded-2xl p-8"
            >
              <p
                className="font-spartan flex-1 text-[15px]"
                style={{ color: 'var(--color-text-secondary)', lineHeight: 1.6 }}
              >
                "{t.quote}"
              </p>
              <div className="mt-6 flex items-center gap-3">
                <span
                  aria-hidden
                  className="flex h-10 w-10 items-center justify-center font-spartan text-[14px] font-medium text-white"
                  style={{
                    background:
                      'linear-gradient(135deg, var(--color-brand-500), var(--color-brand-700))',
                    borderRadius: '50%',
                  }}
                >
                  {t.initials}
                </span>
                <div className="flex flex-col">
                  <span
                    className="font-spartan text-[14px] font-medium"
                    style={{ color: 'var(--color-text-primary)' }}
                  >
                    {t.name}
                  </span>
                  <span
                    className="font-spartan text-[12px]"
                    style={{ color: 'var(--color-text-tertiary)' }}
                  >
                    {t.role}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
