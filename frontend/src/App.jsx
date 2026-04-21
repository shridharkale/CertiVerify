import { HashRouter, Routes, Route } from 'react-router-dom';
import VideoBackground from './components/VideoBackground';
import Navbar from './components/Navbar';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Verify from './pages/Verify';
import CertificatePreview from './pages/CertificatePreview';
import './index.css';

function App() {
  return (
    <HashRouter>
      <VideoBackground />
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
        </Routes>
      </div>
    </HashRouter>
  );
}

export default App;