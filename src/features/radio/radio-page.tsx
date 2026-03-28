import { PageFrame } from '@/components/layout/page-frame'
import { ScrollArea } from '@/components/ui/scroll-area'
import type { TuningState } from '@/domain/radio'
import {
  RADIO_ACTIVE_STATION,
  RADIO_DEFAULT_TUNING,
  RADIO_HISTORY,
  RADIO_NOW_PLAYING,
  RADIO_QUEUE,
  RADIO_SAVED_STATIONS,
} from '@/mocks/mock-data'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ListeningHistory } from './components/listening-history'
import { NowPlayingPanel } from './components/now-playing-panel'
import { SavedStations } from './components/saved-stations'
import { StationHero } from './components/station-hero'
import { StationQueue } from './components/station-queue'
import { TuningPanel } from './components/tuning-panel'
import { usePlaybackStore } from '@/features/playback/store/use-playback-store'
import { toRadioPlayableTrack } from '@/features/playback/lib/playable-track'

export function RadioPage() {
  const navigate = useNavigate()
  const { currentTrack, setTrack, play, pause } = usePlaybackStore()

  const [station, setStation] = useState(RADIO_ACTIVE_STATION)
  const [track] = useState(RADIO_NOW_PLAYING)
  const [queue, setQueue] = useState(RADIO_QUEUE)
  const [savedStations, setSavedStations] = useState(RADIO_SAVED_STATIONS)
  const [tuning, setTuning] = useState<TuningState>(RADIO_DEFAULT_TUNING)

  // Station controls
  const handlePlayPause = () => {
    const playableTrack = toRadioPlayableTrack(track)

    if (!currentTrack || currentTrack.id !== playableTrack.id) {
      setTrack(playableTrack)
    } else if (station.isPlaying) {
      pause()
    } else {
      play()
    }

    setStation((s) => ({ ...s, isPlaying: !s.isPlaying }))
  }

  const handleSaveStation = () => {
    setStation((s) => ({ ...s, isSaved: !s.isSaved }))
  }

  const handleTune = () => {
    // In a real app, could scroll to tuning panel or open a sheet
  }

  const handleNewStation = () => {
    navigate('/create')
  }

  const handleShare = () => {
    // Share station
  }

  // Track controls
  const handleLike = () => {}
  const handleDislike = () => {}
  const handleSaveTrack = () => {}
  const handleRemix = () => navigate('/create')
  const handleMoreLikeThis = () => {}
  const handleSkipTrack = () => {}
  const handleSeek = (_seconds: number) => {}

  // Queue controls
  const handleQueueSkip = (id: string) => {
    setQueue((q) => q.filter((item) => item.id !== id))
  }

  const handleQueueRemove = (id: string) => {
    setQueue((q) => q.filter((item) => item.id !== id))
  }

  const handleQueuePinNext = (id: string) => {
    setQueue((q) => {
      const item = q.find((i) => i.id === id)
      if (!item) return q
      const rest = q.filter((i) => i.id !== id)
      return [{ ...item, isPinned: true }, ...rest.map((i) => ({ ...i, isPinned: false }))]
    })
  }

  const handleQueueDislike = (id: string) => {
    setQueue((q) => q.filter((item) => item.id !== id))
  }

  const handleQueueRemix = (_id: string) => navigate('/create')

  const handleStartStationFrom = (_id: string) => {}

  const handleClearQueue = () => setQueue([])

  // Tuning controls
  const handleTuningChange = (key: keyof TuningState, value: number | boolean) => {
    setTuning((t) => ({ ...t, [key]: value }))
  }

  const handleTuningReset = () => {
    setTuning(RADIO_DEFAULT_TUNING)
  }

  // Station cards
  const handleLaunchStation = (_id: string) => {}

  const handleSaveStationCard = (id: string) => {
    setSavedStations((ss) =>
      ss.map((s) => (s.id === id ? { ...s, isSaved: !s.isSaved } : s))
    )
  }

  // History
  const handleRelaunch = (_item: (typeof RADIO_HISTORY)[0]) => {}

  return (
    <PageFrame fullBleed>
      {/* Station Hero — top identity surface */}
      <StationHero
        station={station}
        onPlayPause={handlePlayPause}
        onSave={handleSaveStation}
        onTune={handleTune}
        onNewStation={handleNewStation}
        onShare={handleShare}
      />

      {/* Content body — 2-column layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left column: Now Playing + Queue */}
        <ScrollArea className="flex-1">
          <div className="space-y-4 px-8 py-6 pb-10">
            {/* Now Playing */}
            <section>
              <div className="mb-3 flex items-center gap-2">
                <div
                  className="h-1.5 w-1.5 rounded-full"
                  style={{
                    background: station.isPlaying ? 'var(--riff-accent)' : 'var(--riff-text-faint)',
                    boxShadow: station.isPlaying ? '0 0 6px var(--riff-accent)' : 'none',
                  }}
                />
                <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--riff-text-faint)]">
                  {station.isPlaying ? 'Now Playing' : 'Paused'}
                </span>
              </div>
              <NowPlayingPanel
                track={track}
                isPlaying={station.isPlaying}
                onLike={handleLike}
                onDislike={handleDislike}
                onSave={handleSaveTrack}
                onRemix={handleRemix}
                onMoreLikeThis={handleMoreLikeThis}
                onSkip={handleSkipTrack}
                onSeek={handleSeek}
              />
            </section>

            {/* Station Queue */}
            <section>
              <StationQueue
                items={queue}
                onSkip={handleQueueSkip}
                onRemove={handleQueueRemove}
                onPinNext={handleQueuePinNext}
                onDislike={handleQueueDislike}
                onRemix={handleQueueRemix}
                onStartStationFrom={handleStartStationFrom}
                onClearQueue={handleClearQueue}
              />
            </section>
          </div>
        </ScrollArea>

        {/* Right panel: Tuning + Stations + History */}
        <aside
          className="flex w-[380px] shrink-0 flex-col overflow-hidden"
          style={{
            borderLeft: '1px solid rgba(255,255,255,0.04)',
            background: 'var(--riff-base)',
          }}
        >
          <ScrollArea className="flex-1">
            <div className="space-y-4 px-5 py-6 pb-10">
              <TuningPanel
                tuning={tuning}
                onChange={handleTuningChange}
                onReset={handleTuningReset}
              />
              <SavedStations
                stations={savedStations}
                onLaunch={handleLaunchStation}
                onSave={handleSaveStationCard}
              />
              <ListeningHistory
                items={RADIO_HISTORY}
                onRelaunch={handleRelaunch}
              />
            </div>
          </ScrollArea>
        </aside>
      </div>
    </PageFrame>
  )
}
