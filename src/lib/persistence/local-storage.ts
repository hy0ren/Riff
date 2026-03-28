function canUseLocalStorage(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
}

export function readStorageValue(key: string, fallback = ''): string {
  if (!canUseLocalStorage()) {
    return fallback
  }

  const value = window.localStorage.getItem(key)
  return value ?? fallback
}

export function readStorageJson<T>(key: string, fallback: T): T {
  if (!canUseLocalStorage()) {
    return fallback
  }

  try {
    const value = window.localStorage.getItem(key)
    return value ? (JSON.parse(value) as T) : fallback
  } catch {
    return fallback
  }
}

export function writeStorageJson<T>(key: string, value: T): void {
  if (!canUseLocalStorage()) {
    return
  }

  try {
    window.localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Ignore persistence failures in the prototype foundation layer.
  }
}

export function writeStorageValue(key: string, value: string): void {
  if (!canUseLocalStorage()) {
    return
  }

  try {
    window.localStorage.setItem(key, value)
  } catch {
    // Ignore persistence failures in the prototype foundation layer.
  }
}

export function removeStorageValue(key: string): void {
  if (!canUseLocalStorage()) {
    return
  }

  try {
    window.localStorage.removeItem(key)
  } catch {
    // Ignore persistence failures in the prototype foundation layer.
  }
}
