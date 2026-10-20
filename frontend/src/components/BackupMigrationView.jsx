import React, { useState, useEffect } from 'react';
import { 
  Database, 
  Upload, 
  Download, 
  FileText, 
  Calendar, 
  Mail, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  HardDrive, 
  RefreshCw, 
  FileSpreadsheet, 
  Code2, 
  ExternalLink,
  ShieldAlert,
  Play,
  Save,
  Trash2
} from 'lucide-react';
import { api, getApiUrl } from '../services/api';

export default function BackupMigrationView({ currency = '₹', onRefresh }) {
  const [activeTab, setActiveTab] = useState('import');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  // Import State
  const [file, setFile] = useState(null);
  const [targetDate, setTargetDate] = useState('2026-06-30');
  const [applyTargetDate, setApplyTargetDate] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [importing, setImporting] = useState(false);

  // Settings State
  const [settings, setSettings] = useState({
    backup_email: 'ajojohn.dev@gmail.com',
    cron_schedule: '0 23 * * *',
    backup_format: 'XML',
    google_drive_folder: 'https://drive.google.com/drive/folders/JR_Marbles_Backups',
    google_drive_webhook: '',
    auto_clear_after_backup: false,
    clear_before_date: '',
    smtp_host: 'smtp.gmail.com',
    smtp_port: 587,
    smtp_user: '',
    smtp_pass: ''
  });

  // Logs State
  const [logs, setLogs] = useState([]);

  const fetchSettingsAndLogs = () => {
    api.getBackupSettings().then(s => {
      if (s) setSettings(s);
    }).catch(console.error);

    api.getBackupLogs().then(l => {
      if (l) setLogs(l);
    }).catch(console.error);
  };

  useEffect(() => {
    fetchSettingsAndLogs();
  }, []);

  const handleFileChange = async (e) => {
    const selected = e.target.files[0];
    if (!selected) return;
    setFile(selected);
    setError(null);
    setMessage(null);
    setPreviewData(null);

    // Auto Preview
    const fd = new FormData();
    fd.append('file', selected);
    setLoading(true);
    try {
      const res = await api.importPreview(fd);
      setPreviewData(res);
    } catch (err) {
      setError(err.message || 'Failed to parse file preview.');
    } finally {
      setLoading(false);
    }
  };

  const handleImportSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setError('Please select an XML, Excel, or SQL file to import.');
      return;
    }

    setImporting(true);
    setError(null);
    setMessage(null);

    const fd = new FormData();
    fd.append('file', file);
    if (applyTargetDate && targetDate) {
      fd.append('target_date', targetDate);
      fd.append('apply_target_date', 'true');
    }

    try {
      const res = await api.importData(fd);
      setMessage(res.message);
      setFile(null);
      setPreviewData(null);
      if (onRefresh) onRefresh();
    } catch (err) {
      setError(err.message || 'Data import failed.');
    } finally {
      setImporting(false);
    }
  };

  const handleSettingsSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      await api.updateBackupSettings(settings);
      setMessage('Backup & Cron configuration saved successfully!');
      fetchSettingsAndLogs();
    } catch (err) {
      setError(err.message || 'Failed to update backup settings.');
    } finally {
      setLoading(false);
    }
  };

  const handleTriggerBackup = async () => {
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const res = await api.runDailyBackup();
      setMessage(`Daily backup generated! File: ${res.file_name} (${res.file_size_kb} KB) sent to ${res.recipient}`);
      fetchSettingsAndLogs();
      if (onRefresh) onRefresh();
    } catch (err) {
      setError(err.message || 'Failed to execute daily backup.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="view-container">
      {/* View Header */}
      <div className="view-header">
        <div>
          <h2>Data Import, Daily Cron & Cloud Backup Portal</h2>
          <p>Import previous date records (XML, Excel, SQL), manage daily automated backups to <strong>ajojohn.dev@gmail.com</strong> & Google Drive, and download official PDF documentation.</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <a 
            href={getApiUrl("/backup/documentation/pdf")} 
            target="_blank" 
            rel="noreferrer"
            className="btn btn-secondary btn-sm"
            style={{ textDecoration: 'none' }}
          >
            <FileText size={15} />
            <span>Download System PDF Manual</span>
          </a>
          <button 
            className="btn btn-primary btn-sm"
            onClick={handleTriggerBackup}
            disabled={loading}
          >
            <Play size={14} />
            <span>Run Daily Backup Now</span>
          </button>
        </div>
      </div>

      {/* Alert Messages */}
      {message && (
        <div className="card" style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', padding: '1rem', marginBottom: '1.25rem', color: '#34d399', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <CheckCircle2 size={18} />
          <div>{message}</div>
        </div>
      )}

      {error && (
        <div className="card" style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '1rem', marginBottom: '1.25rem', color: '#f87171', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <AlertCircle size={18} />
          <div>{error}</div>
        </div>
      )}

      {/* Segment Navigation */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.5rem' }}>
        <button 
          className={`btn btn-sm ${activeTab === 'import' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('import')}
        >
          <Upload size={14} />
          <span>Import Previous Date Data (XML/Excel/SQL)</span>
        </button>
        <button 
          className={`btn btn-sm ${activeTab === 'cron' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('cron')}
        >
          <Clock size={14} />
          <span>Automated Daily Cron & Google Drive</span>
        </button>
        <button 
          className={`btn btn-sm ${activeTab === 'export' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('export')}
        >
          <Download size={14} />
          <span>Manual Download & Export</span>
        </button>
        <button 
          className={`btn btn-sm ${activeTab === 'logs' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('logs')}
        >
          <HardDrive size={14} />
          <span>Backup History & Logs</span>
        </button>
      </div>

      {/* TAB 1: IMPORT PREVIOUS DATE DATA */}
      {activeTab === 'import' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '1.5rem' }}>
          <div className="card">
            <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Upload size={18} className="text-primary" />
              Import Data from XML, Excel (.xlsx), CSV or SQL
            </h3>
            <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
              Upload invoices, products, customer contacts, or daybook ledger entries. You can retain the original dates in the file or override them with a specific previous date.
            </p>

            <form onSubmit={handleImportSubmit}>
              <div className="form-group">
                <label className="form-label">Select Data File (.xml, .xlsx, .csv, .sql) *</label>
                <input 
                  type="file" 
                  accept=".xml,.xlsx,.xls,.csv,.sql"
                  className="form-input" 
                  style={{ padding: '0.6rem' }}
                  onChange={handleFileChange}
                  required
                />
              </div>

              <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '1rem', margin: '1rem 0' }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--text-main)' }}>
                  Date Handling for Previous Records
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                  <label className="checkbox-label">
                    <input 
                      type="checkbox" 
                      checked={applyTargetDate} 
                      onChange={(e) => setApplyTargetDate(e.target.checked)} 
                    />
                    <span>Override transaction dates with this target previous date:</span>
                  </label>
                  {applyTargetDate && (
                    <div style={{ maxWidth: '240px', marginLeft: '24px' }}>
                      <input 
                        type="date" 
                        className="form-input" 
                        value={targetDate} 
                        onChange={(e) => setTargetDate(e.target.value)} 
                        required={applyTargetDate}
                      />
                    </div>
                  )}
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)', marginLeft: '24px' }}>
                    {applyTargetDate ? 'All imported sales and ledger records will be assigned to this date.' : 'Original dates from the uploaded file will be preserved.'}
                  </span>
                </div>
              </div>

              {/* Preview Box */}
              {previewData && (
                <div style={{ background: 'rgba(2, 132, 199, 0.08)', border: '1px solid rgba(2, 132, 199, 0.25)', borderRadius: 'var(--radius-md)', padding: '1rem', marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <strong style={{ fontSize: '0.9rem', color: '#38bdf8' }}>File Inspection Summary ({previewData.format})</strong>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{previewData.filename}</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', fontSize: '0.82rem', marginBottom: '0.8rem' }}>
                    <div style={{ background: 'rgba(0,0,0,0.2)', padding: '6px 10px', borderRadius: '4px' }}>
                      Sales Invoices: <strong>{previewData.sales_count}</strong>
                    </div>
                    <div style={{ background: 'rgba(0,0,0,0.2)', padding: '6px 10px', borderRadius: '4px' }}>
                      Products / Stone: <strong>{previewData.products_count}</strong>
                    </div>
                    <div style={{ background: 'rgba(0,0,0,0.2)', padding: '6px 10px', borderRadius: '4px' }}>
                      Contacts: <strong>{previewData.contacts_count}</strong>
                    </div>
                  </div>

                  {previewData.sample_records && previewData.sample_records.length > 0 && (
                    <div>
                      <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '4px' }}>Sample Invoices in File:</div>
                      <div style={{ fontSize: '0.78rem', fontFamily: 'var(--font-mono)', color: 'var(--text-main)', background: 'rgba(0,0,0,0.3)', padding: '6px 8px', borderRadius: '4px' }}>
                        {previewData.sample_records.map((r, i) => (
                          <div key={i}>{r.bill_no} | {r.date} | {r.customer || 'Walk-in'} | Total: {r.total}</div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              <button 
                type="submit" 
                className="btn btn-primary" 
                style={{ width: '100%', padding: '0.75rem', justifyContent: 'center' }}
                disabled={!file || importing}
              >
                {importing ? 'Processing Data Import...' : 'Confirm & Commit Import to Database'}
              </button>
            </form>
          </div>

          {/* Sample Templates Card */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="card">
              <h4 style={{ fontSize: '0.95rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <FileSpreadsheet size={16} className="text-primary" />
                Sample Import Templates
              </h4>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                Download ready-to-use sample templates with the exact column format required for JR Marbles & Granites.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <a 
                  href={getApiUrl("/backup/sample/xml")} 
                  download="sample_jr_marbles.xml"
                  className="btn btn-secondary btn-sm"
                  style={{ justifyContent: 'space-between', textDecoration: 'none' }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Code2 size={14} /> XML Template (.xml)
                  </span>
                  <Download size={14} />
                </a>

                <a 
                  href={getApiUrl("/backup/sample/excel")} 
                  download="sample_jr_marbles.xlsx"
                  className="btn btn-secondary btn-sm"
                  style={{ justifyContent: 'space-between', textDecoration: 'none' }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <FileSpreadsheet size={14} /> Excel Template (.xlsx)
                  </span>
                  <Download size={14} />
                </a>

                <a 
                  href={getApiUrl("/backup/sample/sql")} 
                  download="sample_jr_marbles.sql"
                  className="btn btn-secondary btn-sm"
                  style={{ justifyContent: 'space-between', textDecoration: 'none' }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Database size={14} /> SQL Dump Template (.sql)
                  </span>
                  <Download size={14} />
                </a>
              </div>
            </div>

            <div className="card" style={{ background: 'rgba(255,255,255,0.02)' }}>
              <h4 style={{ fontSize: '0.85rem', marginBottom: '0.4rem', color: 'var(--text-main)' }}>Import Guidelines:</h4>
              <ul style={{ fontSize: '0.78rem', color: 'var(--text-muted)', paddingLeft: '1.2rem', lineHeight: 1.6 }}>
                <li>Products will auto-link using standard HSN <strong>6802</strong> (Granite/Marble).</li>
                <li>Invoice numbers with format <code>JR26-27 XXX</code> will be recorded seamlessly.</li>
                <li>Existing duplicate bill numbers are automatically skipped to prevent data collisions.</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: AUTOMATED DAILY CRON & GOOGLE DRIVE */}
      {activeTab === 'cron' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: '1.5rem' }}>
          <div className="card">
            <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Clock size={18} className="text-primary" />
              Dynamic Daily Backup & Cron Settings
            </h3>
            <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
              Configure automatic daily backups sent to your email and synced to your Google Drive folder in XML format.
            </p>

            <form onSubmit={handleSettingsSave}>
              <div className="form-group">
                <label className="form-label">Backup Recipient Email *</label>
                <div style={{ position: 'relative' }}>
                  <Mail size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input 
                    type="email" 
                    className="form-input font-mono" 
                    style={{ paddingLeft: '38px' }}
                    value={settings.backup_email || ''} 
                    onChange={(e) => setSettings({ ...settings, backup_email: e.target.value })}
                    required
                  />
                </div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '4px', display: 'block' }}>
                  Daily XML backup files and audit notifications will be dispatched to this address.
                </span>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Cron Schedule (Daily Timing)</label>
                  <input 
                    type="text" 
                    className="form-input font-mono" 
                    value={settings.cron_schedule || '0 23 * * *'} 
                    onChange={(e) => setSettings({ ...settings, cron_schedule: e.target.value })}
                  />
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>Default: 0 23 * * * (Every night at 11:00 PM)</span>
                </div>

                <div className="form-group">
                  <label className="form-label">Backup File Format</label>
                  <select 
                    className="form-select"
                    value={settings.backup_format || 'XML'}
                    onChange={(e) => setSettings({ ...settings, backup_format: e.target.value })}
                  >
                    <option value="XML">XML (.xml) — Recommended Standard</option>
                    <option value="Excel">Excel Spreadsheet (.xlsx)</option>
                    <option value="SQL">SQL Database Dump (.sql)</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Google Drive Folder / Webhook URL</label>
                <div style={{ position: 'relative' }}>
                  <HardDrive size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input 
                    type="text" 
                    className="form-input font-mono" 
                    style={{ paddingLeft: '38px' }}
                    placeholder="https://drive.google.com/drive/folders/..." 
                    value={settings.google_drive_folder || ''} 
                    onChange={(e) => setSettings({ ...settings, google_drive_folder: e.target.value })}
                  />
                </div>
              </div>

              {/* Auto Clear Previous Data Section */}
              <div style={{ background: 'rgba(239, 68, 68, 0.06)', border: '1px solid rgba(239, 68, 68, 0.25)', borderRadius: 'var(--radius-md)', padding: '1rem', margin: '1rem 0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#f87171', fontWeight: 600, fontSize: '0.88rem', marginBottom: '0.4rem' }}>
                  <ShieldAlert size={16} />
                  Automatic Data Archival & Cleanup After Backup
                </div>
                <label className="checkbox-label" style={{ marginBottom: '0.5rem' }}>
                  <input 
                    type="checkbox" 
                    checked={settings.auto_clear_after_backup || false} 
                    onChange={(e) => setSettings({ ...settings, auto_clear_after_backup: e.target.checked })}
                  />
                  <span>Clear transactions older than specified date after backup XML is secured</span>
                </label>
                {settings.auto_clear_after_backup && (
                  <div style={{ maxWidth: '240px', marginTop: '0.5rem' }}>
                    <label className="form-label" style={{ fontSize: '0.75rem' }}>Clear records on or before:</label>
                    <input 
                      type="date" 
                      className="form-input" 
                      value={settings.clear_before_date || ''} 
                      onChange={(e) => setSettings({ ...settings, clear_before_date: e.target.value })}
                    />
                  </div>
                )}
                <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', display: 'block', marginTop: '4px' }}>
                  Transactions are safely exported to XML before removal. Contacts and product catalogs are permanently retained.
                </span>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  <Save size={15} />
                  <span>Save Dynamic Settings</span>
                </button>
                <button type="button" className="btn btn-secondary" onClick={handleTriggerBackup} disabled={loading}>
                  <Play size={15} />
                  <span>Test Run Backup Now</span>
                </button>
              </div>
            </form>
          </div>

          {/* Linux Crontab Helper Box */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="card">
              <h4 style={{ fontSize: '0.92rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Clock size={16} className="text-primary" />
                Server Crontab Setup
              </h4>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.8rem' }}>
                To enable automatic execution on your Hostinger VPS or Linux server, add this line to your crontab (<code>crontab -e</code>):
              </p>
              <div style={{ background: '#0a0e17', padding: '10px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)', fontSize: '0.78rem', fontFamily: 'var(--font-mono)', color: '#38bdf8', wordBreak: 'break-all', lineHeight: 1.4 }}>
                0 23 * * * cd /var/www/html/billing-app/backend && ./venv/bin/python cron_backup.py &gt;&gt; /var/log/jr_backup.log 2&gt;&amp;1
              </div>
              <div style={{ marginTop: '0.8rem', fontSize: '0.78rem', color: 'var(--text-dim)' }}>
                This triggers every night at 11:00 PM, extracts the XML backup, sends it to <strong>{settings.backup_email}</strong>, and writes to log.
              </div>
            </div>

            <div className="card">
              <h4 style={{ fontSize: '0.92rem', marginBottom: '0.5rem', color: 'var(--text-main)' }}>Last Backup Status</h4>
              <div style={{ fontSize: '0.82rem', lineHeight: 1.6 }}>
                <div>Last Run: <strong>{settings.last_backup_at ? new Date(settings.last_backup_at).toLocaleString() : 'Never'}</strong></div>
                <div>Status: <span className="badge badge-paid">{settings.last_backup_status || 'Ready'}</span></div>
                <div>Last File: <code style={{ fontSize: '0.75rem' }}>{settings.last_backup_file || 'None'}</code></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: MANUAL EXPORT */}
      {activeTab === 'export' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem' }}>
          <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(2, 132, 199, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0284c7', marginBottom: '1rem' }}>
                <Code2 size={24} />
              </div>
              <h3 style={{ fontSize: '1.1rem', marginBottom: '0.4rem' }}>XML Full Database Export</h3>
              <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
                Standard structured XML format containing company metadata, all sales invoices with item details, stone stock catalog, and daybook ledger.
              </p>
            </div>
            <a 
              href={getApiUrl("/backup/export?format=xml")} 
              className="btn btn-primary"
              style={{ justifyContent: 'center', textDecoration: 'none' }}
            >
              <Download size={15} /> Download XML Backup
            </a>
          </div>

          <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981', marginBottom: '1rem' }}>
                <FileSpreadsheet size={24} />
              </div>
              <h3 style={{ fontSize: '1.1rem', marginBottom: '0.4rem' }}>Excel Spreadsheet (.xlsx)</h3>
              <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
                Formatted multi-sheet Excel workbook with styled headers for Sales Invoices, Stone Catalog Stock, and Customer / Contact directories.
              </p>
            </div>
            <a 
              href={getApiUrl("/backup/export?format=excel")} 
              className="btn btn-success"
              style={{ justifyContent: 'center', textDecoration: 'none' }}
            >
              <Download size={15} /> Download Excel Backup
            </a>
          </div>

          <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(245, 158, 11, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f59e0b', marginBottom: '1rem' }}>
                <Database size={24} />
              </div>
              <h3 style={{ fontSize: '1.1rem', marginBottom: '0.4rem' }}>SQL Database Dump (.sql)</h3>
              <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
                Direct SQL script with standard INSERT statements compatible with PostgreSQL / Supabase for immediate complete restoration.
              </p>
            </div>
            <a 
              href={getApiUrl("/backup/export?format=sql")} 
              className="btn btn-secondary"
              style={{ justifyContent: 'center', textDecoration: 'none' }}
            >
              <Download size={15} /> Download SQL Dump
            </a>
          </div>
        </div>
      )}

      {/* TAB 4: BACKUP LOGS */}
      {activeTab === 'logs' && (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1.1rem' }}>Automated Daily Backup Audit Trail</h3>
            <button className="btn btn-sm btn-secondary" onClick={fetchSettingsAndLogs}>
              <RefreshCw size={13} /> Refresh Logs
            </button>
          </div>

          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Type</th>
                  <th>File Name</th>
                  <th>Format</th>
                  <th>Size</th>
                  <th>Recipient</th>
                  <th>Cleared</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {logs && logs.length > 0 ? (
                  logs.map(l => (
                    <tr key={l.id}>
                      <td style={{ fontSize: '0.8rem' }}>{new Date(l.created_at).toLocaleString()}</td>
                      <td><strong>{l.backup_type}</strong></td>
                      <td className="font-mono" style={{ fontSize: '0.8rem' }}>{l.file_name}</td>
                      <td><span className="badge badge-paid">{l.file_format}</span></td>
                      <td className="font-mono">{roundKb(l.file_size_bytes)} KB</td>
                      <td style={{ fontSize: '0.8rem' }}>{l.sent_to_email}</td>
                      <td style={{ color: l.cleared_records_count > 0 ? 'var(--warning)' : 'inherit' }}>
                        {l.cleared_records_count || 0} records
                      </td>
                      <td>
                        <span className="badge badge-paid">{l.status}</span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="8" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                      No backup logs recorded yet. Click 'Run Daily Backup Now' to create your first backup.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
}

function roundKb(bytes) {
  return Math.round((Number(bytes) || 0) / 1024);
}
