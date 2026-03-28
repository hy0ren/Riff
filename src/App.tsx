import { RouterProvider } from 'react-router-dom'
import { TooltipProvider } from '@/components/ui/tooltip'
import { router } from '@/app/router'
import { FirebaseBootstrap } from '@/features/account/components/firebase-bootstrap'
import { CloudSyncBootstrap } from '@/features/projects/components/cloud-sync-bootstrap'

function App() {
  return (
    <TooltipProvider>
      <FirebaseBootstrap />
      <CloudSyncBootstrap />
      <RouterProvider router={router} />
    </TooltipProvider>
  )
}

export default App
