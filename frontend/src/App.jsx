import { useEffect } from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';

import Navbar from './components/Navbar';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Verify from './pages/Verify';
import CertificatePreview from './pages/CertificatePreview';
import EventGallery from './pages/EventGallery';
import './index.css';

function App() {
  useEffect(() => {
    const ping = () => 
      fetch(`${import.meta.env.VITE_API_BASE_URL}/certificates/public-stats`)
      .catch(() => {});
    ping();
    const interval = setInterval(ping, 14 * 60 * 1000); // every 14 mins
    return () => clearInterval(interval);
  }, []);

  return (
    <HashRouter>

      <Navbar />
      <div className="page-content">
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/verify" element={<Verify />} />
          <Route path="/verify/:cert_id" element={<Verify />} />
          <Route path="/certificate/:cert_id" element={<CertificatePreview />} />
          <Route path="/event/:event_name" element={<EventGallery />} />
        </Routes>
      </div>
    </HashRouter>
  );
}

export default App;