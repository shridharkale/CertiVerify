import { useState, useCallback } from 'react'
import { CheckCircle, XCircle, X } from 'lucide-react'

export function useToast() {
  const [toasts, setToasts] = useState([])

  const showToast = useCallback((message, type = 'success') => {
    const id = Date.now()
    setToasts((t) => [...t, { id, message, type }])
    setTimeout(() => {
      setToasts((t) => t.filter((toast) => toast.id !== id))
    }, 3500)
  }, [])

  const dismiss = useCallback((id) => {
    setToasts((t) => t.filter((toast) => toast.id !== id))
  }, [])

  const ToastContainer = () => (
    <div style={{
      position: 'fixed', bottom: 24, right: 24,
      zIndex: 300, display: 'flex', flexDirection: 'column', gap: 8
    }}>
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`toast toast-${t.type}`}
          style={{ animation: 'toastIn 0.28s ease both' }}
        >
          {t.type === 'success'
            ? <CheckCircle size={16} style={{ color: 'var(--success)', flexShrink: 0 }} />
            : <XCircle size={16} style={{ color: 'var(--error)', flexShrink: 0 }} />
          }
          <span style={{ flex: 1, fontSize: 14 }}>{t.message}</span>
          <button
            onClick={() => dismiss(t.id)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 2, display: 'flex' }}
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  )

  return { showToast, ToastContainer }
}
