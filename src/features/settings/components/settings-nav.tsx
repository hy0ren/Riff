import { cn } from '@/lib/utils'
import {
  Bell,
  Download,
  HardDrive,
  Palette,
  Play,
  Plug,
  Shield,
  SlidersHorizontal,
  Sparkles,
  User,
  Volume2,
} from 'lucide-react'

const NAV_ITEMS = [
  { id: 'account', label: 'Account', icon: User },
  { id: 'appearance', label: 'Appearance', icon: Palette },
  { id: 'playback', label: 'Playback', icon: Play },
  { id: 'creation', label: 'Creation', icon: Sparkles },
  { id: 'exports', label: 'Exports', icon: Download },
  { id: 'storage', label: 'Storage', icon: HardDrive },
  { id: 'privacy', label: 'Privacy', icon: Shield },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'integrations', label: 'Integrations', icon: Plug },
  { id: 'audio', label: 'Audio', icon: Volume2 },
  { id: 'advanced', label: 'Advanced', icon: SlidersHorizontal },
] as const

export function SettingsNav({
  activeSection,
  onNavigate,
}: {
  activeSection: string
  onNavigate: (id: string) => void
}) {
  return (
    <nav
      className="flex w-full flex-col gap-0.5"
      aria-label="Settings categories"
    >
      {NAV_ITEMS.map(({ id, label, icon: Icon }) => {
        const active = activeSection === id
        return (
          <button
            key={id}
            type="button"
            onClick={() => onNavigate(id)}
            className={cn(
              'flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-[12px] font-medium transition-colors',
              active
                ? 'bg-[color-mix(in_oklab,var(--riff-accent)_14%,transparent)] text-[var(--riff-accent)]'
                : 'text-[var(--riff-text-secondary)] hover:bg-[var(--riff-surface-mid)] hover:text-[var(--riff-text-primary)]'
            )}
          >
            <Icon
              className={cn(
                'size-3.5 shrink-0',
                active ? 'text-[var(--riff-accent)]' : 'text-[var(--riff-text-muted)]'
              )}
              aria-hidden
            />
            <span>{label}</span>
          </button>
        )
      })}
    </nav>
  )
}
