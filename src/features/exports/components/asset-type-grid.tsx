import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { ExportAsset } from '@/domain/exports'
import { Download, Eye, FileAudio, FileImage, FileJson, FileText, Loader2, Music, RefreshCw, type LucideIcon } from 'lucide-react'

interface AssetTypeGridProps {
  assets: ExportAsset[]
  onDownload: (id: string) => void
  onRegenerate: (id: string) => void
  onPreview: (id: string) => void
  onSelect: (id: string) => void
}

const TYPE_ICONS: Record<string, LucideIcon> = {
  audio: FileAudio, instrumental: Music, vocal: Music,
  chord_sheet: FileText, melody_guide: FileText, lyrics: FileText,
  metadata: FileJson, cover_art: FileImage, teaser: FileAudio, manifest: FileJson,
}

const STATUS_BADGE: Record<string, { label: string; className: string }> = {
  ready: { label: 'Ready', className: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/25' },
  generating: { label: 'Generating', className: 'bg-[#1275e2]/15 text-[#aac7ff] border-[#1275e2]/25' },
  pending: { label: 'Pending', className: 'bg-amber-500/15 text-amber-300 border-amber-500/25' },
  failed: { label: 'Failed', className: 'bg-[#ff6b6b]/15 text-[#ff6b6b] border-[#ff6b6b]/25' },
  outdated: { label: 'Outdated', className: 'bg-[var(--riff-surface-highest)] text-[var(--riff-text-faint)] border-[var(--riff-surface-highest)]' },
}

export function AssetTypeGrid({ assets, onDownload, onRegenerate, onPreview, onSelect }: AssetTypeGridProps) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {assets.map((asset) => {
        const Icon = TYPE_ICONS[asset.type] ?? FileText
        const status = STATUS_BADGE[asset.status] ?? STATUS_BADGE.pending

        return (
          <div
            key={asset.id}
            className="group flex cursor-pointer items-start gap-3.5 rounded-xl p-3.5 transition-colors hover:bg-[var(--riff-surface-mid)]"
            style={{ background: 'var(--riff-surface-low)', border: '1px solid rgba(255,255,255,0.04)' }}
            onClick={() => onSelect(asset.id)}
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg" style={{ background: 'var(--riff-surface-mid)' }}>
              {asset.status === 'generating' ? (
                <Loader2 className="h-4.5 w-4.5 animate-spin text-[var(--riff-accent-light)]" />
              ) : (
                <Icon className="h-4.5 w-4.5 text-[var(--riff-text-muted)]" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="truncate text-sm font-semibold text-[var(--riff-text-primary)]">{asset.name}</p>
                <Badge className={`shrink-0 border ${status.className} px-1.5 py-0 text-[9px] font-bold uppercase tracking-wider`}>
                  {status.label}
                </Badge>
              </div>
              <p className="mt-0.5 text-[11px] text-[var(--riff-text-muted)]">{asset.description}</p>
              <div className="mt-1.5 flex items-center gap-3 text-[10px] text-[var(--riff-text-faint)]">
                <span className="rounded bg-[var(--riff-surface-high)] px-1.5 py-0 font-mono">{asset.format}</span>
                <span>{asset.size}</span>
                {asset.lastGenerated !== '—' && <span>{asset.lastGenerated}</span>}
              </div>
            </div>
            <div className="flex shrink-0 gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
              {asset.status === 'ready' && (
                <>
                  <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); onPreview(asset.id) }} className="h-7 w-7 rounded-md text-[var(--riff-text-faint)]">
                    <Eye className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); onDownload(asset.id) }} className="h-7 w-7 rounded-md text-[var(--riff-text-faint)]">
                    <Download className="h-3.5 w-3.5" />
                  </Button>
                </>
              )}
              <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); onRegenerate(asset.id) }} className="h-7 w-7 rounded-md text-[var(--riff-text-faint)]">
                <RefreshCw className="h-3 w-3" />
              </Button>
            </div>
          </div>
        )
      })}
    </div>
  )
}
