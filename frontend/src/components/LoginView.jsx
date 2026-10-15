import React, { useState } from 'react';
import { 
  User, 
  Lock, 
  LogIn, 
  Eye, 
  EyeOff, 
  ShieldCheck, 
  AlertCircle 
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
    <div className="login-wrapper">
      {/* Centered Secure Login Card */}
      <div className="login-card" style={{ maxWidth: '440px' }}>
        <div className="login-header">
          <div className="login-logo-glow" style={{ 
            width: '72px', 
            height: '72px', 
            borderRadius: '50%', 
            padding: '3px',
            background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
            boxShadow: '0 0 25px rgba(2, 132, 199, 0.45)',
            marginBottom: '1rem'
          }}>
            <img 
              src="/logo.png" 
              alt="Billora Logo" 
              style={{
                width: '100%',
                height: '100%',
                borderRadius: '50%',
                objectFit: 'cover',
                border: '2px solid rgba(255, 255, 255, 0.6)'
              }} 
            />
          </div>
          <h2 className="login-title" style={{ fontSize: '1.75rem', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.02em', margin: 0 }}>
            BILLORA
          </h2>
          <p className="login-subtitle" style={{ color: '#94a3b8', fontSize: '0.88rem', marginTop: '4px', marginBottom: '12px' }}>
            Smart GST Billing & Stone Inventory ERP
          </p>
          <div className="login-badge-pill">
            <span className="live-dot"></span>
            <span>Cloud PostgreSQL Database • Live</span>
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
        <div className="login-card-footer" style={{ marginTop: '24px' }}>
          <ShieldCheck size={14} className="text-success" />
          <span>Billora ERP System • 256-Bit Encrypted Session</span>
        </div>
      </div>
    </div>
  );
}
