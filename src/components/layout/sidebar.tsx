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
  PanelLeftClose,
  PanelLeftOpen,
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

function SidebarNavItem({
  item,
  compact,
  collapsed,
}: {
  item: NavItem
  compact: boolean
  collapsed: boolean
}) {
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
            collapsed
              ? 'justify-center px-2 py-2.5 text-[13px]'
              : compact
                ? 'gap-2.5 px-2.5 py-1.5 text-[13px]'
                : 'gap-3 px-3 py-2 text-sm',
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
          <item.icon
            className={cn(
              'shrink-0 transition-colors',
              compact ? 'h-4 w-4' : 'h-[18px] w-[18px]',
              isActive
                ? 'text-[var(--riff-accent-light)]'
                : 'text-[var(--riff-text-muted)] group-hover:text-[var(--riff-text-secondary)]',
            )}
          />

          {!collapsed ? <span>{item.label}</span> : null}
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
  collapsed,
}: {
  items: NavItem[]
  label?: string
  compact: boolean
  collapsed: boolean
}) {
  return (
    <div className="flex flex-col gap-0.5">
      {label && !collapsed && (
        <span className={cn(
          'mb-1 font-semibold uppercase tracking-[0.08em] text-[var(--riff-text-faint)]',
          compact ? 'px-2.5 text-[9px]' : 'px-3 text-[10px]',
        )}>
          {label}
        </span>
      )}
      {items.map((item) => (
        <SidebarNavItem
          key={item.path}
          item={item}
          compact={compact}
          collapsed={collapsed}
        />
      ))}
    </div>
  )
}

export function Sidebar({
  compact = false,
  collapsed = false,
  onToggleCollapsed,
}: {
  compact?: boolean
  collapsed?: boolean
  onToggleCollapsed?: () => void
}) {
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
      <div
        className={cn(
          'flex items-center',
          collapsed
            ? 'justify-center px-3 pt-4 pb-4'
            : compact
              ? 'gap-2.5 px-4 pt-4 pb-5'
              : 'gap-2.5 px-5 pt-5 pb-6',
        )}
      >
        <div className={cn('flex items-center', collapsed ? 'flex-col gap-2' : 'flex-1 gap-2.5')}>
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl"
            style={{
              background: 'var(--riff-surface-mid)',
              boxShadow: '0 0 15px rgba(82, 51, 255, 0.2)',
            }}
          >
            <img
              src={logo}
              alt="Riff Logo"
              className="h-full w-full object-cover"
            />
          </div>
          {!collapsed ? (
            <span className="font-display text-lg font-bold tracking-tight text-[var(--riff-text-primary)]">
              Riff
            </span>
          ) : null}
        </div>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={onToggleCollapsed}
              className={cn(
                'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[var(--riff-text-muted)] transition-colors hover:bg-[var(--riff-surface-mid)] hover:text-[var(--riff-text-primary)]',
                collapsed ? 'mt-1' : '',
              )}
              aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {collapsed ? (
                <PanelLeftOpen className="h-4 w-4" />
              ) : (
                <PanelLeftClose className="h-4 w-4" />
              )}
            </button>
          </TooltipTrigger>
          <TooltipContent side="right" sideOffset={8}>
            {collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          </TooltipContent>
        </Tooltip>
      </div>

      {/* Primary navigation — creation workflow */}
      <div className={cn('flex flex-1 flex-col gap-6 overflow-y-auto', compact ? 'px-2.5' : 'px-3')}>
        <NavGroup items={primaryNav} compact={compact} collapsed={collapsed} />

        {/* Spacer + subtle tonal shift */}
        <div className="mx-2 h-px" style={{ background: 'rgba(255,255,255,0.04)' }} />

        <NavGroup items={platformNav} label="Platform" compact={compact} collapsed={collapsed} />
      </div>

      {/* Utility — pinned to bottom */}
      <div className={cn(compact ? 'px-2.5 pb-3 pt-2' : 'px-3 pb-4 pt-2')}>
        <div className="mx-2 mb-2 h-px" style={{ background: 'rgba(255,255,255,0.04)' }} />
        <NavGroup items={utilityNav} compact={compact} collapsed={collapsed} />
      </div>
    </nav>
  )
}
