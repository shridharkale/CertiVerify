import { useState } from "react"
import { Link, Navigate, useNavigate } from "react-router-dom"
import { motion } from "framer-motion"
import { ShieldCheck, Mail, Lock, Eye, EyeOff, User } from "lucide-react"
import { useAuth } from "../utils/auth"
import { useToast } from "../utils/useToast"

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function Register() {
  const { register, user } = useAuth()
  const { showToast, ToastContainer } = useToast()
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "" })
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  if (user) return <Navigate to="/dashboard" replace />

  const validate = () => {
    const e = {}
    const name = form.name.trim()
    const email = form.email.trim()
    if (!name) e.name = "Name is required"
    if (!email) e.email = "Email is required"
    else if (!EMAIL_RE.test(email)) e.email = "Enter a valid email"
    if (!form.password) e.password = "Password is required"
    else if (form.password.length < 8) e.password = "At least 8 characters"
    if (!form.confirm) e.confirm = "Confirm your password"
    else if (form.password !== form.confirm) e.confirm = "Passwords do not match"
    return e
  }

  const handleSubmit = async (ev) => {
    ev?.preventDefault()
    const e = validate()
    if (Object.keys(e).length) { setErrors(e); return }
    setErrors({})
    setLoading(true)
    try {
      await register(form.email.trim(), form.password, form.name.trim())
      navigate("/dashboard")
    } catch (err) {
      const msg = err.message || "Registration failed"
      showToast(msg, "error")
      if (msg.toLowerCase().includes("please sign in")) {
        navigate("/login")
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <ToastContainer />
      <motion.div className="auth-card" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <div className="auth-card__logo">
          <div style={{ width:44,height:44,borderRadius:"var(--r-md)",background:"var(--primary-soft)",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 12px",color:"var(--primary)" }}>
            <ShieldCheck size={22} strokeWidth={2} />
          </div>
        </div>
        <h1 className="auth-card__title">Create account</h1>
        <p className="auth-card__sub">Start issuing certificates today</p>
        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          <div className="field">
            <label className="field-label" htmlFor="reg-name">Full name</label>
            <div className="input-group">
              <User size={15} className="input-group-icon" />
              <input id="reg-name" type="text" className={"input " + (errors.name ? "error" : "")} placeholder="Your name" value={form.name} onChange={set("name")} autoComplete="name" />
            </div>
            {errors.name && <span className="field-error">{errors.name}</span>}
          </div>
          <div className="field">
            <label className="field-label" htmlFor="reg-email">Email</label>
            <div className="input-group">
              <Mail size={15} className="input-group-icon" />
              <input id="reg-email" type="email" className={"input " + (errors.email ? "error" : "")} placeholder="you@example.com" value={form.email} onChange={set("email")} autoComplete="email" />
            </div>
            {errors.email && <span className="field-error">{errors.email}</span>}
          </div>
          <div className="field">
            <label className="field-label" htmlFor="reg-password">Password</label>
            <div style={{ position:"relative" }}>
              <div className="input-group">
                <Lock size={15} className="input-group-icon" />
                <input id="reg-password" type={showPw ? "text" : "password"} className={"input " + (errors.password ? "error" : "")} style={{ paddingRight:42 }} placeholder="Min. 8 characters" value={form.password} onChange={set("password")} autoComplete="new-password" />
              </div>
              <button type="button" className="reveal-btn" onClick={() => setShowPw(!showPw)} tabIndex={-1}>
                {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            {errors.password && <span className="field-error">{errors.password}</span>}
          </div>
          <div className="field">
            <label className="field-label" htmlFor="reg-confirm">Confirm password</label>
            <div className="input-group">
              <Lock size={15} className="input-group-icon" />
              <input id="reg-confirm" type={showPw ? "text" : "password"} className={"input " + (errors.confirm ? "error" : "")} placeholder="Repeat password" value={form.confirm} onChange={set("confirm")} autoComplete="new-password" />
            </div>
            {errors.confirm && <span className="field-error">{errors.confirm}</span>}
          </div>
          <button type="submit" className="btn btn-primary" style={{ width:"100%",marginTop:4 }} disabled={loading}>
            {loading ? <><span className="btn-spinner" /> Creating account...</> : "Create account"}
          </button>
        </form>
        <div className="auth-footer">Already have an account? <Link to="/login">Sign in</Link></div>
      </motion.div>
    </div>
  )
}
