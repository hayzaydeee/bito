// Lenis + GSAP ScrollTrigger integration (spec §4.1, §4.2).
// initLenis() is invoked once from <LandingPage> after mount. The instance
// is parked on window.__lenis so other modules (nav, features section) can
// drive scroll programmatically via Lenis's smoothed engine.

import Lenis from 'lenis'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

declare global {
  interface Window {
    __lenis?: Lenis
  }
}

let registered = false

export function registerGsapPlugins(): void {
  if (registered) return
  gsap.registerPlugin(ScrollTrigger)
  // Spec §4.2 — global default for scroll-trigger animations.
  ScrollTrigger.defaults({ toggleActions: 'play none none none' })
  registered = true
}

export function initLenis(): Lenis {
  registerGsapPlugins()

  const lenis = new Lenis({
    duration: 1.2,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    orientation: 'vertical',
    smoothWheel: true,
    wheelMultiplier: 1,
    touchMultiplier: 2,
  })

  // Drive ScrollTrigger off Lenis's RAF-synced position.
  lenis.on('scroll', ScrollTrigger.update)
  gsap.ticker.add((time) => {
    lenis.raf(time * 1000)
  })
  gsap.ticker.lagSmoothing(0)

  return lenis
}
