import { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  UploadCloud, FileText, Play, Download, Trash2,
  CheckCircle, AlertCircle, BarChart2,
  Users, Award, Calendar, RefreshCw, Eye, Building,
  LogOut, Settings, LayoutDashboard, Database, HelpCircle,
  FileSpreadsheet, Search, Sparkles, ExternalLink
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell
} from 'recharts';
import api from '../utils/api';
import './Dashboard.css';

export default function Dashboard() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('cv_user') || '{}');
  const fileRef = useRef(null);

  // Tabs: overview, generate, certs, analytics, settings
  const [tab, setTab] = useState('overview');
  
  // CSV generation logic state
  const [csvFile, setCsvFile] = useState(null);
  const [csvPreview, setCsvPreview] = useState([]);
  const [eventDetails, setEventDetails] = useState({ 
    event_name: '', 
    event_date: '', 
    organisation: '',
    expiry_date: '' 
  });
  const [dragOver, setDragOver] = useState(false);
  const [uploadStatus, setUploadStatus] = useState(null);
  const [uploadMsg, setUploadMsg] = useState('');
  const [uploadId, setUploadId] = useState(null);
  
  const [genStatus, setGenStatus] = useState(null);
  const [genMsg, setGenMsg] = useState('');
  const [certificates, setCertificates] = useState([]);
  const [certLoading, setCertLoading] = useState(false);
  
  // Stats state
  const [stats, setStats] = useState({ total: 0, events: 0, recent: 0, expired: 0 });
  const [uploadedParticipants, setUploadedParticipants] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!localStorage.getItem('cv_token')) {
      navigate('/login');
      return;
    }
    fetchCertificates();
  }, []);

  const fetchCertificates = async () => {
    setCertLoading(true);
    try {
      const res = await api.get('/certificates/list');
      const list = res.data.certificates || [];
      setCertificates(list);
      
      const events = new Set(list.map(c => c.event_name)).size;
      const nowSeconds = Math.floor(Date.now() / 1000);
      const expiredCount = list.filter(c => c.expiry_date && nowSeconds > c.expiry_date).length;
      
      setStats({
        total: list.length,
        events,
        recent: list.filter(c => {
          const d = new Date(c.created_at);
          return (Date.now() - d) < 7 * 24 * 3600 * 1000;
        }).length,
        expired: expiredCount
      });
    } catch {
      setCertificates([]);
    } finally {
      setCertLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('cv_token');
    localStorage.removeItem('cv_user');
    navigate('/login');
  };

  const handleFile = (file) => {
    if (!file || !file.name.endsWith('.csv')) {
      setUploadMsg('Please upload a .csv file.');
      setUploadStatus('error');
      return;
    }
    setCsvFile(file);
    setUploadStatus(null);
    setUploadMsg('');
    const reader = new FileReader();
    reader.onload = (e) => {
      const lines = e.target.result.split('\n').slice(0, 6);
      const headers = lines[0]?.split(',') || [];
      const rows = lines.slice(1).map(l => l.split(','));
      setCsvPreview({ headers, rows });
    };
    reader.readAsText(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    handleFile(e.dataTransfer.files[0]);
  };

  const handleUploadCSV = async () => {
    if (!csvFile) return;
    setUploadStatus('loading');
    setUploadMsg('');
    const formData = new FormData();
    formData.append('file', csvFile);
    Object.entries(eventDetails).forEach(([k, v]) => {
      if (k !== 'expiry_date') formData.append(k, v);
    });
    try {
      const res = await api.post('/certificates/upload-csv', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const participants = res.data.participants || [];
      setUploadId(res.data.upload_id);
      setUploadedParticipants(participants);
      setUploadStatus('success');
      setUploadMsg(`✓ ${res.data.total_rows} recipients loaded. ${res.data.duplicates?.length || 0} duplicates skipped.`);
    } catch (err) {
      setUploadStatus('error');
      setUploadMsg(err.response?.data?.error || 'Upload failed. Check your CSV format.');
    }
  };

  const handleGenerate = async () => {
    setGenStatus('loading');
    setGenMsg('');
    try {
      const payload = {
        event_name: eventDetails.event_name,
        event_date: eventDetails.event_date,
        organisation: eventDetails.organisation,
        participants: uploadedParticipants,
      };
      if (eventDetails.expiry_date) {
        payload.expiry_date = eventDetails.expiry_date;
      }
      const res = await api.post('/certificates/generate', payload);
      setGenStatus('success');
      setGenMsg(`🎉 Generated ${res.data.count} certificates. ${res.data.skipped} duplicates skipped.`);
      fetchCertificates();
      setTimeout(() => setTab('certs'), 1500);
    } catch (err) {
      setGenStatus('error');
      setGenMsg(err.response?.data?.error || 'Generation failed.');
    }
  };

  // Export table to CSV (client-side only)
  const exportToCSV = () => {
    if (certificates.length === 0) return;
    const headers = ['Cert ID', 'Recipient Name', 'Recipient Email', 'Role', 'Event Name', 'Event Date', 'Organisation', 'Issued At', 'Expiry Date'];
    const rows = certificates.map(c => [
      c.cert_id,
      c.name,
      c.email,
      c.role,
      c.event_name,
      c.event_date,
      c.organisation || '',
      c.created_at,
      c.expiry_date ? new Date(c.expiry_date * 1000).toLocaleDateString() : 'Never'
    ]);
    
    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `issued_certificates_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Recharts data processing
  const getEventData = () => {
    const map = {};
    certificates.forEach(c => {
      map[c.event_name] = (map[c.event_name] || 0) + 1;
    });
    return Object.entries(map).map(([name, count]) => ({ name, count }));
  };

  const getRoleData = () => {
    const map = {};
    certificates.forEach(c => {
      const role = c.role || 'Participant';
      map[role] = (map[role] || 0) + 1;
    });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  };

  const getTimelineData = () => {
    const map = {};
    // Group by month/year
    certificates.forEach(c => {
      const d = new Date(c.created_at || Date.now());
      const key = d.toLocaleDateString(undefined, { year: 'numeric', month: 'short' });
      map[key] = (map[key] || 0) + 1;
    });
    return Object.entries(map).map(([date, count]) => ({ date, count }));
  };

  const PIE_COLORS = ['#3b82f6', '#10b981', '#06b6d4', '#f59e0b', '#ec4899', '#8b5cf6'];

  const filteredCerts = certificates.filter(c =>
    (c.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.event_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.cert_id || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getExpiryLabel = (expiryDate) => {
    if (!expiryDate) return { text: 'Active', class: 'badge-success' };
    const nowSeconds = Math.floor(Date.now() / 1000);
    if (nowSeconds > expiryDate) {
      return { text: 'Expired', class: 'badge-warning' };
    }
    return { text: 'Active', class: 'badge-success' };
  };

  return (
    <div className="dashboard-layout">
      {/* SIDEBAR NAVIGATION */}
      <aside className="dashboard-sidebar">
        <div className="sidebar-brand">
          <Award size={22} color="var(--primary)" />
          <span>CertiVerify <span style={{ fontSize: '10px', color: 'var(--primary)', border: '1px solid var(--primary)', padding: '2px 6px', borderRadius: '4px', marginLeft: '6px' }}>DS</span></span>
        </div>

        <nav className="sidebar-menu">
          <button className={`sidebar-item ${tab === 'overview' ? 'active' : ''}`} onClick={() => setTab('overview')}>
            <LayoutDashboard size={16} />
            <span className="sidebar-item-label">Overview</span>
          </button>
          <button className={`sidebar-item ${tab === 'generate' ? 'active' : ''}`} onClick={() => setTab('generate')}>
            <UploadCloud size={16} />
            <span className="sidebar-item-label">Generate</span>
          </button>
          <button className={`sidebar-item ${tab === 'certs' ? 'active' : ''}`} onClick={() => setTab('certs')}>
            <FileText size={16} />
            <span className="sidebar-item-label">Certificates</span>
          </button>
          <button className={`sidebar-item ${tab === 'analytics' ? 'active' : ''}`} onClick={() => setTab('analytics')}>
            <BarChart2 size={16} />
            <span className="sidebar-item-label">Analytics</span>
          </button>
          <button className={`sidebar-item ${tab === 'settings' ? 'active' : ''}`} onClick={() => setTab('settings')}>
            <Settings size={16} />
            <span className="sidebar-item-label">Settings</span>
          </button>
        </nav>

        <div style={{ marginTop: 'auto', paddingTop: '20px', borderTop: '1px solid var(--glass-border)' }}>
          <button className="sidebar-item" onClick={handleLogout} style={{ color: 'rgba(239, 68, 68, 0.7)', width: '100%' }}>
            <LogOut size={16} />
            <span className="sidebar-item-label">Logout</span>
          </button>
        </div>
      </aside>

      {/* MAIN CONTAINER */}
      <main className="dashboard-main">
        {/* Header section */}
        <div className="dashboard__header" style={{ marginBottom: '24px' }}>
          <div>
            <h1 className="dashboard__greeting" style={{ fontSize: '28px' }}>
              Hey, <span className="gradient-text">{user.name || 'Organiser'}</span> 👋
            </h1>
            <p className="dashboard__sub">System Role: Certified Event Issuer</p>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={fetchCertificates}>
            <RefreshCw size={14} className={certLoading ? 'spin-icon' : ''} /> Synchronise
          </button>
        </div>

        {/* OVERVIEW PANEL */}
        {tab === 'overview' && (
          <div className="dashboard__panel animate-fade-in">
            {/* Stats Summary Cards */}
            <div className="dashboard__stats" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
              <div className="ds-card glass-card" style={{ borderLeft: '4px solid var(--primary)' }}>
                <div className="ds-icon" style={{ background: 'rgba(59, 130, 246, 0.12)', color: 'var(--primary)' }}>
                  <Award size={20} />
                </div>
                <div>
                  <div className="ds-value">{stats.total}</div>
                  <div className="ds-label">Total Issued</div>
                </div>
              </div>
              <div className="ds-card glass-card" style={{ borderLeft: '4px solid var(--secondary)' }}>
                <div className="ds-icon" style={{ background: 'rgba(16, 185, 129, 0.12)', color: 'var(--secondary)' }}>
                  <Calendar size={20} />
                </div>
                <div>
                  <div className="ds-value">{stats.events}</div>
                  <div className="ds-label">Unique Events</div>
                </div>
              </div>
              <div className="ds-card glass-card" style={{ borderLeft: '4px solid var(--accent)' }}>
                <div className="ds-icon" style={{ background: 'rgba(6, 182, 212, 0.12)', color: 'var(--accent)' }}>
                  <Users size={20} />
                </div>
                <div>
                  <div className="ds-value">{stats.recent}</div>
                  <div className="ds-label">Issued Last 7 Days</div>
                </div>
              </div>
              <div className="ds-card glass-card" style={{ borderLeft: '4px solid var(--warning)' }}>
                <div className="ds-icon" style={{ background: 'rgba(245, 158, 11, 0.12)', color: 'var(--warning)' }}>
                  <AlertCircle size={20} />
                </div>
                <div>
                  <div className="ds-value">{stats.expired}</div>
                  <div className="ds-label">Expired Certs</div>
                </div>
              </div>
            </div>

            {/* Quick action section */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px', marginTop: '10px' }}>
              <div className="panel-section glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: '700' }}>Platform Health Status</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', background: 'rgba(255,255,255,0.02)', borderRadius: '6px' }}>
                    <span>In-memory Cache (sub-2s lookup)</span>
                    <span style={{ color: 'var(--secondary)', fontWeight: 'bold' }}>Active</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', background: 'rgba(255,255,255,0.02)', borderRadius: '6px' }}>
                    <span>ML-Optimised Duplicate Guard</span>
                    <span style={{ color: 'var(--secondary)', fontWeight: 'bold' }}>Deterministic Pandas clean</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', background: 'rgba(255,255,255,0.02)', borderRadius: '6px' }}>
                    <span>Cloud Storage Integration</span>
                    <span style={{ color: 'var(--secondary)', fontWeight: 'bold' }}>Firebase Firestore Online</span>
                  </div>
                </div>
              </div>
              <div className="panel-section glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '12px', justifyContent: 'center', alignItems: 'center', textAlign: 'center' }}>
                <Sparkles size={36} color="var(--primary)" className="animate-pulse" />
                <h4 style={{ fontWeight: '700' }}>Need to generate?</h4>
                <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>Upload a CSV list and configure event details.</p>
                <button className="btn btn-primary btn-sm w-full" onClick={() => setTab('generate')}>
                  Start Pipeline
                </button>
              </div>
            </div>
          </div>
        )}

        {/* GENERATE TAB */}
        {tab === 'generate' && (
          <div className="dashboard__panel animate-fade-in">
            <div className="panel-section glass-card">
              <h2 className="panel-title">1. Event Metadata Configuration</h2>
              <div className="event-form" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
                <div className="form-group">
                  <label className="label">Event Name</label>
                  <input
                    className="input-glass"
                    placeholder="e.g. Kaggle Datathon 2026"
                    value={eventDetails.event_name}
                    onChange={e => setEventDetails({ ...eventDetails, event_name: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="label">Event Date</label>
                  <input
                    type="date"
                    className="input-glass"
                    value={eventDetails.event_date}
                    onChange={e => setEventDetails({ ...eventDetails, event_date: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="label">Organisation</label>
                  <input
                    className="input-glass"
                    placeholder="e.g. VTU Data Science Club"
                    value={eventDetails.organisation}
                    onChange={e => setEventDetails({ ...eventDetails, organisation: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="label">Expiry Date (Optional)</label>
                  <input
                    type="date"
                    className="input-glass"
                    value={eventDetails.expiry_date}
                    onChange={e => setEventDetails({ ...eventDetails, expiry_date: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <div className="panel-section glass-card">
              <h2 className="panel-title">2. Upload CSV Data Source</h2>
              <p className="panel-sub">CSV fields must map directly to: <code>name</code>, <code>email</code>, <code>role</code></p>

              <div
                className={`drop-zone ${dragOver ? 'drag-over' : ''} ${csvFile ? 'has-file' : ''}`}
                onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileRef.current?.click()}
                style={{ padding: '30px' }}
              >
                <input ref={fileRef} type="file" accept=".csv" hidden onChange={e => handleFile(e.target.files[0])} />
                {csvFile ? (
                  <div className="drop-zone__file">
                    <FileText size={32} color="var(--primary)" />
                    <div>
                      <div className="dz-filename">{csvFile.name}</div>
                      <div className="dz-size">{(csvFile.size / 1024).toFixed(1)} KB</div>
                    </div>
                    <button className="btn-icon" onClick={e => { e.stopPropagation(); setCsvFile(null); setCsvPreview([]); }}>
                      <Trash2 size={15} />
                    </button>
                  </div>
                ) : (
                  <div className="drop-zone__empty">
                    <UploadCloud size={32} color="rgba(255,255,255,0.4)" />
                    <p>Drag CSV file here or <span className="dz-browse">browse files</span></p>
                  </div>
                )}
              </div>

              {csvPreview.headers && csvPreview.headers.length > 0 && (
                <div className="csv-preview">
                  <p className="preview-label">Data Preview (Max 5 rows)</p>
                  <div className="table-wrapper">
                    <table className="preview-table">
                      <thead>
                        <tr>{csvPreview.headers.map((h, i) => <th key={i}>{h.trim()}</th>)}</tr>
                      </thead>
                      <tbody>
                        {csvPreview.rows.map((row, i) => (
                          <tr key={i}>{row.map((cell, j) => <td key={j}>{cell.trim()}</td>)}</tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {uploadStatus === 'error' && (
                <div className="alert alert-error"><AlertCircle size={16} /> {uploadMsg}</div>
              )}
              {uploadStatus === 'success' && (
                <div className="alert alert-success"><CheckCircle size={16} /> {uploadMsg}</div>
              )}

              <div className="panel-actions">
                <button
                  className="btn btn-secondary"
                  onClick={handleUploadCSV}
                  disabled={!csvFile || uploadStatus === 'loading'}
                >
                  {uploadStatus === 'loading'
                    ? <><span className="spinner-dark" /> Uploading...</>
                    : <><UploadCloud size={16} /> Pre-validate & Parse</>}
                </button>

                {uploadStatus === 'success' && (
                  <button
                    className="btn btn-primary"
                    onClick={handleGenerate}
                    disabled={genStatus === 'loading'}
                  >
                    {genStatus === 'loading'
                      ? <><span className="spinner" /> Executing Pipeline...</>
                      : <><Play size={16} /> Execute Certificate Generation</>}
                  </button>
                )}
              </div>

              {genStatus === 'error' && (
                <div className="alert alert-error"><AlertCircle size={16} /> {genMsg}</div>
              )}
              {genStatus === 'success' && (
                <div className="alert alert-success"><CheckCircle size={16} /> {genMsg}</div>
              )}
            </div>
          </div>
        )}

        {/* CERTIFICATES REGISTRY TAB */}
        {tab === 'certs' && (
          <div className="dashboard__panel animate-fade-in">
            <div className="panel-section glass-card">
              <div className="certs-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <h2 className="panel-title" style={{ margin: 0 }}>Certificate Records Database</h2>
                  <span className="badge badge-primary">{filteredCerts.length} / {certificates.length} records</span>
                </div>
                <button className="btn btn-secondary btn-sm" onClick={exportToCSV} disabled={certificates.length === 0}>
                  <FileSpreadsheet size={14} /> Export CSV
                </button>
              </div>

              {/* Search Bar */}
              <div style={{ marginBottom: '20px' }}>
                <div className="verify__input-wrapper" style={{ margin: 0 }}>
                  <Search size={16} className="input-icon" />
                  <input
                    type="text"
                    className="input-glass input-with-icon"
                    placeholder="Query by ID, recipient name, event name or email..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>

              {certLoading ? (
                <div className="loading-state">
                  <div className="loading-spinner" /> Loading active data registries...
                </div>
              ) : filteredCerts.length === 0 ? (
                <div className="empty-state">
                  <Database size={48} style={{ opacity: 0.3, marginBottom: '12px' }} />
                  <p>No records matched search or no certificates have been issued.</p>
                </div>
              ) : (
                <div className="table-wrapper">
                  <table className="certs-table">
                    <thead>
                      <tr>
                        <th>Recipient Details</th>
                        <th>Event Target</th>
                        <th>Issuing Org</th>
                        <th>Cert ID</th>
                        <th>Issued Date</th>
                        <th>Security Status</th>
                        <th style={{ textAlign: 'right' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredCerts.map((cert, i) => {
                        const statusObj = getExpiryLabel(cert.expiry_date);
                        return (
                          <tr key={i}>
                            <td>
                              <div className="cert-name">{cert.name}</div>
                              <div className="cert-email" style={{ fontSize: '11px' }}>{cert.email}</div>
                            </td>
                            <td>
                              {cert.event_name}
                              <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', marginTop: '2px' }}>
                                Role: {cert.role}
                              </div>
                            </td>
                            <td>{cert.organisation || '—'}</td>
                            <td><code className="cert-id" style={{ fontSize: '11px' }}>{cert.cert_id}</code></td>
                            <td>{new Date(cert.created_at).toLocaleDateString()}</td>
                            <td>
                              <span className={`badge ${statusObj.class}`} style={{ padding: '2px 8px', fontSize: '10px' }}>
                                {statusObj.text}
                              </span>
                            </td>
                            <td style={{ textAlign: 'right' }}>
                              <div className="cert-actions" style={{ justifyContent: 'flex-end' }}>
                                <button
                                  className="btn-icon"
                                  title="Open Preview Portal"
                                  onClick={() => navigate(`/certificate/${cert.cert_id}`)}
                                >
                                  <Eye size={14} />
                                </button>
                                <a
                                  className="btn-icon"
                                  title="Download Original PDF"
                                  href={`${import.meta.env.VITE_API_BASE_URL}/certificates/download/${cert.cert_id}`}
                                  target="_blank"
                                  rel="noreferrer"
                                >
                                  <Download size={14} />
                                </a>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ANALYTICS TAB */}
        {tab === 'analytics' && (
          <div className="dashboard__panel animate-fade-in">
            {/* Visualisations Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '20px' }}>
              
              {/* Event Distribution Bar Chart */}
              <div className="panel-section glass-card" style={{ height: '350px', display: 'flex', flexDirection: 'column' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '14px' }}>Certificates Issued per Event</h3>
                {certificates.length === 0 ? (
                  <div style={{ margin: 'auto', color: 'rgba(255,255,255,0.3)' }}>No data registry available</div>
                ) : (
                  <div style={{ flexGrow: 1, width: '100%', height: '90%' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={getEventData()} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                        <XAxis dataKey="name" stroke="rgba(255,255,255,0.5)" style={{ fontSize: '11px' }} />
                        <YAxis stroke="rgba(255,255,255,0.5)" style={{ fontSize: '11px' }} />
                        <Tooltip contentStyle={{ background: '#080b14', border: '1px solid var(--glass-border)', color: 'white' }} />
                        <Bar dataKey="count" fill="var(--primary)" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>

              {/* Roles Distribution Pie Chart */}
              <div className="panel-section glass-card" style={{ height: '350px', display: 'flex', flexDirection: 'column' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '14px' }}>Recipient Role Breakdown</h3>
                {certificates.length === 0 ? (
                  <div style={{ margin: 'auto', color: 'rgba(255,255,255,0.3)' }}>No data registry available</div>
                ) : (
                  <div style={{ flexGrow: 1, width: '100%', height: '90%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ width: '60%', height: '100%' }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={getRoleData()}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                          >
                            {getRoleData().map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip contentStyle={{ background: '#080b14', border: '1px solid var(--glass-border)', color: 'white' }} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    {/* Legend */}
                    <div style={{ width: '40%', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px' }}>
                      {getRoleData().map((entry, index) => (
                        <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: PIE_COLORS[index % PIE_COLORS.length] }} />
                          <span style={{ color: 'rgba(255,255,255,0.7)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                            {entry.name}: {entry.value}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Weekly Timeline Line Chart */}
              <div className="panel-section glass-card" style={{ height: '350px', display: 'flex', flexDirection: 'column', gridColumn: '1 / -1' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '14px' }}>Certificates Registry Trend Over Time</h3>
                {certificates.length === 0 ? (
                  <div style={{ margin: 'auto', color: 'rgba(255,255,255,0.3)' }}>No data registry available</div>
                ) : (
                  <div style={{ flexGrow: 1, width: '100%', height: '90%' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={getTimelineData()} margin={{ top: 10, right: 20, left: -20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                        <XAxis dataKey="date" stroke="rgba(255,255,255,0.5)" style={{ fontSize: '11px' }} />
                        <YAxis stroke="rgba(255,255,255,0.5)" style={{ fontSize: '11px' }} />
                        <Tooltip contentStyle={{ background: '#080b14', border: '1px solid var(--glass-border)', color: 'white' }} />
                        <Line type="monotone" dataKey="count" stroke="var(--primary)" strokeWidth={3} dot={{ fill: 'var(--primary-light)', r: 4 }} activeDot={{ r: 6 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            </div>

            {/* Summary statistics */}
            <div className="panel-section glass-card" style={{ marginTop: '20px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '14px' }}>Summary Analytical Insights</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '8px' }}>
                  <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>Avg Recipient Count / Event</div>
                  <div style={{ fontSize: '24px', fontWeight: '800', marginTop: '6px' }}>
                    {stats.events > 0 ? (stats.total / stats.events).toFixed(1) : 0}
                  </div>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '8px' }}>
                  <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>Active Registry Health</div>
                  <div style={{ fontSize: '24px', fontWeight: '800', marginTop: '6px', color: 'var(--secondary)' }}>
                    {stats.total > 0 ? ((stats.total - stats.expired) / stats.total * 100).toFixed(0) : 0}% Active
                  </div>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '8px' }}>
                  <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>Unique Event Hosts</div>
                  <div style={{ fontSize: '24px', fontWeight: '800', marginTop: '6px' }}>
                    {new Set(certificates.map(c => c.organisation || 'default')).size}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SETTINGS PANEL */}
        {tab === 'settings' && (
          <div className="dashboard__panel animate-fade-in">
            <div className="panel-section glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <h2 className="panel-title" style={{ margin: 0 }}>Account Settings & Profile</h2>
              
              <div className="event-form" style={{ gridTemplateColumns: '1fr', gap: '16px', maxWidth: '500px' }}>
                <div className="form-group">
                  <label className="label">Registered Email</label>
                  <input className="input-glass" value={user.email || ''} disabled style={{ opacity: 0.6 }} />
                </div>
                <div className="form-group">
                  <label className="label">Issuer Name</label>
                  <input className="input-glass" value={user.name || ''} disabled style={{ opacity: 0.6 }} />
                </div>
                <div className="form-group">
                  <label className="label">Firestore Namespace</label>
                  <code style={{ background: 'rgba(255,255,255,0.05)', padding: '10px', borderRadius: '6px', display: 'block', fontSize: '12px' }}>
                    /certificates
                  </code>
                </div>
              </div>

              <div style={{ marginTop: '20px', display: 'flex', gap: '12px' }}>
                <button className="btn btn-secondary" onClick={handleLogout}>
                  <LogOut size={16} /> Sign Out Account
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}