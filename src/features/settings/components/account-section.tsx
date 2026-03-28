import { useEffect, useMemo, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { CloudDownload, CloudUpload, LogIn, LogOut, Pencil, Save } from 'lucide-react'
import { useAccountStore } from '@/features/account/store/use-account-store'
import { useProjectStore } from '@/features/projects/store/use-project-store'
import {
  firebaseEnabled,
  getFirebaseProjectId,
  loadFirebaseProjects,
  saveFirebaseProjects,
} from '@/services/firebase/client'

function getInitials(name: string | undefined): string {
  if (!name) {
    return 'RR'
  }

  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}

export function AccountSection() {
  const accountStatus = useAccountStore((state) => state.status)
  const firebaseReady = useAccountStore((state) => state.firebaseEnabled)
  const profile = useAccountStore((state) => state.profile)
  const errorMessage = useAccountStore((state) => state.errorMessage)
  const signInWithGoogle = useAccountStore((state) => state.signInWithGoogle)
  const signOut = useAccountStore((state) => state.signOut)
  const saveProfile = useAccountStore((state) => state.saveProfile)
  const projects = useProjectStore((state) => state.projects)
  const replaceProjects = useProjectStore((state) => state.replaceProjects)

  const [displayName, setDisplayName] = useState('')
  const [username, setUsername] = useState('')
  const [isSyncingUp, setIsSyncingUp] = useState(false)
  const [isSyncingDown, setIsSyncingDown] = useState(false)
  const [syncMessage, setSyncMessage] = useState<string | null>(null)

  useEffect(() => {
    setDisplayName(profile?.displayName ?? '')
    setUsername(profile?.username ?? '')
  }, [profile?.displayName, profile?.username])

  const stats = useMemo(() => ({
    totalProjects: projects.length,
    favoriteProjects: projects.filter((project) => project.library.isFavorite).length,
    exportedProjects: projects.filter((project) => project.library.isExported).length,
  }), [projects])

  const handleSaveProfile = async () => {
    await saveProfile({ displayName, username })
    setSyncMessage('Profile saved to Firebase.')
  }

  const handlePushLibrary = async () => {
    if (!profile) {
      return
    }

    setIsSyncingUp(true)
    setSyncMessage(null)
    try {
      await saveFirebaseProjects(profile.uid, projects)
      setSyncMessage('Local library pushed to Firestore.')
    } catch (error) {
      setSyncMessage(error instanceof Error ? error.message : 'Cloud push failed.')
    } finally {
      setIsSyncingUp(false)
    }
  }

  const handlePullLibrary = async () => {
    if (!profile) {
      return
    }

    setIsSyncingDown(true)
    setSyncMessage(null)
    try {
      const cloudProjects = await loadFirebaseProjects(profile.uid)
      if (cloudProjects.length) {
        replaceProjects(cloudProjects)
        setSyncMessage('Cloud library loaded into this device.')
      } else {
        setSyncMessage('No cloud projects found yet.')
      }
    } catch (error) {
      setSyncMessage(error instanceof Error ? error.message : 'Cloud pull failed.')
    } finally {
      setIsSyncingDown(false)
    }
  }

  const firebaseProjectId = firebaseEnabled() ? getFirebaseProjectId() : undefined

  return (
    <section id="account" className="space-y-6">
      <div>
        <h3 className="font-display text-base font-bold text-[var(--riff-text-primary)]">
          Account
        </h3>
        <p className="mt-1 text-sm text-[var(--riff-text-muted)]">
          Profile, session, and cloud library sync
        </p>
      </div>

      <div
        className="rounded-xl border border-white/[0.04] p-5"
        style={{ background: 'var(--riff-surface-low)' }}
      >
        {!firebaseReady ? (
          <div className="space-y-3">
            <h4 className="font-display text-base font-bold text-[var(--riff-text-primary)]">
              Firebase is not configured yet
            </h4>
            <p className="text-sm text-[var(--riff-text-muted)]">
              Add your Firebase web app env vars to enable Google login, user profiles, and Firestore-backed project sync.
            </p>
          </div>
        ) : !profile ? (
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <h4 className="font-display text-base font-bold text-[var(--riff-text-primary)]">
                Sign in to enable cloud accounts
              </h4>
              <p className="text-sm text-[var(--riff-text-muted)]">
                Use Google sign-in for profiles, account-backed project sync, and future desktop deployment continuity.
              </p>
              {firebaseProjectId ? (
                <p className="text-xs text-[var(--riff-text-faint)]">Firebase project: {firebaseProjectId}</p>
              ) : null}
              {errorMessage ? (
                <p className="text-xs text-amber-200">{errorMessage}</p>
              ) : null}
            </div>
            <Button onClick={() => void signInWithGoogle()} className="gap-2 sm:self-start">
              <LogIn className="size-4" />
              {accountStatus === 'loading' ? 'Connecting…' : 'Sign in with Google'}
            </Button>
          </div>
        ) : (
          <>
            <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex gap-4">
                {profile.photoURL ? (
                  <img
                    src={profile.photoURL}
                    alt=""
                    className="size-16 shrink-0 rounded-full object-cover"
                  />
                ) : (
                  <div
                    className="flex size-16 shrink-0 items-center justify-center rounded-full font-display text-lg font-bold text-[var(--riff-text-primary)]"
                    style={{ background: 'var(--riff-surface-mid)' }}
                  >
                    {getInitials(profile.displayName)}
                  </div>
                )}
                <div className="min-w-0 space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <h4 className="font-display text-base font-bold text-[var(--riff-text-primary)]">
                      {profile.displayName}
                    </h4>
                    <Badge variant="secondary" className="text-[10px] uppercase tracking-wide">
                      {profile.plan}
                    </Badge>
                  </div>
                  <p className="text-sm text-[var(--riff-text-secondary)]">@{profile.username}</p>
                  <p className="text-sm text-[var(--riff-text-muted)]">{profile.email}</p>
                  <p className="text-xs text-[var(--riff-text-faint)]">
                    Joined {new Date(profile.createdAt).toLocaleDateString()}
                  </p>
                  {firebaseProjectId ? (
                    <p className="text-xs text-[var(--riff-text-faint)]">Firebase project: {firebaseProjectId}</p>
                  ) : null}
                </div>
              </div>

              <div className="flex shrink-0 flex-wrap gap-2 sm:justify-end">
                <Button variant="outline" size="sm" className="gap-1.5" onClick={() => void handleSaveProfile()}>
                  <Save className="size-3.5" data-icon="inline-start" />
                  Save Profile
                </Button>
                <Button variant="ghost" size="sm" className="gap-1.5 text-[var(--riff-text-muted)]" onClick={() => void signOut()}>
                  <LogOut className="size-3.5" data-icon="inline-start" />
                  Sign Out
                </Button>
              </div>
            </div>

            <div className="mt-6 grid gap-4 border-t border-white/[0.06] pt-6 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--riff-text-faint)]">
                  Display name
                </label>
                <Input value={displayName} onChange={(event) => setDisplayName(event.target.value)} />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--riff-text-faint)]">
                  Username
                </label>
                <Input value={username} onChange={(event) => setUsername(event.target.value.toLowerCase())} />
              </div>
            </div>

            <div className="mt-6 grid gap-3 border-t border-white/[0.06] pt-6 sm:grid-cols-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--riff-text-faint)]">
                  Library projects
                </p>
                <p className="mt-1 font-display text-lg font-bold text-[var(--riff-text-primary)]">
                  {stats.totalProjects}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--riff-text-faint)]">
                  Favorites
                </p>
                <p className="mt-1 font-display text-lg font-bold text-[var(--riff-text-primary)]">
                  {stats.favoriteProjects}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--riff-text-faint)]">
                  Exported
                </p>
                <p className="mt-1 font-display text-lg font-bold text-[var(--riff-text-primary)]">
                  {stats.exportedProjects}
                </p>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-2 border-t border-white/[0.06] pt-6">
              <Button variant="outline" size="sm" className="gap-2" onClick={() => void handlePushLibrary()} disabled={isSyncingUp}>
                <CloudUpload className="size-4" />
                {isSyncingUp ? 'Pushing…' : 'Push Local Library'}
              </Button>
              <Button variant="outline" size="sm" className="gap-2" onClick={() => void handlePullLibrary()} disabled={isSyncingDown}>
                <CloudDownload className="size-4" />
                {isSyncingDown ? 'Pulling…' : 'Pull Cloud Library'}
              </Button>
              <Button variant="ghost" size="sm" className="gap-2" onClick={() => void handleSaveProfile()}>
                <Pencil className="size-4" />
                Update Profile
              </Button>
            </div>

            {syncMessage ? (
              <p className="mt-3 text-xs text-[var(--riff-text-secondary)]">{syncMessage}</p>
            ) : null}
            {errorMessage ? (
              <p className="mt-2 text-xs text-amber-200">{errorMessage}</p>
            ) : null}
          </>
        )}
      </div>
    </section>
  )
}
