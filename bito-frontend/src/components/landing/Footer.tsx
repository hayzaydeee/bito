import { TargetIcon, GitHubLogoIcon } from '@radix-ui/react-icons'

/**
 * Footer (spec section 1.6 footer block + section 15).
 *
 * Brand mark uses the same TargetIcon-in-rounded-square as production
 * (bito-frontend/src/pages/LandingPage.jsx line 875).
 */
export function Footer() {
  const scrollTo = (selector: string) => (e: React.MouseEvent) => {
    e.preventDefault()
    const target = document.querySelector<HTMLElement>(selector)
    if (!target) return
    if (window.__lenis) window.__lenis.scrollTo(target, { offset: -64 })
    else target.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <footer
      style={{
        background: 'var(--color-bg-primary)',
        borderTop: '1px solid var(--color-border-primary)',
        padding: '32px 24px',
      }}
    >
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-4 md:flex-row md:justify-between">
        <a
          href="#section-hero"
          onClick={scrollTo('#section-hero')}
          className="flex items-center gap-2.5"
        >
          <span
            aria-hidden
            className="flex h-7 w-7 items-center justify-center rounded-lg"
            style={{ backgroundColor: 'var(--color-brand-600)' }}
          >
            <TargetIcon className="h-4 w-4 text-white" />
          </span>
          <span
            className="font-garamond text-[18px] font-bold"
            style={{ color: 'var(--color-text-primary)' }}
          >
            bito
          </span>
        </a>

        <nav aria-label="Footer" className="flex items-center gap-6">
          <a
            href="#features"
            onClick={scrollTo('#features')}
            className="font-spartan text-[13px] transition-colors hover:text-white"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            Features
          </a>
          <button
            type="button"
            className="font-spartan text-[13px] transition-colors hover:text-white"
            style={{
              color: 'var(--color-text-secondary)',
              background: 'transparent',
              border: 'none',
              padding: 0,
              cursor: 'pointer',
            }}
          >
            Contact
          </button>
          <a
            href="https://github.com/hayzaydee"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="GitHub"
            className="transition-colors hover:text-white"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            <GitHubLogoIcon className="h-4.5 w-4.5" />
          </a>
        </nav>

        <span
          className="font-spartan text-[12px]"
          style={{ color: 'var(--color-text-tertiary)' }}
        >
          © 2025 hayzaydee
        </span>
      </div>
    </footer>
  )
}
