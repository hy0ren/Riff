import { PageFrame } from '@/components/layout/page-frame'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { ExportAsset } from '@/domain/exports'
import { EXPORT_ACTIVE_BUNDLE, EXPORT_ASSETS, EXPORT_HISTORY } from '@/mocks/mock-data'
import { Download, FolderOpen, Package, Plus, Search } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AssetTypeGrid } from './components/asset-type-grid'
import { BundleSpotlight } from './components/bundle-spotlight'
import { ExportHistory } from './components/export-history'
import { ExportInspector } from './components/export-inspector'
import { projectRoutes } from '@/features/projects/lib/project-routes'

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl p-3.5" style={{ background: 'var(--riff-surface-low)', border: '1px solid rgba(255,255,255,0.04)' }}>
      <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--riff-text-faint)]">{label}</p>
      <p className="mt-1 font-display text-xl font-bold text-[var(--riff-text-primary)]">{value}</p>
    </div>
  )
}

export function ExportsPage() {
  const navigate = useNavigate()
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null)
  const selectedAsset: ExportAsset | null = selectedAssetId
    ? EXPORT_ASSETS.find(a => a.id === selectedAssetId) ?? null
    : null

  const readyCount = EXPORT_ASSETS.filter(a => a.status === 'ready').length
  const pendingCount = EXPORT_ASSETS.filter(a => a.status === 'pending' || a.status === 'generating').length

  const inspector = (
    <ExportInspector
      asset={selectedAsset}
      projectTitle={EXPORT_ACTIVE_BUNDLE.projectTitle}
      onDownload={() => {}}
      onRegenerate={() => {}}
      onPreview={() => {}}
      onReveal={() => {}}
      onOpenStudio={() => navigate(projectRoutes.studio(EXPORT_ACTIVE_BUNDLE.projectId))}
      onOpenTrack={() => navigate(projectRoutes.details(EXPORT_ACTIVE_BUNDLE.projectId))}
    />
  )

  return (
    <PageFrame
      title="Exports"
      subtitle="Package, download, and manage your production assets"
      actions={
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--riff-text-faint)]" />
            <Input placeholder="Search exports..." className="h-8 w-52 rounded-lg pl-8 text-[12px]" />
          </div>
          <Button size="sm" className="h-8 gap-1.5 rounded-lg px-3 text-[12px] font-bold" style={{ background: 'var(--riff-accent)' }}>
            <Plus className="h-3.5 w-3.5" /> Create Export
          </Button>
          <Button variant="outline" size="sm" className="h-8 gap-1.5 rounded-lg px-3 text-[12px]">
            <FolderOpen className="h-3.5 w-3.5" /> Open Folder
          </Button>
        </div>
      }
      inspectorSlot={selectedAssetId ? inspector : undefined}
      inspectorWidth={340}
    >
      <div className="space-y-8">
        {/* Quick Stats */}
        <div className="grid grid-cols-4 gap-3">
          <StatCard label="Total Exports" value={String(EXPORT_HISTORY.length)} />
          <StatCard label="Bundles Created" value="3" />
          <StatCard label="Assets Ready" value={String(readyCount)} />
          <StatCard label="Pending" value={String(pendingCount)} />
        </div>

        {/* Bundle Spotlight */}
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <Package className="h-4 w-4 text-[var(--riff-text-faint)]" />
            <h3 className="font-display text-sm font-bold text-[var(--riff-text-primary)]">Active Bundle</h3>
          </div>
          <BundleSpotlight
            bundle={EXPORT_ACTIVE_BUNDLE}
            onDownload={() => {}}
            onRegenerate={() => {}}
            onCustomize={() => {}}
            onReveal={() => {}}
          />
        </section>

        {/* Asset Types */}
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <Download className="h-4 w-4 text-[var(--riff-text-faint)]" />
            <h3 className="font-display text-sm font-bold text-[var(--riff-text-primary)]">Export Assets</h3>
          </div>
          <AssetTypeGrid
            assets={EXPORT_ASSETS}
            onDownload={() => {}}
            onRegenerate={() => {}}
            onPreview={() => {}}
            onSelect={(id) => setSelectedAssetId(id === selectedAssetId ? null : id)}
          />
        </section>

        {/* Export History */}
        <section className="space-y-3">
          <h3 className="font-display text-sm font-bold text-[var(--riff-text-primary)]">Export History</h3>
          <ExportHistory
            entries={EXPORT_HISTORY}
            onDownload={() => {}}
            onRegenerate={() => {}}
            onSelect={(id) => setSelectedAssetId(id)}
          />
        </section>
      </div>
    </PageFrame>
  )
}
