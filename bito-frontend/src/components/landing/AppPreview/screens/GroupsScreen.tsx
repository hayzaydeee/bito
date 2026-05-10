import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { EASE_OUT_SPRING, reduceMotion } from '../../../../lib/landing/motion'

/**
 * GroupsScreen — shown for Beat 3 "Together" in the features section.
 *
 * - Group header with member avatar row
 * - Member progress bars (% weekly goal)
 * - Live activity feed: new item every 2.5s
 * - Notification toast: fires 4s after mount, auto-dismisses after 3s
 */

interface Member {
  initials: string
  name: string
  streak: number
  progress: number  // 0–100
  isYou?: boolean
}

const MEMBERS: Member[] = [
  { initials: 'AX', name: 'Alex',   streak: 14, progress: 92 },
  { initials: 'JM', name: 'Jamie',  streak: 9,  progress: 71 },
  { initials: 'SM', name: 'Sam',    streak: 21, progress: 58 },
  { initials: 'DV', name: 'Divine', streak: 12, progress: 85, isYou: true },
]

const AVATAR_COLORS = ['#6366F1', '#8B5CF6', '#EC4899', '#0EA5E9']

interface ActivityItem {
  id: number
  text: string
  icon: string
  color: string
}

const FEED_CYCLE = [
  { text: 'Alex completed Morning Run',       icon: '🏃', color: 'rgba(99,102,241,0.14)' },
  { text: 'Jamie completed Read 20 pages',    icon: '📖', color: 'rgba(14,165,233,0.14)' },
  { text: 'Sam hit a 21-day streak!',         icon: '🔥', color: 'rgba(245,158,11,0.14)' },
  { text: 'Divine completed Morning Meditation', icon: '🧘', color: 'rgba(139,92,246,0.14)' },
]

const INITIAL_FEED: ActivityItem[] = [
  { id: -2, text: 'Sam completed Evening Walk', icon: '🚶', color: 'rgba(34,197,94,0.14)' },
  { id: -1, text: 'Alex hit a 14-day streak!',  icon: '🔥', color: 'rgba(245,158,11,0.14)' },
]

