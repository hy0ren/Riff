import { Outlet } from 'react-router-dom'
import { Sidebar } from './sidebar'
import { GlobalPlayer } from './global-player'

export function AppShell() {
  return (
    <div className="grid h-screen w-screen grid-cols-[240px_1fr] grid-rows-[1fr_72px] overflow-hidden"
         style={{ background: 'var(--riff-surface)' }}>
      {/* Sidebar — spans full height, left column */}
      <aside className="row-span-2 flex flex-col overflow-hidden"
             style={{ background: 'var(--sidebar)' }}
             data-shell-chrome>
        <Sidebar />
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
