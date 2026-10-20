import React, { useState } from 'react';
import { ShoppingBag, Search, Plus, Eye, CreditCard, Trash2, X, Check, Truck } from 'lucide-react';
import { api } from '../services/api';
import ConfirmModal from './ConfirmModal';
import Loader from './Loader';

export default function PurchaseView({ purchases, suppliers, products, currency = '₹', onRefresh }) {
  const todayStr = new Date().toISOString().split('T')[0];

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [payModalOpen, setPayModalOpen] = useState(false);
  const [selectedPurchase, setSelectedPurchase] = useState(null);
  const [viewModalPurchase, setViewModalPurchase] = useState(null);
  const [deleteModalPurchase, setDeleteModalPurchase] = useState(null);
  const [isDeletingPurchase, setIsDeletingPurchase] = useState(false);

  // Form State
  const [supplierId, setSupplierId] = useState('');
  const [invoiceNo, setInvoiceNo] = useState('');
  const [purchaseDate, setPurchaseDate] = useState(todayStr);
  const [paymentMethod, setPaymentMethod] = useState('RTGS-NEFT');
  const [notes, setNotes] = useState('');
  const [transportCharges, setTransportCharges] = useState(0);
  const [roundOff, setRoundOff] = useState(0);
  const [amountPaidNow, setAmountPaidNow] = useState(0);
  const [items, setItems] = useState([
    { product_id: '', qty: 100, rate: 140, discount: 0, tax_percent: 18 }
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Payment form state
  const [payAmount, setPayAmount] = useState(0);
  const [payDate, setPayDate] = useState(todayStr);
  const [payMethod, setPayMethod] = useState('RTGS-NEFT');

  const formatMoney = (val) => `${currency} ${(Number(val) || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/-`;

  const handleOpenAdd = () => {
    setSupplierId(suppliers && suppliers.length > 0 ? suppliers[0].id : '');
    setInvoiceNo(`PUR-INV-${Math.floor(1000 + Math.random() * 9000)}`);
    setPurchaseDate(todayStr);
    setPaymentMethod('RTGS-NEFT');
    setNotes('');
    setTransportCharges(0);
    setRoundOff(0);
    setAmountPaidNow(0);
    setItems([{ product_id: products && products.length > 0 ? products[0].id : '', qty: 100, rate: products && products.length > 0 ? products[0].purchase_price : 100, discount: 0, tax_percent: 18 }]);
    setError(null);
    setModalOpen(true);
  };

  const handleProductSelect = (index, prodId) => {
    const updated = [...items];
    const prod = products.find(p => p.id === Number(prodId));
    if (prod) {
      updated[index] = {
        ...updated[index],
        product_id: prod.id,
        rate: prod.purchase_price,
        tax_percent: prod.tax_percent
      };
    }
    setItems(updated);
  };

  const handleItemChange = (index, field, val) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: val };
    setItems(updated);
  };

  const handleAddItem = () => {
    setItems([
      ...items,
      { product_id: products && products.length > 0 ? products[0].id : '', qty: 100, rate: 100, discount: 0, tax_percent: 18 }
    ]);
  };

  const handleRemoveItem = (index) => {
    if (items.length === 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  // Calculations
  const subtotal = items.reduce((acc, it) => acc + ((parseFloat(it.qty) || 0) * (parseFloat(it.rate) || 0)), 0);
  const discountSum = items.reduce((acc, it) => acc + (parseFloat(it.discount) || 0), 0);
  const taxSum = items.reduce((acc, it) => {
    const base = Math.max(0, ((parseFloat(it.qty) || 0) * (parseFloat(it.rate) || 0)) - (parseFloat(it.discount) || 0));
    return acc + (base * ((parseFloat(it.tax_percent) || 0) / 100.0));
  }, 0);
  const grandTotal = Math.max(0, subtotal - discountSum + taxSum + (parseFloat(transportCharges) || 0) + (parseFloat(roundOff) || 0));
  const balanceDue = Math.max(0, grandTotal - (parseFloat(amountPaidNow) || 0));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    if (!supplierId) {
      setError('Please select a supplier.');
      return;
    }
    if (!invoiceNo.trim()) {
      setError('Supplier invoice number is required.');
      return;
    }

    setLoading(true);
    try {
      await api.createPurchase({
        supplier_id: Number(supplierId),
        invoice_no: invoiceNo,
        date: purchaseDate,
        payment_method: paymentMethod,
        notes,
        transport_charges: parseFloat(transportCharges) || 0,
        round_off: parseFloat(roundOff) || 0,
        amount_paid_now: parseFloat(amountPaidNow) || 0,
        items: items.map(it => ({
          product_id: Number(it.product_id),
          qty: parseFloat(it.qty) || 1,
          rate: parseFloat(it.rate) || 0,
          discount: parseFloat(it.discount) || 0,
          tax_percent: parseFloat(it.tax_percent) || 0,
        }))
      });
      setModalOpen(false);
      onRefresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenPay = (p) => {
    setSelectedPurchase(p);
    setPayAmount(p.due);
    setPayDate(todayStr);
    setPayMethod(p.payment_method || 'Cash');
    setPayModalOpen(true);
  };

  const handleRecordPayment = async (e) => {
    e.preventDefault();
    if (!selectedPurchase) return;
    try {
      await api.addPurchasePayment(selectedPurchase.id, {
        amount: parseFloat(payAmount) || 0,
        date: payDate,
        payment_method: payMethod,
        bank_account_id: 1,
      });
      setPayModalOpen(false);
      onRefresh();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteClick = (p) => {
    setDeleteModalPurchase(p);
  };

  const handleConfirmDeletePurchase = async () => {
    if (!deleteModalPurchase) return;
    setIsDeletingPurchase(true);
    try {
      await api.deletePurchase(deleteModalPurchase.id);
      setDeleteModalPurchase(null);
      if (onRefresh) onRefresh();
    } catch (err) {
      alert(err.message || "Failed to delete purchase invoice");
    } finally {
      setIsDeletingPurchase(false);
    }
  };

  const handleView = async (id) => {
    try {
      const data = await api.getPurchase(id);
      setViewModalPurchase(data);
    } catch (err) {
      alert(err.message);
    }
  };

  const filtered = purchases.filter(p => {
    const q = search.toLowerCase();
    const matchesSearch = p.invoice_no?.toLowerCase().includes(q) || p.supplier_name?.toLowerCase().includes(q);
    const matchesStatus = statusFilter === 'all' || p.status?.toLowerCase() === statusFilter.toLowerCase();
    return matchesSearch && matchesStatus;
  });

  return (
    <div>
      {/* Header */}
      <div className="view-header">
        <div className="view-title-group">
          <h2>Purchase (Stock Inward & Supplier Bills)</h2>
          <p>Record stone slabs and tiles received from quarries, increase stock, and manage payables</p>
        </div>
        <div className="header-actions">
          <button className="btn btn-primary" onClick={handleOpenAdd}>
            <Plus size={16} />
            <span>+ Add Purchase</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="filter-bar">
        <div className="status-pills">
          <button className={`pill-btn ${statusFilter === 'all' ? 'active' : ''}`} onClick={() => setStatusFilter('all')}>All</button>
          <button className={`pill-btn ${statusFilter === 'Unpaid' ? 'active' : ''}`} onClick={() => setStatusFilter('Unpaid')}>Unpaid</button>
          <button className={`pill-btn ${statusFilter === 'Partly paid' ? 'active' : ''}`} onClick={() => setStatusFilter('Partly paid')}>Partly Paid</button>
          <button className={`pill-btn ${statusFilter === 'Paid' ? 'active' : ''}`} onClick={() => setStatusFilter('Paid')}>Paid</button>
        </div>

        <div className="search-input-wrap" style={{ width: '320px' }}>
          <Search />
          <input 
            type="text" 
            className="search-input" 
            placeholder="Search invoice # or supplier..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Purchases Table */}
      <div className="card">
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Sl.No</th>
                <th>Date</th>
                <th>Supplier Invoice #</th>
                <th>Supplier / Quarry</th>
                <th>Total Bill</th>
                <th>Paid</th>
                <th>Due</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered && filtered.length > 0 ? (
                filtered.map((p, idx) => (
                  <tr key={p.id}>
                    <td>{idx + 1}</td>
                    <td>{p.date}</td>
                    <td className="font-mono" style={{ fontWeight: 700, color: '#fff' }}>{p.invoice_no}</td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{p.supplier_name}</div>
                      {p.supplier_company && <div style={{ fontSize: '0.74rem', color: 'var(--text-dim)' }}>{p.supplier_company}</div>}
                    </td>
                    <td style={{ fontWeight: 700 }}>{formatMoney(p.total)}</td>
                    <td style={{ color: 'var(--success)', fontWeight: 600 }}>{formatMoney(p.paid)}</td>
                    <td style={{ color: p.due > 0 ? '#fbbf24' : 'var(--text-dim)', fontWeight: 700 }}>{formatMoney(p.due)}</td>
                    <td>
                      <span className={`badge ${p.status === 'Paid' ? 'badge-paid' : p.status === 'Partly paid' ? 'badge-partially_paid' : 'badge-overdue'}`}>
                        {p.status}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '4px' }}>
                        <button className="btn btn-sm btn-secondary" onClick={() => handleView(p.id)} title="View Purchase Details">
                          <Eye size={13} />
                        </button>
                        {p.due > 0 && (
                          <button className="btn btn-sm btn-success" onClick={() => handleOpenPay(p)} title="Add Payment">
                            <CreditCard size={13} />
                            <span>Pay</span>
                          </button>
                        )}
                        <button className="btn btn-sm btn-danger-outline" onClick={() => handleDeleteClick(p)} title="Delete Purchase">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="9" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                    No purchase records found. Click "+ Add Purchase" when stone consignments arrive.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Purchase Modal */}
      {modalOpen && (
        <div className="modal-overlay">
          <div className="modal-container modal-lg">
            <div className="modal-header">
              <h3>Add Purchase (Stone Stock Inward)</h3>
              <button className="modal-close-btn" onClick={() => setModalOpen(false)}><X size={20} /></button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
              <div className="modal-body">
                {error && (
                  <div style={{ padding: '0.75rem', background: 'var(--danger-bg)', border: '1px solid var(--danger-border)', color: 'var(--danger)', borderRadius: 'var(--radius-sm)', marginBottom: '1rem', fontSize: '0.84rem' }}>
                    {error}
                  </div>
                )}

                {/* Header Fields (Section 5.2) */}
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Supplier *</label>
                    <select className="form-select" value={supplierId} onChange={(e) => setSupplierId(e.target.value)} required>
                      {suppliers && suppliers.map(s => (
                        <option key={s.id} value={s.id}>{s.name} ({s.company || 'Quarry'})</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Supplier Invoice No *</label>
                    <input type="text" className="form-input font-mono" placeholder="e.g. RAJ/INV/8819" value={invoiceNo} onChange={(e) => setInvoiceNo(e.target.value)} required />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Purchase Date *</label>
                    <input type="date" className="form-input" value={purchaseDate} onChange={(e) => setPurchaseDate(e.target.value)} required />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Payment Method</label>
                    <select className="form-select" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
                      <option value="RTGS-NEFT">RTGS / NEFT</option>
                      <option value="Bank">Bank Transfer</option>
                      <option value="Cash">Cash</option>
                      <option value="UPI">UPI</option>
                      <option value="Cheque">Cheque</option>
                    </select>
                  </div>
                </div>

                {/* Item Rows */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem', marginBottom: '0.5rem' }}>
                  <label className="form-label" style={{ marginBottom: 0 }}>Consignment Items (Stone Slabs / Tiles)</label>
                  <button type="button" className="btn btn-sm btn-secondary" onClick={handleAddItem}>
                    <Plus size={14} />
                    <span>Add Row</span>
                  </button>
                </div>

                <div className="table-responsive">
                  <table className="items-table">
                    <thead>
                      <tr>
                        <th style={{ width: '30%' }}>Stone Item *</th>
                        <th style={{ width: '15%' }}>Quantity</th>
                        <th style={{ width: '15%' }}>Rate ({currency})</th>
                        <th style={{ width: '12%' }}>Discount</th>
                        <th style={{ width: '12%' }}>Tax %</th>
                        <th style={{ width: '12%', textAlign: 'right' }}>Total</th>
                        <th style={{ width: '4%' }}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((row, idx) => {
                        const base = (parseFloat(row.qty) || 0) * (parseFloat(row.rate) || 0) - (parseFloat(row.discount) || 0);
                        const rowTot = base + (base * ((parseFloat(row.tax_percent) || 0) / 100));
                        return (
                          <tr key={idx}>
                            <td>
                              <select 
                                style={{ width: '100%', padding: '0.45rem', background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', color: '#fff', borderRadius: '4px' }}
                                value={row.product_id}
                                onChange={(e) => handleProductSelect(idx, e.target.value)}
                                required
                              >
                                {products && products.map(p => (
                                  <option key={p.id} value={p.id}>{p.name} ({p.unit})</option>
                                ))}
                              </select>
                            </td>
                            <td>
                              <input type="number" step="any" min="0.1" value={row.qty} onChange={(e) => handleItemChange(idx, 'qty', e.target.value)} required />
                            </td>
                            <td>
                              <input type="number" step="0.01" min="0" value={row.rate} onChange={(e) => handleItemChange(idx, 'rate', e.target.value)} required />
                            </td>
                            <td>
                              <input type="number" step="0.01" min="0" value={row.discount} onChange={(e) => handleItemChange(idx, 'discount', e.target.value)} />
                            </td>
                            <td>
                              <input type="number" step="0.1" min="0" value={row.tax_percent} onChange={(e) => handleItemChange(idx, 'tax_percent', e.target.value)} />
                            </td>
                            <td style={{ textAlign: 'right', fontWeight: 600, color: '#fff' }}>
                              {formatMoney(rowTot)}
                            </td>
                            <td style={{ textAlign: 'center' }}>
                              {items.length > 1 && (
                                <button type="button" onClick={() => handleRemoveItem(idx)} style={{ background: 'transparent', border: 'none', color: 'var(--danger)', cursor: 'pointer' }}>
                                  <Trash2 size={15} />
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Footer Fields (Section 5.2) */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '1.5rem', marginTop: '1rem' }}>
                  <div>
                    <div className="form-group">
                      <label className="form-label">Transport / Loading Charges ({currency})</label>
                      <input type="number" step="0.01" min="0" className="form-input" value={transportCharges} onChange={(e) => setTransportCharges(e.target.value)} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Notes</label>
                      <input type="text" className="form-input" placeholder="Consignment truck #, driver notes..." value={notes} onChange={(e) => setNotes(e.target.value)} />
                    </div>
                  </div>

                  <div className="totals-summary-box">
                    <div className="totals-summary-row">
                      <span>Subtotal:</span>
                      <span>{formatMoney(subtotal)}</span>
                    </div>
                    <div className="totals-summary-row">
                      <span>Tax Amount:</span>
                      <span>{formatMoney(taxSum)}</span>
                    </div>
                    <div className="totals-summary-row">
                      <span>Transport:</span>
                      <span>{formatMoney(transportCharges)}</span>
                    </div>
                    <div className="totals-summary-row grand-total">
                      <span>Grand Total:</span>
                      <span>{formatMoney(grandTotal)}</span>
                    </div>
                    <div className="totals-summary-row" style={{ marginTop: '0.6rem' }}>
                      <span>Amount Paid Now ({currency}):</span>
                      <input 
                        type="number" 
                        step="0.01" 
                        min="0"
                        style={{ width: '100px', padding: '0.2rem 0.4rem', background: 'var(--bg-primary)', border: '1px solid var(--border-subtle)', color: '#fff', textAlign: 'right' }}
                        value={amountPaidNow} 
                        onChange={(e) => setAmountPaidNow(e.target.value)} 
                      />
                    </div>
                    <div className="totals-summary-row" style={{ color: '#fbbf24', fontWeight: 700 }}>
                      <span>Balance Due:</span>
                      <span>{formatMoney(balanceDue)}</span>
                    </div>
                  </div>
                </div>

              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  <Check size={16} />
                  <span>{loading ? 'Saving...' : 'Save Purchase & Update Stock'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {payModalOpen && selectedPurchase && (
        <div className="modal-overlay">
          <div className="modal-container" style={{ maxWidth: '420px' }}>
            <div className="modal-header">
              <h3>Record Supplier Payment</h3>
              <button className="modal-close-btn" onClick={() => setPayModalOpen(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleRecordPayment}>
              <div className="modal-body">
                <p style={{ fontSize: '0.85rem', marginBottom: '1rem', color: 'var(--text-muted)' }}>
                  Payable to <strong>{selectedPurchase.supplier_name}</strong> for invoice <strong>{selectedPurchase.invoice_no}</strong>.
                  Current Due: <strong style={{ color: '#fbbf24' }}>{formatMoney(selectedPurchase.due)}</strong>
                </p>

                <div className="form-group">
                  <label className="form-label">Payment Amount ({currency}) *</label>
                  <input type="number" step="0.01" min="0.01" className="form-input" value={payAmount} onChange={(e) => setPayAmount(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Payment Date</label>
                  <input type="date" className="form-input" value={payDate} onChange={(e) => setPayDate(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Payment Method</label>
                  <select className="form-select" value={payMethod} onChange={(e) => setPayMethod(e.target.value)}>
                    <option value="RTGS-NEFT">RTGS / NEFT</option>
                    <option value="Bank">Bank Transfer</option>
                    <option value="Cash">Cash</option>
                    <option value="UPI">UPI</option>
                    <option value="Cheque">Cheque</option>
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setPayModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-success">Record Payment</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Purchase Modal */}
      {viewModalPurchase && (
        <div className="modal-overlay">
          <div className="modal-container" style={{ maxWidth: '640px' }}>
            <div className="modal-header">
              <h3>Purchase Bill #{viewModalPurchase.purchase.invoice_no}</h3>
              <button className="modal-close-btn" onClick={() => setViewModalPurchase(null)}><X size={20} /></button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem', background: 'var(--bg-secondary)', padding: '1rem', borderRadius: '6px' }}>
                <div>
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Supplier:</div>
                  <strong style={{ color: '#fff' }}>{viewModalPurchase.purchase.supplier_name}</strong>
                  <div style={{ fontSize: '0.78rem' }}>{viewModalPurchase.purchase.supplier_company}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Date & Method:</div>
                  <div>{viewModalPurchase.purchase.date} via {viewModalPurchase.purchase.payment_method}</div>
                  <div>Status: <span className="badge badge-paid">{viewModalPurchase.purchase.status}</span></div>
                </div>
              </div>

              <table className="data-table">
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>Qty</th>
                    <th>Rate</th>
                    <th style={{ textAlign: 'right' }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {viewModalPurchase.items && viewModalPurchase.items.map((it, i) => (
                    <tr key={i}>
                      <td>{it.product_name} ({it.unit})</td>
                      <td>{it.qty}</td>
                      <td>{formatMoney(it.rate)}</td>
                      <td style={{ textAlign: 'right', fontWeight: 600 }}>{formatMoney(it.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div style={{ textAlign: 'right', marginTop: '1rem', fontSize: '0.9rem' }}>
                <div>Total Bill: <strong>{formatMoney(viewModalPurchase.purchase.total)}</strong></div>
                <div style={{ color: 'var(--success)' }}>Paid: <strong>{formatMoney(viewModalPurchase.purchase.paid)}</strong></div>
                <div style={{ color: '#fbbf24' }}>Due: <strong>{formatMoney(viewModalPurchase.purchase.due)}</strong></div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setViewModalPurchase(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Delete Purchase Modal */}
      <ConfirmModal
        isOpen={Boolean(deleteModalPurchase)}
        title="Delete Purchase Invoice"
        message={deleteModalPurchase ? ("Are you sure you want to delete purchase invoice " + deleteModalPurchase.invoice_no + "? This will reverse stone inventory additions and supplier payables.") : ""}
        confirmText="Delete Purchase & Reverse Stock"
        isLoading={isDeletingPurchase}
        onCancel={() => !isDeletingPurchase && setDeleteModalPurchase(null)}
        onConfirm={handleConfirmDeletePurchase}
        itemDetails={deleteModalPurchase ? (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
              <span style={{ color: "#94a3b8" }}>Invoice No:</span>
              <strong style={{ color: "#f8fafc" }}>{deleteModalPurchase.invoice_no}</strong>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
              <span style={{ color: "#94a3b8" }}>Supplier:</span>
              <strong style={{ color: "#38bdf8" }}>{deleteModalPurchase.supplier_name}</strong>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
              <span style={{ color: "#94a3b8" }}>Total:</span>
              <strong style={{ color: "#34d399" }}>{formatMoney(deleteModalPurchase.total)}</strong>
            </div>
          </div>
        ) : null}
      />
    </div>
  );
}
