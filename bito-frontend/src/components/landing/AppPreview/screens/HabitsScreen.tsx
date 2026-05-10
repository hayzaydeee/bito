import { motion } from 'framer-motion'
import { reduceMotion } from '../../../../lib/landing/motion'

/**
 * HabitsScreen — shown for Beat 1 "Track" in the features section.
 *
 * compact=true → renders the 2-col HeroDashboardCard layout (streak
 *   calendar + ring left, habit rows + mini chart right). Used in hero.
 * compact=false → full-height app view with a top bar, 5 habit rows,
 *   and the heatmap + ring below. Used in features section.
 */

const STREAK_DATA = [
  1.0, 0.8, 1.0, 0.6, 1.0, 0.0, 0.9,
  1.0, 1.0, 0.7, 1.0, 0.0, 0.8, 1.0,
  0.5, 1.0, 1.0, 0.9, 1.0, 0.7, 0.0,
  1.0, 0.8, 1.0, 1.0, 0.0, 1.0, 0.9,
  0.3, 0.0, 0.5, 1.0, 1.0, 1.0, 1.0,
]

const RING_R = 15
const RING_C = 2 * Math.PI * RING_R
const RING_OFFSET = RING_C * (1 - 0.78)

interface HabitRow {
  name: string
  category: string
  categoryColor: string
  checked: boolean
  streak?: number
}

const HABITS: HabitRow[] = [
  { name: 'Morning meditation', category: 'Mindfulness', categoryColor: '#8B5CF6', checked: true,  streak: 12 },
  { name: 'Read 20 pages',      category: 'Learning',    categoryColor: '#0EA5E9', checked: true },
  { name: 'Exercise',           category: 'Health',      categoryColor: '#22C55E', checked: false },
  { name: 'Evening walk',       category: 'Health',      categoryColor: '#22C55E', checked: false },
  { name: 'Journal',            category: 'Mindfulness', categoryColor: '#8B5CF6', checked: false },
]

interface HabitsScreenProps {
  compact?: boolean
}

export function HabitsScreen({ compact = false }: HabitsScreenProps) {
  if (compact) return <CompactLayout />
  return <FullLayout />
}

