import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Calculator, CheckCircle2 } from 'lucide-react';
import { api } from '../services/api';

export default function InvoiceEditorModal({ 
  isOpen, 
  onClose, 
  onSaved, 
  editInvoiceId, 
  currency, 
  customers, 
  products 
}) {
  if (!isOpen) return null;

  const todayStr = new Date().toISOString().split('T')[0];
  const dueDateStr = new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0];

  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [customerId, setCustomerId] = useState('');
  const [issueDate, setIssueDate] = useState(todayStr);
  const [dueDate, setDueDate] = useState(dueDateStr);
  const [discountTotal, setDiscountTotal] = useState(0);
  const [notes, setNotes] = useState('');
  const [terms, setTerms] = useState('');
  const [status, setStatus] = useState('pending');
  
  const [items, setItems] = useState([
    { product_id: null, item_name: '', description: '', quantity: 1, unit_price: 0, tax_rate: 10 }
  ]);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Initialize data
  useEffect(() => {
    if (editInvoiceId) {
      setLoading(true);
      api.getInvoice(editInvoiceId)
        .then((data) => {
          const inv = data.invoice;
          setInvoiceNumber(inv.invoice_number);
          setCustomerId(inv.customer_id);
          setIssueDate(inv.issue_date);
          setDueDate(inv.due_date);
          setDiscountTotal(inv.discount_total || 0);
          setNotes(inv.notes || '');
          setTerms(inv.terms || '');
          setStatus(inv.status || 'pending');
          if (data.items && data.items.length > 0) {
            setItems(data.items.map(it => ({
              product_id: it.product_id,
              item_name: it.item_name,
              description: it.description || '',
              quantity: it.quantity,
              unit_price: it.unit_price,
              tax_rate: it.tax_rate
            })));
          }
        })
        .catch((err) => setError(err.message))
        .finally(() => setLoading(false));
    } else {
      // New Invoice: Fetch next invoice number
      api.getNextInvoiceNumber()
        .then(res => setInvoiceNumber(res.next_number))
        .catch(() => setInvoiceNumber(`INV-${new Date().getFullYear()}-0001`));

      if (customers && customers.length > 0) {
        setCustomerId(customers[0].id);
      }
    }
  }, [editInvoiceId]);

  // Handle product dropdown selection on a row
  const handleProductSelect = (index, prodId) => {
    const updated = [...items];
    if (!prodId) {
      updated[index] = { ...updated[index], product_id: null };
    } else {
      const prod = products.find(p => p.id === Number(prodId));
      if (prod) {
        updated[index] = {
          ...updated[index],
          product_id: prod.id,
          item_name: prod.name,
          description: prod.description || '',
          unit_price: prod.unit_price,
          tax_rate: prod.tax_rate || 0,
        };
      }
    }
    setItems(updated);
  };

  const handleItemChange = (index, field, value) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };
    setItems(updated);
  };

  const handleAddItemRow = () => {
    setItems([
      ...items,
      { product_id: null, item_name: '', description: '', quantity: 1, unit_price: 0, tax_rate: 10 }
    ]);
  };

  const handleRemoveItemRow = (index) => {
    if (items.length === 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  // Calculations
  const subtotal = items.reduce((sum, item) => {
    const qty = parseFloat(item.quantity) || 0;
    const price = parseFloat(item.unit_price) || 0;
    return sum + (qty * price);
  }, 0);

  const taxTotal = items.reduce((sum, item) => {
    const qty = parseFloat(item.quantity) || 0;
    const price = parseFloat(item.unit_price) || 0;
    const tax = parseFloat(item.tax_rate) || 0;
    return sum + (qty * price * (tax / 100));
  }, 0);

  const grandTotal = Math.max(0, subtotal + taxTotal - (parseFloat(discountTotal) || 0));

  const formatMoney = (val) => `${currency} ${(Number(val) || 0).toFixed(2)}`;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!customerId) {
      setError('Please select a customer.');
      return;
    }

    if (items.some(it => !it.item_name || it.item_name.trim() === '')) {
      setError('All invoice line items must have a description or item name.');
      return;
    }

    setLoading(true);

    const payload = {
      invoice_number: invoiceNumber,
      customer_id: Number(customerId),
      issue_date: issueDate,
      due_date: dueDate,
      discount_total: parseFloat(discountTotal) || 0,
      notes,
      terms,
      status,
      items: items.map(it => ({
        product_id: it.product_id ? Number(it.product_id) : null,
        item_name: it.item_name,
        description: it.description,
        quantity: parseFloat(it.quantity) || 1,
        unit_price: parseFloat(it.unit_price) || 0,
        tax_rate: parseFloat(it.tax_rate) || 0,
      })),
    };

    try {
      if (editInvoiceId) {
        await api.updateInvoice(editInvoiceId, payload);
      } else {
        await api.createInvoice(payload);
      }
      onSaved();
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-container modal-lg">
        <div className="modal-header">
          <h3>{editInvoiceId ? 'Edit Invoice' : 'Create New Invoice'}</h3>
          <button className="modal-close-btn" onClick={onClose}><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
          <div className="modal-body">
            {error && (
              <div style={{ padding: '0.75rem 1rem', background: 'var(--danger-bg)', border: '1px solid var(--danger-border)', color: 'var(--danger)', borderRadius: 'var(--radius-md)', marginBottom: '1.25rem', fontSize: '0.85rem' }}>
                {error}
              </div>
            )}

            {/* Top row: Customer, Invoice #, Issue Date, Due Date */}
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Client / Customer *</label>
                <select 
                  className="form-select" 
                  value={customerId} 
                  onChange={(e) => setCustomerId(e.target.value)}
                  required
                >
                  <option value="">-- Select Client --</option>
                  {customers && customers.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.company_name ? `(${c.company_name})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Invoice Number *</label>
                <input 
                  type="text" 
                  className="form-input font-mono" 
                  value={invoiceNumber} 
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                  required 
                />
              </div>

              <div className="form-group">
                <label className="form-label">Issue Date *</label>
                <input 
                  type="date" 
                  className="form-input" 
                  value={issueDate} 
                  onChange={(e) => setIssueDate(e.target.value)}
                  required 
                />
              </div>

              <div className="form-group">
                <label className="form-label">Due Date *</label>
                <input 
                  type="date" 
                  className="form-input" 
                  value={dueDate} 
                  onChange={(e) => setDueDate(e.target.value)}
                  required 
                />
              </div>
            </div>

            {/* Line Items Table */}
            <div style={{ marginTop: '1rem', marginBottom: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label className="form-label" style={{ marginBottom: 0, fontSize: '0.85rem' }}>Line Items & Services</label>
              <button type="button" className="btn btn-sm btn-secondary" onClick={handleAddItemRow}>
                <Plus size={14} />
                <span>Add Item Row</span>
              </button>
            </div>

            <div className="table-responsive">
              <table className="items-table">
                <thead>
                  <tr>
                    <th style={{ width: '25%' }}>Preset / Item Name *</th>
                    <th style={{ width: '12%', textAlign: 'center' }}>Rem. Stock</th>
                    <th style={{ width: '20%' }}>Description</th>
                    <th style={{ width: '12%' }}>Qty</th>
                    <th style={{ width: '15%' }}>Price ({currency})</th>
                    <th style={{ width: '10%' }}>Tax %</th>
                    <th style={{ width: '13%', textAlign: 'right' }}>Total</th>
                    <th style={{ width: '4%' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((row, idx) => {
                    const lineSubtotal = (parseFloat(row.quantity) || 0) * (parseFloat(row.unit_price) || 0);
                    const lineTax = lineSubtotal * ((parseFloat(row.tax_rate) || 0) / 100);
                    const lineTotal = lineSubtotal + lineTax;

                    return (
                      <tr key={idx}>
                        <td>
                          {products && products.length > 0 && (
                            <select 
                              style={{ marginBottom: '0.3rem', fontSize: '0.74rem' }}
                              value={row.product_id || ''} 
                              onChange={(e) => handleProductSelect(idx, e.target.value)}
                            >
                              <option value="">-- Catalog Item (Optional) --</option>
                              {products.map(p => (
                                <option key={p.id} value={p.id}>{p.name} ({currency}{p.unit_price})</option>
                              ))}
                            </select>
                          )}
                          <input 
                            type="text" 
                            placeholder="Item / service title..." 
                            value={row.item_name}
                            onChange={(e) => handleItemChange(idx, 'item_name', e.target.value)}
                            required
                          />
                        </td>
                        <td>
                          <input 
                            type="text" 
                            placeholder="Optional notes / details..." 
                            value={row.description}
                            onChange={(e) => handleItemChange(idx, 'description', e.target.value)}
                          />
                        </td>
                        <td>
                          <input 
                            type="number" 
                            min="0.01" 
                            step="any" 
                            value={row.quantity}
                            onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                            required
                          />
                        </td>
                        <td>
                          <input 
                            type="number" 
                            min="0" 
                            step="0.01" 
                            value={row.unit_price}
                            onChange={(e) => handleItemChange(idx, 'unit_price', e.target.value)}
                            required
                          />
                        </td>
                        <td>
                          <input 
                            type="number" 
                            min="0" 
                            step="0.1" 
                            value={row.tax_rate}
                            onChange={(e) => handleItemChange(idx, 'tax_rate', e.target.value)}
                          />
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: 600, color: '#fff', verticalAlign: 'middle' }}>
                          {formatMoney(lineTotal)}
                        </td>
                        <td style={{ textAlign: 'center', verticalAlign: 'middle' }}>
                          {items.length > 1 && (
                            <button 
                              type="button" 
                              onClick={() => handleRemoveItemRow(idx)}
                              style={{ background: 'transparent', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: '4px' }}
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Bottom Row: Notes, Discount, Grand Total summary */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '1.5rem', marginTop: '1rem' }}>
              <div>
                <div className="form-group">
                  <label className="form-label">Client Notes</label>
                  <textarea 
                    className="form-textarea" 
                    rows="2" 
                    placeholder="Notes visible to customer on bill..."
                    value={notes} 
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Terms & Conditions</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="Payment terms (e.g. Net 15 days, 1.5% late fee)"
                    value={terms} 
                    onChange={(e) => setTerms(e.target.value)}
                  />
                </div>
              </div>

              <div className="totals-summary-box">
                <div className="totals-summary-row">
                  <span>Subtotal:</span>
                  <span style={{ fontWeight: 600 }}>{formatMoney(subtotal)}</span>
                </div>
                <div className="totals-summary-row">
                  <span>Tax Amount:</span>
                  <span style={{ fontWeight: 600 }}>{formatMoney(taxTotal)}</span>
                </div>
                <div className="totals-summary-row" style={{ alignItems: 'center' }}>
                  <span>Discount ({currency}):</span>
                  <input 
                    type="number" 
                    min="0" 
                    step="0.01"
                    style={{ width: '90px', padding: '0.2rem 0.4rem', background: 'var(--bg-primary)', border: '1px solid var(--border-subtle)', color: '#fff', borderRadius: '4px', textAlign: 'right' }}
                    value={discountTotal}
                    onChange={(e) => setDiscountTotal(e.target.value)}
                  />
                </div>
                <div className="totals-summary-row grand-total">
                  <span>Grand Total:</span>
                  <span style={{ color: 'var(--accent-cyan)' }}>{formatMoney(grandTotal)}</span>
                </div>
              </div>
            </div>

          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              <CheckCircle2 size={16} />
              <span>{loading ? 'Saving...' : editInvoiceId ? 'Update Invoice' : 'Generate Invoice'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
