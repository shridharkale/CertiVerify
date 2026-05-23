import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Shield, Menu, X, LogOut, LayoutDashboard, Home, Search } from 'lucide-react';
import './Navbar.css';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const isLoggedIn = !!localStorage.getItem('cv_token');

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('cv_token');
    localStorage.removeItem('cv_user');
    navigate('/');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav className={`navbar ${scrolled ? 'navbar--scrolled' : ''}`}>
      <div className="navbar__inner">
        {/* Logo */}
        <Link to="/" className="navbar__logo">
          <div className="logo-icon">
            <Shield size={18} strokeWidth={2.5} />
          </div>
          <span className="logo-text">
            Certi<span className="gradient-text">Verify</span>
          </span>
        </Link>

        {/* Desktop Links */}
        <div className="navbar__links">
          <Link to="/" className={`nav-link ${isActive('/') ? 'active' : ''}`}>
            <Home size={15} />
            Home
          </Link>
          <Link to="/verify" className={`nav-link ${isActive('/verify') ? 'active' : ''}`}>
            <Search size={15} />
            Verify
          </Link>
          {isLoggedIn && (
            <Link to="/dashboard" className={`nav-link ${isActive('/dashboard') ? 'active' : ''}`}>
              <LayoutDashboard size={15} />
              Dashboard
            </Link>
          )}
        </div>

        {/* Actions */}
        <div className="navbar__actions">
          {isLoggedIn ? (
            <>
              <span className="nav-user">
                {JSON.parse(localStorage.getItem('cv_user') || '{}').email?.split('@')[0] || 'Organiser'}
              </span>
              <button className="btn btn-sm btn-ghost" onClick={handleLogout}>
                <LogOut size={14} />
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn btn-sm btn-ghost">
                Sign In
              </Link>
              <Link to="/register" className="btn btn-sm btn-primary">
                Get Started
              </Link>
            </>
          )}
        </div>

        {/* Mobile Hamburger */}
        <button
          className="btn-icon navbar__hamburger"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          {menuOpen ? <X size={18} /> : <Menu size={18} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="navbar__mobile">
          <Link to="/" className="mobile-link" onClick={() => setMenuOpen(false)}><Home size={16} /> Home</Link>
          <Link to="/verify" className="mobile-link" onClick={() => setMenuOpen(false)}><Search size={16} /> Verify Certificate</Link>
          {isLoggedIn && (
            <Link to="/dashboard" className="mobile-link" onClick={() => setMenuOpen(false)}><LayoutDashboard size={16} /> Dashboard</Link>
          )}
          <div className="divider" />
          {isLoggedIn ? (
            <button className="mobile-link" onClick={() => { handleLogout(); setMenuOpen(false); }}>
              <LogOut size={16} /> Logout
            </button>
          ) : (
            <>
              <Link to="/login" className="mobile-link" onClick={() => setMenuOpen(false)}>Sign In</Link>
              <Link to="/register" className="btn btn-primary w-full" onClick={() => setMenuOpen(false)}>Get Started</Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
}
