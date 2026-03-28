import { RouterProvider } from 'react-router-dom'
import { TooltipProvider } from '@/components/ui/tooltip'
import { router } from '@/app/router'
import { FirebaseBootstrap } from '@/features/account/components/firebase-bootstrap'

function App() {
  return (
    <TooltipProvider>
      <FirebaseBootstrap />
      <RouterProvider router={router} />
    </TooltipProvider>
  )
}

export default App
