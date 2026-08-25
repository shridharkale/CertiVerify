import { useState } from "react"
import { Link, Navigate, useNavigate } from "react-router-dom"
import { motion } from "framer-motion"
import { ShieldCheck, Mail, Lock, Eye, EyeOff } from "lucide-react"
import { useAuth } from "../utils/auth"
import { useToast } from "../utils/useToast"

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function Login() {
  const { login, user } = useAuth()
  const { showToast, ToastContainer } = useToast()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: "", password: "" })
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  if (user) return <Navigate to="/dashboard" replace />

  const validate = () => {
    const e = {}
    const email = form.email.trim()
    if (!email) e.email = "Email is required"
    else if (!EMAIL_RE.test(email)) e.email = "Enter a valid email"
    if (!form.password) e.password = "Password is required"
    return e
  }

  const handleSubmit = async (ev) => {
    ev?.preventDefault()
    const e = validate()
    if (Object.keys(e).length) { setErrors(e); return }
    setErrors({})
    setLoading(true)
    try {
      await login(form.email.trim(), form.password)
      navigate("/dashboard")
    } catch (err) {
      showToast(err.message || "Sign in failed", "error")
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
        <h1 className="auth-card__title">Welcome back</h1>
        <p className="auth-card__sub">Sign in to your account</p>
        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          <div className="field">
            <label className="field-label" htmlFor="login-email">Email</label>
            <div className="input-group">
              <Mail size={15} className="input-group-icon" />
              <input id="login-email" type="email" className={"input " + (errors.email ? "error" : "")} placeholder="you@example.com" value={form.email} onChange={set("email")} autoComplete="email" />
            </div>
            {errors.email && <span className="field-error">{errors.email}</span>}
          </div>
          <div className="field">
            <label className="field-label" htmlFor="login-password">Password</label>
            <div style={{ position:"relative" }}>
              <div className="input-group">
                <Lock size={15} className="input-group-icon" />
                <input id="login-password" type={showPw ? "text" : "password"} className={"input " + (errors.password ? "error" : "")} style={{ paddingRight:42 }} placeholder="••••••••" value={form.password} onChange={set("password")} autoComplete="current-password" />
              </div>
              <button type="button" className="reveal-btn" onClick={() => setShowPw(!showPw)} tabIndex={-1}>
                {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            {errors.password && <span className="field-error">{errors.password}</span>}
          </div>
          <button type="submit" className="btn btn-primary" style={{ width:"100%",marginTop:4 }} disabled={loading}>
            {loading ? <><span className="btn-spinner" /> Signing in...</> : "Sign in"}
          </button>
        </form>
        <div className="auth-footer">Don't have an account? <Link to="/register">Create one</Link></div>
      </motion.div>
    </div>
  )
}
