import React, { useState, useEffect } from 'react';
import { Settings, Save, CheckCircle2 } from 'lucide-react';
import { api } from '../services/api';

export default function SettingsView({ settings, onSettingsUpdated }) {
  const [formData, setFormData] = useState({
    company_name: '',
    tagline: '',
    email: '',
    phone: '',
    address: '',
    tax_id: '',
    currency_symbol: '$',
    currency_code: 'USD',
    invoice_prefix: 'INV-',
    default_tax_rate: 10.0,
    payment_terms: '',
    bank_name: '',
    bank_account_no: '',
    bank_routing_no: '',
    notes: '',
  });

  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (settings) {
      setFormData({
        company_name: settings.company_name || '',
        tagline: settings.tagline || '',
        email: settings.email || '',
        phone: settings.phone || '',
        address: settings.address || '',
        tax_id: settings.tax_id || '',
        currency_symbol: settings.currency_symbol || '$',
        currency_code: settings.currency_code || 'USD',
        invoice_prefix: settings.invoice_prefix || 'INV-',
        default_tax_rate: settings.default_tax_rate ?? 10.0,
        payment_terms: settings.payment_terms || '',
        bank_name: settings.bank_name || '',
        bank_account_no: settings.bank_account_no || '',
        bank_routing_no: settings.bank_routing_no || '',
        notes: settings.notes || '',
      });
    }
  }, [settings]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSaved(false);

    try {
      await api.updateSettings({
        ...formData,
        default_tax_rate: parseFloat(formData.default_tax_rate) || 0,
      });
      setSaved(true);
      onSettingsUpdated();
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="view-header">
        <div className="view-title-group">
          <h2>Business Profile & Billing Configuration</h2>
          <p>Customize invoice branding, tax rates, currencies, bank details, and payment instructions</p>
        </div>
      </div>

      <div className="card" style={{ maxWidth: '860px' }}>
        {error && (
          <div style={{ padding: '0.75rem', background: 'var(--danger-bg)', border: '1px solid var(--danger-border)', color: 'var(--danger)', borderRadius: 'var(--radius-md)', marginBottom: '1.25rem' }}>
            {error}
          </div>
        )}

        {saved && (
          <div style={{ padding: '0.75rem', background: 'var(--success-bg)', border: '1px solid var(--success-border)', color: 'var(--success)', borderRadius: 'var(--radius-md)', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckCircle2 size={16} />
            <span>Settings saved successfully! New invoices will reflect these preferences.</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Section 1: Business Identity */}
          <h3 style={{ fontSize: '1rem', color: 'var(--primary)', marginBottom: '1rem', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-subtle)' }}>
            1. Company Profile & Branding
          </h3>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Company Name *</label>
              <input 
                type="text" 
                className="form-input" 
                name="company_name" 
                value={formData.company_name} 
                onChange={handleChange} 
                required 
              />
            </div>
            <div className="form-group">
              <label className="form-label">Tagline / Subheading</label>
              <input 
                type="text" 
                className="form-input" 
                name="tagline" 
                value={formData.tagline} 
                onChange={handleChange} 
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Billing Email</label>
              <input 
                type="email" 
                className="form-input" 
                name="email" 
                value={formData.email} 
                onChange={handleChange} 
              />
            </div>
            <div className="form-group">
              <label className="form-label">Contact Phone</label>
              <input 
                type="text" 
                className="form-input" 
                name="phone" 
                value={formData.phone} 
                onChange={handleChange} 
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Registered Address</label>
              <input 
                type="text" 
                className="form-input" 
                name="address" 
                value={formData.address} 
                onChange={handleChange} 
              />
            </div>
            <div className="form-group">
              <label className="form-label">Tax ID / GSTIN / VAT Registration</label>
              <input 
                type="text" 
                className="form-input font-mono" 
                name="tax_id" 
                value={formData.tax_id} 
                onChange={handleChange} 
              />
            </div>
          </div>

          {/* Section 2: Currency & Invoicing Rules */}
          <h3 style={{ fontSize: '1rem', color: 'var(--primary)', marginTop: '1.5rem', marginBottom: '1rem', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-subtle)' }}>
            2. Currency & Invoice Formatting
          </h3>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Currency Symbol *</label>
              <select 
                className="form-select" 
                name="currency_symbol" 
                value={formData.currency_symbol} 
                onChange={handleChange}
              >
                <option value="$">$ (USD / CAD / AUD)</option>
                <option value="₹">₹ (INR / Rupee)</option>
                <option value="€">€ (EUR / Euro)</option>
                <option value="£">£ (GBP / Pound)</option>
                <option value="¥">¥ (JPY / CNY)</option>
                <option value="AED">AED (Dirham)</option>
                <option value="CHF">CHF (Franc)</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Currency Code</label>
              <input 
                type="text" 
                className="form-input" 
                name="currency_code" 
                value={formData.currency_code} 
                onChange={handleChange} 
              />
            </div>
            <div className="form-group">
              <label className="form-label">Invoice Prefix</label>
              <input 
                type="text" 
                className="form-input font-mono" 
                name="invoice_prefix" 
                value={formData.invoice_prefix} 
                onChange={handleChange} 
              />
            </div>
            <div className="form-group">
              <label className="form-label">Default Tax Rate (%)</label>
              <input 
                type="number" 
                step="0.1" 
                min="0"
                className="form-input" 
                name="default_tax_rate" 
                value={formData.default_tax_rate} 
                onChange={handleChange} 
              />
            </div>
          </div>

          {/* Section 3: Bank Details for Invoice Wire */}
          <h3 style={{ fontSize: '1rem', color: 'var(--primary)', marginTop: '1.5rem', marginBottom: '1rem', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-subtle)' }}>
            3. Banking & Wire Instructions (Printed on Invoices)
          </h3>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Bank Name</label>
              <input 
                type="text" 
                className="form-input" 
                name="bank_name" 
                value={formData.bank_name} 
                onChange={handleChange} 
              />
            </div>
            <div className="form-group">
              <label className="form-label">Account Number</label>
              <input 
                type="text" 
                className="form-input font-mono" 
                name="bank_account_no" 
                value={formData.bank_account_no} 
                onChange={handleChange} 
              />
            </div>
            <div className="form-group">
              <label className="form-label">Routing / SWIFT / IFSC Code</label>
              <input 
                type="text" 
                className="form-input font-mono" 
                name="bank_routing_no" 
                value={formData.bank_routing_no} 
                onChange={handleChange} 
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Default Payment Terms & Policy</label>
            <textarea 
              className="form-textarea" 
              rows="2" 
              name="payment_terms" 
              value={formData.payment_terms} 
              onChange={handleChange} 
            />
          </div>

          <div className="form-group">
            <label className="form-label">Standard Footer Notes</label>
            <textarea 
              className="form-textarea" 
              rows="2" 
              name="notes" 
              value={formData.notes} 
              onChange={handleChange} 
            />
          </div>

          <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end' }}>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              <Save size={16} />
              <span>{loading ? 'Saving...' : 'Save Configuration'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
