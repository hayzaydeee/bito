import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { EASE_OUT_EXPO, reduceMotion } from '../../../lib/landing/motion'

/**
 * Section 08 - "Why bito?" comparison (spec section 13).
 *
 * The data does the work - animation is restrained.
 */

interface Row {
  feature: string
  bito: true
  others: true | false | string
}

const ROWS: Row[] = [
  { feature: 'Habit tracking', bito: true, others: true },
  { feature: 'Team groups', bito: true, others: false },
  { feature: 'AI-powered insights', bito: true, others: false },
  { feature: 'Beautiful analytics', bito: true, others: 'Basic' },
  { feature: 'Journal integration', bito: true, others: false },
  { feature: 'Generous free tier', bito: true, others: 'Limited' },
]

export function Comparison() {
  const tableRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (reduceMotion) return
    const root = tableRef.current
    if (!root) return
    const ctx = gsap.context(() => {
      gsap.fromTo(
        '.comparison-row',
        { opacity: 0, x: -10 },
        {
          opacity: 1,
          x: 0,
          stagger: 0.05,
          duration: 0.4,
          ease: 'power2.out',
          scrollTrigger: { trigger: root, start: 'top 82%', once: true },
        },
      )
    }, root)
    return () => {
      ctx.revert()
      ScrollTrigger.getAll().filter((st) => st.trigger === root).forEach((st) => st.kill())
    }
  }, [])

  return (
    <section
      id="section-comparison"
      style={{ background: 'var(--color-bg-primary)', padding: '120px 24px' }}
    >
      <div className="mx-auto max-w-225">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: reduceMotion ? 0 : 0.6, ease: EASE_OUT_EXPO }}
          className="font-garamond text-center"
          style={{
            fontSize: 'clamp(2rem, 5vw, 3.5rem)',
            lineHeight: 1.05,
            letterSpacing: '-1.6px',
            color: 'var(--color-text-primary)',
            margin: 0,
          }}
        >
          Why bito?
        </motion.h2>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: reduceMotion ? 0 : 0.65, delay: reduceMotion ? 0 : 0.15, ease: EASE_OUT_EXPO }}
          className="liquid-glass mt-12 overflow-x-auto rounded-xl"
          style={{ padding: '8px' }}
        >
          <div ref={tableRef} className="min-w-105">
            {/* Header */}
            <div
              className="grid grid-cols-3 px-4 py-3 font-spartan text-[12px] font-medium uppercase tracking-[0.16em]"
              style={{ color: 'var(--color-text-tertiary)' }}
            >
              <span>Feature</span>
              <span className="text-center" style={{ color: 'var(--color-brand-400)' }}>Bito</span>
              <span className="text-center">Others</span>
            </div>
            {ROWS.map((row) => (
              <div
                key={row.feature}
                className="comparison-row grid grid-cols-3 items-center rounded-lg px-4 py-3 font-spartan text-[14px]"
                style={{
                  borderTop: '1px solid var(--color-border-primary)',
                }}
              >
                <span style={{ color: 'var(--color-text-primary)' }}>{row.feature}</span>
                <span className="text-center">
                  <Check />
                </span>
                <span className="text-center">
                  <Cell value={row.others} />
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  )
}

function Check() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" style={{ display: 'inline-block' }}>
      <circle cx="9" cy="9" r="9" fill="rgba(34, 197, 94, 0.16)" />
      <path d="M5 9.5l2.5 2.5L13 6" stroke="var(--color-success)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  )
}

function Cell({ value }: { value: true | false | string }) {
  if (value === true) return <Check />
  if (value === false) {
    return (
      <span style={{ color: 'var(--color-text-tertiary)', fontSize: '18px' }} aria-label="Not available">
        —
      </span>
    )
  }
  return (
    <span className="font-spartan text-[13px]" style={{ color: 'var(--color-text-tertiary)' }}>
      {value}
    </span>
  )
}
