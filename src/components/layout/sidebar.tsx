import { NavLink, useLocation } from 'react-router-dom'
import {
  Home,
  PlusCircle,
  Mic,
  Dumbbell,
  Library,
  Radio,
  Compass,
  Share,
  Settings,
} from 'lucide-react'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { projectRoutes } from '@/features/projects/lib/project-routes'
import { getPrimaryProjectId } from '@/features/projects/lib/project-selectors'
import { useProjectContextStore } from '@/features/projects/store/use-project-context-store'

interface NavItem {
  label: string
  path: string
  icon: React.ComponentType<{ className?: string }>
}

const platformNav: NavItem[] = [
  { label: 'Library', path: '/library', icon: Library },
  { label: 'Radio', path: '/radio', icon: Radio },
  { label: 'Explore', path: '/explore', icon: Compass },
]

const utilityNav: NavItem[] = [
  { label: 'Exports', path: '/exports', icon: Share },
  { label: 'Settings', path: '/settings', icon: Settings },
]

function SidebarNavItem({ item }: { item: NavItem }) {
  const location = useLocation()
  const isActive = item.path === '/'
    ? location.pathname === '/'
    : location.pathname.startsWith(item.path)

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <NavLink
          to={item.path}
          className={cn(
            'group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150',
            isActive
              ? 'text-[var(--riff-accent-light)]'
              : 'text-[var(--riff-text-secondary)] hover:text-[var(--riff-text-primary)]'
          )}
          style={isActive ? { background: 'var(--sidebar-accent)' } : undefined}
        >
          {/* Active indicator bar */}
          {isActive && (
            <span
              className="absolute left-0 top-1/2 h-5 w-[2px] -translate-y-1/2 rounded-full"
              style={{ background: 'var(--riff-accent)' }}
            />
          )}

          <item.icon className={cn(
            'h-[18px] w-[18px] shrink-0 transition-colors',
            isActive ? 'text-[var(--riff-accent-light)]' : 'text-[var(--riff-text-muted)] group-hover:text-[var(--riff-text-secondary)]'
          )} />

          <span>{item.label}</span>
        </NavLink>
      </TooltipTrigger>
      <TooltipContent side="right" sideOffset={8}>
        {item.label}
      </TooltipContent>
    </Tooltip>
  )
}

function NavGroup({ items, label }: { items: NavItem[]; label?: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      {label && (
        <span className="mb-1 px-3 text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--riff-text-faint)]">
          {label}
        </span>
      )}
      {items.map((item) => (
        <SidebarNavItem key={item.path} item={item} />
      ))}
    </div>
  )
}

export function Sidebar() {
  const activeProjectId = useProjectContextStore((state) => state.activeProjectId)
  const projectId = activeProjectId ?? getPrimaryProjectId()

  const primaryNav: NavItem[] = [
    { label: 'Home', path: '/', icon: Home },
    { label: 'Create', path: '/create', icon: PlusCircle },
    { label: 'Studio', path: projectRoutes.studio(projectId), icon: Mic },
    { label: 'Coach', path: projectRoutes.coach(projectId), icon: Dumbbell },
  ]

  return (
    <nav className="flex h-full flex-col overflow-hidden">
      {/* Brand header */}
      <div className="flex items-center gap-2.5 px-5 pt-5 pb-6">
        {/* Logo mark — stylized waveform */}
        <div
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
          style={{ background: 'var(--riff-accent)', boxShadow: '0 0 12px var(--riff-glow-strong)' }}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-white">
            <rect x="1" y="6" width="2" height="4" rx="1" fill="currentColor" opacity="0.6" />
            <rect x="4.5" y="3" width="2" height="10" rx="1" fill="currentColor" />
            <rect x="8" y="5" width="2" height="6" rx="1" fill="currentColor" opacity="0.8" />
            <rect x="11.5" y="2" width="2" height="12" rx="1" fill="currentColor" opacity="0.7" />
          </svg>
        </div>
        <div className="flex flex-col">
          <span className="font-display text-sm font-bold tracking-tight text-[var(--riff-text-primary)]">
            Riff Radio
          </span>
          <span className="text-[9px] font-semibold uppercase tracking-[0.12em] text-[var(--riff-text-faint)]">
            AI Music Engine
          </span>
        </div>
      </div>

      {/* Primary navigation — creation workflow */}
      <div className="flex flex-1 flex-col gap-6 overflow-y-auto px-3">
        <NavGroup items={primaryNav} />

        {/* Spacer + subtle tonal shift */}
        <div className="mx-2 h-px" style={{ background: 'rgba(255,255,255,0.04)' }} />

        <NavGroup items={platformNav} label="Platform" />
      </div>

      {/* Utility — pinned to bottom */}
      <div className="px-3 pb-4 pt-2">
        <div className="mx-2 mb-2 h-px" style={{ background: 'rgba(255,255,255,0.04)' }} />
        <NavGroup items={utilityNav} />
      </div>
    </nav>
  )
}
