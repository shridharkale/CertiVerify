import { Suspense, lazy } from 'react'
import { HashRouter, Navigate, Routes, Route } from 'react-router-dom'
import { AuthProvider, useAuth } from './utils/auth'
import ErrorBoundary from './components/ErrorBoundary'
import NotFound from './pages/NotFound'
import './index.css'

const Landing            = lazy(() => import('./pages/Landing'))
const Login              = lazy(() => import('./pages/Login'))
const Register           = lazy(() => import('./pages/Register'))
const Dashboard          = lazy(() => import('./pages/Dashboard'))
const Verify             = lazy(() => import('./pages/Verify'))
const CertificatePreview = lazy(() => import('./pages/CertificatePreview'))
const EventGallery       = lazy(() => import('./pages/EventGallery'))

const PageLoader = () => (
  <div style={{
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    minHeight: '100vh', color: 'var(--text-muted)', fontSize: 14, gap: 10
  }}>
    <span className="spinner" /> Loading…
  </div>
)

const S = ({ children }) => (
  <ErrorBoundary>
    <Suspense fallback={<PageLoader />}>
      {children}
    </Suspense>
  </ErrorBoundary>
)

function Protected({ children }) {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  return children
}

function App() {
  return (
    <HashRouter>
      <AuthProvider>
        <Routes>
          <Route path="/"                    element={<S><Landing /></S>} />
          <Route path="/login"               element={<S><Login /></S>} />
          <Route path="/register"            element={<S><Register /></S>} />
          <Route path="/dashboard"           element={<S><Protected><Dashboard /></Protected></S>} />
          <Route path="/verify"              element={<S><Verify /></S>} />
          <Route path="/verify/:cert_id"     element={<S><Verify /></S>} />
          <Route path="/certificate/:certId" element={<S><CertificatePreview /></S>} />
          <Route path="/gallery"             element={<S><EventGallery /></S>} />
          <Route path="/gallery/:event_name" element={<S><EventGallery /></S>} />
          <Route path="*"                    element={<ErrorBoundary><NotFound /></ErrorBoundary>} />
        </Routes>
      </AuthProvider>
    </HashRouter>
  )
}

export default App
