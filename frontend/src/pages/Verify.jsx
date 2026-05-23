import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Shield, CheckCircle, XCircle, AlertCircle, Download, Calendar, Award, User, Hash, Loader, Clock, Building } from 'lucide-react';
import api from '../utils/api';
import './Verify.css';

export default function Verify() {
  const { cert_id } = useParams();
  const [certId, setCertId] = useState(cert_id || '');
  const [status, setStatus] = useState(null); // 'loading', 'valid', 'expired', 'invalid', 'error'
  const [certificate, setCertificate] = useState(null);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    if (cert_id) {
      handleVerify(cert_id);
    }
  }, [cert_id]);

  const handleVerify = async (id = certId) => {
    if (!id.trim()) return;
    setStatus('loading');
    setCertificate(null);
    setSearched(true);
    try {
      const res = await api.get(`/verify/${id.trim()}`);
      setCertificate(res.data.certificate);
      if (res.data.status === 'EXPIRED') {
        setStatus('expired');
      } else {
        setStatus('valid');
      }
    } catch (err) {
      if (err.response?.status === 404) {
        setStatus('invalid');
      } else {
        setStatus('error');
      }
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    handleVerify();
  };

  const getDownloadUrl = (certId) =>
    `${import.meta.env.VITE_API_BASE_URL}/certificates/download/${certId}`;

  return (
    <div className="verify__wrapper">
      <div className="verify__inner">
        <div className="verify__badge">
          <Shield size={14} />
          Analytical Security Registry
        </div>

        <h1 className="verify__title">Verify Authenticity</h1>
        <p className="verify__sub">
          Query the Firestore ledger. Input a certificate ID to instantly evaluate integrity.
        </p>

        <form className="verify__form glass-card" onSubmit={handleSubmit} style={{ position: 'relative', overflow: 'hidden' }}>
          {status === 'loading' && (
            <div className="scanner-bar" />
          )}
          <div className="verify__input-row">
            <div className="verify__input-wrapper">
              <Hash size={16} className="input-icon" />
              <input
                id="verify-cert-id"
                type="text"
                className="input-glass input-with-icon"
                placeholder="e.g. CERT-2026-X8Y9"
                value={certId}
                onChange={e => setCertId(e.target.value)}
                style={{ fontFamily: 'monospace' }}
              />
            </div>
            <button id="verify-submit" type="submit" className="btn btn-primary" disabled={status === 'loading'}>
              {status === 'loading'
                ? <><Loader size={16} className="spin-icon" /> Querying...</>
                : <><Shield size={16} /> Execute Verify</>}
            </button>
          </div>
        </form>

        {searched && status !== 'loading' && (
          <div className={`verify__result glass-card animate-slide-up ${status}`}>
            
            {/* VALID STATUS CARD */}
            {status === 'valid' && certificate && (
              <>
                <div className="result__status valid">
                  <CheckCircle size={40} color="#10b981" />
                  <div>
                    <div className="result__status-title">Certificate Valid</div>
                    <div className="result__status-sub">Integrity verified. Cryptographic record matches Firestore ledger.</div>
                  </div>
                </div>

                <div className="divider" />

                {/* Timeline Visual */}
                <div className="timeline-container">
                  <h4 className="timeline-title">Verification Ledger Timeline</h4>
                  <div className="timeline-path">
                    <div className="timeline-step passed">
                      <div className="step-dot" />
                      <div className="step-content">
                        <span className="step-label">Record Issued</span>
                        <span className="step-date">
                          {new Date(certificate.created_at || Date.now()).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <div className="timeline-step passed">
                      <div className="step-dot" />
                      <div className="step-content">
                        <span className="step-label">Status Check</span>
                        <span className="step-date">Security Active</span>
                      </div>
                    </div>
                    <div className="timeline-step last">
                      <div className="step-dot" />
                      <div className="step-content">
                        <span className="step-label">Expiration Threshold</span>
                        <span className="step-date">
                          {certificate.expiry_date 
                            ? `Valid until ${new Date(certificate.expiry_date * 1000).toLocaleDateString()}`
                            : 'Lifetime Validity (Never Expires)'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="divider" />

                <div className="cert__details">
                  <div className="cert__detail-item">
                    <User size={16} />
                    <div>
                      <div className="cd-label">Recipient</div>
                      <div className="cd-value">{certificate.name}</div>
                    </div>
                  </div>
                  <div className="cert__detail-item">
                    <Award size={16} />
                    <div>
                      <div className="cd-label">Event Target</div>
                      <div className="cd-value">{certificate.event_name}</div>
                    </div>
                  </div>
                  <div className="cert__detail-item">
                    <Calendar size={16} />
                    <div>
                      <div className="cd-label">Event Date</div>
                      <div className="cd-value">{certificate.event_date}</div>
                    </div>
                  </div>
                  <div className="cert__detail-item">
                    <Hash size={16} />
                    <div>
                      <div className="cd-label">Certificate ID</div>
                      <div className="cd-value"><code style={{ fontFamily: 'monospace' }}>{certificate.cert_id}</code></div>
                    </div>
                  </div>

                  {certificate.organisation && (
                    <div className="cert__detail-item">
                      <Building size={16} />
                      <div>
                        <div className="cd-label">Organisation</div>
                        <div className="cd-value">{certificate.organisation}</div>
                      </div>
                    </div>
                  )}

                  {certificate.issued_by && (
                    <div className="cert__detail-item">
                      <Shield size={16} />
                      <div>
                        <div className="cd-label">Registry Issuer</div>
                        <div className="cd-value">{certificate.issued_by}</div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="result__actions">
                  <a
                    href={getDownloadUrl(certificate.cert_id)}
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-primary"
                  >
                    <Download size={15} /> Download PDF
                  </a>
                  <Link to="/" className="btn btn-secondary">
                    Home
                  </Link>
                </div>
              </>
            )}

            {/* EXPIRED STATUS CARD */}
            {status === 'expired' && certificate && (
              <>
                <div className="result__status expired" style={{ color: '#f59e0b', display: 'flex', gap: '16px', alignItems: 'center' }}>
                  <Clock size={40} color="#f59e0b" />
                  <div>
                    <div className="result__status-title" style={{ color: '#f59e0b', fontSize: '20px', fontWeight: '700' }}>
                      Certificate Expired
                    </div>
                    <div className="result__status-sub" style={{ color: 'rgba(255,255,255,0.7)' }}>
                      This certificate is authentic but has passed its validity threshold.
                    </div>
                  </div>
                </div>

                <div className="divider" />

                {/* Timeline Visual (Expired state) */}
                <div className="timeline-container">
                  <h4 className="timeline-title">Verification Ledger Timeline</h4>
                  <div className="timeline-path">
                    <div className="timeline-step passed">
                      <div className="step-dot" />
                      <div className="step-content">
                        <span className="step-label">Record Issued</span>
                        <span className="step-date">
                          {new Date(certificate.created_at || Date.now()).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <div className="timeline-step warning">
                      <div className="step-dot" style={{ background: '#f59e0b' }} />
                      <div className="step-content">
                        <span className="step-label">Status Check</span>
                        <span className="step-date" style={{ color: '#f59e0b' }}>Expired</span>
                      </div>
                    </div>
                    <div className="timeline-step warning last">
                      <div className="step-dot" style={{ background: '#f59e0b' }} />
                      <div className="step-content">
                        <span className="step-label">Expiration Date</span>
                        <span className="step-date">
                          {certificate.expiry_date 
                            ? new Date(certificate.expiry_date * 1000).toLocaleDateString()
                            : 'N/A'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="divider" />

                <div className="cert__details">
                  <div className="cert__detail-item">
                    <User size={16} />
                    <div>
                      <div className="cd-label">Recipient</div>
                      <div className="cd-value">{certificate.name}</div>
                    </div>
                  </div>
                  <div className="cert__detail-item">
                    <Award size={16} />
                    <div>
                      <div className="cd-label">Event Target</div>
                      <div className="cd-value">{certificate.event_name}</div>
                    </div>
                  </div>
                  <div className="cert__detail-item">
                    <Hash size={16} />
                    <div>
                      <div className="cd-label">Certificate ID</div>
                      <div className="cd-value"><code style={{ fontFamily: 'monospace' }}>{certificate.cert_id}</code></div>
                    </div>
                  </div>
                </div>

                <div className="result__actions">
                  <Link to="/" className="btn btn-secondary w-full" style={{ justifyContent: 'center' }}>
                    Return to Home
                  </Link>
                </div>
              </>
            )}

            {/* INVALID STATUS CARD */}
            {status === 'invalid' && (
              <div className="result__status invalid">
                <XCircle size={40} color="#ef4444" />
                <div>
                  <div className="result__status-title">Ledger Record Not Found</div>
                  <div className="result__status-sub">
                    No certificate mapping to ID <strong style={{ fontFamily: 'monospace' }}>{certId}</strong> exists in Firestore database.
                  </div>
                </div>
              </div>
            )}

            {/* ERROR STATUS CARD */}
            {status === 'error' && (
              <div className="result__status error">
                <AlertCircle size={40} color="#ef4444" />
                <div>
                  <div className="result__status-title">Connection Error</div>
                  <div className="result__status-sub">
                    Failed to query the database. Check API gateway parameters and try again.
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="verify__trust">
          {[
            { icon: <Shield size={16} />, label: 'Firestore Verified' },
            { icon: <CheckCircle size={16} />, label: 'Deduplicated' },
            { icon: <Award size={16} />, label: 'Fast Lookup' },
          ].map((item, i) => (
            <div key={i} className="trust-item glass-card">
              <span className="trust-icon">{item.icon}</span>
              <span className="trust-label">{item.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}