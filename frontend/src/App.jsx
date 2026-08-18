import { useEffect, useState, Suspense, lazy } from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import ErrorBoundary from './components/ErrorBoundary';
import NotFound from './pages/NotFound';
import './index.css';

const Landing = lazy(() => import('./pages/Landing'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Verify = lazy(() => import('./pages/Verify'));
const CertificatePreview = lazy(() => import('./pages/CertificatePreview'));
const EventGallery = lazy(() => import('./pages/EventGallery'));

const PageLoader = () => (
  <div className="page-loader">
    <span className="loader-ring" />
    Loading...
  </div>
);

function App() {
  const [offline, setOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const ping = () => {
      fetch(`${import.meta.env.VITE_API_BASE_URL}/certificates/public-stats`).catch(() => {
        window.dispatchEvent(new CustomEvent('api-network-error'));
      });
    };

    ping();
    const interval = setInterval(ping, 14 * 60 * 1000);

    const handleOffline = () => setOffline(true);
    const handleOnline = () => setOffline(false);
    const handleNetworkError = () => setOffline(true);

    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);
    window.addEventListener('api-network-error', handleNetworkError);

    return () => {
      clearInterval(interval);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('api-network-error', handleNetworkError);
    };
  }, []);

  return (
    <HashRouter>
      <Navbar />
      {offline && (
        <div className="network-banner">⚠️ Connection lost. Retrying...</div>
      )}
      <div className="page-content">
        <Routes>
          <Route path="/" element={<ErrorBoundary><Suspense fallback={<PageLoader />}><Landing /></Suspense></ErrorBoundary>} />
          <Route path="/login" element={<ErrorBoundary><Suspense fallback={<PageLoader />}><Login /></Suspense></ErrorBoundary>} />
          <Route path="/register" element={<ErrorBoundary><Suspense fallback={<PageLoader />}><Register /></Suspense></ErrorBoundary>} />
          <Route path="/dashboard" element={<ErrorBoundary><Suspense fallback={<PageLoader />}><Dashboard /></Suspense></ErrorBoundary>} />
          <Route path="/verify" element={<ErrorBoundary><Suspense fallback={<PageLoader />}><Verify /></Suspense></ErrorBoundary>} />
          <Route path="/verify/:cert_id" element={<ErrorBoundary><Suspense fallback={<PageLoader />}><Verify /></Suspense></ErrorBoundary>} />
          <Route path="/certificate/:cert_id" element={<ErrorBoundary><Suspense fallback={<PageLoader />}><CertificatePreview /></Suspense></ErrorBoundary>} />
          <Route path="/event/:event_name" element={<ErrorBoundary><Suspense fallback={<PageLoader />}><EventGallery /></Suspense></ErrorBoundary>} />
          <Route path="*" element={<ErrorBoundary><NotFound /></ErrorBoundary>} />
        </Routes>
      </div>
    </HashRouter>
  );
}

export default App;