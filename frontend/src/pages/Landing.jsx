import { Link } from "react-router-dom"
import { motion } from "framer-motion"
import { ShieldCheck, Zap, QrCode, Upload, ArrowRight } from "lucide-react"
import Navbar from "../components/Navbar"

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: (i = 0) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.45, ease: [0.25, 0.1, 0.25, 1] } })
}
const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } }

const FEATURES = [
  { icon: <Upload size={20} />, title: "Bulk upload", desc: "Upload a CSV and generate certificates for every recipient in one action." },
  { icon: <QrCode size={20} />, title: "QR verification", desc: "Every certificate carries a unique QR code. Anyone can verify instantly." },
  { icon: <ShieldCheck size={20} />, title: "Tamper-proof", desc: "Certificates are signed and stored securely — no modifications possible." },
  { icon: <Zap size={20} />, title: "Instant delivery", desc: "Recipients get their certificate the moment it is issued." },
]
const STEPS = [
  { n: "1", title: "Create an event", desc: "Name your event and set the date." },
  { n: "2", title: "Upload recipients", desc: "A CSV with names and emails is all you need." },
  { n: "3", title: "Issue and share", desc: "Certificates go out automatically with a verification link." },
]
const STATS = [
  { value: "100%", label: "Verifiable" },
  { value: "<1s", label: "Verify time" },
  { value: "PDF", label: "Format" },
  { value: "Free", label: "To verify" },
]

export default function Landing() {
  return (
    <>
      <Navbar />
      <main className="page" style={{ background: "var(--bg)" }}>
        <section className="hero">
          <div className="container">
            <motion.div variants={stagger} initial="hidden" animate="show">
              <motion.div variants={fadeUp} custom={0} style={{ display:"flex", justifyContent:"center" }}>
                <span className="hero__eyebrow"><ShieldCheck size={12} /> Certificate infrastructure</span>
              </motion.div>
              <motion.h1 variants={fadeUp} custom={1} className="display display-lg hero__title">
                Issue certificates.<br /><span className="grad">Verify in seconds.</span>
              </motion.h1>
              <motion.p variants={fadeUp} custom={2} className="hero__sub">
                Upload a CSV, generate signed PDF certificates, and let anyone verify authenticity with a QR scan.
              </motion.p>
              <motion.div variants={fadeUp} custom={3} className="hero__cta">
                <Link to="/register" className="btn btn-primary btn-lg">Get started free <ArrowRight size={16} /></Link>
                <Link to="/verify" className="btn btn-secondary btn-lg">Verify a certificate</Link>
              </motion.div>
            </motion.div>
          </div>
        </section>

        <section className="stats-strip">
          <div className="container">
            <motion.div className="stats-strip__grid" variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true }}>
              {STATS.map((s) => (
                <motion.div key={s.label} variants={fadeUp} className="stat">
                  <div className="stat__value">{s.value}</div>
                  <div className="stat__label">{s.label}</div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        <section className="features">
          <div className="container">
            <motion.div initial="hidden" whileInView="show" viewport={{ once: true }} variants={stagger}>
              <motion.p variants={fadeUp} className="label-mono" style={{ marginBottom:8 }}>What it does</motion.p>
              <motion.h2 variants={fadeUp} className="display display-sm" style={{ marginBottom:0 }}>Everything you need to run certificates.</motion.h2>
              <div className="features__grid">
                {FEATURES.map((f) => (
                  <motion.div key={f.title} variants={fadeUp} className="feature">
                    <div className="feature__icon">{f.icon}</div>
                    <div className="feature__title">{f.title}</div>
                    <div className="feature__desc">{f.desc}</div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        <section className="steps">
          <div className="container">
            <motion.div initial="hidden" whileInView="show" viewport={{ once: true }} variants={stagger}>
              <motion.p variants={fadeUp} className="label-mono" style={{ marginBottom:8 }}>How it works</motion.p>
              <motion.h2 variants={fadeUp} className="display display-sm" style={{ marginBottom:0 }}>Three steps to done.</motion.h2>
              <div className="steps__grid">
                {STEPS.map((s) => (
                  <motion.div key={s.n} variants={fadeUp} className="step">
                    <div className="step__num">{s.n}</div>
                    <div className="step__title">{s.title}</div>
                    <div className="step__desc">{s.desc}</div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        <section className="cta-section">
          <div className="container">
            <motion.div initial="hidden" whileInView="show" viewport={{ once: true }} variants={stagger}>
              <motion.h2 variants={fadeUp} className="display display-md cta-section__title">Ready to issue your first certificate?</motion.h2>
              <motion.p variants={fadeUp} className="cta-section__sub">Free to start. No credit card required.</motion.p>
              <motion.div variants={fadeUp}>
                <Link to="/register" className="btn btn-primary btn-lg">Create your account <ArrowRight size={16} /></Link>
              </motion.div>
            </motion.div>
          </div>
        </section>

        <footer className="footer">
          <div className="container">
            <div className="footer__inner">
              <div className="footer__brand">CertiVerify</div>
              <nav className="footer__links"><Link to="/verify">Verify</Link></nav>
              <span className="footer__copy">© {new Date().getFullYear()} CertiVerify</span>
            </div>
          </div>
        </footer>
      </main>
    </>
  )
}
