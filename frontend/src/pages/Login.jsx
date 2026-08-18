import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Shield, Mail, Lock, Eye, EyeOff, ArrowRight, AlertCircle, CheckCircle } from 'lucide-react';
import api from '../utils/api';
import './Auth.css';

export default function Login() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    document.title = 'Sign In — CertiVerify';
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/auth/login', form);
      localStorage.setItem('cv_token', res.data.token);
      localStorage.setItem('cv_user', JSON.stringify(res.data.user));
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.message || 'Invalid credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth__page">
      
      <div className="auth__left">
        <div className="auth__left-logo">
          <div className="logo-icon">
            <Shield size={22} strokeWidth={2.5}/>
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
          <h1 className="auth__right-title">Welcome back</h1>
          <p className="auth__right-sub">
            Sign in to your organiser account
          </p>
          {error && (
            <div className="alert alert-error">
              <AlertCircle size={16}/> {error}
            </div>
          )}
          <form className="auth__form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Email Address</label>
              <div className="input-wrapper">
                <Mail size={16} className="input-icon"/>
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
                <Lock size={16} className="input-icon"/>
                <input
                  name="password"
                  type={showPass ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={form.password}
                  onChange={handleChange}
                  required
                />
                <button type="button" className="input-action"
                  onClick={() => setShowPass(!showPass)}>
                  {showPass ? <EyeOff size={16}/> : <Eye size={16}/>}
                </button>
              </div>
            </div>
            <button type="submit" 
              className="btn-primary-auth"
              disabled={loading}>
              {loading 
                ? <><span className="spinner"/> Signing in...</>
                : <>Sign In <ArrowRight size={16}/></>
              }
            </button>
          </form>
          <p className="auth__switch">
            Don't have an account?{' '}
            <Link to="/register">Create one free</Link>
          </p>
        </div>
      </div>
    </div>
  );
}