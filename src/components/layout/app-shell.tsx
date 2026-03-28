import { useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import { useIntegrationStore } from '@/features/integrations/store/use-integration-store'
import { useSettingsStore } from '@/features/settings/store/use-settings-store'
import { usePlaybackStore } from '@/features/playback/store/use-playback-store'
import { Sidebar } from './sidebar'
import { GlobalPlayer } from './global-player'

export function AppShell() {
  const compactSidebar = useSettingsStore((state) => state.appearance.compactSidebar)
  const reduceMotion = useSettingsStore((state) => state.appearance.reduceMotion)
  const typographyScale = useSettingsStore((state) => state.appearance.typographyScale)
  const defaultVolume = useSettingsStore((state) => state.playback.defaultVolume)

  useEffect(() => {
    void useIntegrationStore.getState().silentRefreshSpotify()
  }, [])

  useEffect(() => {
    const root = document.documentElement
    root.classList.toggle('riff-reduce-motion', reduceMotion)
    root.style.setProperty(
      '--riff-type-scale',
      typographyScale === 'compact' ? '0.96' : typographyScale === 'comfortable' ? '1.04' : '1',
    )
  }, [reduceMotion, typographyScale])

  useEffect(() => {
    usePlaybackStore.getState().setVolume(defaultVolume)
  }, [defaultVolume])

  return (
    <div className="grid h-screen w-screen grid-rows-[1fr_72px] overflow-hidden"
         style={{
           gridTemplateColumns: compactSidebar ? '220px 1fr' : '240px 1fr',
           background: 'var(--riff-surface)',
         }}
         data-compact-sidebar={compactSidebar ? 'true' : 'false'}>
      {/* Sidebar — spans full height, left column */}
      <aside className="row-span-2 flex flex-col overflow-hidden"
             style={{ background: 'var(--sidebar)' }}
             data-shell-chrome>
        <Sidebar compact={compactSidebar} />
      </aside>

      {/* Main content — sized container; each page manages its own scroll */}
      <main className="overflow-hidden"
            style={{ background: 'var(--riff-surface)' }}>
        <Outlet />
      </main>

      {/* Global player — full width of content area */}
      <footer className="riff-ghost-border-top"
              style={{ background: 'var(--riff-surface-mid)' }}
              data-shell-chrome>
        <GlobalPlayer />
      </footer>
    </div>
  )
}
