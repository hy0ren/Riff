import type { Project, SourceType } from '@/domain/project'

export function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 30) return `${days}d ago`
  const months = Math.floor(days / 30)
  return `${months}mo ago`
}

export function sourceLabel(src?: SourceType): string {
  if (!src) return 'Unknown'
  const map: Record<SourceType, string> = {
    hum: 'Hum',
    riff: 'Audio Riff',
    chords: 'Chord Input',
    sheet_music: 'Sheet Music',
    lyrics: 'Lyrics',
    remix: 'Remix',
    spotify_track: 'Spotify Ref',
    spotify_playlist: 'Spotify Playlist',
    mixed: 'Mixed Source',
  }
  return map[src] || src
}

export function statusColor(status: string): string {
  switch (status) {
    case 'draft': return 'bg-amber-500/15 text-amber-400'
    case 'generating': return 'bg-[var(--riff-accent)]/15 text-[var(--riff-accent-light)]'
    case 'finished': return 'bg-emerald-500/15 text-emerald-400'
    case 'archived': return 'bg-[var(--riff-surface-highest)] text-[var(--riff-text-muted)]'
    default: return 'bg-[var(--riff-surface-highest)] text-[var(--riff-text-muted)]'
  }
}

export function statusLabel(status: string): string {
  switch (status) {
    case 'draft': return 'Draft'
    case 'generating': return 'Generating'
    case 'finished': return 'Final'
    case 'archived': return 'Archived'
    default: return status
  }
}
