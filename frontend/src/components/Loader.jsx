import React from 'react';

export default function Loader({ 
  message = "Loading data...", 
  fullScreen = false, 
  size = "medium" 
}) {
  const sizeMap = {
    small: { spinner: 24, text: '0.8rem' },
    medium: { spinner: 40, text: '0.95rem' },
    large: { spinner: 56, text: '1.1rem' }
  };

  const { spinner, text } = sizeMap[size] || sizeMap.medium;

  const content = (
    <div className="billora-loader-container" style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '14px',
      padding: fullScreen ? '0' : '32px 20px',
    }}>
      <div className="billora-spinner-wrapper" style={{ position: 'relative', width: spinner, height: spinner }}>
        <div style={{
          width: spinner,
          height: spinner,
          borderRadius: '50%',
          border: '3px solid rgba(2, 132, 199, 0.15)',
          borderTopColor: '#0284c7',
          borderRightColor: '#38bdf8',
          animation: 'billora-spin 0.8s cubic-bezier(0.4, 0, 0.2, 1) infinite',
          boxShadow: '0 0 15px rgba(2, 132, 199, 0.25)'
        }}></div>
      </div>
      {message && (
        <span style={{
          fontSize: text,
          fontWeight: 600,
          color: '#0369a1',
          letterSpacing: '0.02em',
          textAlign: 'center'
        }}>
          {message}
        </span>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(6px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{
          background: 'rgba(255, 255, 255, 0.95)',
          padding: '28px 36px',
          borderRadius: '16px',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)',
          border: '1px solid rgba(255, 255, 255, 0.6)'
        }}>
          {content}
        </div>
      </div>
    );
  }

  return content;
}
