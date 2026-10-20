import React, { useState, useEffect } from 'react';
import { BookOpen, Search, Plus, RotateCcw, Check, Clock, Trash2, ArrowDownLeft, ArrowUpRight, Filter } from 'lucide-react';
import { api } from '../services/api';
import ConfirmModal from './ConfirmModal';
import Loader from './Loader';

export default function DaybookView({ bankAccounts, categories, currency = '₹', onDataChanged }) {
  const todayStr = new Date().toISOString().split('T')[0];
  const nowTime = new Date().toTimeString().split(' ')[0].substring(0, 5);

  const [dateFilter, setDateFilter] = useState(todayStr);
  const [summary, setSummary] = useState(null);
  const [entries, setEntries] = useState([]);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [loading, setLoading] = useState(false);

  // Entry Form State
  const [formDate, setFormDate] = useState(todayStr);
  const [formTime, setFormTime] = useState(nowTime);
  const [formType, setFormType] = useState('inward');
  const [categoryId, setCategoryId] = useState('');
  const [method, setMethod] = useState('Cash');
  const [chequeDate, setChequeDate] = useState('');
  const [bankAccountId, setBankAccountId] = useState(1);
  const [documentNo, setDocumentNo] = useState('');
  const [narration, setNarration] = useState('');
  const [toBePaid, setToBePaid] = useState(0);
  const [paid, setPaid] = useState('');
  const [excess, setExcess] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);
  const [deleteModalItem, setDeleteModalItem] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const formatMoney = (val) => `${currency} ${(Number(val) || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/-`;

  const formatTime = (timeVal) => {
    if (timeVal == null || timeVal === '') return '';
    if (typeof timeVal === 'number') {
      const totalSec = Math.floor(timeVal);
      const h = String(Math.floor(totalSec / 3600)).padStart(2, '0');
      const m = String(Math.floor((totalSec % 3600) / 60)).padStart(2, '0');
      return `${h}:${m}`;
    }
    return String(timeVal).substring(0, 5);
  };

  const loadData = () => {
    setLoading(true);
    Promise.all([
      api.getDaybookSummary(dateFilter),
      api.getDaybook({ date_filter: dateFilter, type: typeFilter !== 'all' ? typeFilter : undefined, search: search || undefined })
    ]).then(([sum, list]) => {
      setSummary(sum);
      setEntries(list);
    }).catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, [dateFilter, typeFilter, search]);

  const handleReset = () => {
    setFormDate(todayStr);
    setFormTime(new Date().toTimeString().split(' ')[0].substring(0, 5));
    setFormType('inward');
    setCategoryId('');
    setMethod('Cash');
    setChequeDate('');
    setDocumentNo('');
    setNarration('');
    setToBePaid(0);
    setPaid('');
    setExcess(0);
    setFormError(null);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setFormError(null);
    const amountVal = parseFloat(paid);
    if (!amountVal || amountVal <= 0) {
      setFormError('Please enter a valid amount paid/received.');
      return;
    }
    if (!narration.trim()) {
      setFormError('Narration / description is required.');
      return;
    }

    setSubmitting(true);
    try {
      await api.createDaybookEntry({
        date: formDate,
        time: formTime + ':00',
        type: formType,
        category_id: categoryId ? Number(categoryId) : null,
        method,
        cheque_date: method === 'Cheque' ? chequeDate : null,
        bank_account_id: Number(bankAccountId),
        document_no: documentNo,
        narration,
        to_be_paid: parseFloat(toBePaid) || 0,
        paid: amountVal,
        excess: parseFloat(excess) || 0,
      });
      handleReset();
      loadData();
      if (onDataChanged) onDataChanged();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleClearCheque = async (id) => {
    try {
      await api.clearCheque(id);
      loadData();
      if (onDataChanged) onDataChanged();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteClick = (item) => {
    setDeleteModalItem(item);
  };

  const handleConfirmDelete = async () => {
    if (!deleteModalItem) return;
    setIsDeleting(true);
    try {
      await api.deleteDaybookEntry(deleteModalItem.id);
      setDeleteModalItem(null);
      loadData();
      if (onDataChanged) onDataChanged();
    } catch (err) {
      alert(err.message || 'Failed to delete daybook entry');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div>
      {/* View Header */}
      <div className="view-header">
        <div className="view-title-group">
          <h2>Daybook (Daily Cash & Bank Register)</h2>
          <p>Real-time records of every money movement, inward receipts, and outward payments</p>
        </div>
        <div className="header-actions">
          <input 
            type="date" 
            className="form-input" 
            style={{ width: 'auto' }}
            value={dateFilter} 
            onChange={(e) => setDateFilter(e.target.value)} 
          />
        </div>
      </div>

      {/* Summary Bar (Section 9: Total balance, Inward, Outward, Daily balance) */}
      <div className="kpi-grid" style={{ marginBottom: '1.5rem' }}>
        <div className="kpi-card">
          <div className="kpi-label">Total Cash/Bank Balance</div>
          <div className="kpi-value" style={{ marginTop: '0.4rem', color: '#fff' }}>
            {formatMoney(summary?.total_balance)}
          </div>
          <div className="kpi-subtext">Across shop drawer & bank accounts</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-label" style={{ color: 'var(--success)' }}>Daily Inward (Received)</div>
          <div className="kpi-value" style={{ marginTop: '0.4rem', color: 'var(--success)' }}>
            + {formatMoney(summary?.inward)}
          </div>
          <div className="kpi-subtext">Sales receipts & deposits</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-label" style={{ color: 'var(--danger)' }}>Daily Outward (Paid)</div>
          <div className="kpi-value" style={{ marginTop: '0.4rem', color: 'var(--danger)' }}>
            - {formatMoney(summary?.outward)}
          </div>
          <div className="kpi-subtext">Supplier payments & shop expenses</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-label">Net Daily Balance</div>
          <div className="kpi-value" style={{ marginTop: '0.4rem', color: (summary?.daily_balance || 0) >= 0 ? '#38bdf8' : '#fbbf24' }}>
            {formatMoney(summary?.daily_balance)}
          </div>
          <div className="kpi-subtext">Inward minus Outward for {dateFilter}</div>
        </div>
      </div>

      {/* Grid: Daybook Entry Form + Table */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(320px, 420px) 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
        
        {/* Entry Form */}
        <div className="card" style={{ marginBottom: 0 }}>
          <div className="card-header">
            <h3 className="card-title">
              <Plus size={18} style={{ color: 'var(--primary)' }} />
              Record Daybook Entry
            </h3>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>ROCK PALACE</span>
          </div>

          <form onSubmit={handleSave}>
            {formError && (
              <div style={{ padding: '0.65rem', background: 'var(--danger-bg)', border: '1px solid var(--danger-border)', color: 'var(--danger)', borderRadius: 'var(--radius-sm)', marginBottom: '1rem', fontSize: '0.8rem' }}>
                {formError}
              </div>
            )}

            <div className="form-row" style={{ gridTemplateColumns: '1fr 1fr', marginBottom: '0.75rem' }}>
              <div>
                <label className="form-label">Date</label>
                <input type="date" className="form-input" value={formDate} onChange={(e) => setFormDate(e.target.value)} required />
              </div>
              <div>
                <label className="form-label">Time</label>
                <input type="time" className="form-input" value={formTime} onChange={(e) => setFormTime(e.target.value)} required />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Movement Type *</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                <button
                  type="button"
                  className={`btn ${formType === 'inward' ? 'btn-success' : 'btn-secondary'}`}
                  onClick={() => setFormType('inward')}
                  style={{ justifyContent: 'center' }}
                >
                  <ArrowDownLeft size={16} />
                  <span>Inward (Received)</span>
                </button>
                <button
                  type="button"
                  className={`btn ${formType === 'outward' ? 'btn-danger-outline' : 'btn-secondary'}`}
                  style={{ justifyContent: 'center', borderColor: formType === 'outward' ? 'var(--danger)' : undefined, background: formType === 'outward' ? 'var(--danger-bg)' : undefined }}
                  onClick={() => setFormType('outward')}
                >
                  <ArrowUpRight size={16} />
                  <span>Outward (Paid)</span>
                </button>
              </div>
            </div>

            <div className="form-row" style={{ gridTemplateColumns: '1fr 1fr', marginBottom: '0.75rem' }}>
              <div>
                <label className="form-label">Payment Method</label>
                <select className="form-select" value={method} onChange={(e) => setMethod(e.target.value)}>
                  <option value="Cash">Cash</option>
                  <option value="UPI">UPI (GPay / PhonePe)</option>
                  <option value="RTGS-NEFT">RTGS / NEFT / IMPS</option>
                  <option value="Cheque">Cheque</option>
                  <option value="Card">Debit / Credit Card</option>
                </select>
              </div>

              <div>
                <label className="form-label">Bank / Cash A/c</label>
                <select className="form-select" value={bankAccountId} onChange={(e) => setBankAccountId(e.target.value)}>
                  {bankAccounts && bankAccounts.map(ba => (
                    <option key={ba.id} value={ba.id}>{ba.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {method === 'Cheque' && (
              <div className="form-group">
                <label className="form-label">Cheque Date</label>
                <input type="date" className="form-input" value={chequeDate} onChange={(e) => setChequeDate(e.target.value)} required />
              </div>
            )}

            <div className="form-row" style={{ gridTemplateColumns: '1fr 1fr', marginBottom: '0.75rem' }}>
              <div>
                <label className="form-label">Category</label>
                <select className="form-select" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
                  <option value="">-- General --</option>
                  {categories && categories.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="form-label">Document / Bill No</label>
                <input type="text" className="form-input font-mono" placeholder="RP/BILL/.. or VCH-.." value={documentNo} onChange={(e) => setDocumentNo(e.target.value)} />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Narration / Description *</label>
              <textarea 
                className="form-textarea" 
                rows="2" 
                placeholder="e.g. Advance cash for Black Galaxy tiles from Anand Builders" 
                value={narration} 
                onChange={(e) => setNarration(e.target.value)} 
                required 
              />
            </div>

            <div className="form-row" style={{ gridTemplateColumns: '1fr 1fr', marginBottom: '1.25rem' }}>
              <div>
                <label className="form-label">Amount ({currency}) *</label>
                <input type="number" step="0.01" min="0.01" className="form-input font-mono" placeholder="0.00" value={paid} onChange={(e) => setPaid(e.target.value)} required />
              </div>

              <div>
                <label className="form-label">To Be Paid / Due ({currency})</label>
                <input type="number" step="0.01" min="0" className="form-input font-mono" value={toBePaid} onChange={(e) => setToBePaid(e.target.value)} />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={handleReset}>
                <RotateCcw size={15} />
                <span>Reset</span>
              </button>
              <button type="submit" className="btn btn-primary" style={{ flex: 2 }} disabled={submitting}>
                <Check size={16} />
                <span>{submitting ? 'Saving...' : 'Save Entry'}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Daybook Information Table */}
        <div className="card" style={{ marginBottom: 0 }}>
          <div className="card-header">
            <h3 className="card-title">
              <BookOpen size={18} style={{ color: '#38bdf8' }} />
              Day Book Information
            </h3>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <div className="status-pills" style={{ padding: '2px' }}>
                <button className={`pill-btn ${typeFilter === 'all' ? 'active' : ''}`} onClick={() => setTypeFilter('all')}>All</button>
                <button className={`pill-btn ${typeFilter === 'inward' ? 'active' : ''}`} onClick={() => setTypeFilter('inward')}>Inward</button>
                <button className={`pill-btn ${typeFilter === 'outward' ? 'active' : ''}`} onClick={() => setTypeFilter('outward')}>Outward</button>
              </div>
            </div>
          </div>

          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Sl.No</th>
                  <th>Date & Time</th>
                  <th>Category</th>
                  <th>Doc Number</th>
                  <th>Type</th>
                  <th>Method & Account</th>
                  <th>Description</th>
                  <th>Due</th>
                  <th style={{ textAlign: 'right' }}>Paid / Received</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="10" style={{ padding: '3.5rem 1rem' }}>
                      <Loader message="Updating Daybook Transactions..." subMessage="Calculating live cash, bank balances and daily inward/outward registers" />
                    </td>
                  </tr>
                ) : entries && entries.length > 0 ? (
                  entries.map((item, idx) => (
                    <tr key={item.id}>
                      <td style={{ color: 'var(--text-dim)' }}>{idx + 1}</td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{item.date}</div>
                        <div style={{ fontSize: '0.74rem', color: 'var(--text-dim)' }}>{formatTime(item.time)}</div>
                      </td>
                      <td>
                        <span className="badge" style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)' }}>
                          {item.category_name || 'General'}
                        </span>
                      </td>
                      <td className="font-mono" style={{ fontSize: '0.78rem' }}>
                        {item.document_no || '—'}
                      </td>
                      <td>
                        <span className={`badge ${item.type === 'inward' ? 'badge-paid' : 'badge-overdue'}`}>
                          {item.type}
                        </span>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, fontSize: '0.8rem' }}>{item.method}</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>{item.account_name}</div>
                        {item.method === 'Cheque' && (
                          <div style={{ marginTop: '2px' }}>
                            <span className={`badge ${item.cheque_status === 'cleared' ? 'badge-paid' : 'badge-pending'}`} style={{ fontSize: '0.65rem' }}>
                              {item.cheque_status} ({item.cheque_date})
                            </span>
                          </div>
                        )}
                      </td>
                      <td style={{ maxWidth: '220px', fontSize: '0.82rem' }}>
                        {item.narration}
                      </td>
                      <td style={{ color: 'var(--text-dim)', fontSize: '0.8rem' }}>
                        {item.to_be_paid > 0 ? formatMoney(item.to_be_paid) : '—'}
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 700, color: item.type === 'inward' ? 'var(--success)' : 'var(--danger)' }}>
                        {item.type === 'inward' ? '+' : '-'} {formatMoney(item.paid)}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '4px' }}>
                          {item.method === 'Cheque' && item.cheque_status === 'pending' && (
                            <button className="btn btn-sm btn-success" onClick={() => handleClearCheque(item.id)} title="Mark Cheque as Cleared">
                              <Check size={12} />
                            </button>
                          )}
                          <button className="btn btn-sm btn-danger-outline" onClick={() => handleDeleteClick(item)} title="Delete Entry">
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="10" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                      No Daybook entries found for {dateFilter}. Use the form on the left to record daily receipts or payments.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* In-App Confirm Delete Modal */}
      <ConfirmModal
        isOpen={Boolean(deleteModalItem)}
        title="Delete Daybook Entry"
        message="Are you sure you want to delete this Daybook entry? This will reverse any linked cash or bank account balances."
        confirmText="Delete Entry"
        isLoading={isDeleting}
        onCancel={() => !isDeleting && setDeleteModalItem(null)}
        onConfirm={handleConfirmDelete}
        itemDetails={deleteModalItem ? (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span style={{ color: '#94a3b8' }}>Doc No:</span>
              <strong style={{ color: '#f8fafc' }}>{deleteModalItem.document_no || 'Manual Entry'}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span style={{ color: '#94a3b8' }}>Type & Method:</span>
              <span style={{ color: deleteModalItem.type === 'inward' ? '#34d399' : '#f87171', fontWeight: 600 }}>
                {deleteModalItem.type?.toUpperCase()} • {deleteModalItem.method}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span style={{ color: '#94a3b8' }}>Amount:</span>
              <strong style={{ color: '#38bdf8' }}>{formatMoney(deleteModalItem.paid)}</strong>
            </div>
            {deleteModalItem.narration && (
              <div style={{ marginTop: '6px', fontSize: '0.8rem', color: '#cbd5e1' }}>
                {deleteModalItem.narration}
              </div>
            )}
          </div>
        ) : null}
      />
    </div>
  );
}