/* ── Compact (hero) layout — mirrors original HeroDashboardCard ───── */
function CompactLayout() {
  return (
    <div
      style={{
        padding: 20,
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 24,
        height: '100%',
      }}
    >
      {/* Left — streak calendar + ring */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div>
          <p
            className="font-spartan"
            style={{ fontSize: 11, color: 'var(--color-text-tertiary)', marginBottom: 10, letterSpacing: '0.08em', textTransform: 'uppercase' }}
          >
            Streak calendar
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 14px)', gap: 3 }}>
            {STREAK_DATA.map((v, i) => (
              <div
                key={i}
                style={{
                  width: 14, height: 14, borderRadius: 3,
                  backgroundColor: v > 0 ? `rgba(99, 102, 241, ${v})` : 'var(--color-surface-secondary)',
                }}
              />
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <svg viewBox="0 0 36 36" width={64} height={64} style={{ transform: 'rotate(-90deg)' }}>
            <circle cx="18" cy="18" r={RING_R} fill="none" stroke="var(--color-surface-secondary)" strokeWidth="3" />
            <circle cx="18" cy="18" r={RING_R} fill="none" stroke="var(--color-brand-500)" strokeWidth="3"
              strokeLinecap="round" strokeDasharray={RING_C} strokeDashoffset={RING_OFFSET} />
          </svg>
          <div>
            <p className="font-garamond" style={{ fontSize: 22, color: 'var(--color-text-primary)', lineHeight: 1, margin: 0 }}>78%</p>
            <p className="font-spartan" style={{ fontSize: 11, color: 'var(--color-text-tertiary)', marginTop: 2 }}>Weekly goal</p>
          </div>
        </div>
      </div>

      {/* Right — habit rows + chart */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {HABITS.slice(0, 3).map((h) => (
            <CompactHabitRow key={h.name} habit={h} />
          ))}
        </div>
        <MiniChart />
      </div>
    </div>
  )
}

function CompactHabitRow({ habit }: { habit: HabitRow }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 8,
      background: habit.streak ? 'rgba(99, 102, 241, 0.06)' : 'transparent',
    }}>
      {habit.checked ? (
        <span style={{ width: 18, height: 18, borderRadius: '50%', background: 'var(--color-brand-500)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
            <path d="M1 4l2.5 2.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      ) : (
        <span style={{ width: 18, height: 18, borderRadius: '50%', border: '1.5px solid var(--color-border-primary)', flexShrink: 0 }} />
      )}
      <span className="font-spartan" style={{ fontSize: 13, color: habit.checked ? 'var(--color-text-primary)' : 'var(--color-text-secondary)', flex: 1 }}>
        {habit.name}
      </span>
      {habit.streak && (
        <span className="font-spartan" style={{ fontSize: 10, color: 'var(--color-brand-400)', background: 'rgba(99, 102, 241, 0.15)', borderRadius: 100, padding: '2px 7px', flexShrink: 0 }}>
          🔥 {habit.streak} days
        </span>
      )}
    </div>
  )
}

function MiniChart() {
  return (
    <div>
      <p className="font-spartan" style={{ fontSize: 11, color: 'var(--color-text-tertiary)', marginBottom: 8, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
        7-day completion
      </p>
      <svg viewBox="0 0 140 48" width="100%" height="48" style={{ overflow: 'visible' }}>
        <defs>
          <linearGradient id="hcChartGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgb(99, 102, 241)" stopOpacity="0.18" />
            <stop offset="100%" stopColor="rgb(99, 102, 241)" stopOpacity="0" />
          </linearGradient>
        </defs>
        <polygon points="5,38 25,28 45,32 65,16 85,22 105,10 120,13 135,7 135,48 5,48" fill="url(#hcChartGrad)" />
        <polyline points="5,38 25,28 45,32 65,16 85,22 105,10 120,13 135,7" fill="none" stroke="var(--color-brand-500)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  )
}

/* ── Full (features section) layout ─────────────────────────────────── */
function FullLayout() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Top bar */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '12px 16px', borderBottom: '1px solid var(--color-border-primary)', flexShrink: 0,
      }}>
        <div>
          <p className="font-spartan" style={{ fontSize: 11, color: 'var(--color-text-tertiary)', margin: 0, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Today</p>
          <p className="font-garamond" style={{ fontSize: 18, color: 'var(--color-text-primary)', margin: 0, lineHeight: 1.1 }}>My Habits</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className="font-spartan" style={{ fontSize: 12, color: 'var(--color-text-tertiary)' }}>2 of 5 complete</span>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: 'var(--color-brand-500)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M6 2v8M2 6h8" stroke="white" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
        </div>
      </div>

      {/* Scrollable habit list */}
      <div style={{ flex: 1, overflow: 'hidden', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 6 }}>
        {HABITS.map((habit, i) => (
          <motion.div
            key={habit.name}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: reduceMotion ? 0 : 0.38, delay: reduceMotion ? 0 : i * 0.07 }}
            style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 10,
              background: 'var(--color-surface-secondary)',
              border: '1px solid var(--color-border-primary)',
            }}
          >
            {/* Category color dot */}
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: habit.categoryColor, flexShrink: 0 }} />
            {/* Check button */}
            <div style={{
              width: 20, height: 20, borderRadius: 6, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: habit.checked ? 'var(--color-success)' : 'transparent',
              border: habit.checked ? '1.5px solid var(--color-success)' : '1.5px solid var(--color-text-tertiary)',
            }}>
              {habit.checked && (
                <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                  <path d="M2.5 6.5l2.4 2.4L9.5 3.5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </div>
            <span className="font-spartan" style={{ fontSize: 13, color: habit.checked ? 'var(--color-text-primary)' : 'var(--color-text-secondary)', flex: 1 }}>
              {habit.name}
            </span>
            <span className="font-spartan" style={{ fontSize: 11, color: 'var(--color-text-tertiary)' }}>Daily</span>
            {habit.streak && (
              <motion.span
                initial={{ opacity: 0, scale: 0.7 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: reduceMotion ? 0 : 0.3, delay: reduceMotion ? 0 : HABITS.length * 0.07 + 0.2 }}
                className="font-spartan"
                style={{ fontSize: 11, color: 'var(--color-brand-400)', background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.28)', borderRadius: 100, padding: '2px 8px', flexShrink: 0 }}
              >
                🔥 {habit.streak}d
              </motion.span>
            )}
          </motion.div>
        ))}
      </div>

      {/* Bottom: ring + heatmap strip */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 20, padding: '10px 16px',
        borderTop: '1px solid var(--color-border-primary)', flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <svg viewBox="0 0 36 36" width={48} height={48} style={{ transform: 'rotate(-90deg)' }}>
            <circle cx="18" cy="18" r={RING_R} fill="none" stroke="var(--color-surface-hover)" strokeWidth="3" />
            <circle cx="18" cy="18" r={RING_R} fill="none" stroke="var(--color-brand-500)" strokeWidth="3"
              strokeLinecap="round" strokeDasharray={RING_C} strokeDashoffset={RING_OFFSET}
              style={{ transition: reduceMotion ? 'none' : 'stroke-dashoffset 600ms ease-out' }}
            />
          </svg>
          <div>
            <p className="font-garamond" style={{ fontSize: 18, color: 'var(--color-text-primary)', margin: 0, lineHeight: 1 }}>78%</p>
            <p className="font-spartan" style={{ fontSize: 10, color: 'var(--color-text-tertiary)', marginTop: 2 }}>Weekly goal</p>
          </div>
        </div>

        <div style={{ flex: 1 }}>
          <p className="font-spartan" style={{ fontSize: 10, color: 'var(--color-text-tertiary)', marginBottom: 5, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Last 5 weeks</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2 }}>
            {STREAK_DATA.map((v, i) => (
              <div key={i} style={{ height: 10, borderRadius: 2, backgroundColor: v > 0 ? `rgba(99,102,241,${v})` : 'var(--color-surface-hover)' }} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
