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
  Sparkles 
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
    { label: 'Admin / Owner', user: 'admin', pass: 'admin123', role: 'Full Access', color: '#f59e0b', icon: '👑' },
    { label: 'Accountant (Ganesh)', user: 'ganesh', pass: 'ganesh123', role: 'Ledger & Daybook', color: '#10b981', icon: '📊' },
    { label: 'Sales Staff (Muthu)', user: 'muthu', pass: 'muthu123', role: 'Billing & Quotes', color: '#3b82f6', icon: '🛒' },
    { label: 'Store Keeper (Ramesh)', user: 'ramesh', pass: 'ramesh123', role: 'Inventory & Stock', color: '#8b5cf6', icon: '📦' },
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
      <div className="login-card">
        {/* Brand Header */}
        <div className="login-header">
          <div className="login-logo-glow">
            <span className="login-logo-emoji">🪨</span>
          </div>
          <h1 className="login-title">Rock Palace</h1>
          <p className="login-subtitle">Aster Billing & Stone Inventory ERP</p>
          <div className="login-badge-pill">
            <span className="live-dot"></span>
            <span>Supabase PostgreSQL Terminal</span>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="login-alert-danger">
            <AlertCircle size={18} className="login-alert-icon" />
            <div className="login-alert-text">
              <strong>Login Failed:</strong> {error}
            </div>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label className="form-label" htmlFor="login-username">
              Username or Email
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
                placeholder="Enter password"
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
              <span>Remember this session</span>
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
                <span>Authenticating Terminal...</span>
              </>
            ) : (
              <>
                <LogIn size={18} />
                <span>Sign In to Terminal</span>
              </>
            )}
          </button>
        </form>

        {/* Quick Demo Credentials Pill Bar */}
        <div className="login-demo-section">
          <div className="demo-section-header">
            <KeyRound size={14} />
            <span>Quick Staff Login (1-Click Fill)</span>
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

        {/* Footer info */}
        <div className="login-card-footer">
          <ShieldCheck size={14} className="text-success" />
          <span>Rock Palace Stone Billing v1.0 • Multi-User RBAC</span>
        </div>
      </div>
    </div>
  );
}
