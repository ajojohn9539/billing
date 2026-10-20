import React, { useState, useEffect } from 'react';
import { AlertTriangle, Plus, Trash2, Search, X, Check, FileSpreadsheet } from 'lucide-react';
import { api } from '../services/api';
import ConfirmModal from './ConfirmModal';
import Loader from './Loader';

export default function DamageEntryView({ products, currency = '₹', onRefresh }) {
  const todayStr = new Date().toISOString().split('T')[0];

  const [damages, setDamages] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);

  // Form State
  const [date, setDate] = useState(todayStr);
  const [productId, setProductId] = useState('');
  const [qty, setQty] = useState(1);
  const [reason, setReason] = useState('Broken in transit');
  const [remarks, setRemarks] = useState('');
  const [formError, setFormError] = useState(null);
  const [deleteModalDamage, setDeleteModalDamage] = useState(null);
  const [isDeletingDamage, setIsDeletingDamage] = useState(false);

  const formatMoney = (val) => `${currency} ${(Number(val) || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/-`;

  const loadDamages = () => {
    setLoading(true);
    api.getDamages()
      .then(res => setDamages(res))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadDamages();
  }, []);

  const handleOpenAdd = () => {
    setDate(todayStr);
    setProductId(products && products.length > 0 ? products[0].id : '');
    setQty(1);
    setReason('Broken in transit');
    setRemarks('');
    setFormError(null);
    setModalOpen(true);
  };

  const selectedProduct = products.find(p => p.id === Number(productId));
  const estimatedLoss = selectedProduct ? (selectedProduct.purchase_price * (parseFloat(qty) || 0)) : 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);
    if (!productId) {
      setFormError('Please select a stone product.');
      return;
    }
    const qVal = parseFloat(qty);
    if (!qVal || qVal <= 0) {
      setFormError('Quantity must be greater than 0.');
      return;
    }

    try {
      await api.createDamage({
        date,
        product_id: Number(productId),
        qty: qVal,
        reason,
        remarks,
      });
      setModalOpen(false);
      loadDamages();
      onRefresh();
    } catch (err) {
      setFormError(err.message);
    }
  };

  const handleDeleteClick = (d) => {
    setDeleteModalDamage(d);
  };

  const handleConfirmDeleteDamage = async () => {
    if (!deleteModalDamage) return;
    setIsDeletingDamage(true);
    try {
      await api.deleteDamage(deleteModalDamage.id);
      setDeleteModalDamage(null);
      loadDamages();
      if (onRefresh) onRefresh();
    } catch (err) {
      alert(err.message || "Failed to remove damage record");
    } finally {
      setIsDeletingDamage(false);
    }
  };

  const totalLoss = damages.reduce((acc, d) => acc + (parseFloat(d.cost_value) || 0), 0);

  const filtered = damages.filter(d => {
    const q = search.toLowerCase();
    return d.product_name?.toLowerCase().includes(q) || d.reason?.toLowerCase().includes(q) || d.remarks?.toLowerCase().includes(q);
  });

  return (
    <div>
      {/* Header */}
      <div className="view-header">
        <div className="view-title-group">
          <h2>Damage Entry & Stone Loss Tracking</h2>
          <p>Record cracked, broken, or cutting loss stone slabs, reduce stock automatically, and compute loss values</p>
        </div>
        <div className="header-actions">
          <div style={{ textAlign: 'right', marginRight: '1rem' }}>
            <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Total Damage Loss</span>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--danger)' }}>
              {formatMoney(totalLoss)}
            </div>
          </div>
          <button className="btn btn-primary" onClick={handleOpenAdd}>
            <Plus size={16} />
            <span>+ Record Damage</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="filter-bar">
        <div className="search-input-wrap" style={{ width: '320px' }}>
          <Search />
          <input 
            type="text" 
            className="search-input" 
            placeholder="Search damaged item, reason..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <span style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>
          {filtered.length} damage records logged
        </span>
      </div>

      {/* Table */}
      <div className="card">
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Sl.No</th>
                <th>Date</th>
                <th>Damaged Stone Item</th>
                <th>Quantity Damaged</th>
                <th>Reason</th>
                <th>Purchase Cost Rate</th>
                <th>Calculated Loss Value</th>
                <th>Remarks / Cause</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered && filtered.length > 0 ? (
                filtered.map((d, idx) => (
                  <tr key={d.id}>
                    <td>{idx + 1}</td>
                    <td>{d.date}</td>
                    <td>
                      <div style={{ fontWeight: 700, color: '#fff' }}>{d.product_name}</div>
                      <div className="font-mono" style={{ fontSize: '0.74rem', color: 'var(--text-dim)' }}>{d.product_code}</div>
                    </td>
                    <td style={{ fontWeight: 700, color: '#fbbf24' }}>
                      {d.qty} {d.unit}
                    </td>
                    <td>
                      <span className="badge" style={{ background: 'rgba(239, 68, 68, 0.12)', color: '#f87171' }}>
                        {d.reason}
                      </span>
                    </td>
                    <td>{formatMoney(d.purchase_price)}</td>
                    <td style={{ fontWeight: 700, color: 'var(--danger)' }}>
                      {formatMoney(d.cost_value)}
                    </td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)', maxWidth: '240px' }}>
                      {d.remarks || '—'}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button className="btn btn-sm btn-danger-outline" onClick={() => handleDeleteClick(d)} title="Restore Stock & Delete">
                        <Trash2 size={13} />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="9" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                    No damaged stone logged. Click "+ Record Damage" when stone breakage or cutting loss occurs.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Damage Modal (Section 7) */}
      {modalOpen && (
        <div className="modal-overlay">
          <div className="modal-container" style={{ maxWidth: '520px' }}>
            <div className="modal-header">
              <h3>Record Stone Damage / Breakage</h3>
              <button className="modal-close-btn" onClick={() => setModalOpen(false)}><X size={20} /></button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                {formError && (
                  <div style={{ padding: '0.75rem', background: 'var(--danger-bg)', border: '1px solid var(--danger-border)', color: 'var(--danger)', borderRadius: 'var(--radius-sm)', marginBottom: '1rem', fontSize: '0.84rem' }}>
                    {formError}
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label">Date of Breakage / Damage *</label>
                  <input type="date" className="form-input" value={date} onChange={(e) => setDate(e.target.value)} required />
                </div>

                <div className="form-group">
                  <label className="form-label">Stone Product *</label>
                  <select className="form-select" value={productId} onChange={(e) => setProductId(e.target.value)} required>
                    {products && products.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name} (Stock: {p.current_stock} {p.unit} @ {formatMoney(p.purchase_price)})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Damaged Quantity *</label>
                    <input type="number" step="any" min="0.1" className="form-input" value={qty} onChange={(e) => setQty(e.target.value)} required />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Reason *</label>
                    <select className="form-select" value={reason} onChange={(e) => setReason(e.target.value)}>
                      <option value="Broken in transit">Broken in transit</option>
                      <option value="Cutting loss">Cutting loss</option>
                      <option value="Handling">Handling & crane accident</option>
                      <option value="Other">Other natural crack / defect</option>
                    </select>
                  </div>
                </div>

                {/* Auto Cost Value Notice */}
                <div style={{ background: 'var(--bg-secondary)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)', marginBottom: '1rem' }}>
                  <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>Estimated Loss Value (auto = purchase price × qty):</div>
                  <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--danger)', marginTop: '2px' }}>
                    {formatMoney(estimatedLoss)}
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Remarks / Incident Description</label>
                  <textarea 
                    className="form-textarea" 
                    rows="2" 
                    placeholder="e.g. Unloading crane sling slip caused cracked corners..." 
                    value={remarks} 
                    onChange={(e) => setRemarks(e.target.value)} 
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">
                  <Check size={16} />
                  <span>Deduct Stock & Record Loss</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirm Delete Damage Modal */}
      <ConfirmModal
        isOpen={Boolean(deleteModalDamage)}
        title="Delete Damage Record"
        message={deleteModalDamage ? ("Are you sure you want to remove damage entry for " + deleteModalDamage.product_name + "? This will restore stone quantity back into active inventory.") : ""}
        confirmText="Delete & Restore Stock"
        isLoading={isDeletingDamage}
        onCancel={() => !isDeletingDamage && setDeleteModalDamage(null)}
        onConfirm={handleConfirmDeleteDamage}
        itemDetails={deleteModalDamage ? (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
              <span style={{ color: "#94a3b8" }}>Product:</span>
              <strong style={{ color: "#f8fafc" }}>{deleteModalDamage.product_name}</strong>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
              <span style={{ color: "#94a3b8" }}>Damaged Qty:</span>
              <strong style={{ color: "#f87171" }}>{deleteModalDamage.qty} {deleteModalDamage.unit}</strong>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
              <span style={{ color: "#94a3b8" }}>Reason:</span>
              <span style={{ color: "#fbbf24" }}>{deleteModalDamage.reason}</span>
            </div>
          </div>
        ) : null}
      />
    </div>
  );
}
