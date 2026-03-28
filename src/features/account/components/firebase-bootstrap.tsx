import { useEffect } from 'react'
import { useAccountStore } from '../store/use-account-store'

export function FirebaseBootstrap() {
  const initialize = useAccountStore((state) => state.initialize)

  useEffect(() => initialize(), [initialize])

  return null
}
