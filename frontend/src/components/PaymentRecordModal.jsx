import React, { useState, useEffect } from 'react';
import { X, CreditCard, CheckCircle2 } from 'lucide-react';
import { api } from '../services/api';

export default function PaymentRecordModal({ 
  invoice, 
  onClose, 
  onSuccess, 
  currency 
}) {
  if (!invoice) return null;

  const todayStr = new Date().toISOString().split('T')[0];
  const [amount, setAmount] = useState(invoice.balance_due || invoice.grand_total || 0);
  const [paymentDate, setPaymentDate] = useState(todayStr);
  const [paymentMethod, setPaymentMethod] = useState('Bank Transfer');
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const formatMoney = (val) => `${currency} ${(Number(val) || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    const payVal = parseFloat(amount);
    if (!payVal || payVal <= 0) {
      setError('Payment amount must be greater than 0.');
      return;
    }

    setLoading(true);
    try {
      await api.recordPayment({
        invoice_id: invoice.id,
        amount: payVal,
        payment_date: paymentDate,
        payment_method: paymentMethod,
        transaction_reference: reference,
        notes: notes,
      });
      onSuccess();
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-container" style={{ maxWidth: '480px' }}>
        <div className="modal-header">
          <h3>Record Invoice Payment</h3>
          <button className="modal-close-btn" onClick={onClose}><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {error && (
              <div style={{ padding: '0.75rem', background: 'var(--danger-bg)', border: '1px solid var(--danger-border)', color: 'var(--danger)', borderRadius: 'var(--radius-md)', marginBottom: '1rem', fontSize: '0.84rem' }}>
                {error}
              </div>
            )}

            {/* Invoice Info Card */}
            <div style={{ background: 'var(--bg-secondary)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Invoice:</span>
                <span className="font-mono" style={{ fontWeight: 700, color: '#fff' }}>{invoice.invoice_number}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Client:</span>
                <span style={{ fontWeight: 600, color: '#fff' }}>{invoice.customer_name}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Grand Total:</span>
                <span style={{ fontWeight: 600 }}>{formatMoney(invoice.grand_total)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px dashed var(--border-strong)', paddingTop: '0.4rem', marginTop: '0.4rem' }}>
                <span style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--text-muted)' }}>Remaining Due:</span>
                <span style={{ fontWeight: 800, color: '#fbbf24' }}>{formatMoney(invoice.balance_due)}</span>
              </div>
            </div>

            {/* Payment Fields */}
            <div className="form-group">
              <label className="form-label">Payment Amount ({currency}) *</label>
              <input 
                type="number" 
                step="0.01" 
                min="0.01" 
                className="form-input" 
                value={amount} 
                onChange={(e) => setAmount(e.target.value)}
                required 
              />
            </div>

            <div className="form-group">
              <label className="form-label">Payment Date *</label>
              <input 
                type="date" 
                className="form-input" 
                value={paymentDate} 
                onChange={(e) => setPaymentDate(e.target.value)}
                required 
              />
            </div>

            <div className="form-group">
              <label className="form-label">Payment Method *</label>
              <select 
                className="form-select" 
                value={paymentMethod} 
                onChange={(e) => setPaymentMethod(e.target.value)}
              >
                <option value="Bank Transfer">Bank Transfer (Wire / ACH / NEFT)</option>
                <option value="Credit Card">Credit Card / Debit Card</option>
                <option value="UPI">UPI (Unified Payments Interface)</option>
                <option value="Cash">Cash</option>
                <option value="PayPal">PayPal / Online Gateway</option>
                <option value="Cheque">Cheque</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Transaction Reference / UTR / Check #</label>
              <input 
                type="text" 
                className="form-input font-mono" 
                placeholder="e.g. WIRE-83920194 or UPI-903820"
                value={reference} 
                onChange={(e) => setReference(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Internal Notes</label>
              <input 
                type="text" 
                className="form-input" 
                placeholder="Optional settlement notes..."
                value={notes} 
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-success" disabled={loading}>
              <CheckCircle2 size={16} />
              <span>{loading ? 'Recording...' : 'Record Payment'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
