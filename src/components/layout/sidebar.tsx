import { NavLink, useLocation } from 'react-router-dom'
import {
  Home,
  PlusCircle,
  Mic,
  BookOpen,
  Library,
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
import logo from '@/assets/logo-Photoroom.png'

interface NavItem {
  label: string
  path: string
  icon: React.ComponentType<{ className?: string }>
}

const platformNav: NavItem[] = [
  { label: 'Library', path: '/library', icon: Library },
  { label: 'Explore', path: '/explore', icon: Compass },
]

const utilityNav: NavItem[] = [
  { label: 'Exports', path: '/exports', icon: Share },
  { label: 'Settings', path: '/settings', icon: Settings },
]

function SidebarNavItem({ item }: { item: NavItem }) {
function SidebarNavItem({ item, compact }: { item: NavItem; compact: boolean }) {
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
            'group relative flex items-center rounded-lg font-medium transition-all duration-150',
            compact ? 'gap-2.5 px-2.5 py-1.5 text-[13px]' : 'gap-3 px-3 py-2 text-sm',
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
            cn('shrink-0 transition-colors', compact ? 'h-4 w-4' : 'h-[18px] w-[18px]'),
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

function NavGroup({
  items,
  label,
  compact,
}: {
  items: NavItem[]
  label?: string
  compact: boolean
}) {
  return (
    <div className="flex flex-col gap-0.5">
      {label && (
        <span className={cn(
          'mb-1 font-semibold uppercase tracking-[0.08em] text-[var(--riff-text-faint)]',
          compact ? 'px-2.5 text-[9px]' : 'px-3 text-[10px]',
        )}>
          {label}
        </span>
      )}
      {items.map((item) => (
        <SidebarNavItem key={item.path} item={item} compact={compact} />
      ))}
    </div>
  )
}

export function Sidebar({ compact = false }: { compact?: boolean }) {
  const activeProjectId = useProjectContextStore((state) => state.activeProjectId)
  const projectId = activeProjectId ?? getPrimaryProjectId()

  const primaryNav: NavItem[] = [
    { label: 'Home', path: '/', icon: Home },
    { label: 'Create', path: '/create', icon: PlusCircle },
    { label: 'Studio', path: projectRoutes.studio(projectId), icon: Mic },
    { label: 'Learn', path: projectRoutes.learn(projectId), icon: BookOpen },
  ]

  return (
    <nav className="flex h-full flex-col overflow-hidden">
      {/* Brand header */}
      <div className={cn('flex items-center gap-2.5', compact ? 'px-4 pt-4 pb-5' : 'px-5 pt-5 pb-6')}>
        {/* Logo mark — stylized waveform */}
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl overflow-hidden"
          style={{ background: 'var(--riff-surface-mid)', boxShadow: '0 0 15px rgba(82, 51, 255, 0.2)' }}
        >
          <img 
            src={logo} 
            alt="Riff Logo" 
            className="h-full w-full object-cover"
          />
        </div>
          <span className="font-display text-lg font-bold tracking-tight text-[var(--riff-text-primary)]">
            Riff
          </span>
      </div>

      {/* Primary navigation — creation workflow */}
      <div className={cn('flex flex-1 flex-col gap-6 overflow-y-auto', compact ? 'px-2.5' : 'px-3')}>
        <NavGroup items={primaryNav} compact={compact} />

        {/* Spacer + subtle tonal shift */}
        <div className="mx-2 h-px" style={{ background: 'rgba(255,255,255,0.04)' }} />

        <NavGroup items={platformNav} label="Platform" compact={compact} />
      </div>

      {/* Utility — pinned to bottom */}
      <div className={cn(compact ? 'px-2.5 pb-3 pt-2' : 'px-3 pb-4 pt-2')}>
        <div className="mx-2 mb-2 h-px" style={{ background: 'rgba(255,255,255,0.04)' }} />
        <NavGroup items={utilityNav} compact={compact} />
      </div>
    </nav>
  )
}
