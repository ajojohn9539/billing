import React, { useState } from 'react';
import { 
  FileText, 
  Search, 
  Plus, 
  Eye, 
  CreditCard, 
  Edit3, 
  Trash2, 
  RefreshCw,
  Download
} from 'lucide-react';

export default function InvoicesView({ 
  invoices, 
  currency, 
  filterStatus, 
  setFilterStatus, 
  searchQuery, 
  setSearchQuery, 
  onRefresh, 
  onNewInvoice, 
  onViewInvoice, 
  onEditInvoice, 
  onRecordPayment, 
  onDeleteInvoice,
  onUpdateStatus 
}) {
  const statuses = [
    { id: 'all', label: 'All Invoices' },
    { id: 'pending', label: 'Pending' },
    { id: 'paid', label: 'Paid' },
    { id: 'partially_paid', label: 'Partially Paid' },
    { id: 'overdue', label: 'Overdue' },
    { id: 'draft', label: 'Draft' },
  ];

  const formatMoney = (val) => `${currency} ${(Number(val) || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <div>
      {/* Header */}
      <div className="view-header">
        <div className="view-title-group">
          <h2>Invoices & Billing</h2>
          <p>Create, manage, filter, and track payment status for all client accounts</p>
        </div>
        <div className="header-actions">
          <button className="btn btn-secondary" onClick={onRefresh} title="Refresh list">
            <RefreshCw size={15} />
            <span>Refresh</span>
          </button>
          <button className="btn btn-primary" onClick={onNewInvoice}>
            <Plus size={16} />
            <span>Create Invoice</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="filter-bar">
        <div className="status-pills">
          {statuses.map((st) => (
            <button
              key={st.id}
              className={`pill-btn ${filterStatus === st.id ? 'active' : ''}`}
              onClick={() => setFilterStatus(st.id)}
            >
              {st.label}
            </button>
          ))}
        </div>

        <div className="search-input-wrap">
          <Search />
          <input
            type="text"
            className="search-input"
            placeholder="Search invoice # or client..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Invoices Table Card */}
      <div className="card">
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Invoice #</th>
                <th>Client / Entity</th>
                <th>Items</th>
                <th>Issue Date</th>
                <th>Due Date</th>
                <th>Grand Total</th>
                <th>Balance Due</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {invoices && invoices.length > 0 ? (
                invoices.map((inv) => (
                  <tr key={inv.id}>
                    <td className="font-mono" style={{ fontWeight: 700, color: '#fff' }}>
                      <span 
                        style={{ cursor: 'pointer', textDecoration: 'underline', textUnderlineOffset: '3px' }}
                        onClick={() => onViewInvoice(inv.id)}
                      >
                        {inv.invoice_number}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{inv.customer_name}</div>
                      {inv.customer_company && (
                        <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>{inv.customer_company}</div>
                      )}
                    </td>
                    <td>
                      <span className="badge" style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)' }}>
                        {inv.item_count || 1} items
                      </span>
                    </td>
                    <td>{inv.issue_date}</td>
                    <td>
                      <span style={{ color: inv.status === 'overdue' ? 'var(--danger)' : 'inherit' }}>
                        {inv.due_date}
                      </span>
                    </td>
                    <td style={{ fontWeight: 700, color: '#fff' }}>
                      {formatMoney(inv.grand_total)}
                    </td>
                    <td>
                      <span style={{ 
                        fontWeight: 600, 
                        color: inv.balance_due > 0 ? '#fbbf24' : 'var(--success)' 
                      }}>
                        {formatMoney(inv.balance_due)}
                      </span>
                    </td>
                    <td>
                      <select 
                        className={`badge badge-${inv.status}`}
                        style={{ cursor: 'pointer', outline: 'none' }}
                        value={inv.status}
                        onChange={(e) => onUpdateStatus(inv.id, e.target.value)}
                      >
                        <option value="draft">Draft</option>
                        <option value="pending">Pending</option>
                        <option value="paid">Paid</option>
                        <option value="partially_paid">Partially Paid</option>
                        <option value="overdue">Overdue</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '0.35rem' }}>
                        <button 
                          className="btn btn-sm btn-secondary" 
                          onClick={() => onViewInvoice(inv.id)}
                          title="View / Print Printable Invoice"
                        >
                          <Eye size={14} />
                        </button>

                        {inv.balance_due > 0 && (
                          <button 
                            className="btn btn-sm btn-primary" 
                            onClick={() => onRecordPayment(inv)}
                            title="Record Payment"
                          >
                            <CreditCard size={14} />
                          </button>
                        )}

                        <button 
                          className="btn btn-sm btn-secondary" 
                          onClick={() => onEditInvoice(inv.id)}
                          title="Edit Invoice"
                        >
                          <Edit3 size={14} />
                        </button>

                        <button 
                          className="btn btn-sm btn-danger-outline" 
                          onClick={() => onDeleteInvoice(inv.id, inv.invoice_number)}
                          title="Delete Invoice"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="9" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                    <FileText size={36} style={{ display: 'block', margin: '0 auto 0.75rem', opacity: 0.3 }} />
                    <p style={{ fontWeight: 600, color: '#fff' }}>No invoices found matching criteria</p>
                    <p style={{ fontSize: '0.8rem', marginTop: '0.25rem' }}>Click "Create Invoice" above to generate a new billing invoice.</p>
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
