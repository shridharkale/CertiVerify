import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ShieldCheck, ShieldX, Search, Loader2, Download, Lock, Clock } from 'lucide-react'
import Navbar from '../components/Navbar'
import { verifyCertificate } from '../utils/api'
import { useToast } from '../utils/useToast'

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.25, 0.1, 0.25, 1] } }
}

const TRUST = [
  { icon: <Lock size={14} />, label: 'Cryptographically signed' },
  { icon: <ShieldCheck size={14} />, label: 'Tamper-proof' },
  { icon: <Clock size={14} />, label: 'Instant verification' },
]

function extractCertId(raw) {
  const s = (raw || '').trim()
  const match = s.match(/CERT-[A-Za-z0-9\-]+/i)
  return match ? match[0] : s
}

function downloadHref(path) {
  if (!path) return null
  if (path.startsWith('http')) return path
  const base = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/$/, '')
  return `${base}${path.startsWith('/') ? path : `/${path}`}`
}

export default function Verify() {
  const { cert_id: certIdParam } = useParams()
  const { showToast, ToastContainer } = useToast()
  const [tab, setTab] = useState('id')
  const [query, setQuery] = useState(certIdParam || '')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)

  const runVerify = async (raw) => {
    const id = extractCertId(raw)
    if (!id) return
    setLoading(true)
    setResult(null)
    try {
      const data = await verifyCertificate(id)
      setResult(data)
    } catch (err) {
      const payload = err.response?.data
      if (payload?.status) {
        setResult(payload)
      } else {
        setResult({
          valid: false,
          status: 'INVALID',
          error: getApiError(err, 'Certificate not found or invalid.'),
        })
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (certIdParam) {
      setQuery(certIdParam)
      runVerify(certIdParam)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [certIdParam])

  const handleVerify = () => runVerify(query)

  const details = result?.data || result?.certificate || {}
  const isValid = result?.status === 'VALID' || result?.valid === true
  const isExpired = result?.status === 'EXPIRED'

  return (
    <>
      <Navbar />
      <ToastContainer />
      <div className="verify-page">
        <div className="verify-inner">
          <motion.div variants={fadeUp} initial="hidden" animate="show">
            <p className="label-mono" style={{ marginBottom: 8 }}>Certificate lookup</p>
            <h1 className="display display-md" style={{ marginBottom: 10 }}>Verify a certificate</h1>
            <p className="text-muted" style={{ fontSize: 16, marginBottom: 24, lineHeight: 1.65 }}>
              Enter a certificate ID or scan a QR code to confirm authenticity.
            </p>
          </motion.div>

          <motion.div variants={fadeUp} initial="hidden" animate="show"
            transition={{ delay: 0.07 }} style={{ marginBottom: 20 }}>
            <div className="verify-tabs">
              <button
                type="button"
                className={`verify-tab ${tab === 'id' ? 'active' : ''}`}
                onClick={() => setTab('id')}
              >
                Certificate ID
              </button>
              <button
                type="button"
                className={`verify-tab ${tab === 'qr' ? 'active' : ''}`}
                onClick={() => setTab('qr')}
              >
                QR code
              </button>
            </div>
          </motion.div>

          <motion.div variants={fadeUp} initial="hidden" animate="show"
            transition={{ delay: 0.12 }} style={{ marginBottom: 8 }}>
            <form className="verify-form" onSubmit={(e) => { e.preventDefault(); handleVerify() }}>
              <input
                className="input"
                placeholder={tab === 'id' ? 'e.g. CERT-2024-ABCD1234' : 'Paste QR data or verify URL hereâ€¦'}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading || !query.trim()}
              >
                {loading
                  ? <Loader2 size={16} className="spin" />
                  : <><Search size={15} /> Verify</>
                }
              </button>
            </form>
          </motion.div>

          <AnimatePresence mode="wait">
            {result && (
              <motion.div
                key="result"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
                className={`result ${isValid ? 'result--valid' : 'result--invalid'}`}
              >
                <div className="result__head">
                  <div className={`result__icon ${isValid ? 'result__icon--valid' : 'result__icon--invalid'}`}>
                    {isValid
                      ? <ShieldCheck size={22} strokeWidth={2} />
                      : <ShieldX size={22} strokeWidth={2} />
                    }
                  </div>
                  <div>
                    <div className="result__title">
                      {isValid ? 'Certificate verified' : isExpired ? 'Certificate expired' : 'Not found'}
                    </div>
                    <div className="result__sub">
                      {isValid
                        ? 'This certificate is authentic and has not been tampered with.'
                        : result.error || result.message || 'We could not find a certificate with that ID.'
                      }
                    </div>
                  </div>
                </div>

                {(isValid || isExpired) && (details.name || details.recipient_name) && (
                  <div className="result__body">
                    <div className="cert-grid">
                      {[
                        { label: 'Recipient',   value: details.recipient_name || details.name },
                        { label: 'Event',       value: details.event_name },
                        { label: 'Issued',      value: details.issued_date || details.event_date },
                        { label: 'Certificate', value: details.cert_id || result.cert_id },
                        { label: 'Issued by',   value: details.issued_by || details.organisation },
                        { label: 'Email',       value: details.email },
                      ].map((f) => f.value ? (
                        <div key={f.label} className="cert-field">
                          <span className="cert-field__label">{f.label}</span>
                          <span className="cert-field__value">{f.value}</span>
                        </div>
                      ) : null)}
                    </div>
                  </div>
                )}

                {(isValid || isExpired) && (
                  <div className="result__footer">
                    {downloadHref(details.download_url) && (
                      <a
                        href={downloadHref(details.download_url)}
                        className="btn btn-primary btn-sm"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Download size={13} /> Download PDF
                      </a>
                    )}
                    {(details.cert_id || result.cert_id) && (
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => {
                          navigator.clipboard.writeText(details.cert_id || result.cert_id)
                          showToast('Certificate ID copied', 'success')
                        }}
                      >
                        Copy ID
                      </button>
                    )}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          <div className="trust-row" style={{ marginTop: result ? 24 : 40 }}>
            {TRUST.map((t) => (
              <div key={t.label} className="trust-item">
                {t.icon}
                <span>{t.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}
