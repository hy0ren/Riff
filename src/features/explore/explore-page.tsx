import { PageFrame } from '@/components/layout/page-frame'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  EXPLORE_FEATURED_TRACK,
  EXPLORE_GENRE_RAILS,
  EXPLORE_RECENT_RELEASES,
  EXPLORE_TRENDING_TRACKS,
} from '@/mocks/mock-data'
import { BookOpen, Compass, Search, Wand2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { DiscoverTrackCard } from './components/discover-track-card'
import { ExploreHero } from './components/explore-hero'
import { GenreRail } from './components/genre-rail'
import { projectRoutes } from '@/features/projects/lib/project-routes'
import { resolveProjectId } from '@/features/projects/lib/project-selectors'

function SectionHeader({ title, action }: { title: string; action?: { label: string; onClick: () => void } }) {
  return (
    <div className="flex items-center justify-between">
      <h3 className="font-display text-lg font-bold text-[var(--riff-text-primary)]">{title}</h3>
      {action && (
        <Button variant="link" className="h-auto p-0 text-[12px] text-[var(--riff-accent-light)]" onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  )
}

export function ExplorePage() {
  const navigate = useNavigate()

  return (
    <PageFrame>
      <div className="mx-auto max-w-[1400px] space-y-10 px-8 py-6 pb-16">
        {/* Header */}
        <div className="flex items-start justify-between gap-6">
          <div>
            <div className="flex items-center gap-2.5">
              <Compass className="h-5 w-5 text-[var(--riff-accent-light)]" />
              <h1 className="font-display text-xl font-bold text-[var(--riff-text-primary)]">Explore</h1>
            </div>
            <p className="mt-1 text-sm text-[var(--riff-text-muted)]">
              Discover public tracks, creators, and remix culture inside the Riff ecosystem
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--riff-text-faint)]" />
              <Input placeholder="Search tracks, creators..." className="h-9 w-64 rounded-lg pl-9 text-sm" />
            </div>
            <Button
              variant="outline"
              size="sm"
              className="h-9 gap-1.5 rounded-lg text-[12px]"
              onClick={() => navigate(projectRoutes.learn(resolveProjectId(EXPLORE_FEATURED_TRACK.id)))}
            >
              <BookOpen className="h-3.5 w-3.5" /> Open Learn
            </Button>
            <Button variant="outline" size="sm" className="h-9 gap-1.5 rounded-lg text-[12px]" onClick={() => navigate('/create')}>
              <Wand2 className="h-3.5 w-3.5" /> Remix a Track
            </Button>
          </div>
        </div>

        {/* Featured Hero */}
        <ExploreHero
          track={EXPLORE_FEATURED_TRACK}
          onPlay={() => {}}
          onViewTrack={() => navigate(projectRoutes.details(resolveProjectId(EXPLORE_FEATURED_TRACK.id)))}
          onRemix={() => navigate('/create')}
          onOpenLearn={() => navigate(projectRoutes.learn(resolveProjectId(EXPLORE_FEATURED_TRACK.id)))}
        />

        {/* Trending Tracks */}
        <section className="space-y-4">
          <SectionHeader title="Trending Now" action={{ label: 'See all', onClick: () => {} }} />
          <div className="grid grid-cols-4 gap-4">
            {EXPLORE_TRENDING_TRACKS.slice(0, 8).map((track) => (
              <DiscoverTrackCard
                key={track.id}
                track={track}
                onPlay={() => {}}
                onSave={() => {}}
                onRemix={() => navigate('/create')}
                onOpen={() => navigate(projectRoutes.details(resolveProjectId(track.id)))}
              />
            ))}
          </div>
        </section>

        {/* Genre Discovery Rails */}
        <section className="space-y-4">
          <SectionHeader title="Browse by Genre" />
          <GenreRail items={EXPLORE_GENRE_RAILS} onSelect={() => {}} />
        </section>

        {/* Recent Releases */}
        <section className="space-y-4">
          <SectionHeader title="Fresh Releases" action={{ label: 'See all', onClick: () => {} }} />
          <div className="grid grid-cols-4 gap-4">
            {EXPLORE_RECENT_RELEASES.map((track) => (
              <DiscoverTrackCard
                key={track.id}
                track={track}
                onPlay={() => {}}
                onSave={() => {}}
                onRemix={() => navigate('/create')}
                onOpen={() => navigate(projectRoutes.details(resolveProjectId(track.id)))}
              />
            ))}
          </div>
        </section>
      </div>
    </PageFrame>
  )
}
