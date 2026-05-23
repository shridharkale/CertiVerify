import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Shield, Mail, Lock, Eye, EyeOff, User, Building, ArrowRight, AlertCircle, CheckCircle } from 'lucide-react';
import api from '../utils/api';
import './Auth.css';

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '', organisation: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError('');
  };

  const validate = () => {
    if (!form.name.trim()) return 'Full name is required.';
    if (!form.email.includes('@')) return 'Enter a valid email.';
    if (form.password.length < 6) return 'Password must be at least 6 characters.';
    if (form.password !== form.confirm) return 'Passwords do not match.';
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const err = validate();
    if (err) { setError(err); return; }
    setLoading(true);
    setError('');
    try {
      await api.post('/auth/register', {
        name: form.name,
        email: form.email,
        password: form.password,
        organisation: form.organisation,
      });
      setSuccess('Account created! Redirecting to login...');
      setTimeout(() => navigate('/login'), 1800);
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const strength = (p) => {
    if (!p) return 0;
    let s = 0;
    if (p.length >= 6) s++;
    if (/[A-Z]/.test(p)) s++;
    if (/[0-9]/.test(p)) s++;
    if (/[^A-Za-z0-9]/.test(p)) s++;
    return s;
  };
  const pw_strength = strength(form.password);
  const pw_labels = ['', 'Weak', 'Fair', 'Good', 'Strong'];
  const pw_colors = ['', '#ef4444', '#f59e0b', '#06b6d4', '#10b981'];

  return (
    <div className="auth__wrapper">
      <div className="auth__card glass-card animate-slide-up">
        <div className="auth__logo">
          <div className="logo-icon">
            <Shield size={22} strokeWidth={2.5} />
          </div>
          <span className="auth__brand">CertiVerify</span>
        </div>

        <h1 className="auth__title">Create account</h1>
        <p className="auth__sub">Start issuing verified certificates today</p>

        {error && (
          <div className="alert alert-error animate-fade-in">
            <AlertCircle size={16} /> {error}
          </div>
        )}
        {success && (
          <div className="alert alert-success animate-fade-in">
            <CheckCircle size={16} /> {success}
          </div>
        )}

        <form className="auth__form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="label">Full Name</label>
            <div className="input-wrapper">
              <User size={16} className="input-icon" />
              <input
                id="reg-name"
                name="name"
                type="text"
                className="input-glass input-with-icon"
                placeholder="Arjun Sharma"
                value={form.name}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          {/* ✅ Organisation field added */}
          <div className="form-group">
            <label className="label">Organisation</label>
            <div className="input-wrapper">
              <Building size={16} className="input-icon" />
              <input
                id="reg-organisation"
                name="organisation"
                type="text"
                className="input-glass input-with-icon"
                placeholder="e.g. TechConf India"
                value={form.organisation}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="label">Email Address</label>
            <div className="input-wrapper">
              <Mail size={16} className="input-icon" />
              <input
                id="reg-email"
                name="email"
                type="email"
                className="input-glass input-with-icon"
                placeholder="you@example.com"
                value={form.email}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="label">Password</label>
            <div className="input-wrapper">
              <Lock size={16} className="input-icon" />
              <input
                id="reg-password"
                name="password"
                type={showPass ? 'text' : 'password'}
                className="input-glass input-with-icon input-with-action"
                placeholder="••••••••"
                value={form.password}
                onChange={handleChange}
                required
              />
              <button type="button" className="input-action" onClick={() => setShowPass(!showPass)}>
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {form.password && (
              <div className="pw-strength">
                <div className="pw-bars">
                  {[1,2,3,4].map(n => (
                    <div key={n} className="pw-bar" style={{ background: n <= pw_strength ? pw_colors[pw_strength] : 'rgba(0,0,0,0.1)' }} />
                  ))}
                </div>
                <span style={{ color: pw_colors[pw_strength], fontSize: 12 }}>{pw_labels[pw_strength]}</span>
              </div>
            )}
          </div>

          <div className="form-group">
            <label className="label">Confirm Password</label>
            <div className="input-wrapper">
              <Lock size={16} className="input-icon" />
              <input
                id="reg-confirm"
                name="confirm"
                type={showPass ? 'text' : 'password'}
                className="input-glass input-with-icon"
                placeholder="••••••••"
                value={form.confirm}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <button id="reg-submit" type="submit" className="btn btn-primary w-full" disabled={loading}>
            {loading ? <><span className="spinner" /> Creating account...</> : <>Create Account <ArrowRight size={16} /></>}
          </button>
        </form>

        <div className="divider" />
        <p className="auth__switch">
          Already have an account? <Link to="/login" className="auth__link">Sign in</Link>
        </p>
      </div>

      <div className="auth__blob auth__blob--1" />
      <div className="auth__blob auth__blob--2" />
    </div>
  );
}