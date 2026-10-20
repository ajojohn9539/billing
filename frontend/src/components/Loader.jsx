import React from 'react';
import { Sparkles } from 'lucide-react';

export default function Loader({ 
  message = 'Loading data...', 
  subMessage = 'Please wait while we sync your records',
  fullScreen = false, 
  size = 'medium' 
}) {
  const sizeMap = {
    small: { outer: 36, logo: 18, title: '0.85rem', sub: '0.72rem' },
    medium: { outer: 60, logo: 30, title: '1.05rem', sub: '0.82rem' },
    large: { outer: 80, logo: 40, title: '1.25rem', sub: '0.9rem' }
  };

  const currentSize = sizeMap[size] || sizeMap.medium;

  const content = (
    <div 
      className="billora-page-loader"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: fullScreen ? '0' : '48px 24px',
        textAlign: 'center',
        animation: 'fadeIn 0.25s ease-out'
      }}
    >
      {/* Animated Glowing Dual Ring Spinner */}
      <div style={{ position: 'relative', width: currentSize.outer, height: currentSize.outer, marginBottom: '20px' }}>
        {/* Outer Orbit Ring */}
        <div style={{
          position: 'absolute',
          inset: 0,
          borderRadius: '50%',
          border: '3px solid transparent',
          borderTopColor: '#0284c7',
          borderRightColor: '#38bdf8',
          boxShadow: '0 0 20px rgba(56, 189, 248, 0.35)',
          animation: 'billora-spin 0.9s cubic-bezier(0.5, 0, 0.5, 1) infinite'
        }} />
        
        {/* Inner Counter Orbit Ring */}
        <div style={{
          position: 'absolute',
          inset: '6px',
          borderRadius: '50%',
          border: '2.5px solid transparent',
          borderBottomColor: '#10b981',
          borderLeftColor: '#34d399',
          boxShadow: '0 0 15px rgba(16, 185, 129, 0.3)',
          animation: 'billora-spin-reverse 1.2s cubic-bezier(0.5, 0, 0.5, 1) infinite'
        }} />

        {/* Center Glowing Logo Dot */}
        <div style={{
          position: 'absolute',
          inset: '16px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 0 14px rgba(2, 132, 199, 0.6)',
          animation: 'billora-pulse 1.8s ease-in-out infinite'
        }}>
          <img 
            src="/logo.png" 
            alt="Billora" 
            style={{ width: '80%', height: '80%', borderRadius: '50%', objectFit: 'cover' }}
            onError={(e) => { e.currentTarget.style.display = 'none'; }}
          />
        </div>
      </div>

      {/* Billora Brand Tag */}
      <div style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '3px 10px',
        borderRadius: '20px',
        background: 'rgba(2, 132, 199, 0.12)',
        border: '1px solid rgba(56, 189, 248, 0.25)',
        marginBottom: '10px'
      }}>
        <Sparkles size={12} color="#38bdf8" />
        <span style={{
          fontSize: '0.72rem',
          fontWeight: 800,
          color: '#38bdf8',
          letterSpacing: '0.08em',
          textTransform: 'uppercase'
        }}>
          Billora System
        </span>
      </div>

      {/* Primary Message */}
      <h4 style={{
        margin: '0 0 6px 0',
        fontSize: currentSize.title,
        fontWeight: 700,
        color: '#f8fafc',
        letterSpacing: '-0.01em'
      }}>
        {message}
      </h4>

      {/* Subtitle / Progress Note */}
      {subMessage && (
        <p style={{
          margin: '0 0 16px 0',
          fontSize: currentSize.sub,
          color: '#94a3b8',
          maxWidth: '340px',
          lineHeight: 1.4
        }}>
          {subMessage}
        </p>
      )}

      {/* Micro Shimmer Progress Line */}
      <div style={{
        width: '180px',
        height: '3px',
        borderRadius: '3px',
        background: 'rgba(255, 255, 255, 0.08)',
        overflow: 'hidden',
        position: 'relative'
      }}>
        <div style={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          left: 0,
          width: '45%',
          background: 'linear-gradient(90deg, transparent, #38bdf8, #10b981, transparent)',
          borderRadius: '3px',
          animation: 'billora-shimmer 1.4s ease-in-out infinite'
        }} />
      </div>
    </div>
  );

  if (fullScreen) {
    return (
      <div style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(11, 17, 33, 0.82)',
        backdropFilter: 'blur(10px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        animation: 'fadeIn 0.2s ease-out'
      }}>
        <div style={{
          background: 'linear-gradient(160deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.92) 100%)',
          padding: '36px 44px',
          borderRadius: '20px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.7), 0 0 30px rgba(2, 132, 199, 0.2)',
          maxWidth: '420px',
          width: '90%'
        }}>
          {content}
        </div>
      </div>
    );
  }

  return content;
}
