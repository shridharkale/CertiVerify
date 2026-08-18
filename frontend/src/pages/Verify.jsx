import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Shield, CheckCircle, XCircle, AlertCircle, Download, Search, Calendar, Award, User, Hash, Loader, Clock, Building } from 'lucide-react';
import anime from 'animejs';
import api from '../utils/api';
import { EASE } from '../lib/motion/easings';
import { MOTION_OK } from '../lib/motion/reducedMotion';
import './Verify.css';

export default function Verify() {
  const { cert_id } = useParams();
  const [certId, setCertId] = useState(cert_id || '');
  const [status, setStatus] = useState(null);
  const [certificate, setCertificate] = useState(null);
  const [searched, setSearched] = useState(false);
  const [isWarmingUp, setIsWarmingUp] = useState(false);
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

  // Ref for cert ID scramble animation
  const certIdRef = useRef(null);

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
    setIsWarmingUp(true);
    const t0 = Date.now();
    try {
      const res = await api.get(`/verify/${id.trim()}`);
      const elapsed = Date.now() - t0;
      setIsWarmingUp(false);
      
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
        handleVerifyResult({ valid: false, status: 'expired' }, res.data.certificate);
      } else {
        setStatus('valid');
        handleVerifyResult({ valid: true, status: 'valid' }, res.data.certificate);
      }
    } catch (err) {
      setIsWarmingUp(false);
      if (err.response?.status === 404) {
        setStatus('invalid');
        handleVerifyResult({ valid: false, status: 'invalid' });
      } else {
        setStatus('error');
        handleVerifyResult({ valid: false, status: 'error' });
      }
    }
  };

  const handleVerifyResult = (result, certificate) => {
    if (result.valid && result.status === 'valid' && certificate?.cert_id) {
      // Scramble the cert ID into view
      if (certIdRef.current && MOTION_OK) {
        // Initialize the scramble animation
        const finalText = certificate.cert_id;
        const chars = finalText.split('');
        let frame = 0;
        const duration = 1200;
        const totalFrames = Math.floor(duration / 16);
        const settleStart = Math.floor(totalFrames * 0.4);
        const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-';

        const tick = () => {
          const settled = Math.max(0, frame - settleStart);
          const settledCount = Math.floor((settled / (totalFrames - settleStart)) * chars.length);

          certIdRef.current.textContent = chars.map((c, i) => {
            if (i < settledCount || c === '-' || c === ' ') return c;
            return ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
          }).join('');

          frame++;
          if (frame < totalFrames) setTimeout(tick, 16);
          else certIdRef.current.textContent = finalText;
        };

        setTimeout(tick, 400);
      }

      // Success card entrance
      setTimeout(() => {
        anime({
          targets: '.verify__result',
          scale: [0.92, 1],
          opacity: [0, 1],
          duration: 500,
          easing: EASE.outExpo,
        });
      }, 100);

      // SVG checkmark draw-in (if available)
      anime({
        targets: '.check-path',
        strokeDashoffset: [100, 0],
        duration: 600,
        easing: EASE.outExpo,
        delay: 200,
      });

      // Mini confetti burst
      spawnConfetti();
    } else {
      // Shake on invalid
      anime({
        targets: '.verify__result',
        translateX: [0, -10, 10, -7, 7, -4, 4, 0],
        duration: 500,
        easing: EASE.outQuad,
      });
      anime({
        targets: '.verify__result',
        borderColor: ['var(--border)', '#EF4444'],
        duration: 300,
      });
    }
  };

  // Confetti helper (canvas-based, 60 particles)
  const spawnConfetti = () => {
    if (!MOTION_OK) return;
    const canvas = document.createElement('canvas');
    canvas.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:999';
    document.body.appendChild(canvas);
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles = Array.from({ length: 60 }, () => ({
      x: canvas.width / 2, y: canvas.height / 2,
      vx: (Math.random() - 0.5) * 12,
      vy: (Math.random() - 0.8) * 14,
      r: 4 + Math.random() * 4,
      color: ['#7C3AED','#2563EB','#10B981','#E8B84B'][Math.floor(Math.random()*4)],
      life: 1,
    }));

    let rafId;
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      let alive = false;
      for (const p of particles) {
        p.life -= 0.018;
        if (p.life <= 0) continue;
        alive = true;
        p.x += p.vx; p.y += p.vy; p.vy += 0.3;
        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      if (alive) rafId = requestAnimationFrame(draw);
      else { cancelAnimationFrame(rafId); canvas.remove(); }
    };
    draw();
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
          Instant Verification Engine
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

        {isWarmingUp && (
          <div style={{ padding: '16px', background: 'rgba(79, 70, 229, 0.1)', border: '1px solid rgba(79, 70, 229, 0.2)', borderRadius: '8px', marginTop: '16px', color: 'rgba(255,255,255,0.7)', fontSize: '14px' }}>
            ☕ Waking up the server… this takes ~5s on first load
          </div>
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
                      <div className="cd-value"><code ref={certIdRef} style={{ fontFamily: 'monospace' }}>{certificate.cert_id}</code></div>
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