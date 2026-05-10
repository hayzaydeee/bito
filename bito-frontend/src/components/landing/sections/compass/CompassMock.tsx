import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { EASE_OUT_SPRING, reduceMotion } from '../../../../lib/landing/motion'

/**
 * The animated Compass UI mock (spec section 9 right column).
 *
 * Card data matches production
 * (bito-frontend/src/components/landingPage/CompassSection.jsx CARDS).
 * X offsets widened to +/-200 to match production rotations and span.
 */

const GOAL_TEXT = 'I want to become a morning person'
const TYPE_DELAY_MS = 42
const TYPE_START_MS = 400
const LOADING_START_MS = TYPE_START_MS + GOAL_TEXT.length * TYPE_DELAY_MS + 100
const CARDS_START_MS = LOADING_START_MS + 1600

interface PlanCard {
  phase: string
  subtitle: string
  period: string
  habits: string[]
}

const PLAN_CARDS: PlanCard[] = [
  {
    phase: 'Phase 1',
    subtitle: 'Wake-up Routine',
    period: 'Week 1-2',
    habits: ['Rise before 6:30 AM', '10 min morning stretch'],
  },
  {
    phase: 'Phase 2',
    subtitle: 'Building Momentum',
    period: 'Week 3-4',
    habits: ['Cold shower ritual', 'Journaling 5 min'],
  },
  {
    phase: 'Phase 3',
    subtitle: 'Full Routine',
    period: 'Week 5+',
    habits: ['Meditation 15 min', 'No phone first 30 min'],
  },
]

const CARD_FINAL_STATES: { rotate: number; x: number; y: number }[] = [
  { rotate: 0, x: -210, y: 0 },
  { rotate: 0, x: 0,    y: 0 },
  { rotate: 0, x: 210,  y: 0 },
]

interface CompassMockProps {
  start: boolean
}

