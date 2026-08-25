import { Link, useLocation, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../utils/auth'
import { LogOut, ShieldCheck } from 'lucide-react'

export default function Navbar() {
  const { user, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  const isActive = (path) => location.pathname === path

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <motion.nav
      className="nav"
      initial={{ y: -60, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
    >
      <div className="nav__inner">
        <Link to="/" className="nav__brand">
          <ShieldCheck size={18} strokeWidth={2.5} style={{ color: 'var(--primary)' }} />
          CertiVerify
        </Link>

        <div className="nav__links">
          <Link to="/verify" className={`nav__link ${isActive('/verify') ? 'active' : ''}`}>
            Verify
          </Link>
          {user && (
            <>
              <Link to="/dashboard" className={`nav__link ${isActive('/dashboard') ? 'active' : ''}`}>
                Dashboard
              </Link>
              <Link to="/gallery" className={`nav__link ${isActive('/gallery') ? 'active' : ''}`}>
                Events
              </Link>
            </>
          )}
        </div>

        <div className="nav__actions">
          {user ? (
            <>
              <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                {user.email?.split('@')[0]}
              </span>
              <button className="btn btn-ghost btn-sm" onClick={handleLogout}
                style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <LogOut size={14} /> Sign out
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn btn-ghost btn-sm">Sign in</Link>
              <Link to="/register" className="btn btn-primary btn-sm">Get started</Link>
            </>
          )}
        </div>
      </div>
    </motion.nav>
  )
}