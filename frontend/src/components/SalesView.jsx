import React, { useState } from 'react';
import { 
  FileText, 
  Search, 
  Plus, 
  Eye, 
  CreditCard, 
  Trash2, 
  X, 
  Check, 
  Printer, 
  Truck, 
  Copy,
  Building,
  Calendar,
  Layers
} from 'lucide-react';
import { api } from '../services/api';
import ConfirmModal from './ConfirmModal';
import Loader from './Loader';

// Indian Rupee currency to words converter
function numberToWordsINR(num) {
  const n = Math.round(Number(num) || 0);
  if (n === 0) return 'Rupees Zero Only';

  const a = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
             'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  function inWords(val) {
    if (val < 20) return a[val];
    const digit = val % 10;
    return b[Math.floor(val / 10)] + (digit ? ' ' + a[digit] : '');
  }

  let words = '';
  const crore = Math.floor(n / 10000000);
  let rem = n % 10000000;
  const lakh = Math.floor(rem / 100000);
  rem = rem % 100000;
  const thousand = Math.floor(rem / 1000);
  rem = rem % 1000;
  const hundred = Math.floor(rem / 100);
  rem = rem % 100;

  if (crore) words += inWords(crore) + ' Crore ';
  if (lakh) words += inWords(lakh) + ' Lakh ';
  if (thousand) words += inWords(thousand) + ' Thousand ';
  if (hundred) words += inWords(hundred) + ' Hundred ';
  if (rem) {
    if (words !== '') words += 'and ';
    words += inWords(rem) + ' ';
  }

  return 'Rupees ' + words.trim() + ' Only';
}

