import { Link } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';

export default function NotFound() {
  return (
    <div style={{ 
      textAlign: 'center', 
      padding: '120px 24px',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg-primary)',
      color: 'var(--text-primary)'
    }}>
      <AlertCircle size={64} style={{ color: '#7C3AED', marginBottom: '20px', opacity: 0.7 }} />
      <h1 style={{ fontSize: '64px', fontWeight: '900', margin: '0 0 12px 0', color: '#7C3AED' }}>404</h1>
      <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '18px', marginBottom: '24px' }}>
        This page doesn't exist.
      </p>
      <Link to="/" style={{ 
        color: '#7C3AED',
        textDecoration: 'none',
        fontSize: '16px',
        fontWeight: '600',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '8px'
      }}>
        ← Go home
      </Link>
    </div>
  );
}
