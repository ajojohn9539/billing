import React, { useState } from 'react';
import { Users, Search, Plus, Edit3, Trash2, Mail, Phone, MapPin, FileText, X, CheckCircle2 } from 'lucide-react';
import { api } from '../services/api';

export default function CustomersView({ 
  customers, 
  currency, 
  onRefresh, 
  onSelectCustomerInvoices 
}) {
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  
  // Form state
  const [name, setName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [taxId, setTaxId] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const formatMoney = (val) => `${currency} ${(Number(val) || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const openAddModal = () => {
    setEditingCustomer(null);
    setName('');
    setCompanyName('');
    setEmail('');
    setPhone('');
    setAddress('');
    setTaxId('');
    setNotes('');
    setError(null);
    setModalOpen(true);
  };

  const openEditModal = (cust) => {
    setEditingCustomer(cust);
    setName(cust.name);
    setCompanyName(cust.company_name || '');
    setEmail(cust.email || '');
    setPhone(cust.phone || '');
    setAddress(cust.billing_address || '');
    setTaxId(cust.tax_id || '');
    setNotes(cust.notes || '');
    setError(null);
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    if (!name.trim()) {
      setError('Customer name is required.');
      return;
    }

    setLoading(true);
    const payload = {
      name,
      company_name: companyName,
      email,
      phone,
      billing_address: address,
      shipping_address: address,
      tax_id: taxId,
      notes,
    };

    try {
      if (editingCustomer) {
        await api.updateCustomer(editingCustomer.id, payload);
      } else {
        await api.createCustomer(payload);
      }
      setModalOpen(false);
      onRefresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, custName) => {
    if (!window.confirm(`Are you sure you want to delete customer "${custName}"?`)) return;
    try {
      await api.deleteCustomer(id);
      onRefresh();
    } catch (err) {
      alert(err.message);
    }
  };

  const filtered = customers.filter(c => {
    const q = search.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      (c.company_name && c.company_name.toLowerCase().includes(q)) ||
      (c.email && c.email.toLowerCase().includes(q)) ||
      (c.phone && c.phone.includes(q))
    );
  });

  return (
    <div>
      {/* Header */}
      <div className="view-header">
        <div className="view-title-group">
          <h2>Customer Directory</h2>
          <p>Client accounts, contact profiles, billing histories, and balance ledgers</p>
        </div>
        <div className="header-actions">
          <button className="btn btn-primary" onClick={openAddModal}>
            <Plus size={16} />
            <span>Add Customer</span>
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="filter-bar">
        <div className="search-input-wrap" style={{ width: '320px' }}>
          <Search />
          <input 
            type="text" 
            className="search-input" 
            placeholder="Search by name, company, email..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <span style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>
          Showing {filtered.length} client accounts
        </span>
      </div>

      {/* Customers Table Card */}
      <div className="card">
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Customer / Company</th>
                <th>Contact Details</th>
                <th>Tax ID / GSTIN</th>
                <th>Invoices</th>
                <th>Total Billed</th>
                <th>Total Paid</th>
                <th>Outstanding Balance</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered && filtered.length > 0 ? (
                filtered.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <div style={{ fontWeight: 700, color: '#fff', fontSize: '0.92rem' }}>{c.name}</div>
                      {c.company_name && (
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{c.company_name}</div>
                      )}
                      {c.billing_address && (
                        <div style={{ fontSize: '0.74rem', color: 'var(--text-dim)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <MapPin size={12} />
                          <span>{c.billing_address}</span>
                        </div>
                      )}
                    </td>
                    <td>
                      {c.email && (
                        <div style={{ fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Mail size={12} style={{ color: 'var(--text-dim)' }} />
                          <span>{c.email}</span>
                        </div>
                      )}
                      {c.phone && (
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                          <Phone size={12} style={{ color: 'var(--text-dim)' }} />
                          <span>{c.phone}</span>
                        </div>
                      )}
                    </td>
                    <td className="font-mono" style={{ fontSize: '0.8rem' }}>
                      {c.tax_id || '—'}
                    </td>
                    <td>
                      <button 
                        className="btn btn-sm btn-secondary" 
                        onClick={() => onSelectCustomerInvoices(c.id)}
                        title="View Invoices for this customer"
                      >
                        <FileText size={13} />
                        <span>{c.total_invoices || 0} Bills</span>
                      </button>
                    </td>
                    <td style={{ fontWeight: 600 }}>{formatMoney(c.total_billed)}</td>
                    <td style={{ fontWeight: 600, color: 'var(--success)' }}>{formatMoney(c.total_paid)}</td>
                    <td>
                      <span style={{ 
                        fontWeight: 700, 
                        color: c.balance_due > 0 ? '#fbbf24' : 'var(--text-muted)' 
                      }}>
                        {formatMoney(c.balance_due)}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '0.35rem' }}>
                        <button 
                          className="btn btn-sm btn-secondary" 
                          onClick={() => openEditModal(c)}
                          title="Edit Customer"
                        >
                          <Edit3 size={14} />
                        </button>
                        <button 
                          className="btn btn-sm btn-danger-outline" 
                          onClick={() => handleDelete(c.id, c.name)}
                          title="Delete Customer"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                    No customers found. Click "Add Customer" to create your first client.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Customer Add/Edit Modal */}
      {modalOpen && (
        <div className="modal-overlay">
          <div className="modal-container" style={{ maxWidth: '580px' }}>
            <div className="modal-header">
              <h3>{editingCustomer ? 'Edit Customer' : 'Add New Customer'}</h3>
              <button className="modal-close-btn" onClick={() => setModalOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                {error && (
                  <div style={{ padding: '0.75rem', background: 'var(--danger-bg)', border: '1px solid var(--danger-border)', color: 'var(--danger)', borderRadius: 'var(--radius-md)', marginBottom: '1rem', fontSize: '0.84rem' }}>
                    {error}
                  </div>
                )}

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Full Name / Contact Person *</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="e.g. Sarah Jenkins"
                      value={name} 
                      onChange={(e) => setName(e.target.value)}
                      required 
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Company / Organization</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="e.g. Quantum Dynamics LLC"
                      value={companyName} 
                      onChange={(e) => setCompanyName(e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Email Address</label>
                    <input 
                      type="email" 
                      className="form-input" 
                      placeholder="e.g. sarah@quantumdyn.com"
                      value={email} 
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Phone Number</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="e.g. +1 (555) 019-2831"
                      value={phone} 
                      onChange={(e) => setPhone(e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Billing Address</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="Street, City, State, ZIP code"
                    value={address} 
                    onChange={(e) => setAddress(e.target.value)}
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Tax ID / GSTIN / VAT</label>
                    <input 
                      type="text" 
                      className="form-input font-mono" 
                      placeholder="e.g. GSTIN / VAT ID"
                      value={taxId} 
                      onChange={(e) => setTaxId(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Internal Notes</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="e.g. Net 30, preferential client"
                      value={notes} 
                      onChange={(e) => setNotes(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  <CheckCircle2 size={16} />
                  <span>{loading ? 'Saving...' : editingCustomer ? 'Update Customer' : 'Create Customer'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
