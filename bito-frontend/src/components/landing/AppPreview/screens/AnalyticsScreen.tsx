import { motion } from 'framer-motion'
import { reduceMotion } from '../../../../lib/landing/motion'

/**
 * AnalyticsScreen — shown for Beat 2 "Understand" in the features section.
 *
 * - Period tabs: 7d | 30d | 90d (30d active)
 * - Smooth SVG path trend curve with gradient fill
 * - 5w × 7d heatmap
 * - AI insight card
 * - "+18% vs last week" stat
 */

const HEATMAP_DATA = Array.from({ length: 35 }, (_, i) => {
  const intensity = ((i * 11 + 5) % 13) / 12
  if (intensity < 0.2) return 0
  if (intensity < 0.5) return 1
  if (intensity < 0.8) return 2
  return 3
})

const cellColor = (level: number) => {
  switch (level) {
    case 0: return 'var(--color-surface-hover)'
    case 1: return 'rgba(99, 102, 241, 0.28)'
    case 2: return 'rgba(79, 70, 229, 0.58)'
    default: return 'var(--color-brand-500)'
  }
}

// 30-day completion trend — points for smooth SVG path (viewBox 0 0 280 80)
const TREND_POINTS = [
  [0,68],[10,62],[20,58],[30,64],[40,52],[50,48],[60,55],
  [70,44],[80,38],[90,42],[100,34],[110,28],[120,36],
  [130,30],[140,22],[150,26],[160,18],[170,14],[180,20],
  [190,16],[200,10],[210,14],[220,8],[230,12],[240,6],[250,10],[260,4],[270,8],[280,2],
]

function buildPath(pts: number[][]): string {
  if (pts.length === 0) return ''
  let d = `M${pts[0][0]},${pts[0][1]}`
  for (let i = 1; i < pts.length; i++) {
    const [px, py] = pts[i - 1]
    const [cx, cy] = pts[i]
    const cpx = (px + cx) / 2
    d += ` C${cpx},${py} ${cpx},${cy} ${cx},${cy}`
  }
  return d
}

const trendPath = buildPath(TREND_POINTS)
const areaPath = trendPath + ` L280,80 L0,80 Z`

export function AnalyticsScreen() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Top bar */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '12px 16px', borderBottom: '1px solid var(--color-border-primary)', flexShrink: 0,
      }}>
        <p className="font-garamond" style={{ fontSize: 18, color: 'var(--color-text-primary)', margin: 0, lineHeight: 1.1 }}>Analytics</p>

        {/* Period tabs */}
        <div style={{ display: 'flex', gap: 2, background: 'var(--color-surface-secondary)', borderRadius: 8, padding: 3 }}>
          {(['7d', '30d', '90d'] as const).map((p) => (
            <span
              key={p}
              className="font-spartan"
              style={{
                fontSize: 11, padding: '3px 10px', borderRadius: 6, cursor: 'default',
                background: p === '30d' ? 'var(--color-surface-hover)' : 'transparent',
                color: p === '30d' ? 'var(--color-text-primary)' : 'var(--color-text-tertiary)',
                fontWeight: p === '30d' ? 600 : 400,
                transition: 'background 150ms',
              }}
            >
              {p}
            </span>
          ))}
        </div>
      </div>

      <div style={{ flex: 1, overflow: 'hidden', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        {/* Trend chart */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <span className="font-spartan" style={{ fontSize: 11, color: 'var(--color-text-tertiary)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Completion rate — 30 days</span>
            <span className="font-spartan" style={{ fontSize: 12, color: 'var(--color-success)', fontWeight: 600 }}>↑ +18% vs last week</span>
          </div>
          <svg viewBox="0 0 280 80" width="100%" height="72" style={{ overflow: 'visible', display: 'block' }}>
            <defs>
              <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="rgb(99,102,241)" stopOpacity="0.22" />
                <stop offset="100%" stopColor="rgb(99,102,241)" stopOpacity="0" />
              </linearGradient>
            </defs>
            <motion.path
              d={areaPath}
              fill="url(#trendFill)"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: reduceMotion ? 0 : 0.5, delay: reduceMotion ? 0 : 0.1 }}
            />
            <motion.path
              d={trendPath}
              fill="none"
              stroke="var(--color-brand-400)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: reduceMotion ? 0 : 1.0, ease: 'easeOut' }}
            />
          </svg>
        </div>

        {/* AI Insight card */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reduceMotion ? 0 : 0.45, delay: reduceMotion ? 0 : 0.35 }}
          style={{
            borderRadius: 10, padding: '10px 14px', flexShrink: 0,
            background: 'rgba(99, 102, 241, 0.08)',
            border: '1px solid rgba(99, 102, 241, 0.22)',
            display: 'flex', alignItems: 'flex-start', gap: 10,
          }}
        >
          <div style={{ width: 28, height: 28, borderRadius: 7, background: 'rgba(99,102,241,0.18)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="14" height="14" viewBox="0 0 15 15" fill="none">
              <path d="M8.695.139a.5.5 0 01.223.59L7.3 5H12a.5.5 0 01.39.813l-7 9a.5.5 0 01-.835-.59L6.7 10H2a.5.5 0 01-.39-.813l7-9a.5.5 0 01.612-.048z" fill="var(--color-brand-400)" fillRule="evenodd" clipRule="evenodd"/>
            </svg>
          </div>
          <div>
            <p className="font-spartan" style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-primary)', margin: 0 }}>AI Insight</p>
            <p className="font-spartan" style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 2 }}>
              Your best day is <strong style={{ color: 'var(--color-brand-400)' }}>Wednesday</strong> with a 94% avg completion. Mornings are your power window.
            </p>
          </div>
        </motion.div>

        {/* Heatmap */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 7 }}>
            <span className="font-spartan" style={{ fontSize: 11, color: 'var(--color-text-tertiary)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Habit heatmap — last 5 weeks</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              {[0, 1, 2, 3].map((l) => (
                <div key={l} style={{ width: 10, height: 10, borderRadius: 2, background: cellColor(l) }} />
              ))}
              <span className="font-spartan" style={{ fontSize: 10, color: 'var(--color-text-tertiary)', marginLeft: 2 }}>Less → More</span>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 3 }}>
            {HEATMAP_DATA.map((level, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: reduceMotion ? 0 : 0.25, delay: reduceMotion ? 0 : i * 0.008 }}
                style={{ height: 16, borderRadius: 3, background: cellColor(level) }}
              />
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 3, marginTop: 4 }}>
            {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
              <span key={i} className="font-spartan" style={{ fontSize: 9, color: 'var(--color-text-tertiary)', textAlign: 'center' }}>{d}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
