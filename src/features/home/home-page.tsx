import { PageFrame } from '@/components/layout/page-frame'
import { Button } from '@/components/ui/button'
import { 
  Sparkles, 
  ArrowRight, 
  Mic, 
  Dumbbell, 
  PlusCircle, 
  Music,
  Layout,
  Radio as RadioIcon,
  Compass
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { RECENT_PROJECTS, SUGGESTED_STATIONS, TRENDING_TRACKS } from '@/mocks/mock-data'
import { ProjectCard } from '@/components/shared/project-card'
import { StationCard } from '@/components/shared/station-card'
import { cn } from '@/lib/utils'

export function HomePage() {
  const navigate = useNavigate()

  return (
    <PageFrame className="pb-12">
      {/* Hero Section — The Command Center Entrance */}
      <section className="relative overflow-hidden rounded-[24px] bg-[var(--riff-surface-low)] p-10 mb-12">
        <div className="relative z-10 max-w-2xl">
          <div className="mb-4 flex items-center gap-2 text-[12px] font-bold uppercase tracking-[0.15em] text-[var(--riff-accent-light)]">
            <Sparkles className="h-4 w-4" />
            <span>AI Music Creation Engine v3.0</span>
          </div>
          
          <h1 className="font-display text-4xl font-extrabold tracking-tight text-white mb-4 leading-tight">
            Turn your musical ideas <br />
            <span className="text-[var(--riff-accent-light)]">into finished masterpieces.</span>
          </h1>
          
          <p className="max-w-md text-base text-[var(--riff-text-muted)] mb-8 leading-relaxed">
            Multi-input song generation powered by Lyria. Record, hum, upload, or reference Spotify — build your song blueprints with AI.
          </p>

          <div className="flex items-center gap-4">
            <Button
              className="h-12 px-8 rounded-xl font-bold text-sm bg-[var(--riff-accent)] hover:bg-[var(--riff-accent-light)] transition-all shadow-[0_0_20px_var(--riff-glow)]"
              onClick={() => navigate('/create')}
            >
              Start a Track
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            
            <Button
              variant="ghost"
              className="h-12 px-6 rounded-xl font-semibold text-[var(--riff-text-secondary)] hover:bg-[var(--riff-surface-high)]"
              onClick={() => navigate('/studio')}
            >
              Open Studio
            </Button>
          </div>
        </div>

        {/* Abstract Background Elements */}
        <div className="absolute top-[-50px] right-[-50px] w-80 h-80 rounded-full bg-[var(--riff-accent)] opacity-[0.08] blur-[80px]" />
        <div className="absolute bottom-[-100px] right-[100px] w-120 h-120 rounded-full bg-[#3e82f7] opacity-[0.05] blur-[120px]" />
        
        {/* Visual Cue — floating wave pattern */}
        <div className="absolute top-1/2 right-12 -translate-y-1/2 flex items-end gap-1.5 h-32 opacity-20">
          {[0.4, 0.7, 1, 0.8, 0.5, 0.9, 0.3, 0.6, 1, 0.8, 0.4].map((h, i) => (
            <div 
              key={i} 
              className="w-1.5 rounded-full bg-[var(--riff-accent)]" 
              style={{ height: `${h * 100}%` }}
            />
          ))}
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-12">
        {/* Main Column */}
        <div className="space-y-12">
          {/* Recent Continuity */}
          <section>
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-display text-lg font-bold text-[var(--riff-text-primary)]">
                Continue Creating
              </h3>
              <Button variant="link" className="text-xs text-[var(--riff-accent-light)] p-0" onClick={() => navigate('/library')}>
                View all projects
              </Button>
            </div>
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              {RECENT_PROJECTS.slice(0, 4).map(project => (
                <ProjectCard 
                  key={project.id} 
                  project={project} 
                  onClick={() => navigate(`/track/${project.id}`)}
                />
              ))}
            </div>
          </section>

          {/* Quick Intake Grid */}
          <section>
            <h3 className="font-display text-lg font-bold text-[var(--riff-text-primary)] mb-6">
              Suggested Actions
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <IntakeAction icon={Mic} label="Record a Hum" color="text-amber-400" onClick={() => navigate('/create')} />
              <IntakeAction icon={Music} label="Upload a Riff" color="text-emerald-400" onClick={() => navigate('/create')} />
              <IntakeAction icon={PlusCircle} label="Write Lyrics" color="text-sky-400" onClick={() => navigate('/create')} />
              <IntakeAction icon={Compass} label="Import Spotify" color="text-green-500" onClick={() => navigate('/create')} />
            </div>
          </section>

          {/* Platform supporting layers */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <RadioIcon className="h-4 w-4 text-[var(--riff-text-muted)]" />
                <h4 className="font-display text-sm font-bold text-[var(--riff-text-secondary)] uppercase tracking-wider">Radio Stations</h4>
              </div>
              <div className="space-y-2">
                {SUGGESTED_STATIONS.map(station => (
                  <StationCard key={station.id} title={station.title} description={station.description} listeners={station.count} />
                ))}
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Layout className="h-4 w-4 text-[var(--riff-text-muted)]" />
                <h4 className="font-display text-sm font-bold text-[var(--riff-text-secondary)] uppercase tracking-wider">Community Trending</h4>
              </div>
              <div className="space-y-2">
                {TRENDING_TRACKS.map(track => (
                  <div key={track.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-[var(--riff-surface-low)] transition-colors group cursor-pointer">
                    <img src={track.artistArt} alt="" className="h-8 w-8 rounded-full border border-[var(--riff-surface-highest)]" />
                    <div className="flex-1 overflow-hidden">
                      <p className="truncate text-sm font-medium text-[var(--riff-text-primary)]">{track.title}</p>
                      <p className="truncate text-[11px] text-[var(--riff-text-muted)]">{track.artist}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>

        {/* Sidebar Column */}
        <aside className="space-y-8">
          {/* Coach Promotion */}
          <div className="rounded-2xl bg-[#5233ff]/[0.05] border border-[#5233ff]/[0.1] p-6">
            <div className="flex items-center gap-2 text-[#b0a1ff] font-bold text-[10px] uppercase tracking-widest mb-4">
              <Dumbbell className="h-4 w-4" />
              <span>Coach Mode</span>
            </div>
            <h4 className="text-lg font-bold text-[var(--riff-text-primary)] mb-2">Practice Session</h4>
            <p className="text-sm text-[var(--riff-text-muted)] mb-6"> Rehearse your latest track "Neon Horizon" with real-time feedback. </p>
            <Button 
              variant="outline" 
              className="w-full border-[#5233ff]/[0.2] hover:bg-[#5233ff]/[0.1] text-[#b0a1ff] font-bold"
              onClick={() => navigate('/coach')}
            >
              Start Practice
            </Button>
          </div>

          <div className="p-6 rounded-2xl bg-[var(--riff-surface-low)]">
            <h4 className="font-display text-sm font-bold text-[var(--riff-text-primary)] mb-4">Pro Tip</h4>
            <p className="text-[12px] leading-relaxed text-[var(--riff-text-muted)]">
              Combine a <strong>Hum</strong> with a <strong>Spotify Track</strong> to generate tracks with specific vibe and melody fidelity.
            </p>
          </div>
        </aside>
      </div>
    </PageFrame>
  )
}

function IntakeAction({ 
  icon: Icon, 
  label, 
  color,
  onClick 
}: { 
  icon: any, 
  label: string, 
  color: string,
  onClick: () => void 
}) {
  return (
    <button 
      onClick={onClick}
      className="flex flex-col items-center gap-3 p-4 rounded-xl bg-[var(--riff-surface-low)] hover:bg-[var(--riff-surface-mid)] transition-colors group"
    >
      <div className={cn("flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--riff-surface-mid)] group-hover:scale-110 transition-transform", color)}>
        <Icon className="h-5 w-5" />
      </div>
      <span className="text-xs font-semibold text-[var(--riff-text-muted)] group-hover:text-[var(--riff-text-primary)]">{label}</span>
    </button>
  )
}