export function GroupsScreen() {
  const [feed, setFeed] = useState<ActivityItem[]>(INITIAL_FEED)
  const [showToast, setShowToast] = useState(false)
  const cycleRef = useRef(0)
  const idRef = useRef(0)
  const toastFiredRef = useRef(false)

  useEffect(() => {
    if (reduceMotion) return

    const feedInterval = window.setInterval(() => {
      const item = FEED_CYCLE[cycleRef.current % FEED_CYCLE.length]
      cycleRef.current += 1
      idRef.current += 1
      const id = idRef.current
      setFeed((prev) => [{ id, ...item }, ...prev].slice(0, 5))
    }, 2500)

    return () => clearInterval(feedInterval)
  }, [])

  useEffect(() => {
    if (toastFiredRef.current || reduceMotion) return
    toastFiredRef.current = true

    const showTimer = window.setTimeout(() => {
      setShowToast(true)
      window.setTimeout(() => setShowToast(false), 3000)
    }, 4000)

    return () => clearTimeout(showTimer)
  }, [])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', position: 'relative' }}>
      {/* Top bar */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '12px 16px', borderBottom: '1px solid var(--color-border-primary)', flexShrink: 0,
      }}>
        <div>
          <p className="font-spartan" style={{ fontSize: 11, color: 'var(--color-text-tertiary)', margin: 0, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Group</p>
          <p className="font-garamond" style={{ fontSize: 18, color: 'var(--color-text-primary)', margin: 0, lineHeight: 1.1 }}>Morning Warriors</p>
        </div>
        {/* Member avatar stack */}
        <div style={{ display: 'flex', alignItems: 'center' }}>
          {MEMBERS.map((m, i) => (
            <div
              key={m.initials}
              title={m.name}
              style={{
                width: 26, height: 26, borderRadius: '50%', flexShrink: 0,
                background: AVATAR_COLORS[i], display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: '2px solid var(--color-bg-primary)',
                marginLeft: i === 0 ? 0 : -8,
                zIndex: MEMBERS.length - i,
              }}
            >
              <span className="font-spartan" style={{ fontSize: 9, fontWeight: 700, color: 'white' }}>{m.initials}</span>
            </div>
          ))}
          <span className="font-spartan" style={{ fontSize: 12, color: 'var(--color-text-tertiary)', marginLeft: 8 }}>4 members</span>
        </div>
      </div>

      <div style={{ flex: 1, overflow: 'hidden', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        {/* Member progress */}
        <div>
          <p className="font-spartan" style={{ fontSize: 11, color: 'var(--color-text-tertiary)', marginBottom: 8, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Weekly progress</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {MEMBERS.map((m, i) => (
              <motion.div
                key={m.initials}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: reduceMotion ? 0 : 0.38, delay: reduceMotion ? 0 : i * 0.08 }}
                style={{ display: 'flex', alignItems: 'center', gap: 10 }}
              >
                <div style={{
                  width: 24, height: 24, borderRadius: '50%', flexShrink: 0,
                  background: AVATAR_COLORS[i], display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <span className="font-spartan" style={{ fontSize: 8, fontWeight: 700, color: 'white' }}>{m.initials}</span>
                </div>
                <span className="font-spartan" style={{ fontSize: 12, color: m.isYou ? 'var(--color-text-primary)' : 'var(--color-text-secondary)', width: 48, flexShrink: 0 }}>
                  {m.name}{m.isYou ? ' (you)' : ''}
                </span>
                {/* Progress bar */}
                <div style={{ flex: 1, height: 6, borderRadius: 3, background: 'var(--color-surface-hover)', overflow: 'hidden' }}>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${m.progress}%` }}
                    transition={{ duration: reduceMotion ? 0 : 0.65, delay: reduceMotion ? 0 : i * 0.08 + 0.2, ease: [0.16, 1, 0.3, 1] }}
                    style={{ height: '100%', borderRadius: 3, background: m.isYou ? 'var(--color-brand-500)' : AVATAR_COLORS[i] }}
                  />
                </div>
                <span className="font-spartan" style={{ fontSize: 11, color: 'var(--color-text-tertiary)', width: 32, textAlign: 'right', flexShrink: 0 }}>{m.progress}%</span>
                <span className="font-spartan" style={{ fontSize: 10, color: 'var(--color-brand-400)', background: 'rgba(99,102,241,0.12)', borderRadius: 100, padding: '1px 6px', flexShrink: 0 }}>🔥 {m.streak}d</span>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Activity feed */}
        <div style={{ flex: 1, overflow: 'hidden' }}>
          <p className="font-spartan" style={{ fontSize: 11, color: 'var(--color-text-tertiary)', marginBottom: 8, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Live activity</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5, overflow: 'hidden' }}>
            <AnimatePresence initial={false}>
              {feed.map((item) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: -12, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: reduceMotion ? 0 : 0.35, ease: [0.16, 1, 0.3, 1] }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 9, padding: '7px 10px', borderRadius: 8,
                    background: item.color, border: '1px solid var(--color-border-primary)',
                    overflow: 'hidden',
                  }}
                >
                  <span style={{ fontSize: 13, flexShrink: 0 }}>{item.icon}</span>
                  <span className="font-spartan" style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>{item.text}</span>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Notification toast */}
      <AnimatePresence>
        {showToast && (
          <motion.div
            key="toast"
            initial={{ x: '120%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '120%', opacity: 0 }}
            transition={{ duration: 0.4, ease: EASE_OUT_SPRING }}
            className="liquid-glass"
            style={{
              position: 'absolute', top: 56, right: 12, borderRadius: 12,
              padding: '12px 14px', maxWidth: 220, zIndex: 10,
              boxShadow: '0 12px 32px rgba(0,0,0,0.4)',
            }}
            role="status"
            aria-live="polite"
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
              <span style={{ fontSize: 16, flexShrink: 0 }}>⭐</span>
              <div>
                <p className="font-spartan" style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-primary)', margin: 0 }}>Jamie hit a 7-day streak!</p>
                <p className="font-spartan" style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginTop: 2 }}>Tap to send encouragement</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
