import { lazy, Suspense } from 'react'
import { Route, Routes } from 'react-router-dom'
import { AppShell } from './components/layout/AppShell'
import { RouteGuard } from './app/guards/RouteGuard'
import { BootPage } from './pages/BootPage'

const IncidentPage = lazy(() =>
  import('./pages/IncidentPage').then((module) => ({ default: module.IncidentPage })),
)
const InterrogationPage = lazy(() =>
  import('./pages/InterrogationPage').then((module) => ({ default: module.InterrogationPage })),
)
const EvidencePage = lazy(() =>
  import('./pages/EvidencePage').then((module) => ({ default: module.EvidencePage })),
)
const MikhaylychPage = lazy(() =>
  import('./pages/MikhaylychPage').then((module) => ({ default: module.MikhaylychPage })),
)
const TrialsPage = lazy(() =>
  import('./pages/TrialsPage').then((module) => ({ default: module.TrialsPage })),
)
const PlannerPage = lazy(() =>
  import('./pages/PlannerPage').then((module) => ({ default: module.PlannerPage })),
)
const ArchivePage = lazy(() =>
  import('./pages/ArchivePage').then((module) => ({ default: module.ArchivePage })),
)
const RadioPage = lazy(() =>
  import('./pages/RadioPage').then((module) => ({ default: module.RadioPage })),
)
const SecretRoomPage = lazy(() =>
  import('./pages/SecretRoomPage').then((module) => ({ default: module.SecretRoomPage })),
)
const FinalPage = lazy(() => import('./pages/FinalPage').then((module) => ({ default: module.FinalPage })))
const EpiloguePage = lazy(() =>
  import('./pages/EpiloguePage').then((module) => ({ default: module.EpiloguePage })),
)
const NotFoundPage = lazy(() =>
  import('./pages/NotFoundPage').then((module) => ({ default: module.NotFoundPage })),
)

function PageLoader() {
  return (
    <div className="grid min-h-[60dvh] place-items-center px-6 text-center">
      <div>
        <div className="mx-auto h-px w-24 bg-[var(--accent)]/40">
          <div className="h-px w-1/2 animate-pulse-soft bg-[var(--accent)]" />
        </div>
        <p className="mt-3 font-mono text-[9px] uppercase tracking-[0.24em] text-[var(--fg-muted)]">
          архив перелистывает страницу…
        </p>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route element={<AppShell />}>
          <Route index element={<BootPage />} />
          <Route
            path="incident"
            element={
              <RouteGuard screen="incident">
                <IncidentPage />
              </RouteGuard>
            }
          />
          <Route
            path="interrogation"
            element={
              <RouteGuard screen="interrogation">
                <InterrogationPage />
              </RouteGuard>
            }
          />
          <Route
            path="evidence"
            element={
              <RouteGuard screen="evidence">
                <EvidencePage />
              </RouteGuard>
            }
          />
          <Route
            path="mikhaylych"
            element={
              <RouteGuard screen="mikhaylych">
                <MikhaylychPage />
              </RouteGuard>
            }
          />
          <Route
            path="trials"
            element={
              <RouteGuard screen="trials">
                <TrialsPage />
              </RouteGuard>
            }
          />
          <Route
            path="planner"
            element={
              <RouteGuard screen="planner">
                <PlannerPage />
              </RouteGuard>
            }
          />
          <Route
            path="archive"
            element={
              <RouteGuard screen="archive">
                <ArchivePage />
              </RouteGuard>
            }
          />
          <Route
            path="radio"
            element={
              <RouteGuard screen="radio">
                <RadioPage />
              </RouteGuard>
            }
          />
          <Route
            path="secret"
            element={
              <RouteGuard screen="secret">
                <SecretRoomPage />
              </RouteGuard>
            }
          />
          <Route
            path="final"
            element={
              <RouteGuard screen="final">
                <FinalPage />
              </RouteGuard>
            }
          />
          <Route
            path="epilogue"
            element={
              <RouteGuard screen="epilogue">
                <EpiloguePage />
              </RouteGuard>
            }
          />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </Suspense>
  )
}

