import React, { useState, useEffect } from 'react';
import { 
  Calculator, 
  Search, 
  Plus, 
  Eye, 
  FileText, 
  Trash2, 
  X, 
  Check, 
  Printer, 
  Mail, 
  MessageSquare, 
  Share2, 
  Download, 
  ArrowRightCircle, 
  Layers, 
  Copy, 
  AlertCircle,
  Clock,
  Sparkles,
  ExternalLink,
  Edit3
} from 'lucide-react';
import { api } from '../services/api';
import ConfirmModal from './ConfirmModal';
import Loader from './Loader';

// INR Currency to Words converter
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

export default function EstimatesView({ 
  customers = [], 
  products = [], 
  currency = '₹', 
  settings = null, 
  onRefresh,
  onNavigateToSale
}) {
  const todayStr = new Date().toISOString().split('T')[0];
  const defaultValidUntil = new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0];

  const [estimates, setEstimates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Modal States
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingEstimateId, setEditingEstimateId] = useState(null);
  const [quickAddProductOpen, setQuickAddProductOpen] = useState(false);
  const [quickAddRowIndex, setQuickAddRowIndex] = useState(null);
  
  const [printModalEstimate, setPrintModalEstimate] = useState(null);
  const [emailModalEstimate, setEmailModalEstimate] = useState(null);
  const [whatsAppModalEstimate, setWhatsAppModalEstimate] = useState(null);
  const [deleteConfirmEstimate, setDeleteConfirmEstimate] = useState(null);
  const [convertConfirmEstimate, setConvertConfirmEstimate] = useState(null);

  // Email form state
  const [emailRecipient, setEmailRecipient] = useState('');
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [emailSending, setEmailSending] = useState(false);
  const [emailResult, setEmailResult] = useState(null);

  // WhatsApp form state
  const [waPhone, setWaPhone] = useState('');
  const [waMessage, setWaMessage] = useState('');
  const [waShareUrl, setWaShareUrl] = useState('');
  const [waSending, setWaSending] = useState(false);
  const [waCopied, setWaCopied] = useState(false);

  // Quick Add Product Form State
  const [newProdName, setNewProdName] = useState('');
  const [newProdCat, setNewProdCat] = useState('Granite');
  const [newProdHsn, setNewProdHsn] = useState('6802');
  const [newProdUnit, setNewProdUnit] = useState('sq.ft');
  const [newProdRate, setNewProdRate] = useState(65);
  const [newProdTax, setNewProdTax] = useState(18);
  const [newProdStock, setNewProdStock] = useState(0);
  const [quickProdLoading, setQuickProdLoading] = useState(false);

  // Editor Form State
  const [customerId, setCustomerId] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [customerGstin, setCustomerGstin] = useState('');
  const [estimateNo, setEstimateNo] = useState('');
  const [estDate, setEstDate] = useState(todayStr);
  const [validUntil, setValidUntil] = useState(defaultValidUntil);
  const [estStatus, setEstStatus] = useState('Draft');
  const [transportCharges, setTransportCharges] = useState(0);
  const [roundOff, setRoundOff] = useState(0);
  const [notes, setNotes] = useState('');
  const [terms, setTerms] = useState(
    "1. Estimate valid for 15 days from issue date.\n2. Prices subject to stock availability and shade variation.\n3. Loading & transportation extra as mentioned above.\n4. Final billing based on actual slab measurements upon dispatch."
  );

  const [items, setItems] = useState([
    { 
      product_id: '', 
      item_name: 'Galaxy Black Granite Slabs', 
      item_description: '', 
      hsn_code: '6802',
      length_in: 72,
      height_in: 36,
      pieces: 2,
      qty: 36, 
      unit: 'sq.ft', 
      rate: 110, 
      discount: 0, 
      tax_percent: 18 
    }
  ]);
  const [formError, setFormError] = useState(null);
  const [savingEstimate, setSavingEstimate] = useState(false);

  const formatMoney = (val) => `${currency} ${(Number(val) || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const loadEstimates = async () => {
    setLoading(true);
    try {
      const data = await api.getEstimates({
        search: search || undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined
      });
      setEstimates(data || []);
    } catch (e) {
      console.error('Error fetching estimates:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEstimates();
  }, [search, statusFilter]);

  // Open Create Estimate
  const handleOpenCreate = async () => {
    setFormError(null);
    setEditingEstimateId(null);
    try {
      const res = await api.getNextEstimateNo();
      setEstimateNo(res.estimate_no);
    } catch (e) {
      setEstimateNo('EST-26-27 001');
    }

    const firstCust = customers && customers.length > 0 ? customers[0] : null;
    if (firstCust) {
      setCustomerId(firstCust.id);
      setCustomerName(firstCust.name);
      setCustomerPhone(firstCust.phone || '');
      setCustomerAddress(firstCust.address || '');
      setCustomerGstin(firstCust.gstin || '');
    } else {
      setCustomerId('');
      setCustomerName('');
      setCustomerPhone('');
      setCustomerAddress('');
      setCustomerGstin('');
    }

    setEstDate(todayStr);
    setValidUntil(defaultValidUntil);
    setEstStatus('Draft');
    setTransportCharges(0);
    setRoundOff(0);
    setNotes('');

    const firstProd = products && products.length > 0 ? products[0] : null;
    setItems([
      {
        product_id: firstProd ? firstProd.id : '',
        item_name: firstProd ? firstProd.name : 'Galaxy Black Granite Slabs',
        item_description: firstProd?.size_thickness || '',
        hsn_code: firstProd?.hsn_code || '6802',
        length_in: '',
        height_in: '',
        pieces: '',
        qty: 45,
        unit: firstProd ? (firstProd.unit || 'sq.ft') : 'sq.ft',
        rate: firstProd ? (firstProd.selling_price || 60) : 60,
        discount: 0,
        tax_percent: firstProd ? (firstProd.tax_percent || 18) : 18
      }
    ]);

    setEditorOpen(true);
  };

  // Open Edit Estimate
  const handleOpenEdit = async (estId) => {
    setFormError(null);
    setEditingEstimateId(estId);
    try {
      const data = await api.getEstimate(estId);
      const est = data.estimate;
      setEstimateNo(est.estimate_no);
      setCustomerId(est.customer_id || '');
      setCustomerName(est.customer_name);
      setCustomerPhone(est.customer_phone || '');
      setCustomerAddress(est.customer_address || '');
      setCustomerGstin(est.customer_gstin || '');
      setEstDate(est.date);
      setValidUntil(est.valid_until || defaultValidUntil);
      setEstStatus(est.status);
      setTransportCharges(est.transport_charges || 0);
      setRoundOff(est.round_off || 0);
      setNotes(est.notes || '');
      setTerms(est.terms || '');

      if (data.items && data.items.length > 0) {
        setItems(data.items.map(it => ({
          product_id: it.product_id || '',
          item_name: it.item_name,
          item_description: it.item_description || '',
          hsn_code: it.hsn_code || '6802',
          length_in: it.length_in || '',
          height_in: it.height_in || '',
          pieces: it.pieces || '',
          qty: it.qty,
          unit: it.unit || 'sq.ft',
          rate: it.rate,
          discount: it.discount || 0,
          tax_percent: it.tax_percent || 18
        })));
      }
      setEditorOpen(true);
    } catch (e) {
      alert('Failed to load estimate: ' + e.message);
    }
  };

  const handleCustomerChange = (cId) => {
    setCustomerId(cId);
    const c = customers.find(item => String(item.id) === String(cId));
    if (c) {
      setCustomerName(c.name);
      setCustomerPhone(c.phone || '');
      setCustomerAddress(c.address || c.company || '');
      setCustomerGstin(c.gstin || '');
    }
  };

  const handleProductSelect = (index, prodId) => {
    const updated = [...items];
    if (!prodId) {
      updated[index] = {
        ...updated[index],
        product_id: '',
      };
    } else {
      const prod = products.find(p => p.id === Number(prodId));
      if (prod) {
        updated[index] = {
          ...updated[index],
          product_id: prod.id,
          item_name: prod.name,
          hsn_code: prod.hsn_code || '6802',
          unit: prod.unit || 'sq.ft',
          rate: prod.selling_price || 60,
          tax_percent: prod.tax_percent || 18,
          item_description: prod.size_thickness || ''
        };
      }
    }
    setItems(updated);
  };

  // Dimensions change calculates Sq.Ft auto: (L in * H in / 144) * pieces
  const handleDimensionChange = (index, field, val) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: val };
    const row = updated[index];
    const l = parseFloat(row.length_in) || 0;
    const h = parseFloat(row.height_in) || 0;
    const pcs = parseInt(row.pieces) || 1;
    if (l > 0 && h > 0 && (row.unit === 'sq.ft' || !row.unit)) {
      const sqft = ((l * h) / 144.0) * pcs;
      row.qty = Math.round(sqft * 100) / 100;
    }
    setItems(updated);
  };

  const handleItemChange = (index, field, val) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: val };
    setItems(updated);
  };

  const handleAddItemRow = () => {
    const firstProd = products && products.length > 0 ? products[0] : null;
    setItems([
      ...items,
      {
        product_id: firstProd ? firstProd.id : '',
        item_name: firstProd ? firstProd.name : 'Granite Slabs',
        item_description: '',
        hsn_code: firstProd?.hsn_code || '6802',
        length_in: '',
        height_in: '',
        pieces: '',
        qty: 20,
        unit: firstProd ? (firstProd.unit || 'sq.ft') : 'sq.ft',
        rate: firstProd ? (firstProd.selling_price || 65) : 65,
        discount: 0,
        tax_percent: 18
      }
    ]);
  };

  const handleRemoveItemRow = (index) => {
    if (items.length === 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  // Quick Add Product to Catalog from Bill Section
  const handleOpenQuickAdd = (rowIndex = null) => {
    setQuickAddRowIndex(rowIndex);
    setNewProdName('');
    setNewProdCat('Granite');
    setNewProdHsn('6802');
    setNewProdUnit('sq.ft');
    setNewProdRate(75);
    setNewProdTax(18);
    setNewProdStock(100);
    setQuickAddProductOpen(true);
  };

  const handleSaveQuickProduct = async (e) => {
    e.preventDefault();
    if (!newProdName.trim()) {
      alert('Please enter a product name');
      return;
    }
    setQuickProdLoading(true);
    try {
      const newProd = await api.createProduct({
        name: newProdName.trim(),
        unit: newProdUnit,
        purchase_price: Math.round(newProdRate * 0.7),
        selling_price: parseFloat(newProdRate) || 0,
        tax_percent: parseFloat(newProdTax) || 18,
        hsn_code: newProdHsn.trim() || '6802',
        opening_stock: parseFloat(newProdStock) || 0,
        min_stock: 10,
        status: 'Active'
      });

      if (onRefresh) onRefresh();

      // If triggered from an item row, select it
      if (quickAddRowIndex !== null && items[quickAddRowIndex]) {
        const updated = [...items];
        updated[quickAddRowIndex] = {
          ...updated[quickAddRowIndex],
          product_id: newProd.id,
          item_name: newProd.name,
          unit: newProd.unit,
          rate: newProd.selling_price,
          tax_percent: newProd.tax_percent,
          hsn_code: newProd.hsn_code
        };
        setItems(updated);
      } else {
        // Append as a new row
        setItems([
          ...items,
          {
            product_id: newProd.id,
            item_name: newProd.name,
            item_description: '',
            hsn_code: newProd.hsn_code,
            length_in: '',
            height_in: '',
            pieces: '',
            qty: 25,
            unit: newProd.unit,
            rate: newProd.selling_price,
            discount: 0,
            tax_percent: newProd.tax_percent
          }
        ]);
      }
      setQuickAddProductOpen(false);
    } catch (err) {
      alert('Failed to save product: ' + err.message);
    } finally {
      setQuickProdLoading(false);
    }
  };

  // Calculations
  const subtotal = items.reduce((acc, it) => acc + ((parseFloat(it.qty) || 0) * (parseFloat(it.rate) || 0)), 0);
  const discountSum = items.reduce((acc, it) => acc + (parseFloat(it.discount) || 0), 0);
  const taxSum = items.reduce((acc, it) => {
    const base = Math.max(0, ((parseFloat(it.qty) || 0) * (parseFloat(it.rate) || 0)) - (parseFloat(it.discount) || 0));
    return acc + (base * ((parseFloat(it.tax_percent) || 0) / 100.0));
  }, 0);
  const grandTotal = Math.max(0, subtotal - discountSum + taxSum + (parseFloat(transportCharges) || 0) + (parseFloat(roundOff) || 0));

  const handleSubmitEstimate = async (e) => {
    e.preventDefault();
    setFormError(null);

    if (!customerName.trim()) {
      setFormError('Please enter or select a customer name.');
      return;
    }
    if (!items || items.length === 0) {
      setFormError('Please add at least one stone item.');
      return;
    }

    setSavingEstimate(true);
    try {
      const payload = {
        estimate_no: estimateNo.trim(),
        customer_id: customerId ? Number(customerId) : null,
        customer_name: customerName.trim(),
        customer_phone: customerPhone.trim(),
        customer_address: customerAddress.trim(),
        customer_gstin: customerGstin.trim(),
        date: estDate,
        valid_until: validUntil,
        status: estStatus,
        transport_charges: parseFloat(transportCharges) || 0,
        round_off: parseFloat(roundOff) || 0,
        notes: notes.trim(),
        terms: terms.trim(),
        items: items.map(it => ({
          product_id: it.product_id ? Number(it.product_id) : null,
          item_name: it.item_name.trim(),
          item_description: it.item_description || '',
          hsn_code: it.hsn_code || '6802',
          length_in: parseFloat(it.length_in) || null,
          height_in: parseFloat(it.height_in) || null,
          pieces: parseInt(it.pieces) || null,
          qty: parseFloat(it.qty) || 1,
          unit: it.unit || 'sq.ft',
          rate: parseFloat(it.rate) || 0,
          discount: parseFloat(it.discount) || 0,
          tax_percent: parseFloat(it.tax_percent) || 0
        }))
      };

      if (editingEstimateId) {
        await api.updateEstimate(editingEstimateId, payload);
      } else {
        await api.createEstimate(payload);
      }

      setEditorOpen(false);
      loadEstimates();
      if (onRefresh) onRefresh();
    } catch (err) {
      setFormError(err.message || 'Failed to save estimate bill');
    } finally {
      setSavingEstimate(false);
    }
  };

  // Convert Estimate to Official GST Sale Bill
  const handleConvertEstimate = async (est) => {
    try {
      const res = await api.convertEstimateToSale(est.id);
      alert(`Success! ${res.message}`);
      setConvertConfirmEstimate(null);
      loadEstimates();
      if (onRefresh) onRefresh();
      if (onNavigateToSale) onNavigateToSale();
    } catch (e) {
      alert('Error converting estimate: ' + e.message);
    }
  };

  // Delete Estimate
  const handleDeleteEstimate = async (est) => {
    try {
      await api.deleteEstimate(est.id);
      setDeleteConfirmEstimate(null);
      loadEstimates();
      if (onRefresh) onRefresh();
    } catch (e) {
      alert('Failed to delete estimate: ' + e.message);
    }
  };

  // View Print Modal
  const handleViewAndPrint = async (estId) => {
    try {
      const data = await api.getEstimate(estId);
      setPrintModalEstimate(data);
    } catch (e) {
      alert('Failed to load estimate print details: ' + e.message);
    }
  };

  // Open Email Modal
  const handleOpenEmail = async (est) => {
    setEmailResult(null);
    setEmailModalEstimate(est);
    setEmailRecipient(est.customer_phone ? (est.customer_phone.includes('@') ? est.customer_phone : '') : '');
    
    // Check if customer profile has email
    const cust = customers.find(c => String(c.id) === String(est.customer_id));
    if (cust && cust.email) {
      setEmailRecipient(cust.email);
    }

    const compName = settings?.company_name || 'Billora Marbles & Granites';
    setEmailSubject(`Stone Quotation Estimate #${est.estimate_no} - ${compName}`);
    setEmailBody(`Dear ${est.customer_name || 'Customer'},\n\nPlease find attached the stone estimation quotation (${est.estimate_no}) from ${compName}.\n\nTotal Estimated Amount: ${formatMoney(est.total)}\nValid Until: ${est.valid_until || '15 Days'}\n\nNote: This is an estimation quotation and does not affect stock or customer accounting ledger.\n\nThank you for choosing ${compName}!`);
  };

  const handleSendEmailSubmit = async (e) => {
    e.preventDefault();
    if (!emailRecipient.trim()) {
      alert('Please enter a recipient email');
      return;
    }
    setEmailSending(true);
    setEmailResult(null);
    try {
      const res = await api.sendEstimateEmail(emailModalEstimate.id, {
        recipient_email: emailRecipient.trim(),
        subject: emailSubject.trim(),
        message: emailBody.trim()
      });
      setEmailResult({ success: true, message: res.message });
    } catch (err) {
      setEmailResult({ success: false, message: err.message });
    } finally {
      setEmailSending(false);
    }
  };

  // Open WhatsApp Modal
  const handleOpenWhatsApp = async (est) => {
    setWaCopied(false);
    setWhatsAppModalEstimate(est);
    try {
      const res = await api.getEstimateWhatsapp(est.id, est.customer_phone || '');
      setWaPhone(res.phone || est.customer_phone || '');
      setWaMessage(res.text || '');
      setWaShareUrl(res.url || '');
    } catch (e) {
      setWaPhone(est.customer_phone || '');
      setWaMessage(`*ESTIMATION BILL - ${settings?.company_name || 'BILLORA MARBLES'}*\nEstimate No: ${est.estimate_no}\nCustomer: ${est.customer_name}\nTotal: ${formatMoney(est.total)}\n\n(Estimation Only - Does not reflect stock or accounts)`);
    }
  };

  const handleWhatsAppSend = async () => {
    try {
      setWaSending(true);
      const res = await api.sendEstimateWhatsapp(whatsAppModalEstimate.id, {
        phone: waPhone,
        message: waMessage
      });
      window.open(res.url, '_blank', 'noopener,noreferrer');
    } catch (e) {
      window.open(waShareUrl || `https://api.whatsapp.com/send?text=${encodeURIComponent(waMessage)}`, '_blank');
    } finally {
      setWaSending(false);
    }
  };

  const handleCopyWhatsAppText = () => {
    navigator.clipboard.writeText(waMessage);
    setWaCopied(true);
    setTimeout(() => setWaCopied(false), 2500);
  };

  // KPI Calculations
  const totalCount = estimates.length;
  const draftCount = estimates.filter(e => e.status === 'Draft').length;
  const approvedCount = estimates.filter(e => e.status === 'Approved').length;
  const convertedCount = estimates.filter(e => e.status === 'Converted').length;
  const totalQuotedValue = estimates.reduce((sum, e) => sum + (parseFloat(e.total) || 0), 0);

  return (
    <div className="view-container">
      {/* 1. Header & Non-Deduction Notice */}
      <div className="view-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
              Estimations & Quotations (Estimate Bills)
            </h2>
            <span style={{ 
              background: 'var(--primary-light)', 
              color: 'var(--primary)', 
              padding: '3px 10px', 
              borderRadius: '20px', 
              fontSize: '0.75rem', 
              fontWeight: 700,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              <Sparkles size={12} /> Proforma Module
            </span>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.25rem' }}>
            <strong>Estimation Only:</strong> Quotes stone slabs and calculations without reducing warehouse inventory stock or affecting customer accounting ledger balances.
          </p>
        </div>

        <div className="view-header-actions">
          <button className="btn btn-primary" onClick={handleOpenCreate}>
            <Plus size={16} />
            <span>Create Estimation Bill</span>
          </button>
        </div>
      </div>

      {/* 2. Notice Banner */}
      <div style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-subtle)',
        borderLeft: '4px solid var(--primary)',
        padding: '0.75rem 1rem',
        borderRadius: 'var(--radius-md)',
        marginBottom: '1rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        fontSize: '0.82rem',
        color: 'var(--text-muted)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <AlertCircle size={16} style={{ color: 'var(--primary)' }} />
          <span>
            <strong>Isolated Quotation Architecture:</strong> All items in an estimation display live warehouse stock in a <em>disabled reference field</em>. No inventory is reserved or deducted until explicitly converted to a GST Sale Bill.
          </span>
        </div>
        <button 
          className="btn btn-sm btn-secondary" 
          onClick={() => handleOpenQuickAdd(null)}
          title="Add a new marble or granite slab product into catalog directly from bill module"
        >
          <Plus size={13} /> Quick Add Product
        </button>
      </div>

      {/* 3. KPI Cards */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-title">Total Estimates</div>
          <div className="kpi-value font-mono">{totalCount}</div>
          <div className="kpi-sub">Total quotations issued</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-title">Total Quoted Value</div>
          <div className="kpi-value font-mono" style={{ color: 'var(--primary)' }}>
            {formatMoney(totalQuotedValue)}
          </div>
          <div className="kpi-sub">Combined proforma estimate</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-title">Draft / Pending</div>
          <div className="kpi-value font-mono" style={{ color: 'var(--warning)' }}>
            {draftCount}
          </div>
          <div className="kpi-sub">Awaiting customer approval</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-title">Approved Quotes</div>
          <div className="kpi-value font-mono" style={{ color: 'var(--success)' }}>
            {approvedCount}
          </div>
          <div className="kpi-sub">Confirmed by client</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-title">Converted to Sales</div>
          <div className="kpi-value font-mono" style={{ color: '#0284c7' }}>
            {convertedCount}
          </div>
          <div className="kpi-sub">Stock & ledger updated</div>
        </div>
      </div>

      {/* 4. Filter Toolbar */}
      <div className="table-toolbar">
        <div className="search-wrap">
          <Search size={16} className="search-icon" />
          <input 
            type="text" 
            className="search-input" 
            placeholder="Search by estimate no, customer name, phone..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
          <select 
            className="form-select" 
            style={{ width: '160px', padding: '0.45rem 0.75rem', fontSize: '0.85rem' }}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Statuses</option>
            <option value="Draft">Draft</option>
            <option value="Sent">Sent</option>
            <option value="Approved">Approved</option>
            <option value="Converted">Converted to Sale</option>
            <option value="Expired">Expired</option>
          </select>
        </div>
      </div>

      {/* 5. Estimates Table */}
      <div className="table-card">
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Estimate No</th>
                <th>Date</th>
                <th>Customer / Client</th>
                <th style={{ textAlign: 'center' }}>Items</th>
                <th style={{ textAlign: 'right' }}>Total Quoted</th>
                <th style={{ textAlign: 'center' }}>Status</th>
                <th style={{ textAlign: 'center' }}>Quick Modules</th>
                <th style={{ textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '3rem' }}>
                    <Loader message="Loading Stone Estimations..." size="small" />
                  </td>
                </tr>
              ) : estimates && estimates.length > 0 ? (
                estimates.map(e => (
                  <tr key={e.id}>
                    <td className="font-mono">
                      <span 
                        style={{ cursor: 'pointer', textDecoration: 'underline', color: 'var(--primary)', fontWeight: 700 }}
                        onClick={() => handleViewAndPrint(e.id)}
                      >
                        {e.estimate_no}
                      </span>
                    </td>
                    <td>{e.date}</td>
                    <td>
                      <strong>{e.display_customer_name || e.customer_name}</strong>
                      {(e.display_customer_phone || e.customer_phone) && (
                        <span style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                          📞 {e.display_customer_phone || e.customer_phone}
                        </span>
                      )}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <span style={{ background: 'var(--bg-secondary)', padding: '2px 8px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 600 }}>
                        {e.item_count || 1} items
                      </span>
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--text-main)' }}>
                      {formatMoney(e.total)}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <span className={`badge badge-${(e.status || 'draft').toLowerCase().replace(' ', '_')}`}>
                        {e.status}
                      </span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      {/* PDF, Email, WhatsApp quick actions */}
                      <div style={{ display: 'flex', gap: '0.35rem', justifyContent: 'center' }}>
                        <a 
                          href={api.getEstimatePdfUrl(e.id)} 
                          target="_blank" 
                          rel="noreferrer"
                          className="btn btn-sm btn-secondary" 
                          title="Generate & Download PDF"
                          style={{ padding: '4px 8px' }}
                        >
                          <Download size={13} style={{ color: 'var(--primary)' }} />
                          <span style={{ fontSize: '0.72rem' }}>PDF</span>
                        </a>
                        <button 
                          className="btn btn-sm btn-secondary" 
                          onClick={() => handleOpenEmail(e)}
                          title="Send generated PDF via Email"
                          style={{ padding: '4px 8px' }}
                        >
                          <Mail size={13} style={{ color: '#0284c7' }} />
                          <span style={{ fontSize: '0.72rem' }}>Email</span>
                        </button>
                        <button 
                          className="btn btn-sm btn-secondary" 
                          onClick={() => handleOpenWhatsApp(e)}
                          title="Share quotation via WhatsApp"
                          style={{ padding: '4px 8px' }}
                        >
                          <MessageSquare size={13} style={{ color: '#059669' }} />
                          <span style={{ fontSize: '0.72rem' }}>WhatsApp</span>
                        </button>
                      </div>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '0.35rem', justifyContent: 'center' }}>
                        <button 
                          className="btn btn-sm btn-secondary" 
                          onClick={() => handleViewAndPrint(e.id)} 
                          title="Print Estimate Slip"
                        >
                          <Printer size={13} />
                        </button>
                        {e.status !== 'Converted' && (
                          <button 
                            className="btn btn-sm btn-success" 
                            onClick={() => setConvertConfirmEstimate(e)}
                            title="Convert Approved Estimate to Official GST Sale Bill"
                            style={{ padding: '4px 8px', fontSize: '0.72rem' }}
                          >
                            <ArrowRightCircle size={13} /> Convert to Sale
                          </button>
                        )}
                        <button 
                          className="btn btn-sm btn-secondary" 
                          onClick={() => handleOpenEdit(e.id)} 
                          title="Edit Estimation"
                        >
                          <Edit3 size={13} />
                        </button>
                        <button 
                          className="btn btn-sm btn-danger-outline" 
                          onClick={() => setDeleteConfirmEstimate(e)} 
                          title="Delete Estimation"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '3.5rem', color: 'var(--text-muted)' }}>
                    No estimation bills found. Click <strong>"+ Create Estimation Bill"</strong> to generate a proforma quotation.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ==============================================================================
          ESTIMATION EDITOR MODAL (With Disabled Stock Column & Dimension Calculator)
         ============================================================================== */}
      {editorOpen && (
        <div className="modal-overlay">
          <div className="modal-container modal-lg" style={{ maxHeight: '92vh', display: 'flex', flexDirection: 'column' }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <Calculator size={20} style={{ color: 'var(--primary)' }} />
                <h3 style={{ margin: 0, fontSize: '1.1rem' }}>
                  {editingEstimateId ? `Edit Estimation Bill — ${estimateNo}` : 'New Estimation Bill / Price Quotation'}
                </h3>
                <span style={{ 
                  background: 'var(--warning-bg)', 
                  color: 'var(--warning)', 
                  padding: '2px 8px', 
                  borderRadius: '4px', 
                  fontSize: '0.72rem', 
                  fontWeight: 700 
                }}>
                  NO STOCK / LEDGER IMPACT
                </span>
              </div>
              <button className="modal-close-btn" onClick={() => setEditorOpen(false)}><X size={20} /></button>
            </div>

            <form onSubmit={handleSubmitEstimate} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
              <div className="modal-body" style={{ overflowY: 'auto', padding: '1.25rem' }}>
                {formError && (
                  <div style={{ padding: '0.75rem', background: 'var(--danger-bg)', border: '1px solid var(--danger-border)', color: 'var(--danger)', borderRadius: 'var(--radius-sm)', marginBottom: '1rem', fontSize: '0.84rem' }}>
                    {formError}
                  </div>
                )}

                {/* Section 1: Customer Details */}
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
                  1. Client / Customer Information
                </div>

                <div className="form-row">
                  <div className="form-group" style={{ flex: 1.5 }}>
                    <label className="form-label">Existing Client (Optional)</label>
                    <select 
                      className="form-select" 
                      value={customerId} 
                      onChange={(e) => handleCustomerChange(e.target.value)}
                    >
                      <option value="">-- Type New Customer or Choose Contact --</option>
                      {customers && customers.map(c => (
                        <option key={c.id} value={c.id}>{c.name} {c.company ? `(${c.company})` : ''}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group" style={{ flex: 1.5 }}>
                    <label className="form-label">Customer Name *</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="e.g. Binu George" 
                      value={customerName} 
                      onChange={(e) => setCustomerName(e.target.value)} 
                      required 
                    />
                  </div>

                  <div className="form-group" style={{ flex: 1 }}>
                    <label className="form-label">Phone Number</label>
                    <input 
                      type="text" 
                      className="form-input font-mono" 
                      placeholder="9447123456" 
                      value={customerPhone} 
                      onChange={(e) => setCustomerPhone(e.target.value)} 
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group" style={{ flex: 2 }}>
                    <label className="form-label">Customer Site / Delivery Address</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="e.g. Near St. Mary's Church, Kottarakara" 
                      value={customerAddress} 
                      onChange={(e) => setCustomerAddress(e.target.value)} 
                    />
                  </div>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label className="form-label">GSTIN (If registered)</label>
                    <input 
                      type="text" 
                      className="form-input font-mono" 
                      placeholder="32ABCDE1234F1Z5" 
                      value={customerGstin} 
                      onChange={(e) => setCustomerGstin(e.target.value)} 
                    />
                  </div>
                </div>

                {/* Section 2: Estimation Metadata */}
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '1rem', marginBottom: '0.5rem' }}>
                  2. Quotation Metadata
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Estimate No</label>
                    <input 
                      type="text" 
                      className="form-input font-mono" 
                      value={estimateNo} 
                      onChange={(e) => setEstimateNo(e.target.value)} 
                      required 
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Date of Issue</label>
                    <input 
                      type="date" 
                      className="form-input font-mono" 
                      value={estDate} 
                      onChange={(e) => setEstDate(e.target.value)} 
                      required 
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Valid Until</label>
                    <input 
                      type="date" 
                      className="form-input font-mono" 
                      value={validUntil} 
                      onChange={(e) => setValidUntil(e.target.value)} 
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Status</label>
                    <select 
                      className="form-select" 
                      value={estStatus} 
                      onChange={(e) => setEstStatus(e.target.value)}
                    >
                      <option value="Draft">Draft</option>
                      <option value="Sent">Sent to Client</option>
                      <option value="Approved">Approved</option>
                      <option value="Rejected">Rejected</option>
                    </select>
                  </div>
                </div>

                {/* Section 3: Stone Items Table WITH DISABLED STOCK COLUMN & QUICK ADD BUTTON */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.25rem', marginBottom: '0.5rem' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    3. Stone Items, Slabs & Dimensions
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button 
                      type="button" 
                      className="btn btn-sm btn-secondary" 
                      onClick={() => handleOpenQuickAdd(items.length - 1)}
                    >
                      <Plus size={13} /> Quick Add New Product
                    </button>
                    <button 
                      type="button" 
                      className="btn btn-sm btn-primary" 
                      onClick={handleAddItemRow}
                    >
                      <Plus size={13} /> Add Stone Line
                    </button>
                  </div>
                </div>

                <div style={{ border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', overflowX: 'auto', marginBottom: '1rem' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                    <thead>
                      <tr style={{ background: 'var(--table-th-bg)', borderBottom: '1px solid var(--border-subtle)' }}>
                        <th style={{ padding: '8px 10px', textAlign: 'left', minWidth: '180px' }}>Stone / Product *</th>
                        <th style={{ padding: '8px 6px', textAlign: 'center', width: '110px' }} title="Current available stock in warehouse - Disabled reference only">
                          Rem. Stock (Ref)
                        </th>
                        <th style={{ padding: '8px 6px', width: '70px', textAlign: 'center' }}>L (in)</th>
                        <th style={{ padding: '8px 6px', width: '70px', textAlign: 'center' }}>H (in)</th>
                        <th style={{ padding: '8px 6px', width: '55px', textAlign: 'center' }}>Pcs</th>
                        <th style={{ padding: '8px 6px', width: '85px', textAlign: 'center' }}>Qty (sqft)</th>
                        <th style={{ padding: '8px 6px', width: '85px', textAlign: 'center' }}>Rate ({currency})</th>
                        <th style={{ padding: '8px 6px', width: '65px', textAlign: 'center' }}>GST%</th>
                        <th style={{ padding: '8px 10px', width: '100px', textAlign: 'right' }}>Total</th>
                        <th style={{ padding: '8px 4px', width: '35px' }}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((row, idx) => {
                        const selectedProd = products.find(p => p.id === Number(row.product_id));
                        const remStockDisplay = selectedProd 
                          ? `${selectedProd.current_stock ?? 0} ${selectedProd.unit || 'sq.ft'}`
                          : '—';

                        const lineSub = (parseFloat(row.qty) || 0) * (parseFloat(row.rate) || 0);
                        const lineTax = lineSub * ((parseFloat(row.tax_percent) || 0) / 100);
                        const lineTot = lineSub + lineTax;

                        return (
                          <tr key={idx} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                            <td style={{ padding: '6px 8px' }}>
                              <select 
                                className="form-select" 
                                style={{ padding: '5px 8px', fontSize: '0.82rem' }}
                                value={row.product_id}
                                onChange={(e) => handleProductSelect(idx, e.target.value)}
                              >
                                <option value="">Custom Item / Service</option>
                                {products && products.map(p => (
                                  <option key={p.id} value={p.id}>
                                    {p.name} (Stock: {p.current_stock ?? 0} {p.unit})
                                  </option>
                                ))}
                              </select>
                              {(!row.product_id || row.product_id === '') && (
                                <input 
                                  type="text" 
                                  className="form-input" 
                                  placeholder="Type stone description..." 
                                  style={{ marginTop: '4px', padding: '4px 6px', fontSize: '0.8rem' }}
                                  value={row.item_name}
                                  onChange={(e) => handleItemChange(idx, 'item_name', e.target.value)}
                                  required
                                />
                              )}
                            </td>

                            {/* REMAINING STOCK DISABLED INPUT */}
                            <td style={{ padding: '6px 6px', textAlign: 'center' }}>
                              <input 
                                type="text" 
                                className="form-input font-mono" 
                                disabled 
                                readOnly 
                                value={remStockDisplay} 
                                title="Existing warehouse remaining stock (Disabled — will NOT be deducted in estimate)"
                                style={{ 
                                  padding: '5px 4px', 
                                  fontSize: '0.78rem', 
                                  textAlign: 'center', 
                                  background: 'var(--bg-secondary)', 
                                  color: 'var(--text-muted)', 
                                  fontWeight: 700, 
                                  cursor: 'not-allowed',
                                  borderColor: 'var(--border-subtle)'
                                }} 
                              />
                            </td>

                            {/* Dimensions Length */}
                            <td style={{ padding: '6px 4px' }}>
                              <input 
                                type="number" 
                                step="any"
                                placeholder="L" 
                                className="form-input font-mono" 
                                style={{ padding: '5px 4px', fontSize: '0.82rem', textAlign: 'center' }}
                                value={row.length_in} 
                                onChange={(e) => handleDimensionChange(idx, 'length_in', e.target.value)} 
                              />
                            </td>

                            {/* Dimensions Height */}
                            <td style={{ padding: '6px 4px' }}>
                              <input 
                                type="number" 
                                step="any"
                                placeholder="H" 
                                className="form-input font-mono" 
                                style={{ padding: '5px 4px', fontSize: '0.82rem', textAlign: 'center' }}
                                value={row.height_in} 
                                onChange={(e) => handleDimensionChange(idx, 'height_in', e.target.value)} 
                              />
                            </td>

                            {/* Pieces */}
                            <td style={{ padding: '6px 4px' }}>
                              <input 
                                type="number" 
                                placeholder="Pcs" 
                                className="form-input font-mono" 
                                style={{ padding: '5px 4px', fontSize: '0.82rem', textAlign: 'center' }}
                                value={row.pieces} 
                                onChange={(e) => handleDimensionChange(idx, 'pieces', e.target.value)} 
                              />
                            </td>

                            {/* Quantity (Sq.Ft) */}
                            <td style={{ padding: '6px 4px' }}>
                              <input 
                                type="number" 
                                step="any"
                                className="form-input font-mono" 
                                style={{ padding: '5px 6px', fontSize: '0.82rem', textAlign: 'center' }}
                                value={row.qty} 
                                onChange={(e) => handleItemChange(idx, 'qty', e.target.value)} 
                                required 
                              />
                            </td>

                            {/* Rate */}
                            <td style={{ padding: '6px 4px' }}>
                              <input 
                                type="number" 
                                step="any"
                                className="form-input font-mono" 
                                style={{ padding: '5px 6px', fontSize: '0.82rem', textAlign: 'right' }}
                                value={row.rate} 
                                onChange={(e) => handleItemChange(idx, 'rate', e.target.value)} 
                                required 
                              />
                            </td>

                            {/* Tax % */}
                            <td style={{ padding: '6px 4px' }}>
                              <select 
                                className="form-select font-mono" 
                                style={{ padding: '5px 4px', fontSize: '0.8rem', textAlign: 'center' }}
                                value={row.tax_percent}
                                onChange={(e) => handleItemChange(idx, 'tax_percent', e.target.value)}
                              >
                                <option value="0">0%</option>
                                <option value="5">5%</option>
                                <option value="12">12%</option>
                                <option value="18">18%</option>
                                <option value="28">28%</option>
                              </select>
                            </td>

                            {/* Total Amount */}
                            <td style={{ padding: '6px 10px', textAlign: 'right', fontWeight: 700 }} className="font-mono">
                              {lineTot.toFixed(2)}
                            </td>

                            {/* Delete line */}
                            <td style={{ padding: '6px 4px', textAlign: 'center' }}>
                              {items.length > 1 && (
                                <button 
                                  type="button" 
                                  onClick={() => handleRemoveItemRow(idx)}
                                  style={{ background: 'transparent', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: '2px' }}
                                >
                                  <Trash2 size={14} />
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Section 4: Totals & Charges */}
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1.5rem', marginTop: '1rem' }}>
                  <div>
                    <div className="form-group">
                      <label className="form-label">Quotation Notes / Remarks</label>
                      <textarea 
                        className="form-textarea" 
                        rows={2} 
                        placeholder="e.g. Rate inclusive of edge polishing. Delivery scheduled for next week."
                        value={notes} 
                        onChange={(e) => setNotes(e.target.value)} 
                      />
                    </div>
                    <div className="form-group" style={{ marginTop: '0.5rem' }}>
                      <label className="form-label">Terms & Conditions</label>
                      <textarea 
                        className="form-textarea" 
                        rows={3} 
                        value={terms} 
                        onChange={(e) => setTerms(e.target.value)} 
                      />
                    </div>
                  </div>

                  <div style={{ background: 'var(--bg-secondary)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem', fontSize: '0.85rem' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Subtotal (Excl. Tax):</span>
                      <span className="font-mono" style={{ fontWeight: 600 }}>{formatMoney(subtotal)}</span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem', fontSize: '0.85rem' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Total Tax (GST 18%):</span>
                      <span className="font-mono" style={{ fontWeight: 600 }}>{formatMoney(taxSum)}</span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem', fontSize: '0.85rem' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Transport Charges:</span>
                      <input 
                        type="number" 
                        className="form-input font-mono" 
                        style={{ width: '100px', padding: '3px 8px', fontSize: '0.85rem', textAlign: 'right' }}
                        value={transportCharges} 
                        onChange={(e) => setTransportCharges(e.target.value)} 
                      />
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem', fontSize: '0.85rem' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Round Off:</span>
                      <input 
                        type="number" 
                        step="any"
                        className="form-input font-mono" 
                        style={{ width: '100px', padding: '3px 8px', fontSize: '0.85rem', textAlign: 'right' }}
                        value={roundOff} 
                        onChange={(e) => setRoundOff(e.target.value)} 
                      />
                    </div>

                    <div style={{ borderTop: '2px dashed var(--border-subtle)', paddingTop: '0.6rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--text-main)' }}>Estimated Total:</span>
                      <span className="font-mono" style={{ fontWeight: 800, fontSize: '1.25rem', color: 'var(--primary)' }}>
                        {formatMoney(grandTotal)}
                      </span>
                    </div>

                    <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontStyle: 'italic', marginTop: '0.4rem', textAlign: 'right' }}>
                      {numberToWordsINR(grandTotal)}
                    </div>
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setEditorOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={savingEstimate}>
                  {savingEstimate ? 'Saving Quotation...' : (editingEstimateId ? 'Update Estimation Bill' : 'Save Estimation Bill')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==============================================================================
          QUICK ADD PRODUCT MODAL (Added directly into Bill Section)
         ============================================================================== */}
      {quickAddProductOpen && (
        <div className="modal-overlay" style={{ zIndex: 1100 }}>
          <div className="modal-container modal-sm">
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Layers size={18} style={{ color: 'var(--primary)' }} />
                <h4 style={{ margin: 0 }}>Add New Stone Product to Catalog</h4>
              </div>
              <button className="modal-close-btn" onClick={() => setQuickAddProductOpen(false)}><X size={18} /></button>
            </div>

            <form onSubmit={handleSaveQuickProduct}>
              <div className="modal-body">
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.8rem' }}>
                  Register a new stone product into the master catalog without leaving your billing screen.
                </p>

                <div className="form-group" style={{ marginBottom: '0.75rem' }}>
                  <label className="form-label">Product / Stone Name *</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="e.g. Rajasthan Black Marble" 
                    value={newProdName} 
                    onChange={(e) => setNewProdName(e.target.value)} 
                    required 
                  />
                </div>

                <div className="form-row" style={{ marginBottom: '0.75rem' }}>
                  <div className="form-group">
                    <label className="form-label">Category</label>
                    <select 
                      className="form-select" 
                      value={newProdCat} 
                      onChange={(e) => setNewProdCat(e.target.value)}
                    >
                      <option value="Granite">Granite</option>
                      <option value="Marble">Marble</option>
                      <option value="Quartz">Quartz</option>
                      <option value="Sandstone">Sandstone</option>
                      <option value="Tiles">Tiles</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Unit</label>
                    <select 
                      className="form-select" 
                      value={newProdUnit} 
                      onChange={(e) => setNewProdUnit(e.target.value)}
                    >
                      <option value="sq.ft">sq.ft</option>
                      <option value="nos">nos (pieces)</option>
                      <option value="sq.m">sq.m</option>
                      <option value="ton">ton</option>
                    </select>
                  </div>
                </div>

                <div className="form-row" style={{ marginBottom: '0.75rem' }}>
                  <div className="form-group">
                    <label className="form-label">HSN Code</label>
                    <input 
                      type="text" 
                      className="form-input font-mono" 
                      value={newProdHsn} 
                      onChange={(e) => setNewProdHsn(e.target.value)} 
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Selling Rate ({currency})</label>
                    <input 
                      type="number" 
                      step="any"
                      className="form-input font-mono" 
                      value={newProdRate} 
                      onChange={(e) => setNewProdRate(e.target.value)} 
                      required 
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">GST Tax Rate</label>
                    <select 
                      className="form-select font-mono" 
                      value={newProdTax} 
                      onChange={(e) => setNewProdTax(e.target.value)}
                    >
                      <option value="0">0%</option>
                      <option value="5">5%</option>
                      <option value="12">12%</option>
                      <option value="18">18% (Standard Stone)</option>
                      <option value="28">28%</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Initial Stock Available</label>
                    <input 
                      type="number" 
                      step="any"
                      className="form-input font-mono" 
                      value={newProdStock} 
                      onChange={(e) => setNewProdStock(e.target.value)} 
                    />
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setQuickAddProductOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={quickProdLoading}>
                  {quickProdLoading ? 'Saving...' : 'Save & Select in Bill'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==============================================================================
          ESTIMATION PRINT / SLIP PREVIEW MODAL
         ============================================================================== */}
      {printModalEstimate && (
        <div className="modal-overlay">
          <div className="modal-container modal-lg" style={{ maxHeight: '95vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <div className="modal-header no-print">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <Calculator size={18} style={{ color: 'var(--primary)' }} />
                <h3 style={{ margin: 0, fontSize: '1.05rem' }}>
                  Estimation Quotation Preview — {printModalEstimate.estimate.estimate_no}
                </h3>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <a 
                  href={api.getEstimatePdfUrl(printModalEstimate.estimate.id)} 
                  target="_blank" 
                  rel="noreferrer"
                  className="btn btn-sm btn-primary"
                >
                  <Download size={14} /> Download PDF
                </a>
                <button className="btn btn-sm btn-secondary" onClick={() => window.print()}>
                  <Printer size={14} /> Print Slip
                </button>
                <button className="modal-close-btn" onClick={() => setPrintModalEstimate(null)}>
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="modal-body" style={{ overflowY: 'auto', background: '#f8fafc', padding: '1.5rem' }}>
              <div style={{
                background: '#ffffff',
                border: '1px solid #cbd5e1',
                padding: '2rem',
                color: '#0f172a',
                fontFamily: 'sans-serif',
                maxWidth: '850px',
                margin: '0 auto',
                boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
              }}>
                {/* Header */}
                <div style={{ textAlign: 'center', borderBottom: '2px solid #0f172a', paddingBottom: '1rem', marginBottom: '1rem' }}>
                  <h1 style={{ fontSize: '1.6rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.04em', margin: 0 }}>
                    {printModalEstimate.company?.company_name || 'BILLORA MARBLES & GRANITES'}
                  </h1>
                  <p style={{ fontSize: '0.85rem', color: '#475569', margin: '4px 0' }}>
                    {printModalEstimate.company?.address || 'Chengamanadu, Kottarakkara, Kollam, Kerala - 691557'}
                  </p>
                  <p style={{ fontSize: '0.82rem', color: '#475569', margin: 0 }}>
                    Phone: <strong>{printModalEstimate.company?.phone || '+91 9460110878, 8504882265'}</strong> | GSTIN: <strong>{printModalEstimate.company?.gstin || '32FGZPR5431L1ZL'}</strong>
                  </p>
                  <div style={{ 
                    display: 'inline-block', 
                    marginTop: '0.75rem', 
                    padding: '4px 16px', 
                    background: '#eff6ff', 
                    border: '1px solid #93c5fd', 
                    borderRadius: '20px', 
                    fontWeight: 800, 
                    fontSize: '0.85rem', 
                    color: '#1e40af' 
                  }}>
                    ESTIMATION BILL / PRICE QUOTATION (PROFORMA)
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#64748b', fontStyle: 'italic', marginTop: '3px' }}>
                    * This is an estimate quotation and does not constitute a tax deduction invoice or ledger receipt.
                  </div>
                </div>

                {/* Meta details */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem', fontSize: '0.85rem' }}>
                  <div style={{ border: '1px solid #e2e8f0', padding: '0.75rem', borderRadius: '4px' }}>
                    <div style={{ fontWeight: 800, color: '#475569', fontSize: '0.75rem', textTransform: 'uppercase', marginBottom: '4px' }}>Customer / Billed To:</div>
                    <div style={{ fontSize: '1rem', fontWeight: 800 }}>{printModalEstimate.estimate.customer_name}</div>
                    <div>Phone: {printModalEstimate.estimate.customer_phone || '—'}</div>
                    <div>Address: {printModalEstimate.estimate.customer_address || '—'}</div>
                    {printModalEstimate.estimate.customer_gstin && <div>GSTIN: {printModalEstimate.estimate.customer_gstin}</div>}
                  </div>

                  <div style={{ border: '1px solid #e2e8f0', padding: '0.75rem', borderRadius: '4px' }}>
                    <div style={{ fontWeight: 800, color: '#475569', fontSize: '0.75rem', textTransform: 'uppercase', marginBottom: '4px' }}>Estimate Details:</div>
                    <div>Estimate No: <strong style={{ color: '#1e40af' }}>{printModalEstimate.estimate.estimate_no}</strong></div>
                    <div>Date of Issue: <strong>{printModalEstimate.estimate.date}</strong></div>
                    <div>Valid Until: <strong>{printModalEstimate.estimate.valid_until || '15 Days'}</strong></div>
                    <div>Status: <span style={{ textTransform: 'uppercase', fontWeight: 700 }}>{printModalEstimate.estimate.status}</span></div>
                  </div>
                </div>

                {/* Items Table */}
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem', marginBottom: '1rem' }}>
                  <thead>
                    <tr style={{ background: '#f1f5f9', borderTop: '1px solid #0f172a', borderBottom: '1px solid #0f172a' }}>
                      <th style={{ padding: '6px', textAlign: 'center', width: '35px' }}>S.No</th>
                      <th style={{ padding: '6px', textAlign: 'left' }}>Stone / Slab Description</th>
                      <th style={{ padding: '6px', textAlign: 'center', width: '60px' }}>HSN</th>
                      <th style={{ padding: '6px', textAlign: 'center', width: '80px' }}>Dimensions</th>
                      <th style={{ padding: '6px', textAlign: 'right', width: '80px' }}>Qty (sqft)</th>
                      <th style={{ padding: '6px', textAlign: 'right', width: '75px' }}>Rate (₹)</th>
                      <th style={{ padding: '6px', textAlign: 'right', width: '60px' }}>GST%</th>
                      <th style={{ padding: '6px', textAlign: 'right', width: '90px' }}>Amount (₹)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {printModalEstimate.items && printModalEstimate.items.map((it, idx) => {
                      const itemSub = (parseFloat(it.qty) || 0) * (parseFloat(it.rate) || 0);
                      const dims = (it.length_in && it.height_in) ? `${it.length_in}x${it.height_in}"` : '—';
                      return (
                        <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0' }}>
                          <td style={{ padding: '6px', textAlign: 'center' }}>{idx + 1}</td>
                          <td style={{ padding: '6px' }}>
                            <strong>{it.item_name}</strong>
                            {it.item_description && <span style={{ display: 'block', fontSize: '0.72rem', color: '#64748b' }}>{it.item_description}</span>}
                          </td>
                          <td style={{ padding: '6px', textAlign: 'center' }}>{it.hsn_code || '6802'}</td>
                          <td style={{ padding: '6px', textAlign: 'center' }}>{dims}</td>
                          <td style={{ padding: '6px', textAlign: 'right' }}>{parseFloat(it.qty).toFixed(2)} {it.unit || 'sq.ft'}</td>
                          <td style={{ padding: '6px', textAlign: 'right' }}>{parseFloat(it.rate).toFixed(2)}</td>
                          <td style={{ padding: '6px', textAlign: 'right' }}>{parseFloat(it.tax_percent).toFixed(0)}%</td>
                          <td style={{ padding: '6px', textAlign: 'right', fontWeight: 700 }}>{parseFloat(it.total).toFixed(2)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                {/* Bottom Split */}
                <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: '1.25rem', marginTop: '1rem', fontSize: '0.82rem' }}>
                  <div>
                    <div style={{ marginBottom: '0.5rem' }}>
                      <span style={{ fontWeight: 700, color: '#475569' }}>Total Amount in Words:</span>
                      <div style={{ fontWeight: 800, marginTop: '2px' }}>
                        {numberToWordsINR(printModalEstimate.estimate.total)}
                      </div>
                    </div>

                    <div style={{ background: '#f8fafc', padding: '0.6rem', border: '1px solid #e2e8f0', borderRadius: '4px', marginTop: '0.5rem' }}>
                      <div style={{ fontWeight: 800, color: '#475569', fontSize: '0.75rem', marginBottom: '2px' }}>Bank Details for Advance:</div>
                      <div>Bank: <strong>{printModalEstimate.bank?.bank_name || 'INDIAN BANK'}</strong></div>
                      <div>A/C Name: <strong>{printModalEstimate.bank?.account_name || printModalEstimate.company?.company_name}</strong></div>
                      <div>A/C No: <strong>{printModalEstimate.bank?.account_number || '50100456123489'}</strong> | IFSC: <strong>{printModalEstimate.bank?.ifsc_code || 'IDIB000K123'}</strong></div>
                    </div>

                    <div style={{ marginTop: '0.75rem', fontSize: '0.72rem', color: '#64748b' }}>
                      <strong>Terms & Conditions:</strong><br />
                      {(printModalEstimate.estimate.terms || '').split('\n').map((line, i) => (
                        <span key={i} style={{ display: 'block' }}>{line}</span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                      <tbody>
                        <tr>
                          <td style={{ padding: '4px 0', color: '#475569' }}>Subtotal:</td>
                          <td style={{ padding: '4px 0', textAlign: 'right', fontWeight: 600 }}>₹ {parseFloat(printModalEstimate.estimate.subtotal).toFixed(2)}</td>
                        </tr>
                        <tr>
                          <td style={{ padding: '4px 0', color: '#475569' }}>Discount:</td>
                          <td style={{ padding: '4px 0', textAlign: 'right', fontWeight: 600 }}>- ₹ {parseFloat(printModalEstimate.estimate.discount).toFixed(2)}</td>
                        </tr>
                        <tr>
                          <td style={{ padding: '4px 0', color: '#475569' }}>GST Tax:</td>
                          <td style={{ padding: '4px 0', textAlign: 'right', fontWeight: 600 }}>₹ {parseFloat(printModalEstimate.estimate.tax).toFixed(2)}</td>
                        </tr>
                        <tr>
                          <td style={{ padding: '4px 0', color: '#475569' }}>Transport:</td>
                          <td style={{ padding: '4px 0', textAlign: 'right', fontWeight: 600 }}>₹ {parseFloat(printModalEstimate.estimate.transport_charges).toFixed(2)}</td>
                        </tr>
                        <tr>
                          <td style={{ padding: '4px 0', color: '#475569' }}>Round Off:</td>
                          <td style={{ padding: '4px 0', textAlign: 'right', fontWeight: 600 }}>₹ {parseFloat(printModalEstimate.estimate.round_off).toFixed(2)}</td>
                        </tr>
                        <tr style={{ borderTop: '2px solid #0f172a', borderBottom: '2px solid #0f172a' }}>
                          <td style={{ padding: '6px 0', fontWeight: 900, fontSize: '0.95rem' }}>TOTAL ESTIMATE:</td>
                          <td style={{ padding: '6px 0', textAlign: 'right', fontWeight: 900, fontSize: '1.1rem', color: '#1e40af' }}>
                            ₹ {parseFloat(printModalEstimate.estimate.total).toFixed(2)}
                          </td>
                        </tr>
                      </tbody>
                    </table>

                    <div style={{ marginTop: '2.5rem', textAlign: 'right', fontSize: '0.8rem' }}>
                      <div style={{ fontWeight: 800 }}>For {printModalEstimate.company?.company_name || 'BILLORA MARBLES & GRANITES'}</div>
                      <div style={{ height: '35px' }}></div>
                      <div style={{ color: '#64748b' }}>Authorized Signatory</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==============================================================================
          SEND TO EMAIL MODAL (Sends generated PDF attachment)
         ============================================================================== */}
      {emailModalEstimate && (
        <div className="modal-overlay">
          <div className="modal-container modal-md">
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Mail size={18} style={{ color: '#0284c7' }} />
                <h4 style={{ margin: 0 }}>Send Estimation PDF via Email</h4>
              </div>
              <button className="modal-close-btn" onClick={() => setEmailModalEstimate(null)}><X size={18} /></button>
            </div>

            <form onSubmit={handleSendEmailSubmit}>
              <div className="modal-body">
                {emailResult && (
                  <div style={{
                    padding: '0.75rem',
                    marginBottom: '1rem',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.84rem',
                    background: emailResult.success ? 'var(--success-bg)' : 'var(--danger-bg)',
                    border: `1px solid ${emailResult.success ? 'var(--success-border)' : 'var(--danger-border)'}`,
                    color: emailResult.success ? 'var(--success)' : 'var(--danger)'
                  }}>
                    {emailResult.message}
                  </div>
                )}

                <div className="form-group" style={{ marginBottom: '0.8rem' }}>
                  <label className="form-label">Recipient Email *</label>
                  <input 
                    type="email" 
                    className="form-input" 
                    placeholder="customer@gmail.com" 
                    value={emailRecipient} 
                    onChange={(e) => setEmailRecipient(e.target.value)} 
                    required 
                  />
                </div>

                <div className="form-group" style={{ marginBottom: '0.8rem' }}>
                  <label className="form-label">Subject Line</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={emailSubject} 
                    onChange={(e) => setEmailSubject(e.target.value)} 
                    required 
                  />
                </div>

                <div className="form-group" style={{ marginBottom: '0.8rem' }}>
                  <label className="form-label">Message Body</label>
                  <textarea 
                    className="form-textarea" 
                    rows={4} 
                    value={emailBody} 
                    onChange={(e) => setEmailBody(e.target.value)} 
                  />
                </div>

                <div style={{
                  background: 'var(--bg-secondary)',
                  padding: '0.6rem 0.8rem',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.8rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  border: '1px solid var(--border-subtle)'
                }}>
                  <Download size={14} style={{ color: 'var(--primary)' }} />
                  <span>
                    Attachment: <strong>Estimate_{emailModalEstimate.estimate_no.replace(/ /g, '_')}.pdf</strong>
                  </span>
                </div>
              </div>

              <div className="modal-footer" style={{ justifyContent: 'space-between' }}>
                <a 
                  href={`mailto:${encodeURIComponent(emailRecipient)}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`}
                  className="btn btn-sm btn-secondary"
                  target="_blank"
                  rel="noreferrer"
                  title="Open local desktop email client (Thunderbird / Outlook / Apple Mail)"
                >
                  <ExternalLink size={13} /> Open Mail Client
                </a>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button type="button" className="btn btn-secondary" onClick={() => setEmailModalEstimate(null)}>
                    Close
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={emailSending}>
                    {emailSending ? 'Sending Dispatch...' : 'Send Email with PDF'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==============================================================================
          SEND TO WHATSAPP MODAL (Direct formatted WhatsApp share)
         ============================================================================== */}
      {whatsAppModalEstimate && (
        <div className="modal-overlay">
          <div className="modal-container modal-md">
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <MessageSquare size={18} style={{ color: '#059669' }} />
                <h4 style={{ margin: 0 }}>Send Quotation via WhatsApp</h4>
              </div>
              <button className="modal-close-btn" onClick={() => setWhatsAppModalEstimate(null)}><X size={18} /></button>
            </div>

            <div className="modal-body">
              <div className="form-group" style={{ marginBottom: '0.8rem' }}>
                <label className="form-label">Customer Mobile / WhatsApp Number *</label>
                <input 
                  type="text" 
                  className="form-input font-mono" 
                  placeholder="e.g. 9447123456 or +91 9447123456" 
                  value={waPhone} 
                  onChange={(e) => {
                    setWaPhone(e.target.value);
                    const clean = e.target.value.replace(/\D/g, '');
                    const phoneWithCode = clean.length === 10 ? '91' + clean : clean;
                    setWaShareUrl(`https://api.whatsapp.com/send?phone=${phoneWithCode}&text=${encodeURIComponent(waMessage)}`);
                  }} 
                />
              </div>

              <div className="form-group" style={{ marginBottom: '0.8rem' }}>
                <label className="form-label">Quotation Message Template</label>
                <textarea 
                  className="form-textarea font-mono" 
                  rows={8} 
                  style={{ fontSize: '0.8rem' }}
                  value={waMessage} 
                  onChange={(e) => {
                    setWaMessage(e.target.value);
                    const clean = waPhone.replace(/\D/g, '');
                    const phoneWithCode = clean.length === 10 ? '91' + clean : clean;
                    setWaShareUrl(`https://api.whatsapp.com/send?phone=${phoneWithCode}&text=${encodeURIComponent(e.target.value)}`);
                  }} 
                />
              </div>
            </div>

            <div className="modal-footer" style={{ justifyContent: 'space-between' }}>
              <button 
                type="button" 
                className="btn btn-secondary" 
                onClick={handleCopyWhatsAppText}
              >
                <Copy size={14} /> {waCopied ? 'Copied to Clipboard!' : 'Copy Message'}
              </button>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setWhatsAppModalEstimate(null)}>
                  Cancel
                </button>
                <button 
                  type="button" 
                  className="btn btn-success" 
                  onClick={handleWhatsAppSend}
                  disabled={waSending}
                >
                  <MessageSquare size={14} /> Open WhatsApp Web / App
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Convert Confirm Modal */}
      {convertConfirmEstimate && (
        <ConfirmModal 
          isOpen={true}
          title="Convert Approved Estimate to Official GST Sale Bill?"
          message={`Are you sure you want to convert Estimate ${convertConfirmEstimate.estimate_no} for ${convertConfirmEstimate.customer_name} of ${formatMoney(convertConfirmEstimate.total)} into an Official GST Tax Invoice? This will deduct the stone slab inventory and post into the customer accounts balance.`}
          confirmText="Yes, Convert to Official Sale"
          confirmType="primary"
          onConfirm={() => handleConvertEstimate(convertConfirmEstimate)}
          onCancel={() => setConvertConfirmEstimate(null)}
        />
      )}

      {/* Delete Confirm Modal */}
      {deleteConfirmEstimate && (
        <ConfirmModal 
          isOpen={true}
          title="Delete Estimation Bill?"
          message={`Are you sure you want to delete Estimate ${deleteConfirmEstimate.estimate_no}? It will be moved to the deleted archives recycle bin.`}
          confirmText="Delete Estimation"
          confirmType="danger"
          onConfirm={() => handleDeleteEstimate(deleteConfirmEstimate)}
          onCancel={() => setDeleteConfirmEstimate(null)}
        />
      )}
    </div>
  );
}
