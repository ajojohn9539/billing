import React, { useState, useEffect } from 'react';
import { 
  Archive, 
  RotateCcw, 
  Search, 
  Filter, 
  History, 
  Trash2, 
  Users, 
  Package, 
  FileText, 
  ShoppingBag, 
  BookOpen, 
  AlertTriangle, 
  Landmark, 
  CheckCircle, 
  AlertCircle, 
  RefreshCw, 
  Eye, 
  X,
  Clock,
  UserCheck
} from 'lucide-react';
import { api } from '../services/api';
import ConfirmModal from './ConfirmModal';
import Loader from './Loader';

export default function ArchivesView({ currency = '₹', onRefresh }) {
  const [activeMainTab, setActiveMainTab] = useState('archives'); // 'archives' | 'audit'
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState(null);
  const [feedback, setFeedback] = useState(null);

  // Recycle Bin State
  const [archiveType, setArchiveType] = useState('all'); // all, contacts, products, sales, purchases, daybook, damages
  const [archivedContacts, setArchivedContacts] = useState([]);
  const [archivedProducts, setArchivedProducts] = useState([]);
  const [archivedSales, setArchivedSales] = useState([]);
  const [archivedPurchases, setArchivedPurchases] = useState([]);
  const [archivedDaybook, setArchivedDaybook] = useState([]);
  const [archivedDamages, setArchivedDamages] = useState([]);
  const [archiveSearch, setArchiveSearch] = useState('');
  
  // Restore Modal
  const [restoreModal, setRestoreModal] = useState({
    isOpen: false,
    item: null,
    type: null,
    isLoading: false
  });

  // Audit Logs State
  const [auditLogs, setAuditLogs] = useState([]);
  const [auditTotal, setAuditTotal] = useState(0);
  const [auditTableFilter, setAuditTableFilter] = useState('all');
  const [auditActionFilter, setAuditActionFilter] = useState('all');
  const [auditSearch, setAuditSearch] = useState('');
  const [selectedAuditLog, setSelectedAuditLog] = useState(null);

  const formatMoney = (val) => `${currency} ${(Number(val) || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/-`;

  const loadSummary = async () => {
    try {
      const s = await api.getArchivesSummary();
      setSummary(s);
    } catch (e) {
      console.warn('Failed to load archives summary:', e);
    }
  };

  const loadAllArchives = async () => {
    setLoading(true);
    try {
      const [c, p, s, pur, d, dmg] = await Promise.all([
        api.getArchivedContacts().catch(() => []),
        api.getArchivedProducts().catch(() => []),
        api.getArchivedSales().catch(() => []),
        api.getArchivedPurchases().catch(() => []),
        api.getArchivedDaybook().catch(() => []),
        api.getArchivedDamages().catch(() => []),
      ]);
      setArchivedContacts(c || []);
      setArchivedProducts(p || []);
      setArchivedSales(s || []);
      setArchivedPurchases(pur || []);
      setArchivedDaybook(d || []);
      setArchivedDamages(dmg || []);
      await loadSummary();
    } catch (e) {
      setFeedback({ type: 'error', message: 'Failed to load archived records: ' + e.message });
    } finally {
      setLoading(false);
    }
  };

  const loadAuditLogs = async () => {
    try {
      const res = await api.getAuditLogs({
        table_name: auditTableFilter !== 'all' ? auditTableFilter : undefined,
        action: auditActionFilter !== 'all' ? auditActionFilter : undefined,
        limit: 150
      });
      setAuditLogs(res?.logs || []);
      setAuditTotal(res?.total || 0);
    } catch (e) {
      console.warn('Failed to load audit logs:', e);
    }
  };

  useEffect(() => {
    loadAllArchives();
    loadAuditLogs();
  }, []);

  useEffect(() => {
    if (activeMainTab === 'audit') {
      loadAuditLogs();
    }
  }, [activeMainTab, auditTableFilter, auditActionFilter]);

  const handleRestoreConfirm = async () => {
    if (!restoreModal.item || !restoreModal.type) return;
    setRestoreModal(prev => ({ ...prev, isLoading: true }));
    try {
      const { id } = restoreModal.item;
      let res;
      if (restoreModal.type === 'contact') res = await api.restoreContact(id);
      else if (restoreModal.type === 'product') res = await api.restoreProduct(id);
      else if (restoreModal.type === 'sale') res = await api.restoreSale(id);
      else if (restoreModal.type === 'purchase') res = await api.restorePurchase(id);
      else if (restoreModal.type === 'daybook') res = await api.restoreDaybook(id);
      else if (restoreModal.type === 'damage') res = await api.restoreDamage(id);

      setFeedback({ type: 'success', message: res?.message || 'Record restored to Active successfully!' });
      setTimeout(() => setFeedback(null), 4000);
      setRestoreModal({ isOpen: false, item: null, type: null, isLoading: false });
      
      // Reload everything & notify parent
      await loadAllArchives();
      await loadAuditLogs();
      if (onRefresh) onRefresh();
    } catch (e) {
      setFeedback({ type: 'error', message: 'Failed to restore record: ' + e.message });
      setRestoreModal(prev => ({ ...prev, isLoading: false }));
    }
  };

  // Build unified archived list
  const unifiedArchives = [
    ...archivedContacts.map(it => ({
      ...it,
      archiveType: 'contact',
      typeLabel: 'Contact / Client',
      displayTitle: it.name,
      displaySub: `${it.type || 'Customer'} • Phone: ${it.phone || 'N/A'}`,
      dateDeleted: it.deleted_at || it.updated_at,
      badgeText: it.status === 'Inactive' ? 'Inactive' : 'Soft-Deleted',
      badgeColor: it.status === 'Inactive' ? '#f59e0b' : '#ef4444'
    })),
    ...archivedProducts.map(it => ({
      ...it,
      archiveType: 'product',
      typeLabel: 'Stone Product',
      displayTitle: it.name,
      displaySub: `Code: ${it.code || 'N/A'} • Unit: ${it.unit} • Price: ${formatMoney(it.purchase_price)}`,
      dateDeleted: it.deleted_at || it.updated_at,
      badgeText: it.status === 'Inactive' ? 'Inactive' : 'Soft-Deleted',
      badgeColor: it.status === 'Inactive' ? '#f59e0b' : '#ef4444'
    })),
    ...archivedSales.map(it => ({
      ...it,
      archiveType: 'sale',
      typeLabel: 'Sales Bill',
      displayTitle: `Bill #${it.bill_no}`,
      displaySub: `Customer: ${it.customer_name || 'N/A'} • Total: ${formatMoney(it.total)}`,
      dateDeleted: it.deleted_at,
      badgeText: 'Deleted Bill',
      badgeColor: '#ef4444'
    })),
    ...archivedPurchases.map(it => ({
      ...it,
      archiveType: 'purchase',
      typeLabel: 'Purchase',
      displayTitle: `Invoice #${it.invoice_no}`,
      displaySub: `Supplier: ${it.supplier_name || 'N/A'} • Total: ${formatMoney(it.total)}`,
      dateDeleted: it.deleted_at,
      badgeText: 'Deleted Purchase',
      badgeColor: '#ef4444'
    })),
    ...archivedDaybook.map(it => ({
      ...it,
      archiveType: 'daybook',
      typeLabel: 'Daybook Entry',
      displayTitle: `${it.type?.toUpperCase()} (${it.method}) - ${formatMoney(it.paid)}`,
      displaySub: it.narration || it.document_no || 'Cash transaction',
      dateDeleted: it.deleted_at,
      badgeText: 'Deleted Daybook',
      badgeColor: '#ef4444'
    })),
    ...archivedDamages.map(it => ({
      ...it,
      archiveType: 'damage',
      typeLabel: 'Damage Entry',
      displayTitle: `${it.product_name} (${it.qty} ${it.unit})`,
      displaySub: `Reason: ${it.reason} • Cost: ${formatMoney(it.cost_value)}`,
      dateDeleted: it.deleted_at,
      badgeText: 'Deleted Damage',
      badgeColor: '#ef4444'
    }))
  ].filter(item => {
    if (archiveType !== 'all' && item.archiveType !== archiveType) return false;
    if (!archiveSearch.trim()) return true;
    const q = archiveSearch.toLowerCase();
    return (
      (item.displayTitle || '').toLowerCase().includes(q) ||
      (item.displaySub || '').toLowerCase().includes(q) ||
      (item.typeLabel || '').toLowerCase().includes(q)
    );
  });

  // Filter audit logs
  const filteredAuditLogs = auditLogs.filter(log => {
    if (!auditSearch.trim()) return true;
    const q = auditSearch.toLowerCase();
    return (
      (log.details || '').toLowerCase().includes(q) ||
      (log.table_name || '').toLowerCase().includes(q) ||
      (log.action || '').toLowerCase().includes(q) ||
      (log.user_name || '').toLowerCase().includes(q)
    );
  });

  const getActionBadgeColor = (action) => {
    const act = (action || '').toUpperCase();
    if (act === 'CREATE') return { bg: 'rgba(16, 185, 129, 0.15)', text: '#10b981', border: 'rgba(16, 185, 129, 0.3)' };
    if (act === 'UPDATE') return { bg: 'rgba(56, 189, 248, 0.15)', text: '#38bdf8', border: 'rgba(56, 189, 248, 0.3)' };
    if (act === 'DELETE') return { bg: 'rgba(239, 68, 68, 0.15)', text: '#ef4444', border: 'rgba(239, 68, 68, 0.3)' };
    if (act === 'INACTIVATE') return { bg: 'rgba(245, 158, 11, 0.15)', text: '#f59e0b', border: 'rgba(245, 158, 11, 0.3)' };
    if (act === 'RESTORE') return { bg: 'rgba(168, 85, 247, 0.15)', text: '#a855f7', border: 'rgba(168, 85, 247, 0.3)' };
    if (act === 'TRANSFER') return { bg: 'rgba(6, 182, 212, 0.15)', text: '#06b6d4', border: 'rgba(6, 182, 212, 0.3)' };
    return { bg: 'rgba(148, 163, 184, 0.15)', text: '#94a3b8', border: 'rgba(148, 163, 184, 0.3)' };
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', animation: 'fadeIn 0.25s ease-out' }}>
      
      {/* Header */}
      <div className="view-header" style={{ marginBottom: 0 }}>
        <div className="view-title-group">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.2) 0%, rgba(168, 85, 247, 0.2) 100%)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#f87171'
            }}>
              <Archive size={20} />
            </div>
            <div>
              <h2 style={{ margin: 0 }}>Archives & Action History Audit Trail</h2>
              <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Recycle bin for inactive & soft-deleted records, with real-time audit action history for every ERP transaction
              </p>
            </div>
          </div>
        </div>

        {/* Refresh button */}
        <div className="header-actions">
          <button 
            className="btn btn-secondary btn-sm"
            onClick={() => {
              loadAllArchives();
              loadAuditLogs();
            }}
            disabled={loading}
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <RefreshCw size={14} className={loading ? 'spin' : ''} />
            <span>Refresh Records</span>
          </button>
        </div>
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div style={{
          padding: '0.85rem 1.25rem',
          borderRadius: '10px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: feedback.type === 'success' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
          border: `1px solid ${feedback.type === 'success' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
          color: feedback.type === 'success' ? '#10b981' : '#f87171',
          fontSize: '0.9rem',
          fontWeight: 500
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            {feedback.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
            <span>{feedback.message}</span>
          </div>
          <button 
            onClick={() => setFeedback(null)}
            style={{ background: 'transparent', border: 'none', color: 'inherit', cursor: 'pointer', fontSize: '1.2rem' }}
          >
            ×
          </button>
        </div>
      )}

      {/* Top Main Mode Switcher: Recycle Bin vs Audit Logs */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.75rem' }}>
        <button
          onClick={() => setActiveMainTab('archives')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.6rem 1.25rem',
            borderRadius: '10px',
            border: activeMainTab === 'archives' ? '1px solid var(--primary)' : '1px solid transparent',
            background: activeMainTab === 'archives' ? 'var(--primary-light)' : 'transparent',
            color: activeMainTab === 'archives' ? 'var(--text-main)' : 'var(--text-muted)',
            fontWeight: activeMainTab === 'archives' ? 700 : 500,
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
        >
          <RotateCcw size={16} style={{ color: activeMainTab === 'archives' ? 'var(--primary)' : 'inherit' }} />
          <span>Inactive & Deleted Archive (Recycle Bin)</span>
          <span style={{
            fontSize: '0.75rem',
            padding: '0.15rem 0.5rem',
            borderRadius: '12px',
            background: 'rgba(239, 68, 68, 0.2)',
            color: '#ef4444',
            fontWeight: 700
          }}>
            {unifiedArchives.length}
          </span>
        </button>

        <button
          onClick={() => setActiveMainTab('audit')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.6rem 1.25rem',
            borderRadius: '10px',
            border: activeMainTab === 'audit' ? '1px solid var(--primary)' : '1px solid transparent',
            background: activeMainTab === 'audit' ? 'var(--primary-light)' : 'transparent',
            color: activeMainTab === 'audit' ? 'var(--text-main)' : 'var(--text-muted)',
            fontWeight: activeMainTab === 'audit' ? 700 : 500,
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
        >
          <History size={16} style={{ color: activeMainTab === 'audit' ? 'var(--primary)' : 'inherit' }} />
          <span>Action History & Temporary Audit Trail</span>
          <span style={{
            fontSize: '0.75rem',
            padding: '0.15rem 0.5rem',
            borderRadius: '12px',
            background: 'rgba(56, 189, 248, 0.2)',
            color: '#38bdf8',
            fontWeight: 700
          }}>
            {auditTotal || auditLogs.length}
          </span>
        </button>
      </div>

      {/* SECTION 1: RECYCLE BIN / INACTIVE & DELETED */}
      {activeMainTab === 'archives' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          
          {/* Sub-Filters by Entity */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
              {[
                { id: 'all', label: 'All Archived', count: unifiedArchives.length },
                { id: 'contact', label: 'Contacts', count: archivedContacts.length, icon: Users },
                { id: 'product', label: 'Products', count: archivedProducts.length, icon: Package },
                { id: 'sale', label: 'Sales Bills', count: archivedSales.length, icon: FileText },
                { id: 'purchase', label: 'Purchases', count: archivedPurchases.length, icon: ShoppingBag },
                { id: 'daybook', label: 'Daybook', count: archivedDaybook.length, icon: BookOpen },
                { id: 'damage', label: 'Damages', count: archivedDamages.length, icon: AlertTriangle },
              ].map(tab => {
                const isSelected = archiveType === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setArchiveType(tab.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      padding: '0.35rem 0.75rem',
                      borderRadius: '8px',
                      border: isSelected ? '1px solid var(--primary)' : '1px solid var(--border-subtle)',
                      background: isSelected ? 'var(--primary-light)' : 'var(--bg-surface)',
                      color: isSelected ? 'var(--text-main)' : 'var(--text-muted)',
                      fontSize: '0.82rem',
                      fontWeight: isSelected ? 700 : 500,
                      cursor: 'pointer'
                    }}
                  >
                    {tab.icon && <tab.icon size={13} />}
                    <span>{tab.label}</span>
                    <span style={{
                      fontSize: '0.7rem',
                      opacity: 0.8,
                      background: isSelected ? 'rgba(99, 102, 241, 0.3)' : 'rgba(255, 255, 255, 0.08)',
                      padding: '0.1rem 0.35rem',
                      borderRadius: '4px'
                    }}>
                      {tab.count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Search Input */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: '240px' }}>
              <div className="search-input-wrap" style={{ width: '100%' }}>
                <Search size={14} className="search-icon" />
                <input
                  type="text"
                  className="search-input"
                  placeholder="Search archived items..."
                  value={archiveSearch}
                  onChange={(e) => setArchiveSearch(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Table of Archived Records */}
          <div className="card">
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Module / Entity</th>
                    <th>Record Name & Details</th>
                    <th>Sub Information</th>
                    <th>Status</th>
                    <th>Date Archived / Deleted</th>
                    <th style={{ textAlign: 'right' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {unifiedArchives.length > 0 ? (
                    unifiedArchives.map((item, idx) => (
                      <tr key={`${item.archiveType}-${item.id || idx}`}>
                        <td>
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            padding: '0.2rem 0.55rem',
                            borderRadius: '6px',
                            background: 'rgba(255, 255, 255, 0.06)',
                            color: 'var(--text-main)',
                            border: '1px solid var(--border-subtle)'
                          }}>
                            {item.typeLabel}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                            <strong style={{ fontSize: '0.95rem', color: 'var(--text-main)' }}>
                              {item.displayTitle}
                            </strong>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                              ID #{item.id}
                            </span>
                          </div>
                        </td>
                        <td>
                          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                            {item.displaySub}
                          </span>
                        </td>
                        <td>
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.3rem',
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            padding: '0.2rem 0.55rem',
                            borderRadius: '6px',
                            background: item.badgeColor === '#f59e0b' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                            color: item.badgeColor,
                            border: `1px solid ${item.badgeColor}40`
                          }}>
                            {item.badgeText}
                          </span>
                        </td>
                        <td>
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
                            {item.dateDeleted ? new Date(item.dateDeleted).toLocaleString('en-IN') : '—'}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <button
                            className="btn btn-secondary btn-xs"
                            onClick={() => setRestoreModal({
                              isOpen: true,
                              item,
                              type: item.archiveType,
                              isLoading: false
                            })}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.4rem',
                              background: 'rgba(16, 185, 129, 0.12)',
                              color: '#10b981',
                              borderColor: 'rgba(16, 185, 129, 0.3)',
                              fontWeight: 700
                            }}
                          >
                            <RotateCcw size={13} />
                            <span>Restore to Active</span>
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                          <CheckCircle size={32} style={{ color: '#10b981', opacity: 0.7 }} />
                          <span style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-main)' }}>Recycle Bin is Empty</span>
                          <span style={{ fontSize: '0.82rem' }}>No inactive or deleted records match the current filter.</span>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 2: ACTION HISTORY & TEMPORARY AUDIT TRAIL */}
      {activeMainTab === 'audit' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          
          {/* Audit Filters Bar */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
              
              {/* Module Filter */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Module:</span>
                <select 
                  className="form-select" 
                  value={auditTableFilter} 
                  onChange={(e) => setAuditTableFilter(e.target.value)}
                  style={{ width: '150px', padding: '0.35rem 0.6rem', fontSize: '0.82rem' }}
                >
                  <option value="all">All Modules</option>
                  <option value="contacts">Contacts / Clients</option>
                  <option value="products">Stone Products</option>
                  <option value="sales">Sales Bills</option>
                  <option value="purchases">Purchases</option>
                  <option value="daybook">Daybook Cash</option>
                  <option value="bank_accounts">Bank Accounts</option>
                  <option value="damages">Damages</option>
                </select>
              </div>

              {/* Action Filter */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Action:</span>
                <select 
                  className="form-select" 
                  value={auditActionFilter} 
                  onChange={(e) => setAuditActionFilter(e.target.value)}
                  style={{ width: '140px', padding: '0.35rem 0.6rem', fontSize: '0.82rem' }}
                >
                  <option value="all">All Actions</option>
                  <option value="CREATE">CREATE</option>
                  <option value="UPDATE">UPDATE</option>
                  <option value="DELETE">DELETE</option>
                  <option value="INACTIVATE">INACTIVATE</option>
                  <option value="RESTORE">RESTORE</option>
                  <option value="TRANSFER">TRANSFER</option>
                </select>
              </div>
            </div>

            {/* Audit Search */}
            <div style={{ minWidth: '240px' }}>
              <div className="search-input-wrap">
                <Search size={14} className="search-icon" />
                <input
                  type="text"
                  className="search-input"
                  placeholder="Search action details or user..."
                  value={auditSearch}
                  onChange={(e) => setAuditSearch(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Audit Logs Table */}
          <div className="card">
            <div className="card-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <History size={18} style={{ color: '#38bdf8' }} />
                <h3 className="card-title" style={{ margin: 0 }}>Action History (Temporary Action Log)</h3>
              </div>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Showing {filteredAuditLogs.length} of {auditTotal || auditLogs.length} recorded operations
              </span>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Timestamp</th>
                    <th>Action</th>
                    <th>Module / Table</th>
                    <th>Record ID</th>
                    <th>Staff / Operator</th>
                    <th>Action Details</th>
                    <th style={{ textAlign: 'right' }}>Snapshot</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAuditLogs.length > 0 ? (
                    filteredAuditLogs.map((log) => {
                      const badge = getActionBadgeColor(log.action);
                      return (
                        <tr key={log.id}>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--text-muted)', fontSize: '0.8rem', fontFamily: 'var(--font-mono)' }}>
                              <Clock size={12} />
                              <span>{log.created_at ? new Date(log.created_at).toLocaleString('en-IN') : '—'}</span>
                            </div>
                          </td>
                          <td>
                            <span style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              fontSize: '0.72rem',
                              fontWeight: 800,
                              padding: '0.2rem 0.55rem',
                              borderRadius: '6px',
                              background: badge.bg,
                              color: badge.text,
                              border: `1px solid ${badge.border}`,
                              letterSpacing: '0.5px'
                            }}>
                              {log.action}
                            </span>
                          </td>
                          <td>
                            <span style={{
                              fontSize: '0.82rem',
                              fontWeight: 600,
                              color: 'var(--text-main)',
                              textTransform: 'capitalize'
                            }}>
                              {log.table_name}
                            </span>
                          </td>
                          <td>
                            <span className="font-mono" style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                              #{log.record_id}
                            </span>
                          </td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                              <UserCheck size={13} style={{ color: 'var(--primary)' }} />
                              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)' }}>
                                {log.user_name || 'Billora Admin'}
                              </span>
                            </div>
                          </td>
                          <td>
                            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                              {log.details || '—'}
                            </span>
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            {(log.old_values || log.new_values) ? (
                              <button
                                className="btn btn-secondary btn-xs"
                                onClick={() => setSelectedAuditLog(log)}
                                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', padding: '0.25rem 0.5rem' }}
                                title="View old and new value snapshots"
                              >
                                <Eye size={12} />
                                <span>Inspect</span>
                              </button>
                            ) : (
                              <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="7" style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
                        No action logs found matching your filter.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: Confirm Restore Modal */}
      <ConfirmModal
        isOpen={restoreModal.isOpen}
        title={`Restore ${restoreModal.item?.typeLabel || 'Record'}`}
        message={`Are you sure you want to restore "${restoreModal.item?.displayTitle}" to Active? This will update its status in the system and restore any linked stock or balances.`}
        confirmText="Yes, Restore to Active"
        cancelText="Cancel"
        isDanger={false}
        isLoading={restoreModal.isLoading}
        onConfirm={handleRestoreConfirm}
        onCancel={() => setRestoreModal({ isOpen: false, item: null, type: null, isLoading: false })}
        itemDetails={restoreModal.item ? {
          "Record Title": restoreModal.item.displayTitle,
          "Type": restoreModal.item.typeLabel,
          "Original ID": `#${restoreModal.item.id}`,
          "Current State": restoreModal.item.badgeText
        } : null}
      />

      {/* MODAL 2: Inspect Audit Log Snapshot Modal */}
      {selectedAuditLog && (
        <div className="modal-overlay">
          <div className="modal-container" style={{ maxWidth: '640px' }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Eye size={18} style={{ color: 'var(--primary)' }} />
                <h3>Action Snapshot: #{selectedAuditLog.id} ({selectedAuditLog.action})</h3>
              </div>
              <button className="modal-close-btn" onClick={() => setSelectedAuditLog(null)}>×</button>
            </div>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <strong style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Action Summary:</strong>
                <p style={{ margin: '0.2rem 0', fontSize: '0.95rem', color: 'var(--text-main)', fontWeight: 600 }}>
                  {selectedAuditLog.details}
                </p>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>
                  Performed by {selectedAuditLog.user_name} on {new Date(selectedAuditLog.created_at).toLocaleString('en-IN')}
                </span>
              </div>

              {selectedAuditLog.old_values && (
                <div>
                  <label className="form-label" style={{ color: '#ef4444' }}>Previous State (Old Values):</label>
                  <pre style={{
                    background: 'rgba(0, 0, 0, 0.4)',
                    padding: '0.85rem',
                    borderRadius: '8px',
                    fontSize: '0.78rem',
                    fontFamily: 'var(--font-mono)',
                    color: '#f87171',
                    maxHeight: '160px',
                    overflowY: 'auto',
                    whiteSpace: 'pre-wrap'
                  }}>
                    {JSON.stringify(selectedAuditLog.old_values, null, 2)}
                  </pre>
                </div>
              )}

              {selectedAuditLog.new_values && (
                <div>
                  <label className="form-label" style={{ color: '#10b981' }}>Updated State (New Values):</label>
                  <pre style={{
                    background: 'rgba(0, 0, 0, 0.4)',
                    padding: '0.85rem',
                    borderRadius: '8px',
                    fontSize: '0.78rem',
                    fontFamily: 'var(--font-mono)',
                    color: '#34d399',
                    maxHeight: '160px',
                    overflowY: 'auto',
                    whiteSpace: 'pre-wrap'
                  }}>
                    {JSON.stringify(selectedAuditLog.new_values, null, 2)}
                  </pre>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setSelectedAuditLog(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
