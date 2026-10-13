import React, { useState } from 'react';
import { FileText, Search, Plus, Eye, CreditCard, Trash2, X, Check, Printer, Truck } from 'lucide-react';
import { api } from '../services/api';

export default function SalesView({ sales, customers, products, currency = '₹', onRefresh }) {
  const todayStr = new Date().toISOString().split('T')[0];

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [payModalOpen, setPayModalOpen] = useState(false);
  const [selectedSale, setSelectedSale] = useState(null);
  const [printModalSale, setPrintModalSale] = useState(null);

  // Form State
  const [customerId, setCustomerId] = useState('');
  const [billNo, setBillNo] = useState('');
  const [saleDate, setSaleDate] = useState(todayStr);
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [vehicleNo, setVehicleNo] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [transportCharges, setTransportCharges] = useState(0);
  const [roundOff, setRoundOff] = useState(0);
  const [amountReceived, setAmountReceived] = useState(0);
  const [items, setItems] = useState([
    { product_id: '', qty: 50, rate: 195, discount: 0, tax_percent: 18 }
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Receipt Modal State
  const [payAmount, setPayAmount] = useState(0);
  const [payDate, setPayDate] = useState(todayStr);
  const [payMethod, setPayMethod] = useState('Cash');

  const formatMoney = (val) => `${currency} ${(Number(val) || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/-`;

  const handleOpenAdd = async () => {
    try {
      const res = await api.getNextBillNo();
      setBillNo(res.bill_no);
    } catch (e) {
      setBillNo(`RP/BILL/${new Date().getFullYear()}/0001`);
    }

    setCustomerId(customers && customers.length > 0 ? customers[0].id : '');
    setSaleDate(todayStr);
    setPaymentMethod('Cash');
    setVehicleNo('');
    setDeliveryAddress('');
    setNotes('');
    setTransportCharges(0);
    setRoundOff(0);
    setAmountReceived(0);

    const firstProd = products && products.length > 0 ? products[0] : null;
    setItems([{
      product_id: firstProd ? firstProd.id : '',
      qty: 20,
      rate: firstProd ? firstProd.selling_price : 195,
      discount: 0,
      tax_percent: firstProd ? firstProd.tax_percent : 18
    }]);

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
        rate: prod.selling_price,
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
    const firstProd = products && products.length > 0 ? products[0] : null;
    setItems([
      ...items,
      { product_id: firstProd ? firstProd.id : '', qty: 10, rate: firstProd ? firstProd.selling_price : 100, discount: 0, tax_percent: 18 }
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
  const balanceDue = Math.max(0, grandTotal - (parseFloat(amountReceived) || 0));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!customerId) {
      setError('Please select a customer.');
      return;
    }

    setLoading(true);
    try {
      await api.createSale({
        customer_id: Number(customerId),
        bill_no: billNo,
        date: saleDate,
        payment_method: paymentMethod,
        vehicle_no: vehicleNo,
        delivery_address: deliveryAddress,
        notes,
        transport_charges: parseFloat(transportCharges) || 0,
        round_off: parseFloat(roundOff) || 0,
        amount_received: parseFloat(amountReceived) || 0,
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

  const handleOpenReceipt = (s) => {
    setSelectedSale(s);
    setPayAmount(s.due);
    setPayDate(todayStr);
    setPayMethod(s.payment_method || 'Cash');
    setPayModalOpen(true);
  };

  const handleRecordReceipt = async (e) => {
    e.preventDefault();
    if (!selectedSale) return;
    try {
      await api.addSaleReceipt(selectedSale.id, {
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

  const handleDelete = async (id, billNum) => {
    if (!window.confirm(`Are you sure you want to delete sales bill ${billNum}? This will restore stone items back to inventory.`)) return;
    try {
      await api.deleteSale(id);
      onRefresh();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleViewAndPrint = async (id) => {
    try {
      const data = await api.getSale(id);
      setPrintModalSale(data);
    } catch (err) {
      alert(err.message);
    }
  };

  const filtered = sales.filter(s => {
    const q = search.toLowerCase();
    const matchesSearch = s.bill_no?.toLowerCase().includes(q) || s.customer_name?.toLowerCase().includes(q) || s.vehicle_no?.toLowerCase().includes(q);
    const matchesStatus = statusFilter === 'all' || s.status?.toLowerCase() === statusFilter.toLowerCase();
    return matchesSearch && matchesStatus;
  });

  return (
    <div>
      {/* Header */}
      <div className="view-header">
        <div className="view-title-group">
          <h2>Sales & Billing (Stock Outward)</h2>
          <p>Issue GST tax invoices for granite & marble, track transport vehicle delivery, and manage customer dues</p>
        </div>
        <div className="header-actions">
          <button className="btn btn-primary" onClick={handleOpenAdd}>
            <Plus size={16} />
            <span>+ Create Bill</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="filter-bar">
        <div className="status-pills">
          <button className={`pill-btn ${statusFilter === 'all' ? 'active' : ''}`} onClick={() => setStatusFilter('all')}>All Bills</button>
          <button className={`pill-btn ${statusFilter === 'Unpaid' ? 'active' : ''}`} onClick={() => setStatusFilter('Unpaid')}>Unpaid</button>
          <button className={`pill-btn ${statusFilter === 'Partly paid' ? 'active' : ''}`} onClick={() => setStatusFilter('Partly paid')}>Partly Paid</button>
          <button className={`pill-btn ${statusFilter === 'Paid' ? 'active' : ''}`} onClick={() => setStatusFilter('Paid')}>Paid</button>
        </div>

        <div className="search-input-wrap" style={{ width: '320px' }}>
          <Search />
          <input 
            type="text" 
            className="search-input" 
            placeholder="Search bill #, customer, vehicle #..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Sales Table */}
      <div className="card">
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Sl.No</th>
                <th>Date</th>
                <th>Bill Number</th>
                <th>Customer / Builder</th>
                <th>Vehicle #</th>
                <th>Total</th>
                <th>Received</th>
                <th>Balance Due</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered && filtered.length > 0 ? (
                filtered.map((s, idx) => (
                  <tr key={s.id}>
                    <td>{idx + 1}</td>
                    <td>{s.date}</td>
                    <td className="font-mono" style={{ fontWeight: 700, color: '#fff' }}>
                      <span style={{ cursor: 'pointer', textDecoration: 'underline' }} onClick={() => handleViewAndPrint(s.id)}>
                        {s.bill_no}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{s.customer_name}</div>
                      {s.customer_company && <div style={{ fontSize: '0.74rem', color: 'var(--text-dim)' }}>{s.customer_company}</div>}
                    </td>
                    <td className="font-mono" style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      {s.vehicle_no || 'Walk-in'}
                    </td>
                    <td style={{ fontWeight: 700 }}>{formatMoney(s.total)}</td>
                    <td style={{ color: 'var(--success)', fontWeight: 600 }}>{formatMoney(s.paid)}</td>
                    <td style={{ color: s.due > 0 ? '#fbbf24' : 'var(--text-dim)', fontWeight: 700 }}>{formatMoney(s.due)}</td>
                    <td>
                      <span className={`badge ${s.status === 'Paid' ? 'badge-paid' : s.status === 'Partly paid' ? 'badge-partially_paid' : 'badge-overdue'}`}>
                        {s.status}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '4px' }}>
                        <button className="btn btn-sm btn-secondary" onClick={() => handleViewAndPrint(s.id)} title="Print / View Invoice">
                          <Printer size={13} />
                        </button>
                        {s.due > 0 && (
                          <button className="btn btn-sm btn-success" onClick={() => handleOpenReceipt(s)} title="Record Customer Receipt">
                            <CreditCard size={13} />
                            <span>Receipt</span>
                          </button>
                        )}
                        <button className="btn btn-sm btn-danger-outline" onClick={() => handleDelete(s.id, s.bill_no)} title="Delete Bill">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="10" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                    No sales bills found. Click "+ Create Bill" to generate a stone sales invoice.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Sale Modal */}
      {modalOpen && (
        <div className="modal-overlay">
          <div className="modal-container modal-lg">
            <div className="modal-header">
              <h3>Create Sales Bill (Rock Palace Stone Shop)</h3>
              <button className="modal-close-btn" onClick={() => setModalOpen(false)}><X size={20} /></button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
              <div className="modal-body">
                {error && (
                  <div style={{ padding: '0.75rem', background: 'var(--danger-bg)', border: '1px solid var(--danger-border)', color: 'var(--danger)', borderRadius: 'var(--radius-sm)', marginBottom: '1rem', fontSize: '0.84rem' }}>
                    {error}
                  </div>
                )}

                {/* Header Fields (Section 6) */}
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Customer (or walk-in) *</label>
                    <select className="form-select" value={customerId} onChange={(e) => setCustomerId(e.target.value)} required>
                      {customers && customers.map(c => (
                        <option key={c.id} value={c.id}>{c.name} {c.company ? `(${c.company})` : ''}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Bill Number (Auto)</label>
                    <input type="text" className="form-input font-mono" value={billNo} onChange={(e) => setBillNo(e.target.value)} required />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Date *</label>
                    <input type="date" className="form-input" value={saleDate} onChange={(e) => setSaleDate(e.target.value)} required />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Payment Method</label>
                    <select className="form-select" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
                      <option value="Cash">Cash</option>
                      <option value="UPI">UPI (GPay / PhonePe)</option>
                      <option value="Bank">Bank Transfer</option>
                      <option value="RTGS-NEFT">RTGS / NEFT</option>
                      <option value="Cheque">Cheque</option>
                    </select>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Vehicle No (For Stone Transport)</label>
                    <input type="text" className="form-input font-mono" placeholder="e.g. TN-11-AB-4050" value={vehicleNo} onChange={(e) => setVehicleNo(e.target.value)} />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Site / Delivery Address</label>
                    <input type="text" className="form-input" placeholder="e.g. Plot 14, OMR Navalur Site" value={deliveryAddress} onChange={(e) => setDeliveryAddress(e.target.value)} />
                  </div>
                </div>

                {/* Items with Stock Limit Validation (Section 6) */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem', marginBottom: '0.5rem' }}>
                  <label className="form-label" style={{ marginBottom: 0 }}>Bill Items (Cannot exceed available stock)</label>
                  <button type="button" className="btn btn-sm btn-secondary" onClick={handleAddItem}>
                    <Plus size={14} />
                    <span>Add Row</span>
                  </button>
                </div>

                <div className="table-responsive">
                  <table className="items-table">
                    <thead>
                      <tr>
                        <th style={{ width: '30%' }}>Product / Stone Item *</th>
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
                        const selProd = products.find(p => p.id === Number(row.product_id));
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
                                  <option key={p.id} value={p.id}>
                                    {p.name} (Avail: {p.current_stock} {p.unit})
                                  </option>
                                ))}
                              </select>
                              {selProd && (
                                <div style={{ fontSize: '0.7rem', color: selProd.current_stock < row.qty ? 'var(--danger)' : 'var(--text-muted)', marginTop: '2px' }}>
                                  Stock: {selProd.current_stock} {selProd.unit}
                                </div>
                              )}
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

                {/* Footer Fields (Section 6) */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '1.5rem', marginTop: '1rem' }}>
                  <div>
                    <div className="form-group">
                      <label className="form-label">Transport / Loading Charges ({currency})</label>
                      <input type="number" step="0.01" min="0" className="form-input" value={transportCharges} onChange={(e) => setTransportCharges(e.target.value)} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Notes & Instructions</label>
                      <input type="text" className="form-input" placeholder="Edge polishing / cutting instructions..." value={notes} onChange={(e) => setNotes(e.target.value)} />
                    </div>
                  </div>

                  <div className="totals-summary-box">
                    <div className="totals-summary-row">
                      <span>Subtotal:</span>
                      <span>{formatMoney(subtotal)}</span>
                    </div>
                    <div className="totals-summary-row">
                      <span>GST Amount:</span>
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
                      <span>Amount Received ({currency}):</span>
                      <input 
                        type="number" 
                        step="0.01" 
                        min="0"
                        style={{ width: '100px', padding: '0.2rem 0.4rem', background: 'var(--bg-primary)', border: '1px solid var(--border-subtle)', color: '#fff', textAlign: 'right' }}
                        value={amountReceived} 
                        onChange={(e) => setAmountReceived(e.target.value)} 
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
                  <span>{loading ? 'Creating Bill...' : 'Save Bill & Deduct Stock'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Customer Receipt Modal */}
      {payModalOpen && selectedSale && (
        <div className="modal-overlay">
          <div className="modal-container" style={{ maxWidth: '420px' }}>
            <div className="modal-header">
              <h3>Record Customer Payment</h3>
              <button className="modal-close-btn" onClick={() => setPayModalOpen(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleRecordReceipt}>
              <div className="modal-body">
                <p style={{ fontSize: '0.85rem', marginBottom: '1rem', color: 'var(--text-muted)' }}>
                  Customer: <strong>{selectedSale.customer_name}</strong> | Bill: <strong>{selectedSale.bill_no}</strong><br />
                  Outstanding Due: <strong style={{ color: '#fbbf24' }}>{formatMoney(selectedSale.due)}</strong>
                </p>

                <div className="form-group">
                  <label className="form-label">Receipt Amount ({currency}) *</label>
                  <input type="number" step="0.01" min="0.01" className="form-input" value={payAmount} onChange={(e) => setPayAmount(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Receipt Date</label>
                  <input type="date" className="form-input" value={payDate} onChange={(e) => setPayDate(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Payment Method</label>
                  <select className="form-select" value={payMethod} onChange={(e) => setPayMethod(e.target.value)}>
                    <option value="Cash">Cash</option>
                    <option value="UPI">UPI (GPay / PhonePe)</option>
                    <option value="Bank">Bank Transfer</option>
                    <option value="Cheque">Cheque</option>
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setPayModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-success">Record Receipt</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Printable Invoice Modal (Rock Palace Stone Shop Tax Invoice) */}
      {printModalSale && (
        <div className="modal-overlay">
          <div className="modal-container modal-lg" style={{ maxHeight: '95vh' }}>
            <div className="modal-header no-print">
              <h3>TAX INVOICE - {printModalSale.sale.bill_no}</h3>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button className="btn btn-primary btn-sm" onClick={() => window.print()}>
                  <Printer size={15} />
                  <span>Print Tax Invoice</span>
                </button>
                <button className="modal-close-btn" onClick={() => setPrintModalSale(null)}><X size={20} /></button>
              </div>
            </div>

            <div className="modal-body" style={{ background: '#f8fafc', padding: '2rem' }}>
              <div className="invoice-print-wrapper">
                <div className="inv-print-header">
                  <div className="inv-company-brand">
                    <h2>{printModalSale.company?.company_name || 'Rock Palace'}</h2>
                    <p style={{ fontWeight: 600 }}>{printModalSale.company?.business_type || 'Stone Shop (Granite & Marble)'}</p>
                    <p style={{ fontSize: '0.8rem', color: '#475569', marginTop: '0.4rem' }}>
                      {printModalSale.company?.address}<br />
                      Phone: {printModalSale.company?.phone} | Email: {printModalSale.company?.email}<br />
                      GSTIN: <strong>{printModalSale.company?.gstin}</strong>
                    </p>
                  </div>

                  <div className="inv-meta-right">
                    <div className="inv-meta-title" style={{ color: '#d97706' }}>TAX INVOICE</div>
                    <div className="inv-meta-num">{printModalSale.sale.bill_no}</div>
                    <div style={{ fontSize: '0.82rem', color: '#475569', marginTop: '0.5rem' }}>
                      <div>Date: <strong>{printModalSale.sale.date}</strong></div>
                      <div>Vehicle No: <strong>{printModalSale.sale.vehicle_no || 'Hand Delivery'}</strong></div>
                      <div>Status: <strong>{printModalSale.sale.status}</strong></div>
                    </div>
                  </div>
                </div>

                <div className="inv-parties-grid">
                  <div>
                    <div className="inv-party-title">Billed To (Customer):</div>
                    <div className="inv-party-name">{printModalSale.sale.customer_name}</div>
                    {printModalSale.sale.customer_company && <div style={{ fontWeight: 600 }}>{printModalSale.sale.customer_company}</div>}
                    <div className="inv-party-details">
                      {printModalSale.sale.customer_address || 'Address on record'}<br />
                      Phone: {printModalSale.sale.customer_phone || '—'}<br />
                      GSTIN: {printModalSale.sale.gstin || 'Unregistered'}
                    </div>
                  </div>

                  <div>
                    <div className="inv-party-title">Site & Delivery Details:</div>
                    <div style={{ fontSize: '0.84rem', color: '#334155' }}>
                      <div>Delivery Site: <strong>{printModalSale.sale.delivery_address || 'Shop Counter'}</strong></div>
                      <div>Mode of Transport: <strong>{printModalSale.sale.vehicle_no ? `Vehicle #${printModalSale.sale.vehicle_no}` : 'Customer Self Pickup'}</strong></div>
                      <div style={{ marginTop: '0.5rem', color: '#64748b' }}>Payment Mode: {printModalSale.sale.payment_method}</div>
                    </div>
                  </div>
                </div>

                <table className="inv-print-table">
                  <thead>
                    <tr>
                      <th>Stone Item / Slab</th>
                      <th>HSN</th>
                      <th style={{ textAlign: 'center' }}>Qty</th>
                      <th style={{ textAlign: 'right' }}>Rate ({currency})</th>
                      <th style={{ textAlign: 'center' }}>GST %</th>
                      <th style={{ textAlign: 'right' }}>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {printModalSale.items && printModalSale.items.map((it, idx) => (
                      <tr key={idx}>
                        <td><strong>{it.product_name}</strong> ({it.product_code})</td>
                        <td>{it.hsn_code || '6802'}</td>
                        <td style={{ textAlign: 'center' }}>{it.qty} {it.unit}</td>
                        <td style={{ textAlign: 'right' }}>{formatMoney(it.rate)}</td>
                        <td style={{ textAlign: 'center' }}>{it.tax_percent}%</td>
                        <td style={{ textAlign: 'right', fontWeight: 600 }}>{formatMoney(it.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div className="inv-print-totals-wrap">
                  <div className="inv-print-totals-box">
                    <div className="inv-print-total-row">
                      <span>Subtotal:</span>
                      <span>{formatMoney(printModalSale.sale.subtotal)}</span>
                    </div>
                    <div className="inv-print-total-row">
                      <span>GST Tax Total:</span>
                      <span>{formatMoney(printModalSale.sale.tax)}</span>
                    </div>
                    {printModalSale.sale.transport_charges > 0 && (
                      <div className="inv-print-total-row">
                        <span>Transport & Loading:</span>
                        <span>{formatMoney(printModalSale.sale.transport_charges)}</span>
                      </div>
                    )}
                    <div className="inv-print-total-row final">
                      <span>Grand Total:</span>
                      <span>{formatMoney(printModalSale.sale.total)}</span>
                    </div>
                    <div className="inv-print-total-row" style={{ color: '#059669', fontWeight: 600 }}>
                      <span>Amount Received:</span>
                      <span>{formatMoney(printModalSale.sale.paid)}</span>
                    </div>
                    <div className="inv-print-total-row" style={{ color: printModalSale.sale.due > 0 ? '#b45309' : '#059669', fontWeight: 800 }}>
                      <span>Balance Due:</span>
                      <span>{formatMoney(printModalSale.sale.due)}</span>
                    </div>
                  </div>
                </div>

                <div className="inv-print-footer">
                  <div>
                    <div style={{ fontWeight: 700, color: '#0f172a' }}>Terms & Conditions:</div>
                    <p>{printModalSale.company?.payment_terms || 'Goods once sold cannot be returned without prior inspection.'}</p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ height: '35px', borderBottom: '1px solid #94a3b8', width: '160px', marginLeft: 'auto', marginBottom: '4px' }}></div>
                    <div style={{ fontWeight: 600 }}>For Rock Palace</div>
                    <div style={{ fontSize: '0.72rem' }}>Authorized Signatory</div>
                  </div>
                </div>

              </div>
            </div>

            <div className="modal-footer no-print">
              <button className="btn btn-secondary" onClick={() => setPrintModalSale(null)}>Close</button>
              <button className="btn btn-primary" onClick={() => window.print()}>
                <Printer size={15} />
                <span>Print Invoice</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
