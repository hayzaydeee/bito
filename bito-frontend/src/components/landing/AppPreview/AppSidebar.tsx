import type { Screen } from './AppPreview'

interface NavItem {
  id: string
  label: string
  screen?: Screen
  icon: React.FC<{ style?: React.CSSProperties; width?: number; height?: number }>
}

// Inline SVG icons matching @radix-ui/react-icons exactly (no extra dep needed in landing)
function DashboardIcon(props: { style?: React.CSSProperties; width?: number; height?: number }) {
  return (
    <svg width={props.width ?? 16} height={props.height ?? 16} viewBox="0 0 15 15" fill="none" style={props.style}>
      <path d="M0 1.5A1.5 1.5 0 011.5 0h4A1.5 1.5 0 017 1.5v4A1.5 1.5 0 015.5 7h-4A1.5 1.5 0 010 5.5v-4zm8 0A1.5 1.5 0 019.5 0h4A1.5 1.5 0 0115 1.5v4A1.5 1.5 0 0113.5 7h-4A1.5 1.5 0 018 5.5v-4zm-8 8A1.5 1.5 0 011.5 8h4A1.5 1.5 0 017 9.5v4A1.5 1.5 0 015.5 15h-4A1.5 1.5 0 010 13.5v-4zm8 0A1.5 1.5 0 019.5 8h4A1.5 1.5 0 0115 9.5v4A1.5 1.5 0 0113.5 15h-4A1.5 1.5 0 018 13.5v-4z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"/>
    </svg>
  )
}

function TargetIcon(props: { style?: React.CSSProperties; width?: number; height?: number }) {
  return (
    <svg width={props.width ?? 16} height={props.height ?? 16} viewBox="0 0 15 15" fill="none" style={props.style}>
      <path d="M7.5 0a.5.5 0 01.5.5v1.026A6.003 6.003 0 0113.474 7H14.5a.5.5 0 010 1h-1.026A6.003 6.003 0 018 13.474V14.5a.5.5 0 01-1 0v-1.026A6.003 6.003 0 011.526 8H.5a.5.5 0 010-1h1.026A6.003 6.003 0 017 1.526V.5a.5.5 0 01.5-.5zm0 2.5A5 5 0 1012.5 7.5 5 5 0 007.5 2.5zm0 2a3 3 0 110 6 3 3 0 010-6zm0 1.5a1.5 1.5 0 100 3 1.5 1.5 0 000-3z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"/>
    </svg>
  )
}

function BarChartIcon(props: { style?: React.CSSProperties; width?: number; height?: number }) {
  return (
    <svg width={props.width ?? 16} height={props.height ?? 16} viewBox="0 0 15 15" fill="none" style={props.style}>
      <path d="M1 14.5a.5.5 0 000 1h13a.5.5 0 000-1H1zM1 8a.5.5 0 00-.5.5v5a.5.5 0 001 0v-5A.5.5 0 001 8zm4-4a.5.5 0 00-.5.5v9a.5.5 0 001 0v-9A.5.5 0 005 4zm4 3a.5.5 0 00-.5.5v6a.5.5 0 001 0v-6A.5.5 0 009 7zm4-6a.5.5 0 00-.5.5v12a.5.5 0 001 0v-12A.5.5 0 0013 1z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"/>
    </svg>
  )
}

function CalendarIcon(props: { style?: React.CSSProperties; width?: number; height?: number }) {
  return (
    <svg width={props.width ?? 16} height={props.height ?? 16} viewBox="0 0 15 15" fill="none" style={props.style}>
      <path d="M4.5 1a.5.5 0 01.5.5V2h5v-.5a.5.5 0 011 0V2h1.5A1.5 1.5 0 0114 3.5v9A1.5 1.5 0 0112.5 14h-10A1.5 1.5 0 011 12.5v-9A1.5 1.5 0 012.5 2H4v-.5a.5.5 0 01.5-.5zM2 3.5V5h11V3.5a.5.5 0 00-.5-.5H10v.5a.5.5 0 01-1 0V3H6v.5a.5.5 0 01-1 0V3H2.5a.5.5 0 00-.5.5zm11 2.5H2v6.5a.5.5 0 00.5.5h10a.5.5 0 00.5-.5V6z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"/>
    </svg>
  )
}

