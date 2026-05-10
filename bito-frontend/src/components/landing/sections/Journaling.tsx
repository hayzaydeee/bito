import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { EASE_OUT_EXPO, EASE_OUT_SPRING, reduceMotion } from '../../../lib/landing/motion'

/**
 * Section 05 - Journaling (spec section 10).
 *
 * Calmer pacing after Compass. Right-column journal mock fires once on
 * viewport entry: typing -> mood tag pop -> AI insight slide-up.
 */

const FEATURES = [
  {
    title: 'Quick notes & deep entries',
    desc: 'Tap out a one-liner or write a full page. Both live on the same timeline.',
  },
  {
    title: 'Rich editor',
    desc: 'Headings, lists, images, callouts - write however you think. Everything auto-saves.',
  },
  {
    title: 'Search everything',
    desc: 'Find any entry instantly. That insight from three weeks ago is one search away.',
  },
  {
    title: 'AI that reads between the lines',
    desc: 'Opt in to surface patterns between what you write and how your habits perform. Privacy-first - you choose what the AI sees.',
  },
]

const TYPED_TEXT = 'Had a breakthrough today during the morning run - finally hit the 5K without stopping. The consistency is paying off.'
const TYPE_DELAY_MS = 18

export function Journaling() {
  const mockRef = useRef<HTMLDivElement | null>(null)
  const [start, setStart] = useState(false)
  const [typed, setTyped] = useState('')
  const [showMood, setShowMood] = useState(false)
  const [showInsight, setShowInsight] = useState(false)
  const startedRef = useRef(false)

  useEffect(() => {
    const target = mockRef.current
    if (!target || startedRef.current) return
    if (reduceMotion) {
      startedRef.current = true
      setTyped(TYPED_TEXT)
      setShowMood(true)
      setShowInsight(true)
      return
    }
    const obs = new IntersectionObserver(
      (entries) => {
        if (!entries[0]?.isIntersecting || startedRef.current) return
        startedRef.current = true
        setStart(true)
        obs.disconnect()
      },
      { threshold: 0.3 },
    )
    obs.observe(target)
    return () => obs.disconnect()
  }, [])

  useEffect(() => {
    if (!start || reduceMotion) return
    const ids: number[] = []
    // Card-enter delay 700 + 400ms before typing begins.
    const baseDelay = 1100
    for (let i = 0; i <= TYPED_TEXT.length; i++) {
      ids.push(window.setTimeout(() => setTyped(TYPED_TEXT.slice(0, i)), baseDelay + i * TYPE_DELAY_MS))
    }
    const moodAt = baseDelay + TYPED_TEXT.length * TYPE_DELAY_MS + 200
    ids.push(window.setTimeout(() => setShowMood(true), moodAt))
    ids.push(window.setTimeout(() => setShowInsight(true), moodAt + 600))
    return () => ids.forEach(clearTimeout)
  }, [start])

  return (
    <section
      id="section-journaling"
      style={{ background: 'var(--color-bg-primary)', padding: '120px 24px' }}
    >
      <div className="mx-auto max-w-300">
        <div className="mx-auto max-w-190 text-center">
          <motion.span
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: reduceMotion ? 0 : 0.5, ease: EASE_OUT_EXPO }}
            className="font-spartan text-[12px] font-medium uppercase tracking-[0.22em]"
            style={{ color: 'var(--color-brand-400)' }}
          >
            Rich Journaling
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: reduceMotion ? 0 : 0.65, ease: EASE_OUT_EXPO }}
            className="font-garamond mt-5"
            style={{
              fontSize: 'clamp(2rem, 5vw, 3.5rem)',
              lineHeight: 1.05,
              letterSpacing: '-1.6px',
              color: 'var(--color-text-primary)',
              margin: '20px 0 0 0',
            }}
          >
            Your journal tells the rest.
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: reduceMotion ? 0 : 0.6, delay: reduceMotion ? 0 : 0.1, ease: EASE_OUT_EXPO }}
            className="font-spartan mx-auto mt-6 text-base md:text-lg"
            style={{ color: 'var(--color-text-secondary)', maxWidth: '620px' }}
          >
            A writing space that lives alongside your habits - and an AI that connects what you write to how you actually perform. Quick notes or deep reflections. Both in one place.
          </motion.p>
        </div>

        <div className="mt-16 grid gap-12 md:grid-cols-2 md:gap-16">
          {/* Left - feature bullets */}
          <div className="flex flex-col gap-6">
            {FEATURES.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, x: -16 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{
                  duration: reduceMotion ? 0 : 0.55,
                  delay: reduceMotion ? 0 : i * 0.08,
                  ease: EASE_OUT_EXPO,
                }}
              >
                <h3 className="font-garamond text-[20px]" style={{ color: 'var(--color-text-primary)', margin: 0 }}>
                  {feature.title}
                </h3>
                <p className="font-spartan mt-1.5 text-[14px]" style={{ color: 'var(--color-text-secondary)' }}>
                  {feature.desc}
                </p>
              </motion.div>
            ))}
          </div>

          {/* Right - journal mock */}
          <motion.div
            ref={mockRef}
            initial={{ opacity: 0, x: 44 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: reduceMotion ? 0 : 0.7, ease: EASE_OUT_EXPO }}
            className="liquid-glass"
            style={{
              borderRadius: '16px',
              padding: '24px',
              boxShadow: '0 30px 60px rgba(0, 0, 0, 0.4)',
            }}
          >
            <div className="flex items-center justify-between">
              <span className="font-spartan text-[12px] uppercase tracking-[0.18em]" style={{ color: 'var(--color-text-tertiary)' }}>
                Friday, March 7
              </span>
              {showMood && (
                <motion.span
                  initial={{ opacity: 0, scale: 0.82 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: reduceMotion ? 0 : 0.3, ease: EASE_OUT_SPRING }}
                  className="font-spartan text-[11px] font-medium"
                  style={{
                    color: 'var(--color-warning)',
                    background: 'rgba(245, 158, 11, 0.12)',
                    border: '1px solid rgba(245, 158, 11, 0.32)',
                    borderRadius: '100px',
                    padding: '3px 10px',
                  }}
                >
                  high energy
                </motion.span>
              )}
            </div>
            <p className="font-spartan mt-4 text-[14px]" style={{ color: 'var(--color-text-primary)', lineHeight: 1.6 }}>
              {typed}
              {typed.length < TYPED_TEXT.length && !reduceMotion && (
                <span aria-hidden style={{
                  display: 'inline-block', width: '2px', height: '16px',
                  background: 'var(--color-brand-400)', marginLeft: '2px',
                  verticalAlign: 'middle',
                  animation: 'journal-cursor 0.9s steps(2, start) infinite',
                }} />
              )}
            </p>
            <p className="font-spartan mt-4 text-[14px]" style={{ color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
              Noticed that I've been sleeping better on days I journal before bed. Want to explore that pattern more...
            </p>
            {showInsight && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: reduceMotion ? 0 : 0.4, ease: EASE_OUT_EXPO }}
                className="mt-6"
                style={{
                  borderLeft: '3px solid var(--color-brand-500)',
                  background: 'rgba(79, 70, 229, 0.08)',
                  borderRadius: '0 8px 8px 0',
                  padding: '10px 14px',
                }}
              >
                <span className="font-spartan text-[11px] font-medium uppercase tracking-[0.16em]" style={{ color: 'var(--color-brand-400)' }}>
                  AI Insight
                </span>
                <p className="font-spartan mt-1 text-[13px]" style={{ color: 'var(--color-text-secondary)' }}>
                  Pattern detected: You write more on high-streak days.
                </p>
              </motion.div>
            )}
            <style>{`@keyframes journal-cursor { to { visibility: hidden; } }`}</style>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
