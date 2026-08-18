import { useState, useEffect } from 'react';
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

  useEffect(() => {
    document.title = 'Create Account — CertiVerify';
  }, []);

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
    <div className="auth__page">
      <div className="auth__left">
        <div className="auth__left-logo">
          <div className="logo-icon">
            <Shield size={22} strokeWidth={2.5} />
          </div>
          <span>Certi<em>Verify</em></span>
        </div>
        <h2 className="auth__left-headline">
          Issue Certificates.<br/>
          <span>Verify Instantly.</span>
        </h2>
        <p className="auth__left-desc">
          The fastest way to generate and verify 
          tamper-proof certificates at scale.
        </p>
        <div className="auth__left-features">
          <div><CheckCircle size={16}/> Smart CSV deduplication</div>
          <div><CheckCircle size={16}/> QR code verification</div>
          <div><CheckCircle size={16}/> Analytics dashboard</div>
          <div><CheckCircle size={16}/> Instant PDF generation</div>
        </div>
      </div>

      <div className="auth__right">
        <div className="auth__right-inner">
          <h1 className="auth__right-title">Create account</h1>
          <p className="auth__right-sub">Start issuing verified certificates today</p>

          {error && (
            <div className="alert alert-error">
              <AlertCircle size={16} /> {error}
            </div>
          )}
          {success && (
            <div className="alert alert-success">
              <CheckCircle size={16} /> {success}
            </div>
          )}

          <form className="auth__form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Full Name</label>
              <div className="input-wrapper">
                <User size={16} className="input-icon" />
                <input
                  name="name"
                  type="text"
                  placeholder="Arjun Sharma"
                  value={form.name}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label>Organisation</label>
              <div className="input-wrapper">
                <Building size={16} className="input-icon" />
                <input
                  name="organisation"
                  type="text"
                  placeholder="e.g. TechConf India"
                  value={form.organisation}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="form-group">
              <label>Email Address</label>
              <div className="input-wrapper">
                <Mail size={16} className="input-icon" />
                <input
                  name="email"
                  type="email"
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label>Password</label>
              <div className="input-wrapper">
                <Lock size={16} className="input-icon" />
                <input
                  name="password"
                  type={showPass ? 'text' : 'password'}
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
                    {[1, 2, 3, 4].map(n => (
                      <div
                        key={n}
                        className="pw-bar"
                        style={{ background: n <= pw_strength ? pw_colors[pw_strength] : 'rgba(255,255,255,0.1)' }}
                      />
                    ))}
                  </div>
                  <span style={{ color: pw_colors[pw_strength], fontSize: 12 }}>{pw_labels[pw_strength]}</span>
                </div>
              )}
            </div>

            <div className="form-group">
              <label>Confirm Password</label>
              <div className="input-wrapper">
                <Lock size={16} className="input-icon" />
                <input
                  name="confirm"
                  type={showPass ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={form.confirm}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <button type="submit" className="btn-primary-auth" disabled={loading}>
              {loading ? (
                <><span className="spinner" /> Creating account...</>
              ) : (
                <>Create Account <ArrowRight size={16} /></>
              )}
            </button>
          </form>

          <p className="auth__switch">
            Already have an account? <Link to="/login">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}