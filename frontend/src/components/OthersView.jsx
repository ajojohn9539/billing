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
  FileSpreadsheet,
  Edit2,
  Trash2,
  Wallet,
  Sliders,
  CreditCard,
  AlertCircle,
  TrendingUp,
  Sparkles
} from 'lucide-react';
import { api } from '../services/api';
import ConfirmModal from './ConfirmModal';

export default function OthersView({ settings, currency = '₹', onRefresh }) {
  const [subTab, setSubTab] = useState('reports'); // reports, bank, users, settings

  // Reports data
  const [plData, setPlData] = useState(null);
  const [duesData, setDuesData] = useState(null);
  const [gstData, setGstData] = useState(null);

  // Bank transfer & CRUD modal state
  const [bankAccounts, setBankAccounts] = useState([]);
  const [transferModalOpen, setTransferModalOpen] = useState(false);
  const [fromAcc, setFromAcc] = useState(1);
  const [toAcc, setToAcc] = useState(2);
  const [transferAmount, setTransferAmount] = useState('');
  const [transferNotes, setTransferNotes] = useState('Transfer cash to bank account');

  // Bank Account Add/Edit/Delete states
  const [addAccountModalOpen, setAddAccountModalOpen] = useState(false);
  const [editAccountModalOpen, setEditAccountModalOpen] = useState(false);
  const [editingAccountId, setEditingAccountId] = useState(null);
  const [accountForm, setAccountForm] = useState({
    name: '',
    bank_name: '',
    account_number: '',
    branch: '',
    ifsc: '',
    account_type: 'Current Account',
    opening_balance: '',
    current_balance: ''
  });
  const [deleteAccountModal, setDeleteAccountModal] = useState({
    isOpen: false,
    account: null,
    isLoading: false
  });
  const [bankFeedback, setBankFeedback] = useState(null);
  const [isSubmittingAccount, setIsSubmittingAccount] = useState(false);

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
    logo_url: '/logo.png',
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
      setBankFeedback({ type: 'success', message: 'Funds transferred successfully!' });
      setTimeout(() => setBankFeedback(null), 4000);
      loadAll();
      if (onRefresh) onRefresh();
    } catch (err) {
      alert(err.message);
    }
  };

  const openAddAccountModal = () => {
    setAccountForm({
      name: '',
      bank_name: '',
      account_number: '',
      branch: '',
      ifsc: '',
      account_type: 'Current Account',
      opening_balance: '',
      current_balance: ''
    });
    setBankFeedback(null);
    setAddAccountModalOpen(true);
  };

  const openEditAccountModal = (account) => {
    setEditingAccountId(account.id);
    setAccountForm({
      name: account.name || '',
      bank_name: account.bank_name || '',
      account_number: account.account_number || '',
      branch: account.branch || '',
      ifsc: account.ifsc || '',
      account_type: account.account_type || 'Current Account',
      opening_balance: account.opening_balance !== null && account.opening_balance !== undefined ? account.opening_balance : '',
      current_balance: account.current_balance !== null && account.current_balance !== undefined ? account.current_balance : ''
    });
    setBankFeedback(null);
    setEditAccountModalOpen(true);
  };

  const handleAddAccountSubmit = async (e) => {
    e.preventDefault();
    if (!accountForm.name.trim()) {
      setBankFeedback({ type: 'error', message: 'Account Name is required' });
      return;
    }
    setIsSubmittingAccount(true);
    try {
      const openingBal = parseFloat(accountForm.opening_balance) || 0;
      const currentBal = accountForm.current_balance !== '' ? (parseFloat(accountForm.current_balance) || 0) : openingBal;

      await api.createBankAccount({
        name: accountForm.name.trim(),
        bank_name: accountForm.bank_name.trim() || 'Bank',
        account_number: accountForm.account_number.trim(),
        branch: accountForm.branch.trim(),
        ifsc: accountForm.ifsc.trim(),
        account_type: accountForm.account_type,
        opening_balance: openingBal,
        current_balance: currentBal
      });

      setAddAccountModalOpen(false);
      setBankFeedback({ type: 'success', message: `Bank account "${accountForm.name}" created successfully!` });
      setTimeout(() => setBankFeedback(null), 4000);
      loadAll();
      if (onRefresh) onRefresh();
    } catch (err) {
      setBankFeedback({ type: 'error', message: err.message || 'Failed to create bank account' });
    } finally {
      setIsSubmittingAccount(false);
    }
  };

  const handleEditAccountSubmit = async (e) => {
    e.preventDefault();
    if (!accountForm.name.trim()) {
      setBankFeedback({ type: 'error', message: 'Account Name is required' });
      return;
    }
    setIsSubmittingAccount(true);
    try {
      const openingBal = parseFloat(accountForm.opening_balance) || 0;
      const currentBal = accountForm.current_balance !== '' ? (parseFloat(accountForm.current_balance) || 0) : openingBal;

      await api.updateBankAccount(editingAccountId, {
        name: accountForm.name.trim(),
        bank_name: accountForm.bank_name.trim(),
        account_number: accountForm.account_number.trim(),
        branch: accountForm.branch.trim(),
        ifsc: accountForm.ifsc.trim(),
        account_type: accountForm.account_type,
        opening_balance: openingBal,
        current_balance: currentBal
      });

      setEditAccountModalOpen(false);
      setBankFeedback({ type: 'success', message: `Bank account "${accountForm.name}" and balances updated successfully!` });
      setTimeout(() => setBankFeedback(null), 4000);
      loadAll();
      if (onRefresh) onRefresh();
    } catch (err) {
      setBankFeedback({ type: 'error', message: err.message || 'Failed to update bank account' });
    } finally {
      setIsSubmittingAccount(false);
    }
  };

  const handleDeleteAccountConfirm = async () => {
    if (!deleteAccountModal.account) return;
    setDeleteAccountModal(prev => ({ ...prev, isLoading: true }));
    try {
      await api.deleteBankAccount(deleteAccountModal.account.id);
      setDeleteAccountModal({ isOpen: false, account: null, isLoading: false });
      setBankFeedback({ type: 'success', message: `Bank account "${deleteAccountModal.account.name}" deleted successfully.` });
      setTimeout(() => setBankFeedback(null), 4000);
      loadAll();
      if (onRefresh) onRefresh();
    } catch (err) {
      setDeleteAccountModal(prev => ({ ...prev, isLoading: false }));
      setBankFeedback({ type: 'error', message: err.message || 'Failed to delete bank account' });
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          {/* Summary Metric Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '1rem' }}>
            <div style={{
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(5, 150, 105, 0.05) 100%)',
              border: '1px solid rgba(16, 185, 129, 0.25)',
              borderRadius: '12px',
              padding: '1.25rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.4rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Total Liquid Funds
                </span>
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981' }}>
                  <Landmark size={18} />
                </div>
              </div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#10b981', letterSpacing: '-0.5px' }}>
                {formatMoney((bankAccounts || []).reduce((acc, b) => acc + (parseFloat(b.current_balance) || 0), 0))}
              </div>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Sum of current working balances across {bankAccounts.length} accounts
              </span>
            </div>

            <div style={{
              background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.08) 0%, rgba(14, 165, 233, 0.04) 100%)',
              border: '1px solid rgba(56, 189, 248, 0.2)',
              borderRadius: '12px',
              padding: '1.25rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.4rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Total Opening Capital
                </span>
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(56, 189, 248, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#38bdf8' }}>
                  <Wallet size={18} />
                </div>
              </div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#38bdf8', letterSpacing: '-0.5px' }}>
                {formatMoney((bankAccounts || []).reduce((acc, b) => acc + (parseFloat(b.opening_balance) || 0), 0))}
              </div>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Combined initial opening balance
              </span>
            </div>

            <div style={{
              background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.08) 0%, rgba(139, 92, 246, 0.04) 100%)',
              border: '1px solid rgba(168, 85, 247, 0.2)',
              borderRadius: '12px',
              padding: '1.25rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.4rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Net Cash Movement
                </span>
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(168, 85, 247, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#a855f7' }}>
                  <TrendingUp size={18} />
                </div>
              </div>
              <div style={{ 
                fontSize: '1.6rem', 
                fontWeight: 800, 
                color: ((bankAccounts || []).reduce((acc, b) => acc + (parseFloat(b.current_balance) || 0), 0) - (bankAccounts || []).reduce((acc, b) => acc + (parseFloat(b.opening_balance) || 0), 0)) >= 0 ? '#10b981' : '#ef4444', 
                letterSpacing: '-0.5px' 
              }}>
                {((bankAccounts || []).reduce((acc, b) => acc + (parseFloat(b.current_balance) || 0), 0) - (bankAccounts || []).reduce((acc, b) => acc + (parseFloat(b.opening_balance) || 0), 0)) >= 0 ? '+' : ''}
                {formatMoney(((bankAccounts || []).reduce((acc, b) => acc + (parseFloat(b.current_balance) || 0), 0) - (bankAccounts || []).reduce((acc, b) => acc + (parseFloat(b.opening_balance) || 0), 0)))}
              </div>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Surplus growth from operations & collections
              </span>
            </div>
          </div>

          {/* Feedback banner */}
          {bankFeedback && (
            <div style={{
              padding: '0.85rem 1.25rem',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: bankFeedback.type === 'success' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
              border: `1px solid ${bankFeedback.type === 'success' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
              color: bankFeedback.type === 'success' ? '#10b981' : '#f87171',
              fontSize: '0.9rem',
              fontWeight: 500
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                {bankFeedback.type === 'success' ? <Check size={18} /> : <AlertCircle size={18} />}
                <span>{bankFeedback.message}</span>
              </div>
              <button 
                onClick={() => setBankFeedback(null)}
                style={{ background: 'transparent', border: 'none', color: 'inherit', cursor: 'pointer', fontSize: '1.2rem', padding: '0 0.4rem' }}
              >
                ×
              </button>
            </div>
          )}

          {/* Accounts Card Table */}
          <div className="card">
            <div className="card-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <Landmark size={20} style={{ color: 'var(--primary)' }} />
                <div>
                  <h3 className="card-title" style={{ margin: 0 }}>Bank Accounts & Cash Drawers</h3>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Add bank accounts, configure opening balance & update current balance
                  </p>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <button 
                  className="btn btn-primary btn-sm" 
                  onClick={openAddAccountModal}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', borderColor: '#10b981' }}
                >
                  <Plus size={15} />
                  <span>+ Add Bank Account</span>
                </button>
                <button 
                  className="btn btn-secondary btn-sm" 
                  onClick={() => setTransferModalOpen(true)}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                >
                  <ArrowRightLeft size={14} />
                  <span>Transfer Between Accounts</span>
                </button>
              </div>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Account Details</th>
                    <th>Bank / Institution</th>
                    <th>Account Number & IFSC</th>
                    <th>Opening Balance</th>
                    <th>Current Balance</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {bankAccounts && bankAccounts.length > 0 ? (
                    bankAccounts.map(ba => (
                      <tr key={ba.id}>
                        <td>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <strong style={{ fontSize: '0.95rem', color: 'var(--text-main)' }}>{ba.name}</strong>
                              <span style={{ 
                                fontSize: '0.7rem', 
                                padding: '0.15rem 0.5rem', 
                                borderRadius: '6px', 
                                background: ba.name?.toLowerCase().includes('cash') ? 'rgba(234, 179, 8, 0.15)' : 'rgba(56, 189, 248, 0.15)',
                                color: ba.name?.toLowerCase().includes('cash') ? '#eab308' : '#38bdf8',
                                fontWeight: 600
                              }}>
                                {ba.account_type || (ba.name?.toLowerCase().includes('cash') ? 'Cash Drawer' : 'Current Account')}
                              </span>
                            </div>
                            {ba.branch && (
                              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                                Branch: {ba.branch}
                              </span>
                            )}
                          </div>
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <Landmark size={14} style={{ color: 'var(--text-muted)' }} />
                            <span>{ba.bank_name || 'Bank'}</span>
                          </div>
                        </td>
                        <td>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.1rem' }}>
                            <span className="font-mono" style={{ fontWeight: 600, color: 'var(--text-main)' }}>
                              {ba.account_number || '—'}
                            </span>
                            {ba.ifsc && (
                              <span className="font-mono" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                IFSC: {ba.ifsc}
                              </span>
                            )}
                          </div>
                        </td>
                        <td>
                          <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                            {formatMoney(ba.opening_balance)}
                          </span>
                        </td>
                        <td>
                          <div style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            padding: '0.3rem 0.75rem',
                            borderRadius: '8px',
                            background: 'rgba(16, 185, 129, 0.12)',
                            border: '1px solid rgba(16, 185, 129, 0.25)',
                            fontWeight: 800,
                            fontSize: '0.95rem',
                            color: '#10b981'
                          }}>
                            {formatMoney(ba.current_balance)}
                          </div>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                            <button 
                              className="btn btn-secondary btn-xs" 
                              onClick={() => openEditAccountModal(ba)}
                              title="Edit account details, set opening & current balance"
                              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', padding: '0.35rem 0.65rem' }}
                            >
                              <Edit2 size={13} style={{ color: 'var(--primary)' }} />
                              <span>Edit / Set Balance</span>
                            </button>
                            <button 
                              className="btn btn-danger btn-xs" 
                              onClick={() => setDeleteAccountModal({ isOpen: true, account: ba, isLoading: false })}
                              title="Delete account"
                              style={{ padding: '0.35rem 0.5rem' }}
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
                        No bank accounts found. Click "+ Add Bank Account" above to add your first account.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
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
            {/* Brand Logo Configuration */}
            <div style={{
              background: 'rgba(15, 23, 42, 0.65)',
              border: '1px solid rgba(56, 189, 248, 0.25)',
              borderRadius: '12px',
              padding: '16px 20px',
              marginBottom: '20px',
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '16px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '12px',
                  padding: '2px',
                  background: 'linear-gradient(135deg, #0284c7 0%, #10b981 100%)',
                  boxShadow: '0 4px 14px rgba(2, 132, 199, 0.35)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <img 
                    src={settingsForm.logo_url || '/logo.png'} 
                    alt="Current Logo" 
                    style={{ width: '100%', height: '100%', borderRadius: '10px', objectFit: 'cover' }}
                    onError={(e) => { e.currentTarget.src = '/logo.png'; }}
                  />
                </div>
                <div>
                  <h4 style={{ margin: '0 0 2px 0', fontSize: '0.95rem', fontWeight: 700, color: '#f8fafc' }}>
                    Company Brand Logo
                  </h4>
                  <p style={{ margin: 0, fontSize: '0.78rem', color: '#94a3b8' }}>
                    Changes dynamically across navbar, dashboard, and printed invoices.
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: '260px', justifyContent: 'flex-end' }}>
                <input
                  type="text"
                  className="form-input"
                  style={{ maxWidth: '240px', fontSize: '0.82rem' }}
                  placeholder="/logo.png or image URL"
                  value={settingsForm.logo_url || ''}
                  onChange={(e) => setSettingsForm({ ...settingsForm, logo_url: e.target.value })}
                />
                <button
                  type="button"
                  className="btn btn-sm btn-secondary"
                  onClick={() => setSettingsForm({ ...settingsForm, logo_url: '/logo.png' })}
                  style={{ fontSize: '0.75rem', whiteSpace: 'nowrap' }}
                >
                  ✨ Billora Logo
                </button>
              </div>
            </div>


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
          {/* Modal 1: Add Bank Account */}
      {addAccountModalOpen && (
        <div className="modal-overlay">
          <div className="modal-container" style={{ maxWidth: '560px' }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Landmark size={20} style={{ color: '#10b981' }} />
                <h3>Add Bank Account or Cash Drawer</h3>
              </div>
              <button className="modal-close-btn" onClick={() => setAddAccountModalOpen(false)}>×</button>
            </div>
            <form onSubmit={handleAddAccountSubmit}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className="form-row">
                  <div className="form-group" style={{ flex: 1.2 }}>
                    <label className="form-label">Account Display Name *</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="e.g. Indian Bank (Current A/c) or Petty Cash" 
                      value={accountForm.name} 
                      onChange={(e) => setAccountForm({ ...accountForm, name: e.target.value })} 
                      required 
                    />
                  </div>
                  <div className="form-group" style={{ flex: 0.8 }}>
                    <label className="form-label">Account Type</label>
                    <select 
                      className="form-select" 
                      value={accountForm.account_type} 
                      onChange={(e) => setAccountForm({ ...accountForm, account_type: e.target.value })}
                    >
                      <option value="Current Account">Current Account</option>
                      <option value="Savings Account">Savings Account</option>
                      <option value="Cash Drawer / Counter">Cash Drawer / Counter</option>
                      <option value="Overdraft (OD/CC)">Overdraft (OD/CC)</option>
                    </select>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Bank / Institution Name *</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="e.g. INDIAN BANK, SBI, HDFC" 
                      value={accountForm.bank_name} 
                      onChange={(e) => setAccountForm({ ...accountForm, bank_name: e.target.value })} 
                      required 
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Branch</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="e.g. Chengamanadu, Kottarakkara" 
                      value={accountForm.branch} 
                      onChange={(e) => setAccountForm({ ...accountForm, branch: e.target.value })} 
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Account Number</label>
                    <input 
                      type="text" 
                      className="form-input font-mono" 
                      placeholder="e.g. 7944010222" 
                      value={accountForm.account_number} 
                      onChange={(e) => setAccountForm({ ...accountForm, account_number: e.target.value })} 
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">IFSC Code</label>
                    <input 
                      type="text" 
                      className="form-input font-mono" 
                      placeholder="e.g. IDIB000C046" 
                      value={accountForm.ifsc} 
                      onChange={(e) => setAccountForm({ ...accountForm, ifsc: e.target.value })} 
                    />
                  </div>
                </div>

                <div style={{
                  background: 'rgba(56, 189, 248, 0.05)',
                  border: '1px solid rgba(56, 189, 248, 0.2)',
                  borderRadius: '10px',
                  padding: '1rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem'
                }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#38bdf8' }}>
                    Set Opening & Current Account Balances
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Opening Balance ({currency}) *</label>
                      <input 
                        type="number" 
                        step="0.01" 
                        className="form-input font-mono" 
                        placeholder="0.00" 
                        value={accountForm.opening_balance} 
                        onChange={(e) => {
                          const val = e.target.value;
                          setAccountForm({ 
                            ...accountForm, 
                            opening_balance: val,
                            current_balance: accountForm.current_balance === '' || accountForm.current_balance === accountForm.opening_balance ? val : accountForm.current_balance
                          });
                        }} 
                        required 
                      />
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Initial ledger starting balance</span>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Current Account Balance ({currency}) *</label>
                      <input 
                        type="number" 
                        step="0.01" 
                        className="form-input font-mono" 
                        placeholder="0.00" 
                        value={accountForm.current_balance} 
                        onChange={(e) => setAccountForm({ ...accountForm, current_balance: e.target.value })} 
                        required 
                      />
                      <span style={{ fontSize: '0.72rem', color: '#10b981' }}>Live available balance in account</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setAddAccountModalOpen(false)}>
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary" 
                  disabled={isSubmittingAccount}
                  style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', borderColor: '#10b981' }}
                >
                  {isSubmittingAccount ? 'Saving Account...' : '+ Save Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Edit Bank Account & Set Balances */}
      {editAccountModalOpen && (
        <div className="modal-overlay">
          <div className="modal-container" style={{ maxWidth: '560px' }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Edit2 size={18} style={{ color: 'var(--primary)' }} />
                <h3>Edit Account & Set Balances</h3>
              </div>
              <button className="modal-close-btn" onClick={() => setEditAccountModalOpen(false)}>×</button>
            </div>
            <form onSubmit={handleEditAccountSubmit}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className="form-row">
                  <div className="form-group" style={{ flex: 1.2 }}>
                    <label className="form-label">Account Display Name *</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      value={accountForm.name} 
                      onChange={(e) => setAccountForm({ ...accountForm, name: e.target.value })} 
                      required 
                    />
                  </div>
                  <div className="form-group" style={{ flex: 0.8 }}>
                    <label className="form-label">Account Type</label>
                    <select 
                      className="form-select" 
                      value={accountForm.account_type} 
                      onChange={(e) => setAccountForm({ ...accountForm, account_type: e.target.value })}
                    >
                      <option value="Current Account">Current Account</option>
                      <option value="Savings Account">Savings Account</option>
                      <option value="Cash Drawer / Counter">Cash Drawer / Counter</option>
                      <option value="Overdraft (OD/CC)">Overdraft (OD/CC)</option>
                    </select>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Bank / Institution Name *</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      value={accountForm.bank_name} 
                      onChange={(e) => setAccountForm({ ...accountForm, bank_name: e.target.value })} 
                      required 
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Branch</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      value={accountForm.branch} 
                      onChange={(e) => setAccountForm({ ...accountForm, branch: e.target.value })} 
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Account Number</label>
                    <input 
                      type="text" 
                      className="form-input font-mono" 
                      value={accountForm.account_number} 
                      onChange={(e) => setAccountForm({ ...accountForm, account_number: e.target.value })} 
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">IFSC Code</label>
                    <input 
                      type="text" 
                      className="form-input font-mono" 
                      value={accountForm.ifsc} 
                      onChange={(e) => setAccountForm({ ...accountForm, ifsc: e.target.value })} 
                    />
                  </div>
                </div>

                <div style={{
                  background: 'rgba(16, 185, 129, 0.06)',
                  border: '1px solid rgba(16, 185, 129, 0.25)',
                  borderRadius: '10px',
                  padding: '1rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#10b981' }}>
                      Set & Adjust Working Balances
                    </span>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                      Synchronizes across Dashboard, Daybook & Reports
                    </span>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Opening Balance ({currency}) *</label>
                      <input 
                        type="number" 
                        step="0.01" 
                        className="form-input font-mono" 
                        value={accountForm.opening_balance} 
                        onChange={(e) => setAccountForm({ ...accountForm, opening_balance: e.target.value })} 
                        required 
                      />
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Historical opening balance</span>
                    </div>
                    <div className="form-group">
                      <label className="form-label" style={{ color: '#10b981', fontWeight: 700 }}>
                        Current Account Balance ({currency}) *
                      </label>
                      <input 
                        type="number" 
                        step="0.01" 
                        className="form-input font-mono" 
                        style={{ borderColor: 'rgba(16, 185, 129, 0.5)', background: 'rgba(16, 185, 129, 0.05)', fontWeight: 700, color: '#10b981' }}
                        value={accountForm.current_balance} 
                        onChange={(e) => setAccountForm({ ...accountForm, current_balance: e.target.value })} 
                        required 
                      />
                      <span style={{ fontSize: '0.72rem', color: '#10b981' }}>Directly set/reconcile active balance</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setEditAccountModalOpen(false)}>
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary" 
                  disabled={isSubmittingAccount}
                >
                  {isSubmittingAccount ? 'Saving Changes...' : 'Save Account & Balances'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 3: Confirm Account Deletion */}
      <ConfirmModal
        isOpen={deleteAccountModal.isOpen}
        title="Delete Bank Account"
        message={`Are you sure you want to remove account "${deleteAccountModal.account?.name}" (${deleteAccountModal.account?.bank_name})? Any daybook transactions linked to this account will prevent deletion for audit safety.`}
        confirmText="Yes, Delete Account"
        cancelText="Cancel"
        isDanger={true}
        isLoading={deleteAccountModal.isLoading}
        onConfirm={handleDeleteAccountConfirm}
        onCancel={() => setDeleteAccountModal({ isOpen: false, account: null, isLoading: false })}
        itemDetails={deleteAccountModal.account ? {
          "Account Name": deleteAccountModal.account.name,
          "Bank": deleteAccountModal.account.bank_name,
          "Account Number": deleteAccountModal.account.account_number || "—",
          "Current Balance": formatMoney(deleteAccountModal.account.current_balance)
        } : null}
      />
</div>
  );
}
