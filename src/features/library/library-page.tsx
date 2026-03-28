import { useState, useMemo } from 'react'
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

type ViewMode = 'grid' | 'list'
type TabFilter = 'all' | 'drafts' | 'final' | 'favorites' | 'collections'
type SortMode = 'recent' | 'title' | 'bpm'

export function LibraryPage() {
  const navigate = useNavigate()
  const projects = useProjectStore((state) => state.projects)
  const deleteProject = useProjectStore((state) => state.deleteProject)
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [activeTab, setActiveTab] = useState<TabFilter>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [sortMode, setSortMode] = useState<SortMode>('recent')
  const [projectPendingDelete, setProjectPendingDelete] = useState<string | null>(null)

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
            <button className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-gradient-to-r from-[var(--riff-accent)] to-[var(--riff-accent-focus)] text-white font-bold text-xs tracking-wide shadow-lg hover:shadow-xl transition-all active:scale-[0.98]">
              <Plus className="h-3.5 w-3.5" /> New Track
            </button>
            <button className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-[var(--riff-surface-highest)] text-[var(--riff-text-secondary)] text-xs font-medium hover:bg-[var(--riff-surface-high)] transition-colors">
              <Upload className="h-3.5 w-3.5" /> Import
            </button>
            <button className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-[var(--riff-surface-highest)] text-[var(--riff-text-secondary)] text-xs font-medium hover:bg-[var(--riff-surface-high)] transition-colors">
              <FolderPlus className="h-3.5 w-3.5" /> Collection
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
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {filtered.map(project => (
              <LibraryProjectCard
                key={project.id}
                project={project}
                isSelected={selectedId === project.id}
                onClick={() => setSelectedId(selectedId === project.id ? null : project.id)}
                onDelete={() => setProjectPendingDelete(project.id)}
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
