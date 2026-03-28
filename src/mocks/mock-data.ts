import type { Project } from '@/domain/project'
import type { ExploreTrack, Creator, RemixChainNode, GenreRailItem } from '@/domain/explore'
import type { ExportBundle, ExportAsset, ExportHistoryEntry } from '@/domain/exports'

export const LIBRARY_PROJECTS: Project[] = [
  {
    id: 'proj-active-1',
    title: 'Neon Midnight',
    updatedAt: new Date().toISOString(),
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    status: 'draft',
    versionCount: 4,
    sourceType: 'mixed',
    isFavorite: true,
    isExported: true,
    learnReady: true,
    lastLearnedAt: new Date(Date.now() - 3600000).toISOString(),
    collection: 'Late Night Demos',
    description: 'Late-night outrun pulse: sidechain pads, gated snares, and a vocal that sits just behind the windshield glare.',
    mood: 'Driving',
    vocalsEnabled: true,
    coverUrl: 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?auto=format&fit=crop&q=80&w=400&h=400',
    blueprint: {
      bpm: 118,
      key: 'F',
      mode: 'Minor',
      timeSignature: '4/4',
      targetDuration: '3:45',
      genre: 'Outrun / Synth-pop',
      mood: 'Driving',
      energy: 'High',
      texture: 'Neon, Cinematic',
      vocalsEnabled: true,
      vocalStyle: 'Airy, Processed',
      instruments: { drums: true, bass: true, guitar: false, synths: true, strings: false, pads: true }
    },
    versions: [
      { id: 'v1', name: 'Original Generate', timestamp: new Date(Date.now() - 3600000).toISOString(), duration: 215, isActive: false, tags: ['baseline'] },
      { id: 'v2', name: 'Darker Mix', timestamp: new Date(Date.now() - 1800000).toISOString(), duration: 218, isActive: false, tags: ['less highs', 'heavy sub'] },
      {
        id: 'v3', name: 'Vocal Forward', timestamp: new Date().toISOString(), duration: 220, isActive: true, tags: ['current'],
        structure: [
          { id: 'sec-1', label: 'Intro', startTime: 0, duration: 15, chords: ['Fm', 'Db'] },
          { id: 'sec-2', label: 'Verse 1', startTime: 15, duration: 30, chords: ['Fm', 'Cm', 'Db', 'Eb'] },
          { id: 'sec-3', label: 'Pre-Chorus', startTime: 45, duration: 15, chords: ['Bbm', 'Fm', 'Eb', 'Eb'] },
          { id: 'sec-4', label: 'Chorus', startTime: 60, duration: 30, chords: ['Fm', 'Db', 'Ab', 'Eb'] },
          { id: 'sec-5', label: 'Verse 2', startTime: 90, duration: 30, chords: ['Fm', 'Cm', 'Db', 'Eb'] },
          { id: 'sec-6', label: 'Chorus', startTime: 120, duration: 30, chords: ['Fm', 'Db', 'Ab', 'Eb'] },
          { id: 'sec-7', label: 'Bridge', startTime: 150, duration: 30, chords: ['Db', 'Eb', 'Fm', 'Cm'] },
          { id: 'sec-8', label: 'Chorus', startTime: 180, duration: 30, chords: ['Fm', 'Db', 'Ab', 'Eb'] },
          { id: 'sec-9', label: 'Outro', startTime: 210, duration: 10, chords: ['Fm'] }
        ],
        lyrics: [
          { id: 'lyr-1', label: 'Verse 1', lines: ['Neon lights reflect in the puddle', 'City sleeping while my engine roars', 'Another night shifted out of neutral', 'Still chasing something on these empty shores'], deliveryNotes: 'Lower register, breathless' },
          { id: 'lyr-2', label: 'Pre-Chorus', lines: ['I can feel the static on the wire', 'Hear the hum before the break of dawn'], deliveryNotes: 'Rising intensity' },
          { id: 'lyr-3', label: 'Chorus', lines: ['Midnight rider driving out the shadow', 'Tearing up the silence of the night', 'A ghost inside a metal shell, I follow', 'Only guiding by the dashboard light'], deliveryNotes: 'Full voice, layered harmonies' }
        ],
        exports: [
          { type: 'audio', status: 'ready', size: '34MB', lastGenerated: '12 mins ago' },
          { type: 'instrumental', status: 'ready', size: '32MB', lastGenerated: '12 mins ago' },
          { type: 'vocal', status: 'ready', size: '15MB', lastGenerated: '12 mins ago' },
          { type: 'midi', status: 'ready', size: '12KB', lastGenerated: '12 mins ago' },
          { type: 'chord_sheet', status: 'ready', size: '2KB', lastGenerated: '12 mins ago' },
          { type: 'lyrics', status: 'ready', size: '1KB', lastGenerated: '12 mins ago' }
        ]
      }
    ]
  },
  {
    id: 'proj-velvet',
    title: 'Porcelain Hour',
    updatedAt: new Date(Date.now() - 7200000).toISOString(),
    createdAt: new Date(Date.now() - 86400000 * 7).toISOString(),
    status: 'finished',
    versionCount: 8,
    sourceType: 'hum',
    isFavorite: true,
    isPublished: true,
    isExported: true,
    learnReady: true,
    collection: 'Public Releases',
    description: 'Neo-soul sketch that began as a voice memo hum on a train platform—Wurlitzer, brushed hats, close-mic breath.',
    mood: 'Intimate',
    vocalsEnabled: true,
    coverUrl: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&q=80&w=400&h=400',
    blueprint: { bpm: 72, key: 'Ab', mode: 'Major', timeSignature: '4/4', targetDuration: '4:20', genre: 'Neo-Soul', mood: 'Intimate', energy: 'Low', vocalsEnabled: true, vocalStyle: 'Warm, Soulful', instruments: { drums: true, bass: true, guitar: false, synths: false, strings: true, pads: true } },
  },
  {
    id: 'proj-midnight-glass',
    title: 'Kettle Light FM',
    updatedAt: new Date(Date.now() - 86400000).toISOString(),
    createdAt: new Date(Date.now() - 86400000 * 14).toISOString(),
    status: 'draft',
    versionCount: 2,
    sourceType: 'chords',
    isFavorite: false,
    isExported: false,
    collection: 'Late Night Demos',
    description: 'UK-influenced 2-step pocket around a Cm7 → Fm9 loop—shuffled hats, sub that hugs the floorboards.',
    mood: 'Melancholic',
    vocalsEnabled: false,
    coverUrl: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?auto=format&fit=crop&q=80&w=400&h=400',
    blueprint: { bpm: 90, key: 'C', mode: 'Minor', timeSignature: '4/4', targetDuration: '3:30', genre: 'Future Garage', mood: 'Melancholic', energy: 'Low', vocalsEnabled: false, instruments: { drums: true, bass: true, guitar: false, synths: true, strings: true, pads: true } },
  },
  {
    id: 'proj-afterimage',
    title: 'Salt Cathedral',
    updatedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    createdAt: new Date(Date.now() - 86400000 * 10).toISOString(),
    status: 'finished',
    versionCount: 5,
    sourceType: 'spotify_track',
    isFavorite: false,
    isPublished: false,
    isExported: true,
    learnReady: true,
    lastLearnedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    description: 'Shoegaze wall inspired by a buried Spotify gem—trem-picked stacks, tidal drums, no apology in the low end.',
    mood: 'Epic',
    vocalsEnabled: false,
    coverUrl: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&q=80&w=400&h=400',
    blueprint: { bpm: 135, key: 'E', mode: 'Minor', timeSignature: '6/8', targetDuration: '5:10', genre: 'Shoegaze / Post-Rock', mood: 'Epic', energy: 'High', vocalsEnabled: false, instruments: { drums: true, bass: true, guitar: true, synths: false, strings: true, pads: true } },
  },
  {
    id: 'proj-neon-static',
    title: 'Channel 6 Static',
    updatedAt: new Date(Date.now() - 86400000 * 4).toISOString(),
    createdAt: new Date(Date.now() - 86400000 * 20).toISOString(),
    status: 'draft',
    versionCount: 3,
    sourceType: 'lyrics',
    isFavorite: false,
    isExported: false,
    collection: 'Guitar Drafts',
    description: 'Midwest emo tilt: capo’d open chords, diary lyrics, and a chorus that wants to sprint out of a small venue.',
    mood: 'Restless',
    vocalsEnabled: true,
    blueprint: { bpm: 140, key: 'A', mode: 'Minor', timeSignature: '4/4', targetDuration: '3:20', genre: 'Midwest Emo / Power Pop', mood: 'Restless', energy: 'High', vocalsEnabled: true, vocalStyle: 'Raw, Gritty', instruments: { drums: true, bass: true, guitar: true, synths: false, strings: false, pads: false } },
  },
  {
    id: 'proj-dream-circuit',
    title: 'Moss on the Tape Heads',
    updatedAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    createdAt: new Date(Date.now() - 86400000 * 30).toISOString(),
    status: 'finished',
    versionCount: 12,
    sourceType: 'riff',
    isFavorite: true,
    isPublished: true,
    isExported: true,
    learnReady: true,
    collection: 'Public Releases',
    description: 'Twelve passes on a single guitar riff: tape wobble, granulated rain, and a low-mix choir that never quite resolves.',
    mood: 'Dreamy',
    vocalsEnabled: false,
    coverUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&q=80&w=400&h=400',
    blueprint: { bpm: 100, key: 'D', mode: 'Major', timeSignature: '4/4', targetDuration: '4:00', genre: 'Tape Ambient / Folktronica', mood: 'Dreamy', energy: 'Medium', vocalsEnabled: false, instruments: { drums: false, bass: true, guitar: true, synths: true, strings: true, pads: true } },
  },
  {
    id: 'proj-nocturne',
    title: 'Stave Church Hymn (archived)',
    updatedAt: new Date(Date.now() - 86400000 * 8).toISOString(),
    createdAt: new Date(Date.now() - 86400000 * 45).toISOString(),
    status: 'archived',
    versionCount: 6,
    sourceType: 'sheet_music',
    isFavorite: false,
    isExported: false,
    description: 'Chamber sketch from scanned notation—solo violin against frozen synth drones. Parked until the arrangement breathes more.',
    mood: 'Contemplative',
    vocalsEnabled: false,
    blueprint: { bpm: 68, key: 'Bb', mode: 'Minor', timeSignature: '3/4', targetDuration: '4:45', genre: 'Nordic Chamber', mood: 'Contemplative', energy: 'Low', vocalsEnabled: false, instruments: { drums: false, bass: false, guitar: false, synths: false, strings: true, pads: true } },
  },
  {
    id: 'proj-club-banger',
    title: 'Heat Chassis',
    updatedAt: new Date(Date.now() - 259200000).toISOString(),
    createdAt: new Date(Date.now() - 86400000 * 60).toISOString(),
    status: 'draft',
    versionCount: 6,
    sourceType: 'spotify_playlist',
    isFavorite: false,
    isExported: false,
    collection: 'Export Ready',
    description: 'Playlist-mined UK funky pressure: metallic percussion, rude bass, vocal chops that answer the kick.',
    mood: 'Euphoric',
    vocalsEnabled: true,
    blueprint: { bpm: 128, key: 'G', mode: 'Minor', timeSignature: '4/4', targetDuration: '3:00', genre: 'UK Funky / Bass House', mood: 'Euphoric', energy: 'Extreme', vocalsEnabled: true, vocalStyle: 'Chopped, Filtered', instruments: { drums: true, bass: true, guitar: false, synths: true, strings: false, pads: false } },
  },
];

