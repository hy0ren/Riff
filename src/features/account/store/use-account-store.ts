import { create } from 'zustand'
import type { User } from 'firebase/auth'
import type { AccountProfile } from '@/domain/account'
import {
  completeFirebaseRedirectSignIn,
  firebaseEnabled,
  loadFirebaseProfile,
  saveFirebaseProfile,
  signInWithFirebaseGoogle,
  signOutFirebase,
  subscribeToFirebaseAuth,
  upsertFirebaseProfile,
} from '@/services/firebase/client'

interface AccountState {
  firebaseEnabled: boolean
  status: 'idle' | 'loading' | 'authenticated' | 'signed_out' | 'error'
  user: User | null
  profile: AccountProfile | null
  errorMessage: string | null
  initialized: boolean
  initialize: () => () => void
  signInWithGoogle: () => Promise<void>
  signOut: () => Promise<void>
  saveProfile: (updates: Pick<AccountProfile, 'displayName' | 'username'>) => Promise<void>
}

let unsubscribeAuth: (() => void) | null = null

export const useAccountStore = create<AccountState>((set, get) => ({
  firebaseEnabled: firebaseEnabled(),
  status: 'idle',
  user: null,
  profile: null,
  errorMessage: null,
  initialized: false,
  initialize: () => {
    if (!firebaseEnabled()) {
      set({
        firebaseEnabled: false,
        status: 'signed_out',
        initialized: true,
      })
      return () => undefined
    }

    if (unsubscribeAuth) {
      return unsubscribeAuth
    }

    set({ status: 'loading' })
    void completeFirebaseRedirectSignIn().catch((error) => {
      set((state) => ({
        ...state,
        errorMessage:
          error instanceof Error ? error.message : 'Firebase redirect sign-in failed.',
      }))
    })
    unsubscribeAuth = subscribeToFirebaseAuth(async (user) => {
      if (!user) {
        set({
          user: null,
          profile: null,
          status: 'signed_out',
          initialized: true,
          errorMessage: null,
        })
        return
      }

      try {
        const profile = (await loadFirebaseProfile(user.uid)) ?? (await upsertFirebaseProfile(user))
        set({
          user,
          profile,
          status: 'authenticated',
          initialized: true,
          errorMessage: null,
        })
      } catch (error) {
        set({
          user,
          profile: null,
          status: 'error',
          initialized: true,
          errorMessage:
            error instanceof Error ? error.message : 'Failed to load Firebase profile.',
        })
      }
    })

    return () => {
      unsubscribeAuth?.()
      unsubscribeAuth = null
    }
  },
  signInWithGoogle: async () => {
    if (!firebaseEnabled()) {
      set({
        errorMessage: 'Firebase is not configured yet. Add the Firebase env vars first.',
        status: 'error',
      })
      return
    }

    set({ status: 'loading', errorMessage: null })
    try {
      const user = await signInWithFirebaseGoogle()
      if (!user) {
        return
      }
      const profile = await upsertFirebaseProfile(user)
      set({
        user,
        profile,
        status: 'authenticated',
        errorMessage: null,
      })
    } catch (error) {
      set({
        status: 'error',
        errorMessage:
          error instanceof Error ? error.message : 'Firebase sign-in failed.',
      })
    }
  },
  signOut: async () => {
    try {
      await signOutFirebase()
      set({
        user: null,
        profile: null,
        status: 'signed_out',
        errorMessage: null,
      })
    } catch (error) {
      set({
        status: 'error',
        errorMessage:
          error instanceof Error ? error.message : 'Sign out failed.',
      })
    }
  },
  saveProfile: async (updates) => {
    const { profile } = get()
    if (!profile) {
      return
    }

    const nextProfile = await saveFirebaseProfile({
      ...profile,
      displayName: updates.displayName.trim() || profile.displayName,
      username: updates.username.trim().toLowerCase() || profile.username,
    })

    set({
      profile: nextProfile,
      errorMessage: null,
      status: 'authenticated',
    })
  },
}))
