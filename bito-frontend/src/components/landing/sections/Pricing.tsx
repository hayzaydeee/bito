import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { EASE_OUT_EXPO, reduceMotion } from '../../../lib/landing/motion'

/**
 * Section 09 - Pricing (spec section 14).
 *
 * Annual default. Toggle crossfades the price text via AnimatePresence.
 * Premium card visually distinct (brand border, glow, "Most popular" badge
 * with spring-bounce entry).
 */

interface Plan {
  name: 'Free' | 'Premium' | 'Team'
  blurb: string
  annualPrice: string
  monthlyPrice: string
  annualNote?: string
  monthlyNote?: string
  cta: string
  features: string[]
  popular?: boolean
}

const PLANS: Plan[] = [
  {
    name: 'Free',
    blurb: 'Everything you need to start.',
    annualPrice: '$0',
    monthlyPrice: '$0',
    annualNote: 'forever',
    monthlyNote: 'forever',
    cta: 'Start free',
    features: [
      'Unlimited habits',
      '1 workspace',
      'Basic analytics',
      '30-day history',
      'Mobile + web access',
    ],
  },
  {
    name: 'Premium',
    blurb: 'Bito at full strength.',
    annualPrice: '$8',
    monthlyPrice: '$10',
    annualNote: 'billed $96/yr',
    monthlyNote: 'per month',
    cta: 'Try Premium',
    features: [
      'Everything in Free',
      'Unlimited workspaces',
      'Full AI insights',
      'Compass',
      'Rich journaling with AI',
      'Unlimited history',
      'Priority support',
    ],
    popular: true,
  },
  {
    name: 'Team',
    blurb: 'For groups going further together.',
    annualPrice: '$16',
    monthlyPrice: '$18',
    annualNote: 'per seat, billed annually',
    monthlyNote: 'per seat, per month',
    cta: 'Talk to sales',
    features: [
      'Everything in Premium',
      'Team analytics',
      'Admin controls',
      'Bulk onboarding',
      'SSO (planned)',
      'Custom integrations',
    ],
  },
]

export function Pricing() {
  const [annual, setAnnual] = useState(true)

  return (
    <section
      id="section-pricing"
      style={{ background: 'var(--color-bg-primary)', padding: '120px 24px' }}
    >
      <div className="mx-auto max-w-300">
        <div className="mx-auto max-w-170 text-center">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: reduceMotion ? 0 : 0.6, ease: EASE_OUT_EXPO }}
            className="font-garamond"
            style={{
              fontSize: 'clamp(2rem, 5vw, 3.5rem)',
              lineHeight: 1.05,
              letterSpacing: '-1.6px',
              color: 'var(--color-text-primary)',
              margin: 0,
            }}
          >
            Simple, honest pricing.
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: reduceMotion ? 0 : 0.6, delay: reduceMotion ? 0 : 0.1, ease: EASE_OUT_EXPO }}
            className="font-spartan mx-auto mt-6 text-base md:text-lg"
            style={{ color: 'var(--color-text-secondary)', maxWidth: '520px' }}
          >
            Start free. Upgrade when Bito's earned it.
          </motion.p>
        </div>

        {/* Billing toggle */}
        <div className="mt-10 flex items-center justify-center gap-3">
          <BillingToggle annual={annual} onChange={setAnnual} />
        </div>

        {/* Plan cards */}
        <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
          {PLANS.map((plan, i) => (
            <PlanCard key={plan.name} plan={plan} annual={annual} index={i} />
          ))}
        </div>

        <p className="font-spartan mt-8 text-center text-[12px]" style={{ color: 'var(--color-text-tertiary)' }}>
          Team requires a minimum of 2 seats.
        </p>
      </div>
    </section>
  )
}

function BillingToggle({ annual, onChange }: { annual: boolean; onChange: (v: boolean) => void }) {
  return (
    <div
      className="liquid-glass flex items-center"
      style={{ borderRadius: '100px', padding: '4px' }}
      role="radiogroup"
      aria-label="Billing period"
    >
      <ToggleOption active={annual} onClick={() => onChange(true)}>
        Annual
        <span
          className="font-spartan ml-2 text-[10px] font-medium"
          style={{
            color: 'var(--color-success)',
            background: 'rgba(34, 197, 94, 0.16)',
            borderRadius: '100px',
            padding: '2px 6px',
          }}
        >
          Save 20%
        </span>
      </ToggleOption>
      <ToggleOption active={!annual} onClick={() => onChange(false)}>
        Monthly
      </ToggleOption>
    </div>
  )
}

