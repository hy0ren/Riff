import { useCallback, useEffect, useRef, useState } from 'react'
import type { LucideIcon } from 'lucide-react'
import {
  ChevronDown,
  ChevronRight,
  Compass,
  FileText,
  Loader2,
  Mic,
  Music,
  PauseCircle,
  PlusCircle,
  Search,
  Share,
  Sparkles,
  Type,
  Upload,
  X,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { PageFrame } from '@/components/layout/page-frame'
import { SourceCard } from '@/components/shared/source-card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import type { SourceSelectionType } from '@/domain/source-input'
import { projectRoutes } from '@/features/projects/lib/project-routes'
import { useProjectStore } from '@/features/projects/store/use-project-store'
import { useStudioStore } from '@/features/studio/store/use-studio-store'
import { cn } from '@/lib/utils'
import { getProjectVersion } from '@/features/projects/lib/project-selectors'
import {
  beginSpotifyAuthorization,
  ensureSpotifyAccessToken,
} from '@/lib/providers/spotify-gateway'
import { analyzeAudioSource } from '@/lib/providers/gemini-gateway'
import {
  blobToDataUrl,
  fileToDataUrl,
  inferAudioFileFormat,
  measureAudioDuration,
} from './lib/audio-assets'
import {
  createProjectFromSelection,
  type CreateSourceSelectionDraft,
} from './lib/create-project-from-selection'
import {
  analyzeSheetMusicFile,
  buildChordSectionSuggestion,
  inferKeyFromChordText,
} from '@/lib/music-analysis'
import {
  getSpotifyConnectionStatus,
  useIntegrationStore,
} from '@/features/integrations/store/use-integration-store'
import { fetchSpotifyPlaylistTracks } from '@/services/spotify/client'
import type { SpotifyReferenceImport } from '@/domain/providers'

interface SourceOption {
  type: SourceSelectionType
  label: string
  description: string
  icon: LucideIcon
}

type AudioSelectionType = 'hum' | 'riff'
type SourceDraftMap = Partial<Record<SourceSelectionType, CreateSourceSelectionDraft>>

const SOURCE_OPTIONS: SourceOption[] = [
  {
    type: 'hum',
    label: 'Record a Hum',
    description: 'Capture a melody live or upload a vocal memo for Gemini to decode.',
    icon: Mic,
  },
  {
    type: 'riff',
    label: 'Upload a Riff',
    description: 'Record or import a guitar phrase, loop, or instrumental idea.',
    icon: Music,
  },
  {
    type: 'lyrics',
    label: 'Write Lyrics',
    description: 'Build a song around specific words.',
    icon: FileText,
  },
  {
    type: 'chords',
    label: 'Chord Sequence',
    description: 'Define the harmonic spine of the track.',
    icon: Type,
  },
  {
    type: 'sheet',
    label: 'Sheet Music',
    description: 'Upload notation or MIDI scores.',
    icon: PlusCircle,
  },
  {
    type: 'spotify',
    label: 'Spotify Vibe',
    description: 'Use a track as a reference for mood.',
    icon: Compass,
  },
  {
    type: 'remix',
    label: 'Remix Track',
    description: 'Rebuild an existing project or song.',
    icon: Share,
  },
]

function defaultDraftForType(type: SourceSelectionType): CreateSourceSelectionDraft {
  switch (type) {
    case 'hum':
      return {
        type,
        label: 'Hum Recording',
        description: 'Lead with a hummed melodic idea.',
      }
    case 'riff':
      return {
        type,
        label: 'Riff Input',
        description: 'Import a riff, loop, or guitar phrase.',
      }
    case 'lyrics':
      return {
        type,
        label: 'Lyric Draft',
        description: 'Words and lyrical direction for the song.',
        lyricSections: {
          verse: 'Midnight hallway / city glow / hold the note and let it go',
          chorus: 'Stay with me through neon light / carry the sound into the night',
          bridge: '',
        },
        text: '',
      }
    case 'chords':
      return {
        type,
        label: 'Chord Progression',
        description: 'Harmonic spine for the arrangement.',
        text: 'Fm - Db - Ab - Eb',
        keyChangeAfterBridge: false,
      }
    case 'sheet':
      return {
        type,
        label: 'Sheet Music Upload',
        description: 'Notation or lead sheet reference.',
      }
    case 'spotify':
      return {
        type,
        label: 'Spotify Reference',
        description: 'Taste and vibe reference from Spotify.',
      }
    case 'remix':
      return {
        type,
        label: 'Remix Source',
        description: 'Rework an existing project into a new version.',
      }
  }
}

function isAudioSelectionType(type: SourceSelectionType): type is AudioSelectionType {
  return type === 'hum' || type === 'riff'
}

function formatDuration(durationSeconds?: number): string {
  if (!durationSeconds || durationSeconds <= 0) {
    return '0:00'
  }

  const minutes = Math.floor(durationSeconds / 60)
  const seconds = Math.round(durationSeconds % 60)
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

export function CreatePage() {
  const navigate = useNavigate()
  const [selectedTypes, setSelectedTypes] = useState<SourceSelectionType[]>([])
  const [sourceDrafts, setSourceDrafts] = useState<SourceDraftMap>({})
  const [isCreating, setIsCreating] = useState(false)
  const [activeRecordingType, setActiveRecordingType] = useState<AudioSelectionType | null>(null)
  const [recordingError, setRecordingError] = useState<string | null>(null)
  const [audioAnalysisByType, setAudioAnalysisByType] = useState<Partial<Record<AudioSelectionType, 'idle' | 'analyzing' | 'ready' | 'failed'>>>({})
  const upsertProject = useProjectStore((state) => state.upsertProject)
  const projects = useProjectStore((state) => state.projects)
  const spotify = useIntegrationStore((state) => state.spotify)
  const setSpotifyAuth = useIntegrationStore((state) => state.setSpotifyAuth)

  // Spotify picker state
  const [spotifySearch, setSpotifySearch] = useState('')
  const [spotifyTab, setSpotifyTab] = useState<'tracks' | 'playlists'>('tracks')
  const [expandedPlaylistId, setExpandedPlaylistId] = useState<string | null>(null)
  const [playlistTracksCache, setPlaylistTracksCache] = useState<Map<string, SpotifyReferenceImport[]>>(new Map())
  const [loadingPlaylistId, setLoadingPlaylistId] = useState<string | null>(null)
  const recorderRef = useRef<MediaRecorder | null>(null)
  const recorderChunksRef = useRef<Blob[]>([])
  const recorderStreamRef = useRef<MediaStream | null>(null)

  const releaseRecorderStream = () => {
    recorderStreamRef.current?.getTracks().forEach((track) => track.stop())
    recorderStreamRef.current = null
  }

  useEffect(() => {
    return () => {
      recorderRef.current?.stop()
      releaseRecorderStream()
    }
  }, [])

  const setDraft = (
    type: SourceSelectionType,
    updater: (draft: CreateSourceSelectionDraft) => CreateSourceSelectionDraft,
  ) => {
    setSourceDrafts((current) => {
      const previousDraft = current[type] ?? defaultDraftForType(type)
      return {
        ...current,
        [type]: updater(previousDraft),
      }
    })
  }

  const toggleSource = (type: SourceSelectionType) => {
    setSelectedTypes((current) => {
      if (current.includes(type)) {
        return current.filter((candidate) => candidate !== type)
      }

      return [...current, type]
    })

    setSourceDrafts((current) => ({
      ...current,
      [type]: current[type] ?? defaultDraftForType(type),
    }))
  }

  const handleAudioUpload = async (type: AudioSelectionType, file: File) => {
    setRecordingError(null)

    const audioDataUrl = await fileToDataUrl(file)
    const durationSeconds = await measureAudioDuration(audioDataUrl)
    const fileFormat = inferAudioFileFormat(file.name, file.type)

    setDraft(type, (draft) => ({
      ...draft,
      audioDataUrl,
      durationSeconds,
      fileName: file.name,
      fileFormat,
      label: draft.label ?? (type === 'hum' ? 'Hum Recording' : 'Riff Input'),
      description:
        type === 'hum'
          ? 'Recorded vocal melody for Gemini analysis.'
          : 'Uploaded riff for Gemini rhythm and tonal analysis.',
    }))

    setAudioAnalysisByType((current) => ({ ...current, [type]: 'analyzing' }))
    try {
      const analysis = await analyzeAudioSource({
        sourceType: type,
        label: file.name,
        notes: type === 'hum' ? 'Prefer melodic contour and implied harmony.' : 'Prefer groove, riff harmony, and tempo.',
        audioDataUrl,
        durationSeconds,
      })

      setDraft(type, (draft) => ({
        ...draft,
        detectedBpm: analysis.bpm,
        detectedKey: analysis.key,
        detectedMode: analysis.mode,
        detectedChordProgression: analysis.likelyChords,
        analysisSummary: analysis.summary,
      }))
      setAudioAnalysisByType((current) => ({ ...current, [type]: 'ready' }))
    } catch {
      setAudioAnalysisByType((current) => ({ ...current, [type]: 'failed' }))
    }
  }

  const handleStartRecording = async (type: AudioSelectionType) => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setRecordingError('Recording is not supported in this environment.')
      return
    }

    setRecordingError(null)

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const preferredMimeType =
        MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
          ? 'audio/webm;codecs=opus'
          : MediaRecorder.isTypeSupported('audio/webm')
            ? 'audio/webm'
            : ''

      const recorder = preferredMimeType
        ? new MediaRecorder(stream, { mimeType: preferredMimeType })
        : new MediaRecorder(stream)

      recorderChunksRef.current = []
      recorderStreamRef.current = stream
      recorderRef.current = recorder
      setActiveRecordingType(type)

      recorder.addEventListener('dataavailable', (event) => {
        if (event.data.size > 0) {
          recorderChunksRef.current.push(event.data)
        }
      })

      recorder.addEventListener('stop', async () => {
        try {
          const audioBlob = new Blob(recorderChunksRef.current, {
            type: recorder.mimeType || 'audio/webm',
          })
          const audioDataUrl = await blobToDataUrl(audioBlob)
          const durationSeconds = await measureAudioDuration(audioDataUrl)
          const fileFormat = inferAudioFileFormat(undefined, audioBlob.type)
          const recordedFileName = `${type}-${Date.now()}.${fileFormat ?? 'webm'}`

          setDraft(type, (draft) => ({
            ...draft,
            audioDataUrl,
            durationSeconds,
            fileName: recordedFileName,
            fileFormat,
            label: draft.label ?? (type === 'hum' ? 'Hum Recording' : 'Riff Input'),
            description:
              type === 'hum'
                ? 'Live-recorded melodic phrase for Gemini analysis.'
                : 'Live-recorded riff for Gemini rhythm and tonal analysis.',
          }))

          setAudioAnalysisByType((current) => ({ ...current, [type]: 'analyzing' }))
          try {
            const analysis = await analyzeAudioSource({
              sourceType: type,
              label: recordedFileName,
              notes: type === 'hum' ? 'Prefer melodic contour and implied harmony.' : 'Prefer groove, riff harmony, and tempo.',
              audioDataUrl,
              durationSeconds,
            })

            setDraft(type, (draft) => ({
              ...draft,
              detectedBpm: analysis.bpm,
              detectedKey: analysis.key,
              detectedMode: analysis.mode,
              detectedChordProgression: analysis.likelyChords,
              analysisSummary: analysis.summary,
            }))
            setAudioAnalysisByType((current) => ({ ...current, [type]: 'ready' }))
          } catch {
            setAudioAnalysisByType((current) => ({ ...current, [type]: 'failed' }))
          }
        } catch (error) {
          setRecordingError(
            error instanceof Error ? error.message : 'Failed to process recorded audio.',
          )
        } finally {
          recorderRef.current = null
          recorderChunksRef.current = []
          releaseRecorderStream()
          setActiveRecordingType(null)
        }
      })

      recorder.start()
    } catch (error) {
      releaseRecorderStream()
      setActiveRecordingType(null)
      setRecordingError(
        error instanceof Error ? error.message : 'Microphone access failed.',
      )
    }
  }

  const handleStopRecording = () => {
    if (!recorderRef.current) {
      return
    }

    recorderRef.current.stop()
  }

  const hasSelection = selectedTypes.length > 0
  const spotifyConnectionStatus = getSpotifyConnectionStatus(spotify.auth)
  const spotifyConnected = spotifyConnectionStatus === 'connected'
  const remixableProjects = projects.filter((project) => Boolean(getProjectVersion(project)?.audioUrl))
  const requiresAudioInput = selectedTypes.some((type) => isAudioSelectionType(type))
  const missingAudioInput = selectedTypes.some(
    (type) => isAudioSelectionType(type) && !sourceDrafts[type]?.audioDataUrl,
  )
  const missingSheetInput =
    selectedTypes.includes('sheet') && !sourceDrafts.sheet?.assetDataUrl
  const missingRemixSelection =
    selectedTypes.includes('remix') &&
    (!sourceDrafts.remix?.sourceProjectId || !sourceDrafts.remix?.sourceVersionId)
  const spotifyRequiredButUnlinked =
    selectedTypes.includes('spotify') &&
    (!spotifyConnected || (!spotify.topTracks.length && !spotify.playlists.length))
  const canContinue =
    hasSelection &&
    !isCreating &&
    !activeRecordingType &&
    (!requiresAudioInput || !missingAudioInput) &&
    !missingSheetInput &&
    !missingRemixSelection &&
    !spotifyRequiredButUnlinked

  const selectedSources = selectedTypes.map(
    (type) => sourceDrafts[type] ?? defaultDraftForType(type),
  )
  const chordDraft = sourceDrafts.chords ?? defaultDraftForType('chords')
  const chordInference = inferKeyFromChordText(chordDraft.text ?? '')
  const chordSectionSuggestion = buildChordSectionSuggestion(chordDraft.text ?? '', {
    keyChangeAfterBridge: chordDraft.keyChangeAfterBridge,
  })

  const handleLoadPlaylistTracks = useCallback(async (playlistId: string) => {
    if (playlistTracksCache.has(playlistId)) {
      setExpandedPlaylistId((current) => (current === playlistId ? null : playlistId))
      return
    }

    setLoadingPlaylistId(playlistId)
    setExpandedPlaylistId(playlistId)

    try {
      const auth = await ensureSpotifyAccessToken(spotify.auth)
      if (!auth.accessToken) {
        return
      }

      const tracks = await fetchSpotifyPlaylistTracks(playlistId, auth.accessToken)
      setPlaylistTracksCache((current) => new Map(current).set(playlistId, tracks))
    } catch {
      setExpandedPlaylistId(null)
    } finally {
      setLoadingPlaylistId(null)
    }
  }, [playlistTracksCache, spotify.auth])

  const handleContinue = async () => {
    if (!canContinue) {
      return
    }

    setIsCreating(true)
    const project = createProjectFromSelection(selectedSources)
    upsertProject(project)

    try {
      await useStudioStore.getState().refreshInterpretation(project.id)
    } catch {
      // The Studio will still open with the local fallback interpretation.
    }

    navigate(projectRoutes.studio(project.id))
  }

  const handleConnectSpotify = async () => {
    const authStart = await beginSpotifyAuthorization()
    setSpotifyAuth(authStart.pendingAuth)
    window.location.assign(authStart.authorizeUrl)
  }

  const handleSheetUpload = async (file: File) => {
    const assetDataUrl = await fileToDataUrl(file)
    const analysis = await analyzeSheetMusicFile(file)
    const extension = file.name.split('.').pop()?.toLowerCase()
    const fileFormat =
      extension === 'mid' || extension === 'midi'
        ? 'midi'
        : extension === 'musicxml' || extension === 'xml' || extension === 'mxl'
          ? 'musicxml'
          : 'pdf'

    setDraft('sheet', (draft) => ({
      ...draft,
      assetDataUrl,
      fileName: file.name,
      fileFormat,
      label: draft.label ?? 'Sheet Music Upload',
      description:
        fileFormat === 'pdf'
          ? 'Uploaded notation PDF for structural interpretation.'
          : 'Uploaded notation file for harmonic and structural interpretation.',
      detectedKey: analysis.key,
      detectedMode: analysis.mode,
      detectedBpm: analysis.bpm,
    }))
  }

  const handleSelectRemixProject = (projectId: string) => {
    const sourceProject = projects.find((project) => project.id === projectId)
    const sourceVersion = sourceProject ? getProjectVersion(sourceProject) : undefined
    if (!sourceProject || !sourceVersion) {
      return
    }

    setDraft('remix', (draft) => ({
      ...draft,
      label: `${sourceProject.title} Remix`,
      description: `Remix the generated version "${sourceVersion.name}" from your library.`,
      sourceProjectId: sourceProject.id,
      sourceVersionId: sourceVersion.id,
      audioDataUrl: sourceVersion.audioUrl,
      durationSeconds: sourceVersion.duration,
      fileName: `${sourceProject.title}-${sourceVersion.name}.wav`,
      fileFormat: 'wav',
    }))
  }

  return (
    <PageFrame
      title="Create"
      subtitle="Attach real source material, let Gemini decode it, and open Studio with a prefilled draft."
      className="pb-[120px]"
    >
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {SOURCE_OPTIONS.map((option) => (
          <SourceCard
            key={option.type}
            type={option.type}
            label={option.label}
            description={option.description}
            icon={option.icon}
            selected={selectedTypes.includes(option.type)}
            onClick={() => toggleSource(option.type)}
          />
        ))}

        <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-[var(--riff-surface-mid)] bg-[rgba(255,255,255,0.02)] p-6">
          <p className="text-center text-[11px] leading-relaxed text-[var(--riff-text-faint)]">
            Real audio works best now.
            <br />
            Try <strong>Hum + Chords</strong> or <strong>Riff + Lyrics</strong>.
          </p>
        </div>
      </div>

      {(selectedTypes.length > 0 || recordingError) && (
        <div className="mt-8 grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-5">
            {selectedTypes
              .filter((type) => isAudioSelectionType(type))
              .map((type) => {
                const option = SOURCE_OPTIONS.find((candidate) => candidate.type === type)
                const draft = sourceDrafts[type] ?? defaultDraftForType(type)
                const isRecording = activeRecordingType === type
                const audioAnalysisState = audioAnalysisByType[type] ?? 'idle'

                return (
                  <section
                    key={type}
                    className="rounded-2xl border border-[var(--riff-surface-high)] bg-[var(--riff-surface-highest)]/70 p-5"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1">
                        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--riff-accent-light)]">
                          Audio Source
                        </p>
                        <h3 className="font-display text-xl text-[var(--riff-text-primary)]">
                          {option?.label}
                        </h3>
                        <p className="max-w-xl text-sm text-[var(--riff-text-muted)]">
                          Gemini will inspect the audio itself and prefill tempo, tonal center,
                          mood, energy, instrumentation lean, and melodic direction.
                        </p>
                      </div>
                      <div className="rounded-full border border-[var(--riff-surface-high)] bg-[var(--riff-surface-low)] px-3 py-1 text-[11px] font-semibold text-[var(--riff-text-secondary)]">
                        {audioAnalysisState === 'analyzing'
                          ? 'Analyzing Audio'
                          : draft.audioDataUrl
                            ? 'Ready'
                            : 'Audio Required'}
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap items-center gap-3">
                      <label htmlFor={`upload-${type}`}>
                        <input
                          id={`upload-${type}`}
                          type="file"
                          accept="audio/*"
                          className="hidden"
                          onChange={(event) => {
                            const file = event.target.files?.[0]
                            if (!file) {
                              return
                            }

                            void handleAudioUpload(type, file)
                            event.currentTarget.value = ''
                          }}
                        />
                        <span className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-[var(--riff-surface-high)] bg-[var(--riff-surface-low)] px-4 py-2 text-sm font-semibold text-[var(--riff-text-primary)] transition hover:border-[var(--riff-accent)] hover:text-[var(--riff-accent-light)]">
                          <Upload className="h-4 w-4" />
                          Upload Audio
                        </span>
                      </label>

                      {isRecording ? (
                        <Button
                          type="button"
                          variant="destructive"
                          className="gap-2 rounded-xl"
                          onClick={handleStopRecording}
                        >
                          <PauseCircle className="h-4 w-4" />
                          Stop Recording
                        </Button>
                      ) : (
                        <Button
                          type="button"
                          variant="outline"
                          className="gap-2 rounded-xl"
                          onClick={() => void handleStartRecording(type)}
                          disabled={Boolean(activeRecordingType)}
                        >
                          <Mic className="h-4 w-4" />
                          Record Live Input
                        </Button>
                      )}

                      {isRecording && (
                        <span className="inline-flex items-center gap-2 text-sm font-medium text-rose-300">
                          <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-rose-400" />
                          Recording now
                        </span>
                      )}
                    </div>

                    <div className="mt-4 grid gap-3 md:grid-cols-2">
                      <Input
                        value={draft.label ?? ''}
                        onChange={(event) =>
                          setDraft(type, (currentDraft) => ({
                            ...currentDraft,
                            label: event.target.value,
                          }))
                        }
                        className="border-[var(--riff-surface-high)] bg-[var(--riff-surface)]"
                        placeholder="Source name"
                      />
                      <Input
                        value={draft.description ?? ''}
                        onChange={(event) =>
                          setDraft(type, (currentDraft) => ({
                            ...currentDraft,
                            description: event.target.value,
                          }))
                        }
                        className="border-[var(--riff-surface-high)] bg-[var(--riff-surface)]"
                        placeholder="What should Gemini listen for?"
                      />
                    </div>

                    {draft.audioDataUrl ? (
                      <div className="mt-4 rounded-2xl border border-[var(--riff-surface-high)] bg-[var(--riff-surface-low)] p-4">
                        <div className="mb-3 flex items-center justify-between gap-3 text-sm">
                          <div>
                            <p className="font-semibold text-[var(--riff-text-primary)]">
                              {draft.fileName ?? 'Captured audio'}
                            </p>
                            <p className="text-[var(--riff-text-muted)]">
                              {formatDuration(draft.durationSeconds)} • {draft.fileFormat ?? 'audio'}
                            </p>
                          </div>
                          <span className="rounded-full bg-emerald-500/15 px-2.5 py-1 text-[11px] font-semibold text-emerald-300">
                            {audioAnalysisState === 'analyzing' ? 'Gemini listening…' : 'Ready for Gemini'}
                          </span>
                        </div>
                        {(draft.detectedKey || draft.detectedBpm || draft.detectedChordProgression?.length) && (
                          <div className="mb-3 flex flex-wrap gap-2">
                            {draft.detectedKey ? (
                              <span className="rounded-full bg-[var(--riff-accent)]/15 px-3 py-1 text-xs font-semibold text-[var(--riff-accent-light)]">
                                Detected key: {draft.detectedKey} {draft.detectedMode}
                              </span>
                            ) : null}
                            {draft.detectedBpm ? (
                              <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-semibold text-emerald-300">
                                Detected BPM: {draft.detectedBpm}
                              </span>
                            ) : null}
                            {draft.detectedChordProgression?.length ? (
                              <span className="rounded-full bg-amber-500/15 px-3 py-1 text-xs font-semibold text-amber-200">
                                Chords: {draft.detectedChordProgression.join(' - ')}
                              </span>
                            ) : null}
                          </div>
                        )}
                        {draft.analysisSummary ? (
                          <p className="mb-3 text-xs text-[var(--riff-text-muted)]">{draft.analysisSummary}</p>
                        ) : null}
                        <audio controls src={draft.audioDataUrl} className="w-full" />
                      </div>
                    ) : (
                      <div className="mt-4 rounded-2xl border border-dashed border-[var(--riff-surface-high)] bg-[var(--riff-surface-low)] px-4 py-5 text-sm text-[var(--riff-text-muted)]">
                        Upload or record audio to let Gemini decode this source and seed the
                        Studio draft automatically.
                      </div>
                    )}
                  </section>
                )
              })}

            {selectedTypes.includes('lyrics') && (
              <section className="rounded-2xl border border-[var(--riff-surface-high)] bg-[var(--riff-surface-highest)]/70 p-5">
                <h3 className="font-display text-xl text-[var(--riff-text-primary)]">Lyrics</h3>
                <p className="mt-1 text-sm text-[var(--riff-text-muted)]">
                  Shape the lyric intent by section so Gemini knows what belongs in the verse, chorus, and bridge.
                </p>
                <div className="mt-4 grid gap-4">
                  {([
                    ['verse', 'Verse', 'Use this for the story setup and scene-setting lines.'],
                    ['chorus', 'Chorus', 'Use this for the hook, title line, or emotional payoff.'],
                    ['bridge', 'Bridge', 'Use this for the contrast or emotional turn before the final chorus.'],
                  ] as Array<['verse' | 'chorus' | 'bridge', string, string]>).map(([sectionKey, label, helper]) => (
                    <div key={sectionKey} className="space-y-2">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--riff-text-muted)]">
                          {label}
                        </p>
                        <p className="mt-1 text-xs text-[var(--riff-text-faint)]">{helper}</p>
                      </div>
                      <Textarea
                        value={sourceDrafts.lyrics?.lyricSections?.[sectionKey] ?? defaultDraftForType('lyrics').lyricSections?.[sectionKey] ?? ''}
                        rows={4}
                        onChange={(event) =>
                          setDraft('lyrics', (draft) => ({
                            ...draft,
                            lyricSections: {
                              ...draft.lyricSections,
                              [sectionKey]: event.target.value,
                            },
                          }))
                        }
                        className="border-[var(--riff-surface-high)] bg-[var(--riff-surface)]"
                      />
                    </div>
                  ))}

                  <div className="space-y-2">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--riff-text-muted)]">
                        Additional Notes
                      </p>
                      <p className="mt-1 text-xs text-[var(--riff-text-faint)]">
                        Add extra lyric ideas, ad-libs, or delivery notes that do not belong to one section.
                      </p>
                    </div>
                    <Textarea
                      value={sourceDrafts.lyrics?.text ?? defaultDraftForType('lyrics').text ?? ''}
                      rows={3}
                      onChange={(event) =>
                        setDraft('lyrics', (draft) => ({
                          ...draft,
                          text: event.target.value,
                        }))
                      }
                      className="border-[var(--riff-surface-high)] bg-[var(--riff-surface)]"
                    />
                  </div>
                </div>
              </section>
            )}

            {selectedTypes.includes('chords') && (
              <section className="rounded-2xl border border-[var(--riff-surface-high)] bg-[var(--riff-surface-highest)]/70 p-5">
                <h3 className="font-display text-xl text-[var(--riff-text-primary)]">Chord Sequence</h3>
                <p className="mt-1 text-sm text-[var(--riff-text-muted)]">
                  Use a simple progression and Riff will infer the likely key, then map it into verse, chorus, bridge, and a lift-ready final chorus.
                </p>
                <Textarea
                  value={sourceDrafts.chords?.text ?? defaultDraftForType('chords').text ?? ''}
                  rows={4}
                  onChange={(event) =>
                    setDraft('chords', (draft) => {
                      const nextText = event.target.value
                      const nextInference = inferKeyFromChordText(nextText)
                      const nextSuggestion = buildChordSectionSuggestion(nextText, {
                        keyChangeAfterBridge: draft.keyChangeAfterBridge,
                      })

                      return {
                        ...draft,
                        text: nextText,
                        detectedKey: nextInference?.key,
                        detectedMode: nextInference?.mode,
                        postBridgeKey: nextSuggestion?.postBridgeKey,
                      }
                    })
                  }
                  className="mt-4 border-[var(--riff-surface-high)] bg-[var(--riff-surface)]"
                />
                <div className="mt-4 flex items-center justify-between rounded-2xl border border-[var(--riff-surface-high)] bg-[var(--riff-surface-low)] px-4 py-3">
                  <div>
                    <p className="text-sm font-semibold text-[var(--riff-text-primary)]">
                      Key change after bridge
                    </p>
                    <p className="text-xs text-[var(--riff-text-muted)]">
                      Lift the final chorus into a higher key after the bridge.
                    </p>
                  </div>
                  <Switch
                    checked={Boolean(chordDraft.keyChangeAfterBridge)}
                    onCheckedChange={(checked) =>
                      setDraft('chords', (draft) => ({
                        ...draft,
                        keyChangeAfterBridge: checked,
                        postBridgeKey: checked
                          ? buildChordSectionSuggestion(draft.text ?? '', {
                              keyChangeAfterBridge: true,
                            })?.postBridgeKey
                          : undefined,
                      }))
                    }
                  />
                </div>

                {(chordInference?.key || chordSectionSuggestion) && (
                  <div className="mt-4 rounded-2xl border border-[var(--riff-surface-high)] bg-[var(--riff-surface-low)] p-4">
                    <div className="flex flex-wrap gap-2">
                      {chordInference?.key ? (
                        <span className="rounded-full bg-[var(--riff-accent)]/15 px-3 py-1 text-xs font-semibold text-[var(--riff-accent-light)]">
                          Likely key: {chordInference.key} {chordInference.mode}
                        </span>
                      ) : null}
                      {chordSectionSuggestion?.postBridgeKey ? (
                        <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-semibold text-emerald-300">
                          Final chorus lift: {chordSectionSuggestion.postBridgeKey}
                        </span>
                      ) : null}
                    </div>

                    {chordSectionSuggestion ? (
                      <div className="mt-4 grid gap-3 md:grid-cols-2">
                        {([
                          ['Verse', chordSectionSuggestion.verse],
                          ['Chorus', chordSectionSuggestion.chorus],
                          ['Bridge', chordSectionSuggestion.bridge],
                          [
                            chordSectionSuggestion.keyChangeAfterBridge
                              ? 'Final Chorus (Key Change)'
                              : 'Final Chorus',
                            chordSectionSuggestion.finalChorus,
                          ],
                        ] as Array<[string, string[]]>).map(([label, chords]) => (
                          <div
                            key={label}
                            className="rounded-xl border border-[var(--riff-surface-high)] bg-[var(--riff-surface)] px-3 py-2"
                          >
                            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--riff-text-muted)]">
                              {label}
                            </p>
                            <p className="mt-1 text-sm font-medium text-[var(--riff-text-primary)]">
                              {chords.join(' - ')}
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </div>
                )}
              </section>
            )}

            {selectedTypes.includes('sheet') && (
              <section className="rounded-2xl border border-[var(--riff-surface-high)] bg-[var(--riff-surface-highest)]/70 p-5">
                <h3 className="font-display text-xl text-[var(--riff-text-primary)]">Sheet Music</h3>
                <p className="mt-1 text-sm text-[var(--riff-text-muted)]">
                  Upload a lead sheet, notation PDF, or MIDI/MusicXML file so Gemini can use the written structure as a first-class source.
                </p>

                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <label htmlFor="upload-sheet">
                    <input
                      id="upload-sheet"
                      type="file"
                      accept=".pdf,.mid,.midi,.musicxml,.xml,.mxl,application/pdf,audio/midi,application/xml,text/xml"
                      className="hidden"
                      onChange={(event) => {
                        const file = event.target.files?.[0]
                        if (!file) {
                          return
                        }

                        void handleSheetUpload(file)
                        event.currentTarget.value = ''
                      }}
                    />
                    <span className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-[var(--riff-surface-high)] bg-[var(--riff-surface-low)] px-4 py-2 text-sm font-semibold text-[var(--riff-text-primary)] transition hover:border-[var(--riff-accent)] hover:text-[var(--riff-accent-light)]">
                      <Upload className="h-4 w-4" />
                      Upload Sheet
                    </span>
                  </label>
                </div>

                {sourceDrafts.sheet?.assetDataUrl ? (
                  <div className="mt-4 rounded-2xl border border-[var(--riff-surface-high)] bg-[var(--riff-surface-low)] p-4">
                    <p className="font-semibold text-[var(--riff-text-primary)]">
                      {sourceDrafts.sheet.fileName}
                    </p>
                    <p className="mt-1 text-sm text-[var(--riff-text-muted)]">
                      Format: {sourceDrafts.sheet.fileFormat ?? 'pdf'}
                    </p>
                    {sourceDrafts.sheet.detectedKey || sourceDrafts.sheet.detectedBpm ? (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {sourceDrafts.sheet.detectedKey ? (
                          <span className="rounded-full bg-[var(--riff-accent)]/15 px-3 py-1 text-xs font-semibold text-[var(--riff-accent-light)]">
                            Detected key: {sourceDrafts.sheet.detectedKey} {sourceDrafts.sheet.detectedMode}
                          </span>
                        ) : null}
                        {sourceDrafts.sheet.detectedBpm ? (
                          <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-semibold text-emerald-300">
                            Detected BPM: {sourceDrafts.sheet.detectedBpm}
                          </span>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                ) : (
                  <div className="mt-4 rounded-2xl border border-dashed border-[var(--riff-surface-high)] bg-[var(--riff-surface-low)] px-4 py-5 text-sm text-[var(--riff-text-muted)]">
                    Upload a notation file before continuing so the Studio can derive structure and chord movement from it.
                  </div>
                )}
              </section>
            )}

            {selectedTypes.includes('remix') && (
              <section className="rounded-2xl border border-[var(--riff-surface-high)] bg-[var(--riff-surface-highest)]/70 p-5">
                <h3 className="font-display text-xl text-[var(--riff-text-primary)]">Remix Source</h3>
                <p className="mt-1 text-sm text-[var(--riff-text-muted)]">
                  Pick one of your generated tracks to use as the source material for the new remix project.
                </p>

                {remixableProjects.length ? (
                  <div className="mt-4 grid gap-3">
                    {remixableProjects.map((project) => {
                      const version = getProjectVersion(project)
                      if (!version) {
                        return null
                      }

                      const isSelected = sourceDrafts.remix?.sourceProjectId === project.id

                      return (
                        <button
                          key={project.id}
                          type="button"
                          onClick={() => handleSelectRemixProject(project.id)}
                          className={`flex items-center justify-between rounded-xl border px-4 py-3 text-left transition ${
                            isSelected
                              ? 'border-[var(--riff-accent)] bg-[var(--riff-accent)]/10'
                              : 'border-[var(--riff-surface-high)] bg-[var(--riff-surface-low)]'
                          }`}
                        >
                          <div>
                            <p className="text-sm font-semibold text-[var(--riff-text-primary)]">
                              {project.title}
                            </p>
                            <p className="text-xs text-[var(--riff-text-muted)]">
                              {version.name} • {formatDuration(version.duration)}
                            </p>
                          </div>
                          {isSelected ? (
                            <span className="text-[11px] font-semibold text-[var(--riff-accent-light)]">
                              Selected
                            </span>
                          ) : null}
                        </button>
                      )
                    })}
                  </div>
                ) : (
                  <div className="mt-4 rounded-2xl border border-dashed border-[var(--riff-surface-high)] bg-[var(--riff-surface-low)] px-4 py-5 text-sm text-[var(--riff-text-muted)]">
                    No generated tracks with audio are available yet. Create a song first, then come back here to remix it.
                  </div>
                )}
              </section>
            )}

            {selectedTypes.includes('spotify') && (
              <section className="rounded-2xl border border-[var(--riff-surface-high)] bg-[var(--riff-surface-highest)]/70 p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#1DB954]">
                      Spotify Reference
                    </p>
                    <h3 className="font-display text-xl text-[var(--riff-text-primary)]">
                      Pick a song or playlist
                    </h3>
                    <p className="mt-1 text-sm text-[var(--riff-text-muted)]">
                      Search your top tracks or browse playlists to select a real Spotify reference for the Studio.
                    </p>
                  </div>
                  <div className={`shrink-0 rounded-full px-3 py-1 text-[11px] font-semibold ${
                    spotifyConnected
                      ? 'bg-[#1DB954]/15 text-[#82f0aa]'
                      : 'bg-amber-500/15 text-amber-200'
                  }`}>
                    {spotifyConnected ? 'Connected' : spotifyConnectionStatus === 'auth_required' ? 'Reconnect required' : 'Not connected'}
                  </div>
                </div>

                {!spotifyConnected ? (
                  <div className="mt-4 rounded-2xl border border-dashed border-[var(--riff-surface-high)] bg-[var(--riff-surface-low)] p-4">
                    <p className="text-sm text-[var(--riff-text-muted)]">
                      Spotify is not linked yet. Connect it here or from Settings before continuing.
                    </p>
                    <div className="mt-3 flex gap-3">
                      <Button type="button" onClick={() => void handleConnectSpotify()}>
                        Connect Spotify
                      </Button>
                      <Button type="button" variant="outline" onClick={() => navigate('/settings')}>
                        Open Settings
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="mt-4 space-y-3">
                    {/* Search bar */}
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--riff-text-faint)]" />
                      <Input
                        value={spotifySearch}
                        onChange={(e) => setSpotifySearch(e.target.value)}
                        placeholder="Search tracks or playlists…"
                        className="border-[var(--riff-surface-high)] bg-[var(--riff-surface)] pl-8 text-sm"
                      />
                    </div>

                    {/* Tabs */}
                    <div className="flex gap-1 rounded-xl border border-[var(--riff-surface-high)] bg-[var(--riff-surface-low)] p-1">
                      {(['tracks', 'playlists'] as const).map((tab) => (
                        <button
                          key={tab}
                          type="button"
                          onClick={() => setSpotifyTab(tab)}
                          className={`flex-1 rounded-lg py-1.5 text-xs font-semibold transition ${
                            spotifyTab === tab
                              ? 'bg-[#1DB954]/20 text-[#82f0aa]'
                              : 'text-[var(--riff-text-muted)] hover:text-[var(--riff-text-primary)]'
                          }`}
                        >
                          {tab === 'tracks' ? `Top Tracks (${spotify.topTracks.length})` : `Playlists (${spotify.playlists.length})`}
                        </button>
                      ))}
                    </div>

                    {/* Top Tracks tab */}
                    {spotifyTab === 'tracks' && (() => {
                      const query = spotifySearch.trim().toLowerCase()
                      const filtered = query
                        ? spotify.topTracks.filter(
                            (t) =>
                              t.title.toLowerCase().includes(query) ||
                              t.artistName.toLowerCase().includes(query),
                          )
                        : spotify.topTracks

                      return (
                        <div className="max-h-72 overflow-y-auto space-y-1.5 pr-1">
                          {filtered.length === 0 ? (
                            <p className="py-4 text-center text-sm text-[var(--riff-text-faint)]">
                              {query ? 'No tracks match your search.' : 'No top tracks synced yet. Sync from Settings.'}
                            </p>
                          ) : (
                            filtered.map((track) => {
                              const isSelected = sourceDrafts.spotify?.spotifyUri === track.uri
                              return (
                                <button
                                  key={track.id}
                                  type="button"
                                  onClick={() =>
                                    setDraft('spotify', (draft) => ({
                                      ...draft,
                                      spotifyReferenceType: 'track',
                                      spotifyUri: track.uri,
                                      providerTrackName: track.title,
                                      artistName: track.artistName,
                                      playlistName: undefined,
                                      label: track.title,
                                      description: `Spotify track reference by ${track.artistName}`,
                                    }))
                                  }
                                  className={`flex w-full items-center gap-3 rounded-xl border px-3 py-2 text-left transition ${
                                    isSelected
                                      ? 'border-[#1DB954]/50 bg-[#1DB954]/10'
                                      : 'border-[var(--riff-surface-high)] bg-[var(--riff-surface-low)] hover:border-[#1DB954]/30'
                                  }`}
                                >
                                  {track.imageUrl ? (
                                    <img src={track.imageUrl} alt="" className="h-9 w-9 shrink-0 rounded-md object-cover" />
                                  ) : (
                                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-[var(--riff-surface-mid)]">
                                      <Music className="h-4 w-4 text-[var(--riff-text-faint)]" />
                                    </div>
                                  )}
                                  <div className="min-w-0 flex-1">
                                    <p className="truncate text-sm font-semibold text-[var(--riff-text-primary)]">
                                      {track.title}
                                    </p>
                                    <p className="truncate text-xs text-[var(--riff-text-muted)]">{track.artistName}</p>
                                  </div>
                                  {isSelected && (
                                    <span className="shrink-0 text-[11px] font-semibold text-[#82f0aa]">Selected</span>
                                  )}
                                </button>
                              )
                            })
                          )}
                        </div>
                      )
                    })()}

                    {/* Playlists tab */}
                    {spotifyTab === 'playlists' && (() => {
                      const query = spotifySearch.trim().toLowerCase()
                      const filteredPlaylists = query
                        ? spotify.playlists.filter((p) => p.name.toLowerCase().includes(query))
                        : spotify.playlists

                      return (
                        <div className="space-y-1.5">
                          {filteredPlaylists.length === 0 ? (
                            <p className="py-4 text-center text-sm text-[var(--riff-text-faint)]">
                              {query ? 'No playlists match your search.' : 'No playlists synced yet. Sync from Settings.'}
                            </p>
                          ) : (
                            filteredPlaylists.map((playlist) => {
                              const isPlaylistSelected = sourceDrafts.spotify?.spotifyUri === playlist.uri
                              const isExpanded = expandedPlaylistId === playlist.id
                              const isLoading = loadingPlaylistId === playlist.id
                              const playlistTracks = playlistTracksCache.get(playlist.id) ?? []
                              const filteredTracks = query && isExpanded
                                ? playlistTracks.filter(
                                    (t) =>
                                      t.title.toLowerCase().includes(query) ||
                                      t.artistName.toLowerCase().includes(query),
                                  )
                                : playlistTracks

                              return (
                                <div key={playlist.id} className="overflow-hidden rounded-xl border border-[var(--riff-surface-high)]">
                                  {/* Playlist header row */}
                                  <div className="flex items-center gap-2">
                                    <button
                                      type="button"
                                      onClick={() => void handleLoadPlaylistTracks(playlist.id)}
                                      className="flex flex-1 items-center gap-3 bg-[var(--riff-surface-low)] px-3 py-2.5 text-left transition hover:bg-[var(--riff-surface-mid)]"
                                    >
                                      {playlist.imageUrl ? (
                                        <img src={playlist.imageUrl} alt="" className="h-9 w-9 shrink-0 rounded-md object-cover" />
                                      ) : (
                                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-[var(--riff-surface-mid)]">
                                          <Music className="h-4 w-4 text-[var(--riff-text-faint)]" />
                                        </div>
                                      )}
                                      <div className="min-w-0 flex-1">
                                        <p className="truncate text-sm font-semibold text-[var(--riff-text-primary)]">
                                          {playlist.name}
                                        </p>
                                        <p className="text-xs text-[var(--riff-text-muted)]">
                                          {playlist.trackCount} tracks
                                        </p>
                                      </div>
                                      {isLoading ? (
                                        <Loader2 className="h-4 w-4 shrink-0 animate-spin text-[var(--riff-text-faint)]" />
                                      ) : (
                                        <ChevronDown className={`h-4 w-4 shrink-0 text-[var(--riff-text-faint)] transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                                      )}
                                    </button>
                                    {/* Use playlist as reference */}
                                    <button
                                      type="button"
                                      title="Use whole playlist as reference"
                                      onClick={() =>
                                        setDraft('spotify', (draft) => ({
                                          ...draft,
                                          spotifyReferenceType: 'playlist',
                                          spotifyUri: playlist.uri,
                                          playlistName: playlist.name,
                                          providerTrackName: undefined,
                                          artistName: undefined,
                                          label: playlist.name,
                                          description: `Spotify playlist reference • ${playlist.trackCount} tracks`,
                                        }))
                                      }
                                      className={`mr-2 shrink-0 rounded-lg border px-2.5 py-1 text-[11px] font-semibold transition ${
                                        isPlaylistSelected
                                          ? 'border-[#1DB954]/50 bg-[#1DB954]/15 text-[#82f0aa]'
                                          : 'border-[var(--riff-surface-high)] bg-transparent text-[var(--riff-text-muted)] hover:border-[#1DB954]/30 hover:text-[#82f0aa]'
                                      }`}
                                    >
                                      {isPlaylistSelected ? 'Selected' : 'Use'}
                                    </button>
                                  </div>

                                  {/* Expanded track list */}
                                  {isExpanded && !isLoading && (
                                    <div className="max-h-56 overflow-y-auto border-t border-[var(--riff-surface-high)] bg-[var(--riff-surface)]/50">
                                      {filteredTracks.length === 0 ? (
                                        <p className="px-4 py-3 text-sm text-[var(--riff-text-faint)]">
                                          {query ? 'No tracks match.' : 'No tracks found in this playlist.'}
                                        </p>
                                      ) : (
                                        filteredTracks.map((track) => {
                                          const isTrackSelected = sourceDrafts.spotify?.spotifyUri === track.uri
                                          return (
                                            <button
                                              key={track.id}
                                              type="button"
                                              onClick={() =>
                                                setDraft('spotify', (draft) => ({
                                                  ...draft,
                                                  spotifyReferenceType: 'track',
                                                  spotifyUri: track.uri,
                                                  providerTrackName: track.title,
                                                  artistName: track.artistName,
                                                  playlistName: undefined,
                                                  label: track.title,
                                                  description: `Spotify track reference by ${track.artistName}`,
                                                }))
                                              }
                                              className={`flex w-full items-center gap-3 px-3 py-2 text-left transition hover:bg-[var(--riff-surface-mid)] ${
                                                isTrackSelected ? 'bg-[#1DB954]/10' : ''
                                              }`}
                                            >
                                              {track.imageUrl ? (
                                                <img src={track.imageUrl} alt="" className="h-7 w-7 shrink-0 rounded object-cover" />
                                              ) : (
                                                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded bg-[var(--riff-surface-mid)]">
                                                  <Music className="h-3 w-3 text-[var(--riff-text-faint)]" />
                                                </div>
                                              )}
                                              <div className="min-w-0 flex-1">
                                                <p className="truncate text-xs font-semibold text-[var(--riff-text-primary)]">
                                                  {track.title}
                                                </p>
                                                <p className="truncate text-[11px] text-[var(--riff-text-muted)]">
                                                  {track.artistName}
                                                </p>
                                              </div>
                                              {isTrackSelected && (
                                                <span className="shrink-0 text-[11px] font-semibold text-[#82f0aa]">✓</span>
                                              )}
                                            </button>
                                          )
                                        })
                                      )}
                                    </div>
                                  )}
                                </div>
                              )
                            })
                          )}
                        </div>
                      )
                    })()}

                    {/* Selected track summary */}
                    {sourceDrafts.spotify?.spotifyUri ? (
                      <div className="flex items-center gap-3 rounded-xl border border-[#1DB954]/30 bg-[#1DB954]/10 px-3 py-2">
                        <div className="h-2 w-2 shrink-0 rounded-full bg-[#1DB954]" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-[#82f0aa]">
                            {sourceDrafts.spotify.label}
                          </p>
                          <p className="truncate text-xs text-[var(--riff-text-muted)]">
                            {sourceDrafts.spotify.description}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            setDraft('spotify', (draft) => ({
                              ...draft,
                              spotifyUri: undefined,
                              spotifyReferenceType: undefined,
                              providerTrackName: undefined,
                              artistName: undefined,
                              playlistName: undefined,
                            }))
                          }
                          className="shrink-0 rounded-md p-1 text-[var(--riff-text-faint)] transition hover:text-white"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ) : (
                      <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-100">
                        Choose a track or playlist to use Spotify as an actual source.
                      </div>
                    )}
                  </div>
                )}
              </section>
            )}
          </div>

          <aside className="rounded-2xl border border-[var(--riff-surface-high)] bg-[var(--riff-surface-highest)]/70 p-5">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--riff-accent-light)]">
              Draft Payload
            </p>
            <h3 className="mt-2 font-display text-2xl text-[var(--riff-text-primary)]">
              Studio will open prefilled
            </h3>
            <p className="mt-2 text-sm text-[var(--riff-text-muted)]">
              Selected audio is passed into Gemini interpretation before Studio opens. That
              derived blueprint becomes the initial editable draft.
            </p>

            <div className="mt-5 flex flex-col gap-2">
              {selectedSources.map((source) => (
                <div
                  key={source.type}
                  className="flex items-center justify-between rounded-xl border border-[var(--riff-surface-high)] bg-[var(--riff-surface-low)] px-3 py-2"
                >
                  <div>
                    <p className="text-sm font-semibold text-[var(--riff-text-primary)]">
                      {source.label ?? defaultDraftForType(source.type).label}
                    </p>
                    <p className="text-xs text-[var(--riff-text-muted)]">
                      {isAudioSelectionType(source.type)
                        ? source.audioDataUrl
                          ? [
                              `${formatDuration(source.durationSeconds)} ready for analysis`,
                              source.detectedKey
                                ? `${source.detectedKey}${source.detectedMode ? ` ${source.detectedMode}` : ''}`
                                : undefined,
                              source.detectedBpm ? `${source.detectedBpm} BPM` : undefined,
                            ]
                              .filter(Boolean)
                              .join(' • ')
                          : 'waiting for audio'
                        : source.type === 'sheet'
                          ? source.assetDataUrl
                            ? source.detectedKey || source.detectedBpm
                              ? `${source.detectedKey ? `${source.detectedKey}${source.detectedMode ? ` ${source.detectedMode}` : ''}` : 'key pending'}${source.detectedBpm ? ` • ${source.detectedBpm} BPM` : ''}`
                              : 'notation file attached'
                            : 'waiting for upload'
                        : source.type === 'remix'
                          ? source.sourceProjectId
                            ? 'remix source selected'
                            : 'waiting for source track'
                        : source.type === 'spotify'
                          ? source.spotifyUri
                            ? 'linked Spotify reference'
                            : 'waiting for Spotify selection'
                        : source.type === 'lyrics'
                          ? [
                              source.lyricSections?.verse ? 'verse' : undefined,
                              source.lyricSections?.chorus ? 'chorus' : undefined,
                              source.lyricSections?.bridge ? 'bridge' : undefined,
                            ].filter(Boolean).join(' / ') || source.text
                            ? 'sectioned lyrics ready'
                            : 'waiting for lyrics'
                        : source.type === 'chords' && chordSectionSuggestion
                          ? `${chordInference?.key ? `${chordInference.key} ${chordInference.mode} • ` : ''}verse / chorus / bridge ready`
                        : source.text
                          ? 'text attached'
                          : 'metadata source'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => toggleSource(source.type)}
                    className="rounded-md p-1 text-[var(--riff-text-faint)] transition hover:text-[var(--riff-text-primary)]"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>

            {recordingError && (
              <div className="mt-5 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
                {recordingError}
              </div>
            )}

            {missingAudioInput && (
              <div className="mt-5 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-100">
                Hum and riff sources need an actual recording or uploaded file before Studio can
                infer the blueprint.
              </div>
            )}

            {missingSheetInput && (
              <div className="mt-5 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-100">
                Sheet Music is selected, but no notation file is attached yet.
              </div>
            )}

            {missingRemixSelection && (
              <div className="mt-5 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-100">
                Remix is selected, but no existing track has been chosen yet.
              </div>
            )}

            {spotifyRequiredButUnlinked && (
              <div className="mt-5 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-100">
                Spotify is selected, but no linked track or playlist is attached yet.
              </div>
            )}
          </aside>
        </div>
      )}

      <div
        className={cn(
          'fixed bottom-24 left-1/2 z-50 w-[calc(100%-48px)] max-w-4xl -translate-x-1/2 rounded-2xl border border-[var(--riff-surface-high)] bg-[var(--riff-surface-highest)] p-4 shadow-[0_20px_50px_rgba(0,0,0,0.5)] transition-all duration-500 ease-in-out',
          hasSelection ? 'translate-y-0 opacity-100' : 'translate-y-[200%] opacity-0 pointer-events-none',
        )}
      >
        <div className="flex items-center gap-6">
          <div className="flex-1 overflow-hidden">
            <div className="mb-1.5 flex items-center gap-2">
              <Sparkles className="h-3.5 w-3.5 text-[var(--riff-accent-light)]" />
              <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-[var(--riff-accent-light)]">
                Synthesis Canvas
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {selectedTypes.length === 0 ? (
                <span className="text-xs text-[var(--riff-text-faint)]">Select inputs above...</span>
              ) : (
                selectedSources.map((source) => {
                  const option = SOURCE_OPTIONS.find((candidate) => candidate.type === source.type)
                  return (
                    <div
                      key={source.type}
                      className="animate-in fade-in slide-in-from-left-2 flex items-center gap-2 rounded-lg border border-[var(--riff-surface-mid)] bg-[var(--riff-surface-low)] px-3 py-1.5"
                    >
                      {option && <option.icon className="h-3.5 w-3.5 text-[var(--riff-accent-light)]" />}
                      <span className="text-xs font-semibold text-[var(--riff-text-primary)]">
                        {option?.label}
                      </span>
                      <button
                        onClick={(event) => {
                          event.stopPropagation()
                          toggleSource(source.type)
                        }}
                        className="p-0.5 text-[var(--riff-text-faint)] transition-colors hover:text-white"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  )
                })
              )}
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-[10px] font-medium text-[var(--riff-text-muted)]">
                {missingAudioInput
                  ? 'Attach audio first'
                  : missingSheetInput
                    ? 'Upload sheet music'
                    : missingRemixSelection
                      ? 'Choose a remix source'
                  : spotifyRequiredButUnlinked
                    ? 'Choose a Spotify reference'
                    : 'Ready to Assemble?'}
              </p>
              <p className="text-[11px] font-bold text-[var(--riff-text-primary)]">
                {selectedTypes.length} Input{selectedTypes.length === 1 ? '' : 's'} Selected
              </p>
            </div>

            <Button
              className="h-12 rounded-xl bg-[var(--riff-accent)] px-6 font-bold shadow-[0_0_20px_var(--riff-glow)] transition-all hover:bg-[var(--riff-accent-light)]"
              disabled={!canContinue}
              onClick={() => void handleContinue()}
            >
              {isCreating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Interpreting Input
                </>
              ) : (
                <>
                  Continue to Studio
                  <ChevronRight className="ml-1 h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </PageFrame>
  )
}
