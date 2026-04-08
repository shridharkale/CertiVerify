import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Shield, ArrowRight, CheckCircle, Zap, Lock, Users, Star, ChevronDown } from 'lucide-react';
import './Landing.css';

const FEATURES = [
  {
    icon: <Zap size={24} />,
    title: 'Instant Generation',
    desc: 'Upload a CSV and generate hundreds of certificates in seconds with ReportLab.',
    color: '#f59e0b',
  },
  {
    icon: <Shield size={24} />,
    title: 'QR Verification',
    desc: 'Every certificate carries a unique QR code linking to its public verification page.',
    color: '#6366f1',
  },
  {
    icon: <Lock size={24} />,
    title: 'Tamper-Proof',
    desc: 'Backed by Firebase Firestore — every issued certificate is stored & immutable.',
    color: '#10b981',
  },
  {
    icon: <Users size={24} />,
    title: 'Bulk Dispatch',
    desc: 'Send verified PDFs directly to recipients the moment generation completes.',
    color: '#06b6d4',
  },
];

const STATS = [
  { value: '10K+', label: 'Certificates Issued' },
  { value: '500+', label: 'Organisations' },
  { value: '99.9%', label: 'Uptime' },
  { value: '<2s', label: 'Verify Time' },
];

export default function Landing() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 100);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="landing__wrapper">
      {/* ── Hero ── */}
      <section className={`landing__hero ${visible ? 'visible' : ''}`}>
        <div className="hero__badge animate-bounce-subtle">
          <Star size={13} fill="currentColor" />
          Trusted Certificate Platform
        </div>

        <h1 className="hero__title">
          Issue & Verify Certificates
          <br />
          <span className="gradient-text">with Confidence</span>
        </h1>

        <p className="hero__sub">
          CertVerify lets organisers bulk-generate QR-embedded certificates from a CSV
          and share a public link so anyone can verify authenticity in seconds.
        </p>

        <div className="hero__cta">
          <Link to="/register" className="btn btn-primary btn-lg">
            Start for Free <ArrowRight size={18} />
          </Link>
          <Link to="/verify" className="btn btn-secondary btn-lg">
            Verify a Certificate
          </Link>
        </div>

        {/* Floating cert mockup */}
        <div className="hero__mockup animate-float">
          <div className="mockup__card glass-card">
            <div className="mockup__header">
              <div className="mockup__dot" style={{ background: '#ef4444' }} />
              <div className="mockup__dot" style={{ background: '#f59e0b' }} />
              <div className="mockup__dot" style={{ background: '#10b981' }} />
              <span className="mockup__title">CertVerify Certificate</span>
            </div>
            <div className="mockup__body">
              <div className="mockup__seal">
                <Shield size={32} className="seal-icon" />
              </div>
              <div className="mockup__name">CERTIFICATE OF ACHIEVEMENT</div>
              <div className="mockup__recipient">Awarded to <b>Arjun Sharma</b></div>
              <div className="mockup__event">React Bootcamp 2025</div>
              <div className="mockup__badges">
                <span className="badge badge-success"><CheckCircle size={11} /> Verified</span>
                <span className="badge badge-primary">ID: CV-2024-0042</span>
              </div>
              <div className="mockup__qr">
                <div className="qr-box">
                  {[...Array(16)].map((_, i) => (
                    <div key={i} className="qr-cell" style={{ opacity: Math.random() > 0.4 ? 1 : 0.1 }} />
                  ))}
                </div>
                <span className="qr-label">Scan to Verify</span>
              </div>
            </div>
          </div>

          {/* Orbit badges */}
          <div className="orbit-item orbit-1 glass">
            <CheckCircle size={16} color="#10b981" /> Verified
          </div>
          <div className="orbit-item orbit-2 glass">
            <Shield size={16} color="#6366f1" /> Authentic
          </div>
          <div className="orbit-item orbit-3 glass">
            <Zap size={16} color="#f59e0b" /> Instant
          </div>
        </div>

        <a href="#features" className="scroll-hint">
          <ChevronDown size={20} />
          Discover more
        </a>
      </section>

      {/* ── Stats ── */}
      <section className="landing__stats">
        {STATS.map((s, i) => (
          <div key={i} className="stat-card glass-card">
            <div className="stat-value gradient-text">{s.value}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </section>

      {/* ── Features ── */}
      <section className="landing__features" id="features">
        <div className="section-header">
          <h2 className="section-title">Everything you need</h2>
          <p className="section-sub">
            A complete end-to-end platform — from CSV upload to public verification.
          </p>
        </div>
        <div className="features__grid">
          {FEATURES.map((f, i) => (
            <div key={i} className="feature-card glass-card" style={{ '--accent-color': f.color, animationDelay: `${i * 0.1}s` }}>
              <div className="feature-icon" style={{ background: `${f.color}22`, color: f.color }}>
                {f.icon}
              </div>
              <h3 className="feature-title">{f.title}</h3>
              <p className="feature-desc">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="landing__how">
        <div className="section-header">
          <h2 className="section-title">How it works</h2>
          <p className="section-sub">Three simple steps to get started.</p>
        </div>
        <div className="steps">
          {[
            { n: '01', title: 'Upload CSV', desc: 'Upload a CSV with recipient names, emails and event info.' },
            { n: '02', title: 'Generate PDFs', desc: 'Our engine creates QR-embedded certificate PDFs instantly.' },
            { n: '03', title: 'Share & Verify', desc: 'Share the public link. Anyone can verify with one click.' },
          ].map((step, i) => (
            <div key={i} className="step-card glass-card">
              <div className="step-num gradient-text">{step.n}</div>
              <h3 className="step-title">{step.title}</h3>
              <p className="step-desc">{step.desc}</p>
              {i < 2 && <div className="step-arrow">→</div>}
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA Banner ── */}
      <section className="landing__cta-banner glass-card">
        <h2 className="cta-banner__title">Ready to go paperless?</h2>
        <p className="cta-banner__sub">Join hundreds of organisers already using CertVerify.</p>
        <div className="hero__cta">
          <Link to="/register" className="btn btn-primary btn-lg">
            Create Free Account <ArrowRight size={18} />
          </Link>
        </div>
      </section>
    </div>
  );
}
