import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Landmark, 
  BarChart3, 
  Settings as SettingsIcon, 
  UserCheck, 
  ArrowRightLeft, 
  Plus, 
  Check, 
  Download,
  Percent,
  FileSpreadsheet
} from 'lucide-react';
import { api } from '../services/api';

export default function OthersView({ settings, currency = '₹', onRefresh }) {
  const [subTab, setSubTab] = useState('reports'); // reports, bank, users, settings

  // Reports data
  const [plData, setPlData] = useState(null);
  const [duesData, setDuesData] = useState(null);
  const [gstData, setGstData] = useState(null);

  // Bank transfer modal
  const [bankAccounts, setBankAccounts] = useState([]);
  const [transferModalOpen, setTransferModalOpen] = useState(false);
  const [fromAcc, setFromAcc] = useState(1);
  const [toAcc, setToAcc] = useState(2);
  const [transferAmount, setTransferAmount] = useState('');
  const [transferNotes, setTransferNotes] = useState('Transfer cash to bank account');

  // Users data
  const [users, setUsers] = useState([]);

  // Settings form
  const [settingsForm, setSettingsForm] = useState({
    company_name: 'Rock Palace',
    business_type: 'Stone Shop (Granite & Marble)',
    tagline: 'Premium Granite, Marble & Stone Solutions',
    phone: '+91 98401 23456',
    email: 'billing@rockpalace.com',
    address: '120/4 GST Road, Tambaram East, Chennai, Tamil Nadu - 600045',
    gstin: '33AABCR1234F1Z5',
    invoice_prefix: 'RP/BILL/',
    purchase_prefix: 'RP/PUR/',
    currency_symbol: '₹',
    default_tax_rate: 18.0,
    payment_terms: 'Goods once sold cannot be returned without inspection.',
  });
  const [settingsSaved, setSettingsSaved] = useState(false);

  const formatMoney = (val) => `${currency} ${(Number(val) || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/-`;

  const loadAll = () => {
    api.getProfitAndLoss().then(setPlData).catch(console.error);
    api.getDuesReport().then(setDuesData).catch(console.error);
    api.getGstSummary().then(setGstData).catch(console.error);
    api.getBankAccounts().then(setBankAccounts).catch(console.error);
    api.getUsers().then(setUsers).catch(console.error);
    api.getSettings().then(s => {
      if (s) setSettingsForm(s);
    }).catch(console.error);
  };

  useEffect(() => {
    loadAll();
  }, []);

  const handleTransfer = async (e) => {
    e.preventDefault();
    try {
      await api.transferFunds({
        from_account_id: Number(fromAcc),
        to_account_id: Number(toAcc),
        amount: parseFloat(transferAmount),
        date: new Date().toISOString().split('T')[0],
        narration: transferNotes,
      });
      setTransferModalOpen(false);
      setTransferAmount('');
      loadAll();
      onRefresh();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleSettingsSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.updateSettings({
        ...settingsForm,
        default_tax_rate: parseFloat(settingsForm.default_tax_rate) || 18.0,
      });
      setSettingsSaved(true);
      setTimeout(() => setSettingsSaved(false), 3000);
      onRefresh();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="view-header">
        <div className="view-title-group">
          <h2>Others (Reports, Banking, Users & Settings)</h2>
          <p>Section 10 modules: Profit & loss, customer dues, GST summaries, bank accounts, and user access</p>
        </div>
      </div>

      {/* Sub tabs */}
      <div className="filter-bar">
        <div className="status-pills">
          <button className={`pill-btn ${subTab === 'reports' ? 'active' : ''}`} onClick={() => setSubTab('reports')}>
            Profit & Loss / Reports
          </button>
          <button className={`pill-btn ${subTab === 'dues' ? 'active' : ''}`} onClick={() => setSubTab('dues')}>
            Dues & Payables
          </button>
          <button className={`pill-btn ${subTab === 'bank' ? 'active' : ''}`} onClick={() => setSubTab('bank')}>
            Bank Accounts & Transfers
          </button>
          <button className={`pill-btn ${subTab === 'users' ? 'active' : ''}`} onClick={() => setSubTab('users')}>
            Staff & Roles
          </button>
          <button className={`pill-btn ${subTab === 'settings' ? 'active' : ''}`} onClick={() => setSubTab('settings')}>
            Rock Palace Settings
          </button>
        </div>
      </div>

      {/* 1. Reports & Profit Loss */}
      {subTab === 'reports' && (
        <div>
          {/* P&L Cards */}
          <div className="kpi-grid">
            <div className="kpi-card">
              <div className="kpi-label">Sales Revenue</div>
              <div className="kpi-value" style={{ marginTop: '0.4rem', color: '#fff' }}>
                {formatMoney(plData?.sales_revenue)}
              </div>
              <div className="kpi-subtext">Total stone sales billed</div>
            </div>

            <div className="kpi-card">
              <div className="kpi-label">Purchase Consignment Cost</div>
              <div className="kpi-value" style={{ marginTop: '0.4rem', color: 'var(--text-muted)' }}>
                {formatMoney(plData?.purchase_cost)}
              </div>
              <div className="kpi-subtext">Quarry invoices received</div>
            </div>

            <div className="kpi-card">
              <div className="kpi-label">Stone Damage & Cutting Loss</div>
              <div className="kpi-value" style={{ marginTop: '0.4rem', color: 'var(--danger)' }}>
                {formatMoney(plData?.damage_loss)}
              </div>
              <div className="kpi-subtext">Deducted from gross profit</div>
            </div>

            <div className="kpi-card">
              <div className="kpi-label" style={{ color: 'var(--success)' }}>Net Profit</div>
              <div className="kpi-value" style={{ marginTop: '0.4rem', color: (plData?.net_profit || 0) >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                {formatMoney(plData?.net_profit)}
              </div>
              <div className="kpi-subtext">After cost, damages, and expenses</div>
            </div>
          </div>

          {/* GST Summary Card */}
          <div className="card" style={{ maxWidth: '640px' }}>
            <div className="card-header">
              <h3 className="card-title">
                <Percent size={18} style={{ color: '#d97706' }} />
                GST Summary & Tax Liability
              </h3>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', textAlign: 'center', padding: '1rem 0' }}>
              <div>
                <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>OUTPUT GST (Sales)</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#fff', marginTop: '4px' }}>
                  {formatMoney(gstData?.output_gst)}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>INPUT TAX CREDIT (Purchase)</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--success)', marginTop: '4px' }}>
                  {formatMoney(gstData?.input_gst)}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>NET GST PAYABLE</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#fbbf24', marginTop: '4px' }}>
                  {formatMoney(gstData?.net_gst_payable)}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. Dues & Payables */}
      {subTab === 'dues' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
          <div className="card">
            <div className="card-header">
              <h3 className="card-title" style={{ color: '#fbbf24' }}>
                Customer Receivables (Dues to Collect)
              </h3>
            </div>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Phone</th>
                  <th style={{ textAlign: 'right' }}>Due Amount</th>
                </tr>
              </thead>
              <tbody>
                {duesData?.customer_dues && duesData.customer_dues.length > 0 ? (
                  duesData.customer_dues.map(c => (
                    <tr key={c.id}>
                      <td>
                        <strong>{c.name}</strong>
                        {c.company && <div style={{ fontSize: '0.74rem', color: 'var(--text-dim)' }}>{c.company}</div>}
                      </td>
                      <td>{c.phone || '—'}</td>
                      <td style={{ textAlign: 'right', fontWeight: 700, color: '#fbbf24' }}>
                        {formatMoney(c.due_amount)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan="3" style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)' }}>No customer dues</td></tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="card">
            <div className="card-header">
              <h3 className="card-title" style={{ color: 'var(--danger)' }}>
                Supplier Payables (To Pay Quarries)
              </h3>
            </div>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Supplier</th>
                  <th>Phone</th>
                  <th style={{ textAlign: 'right' }}>Payable Amount</th>
                </tr>
              </thead>
              <tbody>
                {duesData?.supplier_payables && duesData.supplier_payables.length > 0 ? (
                  duesData.supplier_payables.map(s => (
                    <tr key={s.id}>
                      <td>
                        <strong>{s.name}</strong>
                        {s.company && <div style={{ fontSize: '0.74rem', color: 'var(--text-dim)' }}>{s.company}</div>}
                      </td>
                      <td>{s.phone || '—'}</td>
                      <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--danger)' }}>
                        {formatMoney(s.payable_amount)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan="3" style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)' }}>No supplier payables</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 3. Bank Accounts */}
      {subTab === 'bank' && (
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">
              <Landmark size={18} style={{ color: 'var(--primary)' }} />
              Bank Accounts & Cash Drawers
            </h3>
            <button className="btn btn-secondary btn-sm" onClick={() => setTransferModalOpen(true)}>
              <ArrowRightLeft size={14} />
              <span>Transfer Between Accounts</span>
            </button>
          </div>
          <table className="data-table">
            <thead>
              <tr>
                <th>Account Name</th>
                <th>Bank / Type</th>
                <th>Account Number</th>
                <th>Opening Balance</th>
                <th style={{ textAlign: 'right' }}>Current Balance</th>
              </tr>
            </thead>
            <tbody>
              {bankAccounts && bankAccounts.map(ba => (
                <tr key={ba.id}>
                  <td><strong>{ba.name}</strong></td>
                  <td>{ba.bank_name}</td>
                  <td className="font-mono">{ba.account_number}</td>
                  <td>{formatMoney(ba.opening_balance)}</td>
                  <td style={{ textAlign: 'right', fontWeight: 800, color: 'var(--success)' }}>
                    {formatMoney(ba.current_balance)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 4. Staff & Roles */}
      {subTab === 'users' && (
        <div className="card" style={{ maxWidth: '720px' }}>
          <div className="card-header">
            <h3 className="card-title">
              <UserCheck size={18} style={{ color: 'var(--primary)' }} />
              Staff Logins & Role-Based Access
            </h3>
          </div>
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Assigned Role</th>
              </tr>
            </thead>
            <tbody>
              {users && users.map(u => (
                <tr key={u.id}>
                  <td><strong>{u.name}</strong></td>
                  <td>{u.email}</td>
                  <td>
                    <span className="badge badge-paid">
                      {u.role}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 5. Rock Palace Settings */}
      {subTab === 'settings' && (
        <div className="card" style={{ maxWidth: '720px' }}>
          <div className="card-header">
            <h3 className="card-title">
              <SettingsIcon size={18} style={{ color: 'var(--primary)' }} />
              Rock Palace Company Profile & Invoicing Preferences
            </h3>
          </div>
          {settingsSaved && (
            <div style={{ padding: '0.75rem', background: 'var(--success-bg)', color: 'var(--success)', borderRadius: '6px', marginBottom: '1rem' }}>
              ✓ Settings saved successfully!
            </div>
          )}
          <form onSubmit={handleSettingsSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Shop Name *</label>
                <input type="text" className="form-input" value={settingsForm.company_name} onChange={(e) => setSettingsForm({ ...settingsForm, company_name: e.target.value })} required />
              </div>
              <div className="form-group">
                <label className="form-label">Business Line</label>
                <input type="text" className="form-input" value={settingsForm.business_type} onChange={(e) => setSettingsForm({ ...settingsForm, business_type: e.target.value })} />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Phone</label>
                <input type="text" className="form-input" value={settingsForm.phone} onChange={(e) => setSettingsForm({ ...settingsForm, phone: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">GSTIN Registration</label>
                <input type="text" className="form-input font-mono" value={settingsForm.gstin} onChange={(e) => setSettingsForm({ ...settingsForm, gstin: e.target.value })} />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Address</label>
              <textarea className="form-textarea" rows="2" value={settingsForm.address} onChange={(e) => setSettingsForm({ ...settingsForm, address: e.target.value })} />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Sales Bill Prefix</label>
                <input type="text" className="form-input font-mono" value={settingsForm.invoice_prefix} onChange={(e) => setSettingsForm({ ...settingsForm, invoice_prefix: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Default GST Tax %</label>
                <input type="number" step="0.1" className="form-input" value={settingsForm.default_tax_rate} onChange={(e) => setSettingsForm({ ...settingsForm, default_tax_rate: e.target.value })} />
              </div>
            </div>

            <button type="submit" className="btn btn-primary" style={{ marginTop: '1rem' }}>
              Save Configuration
            </button>
          </form>
        </div>
      )}

      {/* Bank Transfer Modal */}
      {transferModalOpen && (
        <div className="modal-overlay">
          <div className="modal-container" style={{ maxWidth: '440px' }}>
            <div className="modal-header">
              <h3>Transfer Funds Between Accounts</h3>
              <button className="modal-close-btn" onClick={() => setTransferModalOpen(false)}>×</button>
            </div>
            <form onSubmit={handleTransfer}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">From Account (Source)</label>
                  <select className="form-select" value={fromAcc} onChange={(e) => setFromAcc(e.target.value)}>
                    {bankAccounts.map(b => (
                      <option key={b.id} value={b.id}>{b.name} ({formatMoney(b.current_balance)})</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">To Account (Destination)</label>
                  <select className="form-select" value={toAcc} onChange={(e) => setToAcc(e.target.value)}>
                    {bankAccounts.map(b => (
                      <option key={b.id} value={b.id}>{b.name} ({formatMoney(b.current_balance)})</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Transfer Amount ({currency}) *</label>
                  <input type="number" step="0.01" min="1" className="form-input" value={transferAmount} onChange={(e) => setTransferAmount(e.target.value)} required />
                </div>

                <div className="form-group">
                  <label className="form-label">Narration</label>
                  <input type="text" className="form-input" value={transferNotes} onChange={(e) => setTransferNotes(e.target.value)} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setTransferModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Execute Transfer</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
