import { useEffect } from 'react'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import '../landing.css'
import { initLenis, registerGsapPlugins } from '../lib/landing/lenis'
import { isTouchDevice, reduceMotion } from '../lib/landing/motion'
import { LandingNav } from '../components/landing/LandingNav'
import { Hero } from '../components/landing/sections/Hero'
import { FeaturesShowcase } from '../components/landing/sections/FeaturesShowcase'
import { Compass } from '../components/landing/sections/Compass'
import { Journaling } from '../components/landing/sections/Journaling'
import { ThreeSteps } from '../components/landing/sections/ThreeSteps'
import { Testimonials } from '../components/landing/sections/Testimonials'
import { Comparison } from '../components/landing/sections/Comparison'
import { Pricing } from '../components/landing/sections/Pricing'
import { FinalCta } from '../components/landing/sections/FinalCta'
import { Footer } from '../components/landing/Footer'

// Register GSAP plugins at module scope so sections can use ScrollTrigger on render
registerGsapPlugins()

/**
 * Page shell for the redesigned bito.works landing experience.
 *
 * - Wires Lenis (smooth scroll) on first paint, except on touch devices and
 *   when prefers-reduced-motion is set (spec sections 4.1, 4.5).
 * - Registers GSAP plugins regardless so scroll-triggered timelines inside
 *   sections can attach without each running its own registration.
 * - Sections render top-to-bottom in narrative order (spec section 2).
 */
export function LandingPage() {
  useEffect(() => {
    // Scope landing CSS tokens to this page only
    document.body.setAttribute('data-landing', '')

    if (reduceMotion || isTouchDevice()) {
      return () => {
        document.body.removeAttribute('data-landing')
        ScrollTrigger.killAll()
      }
    }

    const lenis = initLenis()
    window.__lenis = lenis

    return () => {
      document.body.removeAttribute('data-landing')
      window.__lenis = undefined
      lenis.destroy()
      ScrollTrigger.killAll()
    }
  }, [])

  return (
    <>
      <LandingNav />
      <main>
        <Hero />
        <FeaturesShowcase />
        <Compass />
        <Journaling />
        <ThreeSteps />
        <Testimonials />
        <Comparison />
        {/* <Pricing /> */}
        <FinalCta />
      </main>
      <Footer />
    </>
  )
}
