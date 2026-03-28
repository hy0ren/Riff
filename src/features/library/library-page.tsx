import { useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageFrame } from '@/components/layout/page-frame'
import { EmptyState } from '@/components/shared/empty-state'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { 
  Search, LayoutGrid, List, Plus, Upload, FolderPlus,
  Music, CheckCircle2,
  Star, Archive, Clock
} from 'lucide-react'
import { LibraryProjectCard } from './components/library-project-card'
import { LibraryProjectRow } from './components/library-project-row'
import { LibraryInspector } from './components/library-inspector'
import { useProjectStore } from '@/features/projects/store/use-project-store'
import { getProjectVersion } from '@/features/projects/lib/project-selectors'
import { exportLatestProjectVersion } from '@/features/projects/lib/project-export'
import { createImportedAudioProject } from '@/features/projects/lib/import-audio-project'

type ViewMode = 'grid' | 'list'
type TabFilter = 'all' | 'drafts' | 'final' | 'favorites' | 'collections'
type SortMode = 'recent' | 'title' | 'bpm'

export function LibraryPage() {
  const navigate = useNavigate()
  const projects = useProjectStore((state) => state.projects)
  const deleteProject = useProjectStore((state) => state.deleteProject)
  const updateProject = useProjectStore((state) => state.updateProject)
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [activeTab, setActiveTab] = useState<TabFilter>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [sortMode, setSortMode] = useState<SortMode>('recent')
  const [projectPendingDelete, setProjectPendingDelete] = useState<string | null>(null)
  const [projectPendingRename, setProjectPendingRename] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState('')
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false)
  const [isCollectionDialogOpen, setIsCollectionDialogOpen] = useState(false)
  const [bulkSelection, setBulkSelection] = useState<string[]>([])
  const [collectionName, setCollectionName] = useState('')
  const [isImporting, setIsImporting] = useState(false)
  const importInputRef = useRef<HTMLInputElement | null>(null)

  // Filtering
  const filtered = useMemo(() => {
    let items = [...projects]

    // Tab filter
    switch (activeTab) {
      case 'drafts':
        items = items.filter(p => p.status === 'draft')
        break
      case 'final':
        items = items.filter(p => p.status === 'finished')
        break
      case 'favorites':
        items = items.filter(p => p.isFavorite)
        break
      case 'collections':
        items = items.filter(p => p.collection)
        break
    }

    // Search
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      items = items.filter(p =>
        p.title.toLowerCase().includes(q) ||
        (p.blueprint?.genre || p.genre || '').toLowerCase().includes(q) ||
        (p.mood || '').toLowerCase().includes(q) ||
        (p.collection || '').toLowerCase().includes(q)
      )
    }

    // Sort
    switch (sortMode) {
      case 'recent':
        items.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
        break
      case 'title':
        items.sort((a, b) => a.title.localeCompare(b.title))
        break
      case 'bpm':
        items.sort((a, b) => (b.blueprint?.bpm || b.bpm || 0) - (a.blueprint?.bpm || a.bpm || 0))
        break
    }

    return items
  }, [activeTab, projects, searchQuery, sortMode])

  const selectedProject = selectedId ? projects.find(p => p.id === selectedId) : null
  const bulkSelectionSet = new Set(bulkSelection)

  // Stats
  const totalProjects = projects.length
  const draftCount = projects.filter(p => p.status === 'draft').length
  const finalCount = projects.filter(p => p.status === 'finished').length
  const exportedCount = projects.filter(p => p.isExported).length
  const isLibraryEmpty = totalProjects === 0
  const isFilteredEmpty = !isLibraryEmpty && filtered.length === 0

  const handleConfirmDelete = () => {
    if (!projectPendingDelete) {
      return
    }

    deleteProject(projectPendingDelete)
    if (selectedId === projectPendingDelete) {
      setSelectedId(null)
    }
    setProjectPendingDelete(null)
  }

  const handleToggleFavorite = (projectId: string) => {
    updateProject(projectId, (project) => ({
      ...project,
      isFavorite: !project.isFavorite,
      library: {
        ...project.library,
        isFavorite: !project.isFavorite,
      },
      updatedAt: new Date().toISOString(),
    }))
  }

  const handleExportProject = async (projectId: string) => {
    const project = projects.find((candidate) => candidate.id === projectId)
    const version = project ? getProjectVersion(project) : undefined
    if (!project || !version) {
      return
    }

    await exportLatestProjectVersion(project, version)
    updateProject(projectId, (currentProject) => ({
      ...currentProject,
      isExported: true,
      library: {
        ...currentProject.library,
        isExported: true,
      },
      updatedAt: new Date().toISOString(),
    }))
  }

  const openRenameDialog = (projectId: string) => {
    const project = projects.find((candidate) => candidate.id === projectId)
    setProjectPendingRename(projectId)
    setRenameValue(project?.title ?? '')
  }

  const handleConfirmRename = () => {
    if (!projectPendingRename || !renameValue.trim()) {
      return
    }

    updateProject(projectPendingRename, (project) => ({
      ...project,
      title: renameValue.trim(),
      updatedAt: new Date().toISOString(),
    }))
    setProjectPendingRename(null)
    setRenameValue('')
  }

  const toggleBulkSelection = (projectId: string) => {
    setBulkSelection((current) =>
      current.includes(projectId)
        ? current.filter((candidate) => candidate !== projectId)
        : [...current, projectId],
    )
  }

  const handleBulkExport = async () => {
    const selectedProjects = projects.filter((project) => bulkSelectionSet.has(project.id))
    for (const project of selectedProjects) {
      const version = getProjectVersion(project)
      if (!version) {
        continue
      }

      await exportLatestProjectVersion(project, version)
      updateProject(project.id, (currentProject) => ({
        ...currentProject,
        isExported: true,
        library: {
          ...currentProject.library,
          isExported: true,
        },
        updatedAt: new Date().toISOString(),
      }))
    }

    setIsExportDialogOpen(false)
    setBulkSelection([])
  }

  const handleApplyCollection = () => {
    const nextCollectionName = collectionName.trim()
    if (!nextCollectionName || !bulkSelection.length) {
      return
    }

    bulkSelection.forEach((projectId) => {
      updateProject(projectId, (project) => ({
        ...project,
        collection: nextCollectionName,
        library: {
          ...project.library,
          collection: nextCollectionName,
        },
        updatedAt: new Date().toISOString(),
      }))
    })

    setIsCollectionDialogOpen(false)
    setBulkSelection([])
    setCollectionName('')
  }

  const handleImportFiles = async (files: FileList | null) => {
    if (!files?.length) {
      return
    }

    setIsImporting(true)
    try {
      for (const file of Array.from(files)) {
        const importedProject = await createImportedAudioProject(file)
        useProjectStore.getState().upsertProject(importedProject)
      }
    } finally {
      setIsImporting(false)
    }
  }

  return (
    <>
      <PageFrame
        title="Library"
        subtitle="Your creative archive"
        inspectorSlot={
          selectedProject ? (
            <LibraryInspector
              project={selectedProject}
              onDelete={() => setProjectPendingDelete(selectedProject.id)}
            />
          ) : undefined
        }
        inspectorWidth={380}
        actions={
          <div className="flex items-center gap-2">
            <input
              ref={importInputRef}
              type="file"
              multiple
              accept="audio/*"
              className="hidden"
              onChange={(event) => {
                void handleImportFiles(event.target.files)
                event.currentTarget.value = ''
              }}
            />
            <button
              onClick={() => navigate('/create')}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-gradient-to-r from-[var(--riff-accent)] to-[var(--riff-accent-focus)] text-white font-bold text-xs tracking-wide shadow-lg hover:shadow-xl transition-all active:scale-[0.98]"
            >
              <Plus className="h-3.5 w-3.5" /> New Track
            </button>
            <button
              onClick={() => importInputRef.current?.click()}
              className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-[var(--riff-surface-highest)] text-[var(--riff-text-secondary)] text-xs font-medium hover:bg-[var(--riff-surface-high)] transition-colors"
            >
              <Upload className="h-3.5 w-3.5" /> {isImporting ? 'Importing…' : 'Import'}
            </button>
            <button
              onClick={() => {
                setBulkSelection([])
                setCollectionName('')
                setIsCollectionDialogOpen(true)
              }}
              className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-[var(--riff-surface-highest)] text-[var(--riff-text-secondary)] text-xs font-medium hover:bg-[var(--riff-surface-high)] transition-colors"
            >
              <FolderPlus className="h-3.5 w-3.5" /> Collection
            </button>
            <button
              onClick={() => {
                setBulkSelection([])
                setIsExportDialogOpen(true)
              }}
              className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-[var(--riff-surface-highest)] text-[var(--riff-text-secondary)] text-xs font-medium hover:bg-[var(--riff-surface-high)] transition-colors"
            >
              <Archive className="h-3.5 w-3.5" /> Export
            </button>
          </div>
        }
      >
        <div className="flex flex-col gap-6 pb-12">

        {/* Stats Row */}
        <div className="flex items-center gap-6">
          <StatPill icon={<Music className="h-3.5 w-3.5" />} label="Total" value={totalProjects} />
          <StatPill icon={<Clock className="h-3.5 w-3.5" />} label="Drafts" value={draftCount} />
          <StatPill icon={<CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />} label="Final" value={finalCount} />
          <StatPill icon={<Archive className="h-3.5 w-3.5" />} label="Exported" value={exportedCount} />
        </div>

        {/* Search + Tabs + Controls */}
        {!isLibraryEmpty && (
        <div className="flex items-center justify-between gap-4">
          
          {/* Search */}
          <div className="relative w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--riff-text-muted)]" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search projects, genres, moods..."
              className="pl-10 bg-[var(--riff-surface-low)] border-[var(--riff-surface-highest)] text-sm focus-visible:ring-[var(--riff-accent)]"
            />
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabFilter)}>
            <TabsList className="bg-[var(--riff-surface-low)] p-1 rounded-lg border border-[var(--riff-surface-highest)]">
              <TabsTrigger value="all" className="text-xs rounded-md data-[state=active]:bg-[var(--riff-surface-high)]">All</TabsTrigger>
              <TabsTrigger value="drafts" className="text-xs rounded-md data-[state=active]:bg-[var(--riff-surface-high)]">Drafts</TabsTrigger>
              <TabsTrigger value="final" className="text-xs rounded-md data-[state=active]:bg-[var(--riff-surface-high)]">Final</TabsTrigger>
              <TabsTrigger value="favorites" className="text-xs rounded-md data-[state=active]:bg-[var(--riff-surface-high)]">
                <Star className="h-3 w-3 mr-1" /> Favorites
              </TabsTrigger>
              <TabsTrigger value="collections" className="text-xs rounded-md data-[state=active]:bg-[var(--riff-surface-high)]">Collections</TabsTrigger>
            </TabsList>
          </Tabs>

          {/* View Mode + Sort */}
          <div className="flex items-center gap-2">
            <select 
              value={sortMode}
              onChange={(e) => setSortMode(e.target.value as SortMode)}
              className="bg-[var(--riff-surface-low)] border border-[var(--riff-surface-highest)] rounded-lg px-3 py-2 text-xs text-[var(--riff-text-secondary)] focus:outline-none focus:ring-1 focus:ring-[var(--riff-accent)] appearance-none pr-6"
            >
              <option value="recent">Recently Edited</option>
              <option value="title">Title A-Z</option>
              <option value="bpm">BPM ↓</option>
            </select>

            <div className="flex items-center rounded-lg border border-[var(--riff-surface-highest)] overflow-hidden">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 transition-colors ${viewMode === 'grid' ? 'bg-[var(--riff-surface-high)] text-[var(--riff-text-primary)]' : 'text-[var(--riff-text-muted)] hover:text-[var(--riff-text-secondary)]'}`}
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 transition-colors ${viewMode === 'list' ? 'bg-[var(--riff-surface-high)] text-[var(--riff-text-primary)]' : 'text-[var(--riff-text-muted)] hover:text-[var(--riff-text-secondary)]'}`}
              >
                <List className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
        )}

        {/* Results Count */}
        {!isLibraryEmpty && (
        <p className="text-xs text-[var(--riff-text-muted)]">
          {filtered.length} project{filtered.length !== 1 ? 's' : ''}
          {activeTab !== 'all' && ` in ${activeTab}`}
          {searchQuery && ` matching "${searchQuery}"`}
        </p>
        )}

        {isLibraryEmpty ? (
          <EmptyState
            icon={<Music className="h-7 w-7" strokeWidth={1.5} />}
            title="Start your library"
            description="Create a song to see it here—versions, blueprints, and exports will gather in one place as you iterate."
            action={{ label: 'Create your first song', onClick: () => navigate('/create') }}
            className="mx-auto w-full max-w-md"
          />
        ) : isFilteredEmpty ? (
          <EmptyState
            icon={<Search className="h-7 w-7" strokeWidth={1.5} />}
            title="Nothing matches"
            description="Try a different search, tab, or sort. Your projects are still in the library."
            compact
            className="mx-auto w-full max-w-md"
          />
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 max-w-[1400px] gap-5">
            {filtered.map(project => (
              <LibraryProjectCard
                key={project.id}
                project={project}
                isSelected={selectedId === project.id}
                onClick={() => setSelectedId(selectedId === project.id ? null : project.id)}
                onDelete={() => setProjectPendingDelete(project.id)}
                onToggleFavorite={() => handleToggleFavorite(project.id)}
                onExport={() => void handleExportProject(project.id)}
                onRename={() => openRenameDialog(project.id)}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-1">
            {/* List Header */}
            <div className="flex items-center gap-4 px-4 py-2 text-[10px] uppercase tracking-widest text-[var(--riff-text-muted)] font-semibold border-b border-[var(--riff-surface-highest)]">
              <div className="w-12 shrink-0" />
              <div className="flex-1">Title</div>
              <div className="hidden lg:block w-32 shrink-0">Genre</div>
              <div className="hidden md:block w-24 shrink-0">BPM / Key</div>
              <div className="w-16 shrink-0">Ver.</div>
              <div className="w-8 shrink-0 text-center">Vox</div>
              <div className="w-20 shrink-0">Status</div>
              <div className="w-24 shrink-0 text-right">Edited</div>
            </div>
            {filtered.map(project => (
              <LibraryProjectRow
                key={project.id}
                project={project}
                isSelected={selectedId === project.id}
                onClick={() => setSelectedId(selectedId === project.id ? null : project.id)}
                onDelete={() => setProjectPendingDelete(project.id)}
                onToggleFavorite={() => handleToggleFavorite(project.id)}
                onExport={() => void handleExportProject(project.id)}
                onRename={() => openRenameDialog(project.id)}
              />
            ))}
          </div>
        )}

        </div>
      </PageFrame>

      <Dialog open={!!projectPendingDelete} onOpenChange={(open) => !open && setProjectPendingDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Song From Library?</DialogTitle>
            <DialogDescription>
              This will permanently remove the project, its versions, and its generated assets from your local library.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setProjectPendingDelete(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
            >
              Delete Song
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!projectPendingRename} onOpenChange={(open) => !open && setProjectPendingRename(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename Song</DialogTitle>
            <DialogDescription>
              Update the title used across Library, Track Details, and exports.
            </DialogDescription>
          </DialogHeader>
          <Input
            value={renameValue}
            onChange={(event) => setRenameValue(event.target.value)}
            placeholder="Song title"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setProjectPendingRename(null)}>
              Cancel
            </Button>
            <Button onClick={handleConfirmRename} disabled={!renameValue.trim()}>
              Save Title
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isCollectionDialogOpen} onOpenChange={setIsCollectionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create or Assign Collection</DialogTitle>
            <DialogDescription>
              Select songs from your library and group them under one collection name.
            </DialogDescription>
          </DialogHeader>
          <Input
            value={collectionName}
            onChange={(event) => setCollectionName(event.target.value)}
            placeholder="Collection name"
          />
          <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
            {projects.map((project) => (
              <label
                key={project.id}
                className="flex items-center justify-between rounded-lg border border-[var(--riff-surface-highest)] bg-[var(--riff-surface-low)] px-3 py-2"
              >
                <div>
                  <p className="text-sm font-medium text-[var(--riff-text-primary)]">{project.title}</p>
                  <p className="text-xs text-[var(--riff-text-muted)]">{project.collection ?? 'No collection'}</p>
                </div>
                <input
                  type="checkbox"
                  checked={bulkSelectionSet.has(project.id)}
                  onChange={() => toggleBulkSelection(project.id)}
                />
              </label>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCollectionDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleApplyCollection} disabled={!collectionName.trim() || !bulkSelection.length}>
              Save Collection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isExportDialogOpen} onOpenChange={setIsExportDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Export Songs</DialogTitle>
            <DialogDescription>
              Select songs from your library and export their latest version to your computer.
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
            {projects.map((project) => (
              <label
                key={project.id}
                className="flex items-center justify-between rounded-lg border border-[var(--riff-surface-highest)] bg-[var(--riff-surface-low)] px-3 py-2"
              >
                <div>
                  <p className="text-sm font-medium text-[var(--riff-text-primary)]">{project.title}</p>
                  <p className="text-xs text-[var(--riff-text-muted)]">
                    {getProjectVersion(project)?.name ?? 'No version'}
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={bulkSelectionSet.has(project.id)}
                  onChange={() => toggleBulkSelection(project.id)}
                />
              </label>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsExportDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => void handleBulkExport()} disabled={!bulkSelection.length}>
              Export Selected
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

function StatPill({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--riff-surface-low)] border border-[var(--riff-surface-highest)] text-xs">
      <span className="text-[var(--riff-text-muted)]">{icon}</span>
      <span className="text-[var(--riff-text-secondary)] font-medium">{label}</span>
      <span className="font-mono font-bold text-[var(--riff-text-primary)]">{value}</span>
    </div>
  )
}