function ToggleOption({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={active}
      onClick={onClick}
      className="font-spartan text-[13px] font-medium"
      style={{
        padding: '8px 18px',
        borderRadius: '100px',
        background: active ? 'var(--color-brand-500)' : 'transparent',
        color: active ? 'white' : 'var(--color-text-secondary)',
        transition: 'background-color 200ms ease, color 200ms ease',
        border: 'none',
        cursor: 'pointer',
      }}
    >
      {children}
    </button>
  )
}

function PlanCard({ plan, annual, index }: { plan: Plan; annual: boolean; index: number }) {
  const price = annual ? plan.annualPrice : plan.monthlyPrice
  const note = annual ? plan.annualNote : plan.monthlyNote
  const isPaid = plan.name !== 'Free'

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{
        duration: reduceMotion ? 0 : 0.55,
        delay: reduceMotion ? 0 : index * 0.1,
        ease: EASE_OUT_EXPO,
      }}
      className="relative flex flex-col"
      style={{
        background: 'var(--color-surface-secondary)',
        border: plan.popular
          ? '1px solid var(--color-brand-500)'
          : '1px solid var(--color-border-primary)',
        borderRadius: '16px',
        padding: '32px 28px',
        boxShadow: plan.popular
          ? '0 0 0 1px rgba(79, 70, 229, 0.3), 0 20px 40px rgba(79, 70, 229, 0.15)'
          : 'none',
      }}
    >
      {plan.popular && (
        <motion.span
          initial={{ scale: 0.8, opacity: 0 }}
          whileInView={{ scale: 1, opacity: 1 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ type: 'spring', stiffness: 380, damping: 12, delay: 0.1 }}
          className="font-spartan absolute text-[11px] font-medium text-white"
          style={{
            top: '-12px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'var(--color-brand-500)',
            borderRadius: '100px',
            padding: '4px 12px',
          }}
        >
          Most popular
        </motion.span>
      )}

      <h3
        className="font-garamond text-[24px]"
        style={{ color: 'var(--color-text-primary)', margin: 0 }}
      >
        {plan.name}
      </h3>
      <p className="font-spartan mt-1 text-[13px]" style={{ color: 'var(--color-text-tertiary)' }}>
        {plan.blurb}
      </p>

      <div className="mt-6 flex items-baseline gap-1">
        <AnimatePresence mode="wait">
          <motion.span
            key={annual ? 'annual' : 'monthly'}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.2 }}
            className="font-garamond text-[44px]"
            style={{ color: 'var(--color-text-primary)', lineHeight: 1 }}
          >
            {price}
          </motion.span>
        </AnimatePresence>
        {isPaid && (
          <span className="font-spartan text-[14px]" style={{ color: 'var(--color-text-tertiary)' }}>
            /month
          </span>
        )}
      </div>
      {note && (
        <p className="font-spartan mt-2 text-[12px]" style={{ color: 'var(--color-text-tertiary)' }}>
          {note}
        </p>
      )}

      <button
        type="button"
        className="font-spartan mt-6 text-[14px] font-medium"
        style={{
          background: plan.popular ? 'var(--color-brand-500)' : 'transparent',
          color: plan.popular ? 'white' : 'var(--color-text-primary)',
          border: plan.popular ? '1px solid var(--color-brand-500)' : '1px solid var(--color-border-primary)',
          borderRadius: '100px',
          padding: '10px 24px',
          cursor: 'pointer',
          transition: 'background-color 200ms ease, border-color 200ms ease',
        }}
      >
        {plan.cta}
      </button>

      <ul className="mt-8 flex flex-col gap-3">
        {plan.features.map((feature) => (
          <li
            key={feature}
            className="font-spartan flex items-start gap-2.5 text-[13px]"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            <span aria-hidden className="mt-0.5 shrink-0">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M3 7.5L5.5 10L11 4.5" stroke="var(--color-success)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
            {feature}
          </li>
        ))}
      </ul>
    </motion.div>
  )
}
