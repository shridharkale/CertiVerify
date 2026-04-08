import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Shield, Download, ExternalLink, ArrowLeft, CheckCircle, Calendar, User, Award, Hash, Loader } from 'lucide-react';
import api from '../utils/api';
import './CertificatePreview.css';

export default function CertificatePreview() {
  const { cert_id } = useParams();
  const navigate = useNavigate();
  const [certificate, setCertificate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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
      {/* Back */}
      <div className="preview__toolbar">
        <button className="btn btn-ghost btn-sm" onClick={() => navigate(-1)}>
          <ArrowLeft size={14} /> Back
        </button>
        <div className="preview__toolbar-actions">
          <Link to={`/verify/${cert_id}`} className="btn btn-secondary btn-sm">
            <ExternalLink size={14} /> Public Link
          </Link>
          <a 
  href={`http://127.0.0.1:5000/api/certificates/download/${cert_id}`}
  target="_blank" 
  rel="noreferrer" 
  className="btn btn-primary btn-sm"
>
  <Download size={14} /> Download PDF
</a>
        </div>
      </div>

      {/* Certificate card */}
      <div className="preview__cert-card animate-slide-up">
        {/* Header band */}
        <div className="cert-header-band">
          <div className="cert-logo">
            <Shield size={28} strokeWidth={2.5} />
          </div>
          <div>
            <div className="cert-brand">CertVerify</div>
            <div className="cert-brand-sub">Certificate of Achievement</div>
          </div>
          <div className="cert-status-badge">
            <CheckCircle size={14} /> Verified
          </div>
        </div>

        {/* Main content */}
        <div className="cert-main">
          <div className="cert-label-top">This certifies that</div>
          <div className="cert-recipient">{certificate.recipient_name}</div>
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
                  {new Date(certificate.issued_date || certificate.created_at).toLocaleDateString('en-IN', {
                    day: 'numeric', month: 'long', year: 'numeric'
                  })}
                </div>
              </div>
            </div>
            {certificate.issuer && (
              <div className="cert-meta-item">
                <Award size={14} />
                <div>
                  <div className="cmeta-label">Issued By</div>
                  <div className="cmeta-val">{certificate.issuer}</div>
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

          {/* QR Section */}
          <div className="cert-qr-section">
            <div className="cert-qr-box">
              <div className="qr-art">
                {[...Array(25)].map((_, i) => (
                  <div key={i} className="qr-cell" style={{ opacity: Math.random() > 0.45 ? 1 : 0.08 }} />
                ))}
              </div>
            </div>
            <div className="cert-qr-label">Scan to verify authenticity</div>
            <div className="cert-qr-url">{window.location.origin}/verify/{cert_id}</div>
          </div>
        </div>

        {/* Footer */}
        <div className="cert-footer">
          <div className="cert-sig-line" />
          <div className="cert-sig-name">{certificate.issuer || 'CertVerify Platform'}</div>
          <div className="cert-sig-title">Authorised Signature</div>
        </div>
      </div>

      {/* Actions panel */}
      <div className="preview__actions glass-card animate-fade-in">
        <h3>Share This Certificate</h3>
        {/* ADD THIS */}
  <a
    href={`http://127.0.0.1:5000/api/certificates/download/${cert_id}`}
    target="_blank"
    rel="noreferrer"
    className="btn btn-primary"
    style={{display:'flex', alignItems:'center', gap:'6px', marginBottom:'12px'}}
  >
    <Download size={16} /> Download Certificate PDF
  </a>

  <div className="share-url"></div>
        <div className="share-url">
          <code>{window.location.origin}/verify/{cert_id}</code>
          <button
            className="btn btn-sm btn-secondary"
            onClick={() => navigator.clipboard.writeText(`${window.location.origin}/verify/${cert_id}`)}
          >
            Copy Link
          </button>
        </div>
      </div>
    </div>
  );
}
