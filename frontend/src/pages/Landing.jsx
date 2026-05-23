import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Shield, ArrowRight, CheckCircle, Zap, Star, ChevronDown, Database, BarChart3, QrCode, FileSpreadsheet } from 'lucide-react';
import api from '../utils/api';
import './Landing.css';

const FEATURES = [
  {
    icon: <Database size={24} />,
    title: 'Smart Duplicate Detection',
    desc: 'Automated two-level validation checking within batch and against past events in Firestore.',
    color: '#3b82f6',
  },
  {
    icon: <QrCode size={24} />,
    title: 'Instant QR Verification',
    desc: 'Sub-2-second certificate lookup with in-memory caching and real-time timeline.',
    color: '#10b981',
  },
  {
    icon: <FileSpreadsheet size={24} />,
    title: 'Bulk Processing',
    desc: 'Upload a CSV, run clean validation, and generate hundreds of PDFs using ReportLab.',
    color: '#06b6d4',
  },
  {
    icon: <BarChart3 size={24} />,
    title: 'Analytics Dashboard',
    desc: 'Visualize certificate distribution, week-over-week trends, and roles in real time.',
    color: '#f59e0b',
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
      if (totalCerts <= 0) return; // Guard against zero to avoid division by zero
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
    { value: '100%', label: 'Immutable Data' },
    { value: `${animatedCerts}+`, label: 'Certs Issued' },
    { value: 'Sub-2s', label: 'Verification' },
    { value: '99.9%', label: 'API Uptime' },
  ];

  return (
    <div className="landing__wrapper">
      {/* ── Hero ── */}
      <section className={`landing__hero ${visible ? 'visible' : ''}`}>
        <div className="hero__badge animate-bounce-subtle">
          <Star size={13} fill="currentColor" />
          Designed for Data & Analytical Teams
        </div>

        <h1 className="hero__title">
          Certify Knowledge.
          <br />
          Verify Instantly.
          <br />
          <span className="gradient-text">Scale Infinitely.</span>
        </h1>

        <p className="hero__sub">
          Built with smart deduplication and high-performance real-time verification.
          Upload CSV lists, generate tamper-proof QR certificates, and view interactive analytics.
        </p>

        <div className="hero__cta">
          <Link to="/register" className="btn btn-primary btn-lg">
            Start Generating <ArrowRight size={18} />
          </Link>
          <Link to="/verify" className="btn btn-secondary btn-lg">
            Verify Certificate
          </Link>
        </div>

        {/* Floating cert mockup */}
        <div className="hero__mockup animate-float">
          <div className="mockup__card glass-card">
            <div className="mockup__header">
              <div className="mockup__dot" style={{ background: '#ef4444' }} />
              <div className="mockup__dot" style={{ background: '#f59e0b' }} />
              <div className="mockup__dot" style={{ background: '#10b981' }} />
              <span className="mockup__title">CertiVerify Certificate</span>
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
                <span className="badge badge-primary">ID: CERT-2026-X8Y9</span>
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
            <Shield size={16} color="#3b82f6" /> Authentic
          </div>
          <div className="orbit-item orbit-3 glass">
            <Zap size={16} color="#06b6d4" /> Fast lookup
          </div>
        </div>

        <a href="#features" className="scroll-hint">
          <ChevronDown size={20} />
          Discover Platform
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
          <h2 className="section-title">Analytical Performance</h2>
          <p className="section-sub">
            Fast, secure, and fully automated — optimized for developer portfolios and professional events.
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

      {/* ── Code Editor Preview Section ── */}
      <section className="landing__how" style={{ marginTop: '40px' }}>
        <div className="section-header">
          <h2 className="section-title">Standardized CSV Input</h2>
          <p className="section-sub">Simple, clean data structures for seamless bulk parsing.</p>
        </div>
        <div className="glass-card" style={{
          maxWidth: '600px',
          width: '100%',
          margin: '0 auto',
          padding: '20px',
          fontFamily: 'monospace',
          fontSize: '14px',
          textAlign: 'left',
          lineHeight: '1.6',
          borderLeft: '4px solid var(--primary)',
          boxShadow: 'var(--glass-shadow)',
          borderRadius: 'var(--radius-md)'
        }}>
          <div style={{ display: 'flex', gap: '6px', marginBottom: '14px' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ef4444' }} />
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#f59e0b' }} />
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#10b981' }} />
            <span style={{ marginLeft: '12px', fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>participants.csv</span>
          </div>
          <div>
            <span style={{ color: 'var(--primary-light)' }}>name</span>,
            <span style={{ color: 'var(--accent)' }}>email</span>,
            <span style={{ color: 'var(--secondary)' }}>role</span>
          </div>
          <div>
            <span>Alice Vance</span>,
            <span>alice@vance.io</span>,
            <span style={{ color: 'rgba(255,255,255,0.6)' }}>Data Scientist</span>
          </div>
          <div>
            <span>Bob Smith</span>,
            <span>bob@smith.dev</span>,
            <span style={{ color: 'rgba(255,255,255,0.6)' }}>Machine Learning Engineer</span>
          </div>
          <div>
            <span>Charlie Doe</span>,
            <span>charlie@doe.edu</span>,
            <span style={{ color: 'rgba(255,255,255,0.6)' }}>Research Fellow</span>
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="landing__how" style={{ marginTop: '80px' }}>
        <div className="section-header">
          <h2 className="section-title">Workflow Execution</h2>
          <p className="section-sub">Standard operations pipeline from input to verified output.</p>
        </div>
        <div className="steps">
          {[
            { n: '01', title: 'Upload Data Source', desc: 'Upload a standardized CSV with names, emails, and roles.' },
            { n: '02', title: 'Run Deduplication', desc: 'Our engine cleans validation conflicts and verifies in-memory.' },
            { n: '03', title: 'Generate & Publish', desc: 'Immutable Firestore storage with automated QR-code access links.' },
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
      <section className="landing__cta-banner glass-card" style={{ marginTop: '80px' }}>
        <h2 className="cta-banner__title">Ready to verify achievements?</h2>
        <p className="cta-banner__sub">Join hundreds of researchers and organisers using CertiVerify.</p>
        <div className="hero__cta">
          <Link to="/register" className="btn btn-primary btn-lg">
            Create Free Account <ArrowRight size={18} />
          </Link>
        </div>
      </section>
    </div>
  );
}
