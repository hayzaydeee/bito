import { useEffect, useState } from 'react'
import { TargetIcon, Cross2Icon, HamburgerMenuIcon } from '@radix-ui/react-icons'

/**
 * Top-of-page navigation (spec section 5).
 *
 * Brand mark + nav style aligned with production
 * (bito-frontend/src/pages/LandingPage.jsx lines 458-535):
 * - 32px rounded-lg square, brand-600 fill, TargetIcon inside
 * - Wordmark "bito" in font-garamond next to it
 * - Features / Compass / Pricing / Contact links
 * - Sign In link + Start for free CTA
 * - Mobile hamburger toggle
 */
export function LandingNav() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY >= 80)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const scrollTo = (selector: string) => (e: React.MouseEvent) => {
    e.preventDefault()
    setMobileOpen(false)
    const target = document.querySelector<HTMLElement>(selector)
    if (!target) return
    if (window.__lenis) window.__lenis.scrollTo(target, { offset: -64 })
    else target.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const showGlass = scrolled || mobileOpen

  return (
    <nav
      aria-label="Primary"
      className="fixed top-0 left-0 right-0 z-100"
      style={{
        background: showGlass ? 'rgba(13, 10, 26, 0.75)' : 'transparent',
        backdropFilter: showGlass ? 'blur(16px)' : 'none',
        WebkitBackdropFilter: showGlass ? 'blur(16px)' : 'none',
        borderBottom: showGlass
          ? '1px solid var(--color-border-primary)'
          : '1px solid transparent',
        transition:
          'background-color 300ms ease-out, backdrop-filter 300ms ease-out, border-color 300ms ease-out',
      }}
    >
      <div className="mx-auto max-w-7xl px-6 sm:px-8">
        <div className="flex h-16 items-center">
          {/* Brand mark */}
          <a
            href="#section-hero"
            onClick={scrollTo('#section-hero')}
            className="flex shrink-0 items-center gap-2.5"
          >
            <span
              aria-hidden
              className="flex h-8 w-8 items-center justify-center rounded-lg"
              style={{ backgroundColor: 'var(--color-brand-600)' }}
            >
              <TargetIcon className="h-5 w-5 text-white" />
            </span>
            <span
              className="font-garamond text-lg font-bold"
              style={{ color: 'var(--color-text-primary)' }}
            >
              bito
            </span>
          </a>

          {/* Centre nav (desktop) */}
          <div className="hidden flex-1 justify-center md:flex">
            <ul className="flex items-center gap-8">
              {[
                { label: 'Features', selector: '#features' },
                { label: 'Compass', selector: '#section-compass' },
                { label: 'Pricing', selector: '#section-pricing' },
              ].map((link) => (
                <li key={link.selector}>
                  <a
                    href={link.selector}
                    onClick={scrollTo(link.selector)}
                    className="font-spartan text-sm font-medium transition-colors hover:text-white"
                    style={{ color: 'var(--color-text-secondary)' }}
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Right side (desktop) */}
          <div className="hidden items-center gap-3 md:flex">
            <a
              href="/login"
              className="font-spartan px-4 py-2 text-sm font-medium transition-colors hover:text-white"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              Sign In
            </a>
            <a
              href="/login"
              className="font-spartan rounded-full text-sm font-medium text-white"
              style={{
                backgroundColor: 'var(--color-brand-500)',
                padding: '8px 20px',
                transition: 'background-color 200ms ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--color-brand-600)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--color-brand-500)'
              }}
            >
              Start for free
            </a>
          </div>

          {/* Mobile toggle */}
          <button
            type="button"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileOpen}
            className="ml-auto rounded-lg p-2 md:hidden"
            style={{ color: 'var(--color-text-primary)' }}
          >
            {mobileOpen ? (
              <Cross2Icon className="h-5 w-5" />
            ) : (
              <HamburgerMenuIcon className="h-5 w-5" />
            )}
          </button>
        </div>

        {/* Mobile drawer */}
        {mobileOpen && (
          <div
            className="border-t py-4 md:hidden"
            style={{ borderColor: 'var(--color-border-primary)' }}
          >
            <div className="flex flex-col gap-4">
              {[
                { label: 'Features', selector: '#features' },
                { label: 'Compass', selector: '#section-compass' },
                { label: 'Pricing', selector: '#section-pricing' },
              ].map((link) => (
                <a
                  key={link.selector}
                  href={link.selector}
                  onClick={scrollTo(link.selector)}
                  className="font-spartan text-left text-sm font-medium"
                  style={{ color: 'var(--color-text-secondary)' }}
                >
                  {link.label}
                </a>
              ))}
              <div
                className="flex flex-col gap-3 border-t pt-4"
                style={{ borderColor: 'var(--color-border-primary)' }}
              >
                <a
                  href="/login"
                  className="font-spartan text-left text-sm font-medium"
                  style={{ color: 'var(--color-text-secondary)' }}
                >
                  Sign In
                </a>
                <a
                  href="/login"
                  className="font-spartan rounded-full px-5 py-2.5 text-center text-sm font-medium text-white"
                  style={{ backgroundColor: 'var(--color-brand-500)' }}
                >
                  Start for free
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