function LightningBoltIcon(props: { style?: React.CSSProperties; width?: number; height?: number }) {
  return (
    <svg width={props.width ?? 16} height={props.height ?? 16} viewBox="0 0 15 15" fill="none" style={props.style}>
      <path d="M8.695.139a.5.5 0 01.223.59L7.3 5H12a.5.5 0 01.39.813l-7 9a.5.5 0 01-.835-.59L6.7 10H2a.5.5 0 01-.39-.813l7-9a.5.5 0 01.612-.048z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"/>
    </svg>
  )
}

function BackpackIcon(props: { style?: React.CSSProperties; width?: number; height?: number }) {
  return (
    <svg width={props.width ?? 16} height={props.height ?? 16} viewBox="0 0 15 15" fill="none" style={props.style}>
      <path d="M4.5 2a2.5 2.5 0 015 0V3H4.5V2zm-1 1V2a3.5 3.5 0 017 0v1H13A1.5 1.5 0 0114.5 4.5v9A1.5 1.5 0 0113 15H2A1.5 1.5 0 01.5 13.5v-9A1.5 1.5 0 012 3h1.5zm1 0h5v1a1 1 0 01-1 1h-3a1 1 0 01-1-1V3zm-3 1h9.5a.5.5 0 01.5.5v9a.5.5 0 01-.5.5H2a.5.5 0 01-.5-.5v-9a.5.5 0 01.5-.5H1.5zM6 9.5a1.5 1.5 0 113 0 1.5 1.5 0 01-3 0z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"/>
    </svg>
  )
}

const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: DashboardIcon },
  { id: 'habits',    label: 'Habits',    icon: TargetIcon,       screen: 'habits' },
  { id: 'analytics', label: 'Analytics', icon: BarChartIcon,     screen: 'analytics' },
  { id: 'journal',   label: 'Journal',   icon: CalendarIcon },
  { id: 'compass',   label: 'Compass',   icon: LightningBoltIcon },
  { id: 'groups',    label: 'Groups',    icon: BackpackIcon,     screen: 'groups' },
]

interface AppSidebarProps {
  activeScreen: Screen
}

export function AppSidebar({ activeScreen }: AppSidebarProps) {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        padding: '12px 8px',
        borderRight: '1px solid var(--color-border-primary)',
        background: 'var(--color-surface-primary)',
        gap: 2,
        flexShrink: 0,
        overflow: 'hidden',
      }}
    >
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 8px', marginBottom: 12 }}>
        <div
          style={{
            width: 26,
            height: 26,
            borderRadius: 6,
            background: 'var(--color-brand-600)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <TargetIcon width={14} height={14} style={{ color: 'white' }} />
        </div>
        <span
          className="font-garamond"
          style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-text-primary)', whiteSpace: 'nowrap' }}
        >
          bito
        </span>
      </div>

      {/* Nav items */}
      {NAV_ITEMS.map((item) => {
        const isActive = item.screen === activeScreen
        const Icon = item.icon
        return (
          <div
            key={item.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '7px 10px',
              borderRadius: 8,
              background: isActive ? 'var(--color-surface-hover)' : 'transparent',
              borderLeft: isActive ? '3px solid var(--color-brand-500)' : '3px solid transparent',
              transition: 'background 150ms ease, border-color 150ms ease',
              cursor: 'default',
              flexShrink: 0,
            }}
          >
            <Icon
              width={15}
              height={15}
              style={{ color: isActive ? 'var(--color-brand-400)' : 'var(--color-text-tertiary)', flexShrink: 0 }}
            />
            <span
              className="font-spartan"
              style={{
                fontSize: 13,
                fontWeight: 500,
                color: isActive ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
                whiteSpace: 'nowrap',
              }}
            >
              {item.label}
            </span>
          </div>
        )
      })}
    </div>
  )
}
