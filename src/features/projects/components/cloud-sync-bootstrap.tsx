import { useEffect, useRef } from 'react'
import { useAccountStore } from '@/features/account/store/use-account-store'
import { useProjectStore } from '@/features/projects/store/use-project-store'
import { saveFirebaseProjects } from '@/services/firebase/client'

const SYNC_DEBOUNCE_MS = 2000

export function CloudSyncBootstrap() {
  const profile = useAccountStore((state) => state.profile)
  const projects = useProjectStore((state) => state.projects)
  const isFirstRender = useRef(true)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    // skip sync on initial load to avoid redundant hits
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }

    // only sync if we have an authenticated profile
    if (!profile?.uid) {
      return
    }

    // clear previous timeout if any
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    // debounce cloud save
    timeoutRef.current = setTimeout(async () => {
      try {
        console.log('[CloudSync] Auto-saving library to Firestore...')
        await saveFirebaseProjects(profile.uid, projects)
        console.log('[CloudSync] Sync complete.')
      } catch (error) {
        console.error('[CloudSync] Auto-save failed:', error)
      }
    }, SYNC_DEBOUNCE_MS)

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [projects, profile?.uid])

  return null
}
