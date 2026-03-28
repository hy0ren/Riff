/**
 * Practice Session Persistence — Lightweight Storage Layer
 *
 * Uses localStorage as a pragmatic Phase 1 persistence mechanism.
 * A Tauri filesystem or Firestore integration can replace this later
 * without changing the Orchestrator's interface.
 *
 * Per coach_architecture.md §6.
 */

import type { PracticeSession } from '@/domain/practice-session'

const KEY_PREFIX = 'riff:practice:'

function getKey(projectId: string): string {
  return `${KEY_PREFIX}${projectId}`
}

/**
 * Appends a completed practice session to persistent storage for the given project.
 */
export function savePracticeSession(projectId: string, session: PracticeSession): void {
  try {
    const existing = loadPracticeSessions(projectId)
    const updated = [session, ...existing].slice(0, 50) // Keep last 50 sessions per project
    localStorage.setItem(getKey(projectId), JSON.stringify(updated))
  } catch {
    // localStorage quota or unavailability is non-fatal
  }
}

/**
 * Loads all persisted practice session records for a project.
 */
export function loadPracticeSessions(projectId: string): PracticeSession[] {
  try {
    const raw = localStorage.getItem(getKey(projectId))
    if (!raw) return []
    return JSON.parse(raw) as PracticeSession[]
  } catch {
    return []
  }
}

/**
 * Returns the count of persisted practice sessions for a project.
 */
export function getPracticeSessionCount(projectId: string): number {
  return loadPracticeSessions(projectId).length
}