// Keep backward-compat alias
export const RECENT_PROJECTS = LIBRARY_PROJECTS

export const TRENDING_TRACKS = [
  { id: 't1', title: 'Copper Wick', artist: 'glassorchard', artistArt: 'https://i.pravatar.cc/150?u=glassorchard' },
  { id: 't2', title: 'Borrowed Valor', artist: 'softmachinesf', artistArt: 'https://i.pravatar.cc/150?u=softmachine' },
  { id: 't3', title: 'Basement Saints (rough)', artist: 'channel6static', artistArt: 'https://i.pravatar.cc/150?u=channel6' },
]

// ─────────────────────────────────────────────────────────────
//  Explore / Community Mock Data
// ─────────────────────────────────────────────────────────────

export const EXPLORE_FEATURED_TRACK: ExploreTrack = {
  id: 'ext-featured',
  title: 'Glass Horizon',
  creator: 'solaris.wav',
  creatorAvatar: 'https://i.pravatar.cc/150?u=solaris',
  coverUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&q=80&w=600&h=600',
  genre: 'Tape Ambient',
  mood: 'Ethereal',
  bpm: 98,
  hasVocals: false,
  isRemixable: true,
  badges: ['staff-pick', 'trending'],
  plays: 14200,
  sourceType: 'riff',
  remixCount: 23,
  publishedAt: new Date(Date.now() - 3600000 * 8).toISOString(),
}

