import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Shield, Calendar, User, Award, Hash, Search, ArrowLeft, Loader, ExternalLink } from 'lucide-react';
import api from '../utils/api';
import './Verify.css'; // Re-use verification and page layouts, but we will add custom gallery styles if needed

export default function EventGallery() {
  const { event_name } = useParams();
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchEventCertificates = async () => {
      try {
        const res = await api.get(`/certificates/public-event/${encodeURIComponent(event_name)}`);
        setCertificates(res.data.certificates || []);
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to load event certificates.');
      } finally {
        setLoading(false);
      }
    };
    if (event_name) {
      fetchEventCertificates();
    }
  }, [event_name]);

  const filteredCerts = certificates.filter(c =>
    (c.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.cert_id || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="verify__wrapper" style={{ padding: '120px 24px 80px' }}>
      <div className="verify__inner" style={{ maxWidth: '1000px', width: '100%' }}>
        <div style={{ marginBottom: '24px' }}>
          <Link to="/" className="btn btn-ghost btn-sm" style={{ marginBottom: '16px' }}>
            <ArrowLeft size={14} /> Back to Home
          </Link>
        </div>

        <div className="verify__badge">
          <Award size={14} />
          Public Event Gallery
        </div>

        <h1 className="verify__title" style={{ fontSize: 'clamp(24px, 4vw, 42px)' }}>
          {event_name}
        </h1>
        <p className="verify__sub">
          Official certificates registry for this event. Anyone can view and verify achievements below.
        </p>

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '60px 0', gap: '16px' }}>
            <Loader size={40} className="spin-icon" color="rgba(255,255,255,0.5)" />
            <p style={{ color: 'rgba(255,255,255,0.6)' }}>Loading registry...</p>
          </div>
        ) : error ? (
          <div className="verify__result glass-card error" style={{ padding: '30px', textAlign: 'center' }}>
            <Shield size={48} color="rgba(239, 68, 68, 0.4)" style={{ marginBottom: '16px' }} />
            <h2>Error Loading Event</h2>
            <p>{error}</p>
          </div>
        ) : certificates.length === 0 ? (
          <div className="verify__result glass-card" style={{ padding: '60px 20px', textAlign: 'center', color: 'rgba(255,255,255,0.4)' }}>
            <Award size={48} style={{ marginBottom: '16px', opacity: 0.3 }} />
            <p>No certificates found for this event.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-6 w-full">
            {/* Search Bar */}
            <div className="verify__form glass-card" style={{ padding: '16px' }}>
              <div className="verify__input-wrapper">
                <Search size={16} className="input-icon" />
                <input
                  type="text"
                  className="input-glass input-with-icon"
                  placeholder="Search by recipient name or Cert ID..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            {/* List count */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'rgba(255,255,255,0.6)', fontSize: '14px' }}>
              <span>Showing {filteredCerts.length} of {certificates.length} certificates</span>
              <span className="badge badge-primary">{certificates.length} issued</span>
            </div>

            {/* Gallery Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
              gap: '20px',
              width: '100%'
            }}>
              {filteredCerts.map((cert) => (
                <div key={cert.cert_id} className="glass-card" style={{
                  padding: '24px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px',
                  position: 'relative',
                  overflow: 'hidden',
                  borderLeft: '4px solid var(--primary)'
                }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <code className="cert-id" style={{ fontSize: '11px' }}>{cert.cert_id}</code>
                      <span className="badge badge-success" style={{ fontSize: '10px', padding: '2px 8px' }}>
                        Verified
                      </span>
                    </div>
                    <h3 style={{ fontSize: '18px', fontWeight: '700', color: 'rgba(255,255,255,0.95)', marginTop: '12px' }}>
                      {cert.name}
                    </h3>
                    <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', marginTop: '4px' }}>
                      Role: <strong>{cert.role}</strong>
                    </p>
                  </div>

                  <div className="divider" style={{ margin: '8px 0' }} />

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Calendar size={12} />
                      <span>Held on: {cert.event_date}</span>
                    </div>
                  </div>

                  <div style={{ marginTop: 'auto', paddingTop: '10px', display: 'flex', gap: '10px' }}>
                    <Link to={`/certificate/${cert.cert_id}`} className="btn btn-primary btn-sm w-full" style={{ justifyContent: 'center' }}>
                      <ExternalLink size={13} /> View Certificate
                    </Link>
                    <Link to={`/verify/${cert.cert_id}`} className="btn btn-secondary btn-sm" style={{ padding: '0 12px', justifyContent: 'center' }}>
                      Verify
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
