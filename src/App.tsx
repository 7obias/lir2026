import { useState } from 'react'
import { useRegisterSW } from 'virtual:pwa-register/react'
import { AppProvider, useApp } from './app/AppContext'
import { BottomNav, type View } from './components/BottomNav'
import { ArtistsPage } from './pages/ArtistsPage'
import { NowPage } from './pages/NowPage'
import { PlanPage } from './pages/PlanPage'
import { SettingsPage } from './pages/SettingsPage'
import { TimelinePage } from './pages/TimelinePage'
function Shell() {
  const [view, setView] = useState<View>('timeline'); const { loading, error } = useApp()
  const { needRefresh: [needRefresh], updateServiceWorker } = useRegisterSW({ onRegisterError: () => undefined })
  return <><main id="main-content">{loading ? <div className="app-loading"><div className="pulse-logo">LIR</div><p>Loading your planner…</p></div> : <>
    {error && <div className="global-error" role="alert">{error}</div>}
    {view === 'timeline' && <TimelinePage />}{view === 'artists' && <ArtistsPage />}{view === 'plan' && <PlanPage />}{view === 'now' && <NowPage />}{view === 'settings' && <SettingsPage />}
  </>}</main><BottomNav view={view} onChange={setView} />{needRefresh && <div className="update-toast" role="status"><span>A new version is ready.</span><button onClick={() => updateServiceWorker(true)}>Update now</button></div>}</>
}
export default function App() { return <AppProvider><Shell /></AppProvider> }