export const EXPLORE_TRENDING_TRACKS: ExploreTrack[] = [
  {
    id: 'ext-1', title: 'Porcelain Hour', creator: 'mara_oka', creatorAvatar: 'https://i.pravatar.cc/150?u=maraoka',
    coverUrl: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&q=80&w=400&h=400',
    genre: 'Neo-Soul', mood: 'Intimate', bpm: 72, hasVocals: true, isRemixable: true, badges: ['trending', 'remixable'],
    plays: 8400, sourceType: 'hum', remixCount: 12, publishedAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: 'ext-2', title: 'Salt Cathedral', creator: 'prism_lab', creatorAvatar: 'https://i.pravatar.cc/150?u=prism',
    coverUrl: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&q=80&w=400&h=400',
    genre: 'Shoegaze', mood: 'Epic', bpm: 135, hasVocals: false, isRemixable: true, badges: ['rising', 'remixable'],
    plays: 5200, sourceType: 'spotify_track', remixCount: 7, publishedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: 'ext-3', title: 'Channel 6 Static', creator: 'crest_floor', creatorAvatar: 'https://i.pravatar.cc/150?u=crest',
    coverUrl: 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?auto=format&fit=crop&q=80&w=400&h=400',
    genre: 'Midwest Emo', mood: 'Restless', bpm: 140, hasVocals: true, isRemixable: false, badges: ['trending'],
    plays: 6100, sourceType: 'lyrics', remixCount: 3, publishedAt: new Date(Date.now() - 86400000 * 3).toISOString(),
  },
  {
    id: 'ext-4', title: 'Moss on the Tape Heads', creator: 'tessera_tools', creatorAvatar: 'https://i.pravatar.cc/150?u=tessera',
    coverUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&q=80&w=400&h=400',
    genre: 'Folktronica', mood: 'Dreamy', bpm: 100, hasVocals: false, isRemixable: true, badges: ['staff-pick'],
    plays: 11800, sourceType: 'riff', remixCount: 19, publishedAt: new Date(Date.now() - 86400000 * 5).toISOString(),
  },
  {
    id: 'ext-5', title: 'Kettle Light FM', creator: 'field_notes_coop', creatorAvatar: 'https://i.pravatar.cc/150?u=fieldnotes',
    coverUrl: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?auto=format&fit=crop&q=80&w=400&h=400',
    genre: 'Future Garage', mood: 'Melancholic', bpm: 88, hasVocals: false, isRemixable: true, badges: ['new', 'remixable'],
    plays: 2300, sourceType: 'chords', remixCount: 4, publishedAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: 'ext-6', title: 'Heat Chassis (dub)', creator: 'nexus_bins', creatorAvatar: 'https://i.pravatar.cc/150?u=nexusbins',
    coverUrl: 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?auto=format&fit=crop&q=80&w=400&h=400',
    genre: 'UK Funky', mood: 'Euphoric', bpm: 128, hasVocals: true, isRemixable: true, badges: ['rising'],
    plays: 4700, sourceType: 'spotify_playlist', remixCount: 8, publishedAt: new Date(Date.now() - 86400000 * 4).toISOString(),
  },
  {
    id: 'ext-7', title: 'Hollow Light', creator: 'lune_outside', creatorAvatar: 'https://i.pravatar.cc/150?u=lune',
    coverUrl: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&q=80&w=400&h=400',
    genre: 'Dream Pop', mood: 'Ethereal', bpm: 105, hasVocals: true, isRemixable: false, badges: ['trending'],
    plays: 7900, sourceType: 'hum', remixCount: 5, publishedAt: new Date(Date.now() - 86400000 * 6).toISOString(),
  },
  {
    id: 'ext-8', title: 'Neon Midnight (community cut)', creator: 'nightshift_bus', creatorAvatar: 'https://i.pravatar.cc/150?u=nightshift',
    coverUrl: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&q=80&w=400&h=400',
    genre: 'Outrun', mood: 'Driving', bpm: 118, hasVocals: false, isRemixable: true, badges: ['new', 'remixable'],
    plays: 1800, sourceType: 'riff', remixCount: 2, publishedAt: new Date(Date.now() - 3600000 * 12).toISOString(),
  },
]

