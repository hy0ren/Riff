import { PageFrame } from '@/components/layout/page-frame'
import { Button } from '@/components/ui/button'
import { useCallback, useRef, useState } from 'react'
import { FolderOpen, RefreshCw } from 'lucide-react'
import { SettingsNav } from './components/settings-nav'
import { AccountSection } from './components/account-section'
import { AppearanceSection } from './components/appearance-section'
import { PlaybackSection } from './components/playback-section'
import { CreationSection } from './components/creation-section'
import { ExportPrefsSection } from './components/export-prefs-section'
import { StorageSection } from './components/storage-section'
import { PrivacySection } from './components/privacy-section'
import { NotificationsSection } from './components/notifications-section'
import { IntegrationsSection } from './components/integrations-section'
import { AudioSection } from './components/audio-section'
import { AdvancedSection } from './components/advanced-section'

export function SettingsPage() {
  const [activeSection, setActiveSection] = useState('account')
  const scrollRef = useRef<HTMLDivElement>(null)

  const handleNavigate = useCallback((id: string) => {
    setActiveSection(id)
    const el = document.getElementById(id)
    if (el && scrollRef.current) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [])

  return (
    <PageFrame
      title="Settings"
      subtitle="Configuration, integrations, and preferences"
      actions={
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-8 gap-1.5 rounded-lg px-3 text-[12px]">
            <RefreshCw className="h-3.5 w-3.5" /> Reset to Defaults
          </Button>
          <Button variant="outline" size="sm" className="h-8 gap-1.5 rounded-lg px-3 text-[12px]">
            <FolderOpen className="h-3.5 w-3.5" /> Open App Folder
          </Button>
        </div>
      }
    >
      <div className="flex gap-8">
        {/* Left nav */}
        <div className="sticky top-0 w-[200px] shrink-0 self-start">
          <SettingsNav activeSection={activeSection} onNavigate={handleNavigate} />
        </div>

        {/* Content */}
        <div ref={scrollRef} className="flex-1 space-y-10 pb-16">
          <AccountSection />
          <AppearanceSection />
          <PlaybackSection />
          <CreationSection />
          <ExportPrefsSection />
          <StorageSection />
          <PrivacySection />
          <NotificationsSection />
          <IntegrationsSection />
          <AudioSection />
          <AdvancedSection />
        </div>
      </div>
    </PageFrame>
  )
}
