import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Shield, CheckCircle, XCircle, AlertCircle, Download, Search, Calendar, Award, User, Hash, Loader, Clock, Building } from 'lucide-react';
import api from '../utils/api';
import './Verify.css';

export default function Verify() {
  const { cert_id } = useParams();
  const [certId, setCertId] = useState(cert_id || '');
  const [status, setStatus] = useState(null);
  const [certificate, setCertificate] = useState(null);
  const [searched, setSearched] = useState(false);
  const [verifyTab, setVerifyTab] = useState('verify');
  const [historyQuery, setHistoryQuery] = useState('');
  const [recentHistory, setRecentHistory] = useState(() => {
    try {
      const stored = sessionStorage.getItem('cv_verify_history');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    document.title = 'Verify Certificate — CertiVerify';
  }, []);

  useEffect(() => {
    if (cert_id) {
      handleVerify(cert_id);
    }
  }, [cert_id]);

  useEffect(() => {
    sessionStorage.setItem('cv_verify_history', JSON.stringify(recentHistory));
  }, [recentHistory]);

  const saveVerifyHistory = (entry) => {
    setRecentHistory((current) => {
      const filtered = current.filter(item => item.cert_id !== entry.cert_id);
      return [entry, ...filtered].slice(0, 10);
    });
  };

  const filteredHistory = recentHistory.filter(item => {
    const query = historyQuery.toLowerCase();
    return (
      item.name?.toLowerCase().includes(query) ||
      item.cert_id?.toLowerCase().includes(query) ||
      item.event_name?.toLowerCase().includes(query)
    );
  });

  const handleVerify = async (id = certId) => {
    if (!id.trim()) return;
    setStatus('loading');
    setCertificate(null);
    setSearched(true);
    try {
      const res = await api.get(`/verify/${id.trim()}`);
      setCertificate(res.data.certificate);
      if (res.data.certificate) {
        saveVerifyHistory({
          cert_id: res.data.certificate.cert_id,
          name: res.data.certificate.name,
          event_name: res.data.certificate.event_name,
          status: res.data.status || 'valid',
          verified_at: Date.now(),
        });
      }
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

  const getDownloadUrl = (id) =>
    `${import.meta.env.VITE_API_BASE_URL}/certificates/download/${id}`;

  const quickRecent = recentHistory.slice(0, 3);

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

        <div className="verify__mode-switch">
          <button type="button" className={`toggle-pill ${verifyTab === 'verify' ? 'active' : ''}`} onClick={() => setVerifyTab('verify')}>
            Verify by ID
          </button>
          <button type="button" className={`toggle-pill ${verifyTab === 'recent' ? 'active' : ''}`} onClick={() => setVerifyTab('recent')}>
            Recent History
          </button>
          <button type="button" className={`toggle-pill ${verifyTab === 'search' ? 'active' : ''}`} onClick={() => setVerifyTab('search')}>
            Search by Name
          </button>
        </div>

        {verifyTab === 'verify' && (
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
        )}

        {verifyTab === 'verify' && quickRecent.length > 0 && (
          <div className="recent-verified">
            <p>Recently verified:</p>
            <div className="recent-verified__chips">
              {quickRecent.map(entry => (
                <button
                  key={entry.cert_id}
                  type="button"
                  className="recent-chip"
                  onClick={() => { setCertId(entry.cert_id); handleVerify(entry.cert_id); }}
                  title={entry.name || entry.cert_id}
                >
                  {entry.cert_id}
                </button>
              ))}
            </div>
          </div>
        )}

        {verifyTab === 'recent' && (
          <div className="verify__history glass-card">
            <div className="history-header">
              <div>
                <h3>Recent Verifications</h3>
                <p>Review the latest IDs you've verified this session.</p>
              </div>
            </div>
            {recentHistory.length === 0 ? (
              <div className="empty-state">No recent verification history yet.</div>
            ) : (
              <div className="history-list">
                {recentHistory.map(entry => (
                    <button
                    key={entry.cert_id}
                    type="button"
                    className="history-item"
                    onClick={() => { setVerifyTab('verify'); setCertId(entry.cert_id); handleVerify(entry.cert_id); }}
                  >
                    <div>
                      <div className="history-title">{entry.name || entry.cert_id}</div>
                      <div className="history-sub">{entry.event_name || 'No event'} · {new Date(entry.verified_at).toLocaleString()}</div>
                    </div>
                    <span className="badge badge-primary">{entry.status?.toLowerCase()}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {verifyTab === 'search' && (
          <div className="verify__history glass-card">
            <div className="history-header">
              <div>
                <h3>Search Recent History</h3>
                <p>Type a name, event, or certificate ID from your recent lookups.</p>
              </div>
            </div>
            <div className="verify__input-wrapper" style={{ marginBottom: '16px' }}>
              <Search size={16} className="input-icon" />
              <input
                type="text"
                className="input-glass input-with-icon"
                placeholder="Search by recipient, event or ID..."
                value={historyQuery}
                onChange={e => setHistoryQuery(e.target.value)}
              />
            </div>
            {filteredHistory.length === 0 ? (
              <div className="empty-state">No matches found in recent history.</div>
            ) : (
              <div className="history-list">
                {filteredHistory.map(entry => (
                  <button
                    key={entry.cert_id}
                    type="button"
                    className="history-item"
                    onClick={() => { setVerifyTab('verify'); setCertId(entry.cert_id); handleVerify(entry.cert_id); }}
                  >
                    <div>
                      <div className="history-title">{entry.name || entry.cert_id}</div>
                      <div className="history-sub">{entry.event_name || 'No event'} · {new Date(entry.verified_at).toLocaleString()}</div>
                    </div>
                    <span className="badge badge-primary">{entry.status?.toLowerCase()}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {searched && status !== 'loading' && (
          <div className={`verify__result glass-card animate-slide-up ${status}`}>
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