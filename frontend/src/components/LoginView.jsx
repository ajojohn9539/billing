import React, { useState } from "react";
import { 
  User, 
  Lock, 
  LogIn, 
  Eye, 
  EyeOff, 
  ShieldCheck, 
  AlertCircle,
  Zap
} from "lucide-react";
import { api } from "../services/api";

const QUICK_STAFF_ROLES = [
  { 
    role: "Admin", 
    name: "Billora Admin", 
    email: "admin@billora.com", 
    pass: "RockPalace2026!", 
    color: "#0284c7", 
    badge: "🛡️ Admin" 
  },
  { 
    role: "Sudo", 
    name: "Super Sudo", 
    email: "sudo@billora.com", 
    pass: "SudoMaster2026!", 
    color: "#a855f7", 
    badge: "👑 Sudo Master" 
  },
  { 
    role: "Accountant", 
    name: "Ganesh (Accounts)", 
    email: "accountant@billora.com", 
    pass: "ganesh123", 
    color: "#10b981", 
    badge: "💼 Accountant" 
  },
  { 
    role: "Sales", 
    name: "Muthu (Sales)", 
    email: "sales@billora.com", 
    pass: "muthu123", 
    color: "#f59e0b", 
    badge: "🏷️ Sales Staff" 
  },
  { 
    role: "Store", 
    name: "Ramesh (Store)", 
    email: "store@billora.com", 
    pass: "ramesh123", 
    color: "#06b6d4", 
    badge: "📦 Store Keeper" 
  }
];

export default function LoginView({ onLoginSuccess }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const performLogin = async (usr, pwd) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.login(usr.trim(), pwd);
      if (res && res.user) {
        if (rememberMe) {
          localStorage.setItem("billing_user", JSON.stringify(res.user));
          if (res.token) localStorage.setItem("billing_token", res.token);
        } else {
          sessionStorage.setItem("billing_user", JSON.stringify(res.user));
          if (res.token) sessionStorage.setItem("billing_token", res.token);
        }
        onLoginSuccess(res.user, res.token);
      } else {
        setError("Authentication failed. Please verify credentials.");
      }
    } catch (err) {
      setError(err.message || "Invalid username or password.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim()) {
      setError("Please enter your username or email.");
      return;
    }
    if (!password) {
      setError("Please enter your account password.");
      return;
    }
    performLogin(username, password);
  };

  const handleQuickSelect = (staff) => {
    setUsername(staff.email);
    setPassword(staff.pass);
    setError(null);
    performLogin(staff.email, staff.pass);
  };

  return (
    <div className="login-wrapper">
      {/* Centered Secure Login Card */}
      <div className="login-card" style={{ maxWidth: "460px" }}>
        <div className="login-header">
          <div className="login-logo-glow" style={{ 
            width: "76px", 
            height: "76px", 
            borderRadius: "18px", 
            padding: "3px",
            background: "linear-gradient(135deg, #0284c7 0%, #10b981 100%)",
            boxShadow: "0 0 32px rgba(2, 132, 199, 0.5)",
            marginBottom: "1rem"
          }}>
            <img 
              src="/logo.png" 
              alt="Billora Logo" 
              style={{
                width: "100%",
                height: "100%",
                borderRadius: "16px",
                objectFit: "cover",
                border: "2px solid rgba(255, 255, 255, 0.6)"
              }} 
            />
          </div>
          <h2 className="login-title" style={{ fontSize: "1.85rem", fontWeight: 800, color: "#ffffff", letterSpacing: "-0.02em", margin: 0 }}>
            BILLORA
          </h2>
          <p className="login-subtitle" style={{ color: "#94a3b8", fontSize: "0.88rem", marginTop: "4px", marginBottom: "10px" }}>
            Smart GST Billing & Stone Inventory ERP System
          </p>
          <div className="login-badge-pill">
            <span className="live-dot"></span>
            <span>Cloud PostgreSQL Database • Live</span>
          </div>
        </div>

        {/* Quick 1-Click Role Login Bar */}
        <div style={{
          margin: "1.2rem 0 1rem",
          padding: "0.85rem",
          background: "rgba(15, 23, 42, 0.75)",
          borderRadius: "12px",
          border: "1px solid rgba(255, 255, 255, 0.08)"
        }}>
          <div style={{
            fontSize: "0.72rem",
            fontWeight: 700,
            textTransform: "uppercase",
            color: "#64748b",
            letterSpacing: "0.05em",
            marginBottom: "0.5rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between"
          }}>
            <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              <Zap size={12} color="#38bdf8" /> 1-Click Staff Logins
            </span>
            <span style={{ fontSize: "0.68rem", color: "#38bdf8" }}>Click to enter</span>
          </div>

          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
            {QUICK_STAFF_ROLES.map((staff, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleQuickSelect(staff)}
                disabled={loading}
                style={{
                  fontSize: "0.74rem",
                  fontWeight: 600,
                  padding: "4px 8px",
                  borderRadius: "6px",
                  border: "1px solid rgba(255, 255, 255, 0.12)",
                  background: "rgba(30, 41, 59, 0.8)",
                  color: "#e2e8f0",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  transition: "all 0.15s ease"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = staff.color;
                  e.currentTarget.style.color = "#fff";
                  e.currentTarget.style.borderColor = staff.color;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "rgba(30, 41, 59, 0.8)";
                  e.currentTarget.style.color = "#e2e8f0";
                  e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.12)";
                }}
              >
                <span>{staff.badge}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="login-alert-danger" style={{ marginBottom: "1rem" }}>
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
                placeholder="admin@billora.com"
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
                type={showPassword ? "text" : "password"}
                className="form-input login-input"
                placeholder="••••••••••••"
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
                title={showPassword ? "Hide password" : "Show password"}
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
            style={{
              height: "46px",
              fontSize: "0.95rem",
              fontWeight: 700,
              boxShadow: "0 4px 14px rgba(2, 132, 199, 0.4)"
            }}
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
        <div className="login-card-footer" style={{ marginTop: "20px" }}>
          <ShieldCheck size={14} className="text-success" />
          <span>Billora ERP System • 256-Bit Encrypted Session</span>
        </div>
      </div>
    </div>
  );
}