export function CompassMock({ start }: CompassMockProps) {
  const [typed, setTyped] = useState('')
  const [showLoading, setShowLoading] = useState(false)
  const [showCards, setShowCards] = useState(false)
  const [typingDone, setTypingDone] = useState(false)

  useEffect(() => {
    if (!start) return
    if (reduceMotion) {
      setTyped(GOAL_TEXT)
      setTypingDone(true)
      setShowLoading(false)
      setShowCards(true)
      return
    }
    const timeouts: number[] = []
    for (let i = 0; i <= GOAL_TEXT.length; i++) {
      timeouts.push(
        window.setTimeout(() => {
          setTyped(GOAL_TEXT.slice(0, i))
          if (i === GOAL_TEXT.length) setTypingDone(true)
        }, TYPE_START_MS + i * TYPE_DELAY_MS),
      )
    }
    timeouts.push(window.setTimeout(() => setShowLoading(true), LOADING_START_MS))
    timeouts.push(
      window.setTimeout(() => {
        setShowLoading(false)
        setShowCards(true)
      }, CARDS_START_MS),
    )
    return () => timeouts.forEach((id) => clearTimeout(id))
  }, [start])

  return (
    <div className="flex flex-col items-center">
      {/* Input field */}
      <div
        className="liquid-glass w-full"
        style={{
          borderRadius: '14px',
          padding: '14px 18px',
          border: typingDone
            ? '1px solid var(--color-brand-500)'
            : '1px solid var(--color-border-primary)',
          transition: 'border-color 300ms ease',
          maxWidth: '480px',
          minHeight: '52px',
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <span
          aria-hidden
          className="mr-3 flex h-6 w-6 items-center justify-center"
          style={{ color: 'var(--color-brand-400)' }}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path
              d="M8 1.5L9.85 5.27L14 5.85L11 8.78L11.71 12.92L8 10.96L4.29 12.92L5 8.78L2 5.85L6.15 5.27L8 1.5Z"
              fill="var(--color-brand-400)"
            />
          </svg>
        </span>
        <span
          className="font-spartan text-[15px]"
          style={{ color: 'var(--color-text-primary)' }}
        >
          {typed}
          {!typingDone && (
            <span
              aria-hidden
              style={{
                display: 'inline-block',
                width: '2px',
                height: '18px',
                background: 'var(--color-brand-400)',
                marginLeft: '2px',
                verticalAlign: 'middle',
                animation: 'compass-cursor-blink 0.9s steps(2, start) infinite',
              }}
            />
          )}
        </span>
        <style>{`
          @keyframes compass-cursor-blink { to { visibility: hidden; } }
        `}</style>
      </div>

      <AnimatePresence>
        {showLoading && (
          <motion.div
            key="loading"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.3 }}
            className="font-spartan mt-5 text-[14px]"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            AI analyzing your routines and generating plan
            <PulsingEllipsis />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Card deal area - reserved space so layout doesn't shift.
          Increased min-width on the relative container so cards at +/-200
          have headroom to land without clipping. */}
      <div
        className="relative mt-12 w-full"
        style={{ minHeight: '300px', maxWidth: '600px' }}
      >
        {showCards &&
          PLAN_CARDS.map((card, i) => {
            const target = CARD_FINAL_STATES[i]
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.82, rotate: 0, x: 0, y: 0 }}
                animate={{
                  opacity: 1,
                  scale: 1,
                  rotate: target.rotate,
                  x: target.x,
                  y: target.y,
                }}
                transition={{
                  duration: reduceMotion ? 0 : 0.7,
                  delay: reduceMotion ? 0 : i * 0.12,
                  ease: EASE_OUT_SPRING,
                }}
                className="liquid-glass absolute"
                style={{
                  top: 0,
                  left: '50%',
                  marginLeft: '-100px',
                  width: '200px',
                  minHeight: '240px',
                  padding: '18px 16px',
                  borderRadius: '14px',
                  zIndex: i === 1 ? 2 : 1,
                  boxShadow:
                    i === 1
                      ? '0 20px 50px rgba(0, 0, 0, 0.4)'
                      : '0 12px 30px rgba(0, 0, 0, 0.3)',
                }}
              >
                <span
                  className="font-spartan text-[11px] font-medium uppercase tracking-[0.16em]"
                  style={{ color: 'var(--color-brand-400)' }}
                >
                  {card.phase}
                </span>
                <h4
                  className="font-garamond mt-1 text-[18px] font-semibold"
                  style={{ color: 'var(--color-text-primary)', margin: '4px 0 0 0' }}
                >
                  {card.subtitle}
                </h4>
                <span
                  className="font-spartan text-[11px]"
                  style={{ color: 'var(--color-text-tertiary)' }}
                >
                  {card.period}
                </span>
                <ul className="mt-4 flex flex-col gap-2">
                  {card.habits.map((habit) => (
                    <li
                      key={habit}
                      className="font-spartan flex items-start gap-2 text-[12px]"
                      style={{ color: 'var(--color-text-secondary)' }}
                    >
                      <span
                        aria-hidden
                        className="mt-1.5 flex h-1.5 w-1.5 shrink-0 rounded-full"
                        style={{ background: 'var(--color-brand-500)' }}
                      />
                      {habit}
                    </li>
                  ))}
                </ul>
              </motion.div>
            )
          })}
      </div>
    </div>
  )
}

function PulsingEllipsis() {
  return (
    <span aria-hidden className="ml-0.5 inline-flex">
      <span style={dotStyle(0)}>.</span>
      <span style={dotStyle(0.2)}>.</span>
      <span style={dotStyle(0.4)}>.</span>
      <style>{`
        @keyframes compass-ellipsis-pulse {
          0%, 80%, 100% { opacity: 0.2; }
          40%           { opacity: 1; }
        }
      `}</style>
    </span>
  )
}

function dotStyle(delay: number) {
  return {
    animation: `compass-ellipsis-pulse 0.8s ${delay}s ease-in-out infinite`,
    display: 'inline-block',
    width: '6px',
  } as const
}
