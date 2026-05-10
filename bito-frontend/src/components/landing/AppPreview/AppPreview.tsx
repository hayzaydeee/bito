import { motion, AnimatePresence } from 'framer-motion'
import { EASE_OUT_EXPO, reduceMotion } from '../../../lib/landing/motion'
import { AppSidebar } from './AppSidebar'
import { HabitsScreen } from './screens/HabitsScreen'
import { AnalyticsScreen } from './screens/AnalyticsScreen'
import { GroupsScreen } from './screens/GroupsScreen'

export type Screen = 'habits' | 'analytics' | 'groups'

interface AppPreviewProps {
  /** Compact mode: no sidebar, HeroDashboardCard-style 2-col layout */
  compact?: boolean
  activeScreen: Screen
  className?: string
  style?: React.CSSProperties
}

const SIDEBAR_W = 148 // px — sidebar width in expanded mode

export function AppPreview({ compact = false, activeScreen, className, style }: AppPreviewProps) {
  return (
    <div
      className={className}
      style={{
        width: compact ? 'min(860px, 90vw)' : '100%',
        borderRadius: 16,
        overflow: 'hidden',
        boxShadow: '0 40px 80px rgba(0, 0, 0, 0.55), 0 0 0 1px var(--color-border-primary)',
        background: 'var(--color-surface-primary)',
        display: 'flex',
        flexDirection: 'row',
        height: compact ? undefined : 'clamp(380px, 48vh, 520px)',
        ...style,
      }}
    >
      {/* Sidebar — hidden in compact, slides in when expanded */}
      <div
        style={{
          width: compact ? 0 : SIDEBAR_W,
          minWidth: compact ? 0 : SIDEBAR_W,
          overflow: 'hidden',
          transition: reduceMotion ? 'none' : `width 0.65s var(--ease-out-expo), min-width 0.65s var(--ease-out-expo)`,
          flexShrink: 0,
        }}
      >
        {!compact && <AppSidebar activeScreen={activeScreen} />}
      </div>

      {/* Main content area */}
      <div
        style={{
          flex: 1,
          overflow: 'hidden',
          position: 'relative',
          background: 'var(--color-bg-primary)',
        }}
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={activeScreen}
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 }}
            transition={{ duration: reduceMotion ? 0 : 0.35, ease: EASE_OUT_EXPO }}
            style={{ height: '100%', overflow: 'hidden' }}
          >
            {activeScreen === 'habits' && <HabitsScreen compact={compact} />}
            {activeScreen === 'analytics' && <AnalyticsScreen />}
            {activeScreen === 'groups' && <GroupsScreen />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}
