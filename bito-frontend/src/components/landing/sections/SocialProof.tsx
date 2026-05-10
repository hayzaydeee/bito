import { Fragment, useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { reduceMotion } from '../../../lib/landing/motion'

/**
 * Section 02 - Social proof bar (spec section 7).
 *
 * Aligned with production
 * (bito-frontend/src/components/landingPage/SocialProofBar.jsx):
 * - Stats use easeOutExpo (production curve), 1800ms duration
 * - Vertical 1px dividers between stats (hidden on <sm), no per-cell border
 * - Background scrubs to bg-primary on exit
 */

interface Stat {
  target: number
  decimal: boolean
  suffix: '+' | '%' | 'x'
  label: string
  delay: number
}

const STATS: Stat[] = [
  { target: 12000, decimal: false, suffix: '+', label: 'Habits tracked this week', delay: 0 },
  { target: 94,    decimal: false, suffix: '%', label: 'Users who maintain 7+ day streaks', delay: 100 },
  { target: 3.2,   decimal: true,  suffix: 'x', label: 'More consistent vs solo tracking', delay: 200 },
]

const easeOutExpo = (t: number) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t))

export function SocialProof() {
  const sectionRef = useRef<HTMLElement | null>(null)
  const numberRefs = useRef<(HTMLSpanElement | null)[]>([])

  // Counter animation - fires once at threshold 0.5.
  useEffect(() => {
    if (reduceMotion) {
      numberRefs.current.forEach((el, i) => {
        if (!el) return
        const stat = STATS[i]
        el.textContent = formatStat(stat.target, stat.decimal) + stat.suffix
      })
      return
    }
    const observers: IntersectionObserver[] = []
    numberRefs.current.forEach((el, i) => {
      if (!el) return
      const stat = STATS[i]
      const duration = 1800
      const obs = new IntersectionObserver(
        (entries) => {
          if (!entries[0]?.isIntersecting) return
          obs.disconnect()
          const start = performance.now() + stat.delay
          const tick = (now: number) => {
            const elapsed = now - start
            if (elapsed < 0) {
              requestAnimationFrame(tick)
              return
            }
            const progress = Math.min(elapsed / duration, 1)
            const eased = easeOutExpo(progress)
            const current = eased * stat.target
            el.textContent =
              (stat.decimal ? (Math.round(current * 10) / 10).toFixed(1) : Math.round(current).toLocaleString()) +
              stat.suffix
            if (progress < 1) requestAnimationFrame(tick)
          }
          requestAnimationFrame(tick)
        },
        { threshold: 0.5 },
      )
      obs.observe(el)
      observers.push(obs)
    })
    return () => observers.forEach((o) => o.disconnect())
  }, [])

  // Background fade-out into the dark sections below.
  useEffect(() => {
    if (reduceMotion) return
    const section = sectionRef.current
    if (!section) return
    const ctx = gsap.context(() => {
      gsap.to(section, {
        backgroundColor: 'var(--color-bg-primary)',
        ease: 'none',
        scrollTrigger: {
          trigger: section,
          start: 'bottom 70%',
          end: 'bottom top',
          scrub: 2,
        },
      })
    }, section)
    return () => {
      ctx.revert()
      ScrollTrigger.getAll().filter((st) => st.trigger === section).forEach((st) => st.kill())
    }
  }, [])

  return (
    <section
      ref={sectionRef}
      id="section-social-proof"
      aria-label="By the numbers"
      style={{
        background: 'var(--color-surface-secondary)',
        borderTop: '1px solid var(--color-border-primary)',
        borderBottom: '1px solid var(--color-border-primary)',
        padding: '32px',
      }}
    >
      <div
        className="mx-auto max-w-4xl"
        style={{ display: 'flex', flexDirection: 'row', gap: 0 }}
      >
        {STATS.map((stat, i) => (
          <Fragment key={stat.label}>
            <div style={{ textAlign: 'center', flex: 1 }}>
              <span
                ref={(el) => {
                  numberRefs.current[i] = el
                }}
                className="font-garamond block"
                style={{
                  fontSize: 32,
                  color: 'var(--color-text-primary)',
                  lineHeight: 1,
                  letterSpacing: '-0.01em',
                }}
                aria-label={`${formatStat(stat.target, stat.decimal)}${stat.suffix} ${stat.label}`}
              >
                {stat.decimal ? '0.0' : '0'}
                {stat.suffix}
              </span>
              <span
                className="font-spartan block"
                style={{
                  fontSize: 13,
                  color: 'var(--color-text-secondary)',
                  marginTop: 8,
                  lineHeight: 1.4,
                }}
              >
                {stat.label}
              </span>
            </div>
            {i < STATS.length - 1 && (
              <span
                aria-hidden
                className="hidden sm:block"
                style={{
                  width: 1,
                  alignSelf: 'stretch',
                  background: 'var(--color-border-primary)',
                  margin: '0 24px',
                  flexShrink: 0,
                }}
              />
            )}
          </Fragment>
        ))}
      </div>
    </section>
  )
}

const formatStat = (value: number, decimal: boolean): string =>
  decimal ? value.toFixed(1) : value >= 1000 ? value.toLocaleString('en-US') : Math.floor(value).toString()
