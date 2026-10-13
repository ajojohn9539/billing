import React, { useState } from 'react';
import { CreditCard, Search, Trash2, ArrowUpRight, CheckCircle2 } from 'lucide-react';
import { api } from '../services/api';

export default function PaymentsView({ 
  payments, 
  currency, 
  onRefresh, 
  onViewInvoice 
}) {
  const [search, setSearch] = useState('');

  const formatMoney = (val) => `${currency} ${(Number(val) || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const handleDelete = async (id, ref) => {
    if (!window.confirm(`Are you sure you want to void/delete this payment record (${ref || id})? This will restore the invoice balance due.`)) return;
    try {
      await api.deletePayment(id);
      onRefresh();
    } catch (err) {
      alert(err.message);
    }
  };

  const filtered = payments.filter(p => {
    const q = search.toLowerCase();
    return (
      (p.invoice_number && p.invoice_number.toLowerCase().includes(q)) ||
      (p.customer_name && p.customer_name.toLowerCase().includes(q)) ||
      (p.payment_method && p.payment_method.toLowerCase().includes(q)) ||
      (p.transaction_reference && p.transaction_reference.toLowerCase().includes(q))
    );
  });

  const totalCollected = filtered.reduce((acc, curr) => acc + (parseFloat(curr.amount) || 0), 0);

  return (
    <div>
      {/* Header */}
      <div className="view-header">
        <div className="view-title-group">
          <h2>Payment Ledger & Collections</h2>
          <p>Audit trail of all settled invoices, payment gateways, wire transfers, and cash receipts</p>
        </div>
        <div className="header-actions">
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Filtered Collections</span>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--success)' }}>
              {formatMoney(totalCollected)}
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="filter-bar">
        <div className="search-input-wrap" style={{ width: '320px' }}>
          <Search />
          <input 
            type="text" 
            className="search-input" 
            placeholder="Search by invoice #, client, reference..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <span style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>
          Showing {filtered.length} payment records
        </span>
      </div>

      {/* Table */}
      <div className="card">
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Payment Date</th>
                <th>Invoice #</th>
                <th>Customer / Client</th>
                <th>Payment Method</th>
                <th>Reference / UTR ID</th>
                <th>Notes</th>
                <th style={{ textAlign: 'right' }}>Amount Paid</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered && filtered.length > 0 ? (
                filtered.map((p) => (
                  <tr key={p.id}>
                    <td>{p.payment_date}</td>
                    <td className="font-mono">
                      <span 
                        style={{ cursor: 'pointer', textDecoration: 'underline', color: '#fff', fontWeight: 700 }}
                        onClick={() => onViewInvoice(p.invoice_id)}
                      >
                        {p.invoice_number}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{p.customer_name}</div>
                      {p.customer_company && (
                        <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>{p.customer_company}</div>
                      )}
                    </td>
                    <td>
                      <span className="badge" style={{ background: 'rgba(255, 255, 255, 0.05)', color: '#fff' }}>
                        {p.payment_method}
                      </span>
                    </td>
                    <td className="font-mono" style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      {p.transaction_reference || '—'}
                    </td>
                    <td style={{ fontSize: '0.78rem', color: 'var(--text-muted)', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {p.notes || '—'}
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--success)' }}>
                      + {formatMoney(p.amount)}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button 
                        className="btn btn-sm btn-danger-outline" 
                        onClick={() => handleDelete(p.id, p.transaction_reference || p.invoice_number)}
                        title="Void / Delete Payment"
                      >
                        <Trash2 size={13} />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                    No payment records match your search query.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