export const EXPLORE_CREATORS: Creator[] = [
  { id: 'cr-1', name: 'solaris.wav', avatar: 'https://i.pravatar.cc/150?u=solaris', genres: ['Tape ambient', 'Field recordings'], trackCount: 24, followerCount: 3200, description: 'Posts weekly “texture drops” · open stems on Friday' },
  { id: 'cr-2', name: 'mara_oka', avatar: 'https://i.pravatar.cc/150?u=maraoka', genres: ['Neo-soul', 'Bedroom pop'], trackCount: 18, followerCount: 5100, description: 'Hum-first sketches · collab queue usually 2 weeks out' },
  { id: 'cr-3', name: 'prism_lab', avatar: 'https://i.pravatar.cc/150?u=prism', genres: ['Shoegaze', 'Post-rock'], trackCount: 31, followerCount: 4400, description: 'Wall-of-guitar builds · replies to every remix thread' },
  { id: 'cr-4', name: 'crest_floor', avatar: 'https://i.pravatar.cc/150?u=crest', genres: ['Midwest emo', 'Power pop'], trackCount: 42, followerCount: 7800, description: 'Basement diaries · #unfinished-room moderator' },
  { id: 'cr-5', name: 'nebula_drive', avatar: 'https://i.pravatar.cc/150?u=nebula', genres: ['UK funky', 'Bass'], trackCount: 15, followerCount: 2100, description: 'Modular jams + rude sub tests · share your meters' },
  { id: 'cr-6', name: 'tessera_tools', avatar: 'https://i.pravatar.cc/150?u=tessera', genres: ['Folktronica', 'Chamber'], trackCount: 27, followerCount: 3600, description: 'Classical chops run through tape · CC-BY stems' },
]

