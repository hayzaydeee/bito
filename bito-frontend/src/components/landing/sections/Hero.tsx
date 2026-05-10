import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import Splitting from 'splitting'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { EASE_OUT_EXPO, reduceMotion } from '../../../lib/landing/motion'

/**
 * Section 01 — Hero (spec §6).
 *
 * Layout (per spec figure):
 *   - Section is 100vh with overflow:hidden so the dashboard card can clip past the fold.
 *   - Upper stack (H1 / sub / CTA) sits roughly at vertical centre, pushed
 *     down with padding-top so the upper visual mass reads as centred.
 *   - Dashboard card is absolutely positioned along the section's bottom
 *     edge and translated down 35% of its own height. With overflow:hidden,
 *     its bottom 35% is clipped — exactly the "extends past fold" effect
 *     the spec calls for.
 *   - Three nested wrappers around the card so each transform owns its own
 *     element: position offset, Framer entry animation, idle float.
 *
 * Spec specifics:
 *   - H1 word-stagger uses Splitting.js; per-word animation-delay set inline.
 *   - The <em class="not-italic"> wrapping "shape who you" survives Splitting
 *     because Splitting walks text nodes individually.
 *   - Exit transitions are GSAP scrub timelines pinned to #section-hero.
 *   - The dashboard card deliberately does NOT scrub-fade with the text,
 *     creating the illusion that it rises into the next section.
 */
export function Hero() {
  const headingRef = useRef<HTMLHeadingElement | null>(null)
  const sectionRef = useRef<HTMLElement | null>(null)

  // Splitting + per-word animation-delay assignment (spec §6).
  useEffect(() => {
    const h1 = headingRef.current
    if (!h1 || reduceMotion) return

    const results = Splitting({ target: h1, by: 'words' })
    const words = results[0]?.words ?? []
    words.forEach((wordEl, i) => {
      ;(wordEl as HTMLElement).style.animationDelay = `${300 + i * 50}ms`
    })
  }, [])

  // Scroll-driven exit (spec §6 — text fades out, overlay deepens).
  useEffect(() => {
    if (reduceMotion) return
    const section = sectionRef.current
    if (!section) return

    const ctx = gsap.context(() => {
      gsap.to('#hero-content-stack', {
        opacity: 0,
        y: -56,
        ease: 'none',
        scrollTrigger: {
          trigger: section,
          start: 'top top',
          end: 'bottom top',
          scrub: 1,
        },
      })
      gsap.to('#hero-video-overlay', {
        opacity: 0.65,
        ease: 'none',
        scrollTrigger: {
          trigger: section,
          start: 'top top',
          end: 'bottom top',
          scrub: 1.5,
        },
      })
    }, section)

    return () => {
      ctx.revert()
      // Defensive cleanup for HMR / StrictMode double-mount.
      ScrollTrigger.getAll()
        .filter((st) => st.trigger === section)
        .forEach((st) => st.kill())
    }
  }, [])

  const transition = (duration: number, delay: number) => ({
    duration: reduceMotion ? 0 : duration,
    delay: reduceMotion ? 0 : delay,
    ease: EASE_OUT_EXPO,
  })

  return (
    <section
      id="section-hero"
      ref={sectionRef}
      className="relative overflow-hidden"
      style={{ height: '100vh' }}
    >
      {/* Background — gradient base, video overlay (drop /public/hero.mp4 to activate). */}
      <div
        aria-hidden
        className="absolute inset-0 z-0"
        style={{
          background:
            'radial-gradient(ellipse 70% 60% at 50% 35%, rgba(99, 102, 241, 0.18), transparent 60%), radial-gradient(ellipse 90% 80% at 70% 80%, rgba(79, 70, 229, 0.12), transparent 65%), var(--color-bg-primary)',
        }}
      />
      <video
        aria-hidden
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        className="absolute inset-0 z-0 h-full w-full object-cover"
        style={{ pointerEvents: 'none' }}
      >
        <source src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260314_131748_f2ca2a28-fed7-44c8-b9a9-bd9acdd5ec31.mp4" type="video/mp4" />
      </video>
      <div
        id="hero-video-overlay"
        aria-hidden
        className="absolute inset-0 z-1"
        style={{ background: 'rgba(13, 10, 26, 0.3)' }}
      />
      {/* Bottom gradient — bleeds the hero into the dark section below,
          removing the hard colour edge at the scroll boundary. */}
      <div
        aria-hidden
        className="absolute bottom-0 left-0 right-0 z-2"
        style={{ height: '40%', background: 'linear-gradient(to bottom, transparent, #0D0A1A)', pointerEvents: 'none' }}
      />
      {/* Upper stack — H1 / sub / CTA */}
      <div
        id="hero-content-stack"
        className="relative z-2 flex h-full flex-col items-center px-6"
        style={{ paddingTop: 'clamp(96px, 18vh, 200px)' }}
      >
        <div className="mx-auto flex max-w-170 flex-col items-center text-center">
          <h1
            ref={headingRef}
            className="font-garamond split-words"
            style={{
              fontSize: 'clamp(3rem, 8vw, 6rem)',
              lineHeight: 0.95,
              letterSpacing: '-2.46px',
              color: 'var(--color-text-primary)',
              margin: 0,
            }}
          >
            Build the habits that{' '}
            <em
              className="not-italic"
              style={{ fontStyle: 'normal', color: 'var(--color-text-secondary)' }}
            >
              shape who you
            </em>{' '}
            become.
          </h1>

          <motion.p
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={transition(0.6, 0.68)}
            className="font-spartan mt-6 text-base md:text-lg"
            style={{ color: 'var(--color-text-secondary)', maxWidth: '560px' }}
          >
            bito is your AI-powered companion for building lasting habits.
            Track daily, understand your patterns, and get a personalized plan
            designed around how you actually live.
          </motion.p>

          <motion.a
            href="/login"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={transition(0.5, 0.88)}
            className="cta-shimmer font-spartan mt-8 inline-flex items-center justify-center text-sm font-medium text-white"
            style={{
              background: 'var(--color-brand-500)',
              borderRadius: '100px',
              padding: '12px 28px',
              transition: 'background-color 200ms ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--color-brand-600)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'var(--color-brand-500)'
            }}
          >
            Start for free
          </motion.a>
        </div>
      </div>

    </section>
  )
}
