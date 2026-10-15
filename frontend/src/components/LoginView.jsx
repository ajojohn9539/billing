import React, { useState } from 'react';
import { 
  User, 
  Lock, 
  LogIn, 
  Eye, 
  EyeOff, 
  ShieldCheck, 
  AlertCircle, 
  Building2,
  FileText,
  CreditCard,
  Truck,
  Layers
} from 'lucide-react';
import { api } from '../services/api';

export default function LoginView({ onLoginSuccess }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim()) {
      setError('Please enter your username or email.');
      return;
    }
    if (!password) {
      setError('Please enter your account password.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await api.login(username.trim(), password);
      if (res && res.user) {
        if (rememberMe) {
          localStorage.setItem('billing_user', JSON.stringify(res.user));
          if (res.token) localStorage.setItem('billing_token', res.token);
        } else {
          sessionStorage.setItem('billing_user', JSON.stringify(res.user));
          if (res.token) sessionStorage.setItem('billing_token', res.token);
        }
        onLoginSuccess(res.user, res.token);
      } else {
        setError('Authentication failed. Please verify credentials.');
      }
    } catch (err) {
      setError(err.message || 'Invalid username or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page-container">
      {/* Background Decorative Mesh */}
      <div className="login-bg-mesh"></div>

      <div className="login-content-box">
        {/* Left Side: Brand & ERP Information */}
        <div className="login-brand-hero">
          <div className="brand-hero-badge">
            <span className="live-dot"></span>
            <span>Enterprise ERP 2.0 • Live</span>
          </div>

          <div className="brand-hero-logo" style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '8px' }}>
            <img 
              src="/logo.png" 
              alt="Billora Logo" 
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                objectFit: 'cover',
                border: '2.5px solid rgba(255, 255, 255, 0.4)',
                boxShadow: '0 0 20px rgba(2, 132, 199, 0.45)'
              }}
            />
            <div>
              <h1 className="hero-brand-title" style={{ fontSize: '2.4rem', fontWeight: 900, letterSpacing: '-0.02em', margin: 0, color: '#ffffff' }}>
                BILLORA
              </h1>
              <p style={{ margin: 0, fontSize: '0.92rem', color: '#bae6fd', fontWeight: 600 }}>
                Smart Billing & Stone Inventory ERP
              </p>
            </div>
          </div>

          <p className="hero-brand-desc">
            Next-generation enterprise management platform for marble, granite, quartz slabs, 
            and dimensional stone inventory. Features integrated GST tax invoicing, real-time yard stock tracking, 
            and automated daily cash/bank reconciliation.
          </p>

          <div className="portal-cards-grid">
            <div className="portal-card-item">
              <Building2 size={18} className="portal-card-icon" />
              <div>
                <span className="card-lbl">Merchant Enterprise</span>
                <span className="card-val">Billora Marbles & Granites</span>
              </div>
            </div>

            <div className="portal-card-item">
              <CreditCard size={18} className="portal-card-icon" />
              <div>
                <span className="card-lbl">GSTIN Registration</span>
                <span className="card-val">32FGZPR5431L1ZL</span>
              </div>
            </div>

            <div className="portal-card-item">
              <Layers size={18} className="portal-card-icon" />
              <div>
                <span className="card-lbl">Stone Yard Location</span>
                <span className="card-val">Chengamanadu, Kottarakkara, Kerala</span>
              </div>
            </div>
          </div>

          <div className="portal-features-list">
            <div className="feature-pill"><FileText size={14} /> GST Tax Invoices (BIL26-27)</div>
            <div className="feature-pill"><Truck size={14} /> Vehicle & Supply Tracking</div>
            <div className="feature-pill"><ShieldCheck size={14} /> HSN 6802 Stone Catalog</div>
          </div>
        </div>

        {/* Right Side: Secure Production Login Card */}
        <div className="login-card">
          <div className="login-header">
            <div className="login-logo-glow">
              <img 
                src="/logo.png" 
                alt="Billora Logo" 
                style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '50%',
                  objectFit: 'cover',
                  border: '2px solid rgba(255, 255, 255, 0.4)',
                  boxShadow: '0 0 16px rgba(2, 132, 199, 0.45)'
                }} 
              />
            </div>
            <h2 className="login-title">Sign In to Billora</h2>
            <p className="login-subtitle">Authorized Enterprise Terminal Access</p>
            <div className="login-badge-pill">
              <span className="live-dot"></span>
              <span>Cloud PostgreSQL Database</span>
            </div>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="login-alert-danger">
              <AlertCircle size={18} className="login-alert-icon" />
              <div className="login-alert-text">
                <strong>Access Denied:</strong> {error}
              </div>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="login-form">
            <div className="form-group">
              <label className="form-label" htmlFor="login-username">
                Username or Email Address
              </label>
              <div className="input-with-icon">
                <User size={18} className="input-prefix-icon" />
                <input
                  id="login-username"
                  type="text"
                  className="form-input login-input"
                  placeholder="Enter your username or email"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoComplete="username"
                  autoFocus
                  disabled={loading}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="login-password">
                Password
              </label>
              <div className="input-with-icon">
                <Lock size={18} className="input-prefix-icon" />
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  className="form-input login-input"
                  placeholder="Enter your account password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  disabled={loading}
                />
                <button
                  type="button"
                  className="btn-password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="login-options-row">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                <span>Keep session active</span>
              </label>
            </div>

            <button
              type="submit"
              className="btn btn-primary login-submit-btn"
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="login-spinner"></div>
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <LogIn size={18} />
                  <span>Sign In to Terminal</span>
                </>
              )}
            </button>
          </form>

          {/* Footer Info */}
          <div className="login-card-footer" style={{ marginTop: '20px' }}>
            <ShieldCheck size={14} className="text-success" />
            <span>Billora ERP System • 256-Bit Encrypted Session</span>
          </div>
        </div>
      </div>
    </div>
  );
}
