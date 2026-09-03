import { useState, useEffect, useRef } from "react"
import { motion } from "framer-motion"
import { LayoutDashboard, FileText, Upload, LogOut, ShieldCheck, CheckCircle, Loader2, CloudUpload, X, Download } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../utils/auth"
import { useToast } from "../utils/useToast"
import Navbar from "../components/Navbar"
import api from "../utils/api"

const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  show: (i = 0) => ({ opacity: 1, y: 0, transition: { delay: i * 0.06, duration: 0.35, ease: [0.25, 0.1, 0.25, 1] } })
}
const NAV = [
  { id: "overview", label: "Overview", icon: <LayoutDashboard size={16} /> },
  { id: "issue", label: "Issue", icon: <Upload size={16} /> },
  { id: "certs", label: "Certificates", icon: <FileText size={16} /> },
]

export default function Dashboard() {
  const { user, logout } = useAuth()
  const { showToast, ToastContainer } = useToast()
  const navigate = useNavigate()
  const fileRef = useRef()
  const [tab, setTab] = useState("overview")
  const [stats, setStats] = useState({ total: 0, events: 0, recent: 0 })
  const [certs, setCerts] = useState([])
  const [certsLoading, setCertsLoading] = useState(false)
  const [form, setForm] = useState({ eventName: "", eventDate: "", issuedBy: "" })
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState([])
  const [dragging, setDragging] = useState(false)
  const [issuing, setIssuing] = useState(false)
  const [progress, setProgress] = useState(0)
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  useEffect(() => { loadStats() }, [])
  useEffect(() => { if (tab === "certs") loadCerts() }, [tab])

  async function loadStats() {
    try {
      const r = await api.get("/api/certificates/public-stats")
      setStats({ total: r.data.total || 0, events: r.data.events || 0, recent: r.data.recent || 0 })
    } catch {}
  }

  async function loadCerts() {
    setCertsLoading(true)
    try {
      const r = await api.get("/api/certificates/list")
      setCerts(r.data.certificates || [])
    } catch {
      showToast("Could not load certificates", "error")
    } finally {
      setCertsLoading(false)
    }
  }

  function handleFile(f) {
    if (!f || !f.name.endsWith(".csv")) { showToast("Please upload a .csv file", "error"); return }
    setFile(f)
    const reader = new FileReader()
    reader.onload = (e) => { const rows = e.target.result.split("\n").filter(Boolean); setPreview(rows.slice(0, 5).map((r) => r.split(","))) }
    reader.readAsText(f)
  }

  async function handleIssue() {
    if (!form.eventName || !form.eventDate || !file) { showToast("Fill in event details and upload a CSV", "error"); return }
    setIssuing(true); setProgress(0)
    try {
      const fd = new FormData()
      fd.append("event_name", form.eventName); fd.append("event_date", form.eventDate)
      fd.append("issued_by", form.issuedBy || user?.email); fd.append("file", file)
      const tick = setInterval(() => setProgress((p) => Math.min(p + 8, 88)), 300)
      await api.post("/api/certificates/issue", fd, { headers: { "Content-Type": "multipart/form-data" } })
      clearInterval(tick); setProgress(100)
      showToast("Certificates issued successfully", "success")
      setTimeout(() => { setFile(null); setPreview([]); setForm({ eventName: "", eventDate: "", issuedBy: "" }); setProgress(0); setTab("certs") }, 800)
    } catch {
      showToast("Issue failed", "error"); setProgress(0)
    } finally {
      setIssuing(false)
    }
  }

  const handleLogout = async () => { await logout(); navigate("/login") }
  const greeting = () => { const h = new Date().getHours(); return h < 12 ? "morning" : h < 17 ? "afternoon" : "evening" }

  return (
    <>
      <Navbar />
      <ToastContainer />
      <div className="dashboard">
        <aside className="sidebar">
          <nav className="sidebar__menu">
            {NAV.map((n) => (
              <button key={n.id} className={"sidebar__item " + (tab === n.id ? "active" : "")} onClick={() => setTab(n.id)}>
                {n.icon}<span>{n.label}</span>
              </button>
            ))}
          </nav>
          <div className="sidebar__divider" />
          <button className="sidebar__item" onClick={handleLogout}><LogOut size={16} /><span>Sign out</span></button>
        </aside>
        <main className="dash-main">
          {tab === "overview" && (
            <motion.div variants={{ show: { transition: { staggerChildren: 0.07 } } }} initial="hidden" animate="show">
              <motion.div variants={fadeUp} className="dash-header">
                <div className="dash-title">Good {greeting()}, {user?.name?.split(" ")[0] || user?.email?.split("@")[0]}</div>
                <div className="dash-sub">Here is what is happening with your certificates.</div>
              </motion.div>
              <div className="stat-row">
                {[
                  { label: "Certificates issued", value: stats.total, sub: "All time", accent: true },
                  { label: "Events created", value: stats.events, sub: "All time" },
                  { label: "Issued this month", value: stats.recent, sub: "Last 30 days" },
                ].map((s, i) => (
                  <motion.div key={s.label} variants={fadeUp} custom={i} className={"stat-card " + (s.accent ? "stat-card--accent" : "")}>
                    <div className="stat-card__label">{s.label}</div>
                    <div className="stat-card__value">{s.value}</div>
                    <div className="stat-card__sub">{s.sub}</div>
                  </motion.div>
                ))}
              </div>
              <motion.div variants={fadeUp} custom={3} className="panel">
                <div className="panel__head"><span className="panel__title">Quick actions</span></div>
                <div className="panel__body" style={{ display:"flex", gap:"var(--s3)", flexWrap:"wrap" }}>
                  <button className="btn btn-primary" onClick={() => setTab("issue")}><Upload size={15} /> Issue certificates</button>
                  <button className="btn btn-secondary" onClick={() => setTab("certs")}><FileText size={15} /> View certificates</button>
                  <button className="btn btn-secondary" onClick={() => navigate("/verify")}><ShieldCheck size={15} /> Verify a certificate</button>
                </div>
              </motion.div>
            </motion.div>
          )}
          {tab === "issue" && (
            <motion.div initial={{ opacity:0, y:14 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.35 }}>
              <div className="dash-header"><div className="dash-title">Issue certificates</div><div className="dash-sub">Fill in event details and upload a recipient CSV.</div></div>
              <div className="panel">
                <div className="panel__head"><span className="panel__title">Event details</span></div>
                <div className="panel__body">
                  <div className="form-grid">
                    <div className="field"><label className="field-label">Event name</label><input className="input" placeholder="e.g. Annual Tech Symposium" value={form.eventName} onChange={set("eventName")} /></div>
                    <div className="field"><label className="field-label">Event date</label><input type="date" className="input" value={form.eventDate} onChange={set("eventDate")} /></div>
                    <div className="field"><label className="field-label">Issued by</label><input className="input" placeholder="Organisation or person" value={form.issuedBy} onChange={set("issuedBy")} /></div>
                  </div>
                </div>
              </div>
              <div className="panel">
                <div className="panel__head"><span className="panel__title">Recipient CSV</span></div>
                <div className="panel__body">
                  <input type="file" accept=".csv" ref={fileRef} style={{ display:"none" }} onChange={(e) => handleFile(e.target.files[0])} />
                  <div className={"dropzone " + (dragging ? "drag-over " : "") + (file ? "has-file" : "")}
                    onClick={() => fileRef.current.click()}
                    onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
                    onDragLeave={() => setDragging(false)}
                    onDrop={(e) => { e.preventDefault(); setDragging(false); handleFile(e.dataTransfer.files[0]) }}>
                    {file ? (
                      <div style={{ display:"flex", alignItems:"center", gap:12, justifyContent:"center" }}>
                        <CheckCircle size={20} color="var(--success)" />
                        <span style={{ fontFamily:"var(--font-mono)", fontSize:13 }}>{file.name}</span>
                        <button className="btn-icon" onClick={(e) => { e.stopPropagation(); setFile(null); setPreview([]) }}><X size={13} /></button>
                      </div>
                    ) : (
                      <>
                        <CloudUpload size={32} className="dropzone__icon" />
                        <p className="dropzone__label">Drop CSV here or <span className="dropzone__link">browse</span></p>
                        <p style={{ fontSize:12, color:"var(--text-subtle)", marginTop:4 }}>Columns: name, email, role</p>
                      </>
                    )}
                  </div>
                  {preview.length > 0 && (
                    <div style={{ marginTop:"var(--s4)" }}>
                      <p className="label-mono" style={{ marginBottom:8 }}>Preview</p>
                      <div className="table-wrap"><table className="table">
                        <thead><tr>{preview[0].map((h, i) => <th key={i}>{h.trim()}</th>)}</tr></thead>
                        <tbody>{preview.slice(1).map((row, i) => <tr key={i}>{row.map((cell, j) => <td key={j}>{cell.trim()}</td>)}</tr>)}</tbody>
                      </table></div>
                    </div>
                  )}
                  {issuing && (
                    <div style={{ marginTop:"var(--s4)" }}>
                      <div style={{ display:"flex", justifyContent:"space-between", fontSize:13, color:"var(--text-muted)", marginBottom:6 }}>
                        <span>Issuing certificates...</span><span>{progress}%</span>
                      </div>
                      <div className="progress-track"><div className="progress-fill" style={{ width:`${progress}%` }} /></div>
                    </div>
                  )}
                  <div style={{ marginTop:"var(--s5)", display:"flex", gap:"var(--s3)" }}>
                    <button className="btn btn-primary" onClick={handleIssue} disabled={issuing}>
                      {issuing ? <><Loader2 size={14} className="spin" /> Issuing...</> : <><Upload size={14} /> Issue certificates</>}
                    </button>
                    <button className="btn btn-secondary" onClick={() => { setFile(null); setPreview([]); setForm({ eventName:"", eventDate:"", issuedBy:"" }) }}>Clear</button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
          {tab === "certs" && (
            <motion.div initial={{ opacity:0, y:14 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.35 }}>
              <div className="dash-header"><div className="dash-title">Certificates</div><div className="dash-sub">All issued certificates.</div></div>
              <div className="panel">
                <div className="panel__body" style={{ padding:0 }}>
                  {certsLoading ? (
                    <div style={{ display:"flex", alignItems:"center", gap:10, padding:"var(--s8)", color:"var(--text-muted)", justifyContent:"center" }}><Loader2 size={18} className="spin" /> Loading...</div>
                  ) : certs.length === 0 ? (
                    <div style={{ textAlign:"center", padding:"var(--s10)", color:"var(--text-muted)" }}>
                      <FileText size={32} style={{ margin:"0 auto 10px", color:"var(--text-subtle)" }} />
                      <p style={{ fontSize:14 }}>No certificates issued yet.</p>
                      <button className="btn btn-primary btn-sm" style={{ marginTop:12 }} onClick={() => setTab("issue")}>Issue your first batch</button>
                    </div>
                  ) : (
                    <div className="table-wrap" style={{ borderRadius:"var(--r-lg)" }}>
                      <table className="table">
                        <thead><tr><th>Recipient</th><th>Event</th><th>Issued</th><th>Certificate ID</th><th></th></tr></thead>
                        <tbody>{certs.map((c) => (
                          <tr key={c.cert_id}>
                            <td><div style={{ fontWeight:500 }}>{c.name || c.recipient_name}</div><div style={{ fontSize:12, color:"var(--text-muted)", fontFamily:"var(--font-mono)" }}>{c.email}</div></td>
                            <td>{c.event_name}</td>
                            <td style={{ fontSize:13, color:"var(--text-muted)" }}>{c.event_date || c.issued_date || c.created_at}</td>
                            <td><span className="cert-id">{c.cert_id}</span></td>
                            <td>{c.cert_id && <a href={`${import.meta.env.VITE_API_BASE_URL}/api/certificates/download/${c.cert_id}`} className="btn btn-icon" target="_blank" rel="noopener noreferrer"><Download size={13} /></a>}</td>
                          </tr>
                        ))}</tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </main>
      </div>
    </>
  )
}
