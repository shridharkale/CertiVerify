import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Shield, ArrowRight, CheckCircle, Zap, Star, ChevronDown, Database, BarChart3, QrCode, FileSpreadsheet, Download, Share2, Clock, Lock, Sparkles } from 'lucide-react';
import api from '../utils/api';
import './Landing.css';

const FEATURES = [
  {
    icon: <Database size={24} />,
    title: 'Smart Deduplication',
    desc: 'Pandas-powered CSV deduplication catching duplicates within batch and across past events.',
    color: '#2563eb',
    border: 'left'
  },
  {
    icon: <QrCode size={24} />,
    title: 'QR Verification',
    desc: 'Instant scan and verify. Sub-2-second certificate lookup with in-memory caching.',
    color: '#7c3aed',
    border: 'left'
  },
  {
    icon: <FileSpreadsheet size={24} />,
    title: 'Bulk Generation',
    desc: 'Upload CSV, generate hundreds of PDFs. Automated certificate creation at scale.',
    color: '#10b981',
    border: 'left'
  },
  {
    icon: <BarChart3 size={24} />,
    title: 'Analytics Dashboard',
    desc: 'Recharts visualizations. Track cert distribution, trends, and analytics in real-time.',
    color: '#f97316',
    border: 'left'
  },
];

export default function Landing() {
  const [visible, setVisible] = useState(false);
  const [totalCerts, setTotalCerts] = useState(0);
  const [animatedCerts, setAnimatedCerts] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 100);
    
    // Fetch live public stats
    api.get('/certificates/public-stats')
      .then(res => {
        if (res.data && typeof res.data.total === 'number') {
          setTotalCerts(res.data.total);
        }
      })
      .catch(() => {});

    return () => clearTimeout(t);
  }, []);

  // Animate counter for total certificates
  useEffect(() => {
    if (totalCerts <= 0) return;
    let start = 0;
    const duration = 1500;
    const stepTime = Math.abs(Math.floor(duration / totalCerts));
    const timer = setInterval(() => {
      start += 1;
      setAnimatedCerts(start);
      if (start >= totalCerts) {
        clearInterval(timer);
      }
    }, Math.max(stepTime, 20));
    return () => clearInterval(timer);
  }, [totalCerts]);

  const STATS = [
    { value: '500ms', label: 'Verify Time' },
    { value: '100%', label: 'Tamper Proof' },
    { value: 'Bulk', label: 'CSV Upload' },
    { value: 'Free', label: 'No Cost' },
  ];

  return (
    <div className="landing__wrapper">
      {/* ── Background Orbs ── */}
      <div className="landing__orbs">
        <div className="orb orb-1" />
        <div className="orb orb-2" />
        <div className="orb orb-3" />
      </div>

      {/* ── Dot Grid Overlay ── */}
      <div className="landing__grid" />

      {/* ── Hero ── */}
      <section className={`landing__hero ${visible ? 'visible' : ''}`}>
        <div className="hero__content">
          <div className="hero__badge">
            <Star size={13} fill="currentColor" />
            Trusted by researchers and organizers
          </div>

          <h1 className="hero__title">
            Issue & Verify <br />
            <span className="accent-coral">Instantly</span>
          </h1>

          <p className="hero__sub">
            Create tamper-proof certificates with QR codes. Upload a CSV, generate secure PDFs, and let recipients verify in seconds.
          </p>

          <div className="hero__cta">
            <Link to="/register" className="btn btn-primary btn-lg">
              Start Free <ArrowRight size={18} />
            </Link>
            <Link to="/verify" className="btn btn-secondary btn-lg">
              Verify Certificate
            </Link>
          </div>
        </div>

        {/* Floating Certificate Card */}
        <div className="hero__mockup">
          <div className="mockup__card">
            <div className="mockup__header">
              <div className="mockup__dot red" />
              <div className="mockup__dot yellow" />
              <div className="mockup__dot green" />
              <span className="mockup__title">Certificate</span>
            </div>
            
            <div className="mockup__body">
              <div className="mockup__badge-corner">
                <CheckCircle size={16} className="badge-icon" />
              </div>
              
              <div className="mockup__seal">
                <Shield size={32} />
              </div>
              
              <div className="mockup__text">
                <div className="mockup__label">Certificate of Achievement</div>
                <div className="mockup__name">Arjun Sharma</div>
                <div className="mockup__event">React Bootcamp</div>
                <div className="mockup__date">March 2025</div>
              </div>

              <div className="mockup__qr">
                <div className="qr-placeholder">
                  {[...Array(25)].map((_, i) => (
                    <div key={i} className="qr-pixel" style={{ opacity: Math.random() > 0.3 ? 1 : 0.15 }} />
                  ))}
                </div>
              </div>

              <div className="mockup__badges">
                <span className="mock-badge">✓ Verified</span>
                <span className="mock-badge">QR Secured</span>
                <span className="mock-badge">Instant</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats Section ── */}
      <section className="landing__stats">
        <div className="stats__grid">
          {STATS.map((s, i) => (
            <div key={i} className="stat-card">
              <div className="stat-value">{s.value}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features Section ── */}
      <section className="landing__features" id="features">
        <div className="section-header">
          <h2 className="section-title">Powerful Features</h2>
          <p className="section-sub">
            Everything you need to issue, manage, and verify professional certificates.
          </p>
        </div>
        <div className="features__grid">
          {FEATURES.map((f, i) => (
            <div key={i} className="feature-card" style={{ borderLeftColor: f.color }}>
              <div className="feature-icon" style={{ color: f.color }}>
                {f.icon}
              </div>
              <h3 className="feature-title">{f.title}</h3>
              <p className="feature-desc">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── How It Works ── */}
      <section className="landing__how">
        <div className="section-header">
          <h2 className="section-title">Three Simple Steps</h2>
          <p className="section-sub">From CSV to verified certificates in minutes</p>
        </div>
        
        <div className="steps-container">
          {[
            { num: '1', title: 'Upload CSV', desc: 'Names, emails, roles' },
            { num: '2', title: 'Generate Certs', desc: 'Automated QR codes' },
            { num: '3', title: 'Share & Verify', desc: 'Instant verification' },
          ].map((step, i) => (
            <div key={i} className="step-item">
              <div className="step-number">{step.num}</div>
              <h3 className="step-title">{step.title}</h3>
              <p className="step-desc">{step.desc}</p>
              {i < 2 && <div className="step-arrow">→</div>}
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA Banner ── */}
      <section className="landing__cta-banner">
        <h2 className="cta__title">Ready to issue your first certificate?</h2>
        <p className="cta__sub">Join hundreds of organizations using CertiVerify</p>
        <Link to="/register" className="btn btn-primary btn-lg">
          Get Started Free <ArrowRight size={18} />
        </Link>
      </section>
    </div>
  );
}
