import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useGSAP } from '@gsap/react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { EASE_OUT_EXPO, reduceMotion } from '../../../lib/landing/motion'
import { AppPreview } from '../AppPreview'
import type { Screen } from '../AppPreview'

/**
 * Section 03 — Features showcase (spec §8).
 *
 * The interactive product demo. The visitor scrolls and the demo plays itself.
 *
 * Architecture:
 *   - Desktop (>= lg): the section is 300vh tall. Inside lives a sticky
 *     div that pins to top:0 and stays the viewport height. Tab content
 *     renders inside that pinned shell. Scroll progress drives `activeTab`.
 *     We use position:sticky (not GSAP pin:true) to avoid a known
 *     Lenis ↔ ScrollTrigger pinning conflict.
 *   - Mobile (< lg): height:auto, click-driven tabs, panels stack.
 *
 * Tab buttons remain interactive on desktop too — clicking a tab uses
 * Lenis to scroll the corresponding 100vh chunk into view.
 */

const TABS = [
  {
    key: 'track',
    label: 'Track',
    title: 'Log in seconds. See progress in real time.',
    desc:
      'One tap to complete a habit. Your streaks, progress rings, and weekly view update instantly. No friction between the intention and the action.',
    bullets: [
      'One-click daily check-ins',
      'Streak tracking with milestone celebrations',
      'Flexible schedules — daily, weekly, or custom',
    ],
  },
  {
    key: 'understand',
    label: 'Understand',
    title: "See patterns you'd otherwise miss",
    desc:
      'Beautiful charts and heatmaps reveal the story behind your data. AI-powered insights surface correlations and trends.',
    bullets: [
      'Visual heatmaps and progress charts',
      'AI-generated insights and nudges',
      'Trend analysis across weeks and months',
    ],
  },
  {
    key: 'together',
    label: 'Together',
    title: 'Accountability changes everything',
    desc:
      'Invite friends, family, or teammates into shared groups. Celebrate wins together, run challenges, and build habits as a group.',
    bullets: [
      'Shared groups and team habits',
      'Group challenges and competitions',
      'Encouragement and activity feeds',
    ],
  },
] as const

type TabIndex = 0 | 1 | 2