export const EXPLORE_REMIX_CHAIN: RemixChainNode[] = [
  { id: 'rc-1', title: 'Glass Horizon', creator: 'solaris.wav', coverUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&q=80&w=200&h=200', variationLabel: 'Original', parentId: null },
  { id: 'rc-2', title: 'Glass Horizon (Darker Mix)', creator: 'crest_floor', coverUrl: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?auto=format&fit=crop&q=80&w=200&h=200', variationLabel: 'Darker Mix', parentId: 'rc-1' },
  { id: 'rc-3', title: 'Glass Horizon (No Vocals)', creator: 'tessera_tools', coverUrl: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&q=80&w=200&h=200', variationLabel: 'Instrumental', parentId: 'rc-2' },
  { id: 'rc-4', title: 'Glass Horizon (Cinematic)', creator: 'prism_lab', coverUrl: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&q=80&w=200&h=200', variationLabel: 'Cinematic Rework', parentId: 'rc-3' },
]

export const EXPLORE_GENRE_RAILS: GenreRailItem[] = [
  { id: 'gr-1', label: '3AM Soul Sketches', trackCount: 342, gradient: ['#2e1a2e', '#1a0d1a'] },
  { id: 'gr-2', label: 'Capo Confessionals', trackCount: 218, gradient: ['#1a2e1a', '#0d1a10'] },
  { id: 'gr-3', label: 'Outrun & Odometer Glow', trackCount: 156, gradient: ['#1a1035', '#0d1a2e'] },
  { id: 'gr-4', label: 'Instrumental Rabbit Holes', trackCount: 489, gradient: ['#0d1a2e', '#1a2e2e'] },
  { id: 'gr-5', label: 'Tape Hiss Collective', trackCount: 275, gradient: ['#2e1a1a', '#1a0d0d'] },
  { id: 'gr-6', label: 'Modular Mischief', trackCount: 128, gradient: ['#1a1a0d', '#0d0d1a'] },
]

export const EXPLORE_RECENT_RELEASES: ExploreTrack[] = EXPLORE_TRENDING_TRACKS.slice(4, 8).map(t => ({ ...t, badges: ['new' as const] }))

// ─────────────────────────────────────────────────────────────
//  Export Mock Data
// ─────────────────────────────────────────────────────────────

export const EXPORT_ASSETS: ExportAsset[] = [
  { id: 'ea-1', type: 'audio', name: 'Final Audio', description: 'Full stereo mix of the active version', format: 'WAV', status: 'ready', size: '34 MB', lastGenerated: '12 mins ago', filename: 'Neon_Midnight_v3_Final.wav', path: '~/Downloads/Riff/Neon_Midnight/Neon_Midnight_v3_Final.wav' },
  { id: 'ea-2', type: 'instrumental', name: 'Instrumental', description: 'Full mix without vocal stems', format: 'WAV', status: 'ready', size: '32 MB', lastGenerated: '12 mins ago', filename: 'Neon_Midnight_v3_Instrumental.wav', path: '~/Downloads/Riff/Neon_Midnight/Neon_Midnight_v3_Instrumental.wav' },
  { id: 'ea-3', type: 'vocal', name: 'Vocal Stems', description: 'Isolated vocal track', format: 'WAV', status: 'ready', size: '15 MB', lastGenerated: '12 mins ago', filename: 'Neon_Midnight_v3_Vocals.wav', path: '~/Downloads/Riff/Neon_Midnight/Neon_Midnight_v3_Vocals.wav' },
  { id: 'ea-4', type: 'chord_sheet', name: 'Chord Sheet', description: 'Chord progression for all sections', format: 'PDF', status: 'ready', size: '45 KB', lastGenerated: '12 mins ago', filename: 'Neon_Midnight_Chords.pdf', path: '~/Downloads/Riff/Neon_Midnight/Neon_Midnight_Chords.pdf' },
  { id: 'ea-5', type: 'melody_guide', name: 'Melody Guide', description: 'Lead melody notation and contour', format: 'PDF', status: 'pending', size: '—', lastGenerated: '—', filename: 'Neon_Midnight_Melody.pdf' },
  { id: 'ea-6', type: 'lyrics', name: 'Lyrics Sheet', description: 'Full lyrics with section labels and delivery notes', format: 'TXT', status: 'ready', size: '2 KB', lastGenerated: '12 mins ago', filename: 'Neon_Midnight_Lyrics.txt', path: '~/Downloads/Riff/Neon_Midnight/Neon_Midnight_Lyrics.txt' },
  { id: 'ea-7', type: 'metadata', name: 'Metadata JSON', description: 'Blueprint, structure, and generation parameters', format: 'JSON', status: 'ready', size: '8 KB', lastGenerated: '12 mins ago', filename: 'Neon_Midnight_Metadata.json', path: '~/Downloads/Riff/Neon_Midnight/Neon_Midnight_Metadata.json' },
  { id: 'ea-8', type: 'cover_art', name: 'Cover Art', description: 'Project artwork in high resolution', format: 'PNG', status: 'ready', size: '1.2 MB', lastGenerated: '1 hour ago', filename: 'Neon_Midnight_Cover.png', path: '~/Downloads/Riff/Neon_Midnight/Neon_Midnight_Cover.png' },
  { id: 'ea-9', type: 'teaser', name: 'Teaser Clip', description: '30-second preview clip for sharing', format: 'MP3', status: 'generating', size: '—', lastGenerated: '—', filename: 'Neon_Midnight_Teaser.mp3' },
  { id: 'ea-10', type: 'manifest', name: 'Project Manifest', description: 'Complete export manifest with file references', format: 'JSON', status: 'ready', size: '3 KB', lastGenerated: '12 mins ago', filename: 'Neon_Midnight_Manifest.json', path: '~/Downloads/Riff/Neon_Midnight/Neon_Midnight_Manifest.json' },
]

export const EXPORT_ACTIVE_BUNDLE: ExportBundle = {
  id: 'eb-1',
  projectId: 'proj-active-1',
  projectTitle: 'Neon Midnight',
  projectCoverUrl: 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?auto=format&fit=crop&q=80&w=400&h=400',
  status: 'ready',
  assets: EXPORT_ASSETS,
  totalSize: '84.3 MB',
  createdAt: new Date(Date.now() - 3600000).toISOString(),
  lastRegenerated: '12 mins ago',
}

export const EXPORT_HISTORY: ExportHistoryEntry[] = [
  { id: 'eh-1', projectTitle: 'Neon Midnight', projectCoverUrl: 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?auto=format&fit=crop&q=80&w=200&h=200', exportType: 'Full Bundle', status: 'ready', date: new Date(Date.now() - 720000).toISOString(), size: '84.3 MB', version: 'v3 Vocal Forward' },
  { id: 'eh-2', projectTitle: 'Porcelain Hour', projectCoverUrl: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&q=80&w=200&h=200', exportType: 'Chord Sheet', status: 'ready', date: new Date(Date.now() - 7200000).toISOString(), size: '45 KB', version: 'v8 Final' },
  { id: 'eh-3', projectTitle: 'Salt Cathedral', exportType: 'Melody Guide', status: 'pending', date: new Date(Date.now() - 14400000).toISOString(), size: '—', version: 'v5' },
  { id: 'eh-4', projectTitle: 'Channel 6 Static', exportType: 'Instrumental Audio', status: 'ready', date: new Date(Date.now() - 86400000).toISOString(), size: '28 MB', version: 'v3' },
  { id: 'eh-5', projectTitle: 'Moss on the Tape Heads', projectCoverUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&q=80&w=200&h=200', exportType: 'Full Bundle', status: 'ready', date: new Date(Date.now() - 86400000 * 2).toISOString(), size: '92.1 MB', version: 'v12 Published' },
  { id: 'eh-6', projectTitle: 'Kettle Light FM', exportType: 'Metadata JSON', status: 'ready', date: new Date(Date.now() - 86400000 * 3).toISOString(), size: '6 KB', version: 'v2' },
  { id: 'eh-7', projectTitle: 'Heat Chassis', exportType: 'Final Audio', status: 'failed', date: new Date(Date.now() - 86400000 * 4).toISOString(), size: '—', version: 'v6' },
  { id: 'eh-8', projectTitle: 'Stave Church Hymn (archived)', exportType: 'Lyrics Sheet', status: 'outdated', date: new Date(Date.now() - 86400000 * 7).toISOString(), size: '1 KB', version: 'v4' },
]