export default function SalesView({ sales, customers, products, currency = '₹', settings = null, onRefresh }) {
  const todayStr = new Date().toISOString().split('T')[0];

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [payModalOpen, setPayModalOpen] = useState(false);
  const [selectedSale, setSelectedSale] = useState(null);
  const [printModalSale, setPrintModalSale] = useState(null);
  const [deleteModalSale, setDeleteModalSale] = useState(null);
  const [isDeletingSale, setIsDeletingSale] = useState(false);

  // Form State
  const [customerId, setCustomerId] = useState('');
  const [billNo, setBillNo] = useState('');
  const [saleDate, setSaleDate] = useState(todayStr);
  const [dateOfSupply, setDateOfSupply] = useState(todayStr);
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [reverseCharge, setReverseCharge] = useState('No');
  const [transportMode, setTransportMode] = useState('Road');
  const [vehicleNo, setVehicleNo] = useState('');
  const [placeOfSupply, setPlaceOfSupply] = useState('Kerala');
  const [stateCode, setStateCode] = useState('32');
  const [ewayBillNo, setEwayBillNo] = useState('');
  const [consigneeName, setConsigneeName] = useState('');
  const [consigneeAddress, setConsigneeAddress] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [transportCharges, setTransportCharges] = useState(0);
  const [roundOff, setRoundOff] = useState(0);
  const [amountReceived, setAmountReceived] = useState(0);
  const [items, setItems] = useState([
    { product_id: '', qty: 45, rate: 50, discount: 0, tax_percent: 18, hsn_code: '6802' }
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
      setBillNo('JR26-27 001');
    }

    const firstCust = customers && customers.length > 0 ? customers[0] : null;
    setCustomerId(firstCust ? firstCust.id : '');
    setSaleDate(todayStr);
    setDateOfSupply(todayStr);
    setPaymentMethod('Cash');
    setReverseCharge('No');
    setTransportMode('Road');
    setVehicleNo('');
    setPlaceOfSupply('Kerala');
    setStateCode('32');
    setEwayBillNo('');
    setConsigneeName(firstCust ? firstCust.name : '');
    setConsigneeAddress(firstCust ? (firstCust.address || firstCust.company || '') : '');
    setDeliveryAddress('');
    setNotes('');
    setTransportCharges(0);
    setRoundOff(0);
    setAmountReceived(0);

    const firstProd = products && products.length > 0 ? products[0] : null;
    setItems([{
      product_id: firstProd ? firstProd.id : '',
      qty: 45,
      rate: firstProd ? (firstProd.selling_price || firstProd.unit_price || 50) : 50,
      discount: 0,
      tax_percent: firstProd ? firstProd.tax_percent : 18,
      hsn_code: firstProd?.hsn_code || '6802'
    }]);

    setError(null);
    setModalOpen(true);
  };

  const handleCustomerChange = (cId) => {
    setCustomerId(cId);
    const cust = customers.find(c => String(c.id) === String(cId));
    if (cust) {
      setConsigneeName(cust.name);
      setConsigneeAddress(cust.address || cust.company || '');
      setDeliveryAddress(cust.address || '');
    }
  };

  const handleCopyConsignee = () => {
    const cust = customers.find(c => String(c.id) === String(customerId));
    if (cust) {
      setConsigneeName(cust.name);
      setConsigneeAddress(cust.address || cust.company || '');
    }
  };

  const handleProductSelect = (index, prodId) => {
    const updated = [...items];
    const prod = products.find(p => p.id === Number(prodId));
    if (prod) {
      updated[index] = {
        ...updated[index],
        product_id: prod.id,
        rate: prod.selling_price || prod.unit_price || 50,
        tax_percent: prod.tax_percent || 18,
        hsn_code: prod.hsn_code || '6802'
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
      {
        product_id: firstProd ? firstProd.id : '',
        qty: 10,
        rate: firstProd ? (firstProd.selling_price || firstProd.unit_price || 50) : 50,
        discount: 0,
        tax_percent: 18,
        hsn_code: firstProd?.hsn_code || '6802'
      }
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
        date_of_supply: dateOfSupply || saleDate,
        payment_method: paymentMethod,
        reverse_charge: reverseCharge,
        transport_mode: transportMode,
        vehicle_no: vehicleNo,
        place_of_supply: placeOfSupply,
        state_code: stateCode,
        eway_bill_no: ewayBillNo,
        consignee_name: consigneeName,
        consignee_address: consigneeAddress,
        consignee_state: placeOfSupply,
        consignee_state_code: stateCode,
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

  const handleDeleteClick = (s) => {
    setDeleteModalSale(s);
  };

  const handleConfirmDeleteSale = async () => {
    if (!deleteModalSale) return;
    setIsDeletingSale(true);
    try {
      await api.deleteSale(deleteModalSale.id);
      setDeleteModalSale(null);
      if (onRefresh) onRefresh();
    } catch (err) {
      alert(err.message || 'Failed to delete sales bill');
    } finally {
      setIsDeletingSale(false);
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
    <div className="view-container">
      {/* View Header */}
      <div className="view-header">
        <div>
          <h2>Sales & GST Tax Invoicing (Chengamanadu)</h2>
          <p>Issue authentic GST tax invoices (JR26-27), vehicle delivery slips, and track customer dues for JR Marbles & Granites</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn btn-primary" onClick={handleOpenAdd}>
            <Plus size={16} />
            <span>+ Create Bill</span>
          </button>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className="card" style={{ marginBottom: '1.5rem', padding: '1rem' }}>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ position: 'relative', minWidth: '320px', flex: 1 }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input 
              type="text" 
              className="form-input" 
              style={{ paddingLeft: '38px' }} 
              placeholder="Search bill #, customer, vehicle (e.g. KL 16 G 2675)..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Status:</span>
            {['all', 'paid', 'partly paid', 'unpaid'].map(st => (
              <button 
                key={st}
                className={`btn btn-sm ${statusFilter === st ? 'btn-primary' : 'btn-secondary'}`}
                style={{ textTransform: 'capitalize' }}
                onClick={() => setStatusFilter(st)}
              >
                {st}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Sales List Table */}
      <div className="card">
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Bill #</th>
                <th>Date</th>
                <th>Customer</th>
                <th>Vehicle No</th>
                <th style={{ textAlign: 'right' }}>Total</th>
                <th style={{ textAlign: 'right' }}>Paid</th>
                <th style={{ textAlign: 'right' }}>Due</th>
                <th style={{ textAlign: 'center' }}>Status</th>
                <th style={{ textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered && filtered.length > 0 ? (
                filtered.map(s => (
                  <tr key={s.id}>
                    <td className="font-mono">
                      <span style={{ cursor: 'pointer', textDecoration: 'underline', color: 'var(--primary)' }} onClick={() => handleViewAndPrint(s.id)}>
                        {s.bill_no}
                      </span>
                    </td>
                    <td>{s.date}</td>
                    <td>
                      <strong>{s.customer_name}</strong>
                      {s.customer_company && <span style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)' }}>{s.customer_company}</span>}
                    </td>
                    <td>
                      {s.vehicle_no ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'rgba(255,255,255,0.05)', padding: '2px 8px', borderRadius: '4px', fontSize: '0.8rem' }}>
                          <Truck size={12} /> {s.vehicle_no}
                        </span>
                      ) : <span style={{ color: 'var(--text-dim)' }}>—</span>}
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 600 }}>{formatMoney(s.total)}</td>
                    <td style={{ textAlign: 'right', color: 'var(--success)' }}>{formatMoney(s.paid)}</td>
                    <td style={{ textAlign: 'right', color: s.due > 0 ? 'var(--warning)' : 'var(--text-muted)', fontWeight: s.due > 0 ? 700 : 400 }}>
                      {formatMoney(s.due)}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <span className={`badge badge-${s.status.toLowerCase().replace(' ', '_')}`}>
                        {s.status}
                      </span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'center' }}>
                        <button className="btn btn-sm btn-secondary" onClick={() => handleViewAndPrint(s.id)} title="Print GST Tax Invoice">
                          <Printer size={13} />
                        </button>
                        {s.due > 0 && (
                          <button className="btn btn-sm btn-success" onClick={() => handleOpenReceipt(s)} title="Record Customer Payment">
                            <CreditCard size={13} />
                          </button>
                        )}
                        <button className="btn btn-sm btn-danger-outline" onClick={() => handleDeleteClick(s)} title="Delete Bill">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="9" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                    No sales bills found. Click "+ Create Bill" to generate a GST tax invoice.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Sale Modal (Full GST Fields) */}
      {modalOpen && (
        <div className="modal-overlay">
          <div className="modal-container modal-lg">
            <div className="modal-header">
              <h3>Create GST Tax Invoice — Billora Marbles & Granites (Chengamanadu)</h3>
              <button className="modal-close-btn" onClick={() => setModalOpen(false)}><X size={20} /></button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
              <div className="modal-body">
                {error && (
                  <div style={{ padding: '0.75rem', background: 'var(--danger-bg)', border: '1px solid var(--danger-border)', color: 'var(--danger)', borderRadius: 'var(--radius-sm)', marginBottom: '1rem', fontSize: '0.84rem' }}>
                    {error}
                  </div>
                )}

                {/* Invoice Meta Grid */}
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
                  1. Invoice & Transportation Metadata
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Customer (Billed to) *</label>
                    <select className="form-select" value={customerId} onChange={(e) => handleCustomerChange(e.target.value)} required>
                      {customers && customers.map(c => (
                        <option key={c.id} value={c.id}>{c.name} {c.company ? `(${c.company})` : ''}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Invoice No (e.g. JR26-27 014)</label>
                    <input type="text" className="form-input font-mono" value={billNo} onChange={(e) => setBillNo(e.target.value)} required />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Invoice Date *</label>
                    <input type="date" className="form-input" value={saleDate} onChange={(e) => setSaleDate(e.target.value)} required />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Date of Supply</label>
                    <input type="date" className="form-input" value={dateOfSupply} onChange={(e) => setDateOfSupply(e.target.value)} />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Vehicle Number (Transport)</label>
                    <input type="text" className="form-input font-mono" placeholder="e.g. KL 16 G 2675" value={vehicleNo} onChange={(e) => setVehicleNo(e.target.value)} />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Transportation Mode</label>
                    <input type="text" className="form-input" placeholder="e.g. Road" value={transportMode} onChange={(e) => setTransportMode(e.target.value)} />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Reverse Charge</label>
                    <select className="form-select" value={reverseCharge} onChange={(e) => setReverseCharge(e.target.value)}>
                      <option value="No">No</option>
                      <option value="Yes">Yes</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Payment Method</label>
                    <select className="form-select" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
                      <option value="Cash">Cash (Counter)</option>
                      <option value="Indian Bank">Indian Bank Current A/c</option>
                      <option value="UPI">UPI (GPay / PhonePe)</option>
                      <option value="RTGS-NEFT">RTGS / NEFT</option>
                      <option value="Cheque">Cheque</option>
                    </select>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Place of Supply</label>
                    <input type="text" className="form-input" placeholder="e.g. Kerala" value={placeOfSupply} onChange={(e) => setPlaceOfSupply(e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">State Code</label>
                    <input type="text" className="form-input font-mono" placeholder="32" value={stateCode} onChange={(e) => setStateCode(e.target.value)} />
                  </div>
                  <div className="form-group" style={{ flex: 2 }}>
                    <label className="form-label">E-way Bill No (if applicable)</label>
                    <input type="text" className="form-input font-mono" placeholder="e.g. 241289102910" value={ewayBillNo} onChange={(e) => setEwayBillNo(e.target.value)} />
                  </div>
                </div>

                {/* Consignee Details */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.8rem', marginBottom: '0.4rem' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    2. Consignee / Shipped To (Site Address)
                  </div>
                  <button type="button" className="btn btn-sm btn-secondary" onClick={handleCopyConsignee} style={{ padding: '2px 8px', fontSize: '0.72rem' }}>
                    <Copy size={12} /> Same as Billed To
                  </button>
                </div>
                <div className="form-row">
                  <div className="form-group" style={{ flex: 1 }}>
                    <label className="form-label">Consignee Name</label>
                    <input type="text" className="form-input" placeholder="e.g. Binu" value={consigneeName} onChange={(e) => setConsigneeName(e.target.value)} />
                  </div>
                  <div className="form-group" style={{ flex: 2 }}>
                    <label className="form-label">Consignee Address / Site Location</label>
                    <input type="text" className="form-input" placeholder="Near old St. mary's school, Kizhakketheruvu, Kottarakara" value={consigneeAddress} onChange={(e) => setConsigneeAddress(e.target.value)} />
                  </div>
                </div>

                {/* Items Section */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.2rem', marginBottom: '0.5rem' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    3. Products / Stone Slabs (HSN 6802)
                  </div>
                  <button type="button" className="btn btn-sm btn-secondary" onClick={handleAddItem}>
                    <Plus size={14} /> Add Stone Item
                  </button>
                </div>

                <div style={{ border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', overflow: 'hidden', marginBottom: '1rem' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                    <thead>
                      <tr style={{ background: 'var(--bg-surface)', borderBottom: '1px solid var(--border-subtle)' }}>
                        <th style={{ padding: '8px 12px', textAlign: 'left' }}>Stone / Slab Product *</th>
                        <th style={{ padding: '8px 8px', width: '90px' }}>HSN</th>
                        <th style={{ padding: '8px 8px', width: '90px' }}>Qty (sqft)</th>
                        <th style={{ padding: '8px 8px', width: '100px' }}>Rate ({currency})</th>
                        <th style={{ padding: '8px 8px', width: '80px' }}>GST %</th>
                        <th style={{ padding: '8px 12px', textAlign: 'right', width: '120px' }}>Total</th>
                        <th style={{ padding: '8px', width: '40px' }}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((it, idx) => {
                        const lineSub = (parseFloat(it.qty) || 0) * (parseFloat(it.rate) || 0);
                        const lineTax = lineSub * ((parseFloat(it.tax_percent) || 0) / 100);
                        const lineTot = lineSub + lineTax;
                        return (
                          <tr key={idx} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                            <td style={{ padding: '6px 12px' }}>
                              <select 
                                className="form-select" 
                                style={{ padding: '6px 8px', fontSize: '0.85rem' }}
                                value={it.product_id} 
                                onChange={(e) => handleProductSelect(idx, e.target.value)}
                                required
                              >
                                <option value="">Select Stone / Slab</option>
                                {products && products.map(p => (
                                  <option key={p.id} value={p.id}>
                                    {p.name} ({p.code || 'CODE'}) - Stock: {p.current_stock} {p.unit}
                                  </option>
                                ))}
                              </select>
                            </td>
                            <td style={{ padding: '6px 8px' }}>
                              <input 
                                type="text" 
                                className="form-input font-mono" 
                                style={{ padding: '6px 8px', fontSize: '0.85rem' }}
                                value={it.hsn_code || '6802'} 
                                onChange={(e) => handleItemChange(idx, 'hsn_code', e.target.value)}
                              />
                            </td>
                            <td style={{ padding: '6px 8px' }}>
                              <input 
                                type="number" 
                                step="any"
                                className="form-input" 
                                style={{ padding: '6px 8px', fontSize: '0.85rem' }}
                                value={it.qty} 
                                onChange={(e) => handleItemChange(idx, 'qty', e.target.value)}
                                required
                              />
                            </td>
                            <td style={{ padding: '6px 8px' }}>
                              <input 
                                type="number" 
                                step="any"
                                className="form-input" 
                                style={{ padding: '6px 8px', fontSize: '0.85rem' }}
                                value={it.rate} 
                                onChange={(e) => handleItemChange(idx, 'rate', e.target.value)}
                                required
                              />
                            </td>
                            <td style={{ padding: '6px 8px' }}>
                              <select 
                                className="form-select" 
                                style={{ padding: '6px 8px', fontSize: '0.85rem' }}
                                value={it.tax_percent} 
                                onChange={(e) => handleItemChange(idx, 'tax_percent', e.target.value)}
                              >
                                <option value="18">18% (9+9)</option>
                                <option value="12">12%</option>
                                <option value="28">28%</option>
                                <option value="5">5%</option>
                                <option value="0">0%</option>
                              </select>
                            </td>
                            <td style={{ padding: '6px 12px', textAlign: 'right', fontWeight: 600 }}>
                              {formatMoney(lineTot)}
                            </td>
                            <td style={{ padding: '6px', textAlign: 'center' }}>
                              {items.length > 1 && (
                                <button type="button" className="btn-danger-outline" style={{ padding: '4px' }} onClick={() => handleRemoveItem(idx)}>
                                  <X size={14} />
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Calculation Summary Footer */}
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1.5rem', background: 'var(--bg-surface)', padding: '1.2rem', borderRadius: 'var(--radius-md)' }}>
                  <div>
                    <label className="form-label">Notes / Instructions</label>
                    <textarea 
                      className="form-textarea" 
                      rows={2} 
                      placeholder="e.g. Regular granite slab delivered to site. Driver: Sunil"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                    />
                    <div style={{ marginTop: '0.8rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      <strong>Bank A/c:</strong> INDIAN BANK Current A/c 7944010222 (IFSC: IDIB 000C046)
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.9rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Subtotal:</span>
                      <span className="font-mono">{formatMoney(subtotal)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-muted)' }}>CGST (9%):</span>
                      <span className="font-mono">{formatMoney(taxSum / 2)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-muted)' }}>SGST (9%):</span>
                      <span className="font-mono">{formatMoney(taxSum / 2)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border-subtle)', paddingTop: '0.5rem', fontWeight: 700, fontSize: '1.1rem' }}>
                      <span>Invoice Total:</span>
                      <span className="font-mono text-primary">{formatMoney(grandTotal)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.25rem' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Amount Paid:</span>
                      <input 
                        type="number" 
                        step="any" 
                        className="form-input" 
                        style={{ width: '120px', padding: '4px 8px', textAlign: 'right' }} 
                        value={amountReceived} 
                        onChange={(e) => setAmountReceived(e.target.value)} 
                      />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600, color: balanceDue > 0 ? 'var(--warning)' : 'var(--success)' }}>
                      <span>Balance Due:</span>
                      <span className="font-mono">{formatMoney(balanceDue)}</span>
                    </div>
                  </div>
                </div>

              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? 'Creating GST Invoice...' : 'Generate GST Tax Invoice'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Payment Receipt Modal */}
      {payModalOpen && selectedSale && (
        <div className="modal-overlay">
          <div className="modal-container" style={{ maxWidth: '420px' }}>
            <div className="modal-header">
              <h3>Record Customer Payment</h3>
              <button className="modal-close-btn" onClick={() => setPayModalOpen(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleRecordReceipt}>
              <div className="modal-body">
                <div style={{ marginBottom: '1rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  Customer: <strong>{selectedSale.customer_name}</strong> | Bill: <strong>{selectedSale.bill_no}</strong><br />
                  Outstanding Due: <strong style={{ color: 'var(--warning)' }}>{formatMoney(selectedSale.due)}</strong>
                </div>

                <div className="form-group">
                  <label className="form-label">Payment Date</label>
                  <input type="date" className="form-input" value={payDate} onChange={(e) => setPayDate(e.target.value)} required />
                </div>

                <div className="form-group">
                  <label className="form-label">Amount Received ({currency})</label>
                  <input type="number" step="any" className="form-input" value={payAmount} onChange={(e) => setPayAmount(e.target.value)} required />
                </div>

                <div className="form-group">
                  <label className="form-label">Payment Method</label>
                  <select className="form-select" value={payMethod} onChange={(e) => setPayMethod(e.target.value)}>
                    <option value="Cash">Cash (Counter)</option>
                    <option value="Indian Bank">Indian Bank Current A/c</option>
                    <option value="UPI">UPI</option>
                    <option value="RTGS-NEFT">RTGS / NEFT</option>
                    <option value="Cheque">Cheque</option>
                  </select>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setPayModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-success">Save Payment</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Printable GST Tax Invoice Modal (Matching JR Marbles printed bill 1:1) */}
      {printModalSale && (
        <div className="modal-overlay">
          <div className="modal-container modal-lg" style={{ maxHeight: '96vh' }}>
            <div className="modal-header no-print">
              <h3>TAX INVOICE — {printModalSale.sale.bill_no}</h3>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button className="btn btn-primary btn-sm" onClick={() => window.print()}>
                  <Printer size={15} />
                  <span>Print Tax Invoice</span>
                </button>
                <button className="modal-close-btn" onClick={() => setPrintModalSale(null)}><X size={20} /></button>
              </div>
            </div>

            <div className="modal-body" style={{ background: '#525252', padding: '1.5rem', overflowY: 'auto' }}>
              
              {/* Authentically Styled JR Marbles & Granites Printed Slip */}
              <div className="jr-invoice-sheet" id="printable-gst-invoice">
                
                {/* 1. Header with Circular JR Logo */}
                <div className="jr-bill-header">
                  <div className="jr-bill-brand-left">
                    <img 
                      src={settings?.logo_url || "/logo.png"} 
                      alt="JR Logo" 
                      className="jr-bill-logo-circle" 
                      style={{ width: '54px', height: '54px', borderRadius: '50%', objectFit: 'cover', border: '1.5px solid #0284c7' }} 
                    />
                    <div className="jr-bill-brand-titles">
                      <h1 className="jr-bill-main-title">BILLORA MARBLES & GRANITES</h1>
                      <div className="jr-bill-sub-title">CHENGAMANADU</div>
                    </div>
                  </div>

                  <div className="jr-bill-header-meta">
                    <div>Mob: 9460110878, 8504882265</div>
                    <div>GSTIN: 32FGZPR5431L1ZL</div>
                  </div>
                </div>

                {/* 2. Title Banner */}
                <div className="jr-bill-title-banner">
                  GST TAX INVOICE
                </div>

                {/* 3. Invoice Meta 2-Column Table */}
                <table className="jr-bill-meta-table">
                  <tbody>
                    <tr>
                      <td style={{ width: '50%' }}>
                        <span className="lbl">Reverse Charge :</span>
                        <span className="val">{printModalSale.sale.reverse_charge || 'No'}</span>
                      </td>
                      <td style={{ width: '50%' }}>
                        <span className="lbl">Transportation Mode :</span>
                        <span className="val">{printModalSale.sale.transport_mode || 'Road'}</span>
                      </td>
                    </tr>
                    <tr>
                      <td>
                        <span className="lbl">Invoice No. :</span>
                        <span className="val invoice-num-red">{printModalSale.sale.bill_no}</span>
                      </td>
                      <td>
                        <span className="lbl">Vehicle Number :</span>
                        <span className="val font-handwriting">{printModalSale.sale.vehicle_no || 'KL 16 G 2675'}</span>
                      </td>
                    </tr>
                    <tr>
                      <td>
                        <span className="lbl">Invoice Date :</span>
                        <span className="val font-handwriting">{printModalSale.sale.date}</span>
                      </td>
                      <td>
                        <span className="lbl">Date of Supply :</span>
                        <span className="val font-handwriting">{printModalSale.sale.date_of_supply || printModalSale.sale.date}</span>
                      </td>
                    </tr>
                    <tr>
                      <td>
                        <span className="lbl">State :</span>
                        <span className="val font-handwriting">{printModalSale.sale.customer_state || 'Kerala'}</span>
                      </td>
                      <td>
                        <span className="lbl">Place of Supply :</span>
                        <span className="val font-handwriting">{printModalSale.sale.place_of_supply || 'Kerala'}</span>
                        <span style={{ marginLeft: '1.5rem' }} className="lbl">State Code:</span>
                        <span className="val font-handwriting">{printModalSale.sale.state_code || '32'}</span>
                      </td>
                    </tr>
                  </tbody>
                </table>

                {/* 4. Details of Receiver & Consignee */}
                <table className="jr-bill-parties-table">
                  <thead>
                    <tr>
                      <th style={{ width: '50%' }}>Details of Receiver | Billed to :</th>
                      <th style={{ width: '50%' }}>Details of Consignee | Shipped to :</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td style={{ verticalAlign: 'top', height: '110px' }}>
                        <div className="party-row">
                          <span className="lbl">Name :</span>
                          <span className="val font-handwriting font-bold">{printModalSale.sale.customer_name}</span>
                        </div>
                        <div className="party-row">
                          <span className="lbl">Address :</span>
                          <span className="val font-handwriting">
                            {printModalSale.sale.customer_address || printModalSale.sale.delivery_address || 'Chengamanadu, Kottarakkara'}
                          </span>
                        </div>
                        <div className="party-row" style={{ marginTop: '0.4rem' }}>
                          <span className="lbl">State :</span>
                          <span className="val font-handwriting">{printModalSale.sale.customer_state || 'Kerala'}</span>
                          <span className="lbl" style={{ marginLeft: '1rem' }}>State Code:</span>
                          <span className="val font-handwriting">32</span>
                        </div>
                        <div className="party-row">
                          <span className="lbl">GSTIN :</span>
                          <span className="val font-mono">{printModalSale.sale.gstin || '—'}</span>
                        </div>
                        <div className="party-row">
                          <span className="lbl">E-way Bill :</span>
                          <span className="val font-mono">{printModalSale.sale.eway_bill_no || '—'}</span>
                        </div>
                      </td>

                      <td style={{ verticalAlign: 'top', height: '110px' }}>
                        <div className="party-row">
                          <span className="lbl">Name :</span>
                          <span className="val font-handwriting font-bold">
                            {printModalSale.sale.consignee_name || printModalSale.sale.customer_name || 'Same as Receiver'}
                          </span>
                        </div>
                        <div className="party-row">
                          <span className="lbl">Address :</span>
                          <span className="val font-handwriting">
                            {printModalSale.sale.consignee_address || printModalSale.sale.delivery_address || 'Same as Receiver'}
                          </span>
                        </div>
                        <div className="party-row" style={{ marginTop: '0.4rem' }}>
                          <span className="lbl">State :</span>
                          <span className="val font-handwriting">Kerala</span>
                          <span className="lbl" style={{ marginLeft: '1rem' }}>State Code:</span>
                          <span className="val font-handwriting">32</span>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>

                {/* 5. Products Table */}
                <table className="jr-bill-items-table">
                  <thead>
                    <tr>
                      <th style={{ width: '45px', textAlign: 'center' }}>S. No.</th>
                      <th style={{ textAlign: 'left' }}>Name of Products / Service</th>
                      <th style={{ width: '80px', textAlign: 'center' }}>HSN/ACS</th>
                      <th style={{ width: '80px', textAlign: 'center' }}>Qty</th>
                      <th style={{ width: '95px', textAlign: 'center' }}>Rate</th>
                      <th style={{ width: '120px', textAlign: 'right' }}>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {printModalSale.items && printModalSale.items.map((it, idx) => {
                      const itemAmt = (parseFloat(it.qty) || 0) * (parseFloat(it.rate) || 0);
                      return (
                        <tr key={idx}>
                          <td style={{ textAlign: 'center' }}>{idx + 1}.</td>
                          <td>
                            <strong className="font-handwriting">{it.product_name}</strong>
                          </td>
                          <td style={{ textAlign: 'center' }} className="font-mono">{it.hsn_code || '6802'}</td>
                          <td style={{ textAlign: 'center' }} className="font-handwriting">
                            {it.qty} {it.unit || 'sqft'}
                          </td>
                          <td style={{ textAlign: 'center' }} className="font-handwriting">
                            {it.rate} /- @
                          </td>
                          <td style={{ textAlign: 'right' }} className="font-handwriting font-bold">
                            {itemAmt.toFixed(0)} /-
                          </td>
                        </tr>
                      );
                    })}
                    {/* Empty spacing rows to simulate printed slip height */}
                    {printModalSale.items && printModalSale.items.length < 3 && (
                      <tr>
                        <td style={{ height: '35px' }}></td>
                        <td></td>
                        <td></td>
                        <td></td>
                        <td></td>
                        <td></td>
                      </tr>
                    )}
                  </tbody>
                </table>

                {/* 6. Bottom Split Totals & Bank Details Box */}
                <div className="jr-bill-bottom-grid">
                  
                  {/* Left Column: Amount in Words, Bank Details, Terms */}
                  <div className="jr-bill-bottom-left">
                    <div className="jr-bill-words-box">
                      <span className="lbl">Total Invoice Amount in Words :</span>
                      <div className="val-words">
                        {numberToWordsINR(printModalSale.sale.total)}
                      </div>
                    </div>

                    {/* Bank Details Box */}
                    <table className="jr-bill-bank-table">
                      <tbody>
                        <tr>
                          <td className="bank-lbl">Bank Details : Bank Name</td>
                          <td className="bank-val font-bold">INDIAN BANK</td>
                        </tr>
                        <tr>
                          <td className="bank-lbl">Bank Account Number</td>
                          <td className="bank-val font-mono font-bold">7944010222</td>
                        </tr>
                        <tr>
                          <td className="bank-lbl">Account Type & Branch</td>
                          <td className="bank-val">Current Account, Chengamanadu</td>
                        </tr>
                        <tr>
                          <td className="bank-lbl">Bank Branch IFSC</td>
                          <td className="bank-val font-mono font-bold">IDIB 000C046</td>
                        </tr>
                      </tbody>
                    </table>

                    {/* Terms & Conditions */}
                    <div className="jr-bill-terms">
                      <div className="terms-title">Terms & Conditions:</div>
                      <ol className="terms-list">
                        <li>This Subject to Kottarakkara Jurisdiction Only.</li>
                        <li>Payment Should be drawn in favour of above bank details</li>
                        <li>Goods once sold cannot be taken back or exchanged</li>
                        <li>Our responsibility ceases the moment goods leave our Showroom</li>
                        <li>We are not responsible for damage pilferage during transit</li>
                      </ol>
                    </div>
                  </div>

                  {/* Right Column: Tax Breakdown & Signature */}
                  <div className="jr-bill-bottom-right">
                    <table className="jr-bill-totals-table">
                      <tbody>
                        <tr>
                          <td className="tot-lbl">TOTAL AMOUNT BEFORE TAX</td>
                          <td className="tot-val">{printModalSale.sale.subtotal} /-</td>
                        </tr>
                        <tr>
                          <td className="tot-lbl">ADD : CGST 9%</td>
                          <td className="tot-val">{(printModalSale.sale.tax / 2).toFixed(2)} /-</td>
                        </tr>
                        <tr>
                          <td className="tot-lbl">ADD : SGST 9%</td>
                          <td className="tot-val">{(printModalSale.sale.tax / 2).toFixed(2)} /-</td>
                        </tr>
                        <tr>
                          <td className="tot-lbl">ADD : IGST</td>
                          <td className="tot-val">—</td>
                        </tr>
                        <tr>
                          <td className="tot-lbl font-bold">TOTAL TAX AMOUNT GST</td>
                          <td className="tot-val font-bold">{printModalSale.sale.tax} /-</td>
                        </tr>
                        <tr className="tot-row-grand">
                          <td className="tot-lbl font-bold">TOTAL AMOUNT AFTER TAX</td>
                          <td className="tot-val font-bold grand-total-val">{printModalSale.sale.total} /-</td>
                        </tr>
                        <tr>
                          <td className="tot-lbl">GST Payable on Reverse Charge</td>
                          <td className="tot-val">{printModalSale.sale.reverse_charge || 'No'}</td>
                        </tr>
                      </tbody>
                    </table>

                    <div className="jr-bill-sign-box">
                      <div className="sign-cert">
                        Certified that the particulars given above are true and correct
                      </div>
                      <div className="sign-for">
                        For <strong>BILLORA MARBLES & GRANITES</strong>
                      </div>
                      <div className="sign-space">
                        <span className="sign-pen-mock">Approved</span>
                      </div>
                      <div className="sign-author">
                        Authorised Signatory
                      </div>
                    </div>

                  </div>

                </div>

                {/* 7. Bottom Footnote Copies */}
                <div className="jr-bill-footer-marks">
                  <span>Original for Receipt</span>
                  <span>Duplicate for Supplier/Transporter</span>
                </div>

              </div>

            </div>

            <div className="modal-footer no-print">
              <button className="btn btn-secondary" onClick={() => setPrintModalSale(null)}>Close Preview</button>
              <button className="btn btn-primary" onClick={() => window.print()}>
                <Printer size={15} />
                <span>Print Tax Invoice</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Delete Sales Bill Modal */}
      <ConfirmModal
        isOpen={Boolean(deleteModalSale)}
        title="Delete Sales Bill"
        message={deleteModalSale ? ("Are you sure you want to delete sales bill " + deleteModalSale.bill_no + "? This will restore stone items back to inventory.") : ""}
        confirmText="Delete Bill & Restore Stock"
        isLoading={isDeletingSale}
        onCancel={() => !isDeletingSale && setDeleteModalSale(null)}
        onConfirm={handleConfirmDeleteSale}
        itemDetails={deleteModalSale ? (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span style={{ color: '#94a3b8' }}>Bill No:</span>
              <strong style={{ color: '#f8fafc' }}>{deleteModalSale.bill_no}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span style={{ color: '#94a3b8' }}>Customer:</span>
              <strong style={{ color: '#38bdf8' }}>{deleteModalSale.customer_name}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span style={{ color: '#94a3b8' }}>Grand Total:</span>
              <strong style={{ color: '#34d399' }}>{formatMoney(deleteModalSale.total)}</strong>
            </div>
          </div>
        ) : null}
      />
    </div>
  );
}
