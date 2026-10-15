import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Search, 
  Plus, 
  Edit3, 
  Trash2, 
  Mail, 
  Phone, 
  MapPin, 
  FileText, 
  X, 
  CheckCircle2,
  Sliders,
  Sparkles
} from 'lucide-react';
import { api } from '../services/api';
import Loader from './Loader';

export default function CustomersView({ 
  customers = [], 
  currency, 
  onRefresh, 
  onSelectCustomerInvoices 
}) {
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  
  // Standard Form state
  const [name, setName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [gstin, setGstin] = useState('');
  const [notes, setNotes] = useState('');
  const [contactType, setContactType] = useState('Customer');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  // Dynamic Client Fields State
  const [dynamicFields, setDynamicFields] = useState([]);
  const [customFieldValues, setCustomFieldValues] = useState({});

  useEffect(() => {
    loadDynamicFields();
  }, []);

  const loadDynamicFields = async () => {
    try {
      const fields = await api.getClientFields(true);
      setDynamicFields(fields || []);
    } catch (e) {
      console.warn('Could not load dynamic fields in CustomersView:', e);
    }
  };

  const formatMoney = (val) => `${currency} ${(Number(val) || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const openAddModal = () => {
    setEditingCustomer(null);
    setName('');
    setCompanyName('');
    setEmail('');
    setPhone('');
    setAddress('');
    setGstin('');
    setNotes('');
    setContactType('Customer');
    
    // Initialize default custom field values
    const initCustom = {};
    dynamicFields.forEach(f => {
      initCustom[f.field_key] = f.default_value || '';
    });
    setCustomFieldValues(initCustom);
    setError(null);
    setModalOpen(true);
  };

  const openEditModal = (cust) => {
    setEditingCustomer(cust);
    setName(cust.name || '');
    setCompanyName(cust.company || cust.company_name || '');
    setEmail(cust.email || '');
    setPhone(cust.phone || '');
    setAddress(cust.address || cust.billing_address || '');
    setGstin(cust.gstin || cust.tax_id || '');
    setNotes(cust.notes || '');
    setContactType(cust.type || 'Customer');

    // Parse existing custom fields
    let existingCustom = {};
    if (cust.custom_fields) {
      try {
        existingCustom = typeof cust.custom_fields === 'string' 
          ? JSON.parse(cust.custom_fields) 
          : cust.custom_fields;
      } catch (e) {
        existingCustom = {};
      }
    }
    setCustomFieldValues(existingCustom);
    setError(null);
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    if (!name.trim()) {
      setError('Contact / Customer name is required.');
      return;
    }

    setLoading(true);
    const payload = {
      type: contactType,
      name: name.trim(),
      company: companyName.trim(),
      email: email.trim(),
      phone: phone.trim(),
      address: address.trim(),
      gstin: gstin.trim(),
      notes: notes.trim(),
      custom_fields: customFieldValues,
      status: 'Active'
    };

    try {
      if (editingCustomer) {
        await api.updateContact(editingCustomer.id, payload);
      } else {
        await api.createContact(payload);
      }
      setModalOpen(false);
      onRefresh();
    } catch (err) {
      setError(err.message || 'Failed to save customer');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, custName) => {
    if (!window.confirm(`Are you sure you want to delete customer "${custName}"?`)) return;
    try {
      await api.deleteContact(id);
      onRefresh();
    } catch (err) {
      alert(err.message || 'Cannot delete contact');
    }
  };

  const filtered = customers.filter(c => {
    const q = search.toLowerCase();
    const nameMatch = (c.name || '').toLowerCase().includes(q);
    const compMatch = (c.company || c.company_name || '').toLowerCase().includes(q);
    const emailMatch = (c.email || '').toLowerCase().includes(q);
    const phoneMatch = (c.phone || '').includes(q);
    const gstinMatch = (c.gstin || c.tax_id || '').toLowerCase().includes(q);
    return nameMatch || compMatch || emailMatch || phoneMatch || gstinMatch;
  });

  return (
    <div>
      {/* Header */}
      <div className="view-header">
        <div className="view-title-group">
          <h2>Customer & Client Directory</h2>
          <p>Client accounts, dynamic attributes, billing history, and ledger balances</p>
        </div>
        <div className="header-actions">
          <button className="btn btn-primary" onClick={openAddModal}>
            <Plus size={16} />
            <span>Add Client / Customer</span>
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="filter-bar">
        <div className="search-input-wrap" style={{ width: '320px' }}>
          <Search size={16} />
          <input 
            type="text" 
            className="search-input" 
            placeholder="Search by client name, GSTIN, route..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <span style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>
          Showing {filtered.length} active client profiles
        </span>
      </div>

      {/* Customers Table Card */}
      <div className="card">
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Customer / Firm</th>
                <th>Contact Details</th>
                <th>GSTIN</th>
                <th>Dynamic Client Attributes</th>
                <th>Type</th>
                <th>Receivable Balance</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered && filtered.length > 0 ? (
                filtered.map((c) => {
                  let cFields = {};
                  try {
                    cFields = typeof c.custom_fields === 'string' ? JSON.parse(c.custom_fields) : (c.custom_fields || {});
                  } catch (e) {
                    cFields = {};
                  }

                  const bal = Number(c.current_balance !== undefined ? c.current_balance : (c.balance_due || 0));

                  return (
                    <tr key={c.id}>
                      <td>
                        <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.94rem' }}>{c.name}</div>
                        {(c.company || c.company_name) && (
                          <div style={{ fontSize: '0.78rem', color: '#64748b' }}>{c.company || c.company_name}</div>
                        )}
                        {(c.address || c.billing_address) && (
                          <div style={{ fontSize: '0.74rem', color: '#64748b', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <MapPin size={12} color="#0284c7" />
                            <span>{c.address || c.billing_address}</span>
                          </div>
                        )}
                      </td>
                      <td>
                        {c.email && (
                          <div style={{ fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Mail size={12} style={{ color: '#64748b' }} />
                            <span>{c.email}</span>
                          </div>
                        )}
                        {c.phone && (
                          <div style={{ fontSize: '0.8rem', color: '#334155', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px', fontWeight: 600 }}>
                            <Phone size={12} style={{ color: '#0284c7' }} />
                            <span>{c.phone}</span>
                          </div>
                        )}
                      </td>
                      <td className="font-mono" style={{ fontSize: '0.8rem', color: '#0284c7', fontWeight: 600 }}>
                        {c.gstin || c.tax_id || '—'}
                      </td>
                      <td>
                        {Object.keys(cFields).length > 0 ? (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', maxWidth: '280px' }}>
                            {cFields.site_address && (
                              <span style={{ background: '#f0f9ff', color: '#0369a1', padding: '2px 6px', borderRadius: '4px', fontSize: '0.72rem', fontWeight: 600 }}>
                                Site: {cFields.site_address}
                              </span>
                            )}
                            {cFields.contractor_name && (
                              <span style={{ background: '#f8fafc', color: '#334155', padding: '2px 6px', borderRadius: '4px', fontSize: '0.72rem', border: '1px solid #e2e8f0' }}>
                                Arch: {cFields.contractor_name}
                              </span>
                            )}
                            {cFields.alternate_phone && (
                              <span style={{ background: '#f8fafc', color: '#334155', padding: '2px 6px', borderRadius: '4px', fontSize: '0.72rem', border: '1px solid #e2e8f0' }}>
                                Alt: {cFields.alternate_phone}
                              </span>
                            )}
                            {cFields.stone_preference && (
                              <span style={{ background: '#ecfdf5', color: '#047857', padding: '2px 6px', borderRadius: '4px', fontSize: '0.72rem' }}>
                                {cFields.stone_preference}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span style={{ color: '#94a3b8', fontSize: '0.78rem' }}>None</span>
                        )}
                      </td>
                      <td>
                        <span style={{
                          background: c.type === 'Supplier' ? '#fef3c7' : '#e0f2fe',
                          color: c.type === 'Supplier' ? '#92400e' : '#0369a1',
                          padding: '3px 8px',
                          borderRadius: '6px',
                          fontSize: '0.74rem',
                          fontWeight: 700
                        }}>
                          {c.type || 'Customer'}
                        </span>
                      </td>
                      <td>
                        <span style={{ 
                          fontWeight: 800, 
                          color: bal > 0 ? '#b45309' : '#16a34a',
                          fontSize: '0.92rem'
                        }}>
                          {formatMoney(bal)}
                        </span>
                        {bal > 0 && <div style={{ fontSize: '0.7rem', color: '#b45309' }}>Pending Due</div>}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '0.35rem' }}>
                          <button 
                            className="btn btn-sm btn-secondary" 
                            onClick={() => openEditModal(c)}
                            title="Edit Customer Details & Dynamic Fields"
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
                  );
                })
              ) : (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                    No client profiles found. Click "Add Client / Customer" to register one.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Customer Add/Edit Modal with Dynamic Fields */}
      {modalOpen && (
        <div className="modal-overlay" style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(4px)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <div className="modal-container" style={{ maxWidth: '640px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="modal-header">
              <h3>{editingCustomer ? 'Edit Client Profile' : 'Register New Client / Customer'}</h3>
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
                    <label className="form-label">Contact Type</label>
                    <select
                      className="form-input"
                      value={contactType}
                      onChange={(e) => setContactType(e.target.value)}
                    >
                      <option value="Customer">Customer (Client / Builder)</option>
                      <option value="Supplier">Supplier (Quarry / Vendor)</option>
                      <option value="Both">Both (Customer & Supplier)</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Contact / Client Name *</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="e.g. Kovoor Builders & Developers"
                      value={name} 
                      onChange={(e) => setName(e.target.value)}
                      required 
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Company / Firm Name</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="e.g. Kovoor Infrastructure Pvt Ltd"
                      value={companyName} 
                      onChange={(e) => setCompanyName(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Phone / Mobile *</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="e.g. 9447101122"
                      value={phone} 
                      onChange={(e) => setPhone(e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Email Address</label>
                    <input 
                      type="email" 
                      className="form-input" 
                      placeholder="e.g. office@kovoorbuilders.in"
                      value={email} 
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">15-Digit GSTIN Number</label>
                    <input 
                      type="text" 
                      className="form-input font-mono" 
                      placeholder="e.g. 32AAACK4455M1Z2"
                      value={gstin} 
                      onChange={(e) => setGstin(e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Delivery / Billing Address</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="Site location, City, State, PIN code"
                    value={address} 
                    onChange={(e) => setAddress(e.target.value)}
                  />
                </div>

                {/* DYNAMIC CLIENT FIELDS SECTION */}
                {dynamicFields && dynamicFields.length > 0 && (
                  <div style={{
                    marginTop: '16px',
                    padding: '16px',
                    background: '#f8fafc',
                    borderRadius: '10px',
                    border: '1px solid #e2e8f0'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px' }}>
                      <Sliders size={16} color="#0284c7" />
                      <span style={{ fontSize: '0.88rem', fontWeight: 700, color: '#0369a1' }}>
                        Dynamic Client Attributes (Configured in Admin Panel)
                      </span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      {dynamicFields.map((f) => (
                        <div key={f.id} className="form-group" style={{ marginBottom: 0 }}>
                          <label className="form-label" style={{ fontSize: '0.78rem', fontWeight: 600, color: '#334155' }}>
                            {f.field_label} {f.is_required && <span style={{ color: '#ef4444' }}>*</span>}
                          </label>

                          {f.field_type === 'select' ? (
                            <select
                              className="form-input"
                              style={{ fontSize: '0.84rem' }}
                              value={customFieldValues[f.field_key] || ''}
                              onChange={(e) => setCustomFieldValues({
                                ...customFieldValues,
                                [f.field_key]: e.target.value
                              })}
                              required={Boolean(f.is_required)}
                            >
                              <option value="">-- {f.placeholder || 'Select Option'} --</option>
                              {f.options.split(',').map((opt, i) => (
                                <option key={i} value={opt.trim()}>{opt.trim()}</option>
                              ))}
                            </select>
                          ) : f.field_type === 'boolean' ? (
                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', marginTop: '6px' }}>
                              <input
                                type="checkbox"
                                checked={Boolean(customFieldValues[f.field_key])}
                                onChange={(e) => setCustomFieldValues({
                                  ...customFieldValues,
                                  [f.field_key]: e.target.checked
                                })}
                              />
                              <span style={{ fontSize: '0.82rem' }}>{f.field_label}</span>
                            </label>
                          ) : (
                            <input
                              type={f.field_type === 'number' ? 'number' : f.field_type === 'date' ? 'date' : 'text'}
                              className="form-input"
                              style={{ fontSize: '0.84rem' }}
                              placeholder={f.placeholder || ''}
                              value={customFieldValues[f.field_key] || ''}
                              onChange={(e) => setCustomFieldValues({
                                ...customFieldValues,
                                [f.field_key]: e.target.value
                              })}
                              required={Boolean(f.is_required)}
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="form-group" style={{ marginTop: '14px' }}>
                  <label className="form-label">Internal Client Notes</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="e.g. VIP developer, special granite contractor terms"
                    value={notes} 
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)} disabled={loading}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  <CheckCircle2 size={16} />
                  <span>{loading ? 'Saving Profile...' : editingCustomer ? 'Update Client' : 'Create Client'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
