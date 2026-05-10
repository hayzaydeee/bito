import { useEffect, useState } from 'react'
import { reduceMotion } from '../../../../lib/landing/motion'

/**
 * MCP integration diagram (spec section 9 - bottom of left column).
 *
 * Three integration icons connect to a central Bito icon by SVG lines.
 * Each line draws via stroke-dashoffset (120 -> 0) over 600ms with a
 * 200ms stagger between lines. As each line completes, its icon fades
 * from grayscale into colour. Centre icon pulses once at the end.
 *
 * Hidden on mobile per spec section 16.
 */

const ICON_SIZE = 32
const CENTER_SIZE = 44
const DASH_LENGTH = 120
const LINE_DURATION = 600
const LINE_STAGGER = 200

const INTEGRATIONS = ['Google Calendar', 'Apple Health', 'GitHub']

export function McpDiagram({ start }: { start: boolean }) {
  // Per-line draw progress: 0 = not started, 1 = drawn.
  const [linesDrawn, setLinesDrawn] = useState<boolean[]>([false, false, false])
  const [centerPulsed, setCenterPulsed] = useState(false)

  useEffect(() => {
    if (!start) return

    if (reduceMotion) {
      setLinesDrawn([true, true, true])
      setCenterPulsed(true)
      return
    }

    // Lines start drawing 500ms after the card deal completes (per spec).
    // Card deal lasts 700ms + 2*120ms stagger ~= 940ms from CARDS_START_MS.
    // Loose timing: start at +500ms after sequenceStarted goes true (which
    // already implies viewport entry); the card deal's own delay handles
    // ordering since both rely on the same `start` prop.
    const baseDelay = 5300 // After typing + loading + card deal (approx).

    const timeouts: number[] = []
    INTEGRATIONS.forEach((_, i) => {
      timeouts.push(
        window.setTimeout(() => {
          setLinesDrawn((prev) => {
            const next = [...prev]
            next[i] = true
            return next
          })
        }, baseDelay + i * LINE_STAGGER),
      )
    })
    timeouts.push(
      window.setTimeout(
        () => setCenterPulsed(true),
        baseDelay + INTEGRATIONS.length * LINE_STAGGER + LINE_DURATION,
      ),
    )

    return () => timeouts.forEach((id) => clearTimeout(id))
  }, [start])

  return (
    <div className="mt-4">
      <span
        className="font-spartan text-[11px] font-medium uppercase tracking-[0.18em]"
        style={{ color: 'var(--color-text-tertiary)' }}
      >
        Connected sources
      </span>
      <div
        className="mt-4 flex items-center justify-between"
        style={{ height: '64px', maxWidth: '420px' }}
      >
        {/* Three source icons + line + central Bito icon */}
        <div className="flex flex-1 items-center justify-around">
          {INTEGRATIONS.map((label, i) => (
            <SourceIcon
              key={label}
              label={label}
              index={i}
              active={linesDrawn[i] === true}
            />
          ))}
        </div>

        {/* Connection lines as SVG overlay across the strip */}
        <svg
          aria-hidden
          width="100%"
          height="64"
          viewBox="0 0 420 64"
          style={{ position: 'absolute', pointerEvents: 'none', maxWidth: '420px' }}
        >
          {INTEGRATIONS.map((_, i) => {
            const xStart = 56 + i * 96
            const yStart = 32
            const xEnd = 360
            const yEnd = 32
            return (
              <line
                key={i}
                x1={xStart}
                y1={yStart}
                x2={xEnd}
                y2={yEnd}
                stroke="var(--color-brand-500)"
                strokeWidth="1.5"
                strokeDasharray={DASH_LENGTH}
                strokeDashoffset={linesDrawn[i] ? 0 : DASH_LENGTH}
                style={{
                  transition: `stroke-dashoffset ${LINE_DURATION}ms ease-out`,
                }}
              />
            )
          })}
        </svg>

        <div
          className="flex shrink-0 items-center justify-center"
          style={{
            width: `${CENTER_SIZE}px`,
            height: `${CENTER_SIZE}px`,
            borderRadius: '50%',
            background:
              'linear-gradient(135deg, var(--color-brand-500), var(--color-brand-700))',
            boxShadow: centerPulsed ? '0 0 0 0 rgba(79, 70, 229, 0)' : 'none',
            animation: centerPulsed
              ? 'mcp-center-pulse 800ms ease-out 1'
              : 'none',
          }}
        >
          <span className="font-garamond text-[18px] font-medium text-white">b</span>
        </div>
        <style>{`
          @keyframes mcp-center-pulse {
            0%   { box-shadow: 0 0 0 0 rgba(79, 70, 229, 0.5); }
            100% { box-shadow: 0 0 0 18px rgba(79, 70, 229, 0); }
          }
        `}</style>
      </div>
    </div>
  )
}

function SourceIcon({
  label,
  index,
  active,
}: {
  label: string
  index: number
  active: boolean
}) {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <span
        aria-label={label}
        className="flex items-center justify-center"
        style={{
          width: `${ICON_SIZE}px`,
          height: `${ICON_SIZE}px`,
          borderRadius: '8px',
          background: 'var(--color-surface-hover)',
          border: '1px solid var(--color-border-primary)',
          filter: active ? 'grayscale(0)' : 'grayscale(1) opacity(0.5)',
          transition: 'filter 300ms ease-out',
        }}
      >
        <SourceGlyph index={index} />
      </span>
    </div>
  )
}

function SourceGlyph({ index }: { index: number }) {
  const color = 'var(--color-brand-400)'
  if (index === 0) {
    // Calendar
    return (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <rect x="2" y="3" width="12" height="11" rx="1.5" stroke={color} strokeWidth="1.5" />
        <path d="M2 6h12" stroke={color} strokeWidth="1.5" />
        <path d="M5 1.5v3M11 1.5v3" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    )
  }
  if (index === 1) {
    // Heart (Health)
    return (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path
          d="M8 13.5s-5-3-5-7a3 3 0 0 1 5-2 3 3 0 0 1 5 2c0 4-5 7-5 7z"
          stroke={color}
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
      </svg>
    )
  }
  // GitHub octocat-ish glyph
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="6" stroke={color} strokeWidth="1.5" />
      <path d="M5 12c0-1.5 1-3 3-3s3 1.5 3 3" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="6" cy="7" r="0.8" fill={color} />
      <circle cx="10" cy="7" r="0.8" fill={color} />
    </svg>
  )
}
