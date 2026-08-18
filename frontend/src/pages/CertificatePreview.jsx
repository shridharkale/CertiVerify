import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Shield, Download, ExternalLink, ArrowLeft, CheckCircle, Calendar, User, Award, Hash, Loader, Copy, Printer } from 'lucide-react';
import api from '../utils/api';
import './CertificatePreview.css';

export default function CertificatePreview() {
  const { cert_id } = useParams();
  const navigate = useNavigate();
  const [certificate, setCertificate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get(`/verify/${cert_id}`);
        setCertificate(res.data.certificate);
      } catch {
        setError('Certificate not found.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [cert_id]);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(verifyUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const downloadUrl = `${import.meta.env.VITE_API_BASE_URL}/certificates/download/${cert_id}`;
  const verifyUrl = `${window.location.origin}/CertiVerify/#/verify/${cert_id}`;

  if (loading) return (
    <div className="preview__loading">
      <Loader size={40} className="spin-icon" color="rgba(255,255,255,0.5)" />
      <p>Loading certificate...</p>
    </div>
  );

  if (error || !certificate) return (
    <div className="preview__error glass-card">
      <Shield size={48} color="rgba(255,255,255,0.2)" />
      <h2>Not Found</h2>
      <p>{error || 'This certificate does not exist.'}</p>
      <Link to="/verify" className="btn btn-primary">Go to Verify</Link>
    </div>
  );

  return (
    <div className="preview__wrapper">
      <div className="preview__toolbar">
        <button className="btn btn-ghost btn-sm" onClick={() => navigate(-1)}>
          <ArrowLeft size={14} /> Back
        </button>
        <div className="preview__toolbar-actions">
          <Link to={`/verify/${cert_id}`} className="btn btn-secondary btn-sm">
            <ExternalLink size={14} /> Public Link
          </Link>
          <a href={downloadUrl} target="_blank" rel="noreferrer" className="btn btn-primary btn-sm">
            <Download size={14} /> Download PDF
          </a>
        </div>
      </div>

      <div className="preview__cert-card animate-slide-up">
        <div className="cert-header-band">
          <div className="cert-logo">
            <Shield size={28} strokeWidth={2.5} />
          </div>
          <div>
            <div className="cert-brand">CertiVerify</div>
            <div className="cert-brand-sub">Certificate of Achievement</div>
          </div>
          <div className="cert-status-badge">
            <CheckCircle size={14} /> Verified
          </div>
        </div>

        <div className="cert-main">
          <div className="cert-label-top">This certifies that</div>
          <div className="cert-recipient">{certificate.name}</div>
          <div className="cert-has-completed">has successfully completed</div>
          <div className="cert-course">{certificate.event_name}</div>

          <div className="cert-divider-fancy">
            <span />
            <Shield size={16} />
            <span />
          </div>

          <div className="cert-meta-grid">
            <div className="cert-meta-item">
              <Calendar size={14} />
              <div>
                <div className="cmeta-label">Issued Date</div>
                <div className="cmeta-val">
                  {new Date(certificate.event_date || certificate.created_at).toLocaleDateString('en-IN', {
                    day: 'numeric', month: 'long', year: 'numeric'
                  })}
                </div>
              </div>
            </div>

            {certificate.organisation && (
              <div className="cert-meta-item">
                <Award size={14} />
                <div>
                  <div className="cmeta-label">Issued By</div>
                  <div className="cmeta-val">{certificate.organisation}</div>
                </div>
              </div>
            )}

            <div className="cert-meta-item">
              <Hash size={14} />
              <div>
                <div className="cmeta-label">Certificate ID</div>
                <div className="cmeta-val"><code>{certificate.cert_id}</code></div>
              </div>
            </div>

            {certificate.email && (
              <div className="cert-meta-item">
                <User size={14} />
                <div>
                  <div className="cmeta-label">Recipient Email</div>
                  <div className="cmeta-val">{certificate.email}</div>
                </div>
              </div>
            )}
          </div>

          <div className="cert-qr-section">
            <div className="cert-qr-box">
              <div className="qr-art">
                {[...Array(25)].map((_, i) => (
                  <div key={i} className="qr-cell" style={{ opacity: Math.random() > 0.45 ? 1 : 0.08 }} />
                ))}
              </div>
            </div>
            <div className="cert-qr-label">Scan to verify authenticity</div>
            <div className="cert-qr-url">{verifyUrl}</div>
          </div>
        </div>

        <div className="cert-footer">
          <div className="cert-sig-line" />
          <div className="cert-sig-name">{certificate.organisation || 'CertiVerify Platform'}</div>
          <div className="cert-sig-title">Authorised Signature</div>
        </div>
      </div>

      <div className="preview__actions glass-card animate-fade-in">
        <h3>Share This Certificate</h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <a
            href={downloadUrl}
            target="_blank"
            rel="noreferrer"
            className="btn btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'center' }}
          >
            <Download size={16} /> Download Certificate PDF
          </a>

          <button type="button" className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'center' }} onClick={handlePrint}>
            <Printer size={16} /> Print Certificate
          </button>

          <button type="button" className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'center' }} onClick={handleCopyLink}>
            <Copy size={16} /> {copied ? 'Link Copied' : 'Copy Verify Link'}
          </button>

          
          <a
            href={`https://www.linkedin.com/profile/add?startTask=CERTIFICATION_NAME&name=${encodeURIComponent(certificate.event_name)}&organizationName=${encodeURIComponent(certificate.organisation || 'CertiVerify')}&certUrl=${encodeURIComponent(verifyUrl)}&certId=${encodeURIComponent(certificate.cert_id)}`}
            target="_blank"
            rel="noreferrer"
            className="btn"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              justifyContent: 'center',
              background: '#0077b5',
              color: 'white',
              border: 'none',
              borderRadius: 'var(--radius-md)',
              padding: '10px 20px',
              fontWeight: '600',
              fontSize: '14px',
              cursor: 'pointer',
              transition: 'opacity 0.2s ease',
              textDecoration: 'none',
            }}
            onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
            onMouseLeave={e => e.currentTarget.style.opacity = '1'}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
              <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/>
              <rect x="2" y="9" width="4" height="12"/>
              <circle cx="4" cy="4" r="2"/>
            </svg>
            Add to LinkedIn Profile
          </a>

          <div className="share-url">
            <code style={{ fontSize: '11px' }}>{verifyUrl}</code>
            <button
              className="btn btn-sm btn-secondary"
              onClick={() => {
                navigator.clipboard.writeText(verifyUrl);
              }}
            >
              Copy
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}