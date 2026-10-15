import React, { useState } from 'react';
import { 
  User, 
  Lock, 
  LogIn, 
  Eye, 
  EyeOff, 
  ShieldCheck, 
  AlertCircle, 
  KeyRound, 
  Phone,
  MapPin,
  Building2,
  FileText,
  CreditCard,
  Truck
} from 'lucide-react';
import { api } from '../services/api';

export default function LoginView({ onLoginSuccess }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const demoAccounts = [
    { label: 'Owner / Admin', user: 'admin', pass: 'admin123', role: 'Full Management', icon: '👑' },
    { label: 'Ganesh (Accountant)', user: 'ganesh', pass: 'ganesh123', role: 'Daybook & Tax Ledger', icon: '📊' },
    { label: 'Muthu (Sales Counter)', user: 'muthu', pass: 'muthu123', role: 'GST Billing & Quotes', icon: '🛒' },
    { label: 'Ramesh (Store Yard)', user: 'ramesh', pass: 'ramesh123', role: 'Granite & Marble Stock', icon: '📦' },
  ];

  const handleQuickFill = (user, pass) => {
    setUsername(user);
    setPassword(pass);
    setError(null);
  };

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
        if (onLoginSuccess) {
          onLoginSuccess(res.user, res.token);
        }
      } else {
        throw new Error('Authentication succeeded but user profile was not returned.');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError(err.message || 'Invalid username or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-wrapper">
      <div className="login-portal-container">
        
        {/* Left Side: Business Showcase / Info Panel */}
        <div className="login-business-panel">
          <div className="portal-brand-badge">
            <div className="jr-circle-logo">JR</div>
            <div className="portal-brand-text">
              <h2>JR MARBLES & GRANITES</h2>
              <p className="portal-location">CHENGAMANADU, KOTTARAKKARA</p>
            </div>
          </div>

          <div className="portal-hero-tagline">
            <h1>Premium Marbles, Granites & Natural Stone Slabs</h1>
            <p>Official Billing, GST Invoicing & Inventory Management Portal</p>
          </div>

          <div className="portal-business-cards">
            <div className="portal-card-item">
              <Phone size={18} className="portal-card-icon" />
              <div>
                <span className="card-lbl">Contact Mobiles</span>
                <span className="card-val">9460110878, 8504882265</span>
              </div>
            </div>

            <div className="portal-card-item">
              <Building2 size={18} className="portal-card-icon" />
              <div>
                <span className="card-lbl">GSTIN (State Code: 32)</span>
                <span className="card-val font-mono">32FGZPR5431L1ZL</span>
              </div>
            </div>

            <div className="portal-card-item">
              <CreditCard size={18} className="portal-card-icon" />
              <div>
                <span className="card-lbl">Indian Bank Current A/c</span>
                <span className="card-val font-mono">7944010222 • IFSC: IDIB 000C046</span>
              </div>
            </div>

            <div className="portal-card-item">
              <MapPin size={18} className="portal-card-icon" />
              <div>
                <span className="card-lbl">Jurisdiction & Location</span>
                <span className="card-val">Chengamanadu, Kottarakkara, Kerala</span>
              </div>
            </div>
          </div>

          <div className="portal-features-list">
            <div className="feature-pill"><FileText size={14} /> GST Tax Invoices (JR26-27)</div>
            <div className="feature-pill"><Truck size={14} /> Vehicle & Supply Tracking</div>
            <div className="feature-pill"><ShieldCheck size={14} /> HSN 6802 Stone Catalog</div>
          </div>
        </div>

        {/* Right Side: Secure Staff Login Card */}
        <div className="login-card">
          <div className="login-header">
            <div className="login-logo-glow">
              <div className="jr-circle-logo-sm">JR</div>
            </div>
            <h2 className="login-title">Staff Portal Sign In</h2>
            <p className="login-subtitle">Authorized Staff Terminal • Chengamanadu</p>
            <div className="login-badge-pill">
              <span className="live-dot"></span>
              <span>Supabase PostgreSQL Live</span>
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
                Username or Staff Email
              </label>
              <div className="input-with-icon">
                <User size={18} className="input-prefix-icon" />
                <input
                  id="login-username"
                  type="text"
                  className="form-input login-input"
                  placeholder="e.g. admin or muthu"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoComplete="username"
                  autoFocus
                  disabled={loading}
                />
              </div>
            </div>

            <div className="form-group">
              <div className="label-with-hint">
                <label className="form-label" htmlFor="login-password">
                  Password
                </label>
                <span className="label-hint">Default: username123</span>
              </div>
              <div className="input-with-icon">
                <Lock size={18} className="input-prefix-icon" />
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  className="form-input login-input"
                  placeholder="Enter your password"
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
                  <span>Authenticating Staff...</span>
                </>
              ) : (
                <>
                  <LogIn size={18} />
                  <span>Sign In to Terminal</span>
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Credentials */}
          <div className="login-demo-section">
            <div className="demo-section-header">
              <KeyRound size={14} />
              <span>Quick Staff Logins (1-Click Fill)</span>
            </div>
            <div className="demo-accounts-grid">
              {demoAccounts.map((acc) => (
                <button
                  key={acc.user}
                  type="button"
                  className="demo-account-chip"
                  onClick={() => handleQuickFill(acc.user, acc.pass)}
                  title={`Click to fill ${acc.label} credentials`}
                >
                  <span className="demo-chip-icon">{acc.icon}</span>
                  <div className="demo-chip-info">
                    <span className="demo-chip-title">{acc.label}</span>
                    <span className="demo-chip-cred">{acc.user} / {acc.pass}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Footer Info */}
          <div className="login-card-footer">
            <ShieldCheck size={14} className="text-success" />
            <span>JR Marbles & Granites • Subject to Kottarakkara Jurisdiction</span>
          </div>

        </div>

      </div>
    </div>
  );
}
