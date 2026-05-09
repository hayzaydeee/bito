/**
 * useLenis — Singleton Lenis smooth scroll instance for the landing page.
 *
 * Creates a Lenis instance on mount, runs the RAF loop, and synchronises
 * Lenis' scroll position with Framer Motion's native scroll tracking so
 * useScroll / useTransform work correctly under smooth scroll.
 *
 * Usage:
 *   const lenis = useLenis();   // call at top of LandingPage
 */
import { useEffect, useRef } from "react";
import Lenis from "lenis";

export default function useLenis() {
  const lenisRef = useRef(null);

  useEffect(() => {
    // CSS `scroll-behavior: smooth` on <html> causes the browser to add its own
    // easing on top of every Lenis scrollTo() call, creating double-smoothing.
    // This breaks window.scrollY updates and therefore Framer Motion's useScroll.
    // We override it for the lifetime of the landing page and restore on cleanup.
    const htmlEl = document.documentElement;
    const prevBehavior = htmlEl.style.scrollBehavior;
    htmlEl.style.scrollBehavior = "auto";

    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: "vertical",
      smoothWheel: true,
    });

    lenisRef.current = lenis;

    // Dispatch a native scroll event on every Lenis frame so Framer Motion's
    // useScroll MotionValues (scrollY, scrollYProgress) stay in sync.
    lenis.on("scroll", () => {
      window.dispatchEvent(new Event("scroll"));
    });

    let rafId;
    function raf(time) {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    }
    rafId = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(rafId);
      lenis.destroy();
      lenisRef.current = null;
      htmlEl.style.scrollBehavior = prevBehavior;
    };
  }, []);

  return lenisRef;
}
