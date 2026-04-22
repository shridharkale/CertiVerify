import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Shield, CheckCircle, XCircle, AlertCircle, Download, Calendar, Award, User, Hash, Loader } from 'lucide-react';
import api from '../utils/api';
import './Verify.css';

export default function Verify() {
  const { cert_id } = useParams();
  const [certId, setCertId] = useState(cert_id || '');
  const [status, setStatus] = useState(null);
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
      setStatus('valid');
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
          Certificate Verification
        </div>

        <h1 className="verify__title">Verify Authenticity</h1>
        <p className="verify__sub">
          Enter a Certificate ID or scan the QR code on the certificate to verify it instantly.
        </p>

        <form className="verify__form glass-card" onSubmit={handleSubmit}>
          <div className="verify__input-row">
            <div className="verify__input-wrapper">
              <Hash size={16} className="input-icon" />
              <input
                id="verify-cert-id"
                type="text"
                className="input-glass input-with-icon"
                placeholder="e.g. CERT-2025-AB12"
                value={certId}
                onChange={e => setCertId(e.target.value)}
              />
            </div>
            <button id="verify-submit" type="submit" className="btn btn-primary" disabled={status === 'loading'}>
              {status === 'loading'
                ? <><Loader size={16} className="spin-icon" /> Checking...</>
                : <><Shield size={16} /> Verify</>}
            </button>
          </div>
        </form>

        {searched && status !== 'loading' && (
          <div className={`verify__result glass-card animate-slide-up ${status}`}>
            {status === 'valid' && certificate && (
              <>
                <div className="result__status valid">
                  <CheckCircle size={40} />
                  <div>
                    <div className="result__status-title">Certificate Valid</div>
                    <div className="result__status-sub">This certificate is authentic and verified.</div>
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
                      <div className="cd-label">Event / Course</div>
                      <div className="cd-value">{certificate.event_name}</div>
                    </div>
                  </div>
                  <div className="cert__detail-item">
                    <Calendar size={16} />
                    <div>
                      <div className="cd-label">Issued On</div>
                      <div className="cd-value">
                        {new Date(certificate.event_date || certificate.created_at)
                          .toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </div>
                    </div>
                  </div>
                  <div className="cert__detail-item">
                    <Hash size={16} />
                    <div>
                      <div className="cd-label">Certificate ID</div>
                      <div className="cd-value"><code>{certificate.cert_id}</code></div>
                    </div>
                  </div>

                  {certificate.issued_by && (
                    <div className="cert__detail-item">
                      <Shield size={16} />
                      <div>
                        <div className="cd-label">Issued By</div>
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
                    <Download size={15} /> Download Certificate
                  </a>
                  <Link to="/" className="btn btn-secondary">
                    Back to Home
                  </Link>
                </div>
              </>
            )}

            {status === 'invalid' && (
              <div className="result__status invalid">
                <XCircle size={40} />
                <div>
                  <div className="result__status-title">Certificate Not Found</div>
                  <div className="result__status-sub">
                    No certificate with ID <strong>{certId}</strong> exists in our records.
                  </div>
                </div>
              </div>
            )}

            {status === 'error' && (
              <div className="result__status error">
                <AlertCircle size={40} />
                <div>
                  <div className="result__status-title">Verification Error</div>
                  <div className="result__status-sub">
                    Could not connect to the verification server. Please try again.
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="verify__trust">
          {[
            { icon: <Shield size={16} />, label: 'Firebase-backed' },
            { icon: <CheckCircle size={16} />, label: 'Tamper-proof' },
            { icon: <Award size={16} />, label: 'Instant results' },
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