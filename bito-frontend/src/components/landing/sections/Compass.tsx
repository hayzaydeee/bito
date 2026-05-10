import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import Splitting from 'splitting'
import { EASE_OUT_EXPO, EASE_OUT_SPRING, reduceMotion } from '../../../lib/landing/motion'
import { CompassMock } from './compass/CompassMock'

/**
 * Section 04 - Compass (spec section 9).
 *
 * Tonal shift to a darker, focused register. Visitor types a goal (well,
 * watches one type itself) and a personalised plan materialises. The
 * card deal animation is the centrepiece - it must feel physical.
 *
 * The right-column sequence fires ONCE on first viewport entry. We track
 * that with a ref-guard so scrolling back into view doesn't replay.
 */

const FEATURES = [
  {
    title: 'Knows your routine',
    desc:
      "It looks at what you're already doing so the plan doesn't fight your life - it fits it.",
  },
  {
    title: 'Refine with conversation',
    desc:
      'Not quite right? Tell it what to change. Swap a habit, shift the schedule, make it harder - it adjusts instantly.',
  },
  {
    title: 'Starts easy, builds up',
    desc:
      "Plans begin with simple wins and escalate when you're ready - not before.",
  },
]

export function Compass() {
  const headingRef = useRef<HTMLHeadingElement | null>(null)
  const rightColRef = useRef<HTMLDivElement | null>(null)
  const [sequenceStarted, setSequenceStarted] = useState(false)
  const startedRef = useRef(false)

  // Splitting on the H2 - both lines get word-stagger in.
  useEffect(() => {
    const h2 = headingRef.current
    if (!h2 || reduceMotion) return
    const results = Splitting({ target: h2, by: 'words' })
    const words = results[0]?.words ?? []
    words.forEach((wordEl, i) => {
      ;(wordEl as HTMLElement).style.animationDelay = `${i * 45}ms`
    })
  }, [])

  // Trigger right-column sequence once when the column enters viewport.
  useEffect(() => {
    const target = rightColRef.current
    if (!target || startedRef.current) return

    if (reduceMotion) {
      startedRef.current = true
      setSequenceStarted(true)
      return
    }

    const obs = new IntersectionObserver(
      (entries) => {
        if (!entries[0]?.isIntersecting || startedRef.current) return
        startedRef.current = true
        setSequenceStarted(true)
        obs.disconnect()
      },
      { threshold: 0.4 },
    )
    obs.observe(target)
    return () => obs.disconnect()
  }, [])

  return (
    <section
      id="section-compass"
      style={{
        position: 'relative',
        background:
          'linear-gradient(180deg, var(--color-bg-primary) 0%, #06040F 45%, var(--color-bg-primary) 100%)',
        padding: '120px 24px',
        overflow: 'hidden',
      }}
    >
      {/* Aurora overlay - sits behind all content */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 0,
          pointerEvents: 'none',
          background:
            'radial-gradient(ellipse 80% 50% at 50% 55%, rgba(79, 70, 229, 0.18) 0%, rgba(99, 102, 241, 0.06) 40%, transparent 70%)',
        }}
      />

      <div
        className="relative mx-auto max-w-300"
        style={{ zIndex: 1 }}
      >
        {/* Section heading */}
        <div className="mx-auto max-w-190 text-center">
          <motion.span
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: reduceMotion ? 0 : 0.5, ease: EASE_OUT_EXPO }}
            className="font-spartan text-[12px] font-medium uppercase tracking-[0.22em]"
            style={{ color: 'var(--color-brand-400)' }}
          >
            Compass
          </motion.span>

          <h2
            ref={headingRef}
            className="font-garamond split-words mt-5"
            style={{
              fontSize: 'clamp(2.25rem, 5.5vw, 4rem)',
              lineHeight: 1.05,
              letterSpacing: '-1.8px',
              color: 'var(--color-text-primary)',
              margin: '20px 0 0 0',
            }}
          >
            Tell us your goal.{' '}
            <span className="gradient-text">We'll build the plan.</span>
          </h2>

          <motion.p
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{
              duration: reduceMotion ? 0 : 0.6,
              delay: reduceMotion ? 0 : 0.4,
              ease: EASE_OUT_EXPO,
            }}
            className="font-spartan mx-auto mt-6 text-base md:text-lg"
            style={{ color: 'var(--color-text-secondary)', maxWidth: '620px' }}
          >
            Type what you want to become. Compass reads your existing habits,
            your streaks, your patterns - and builds a plan around how you
            actually live. Not a generic template. A plan that fits you.
          </motion.p>
        </div>

        {/* Two-column body */}
        <div className="mt-16 grid gap-12 md:grid-cols-2 md:gap-16">
          {/* Left column - feature rows + MCP diagram */}
          <div className="flex flex-col gap-8">
            {FEATURES.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, x: -28 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, amount: 0.4 }}
                transition={{
                  duration: reduceMotion ? 0 : 0.6,
                  delay: reduceMotion ? 0 : i * 0.12,
                  ease: EASE_OUT_EXPO,
                }}
                className="flex gap-4"
              >
                <span
                  aria-hidden
                  className="flex h-9 w-9 shrink-0 items-center justify-center"
                  style={{
                    background:
                      'linear-gradient(135deg, rgba(99, 102, 241, 0.18), rgba(79, 70, 229, 0.08))',
                    border: '1px solid rgba(99, 102, 241, 0.28)',
                    borderRadius: '10px',
                  }}
                >
                  <FeatureGlyph index={i} />
                </span>
                <div>
                  <h3
                    className="font-garamond text-[20px]"
                    style={{ color: 'var(--color-text-primary)', margin: 0 }}
                  >
                    {feature.title}
                  </h3>
                  <p
                    className="font-spartan mt-1.5 text-[14px]"
                    style={{ color: 'var(--color-text-secondary)' }}
                  >
                    {feature.desc}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Right column - animated Compass mock */}
          <div ref={rightColRef}>
            <CompassMock start={sequenceStarted} />
          </div>
        </div>
      </div>
    </section>
  )
}

// --------------------------------------------------------------------
// Feature row glyphs - kept inline to avoid asset overhead
// --------------------------------------------------------------------

function FeatureGlyph({ index }: { index: number }) {
  const stroke = 'var(--color-brand-400)'
  if (index === 0) {
    return (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <circle cx="8" cy="8" r="6" stroke={stroke} strokeWidth="1.5" />
        <path d="M8 4v4l2.5 2.5" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    )
  }
  if (index === 1) {
    return (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path d="M3 4h10v6H6L3 12V4z" stroke={stroke} strokeWidth="1.5" strokeLinejoin="round" />
      </svg>
    )
  }
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M2 12L6 8L9 11L14 4" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M11 4h3v3" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

// re-export so the spring ease is used in card deal sub-component
export { EASE_OUT_SPRING }
