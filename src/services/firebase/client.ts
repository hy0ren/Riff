import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app'
import {
  browserLocalPersistence,
  getAuth,
  getRedirectResult,
  GoogleAuthProvider,
  onAuthStateChanged,
  setPersistence,
  signInWithRedirect,
  signInWithPopup,
  signOut,
  type User,
} from 'firebase/auth'
import {
  doc,
  getDoc,
  getDocs,
  getFirestore,
  serverTimestamp,
  setDoc,
  writeBatch,
  collection,
} from 'firebase/firestore'
import type { AccountProfile } from '@/domain/account'
import type { PersistedProject } from '@/domain/project'
import { assertFirebaseConfigured, getProviderConfig, isFirebaseConfigured } from '@/lib/config/provider-config'

let firebaseApp: FirebaseApp | undefined
let redirectResultResolved = false

function sanitizeForFirestore<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

function buildDefaultUsername(displayName: string | null | undefined, email: string | null | undefined): string {
  if (displayName?.trim()) {
    return displayName
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '')
      .slice(0, 20)
  }

  if (email?.trim()) {
    return email.split('@')[0].replace(/[^a-z0-9]+/gi, '').toLowerCase().slice(0, 20)
  }

  return 'riffuser'
}

function isTauriDesktopRuntime(): boolean {
  if (typeof window === 'undefined') {
    return false
  }

  const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : ''
  return Boolean(
    '__TAURI_INTERNALS__' in window ||
      '__TAURI__' in window ||
      userAgent.includes('Tauri'),
  )
}

function isFirebasePopupBlockedError(error: unknown): boolean {
  return (
    error instanceof Error &&
    /auth\/popup-blocked|auth\/cancelled-popup-request/i.test(error.message)
  )
}

export function firebaseEnabled(): boolean {
  return isFirebaseConfigured()
}

export function getFirebaseAppInstance(): FirebaseApp {
  if (firebaseApp) {
    return firebaseApp
  }

  const config = assertFirebaseConfigured()
  const firebaseConfig = {
    apiKey: config.firebaseApiKey,
    authDomain: config.firebaseAuthDomain,
    projectId: config.firebaseProjectId,
    storageBucket: config.firebaseStorageBucket,
    messagingSenderId: config.firebaseMessagingSenderId,
    appId: config.firebaseAppId,
    measurementId: config.firebaseMeasurementId,
  }

  firebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig)
  return firebaseApp
}

export function getFirebaseAuthInstance() {
  return getAuth(getFirebaseAppInstance())
}

export function getFirebaseDbInstance() {
  return getFirestore(getFirebaseAppInstance())
}

export async function completeFirebaseRedirectSignIn(): Promise<User | null> {
  if (redirectResultResolved) {
    return null
  }

  redirectResultResolved = true
  const auth = getFirebaseAuthInstance()
  const result = await getRedirectResult(auth)
  return result?.user ?? null
}

export async function signInWithFirebaseGoogle(): Promise<User | null> {
  const auth = getFirebaseAuthInstance()
  await setPersistence(auth, browserLocalPersistence)
  const provider = new GoogleAuthProvider()
  provider.setCustomParameters({ prompt: 'select_account' })

  if (isTauriDesktopRuntime()) {
    await signInWithRedirect(auth, provider)
    return null
  }

  try {
    const result = await signInWithPopup(auth, provider)
    return result.user
  } catch (error) {
    if (isFirebasePopupBlockedError(error)) {
      await signInWithRedirect(auth, provider)
      return null
    }

    throw error
  }
}

export async function signOutFirebase(): Promise<void> {
  await signOut(getFirebaseAuthInstance())
}

export function subscribeToFirebaseAuth(
  callback: (user: User | null) => void,
): () => void {
  return onAuthStateChanged(getFirebaseAuthInstance(), callback)
}

export async function upsertFirebaseProfile(user: User): Promise<AccountProfile> {
  const db = getFirebaseDbInstance()
  const ref = doc(db, 'users', user.uid)
  const existing = await getDoc(ref)
  const now = new Date().toISOString()
  const baseProfile: AccountProfile = {
    uid: user.uid,
    email: user.email ?? undefined,
    displayName: user.displayName ?? user.email?.split('@')[0] ?? 'Riff User',
    username: buildDefaultUsername(user.displayName, user.email),
    photoURL: user.photoURL ?? undefined,
    createdAt: now,
    updatedAt: now,
    plan: 'free',
  }

  const mergedProfile: AccountProfile = existing.exists()
    ? {
        ...baseProfile,
        ...(existing.data() as Partial<AccountProfile>),
        uid: user.uid,
        email: user.email ?? (existing.data().email as string | undefined),
        displayName:
          user.displayName ??
          ((existing.data().displayName as string | undefined) ?? baseProfile.displayName),
        photoURL: user.photoURL ?? (existing.data().photoURL as string | undefined),
        updatedAt: now,
      }
    : baseProfile

  await setDoc(
    ref,
    {
      ...sanitizeForFirestore(mergedProfile),
      updatedAt: now,
      createdAt: existing.exists() ? (existing.data().createdAt ?? mergedProfile.createdAt) : now,
      lastLoginAt: serverTimestamp(),
    },
    { merge: true },
  )

  return {
    ...mergedProfile,
    createdAt: existing.exists()
      ? ((existing.data().createdAt as string | undefined) ?? mergedProfile.createdAt)
      : mergedProfile.createdAt,
  }
}

export async function saveFirebaseProfile(profile: AccountProfile): Promise<AccountProfile> {
  const db = getFirebaseDbInstance()
  const now = new Date().toISOString()
  const normalizedProfile = {
    ...profile,
    username: profile.username.trim().toLowerCase(),
    updatedAt: now,
  }
  await setDoc(doc(db, 'users', profile.uid), sanitizeForFirestore(normalizedProfile), {
    merge: true,
  })
  return normalizedProfile
}

export async function loadFirebaseProfile(uid: string): Promise<AccountProfile | undefined> {
  const db = getFirebaseDbInstance()
  const snapshot = await getDoc(doc(db, 'users', uid))
  if (!snapshot.exists()) {
    return undefined
  }
  return snapshot.data() as AccountProfile
}

export async function loadFirebaseProjects(uid: string): Promise<PersistedProject[]> {
  const db = getFirebaseDbInstance()
  const querySnapshot = await getDocs(collection(db, 'users', uid, 'projects'))
  return querySnapshot.docs
    .map((docSnapshot) => docSnapshot.data() as PersistedProject)
    .sort(
      (left, right) =>
        new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime(),
    )
}

export async function saveFirebaseProjects(
  uid: string,
  projects: PersistedProject[],
): Promise<void> {
  const db = getFirebaseDbInstance()
  const batch = writeBatch(db)
  const projectCollection = collection(db, 'users', uid, 'projects')
  const existing = await getDocs(projectCollection)
  const nextProjectIds = new Set(projects.map((project) => project.id))

  existing.docs.forEach((docSnapshot) => {
    if (!nextProjectIds.has(docSnapshot.id)) {
      batch.delete(docSnapshot.ref)
    }
  })

  projects.forEach((project) => {
    const ref = doc(db, 'users', uid, 'projects', project.id)
    batch.set(ref, sanitizeForFirestore(project))
  })

  await batch.commit()
}

export function getFirebaseProjectId(): string | undefined {
  return getProviderConfig().firebaseProjectId
}
