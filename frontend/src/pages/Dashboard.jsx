import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  UploadCloud, FileText, Play, Download, Trash2,
  CheckCircle, AlertCircle, Clock, BarChart2,
  Users, Award, Calendar, ChevronRight, RefreshCw, Eye
} from 'lucide-react';
import api from '../utils/api';
import './Dashboard.css';

export default function Dashboard() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('cv_user') || '{}');
  const fileRef = useRef(null);

  const [tab, setTab] = useState('upload');
  const [csvFile, setCsvFile] = useState(null);
  const [csvPreview, setCsvPreview] = useState([]);
  const [eventDetails, setEventDetails] = useState({ event_name: '', event_date: '', issuer: '' });
  const [dragOver, setDragOver] = useState(false);
  const [uploadStatus, setUploadStatus] = useState(null); // null | 'loading' | 'success' | 'error'
  const [uploadMsg, setUploadMsg] = useState('');
  const [uploadId, setUploadId] = useState(null);
  const [genStatus, setGenStatus] = useState(null);
  const [genMsg, setGenMsg] = useState('');
  const [certificates, setCertificates] = useState([]);
  const [certLoading, setCertLoading] = useState(false);
  const [stats, setStats] = useState({ total: 0, events: 0, recent: 0 });

  useEffect(() => {
    if (!localStorage.getItem('cv_token')) navigate('/login');
    fetchCertificates();
  }, []);

  const fetchCertificates = async () => {
    setCertLoading(true);
    try {
      const res = await api.get('/certificates/list');
      const list = res.data.certificates || [];
      setCertificates(list);
      const events = new Set(list.map(c => c.event_name)).size;
      setStats({ total: list.length, events, recent: list.filter(c => {
        const d = new Date(c.created_at);
        return (Date.now() - d) < 7 * 24 * 3600 * 1000;
      }).length });
    } catch {
      setCertificates([]);
    } finally {
      setCertLoading(false);
    }
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
    // Parse preview
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
    Object.entries(eventDetails).forEach(([k, v]) => formData.append(k, v));
    try {
      const res = await api.post('/certificates/upload-csv', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setUploadId(res.data.upload_id);
      setUploadStatus('success');
      setUploadMsg(`✓ ${res.data.total_rows} recipients loaded. ${res.data.duplicates || 0} duplicates skipped.`);
      
      // LLM Duplicate Check
      try {
        const llmRes = await api.post('/certificates/check-duplicates', {
          participants: res.data.participants
        });
        if (llmRes.data.duplicates.length > 0 || llmRes.data.suspicious.length > 0) {
          setUploadMsg(prev => prev + ` ⚠️ LLM Check: ${llmRes.data.summary}`);
        } else {
          setUploadMsg(prev => prev + ` ✅ LLM Check: ${llmRes.data.summary}`);
        }
      } catch {
        console.log('LLM check skipped');
      }

    } catch (err) {
      setUploadStatus('error');
      setUploadMsg(err.response?.data?.message || 'Upload failed. Check your CSV format.');
    }
};

  const handleGenerate = async () => {
    setGenStatus('loading');
    setGenMsg('');
    try {
      const user = JSON.parse(localStorage.getItem('cv_user') || '{}');  // ← ADD THIS
      const res = await api.post('/certificates/generate', {
        upload_id: uploadId,
        ...eventDetails,
        issuer: user.email,  // ← ADD THIS
      });
      setGenStatus('success');
      setGenMsg(`🎉 ${res.data.count} certificates generated successfully!`);
      fetchCertificates();
      setTimeout(() => setTab('certs'), 1500);
    } catch (err) {
      setGenStatus('error');
      setGenMsg(err.response?.data?.message || 'Generation failed.');
    }
};

  return (
    <div className="dashboard__wrapper">
      {/* Header */}
      <div className="dashboard__header">
        <div>
          <h1 className="dashboard__greeting">
            Hey, <span className="gradient-text">{user.name || 'Organiser'}</span> 👋
          </h1>
          <p className="dashboard__sub">Manage your certificates and events</p>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={fetchCertificates}>
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="dashboard__stats">
        <div className="ds-card glass-card">
          <div className="ds-icon" style={{ background: 'rgba(99,102,241,0.15)', color: '#6366f1' }}>
            <Award size={20} />
          </div>
          <div>
            <div className="ds-value">{stats.total}</div>
            <div className="ds-label">Total Certificates</div>
          </div>
        </div>
        <div className="ds-card glass-card">
          <div className="ds-icon" style={{ background: 'rgba(6,182,212,0.15)', color: '#06b6d4' }}>
            <Calendar size={20} />
          </div>
          <div>
            <div className="ds-value">{stats.events}</div>
            <div className="ds-label">Events</div>
          </div>
        </div>
        <div className="ds-card glass-card">
          <div className="ds-icon" style={{ background: 'rgba(16,185,129,0.15)', color: '#10b981' }}>
            <Users size={20} />
          </div>
          <div>
            <div className="ds-value">{stats.recent}</div>
            <div className="ds-label">Issued This Week</div>
          </div>
        </div>
        <div className="ds-card glass-card">
          <div className="ds-icon" style={{ background: 'rgba(240,171,252,0.15)', color: '#c084fc' }}>
            <BarChart2 size={20} />
          </div>
          <div>
            <div className="ds-value">100%</div>
            <div className="ds-label">Verification Rate</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="dashboard__tabs glass-card">
        {[
          { id: 'upload', label: 'Upload & Generate', icon: <UploadCloud size={16} /> },
          { id: 'certs', label: 'Certificates', icon: <FileText size={16} /> },
        ].map(t => (
          <button
            key={t.id}
            className={`tab-btn ${tab === t.id ? 'active' : ''}`}
            onClick={() => setTab(t.id)}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* Upload Tab */}
      {tab === 'upload' && (
        <div className="dashboard__panel animate-fade-in">
          {/* Event details */}
          <div className="panel-section glass-card">
            <h2 className="panel-title">Event Details</h2>
            <div className="event-form">
              <div className="form-group">
                <label className="label">Event Name</label>
                <input
                  className="input-glass"
                  placeholder="e.g. React Bootcamp 2025"
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
                <label className="label">Issued By</label>
                <input
                  className="input-glass"
                  placeholder="e.g. TechConf India"
                  value={eventDetails.issuer}
                  onChange={e => setEventDetails({ ...eventDetails, issuer: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* CSV Drop Zone */}
          <div className="panel-section glass-card">
            <h2 className="panel-title">Upload CSV</h2>
            <p className="panel-sub">Required columns: <code>name</code>, <code>email</code> (optional: <code>course</code>, <code>grade</code>)</p>

            <div
              className={`drop-zone ${dragOver ? 'drag-over' : ''} ${csvFile ? 'has-file' : ''}`}
              onDragOver={e => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileRef.current?.click()}
            >
              <input ref={fileRef} type="file" accept=".csv" hidden onChange={e => handleFile(e.target.files[0])} />
              {csvFile ? (
                <div className="drop-zone__file">
                  <FileText size={32} color="#6366f1" />
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
                  <UploadCloud size={40} color="rgba(255,255,255,0.4)" />
                  <p>Drag & drop your CSV here, or <span className="dz-browse">click to browse</span></p>
                  <span className="dz-hint">.csv files only</span>
                </div>
              )}
            </div>

            {/* CSV Preview */}
            {csvPreview.headers && (
              <div className="csv-preview">
                <p className="preview-label">Preview (first 5 rows)</p>
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
                id="upload-csv-btn"
                className="btn btn-secondary"
                onClick={handleUploadCSV}
                disabled={!csvFile || uploadStatus === 'loading'}
              >
                {uploadStatus === 'loading' ? <><span className="spinner-dark" /> Uploading...</> : <><UploadCloud size={16} /> Upload CSV</>}
              </button>

              {uploadStatus === 'success' && (
                <button
                  id="generate-btn"
                  className="btn btn-primary"
                  onClick={handleGenerate}
                  disabled={genStatus === 'loading'}
                >
                  {genStatus === 'loading' ? <><span className="spinner" /> Generating...</> : <><Play size={16} /> Generate Certificates</>}
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

      {/* Certificates Tab */}
      {tab === 'certs' && (
        <div className="dashboard__panel animate-fade-in">
          <div className="panel-section glass-card">
            <div className="certs-header">
              <h2 className="panel-title">All Certificates</h2>
              <span className="badge badge-primary">{certificates.length} total</span>
            </div>

            {certLoading ? (
              <div className="loading-state">
                <div className="loading-spinner" />
                Loading certificates...
              </div>
            ) : certificates.length === 0 ? (
              <div className="empty-state">
                <Award size={48} color="rgba(255,255,255,0.2)" />
                <p>No certificates yet. Upload a CSV to get started.</p>
                <button className="btn btn-primary btn-sm" onClick={() => setTab('upload')}>
                  <UploadCloud size={14} /> Upload Now
                </button>
              </div>
            ) : (
              <div className="table-wrapper">
                <table className="certs-table">
                  <thead>
                    <tr>
                      <th>Recipient</th>
                      <th>Event</th>
                      <th>Cert ID</th>
                      <th>Issued</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {certificates.map((cert, i) => (
                      <tr key={i}>
                        <td>
                          <div className="cert-name">{cert.recipient_name}</div>
                          <div className="cert-email">{cert.email}</div>
                        </td>
                        <td>{cert.event_name}</td>
                        <td><code className="cert-id">{cert.cert_id}</code></td>
                        <td>{new Date(cert.created_at).toLocaleDateString()}</td>
                        <td><span className="badge badge-success"><CheckCircle size={11} /> Valid</span></td>
                        <td>
                          <div className="cert-actions">
                            <button
                              className="btn-icon"
                              title="View"
                              onClick={() => navigate(`/certificate/${cert.cert_id}`)}
                            >
                              <Eye size={14} />
                            </button>
                            <a
                              className="btn-icon"
                              title="Download"
                              href={cert.pdf_url}
                              target="_blank"
                              rel="noreferrer"
                            >
                              <Download size={14} />
                            </a>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
