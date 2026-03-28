import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import type { ExportAsset } from '@/domain/exports'
import { Download, Eye, FolderOpen, RefreshCw } from 'lucide-react'

interface ExportInspectorProps {
  asset: ExportAsset | null
  projectTitle: string
  onDownload: () => void
  onRegenerate: () => void
  onPreview: () => void
  onReveal: () => void
  onOpenStudio: () => void
  onOpenTrack: () => void
}

const STATUS_BADGE: Record<string, { label: string; className: string }> = {
  ready: { label: 'Ready', className: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/25' },
  generating: { label: 'Generating', className: 'bg-[#1275e2]/15 text-[#aac7ff] border-[#1275e2]/25' },
  pending: { label: 'Pending', className: 'bg-amber-500/15 text-amber-300 border-amber-500/25' },
  failed: { label: 'Failed', className: 'bg-[#ff6b6b]/15 text-[#ff6b6b] border-[#ff6b6b]/25' },
  outdated: { label: 'Outdated', className: 'bg-[var(--riff-surface-highest)] text-[var(--riff-text-faint)] border-[var(--riff-surface-highest)]' },
}

export function ExportInspector({ asset, projectTitle, onDownload, onRegenerate, onPreview, onReveal, onOpenStudio, onOpenTrack }: ExportInspectorProps) {
  if (!asset) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-6 text-center">
        <p className="text-sm text-[var(--riff-text-muted)]">Select an export asset to inspect</p>
      </div>
    )
  }

  const status = STATUS_BADGE[asset.status] ?? STATUS_BADGE.pending

  return (
    <div className="flex flex-col gap-5 p-5">
      {/* Header */}
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--riff-text-faint)]">
          Export Inspector
        </p>
        <h4 className="mt-1.5 font-display text-base font-bold text-[var(--riff-text-primary)]">{asset.name}</h4>
        <p className="mt-0.5 text-[12px] text-[var(--riff-text-muted)]">{asset.description}</p>
      </div>

      <Separator className="bg-[rgba(255,255,255,0.04)]" />

      {/* Metadata */}
      <div className="space-y-3">
        <InfoRow label="Project" value={projectTitle} />
        <InfoRow label="Format" value={asset.format} />
        <InfoRow label="Size" value={asset.size} />
        <InfoRow label="Last Generated" value={asset.lastGenerated} />
        <div className="flex items-center justify-between">
          <span className="text-[11px] text-[var(--riff-text-faint)]">Status</span>
          <Badge className={`border ${status.className} px-1.5 py-0 text-[9px] font-bold uppercase tracking-wider`}>
            {status.label}
          </Badge>
        </div>
        <InfoRow label="Path" value={`~/Riff/exports/${projectTitle.toLowerCase().replace(/\s/g, '-')}/${asset.name.toLowerCase().replace(/\s/g, '-')}.${asset.format.toLowerCase()}`} />
      </div>

      <Separator className="bg-[rgba(255,255,255,0.04)]" />

      {/* Actions */}
      <div className="space-y-2">
        {asset.status === 'ready' && (
          <>
            <Button onClick={onDownload} className="w-full justify-start gap-2 rounded-lg text-[12px] font-semibold" style={{ background: 'var(--riff-accent)' }}>
              <Download className="h-3.5 w-3.5" /> Download
            </Button>
            <Button onClick={onPreview} variant="outline" className="w-full justify-start gap-2 rounded-lg text-[12px]">
              <Eye className="h-3.5 w-3.5" /> Preview
            </Button>
          </>
        )}
        <Button onClick={onRegenerate} variant="outline" className="w-full justify-start gap-2 rounded-lg text-[12px]">
          <RefreshCw className="h-3.5 w-3.5" /> Regenerate
        </Button>
        <Button onClick={onReveal} variant="ghost" className="w-full justify-start gap-2 rounded-lg text-[12px] text-[var(--riff-text-muted)]">
          <FolderOpen className="h-3.5 w-3.5" /> Reveal in Folder
        </Button>
      </div>

      <Separator className="bg-[rgba(255,255,255,0.04)]" />

      {/* Handoff links */}
      <div className="space-y-1.5">
        <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--riff-text-faint)]">Navigate</p>
        <Button onClick={onOpenTrack} variant="ghost" className="h-8 w-full justify-start rounded-lg text-[12px] text-[var(--riff-text-muted)]">
          Open Track Details
        </Button>
        <Button onClick={onOpenStudio} variant="ghost" className="h-8 w-full justify-start rounded-lg text-[12px] text-[var(--riff-text-muted)]">
          Open in Studio
        </Button>
      </div>
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <span className="shrink-0 text-[11px] text-[var(--riff-text-faint)]">{label}</span>
      <span className="truncate text-right text-[11px] font-medium text-[var(--riff-text-secondary)]">{value}</span>
    </div>
  )
}
