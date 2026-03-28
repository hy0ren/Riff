import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { ExportBundle } from '@/domain/exports'
import { Check, Download, FolderOpen, Music2, RefreshCw, Settings2 } from 'lucide-react'

interface BundleSpotlightProps {
  bundle: ExportBundle
  onDownload: () => void
  onRegenerate: () => void
  onCustomize: () => void
  onReveal: () => void
}

const STATUS_BADGE: Record<string, { label: string; className: string }> = {
  ready: { label: 'Ready', className: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/25' },
  generating: { label: 'Generating', className: 'bg-[#1275e2]/15 text-[#aac7ff] border-[#1275e2]/25' },
  pending: { label: 'Pending', className: 'bg-amber-500/15 text-amber-300 border-amber-500/25' },
  failed: { label: 'Failed', className: 'bg-[#ff6b6b]/15 text-[#ff6b6b] border-[#ff6b6b]/25' },
  outdated: { label: 'Outdated', className: 'bg-[var(--riff-surface-highest)] text-[var(--riff-text-faint)] border-[var(--riff-surface-highest)]' },
}

export function BundleSpotlight({ bundle, onDownload, onRegenerate, onCustomize, onReveal }: BundleSpotlightProps) {
  const statusBadge = STATUS_BADGE[bundle.status] ?? STATUS_BADGE.pending
  const readyAssets = bundle.assets.filter(a => a.status === 'ready').length

  return (
    <div className="overflow-hidden rounded-2xl" style={{ background: 'var(--riff-surface-low)', border: '1px solid rgba(255,255,255,0.04)' }}>
      <div className="flex gap-6 p-6">
        {/* Project artwork */}
        <div className="shrink-0">
          {bundle.projectCoverUrl ? (
            <img src={bundle.projectCoverUrl} alt={bundle.projectTitle} className="h-28 w-28 rounded-xl object-cover shadow-lg ring-1 ring-white/10" />
          ) : (
            <div className="flex h-28 w-28 items-center justify-center rounded-xl shadow-lg ring-1 ring-white/10" style={{ background: 'var(--riff-surface-mid)' }}>
              <Music2 className="h-10 w-10 text-[var(--riff-text-faint)]" />
            </div>
          )}
        </div>

        {/* Bundle info */}
        <div className="flex flex-1 flex-col gap-3">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--riff-text-faint)]">Production Bundle</p>
              <h3 className="mt-1 font-display text-lg font-bold text-[var(--riff-text-primary)]">{bundle.projectTitle}</h3>
            </div>
            <Badge className={`border ${statusBadge.className} px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider`}>
              {statusBadge.label}
            </Badge>
          </div>

          {/* Asset checklist */}
          <div className="grid grid-cols-2 gap-x-6 gap-y-1">
            {bundle.assets.map((asset) => (
              <div key={asset.id} className="flex items-center gap-2">
                <div className={`flex h-4 w-4 items-center justify-center rounded ${asset.status === 'ready' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-[var(--riff-surface-high)] text-[var(--riff-text-faint)]'}`}>
                  <Check className="h-2.5 w-2.5" />
                </div>
                <span className={`text-[11px] ${asset.status === 'ready' ? 'text-[var(--riff-text-secondary)]' : 'text-[var(--riff-text-faint)]'}`}>
                  {asset.name}
                </span>
                <span className="text-[10px] text-[var(--riff-text-faint)]">{asset.format}</span>
              </div>
            ))}
          </div>

          {/* Stats + actions */}
          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-4 text-[11px] text-[var(--riff-text-faint)]">
              <span>{readyAssets}/{bundle.assets.length} assets ready</span>
              <span>{bundle.totalSize}</span>
              <span>Last generated: {bundle.lastRegenerated}</span>
            </div>
            <div className="flex items-center gap-2">
              <Button onClick={onDownload} size="sm" className="h-8 gap-1.5 rounded-lg px-4 text-[12px] font-bold" style={{ background: 'var(--riff-accent)' }}>
                <Download className="h-3.5 w-3.5" /> Download Bundle
              </Button>
              <Button onClick={onRegenerate} variant="outline" size="sm" className="h-8 gap-1 rounded-lg px-3 text-[11px]">
                <RefreshCw className="h-3 w-3" /> Regenerate
              </Button>
              <Button onClick={onCustomize} variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-[var(--riff-text-muted)]">
                <Settings2 className="h-3.5 w-3.5" />
              </Button>
              <Button onClick={onReveal} variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-[var(--riff-text-muted)]">
                <FolderOpen className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