export function FeaturesShowcase() {
  const sectionRef = useRef<HTMLElement | null>(null)
  const pinRef = useRef<HTMLDivElement | null>(null)
  const [activeTab, setActiveTab] = useState<TabIndex>(0)
  const [isDesktop, setIsDesktop] = useState(false)

  // Track viewport size for desktop/mobile branching.
  useEffect(() => {
    const mql = window.matchMedia('(min-width: 1024px)')
    const update = () => setIsDesktop(mql.matches)
    update()
    mql.addEventListener('change', update)
    return () => mql.removeEventListener('change', update)
  }, [])

  // Scroll-driven tab switching + clip-path exit (desktop only).
  useGSAP(
    () => {
      if (!isDesktop || reduceMotion) return
      const section = sectionRef.current
      const pin = pinRef.current
      if (!section || !pin) return

      const tabTrigger = ScrollTrigger.create({
        trigger: section,
        start: 'top top',
        end: 'bottom bottom',
        scrub: 1.5,
        onUpdate: (self) => {
          const p = self.progress
          if (p < 0.33) setActiveTab(0)
          else if (p < 0.66) setActiveTab(1)
          else setActiveTab(2)
        },
      })

      // Clip-path exit/return — wraps the pinned div as it leaves view.
      const exitTrigger = ScrollTrigger.create({
        trigger: section,
        start: 'bottom bottom',
        end: 'bottom 80%',
        onLeave: () => {
          gsap.to(pin, {
            clipPath: 'inset(0 0 100% 0)',
            duration: 0.6,
            ease: 'power3.inOut',
          })
        },
        onEnterBack: () => {
          gsap.to(pin, {
            clipPath: 'inset(0 0 0% 0)',
            duration: 0.4,
            ease: 'power2.out',
          })
        },
      })

      // AppPreview expansion — one-shot entry as features section scrolls into view.
      // Scale + fade in; the CSS sidebar width transition handles the sidebar slide-in.
      const previewEl = section.querySelector<HTMLElement>('.features-app-preview')
      if (previewEl) {
        gsap.fromTo(
          previewEl,
          { opacity: 0.5, scale: 0.94, y: 20 },
          {
            opacity: 1,
            scale: 1,
            y: 0,
            duration: 0.9,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: section,
              start: 'top 88%',
              once: true,
            },
          },
        )
      }

      return () => {
        tabTrigger.kill()
        exitTrigger.kill()
      }
    },
    { scope: sectionRef, dependencies: [isDesktop] },
  )

  // Tab click handler — desktop scrolls to the right beat, mobile just sets state.
  const onTabClick = (i: TabIndex) => {
    if (!isDesktop) {
      setActiveTab(i)
      return
    }
    const section = sectionRef.current
    if (!section) return
    if (window.__lenis) {
      const top = section.offsetTop + i * window.innerHeight
      window.__lenis.scrollTo(top, { offset: 0 })
    } else {
      window.scrollTo({
        top: section.offsetTop + i * window.innerHeight,
        behavior: 'smooth',
      })
    }
  }

  const sectionHeight = isDesktop ? '300vh' : 'auto'

  return (
    <section
      ref={sectionRef}
      id="features"
      className="relative"
      style={{
        height: sectionHeight,
        background: 'var(--color-bg-primary)',
      }}
    >
      <div
        ref={pinRef}
        id="features-pin"
        className="lg:overflow-hidden"
        style={
          isDesktop
            ? {
                position: 'sticky',
                top: 0,
                height: '100vh',
                clipPath: 'inset(0 0 0% 0)',
              }
            : undefined
        }
      >
        <div className="mx-auto flex h-full max-w-7xl flex-col px-6 lg:py-16">
          {/* Section heading */}
          <div className="mx-auto max-w-170 text-center lg:shrink-0">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.5 }}
              transition={{ duration: reduceMotion ? 0 : 0.65, ease: EASE_OUT_EXPO }}
              className="font-garamond"
              style={{
                fontSize: 'clamp(2rem, 5vw, 3.5rem)',
                lineHeight: 1.05,
                letterSpacing: '-1.6px',
                color: 'var(--color-text-primary)',
                margin: 0,
              }}
            >
              A system that works like you do.
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.5 }}
              transition={{
                duration: reduceMotion ? 0 : 0.6,
                delay: reduceMotion ? 0 : 0.1,
                ease: EASE_OUT_EXPO,
              }}
              className="font-spartan mx-auto mt-5 text-base md:text-lg"
              style={{
                color: 'var(--color-text-secondary)',
                maxWidth: '560px',
              }}
            >
              Track your habits. Understand your patterns. Build alongside
              people who keep you accountable.
            </motion.p>
          </div>

          {/* Tab nav */}
          <nav
            aria-label="Feature tabs"
            className="mx-auto mt-8 flex flex-wrap justify-center gap-2 lg:mt-10"
          >
            {TABS.map((tab, i) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => onTabClick(i as TabIndex)}
                className="font-spartan text-[13px] font-medium transition-colors"
                style={{
                  padding: '8px 18px',
                  borderRadius: '100px',
                  background:
                    activeTab === i
                      ? 'var(--color-brand-500)'
                      : 'var(--color-surface-hover)',
                  color:
                    activeTab === i
                      ? 'white'
                      : 'var(--color-text-secondary)',
                  border:
                    activeTab === i
                      ? '1px solid var(--color-brand-500)'
                      : '1px solid var(--color-border-primary)',
                }}
              >
                {tab.label}
              </button>
            ))}
          </nav>

          {/* Tab content */}
          <div className="mt-8 flex-1 lg:mt-12">
            {isDesktop ? (
              <DesktopBeats activeTab={activeTab} />
            ) : (
              <MobileStack />
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

// --------------------------------------------------------------------
// Desktop view — single visible beat at a time, mounted side-by-side
// so each beat's animation state can persist when scrolling back through.
// --------------------------------------------------------------------

const SCREEN_MAP: Screen[] = ['habits', 'analytics', 'groups']

// --------------------------------------------------------------------
// Desktop view — 35/65 grid. Left: copy. Right: persistent AppPreview.
// --------------------------------------------------------------------

function DesktopBeats({ activeTab }: { activeTab: TabIndex }) {
  return (
    <div className="grid h-full items-center gap-10" style={{ gridTemplateColumns: '35fr 65fr' }}>
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: reduceMotion ? 0 : 0.45, ease: EASE_OUT_EXPO }}
          className="flex flex-col"
        >
          <BeatCopy index={activeTab} />
        </motion.div>
      </AnimatePresence>

      <AppPreview
        activeScreen={SCREEN_MAP[activeTab]}
        className="features-app-preview"
      />
    </div>
  )
}

function BeatCopy({ index }: { index: TabIndex }) {
  const tab = TABS[index]
  return (
    <div>
      <h3
        className="font-garamond"
        style={{
          fontSize: 'clamp(1.75rem, 3.5vw, 2.5rem)',
          lineHeight: 1.1,
          letterSpacing: '-0.6px',
          color: 'var(--color-text-primary)',
          margin: 0,
        }}
      >
        {tab.title}
      </h3>
      <p
        className="font-spartan mt-4 text-base"
        style={{ color: 'var(--color-text-secondary)' }}
      >
        {tab.desc}
      </p>
      <ul className="mt-6 flex flex-col gap-3">
        {tab.bullets.map((bullet) => (
          <li
            key={bullet}
            className="font-spartan flex items-start gap-3 text-[14px]"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            <span
              aria-hidden
              className="mt-1 flex h-4 w-4 shrink-0 items-center justify-center"
              style={{
                background: 'rgba(99, 102, 241, 0.14)',
                borderRadius: '50%',
              }}
            >
              <svg width="9" height="9" viewBox="0 0 12 12">
                <path
                  d="M2.5 6.5l2.4 2.4L9.5 3.5"
                  fill="none"
                  stroke="var(--color-brand-400)"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
            {bullet}
          </li>
        ))}
      </ul>
    </div>
  )
}

// --------------------------------------------------------------------
// Mobile view — stack beats vertically. Tab nav switches active beat;
// inactive beats render in their final state without animation.
// --------------------------------------------------------------------

function MobileStack() {
  return (
    <div className="flex flex-col gap-12 pb-12">
      {TABS.map((tab, i) => (
        <MobileBeat key={tab.key} index={i as TabIndex} />
      ))}
    </div>
  )
}

function MobileBeat({ index }: { index: TabIndex }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: reduceMotion ? 0 : 0.6, ease: EASE_OUT_EXPO }}
      className="flex flex-col gap-6"
    >
      <BeatCopy index={index} />
      <AppPreview compact activeScreen={SCREEN_MAP[index]} />
    </motion.div>
  )
}
