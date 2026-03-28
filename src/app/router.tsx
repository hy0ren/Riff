import { createBrowserRouter, Navigate } from 'react-router-dom'
import { AppShell } from '@/components/layout/app-shell'

// Feature pages — lazy-loadable in the future
import { HomePage } from '@/features/home/home-page'
import { CreatePage } from '@/features/create/create-page'
import { StudioPage } from '@/features/studio/studio-page'
import { CoachPage } from '@/features/coach/coach-page'
import { LibraryPage } from '@/features/library/library-page'
import { RadioPage } from '@/features/radio/radio-page'
import { ExplorePage } from '@/features/explore/explore-page'
import { ExportsPage } from '@/features/exports/exports-page'
import { SettingsPage } from '@/features/settings/settings-page'
import { TrackDetailsPage } from '@/features/track-details/track-details-page'
import {
  LegacyCoachRedirect,
  LegacyStudioRedirect,
  LegacyTrackRedirect,
} from '@/features/projects/routes/legacy-project-redirects'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppShell />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'create', element: <CreatePage /> },
      { path: 'studio', element: <LegacyStudioRedirect /> },
      { path: 'coach', element: <LegacyCoachRedirect /> },
      { path: 'library', element: <LibraryPage /> },
      { path: 'radio', element: <RadioPage /> },
      { path: 'explore', element: <ExplorePage /> },
      { path: 'exports', element: <ExportsPage /> },
      { path: 'settings', element: <SettingsPage /> },
      { path: 'track/:id', element: <LegacyTrackRedirect /> },
      { path: 'projects/:projectId', element: <TrackDetailsPage /> },
      { path: 'projects/:projectId/versions/:versionId', element: <TrackDetailsPage /> },
      { path: 'projects/:projectId/studio', element: <StudioPage /> },
      { path: 'projects/:projectId/coach', element: <CoachPage /> },
      // Catch-all — redirect to Home
      { path: '*', element: <Navigate to="/" replace /> },
    ],
  },
])
