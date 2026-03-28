import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { ExportHistoryEntry } from '@/domain/exports'
import { Download, Music2, RefreshCw } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

interface ExportHistoryProps {
  entries: ExportHistoryEntry[]
  onDownload: (id: string) => void
  onRegenerate: (id: string) => void
  onSelect: (id: string) => void
}

const STATUS_BADGE: Record<string, { label: string; className: string }> = {
  ready: { label: 'Ready', className: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/25' },
  generating: { label: 'Generating', className: 'bg-[#1275e2]/15 text-[#aac7ff] border-[#1275e2]/25' },
  pending: { label: 'Pending', className: 'bg-amber-500/15 text-amber-300 border-amber-500/25' },
  failed: { label: 'Failed', className: 'bg-[#ff6b6b]/15 text-[#ff6b6b] border-[#ff6b6b]/25' },
  outdated: { label: 'Outdated', className: 'bg-[var(--riff-surface-highest)] text-[var(--riff-text-faint)] border-[var(--riff-surface-highest)]' },
}

export function ExportHistory({ entries, onDownload, onRegenerate, onSelect }: ExportHistoryProps) {
  return (
    <div className="overflow-hidden rounded-xl" style={{ background: 'var(--riff-surface-low)', border: '1px solid rgba(255,255,255,0.04)' }}>
      {entries.map((entry, index) => {
        const status = STATUS_BADGE[entry.status] ?? STATUS_BADGE.pending
        return (
          <div
            key={entry.id}
            className="group flex cursor-pointer items-center gap-4 px-4 py-3 transition-colors hover:bg-[var(--riff-surface-mid)]"
            style={index < entries.length - 1 ? { borderBottom: '1px solid rgba(255,255,255,0.04)' } : undefined}
            onClick={() => onSelect(entry.id)}
          >
            {/* Cover */}
            {entry.projectCoverUrl ? (
              <img src={entry.projectCoverUrl} alt="" className="h-9 w-9 shrink-0 rounded-lg object-cover ring-1 ring-white/05" />
            ) : (
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg" style={{ background: 'var(--riff-surface-mid)' }}>
                <Music2 className="h-4 w-4 text-[var(--riff-text-faint)]" />
              </div>
            )}

            {/* Info */}
            <div className="flex-1 min-w-0">
              <p className="truncate text-sm font-medium text-[var(--riff-text-primary)]">{entry.projectTitle}</p>
              <p className="mt-0.5 text-[11px] text-[var(--riff-text-muted)]">{entry.exportType} · {entry.version}</p>
            </div>

            {/* Status */}
            <Badge className={`shrink-0 border ${status.className} px-1.5 py-0 text-[9px] font-bold uppercase tracking-wider`}>
              {status.label}
            </Badge>

            {/* Meta */}
            <div className="flex shrink-0 flex-col items-end gap-0.5">
              <span className="text-[11px] text-[var(--riff-text-faint)]">
                {formatDistanceToNow(new Date(entry.date), { addSuffix: true })}
              </span>
              <span className="text-[10px] text-[var(--riff-text-faint)]">{entry.size}</span>
            </div>

            {/* Actions */}
            <div className="flex shrink-0 gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
              {entry.status === 'ready' && (
                <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); onDownload(entry.id) }} className="h-7 w-7 rounded-md text-[var(--riff-text-faint)]">
                  <Download className="h-3.5 w-3.5" />
                </Button>
              )}
              {(entry.status === 'failed' || entry.status === 'outdated') && (
                <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); onRegenerate(entry.id) }} className="h-7 w-7 rounded-md text-[var(--riff-text-faint)]">
                  <RefreshCw className="h-3 w-3" />
                </Button>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
