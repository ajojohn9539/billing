import React, { useEffect } from 'react';
import { Trash2, AlertTriangle, X } from 'lucide-react';

export default function ConfirmModal({
  isOpen,
  title = 'Confirm Deletion',
  message = 'Are you sure you want to delete this record? This action cannot be undone.',
  confirmText = 'Delete Record',
  cancelText = 'Cancel',
  isDanger = true,
  isLoading = false,
  onConfirm,
  onCancel,
  itemDetails = null
}) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen && !isLoading) {
        onCancel();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isLoading, onCancel]);

  if (!isOpen) return null;

  return (
    <div 
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(5, 10, 20, 0.75)',
        backdropFilter: 'blur(8px)',
        padding: '16px',
        animation: 'fadeIn 0.2s ease-out'
      }} 
      onClick={!isLoading ? onCancel : undefined}
    >
      <div 
        style={{
          background: 'linear-gradient(145deg, #0f172a 0%, #1e293b 100%)',
          border: isDanger ? '1px solid rgba(239, 68, 68, 0.35)' : '1px solid rgba(56, 189, 248, 0.35)',
          boxShadow: isDanger 
            ? '0 25px 50px -12px rgba(0, 0, 0, 0.7), 0 0 25px rgba(239, 68, 68, 0.15)'
            : '0 25px 50px -12px rgba(0, 0, 0, 0.7), 0 0 25px rgba(56, 189, 248, 0.15)',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '460px',
          overflow: 'hidden',
          animation: 'scaleIn 0.2s ease-out'
        }} 
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          padding: '18px 22px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              background: isDanger ? 'rgba(239, 68, 68, 0.15)' : 'rgba(56, 189, 248, 0.15)',
              border: isDanger ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid rgba(56, 189, 248, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: isDanger ? '#f87171' : '#38bdf8'
            }}>
              {isDanger ? <Trash2 size={20} /> : <AlertTriangle size={20} />}
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: '#f8fafc' }}>
                {title}
              </h3>
              <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                Irreversible Action
              </span>
            </div>
          </div>
          <button 
            onClick={onCancel}
            disabled={isLoading}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#64748b',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              padding: '6px',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '22px' }}>
          <p style={{ margin: '0 0 16px 0', fontSize: '0.92rem', color: '#cbd5e1', lineHeight: '1.5' }}>
            {message}
          </p>

          {itemDetails && (
            <div style={{
              background: 'rgba(15, 23, 42, 0.7)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '8px',
              padding: '12px 14px',
              marginBottom: '16px',
              fontSize: '0.85rem'
            }}>
              {itemDetails}
            </div>
          )}

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onCancel}
              disabled={isLoading}
              style={{ padding: '8px 18px', fontWeight: 600 }}
            >
              {cancelText}
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={isLoading}
              style={{
                background: isDanger 
                  ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'
                  : 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                color: '#ffffff',
                border: isDanger ? '1px solid #f87171' : '1px solid #38bdf8',
                padding: '8px 20px',
                borderRadius: '8px',
                fontWeight: 600,
                fontSize: '0.9rem',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: isDanger ? '0 4px 14px rgba(239, 68, 68, 0.4)' : '0 4px 14px rgba(2, 132, 199, 0.4)',
                opacity: isLoading ? 0.7 : 1
              }}
            >
              {isLoading ? (
                <span>Processing...</span>
              ) : (
                <>
                  <Trash2 size={15} />
                  <span>{confirmText}</span>
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
