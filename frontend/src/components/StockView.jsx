import React, { useState, useEffect } from 'react';
import { Layers, AlertCircle, History, Sliders, Search, Plus, X, Check, Trash2 } from 'lucide-react';
import { api } from '../services/api';
import ConfirmModal from './ConfirmModal';
import Loader from './Loader';

export default function StockView({ products, currency = '₹', onRefresh }) {
  const todayStr = new Date().toISOString().split('T')[0];

  const [activeTab, setActiveTab] = useState('summary'); // summary, low_stock, ledger
  const [summaryData, setSummaryData] = useState([]);
  const [lowStockData, setLowStockData] = useState([]);
  const [selectedProductId, setSelectedProductId] = useState(products && products.length > 0 ? products[0].id : null);
  const [ledgerData, setLedgerData] = useState(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);

  // Deletion state
  const [deleteModalStock, setDeleteModalStock] = useState(null);
  const [isDeletingStock, setIsDeletingStock] = useState(false);

  // Add Stock Item Modal
  const [addStockModalOpen, setAddStockModalOpen] = useState(false);
  const [newStockName, setNewStockName] = useState('');
  const [newStockCode, setNewStockCode] = useState('');
  const [newStockCategory, setNewStockCategory] = useState('Granite');
  const [newStockUnit, setNewStockUnit] = useState('sqft');
  const [newStockOpening, setNewStockOpening] = useState(100);
  const [newStockPurchasePrice, setNewStockPurchasePrice] = useState('');
  const [newStockSellingPrice, setNewStockSellingPrice] = useState('');
  const [newStockMinStock, setNewStockMinStock] = useState(25);
  const [newStockError, setNewStockError] = useState(null);
  const [newStockSaving, setNewStockSaving] = useState(false);

  // Adjustment Modal
  const [adjModalOpen, setAdjModalOpen] = useState(false);
  const [adjProductId, setAdjProductId] = useState('');
  const [adjQty, setAdjQty] = useState('');
  const [adjDate, setAdjDate] = useState(todayStr);
  const [adjReason, setAdjReason] = useState('Physical count audit difference');
  const [adjError, setAdjError] = useState(null);
  const [adjSaving, setAdjSaving] = useState(false);

  const formatMoney = (val) => `${currency} ${(Number(val) || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/-`;

  const loadStockData = () => {
    setLoading(true);
    Promise.all([
      api.getStockSummary().catch(() => []),
      api.getLowStockReport().catch(() => [])
    ]).then(([sum, low]) => {
      setSummaryData(Array.isArray(sum) ? sum : []);
      setLowStockData(Array.isArray(low) ? low : []);
    }).catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadStockData();
  }, []);

  useEffect(() => {
    if (selectedProductId) {
      api.getStockLedger(selectedProductId)
        .then(res => setLedgerData(res))
        .catch(err => console.error(err));
    }
  }, [selectedProductId]);

  const handleOpenAdjustment = (productId = null) => {
    const defaultPid = productId || (products && products.length > 0 ? products[0].id : (summaryData[0]?.id || ''));
    setAdjProductId(defaultPid);
    setAdjQty('');
    setAdjDate(todayStr);
    setAdjReason('Physical count audit difference');
    setAdjError(null);
    setAdjModalOpen(true);
  };

  const handleSaveAdjustment = async (e) => {
    e.preventDefault();
    setAdjError(null);
    const qVal = parseFloat(adjQty);
    if (!qVal || qVal === 0) {
      setAdjError('Please enter a non-zero adjustment quantity (+ for surplus, - for shortage).');
      return;
    }

    setAdjSaving(true);
    try {
      await api.addStockAdjustment({
        product_id: Number(adjProductId),
        adjustment_qty: qVal,
        date: adjDate,
        reason: adjReason,
      });
      setAdjModalOpen(false);
      loadStockData();
      if (selectedProductId === Number(adjProductId)) {
        api.getStockLedger(selectedProductId).then(setLedgerData);
      }
      if (onRefresh) onRefresh();
    } catch (err) {
      setAdjError(err.message || 'Failed to apply adjustment');
    } finally {
      setAdjSaving(false);
    }
  };

  const handleOpenAddStock = () => {
    setNewStockName('');
    setNewStockCode('');
    setNewStockCategory('Granite');
    setNewStockUnit('sqft');
    setNewStockOpening(100);
    setNewStockPurchasePrice('');
    setNewStockSellingPrice('');
    setNewStockMinStock(25);
    setNewStockError(null);
    setAddStockModalOpen(true);
  };

  const handleSaveNewStock = async (e) => {
    e.preventDefault();
    if (!newStockName.trim()) {
      setNewStockError('Please provide stone item name.');
      return;
    }
    setNewStockSaving(true);
    setNewStockError(null);
    try {
      await api.createProduct({
        name: newStockName.trim(),
        code: newStockCode.trim() || undefined,
        category: newStockCategory,
        unit: newStockUnit,
        opening_stock: parseFloat(newStockOpening) || 0,
        current_stock: parseFloat(newStockOpening) || 0,
        purchase_price: parseFloat(newStockPurchasePrice) || 0,
        selling_price: parseFloat(newStockSellingPrice) || 0,
        min_stock: parseFloat(newStockMinStock) || 10,
        tax_percent: 18.0
      });
      setAddStockModalOpen(false);
      loadStockData();
      if (onRefresh) onRefresh();
    } catch (err) {
      setNewStockError(err.message || 'Failed to create stock item');
    } finally {
      setNewStockSaving(false);
    }
  };

  const handleDeleteStockClick = (s) => {
    setDeleteModalStock(s);
  };

  const handleConfirmDeleteStock = async () => {
    if (!deleteModalStock) return;
    setIsDeletingStock(true);
    try {
      await api.deleteProduct(deleteModalStock.id);
      setDeleteModalStock(null);
      loadStockData();
      if (onRefresh) onRefresh();
    } catch (err) {
      alert(err.message || 'Cannot delete item: linked to existing transactions or damages.');
    } finally {
      setIsDeletingStock(false);
    }
  };

  const totalInventoryValue = summaryData.reduce((acc, s) => acc + (parseFloat(s.stock_value) || 0), 0);

  const filteredSummary = summaryData.filter(s => {
    const q = search.toLowerCase();
    return s.name?.toLowerCase().includes(q) || s.code?.toLowerCase().includes(q) || s.category?.toLowerCase().includes(q);
  });

  return (
    <div>
      {/* Header */}
      <div className="view-header">
        <div className="view-title-group">
          <h2>Stock & Inventory Ledger</h2>
          <p>
            Formula: <code>Current stock = Opening + Purchases + Sales returns − Sales − Damage ± Adjustments</code>
          </p>
        </div>
        <div className="header-actions">
          <div style={{ textAlign: 'right', marginRight: '1rem' }}>
            <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Total Stock Valuation</span>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--success)' }}>
              {formatMoney(totalInventoryValue)}
            </div>
          </div>
          <button className="btn btn-primary" onClick={handleOpenAddStock}>
            <Plus size={16} />
            <span>Add Stock Item</span>
          </button>
          <button className="btn btn-secondary" onClick={() => handleOpenAdjustment()}>
            <Sliders size={16} />
            <span>Stock Inward / Adjust</span>
          </button>
        </div>
      </div>

      {/* Sub tabs */}
      <div className="filter-bar">
        <div className="status-pills">
          <button className={`pill-btn ${activeTab === 'summary' ? 'active' : ''}`} onClick={() => setActiveTab('summary')}>
            Stock Summary ({summaryData.length})
          </button>
          <button className={`pill-btn ${activeTab === 'low_stock' ? 'active' : ''}`} onClick={() => setActiveTab('low_stock')} style={{ color: lowStockData.length > 0 ? '#f87171' : undefined }}>
            Low Stock Alerts ({lowStockData.length})
          </button>
          <button className={`pill-btn ${activeTab === 'ledger' ? 'active' : ''}`} onClick={() => setActiveTab('ledger')}>
            Movement Ledger
          </button>
        </div>

        {activeTab === 'summary' && (
          <div className="search-input-wrap" style={{ width: '320px' }}>
            <Search />
            <input 
              type="text" 
              className="search-input" 
              placeholder="Filter stock by stone or code..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        )}
      </div>

      {/* Tab 1: Stock Summary */}
      {activeTab === 'summary' && (
        <div className="card">
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Stone / Product</th>
                  <th>Category</th>
                  <th>Unit</th>
                  <th>Opening</th>
                  <th>Purchased</th>
                  <th>Sold</th>
                  <th>Damaged</th>
                  <th>Adjusted</th>
                  <th>Current Stock</th>
                  <th style={{ textAlign: 'right' }}>Stock Value</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="11" style={{ padding: '3.5rem 1rem' }}>
                      <Loader message="Updating Stone Inventory & Stock Ledger..." subMessage="Calculating live Sq.Ft. counts and stock movements" />
                    </td>
                  </tr>
                ) : filteredSummary && filteredSummary.length > 0 ? (
                  filteredSummary.map((s) => (
                    <tr key={s.id} style={{ background: s.is_low_stock ? 'rgba(239, 68, 68, 0.04)' : undefined }}>
                      <td>
                        <div style={{ fontWeight: 700, color: '#fff' }}>{s.name}</div>
                        <div className="font-mono" style={{ fontSize: '0.74rem', color: 'var(--text-dim)' }}>{s.code}</div>
                        {s.is_low_stock && (
                          <span className="badge badge-overdue" style={{ fontSize: '0.65rem', marginTop: '2px' }}>
                            Low Stock (Reorder &lt; {s.min_stock})
                          </span>
                        )}
                      </td>
                      <td>
                        <span className="badge" style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)' }}>
                          {s.category}
                        </span>
                      </td>
                      <td style={{ color: 'var(--text-dim)' }}>{s.unit}</td>
                      <td>{s.opening}</td>
                      <td style={{ color: 'var(--success)', fontWeight: 600 }}>+{s.purchased}</td>
                      <td style={{ color: 'var(--danger)', fontWeight: 600 }}>−{s.sold}</td>
                      <td style={{ color: '#f87171' }}>−{s.damaged}</td>
                      <td style={{ color: s.adjustments >= 0 ? '#38bdf8' : '#fbbf24' }}>
                        {s.adjustments >= 0 ? `+${s.adjustments}` : s.adjustments}
                      </td>
                      <td style={{ fontWeight: 800, fontSize: '0.95rem', color: s.is_low_stock ? 'var(--danger)' : '#fff' }}>
                        {s.current_stock} {s.unit}
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--success)' }}>
                        {formatMoney(s.stock_value)}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '4px' }}>
                          <button 
                            className="btn btn-sm btn-secondary" 
                            onClick={() => handleOpenAdjustment(s.id)}
                            title="Adjust Stock Qty"
                            style={{ padding: '4px 8px', fontSize: '0.74rem' }}
                          >
                            <Sliders size={12} />
                          </button>
                          <button 
                            className="btn btn-sm btn-secondary" 
                            onClick={() => { setSelectedProductId(s.id); setActiveTab('ledger'); }}
                            title="View Movement Ledger"
                            style={{ padding: '4px 8px', fontSize: '0.74rem' }}
                          >
                            <History size={12} />
                          </button>
                          <button 
                            className="btn btn-sm btn-danger-outline" 
                            onClick={() => handleDeleteStockClick(s)}
                            title="Delete Stone Item"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="11" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                      No inventory records found. Click "Add Stock Item" above to register stone slabs.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Low Stock Report */}
      {activeTab === 'low_stock' && (
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">
              <AlertCircle size={18} style={{ color: 'var(--danger)' }} />
              Items Below Reorder Level (Low Stock Alert)
            </h3>
          </div>
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Product Name</th>
                  <th>Code</th>
                  <th>Category</th>
                  <th>Unit</th>
                  <th>Current Stock</th>
                  <th>Minimum Stock</th>
                  <th>Shortfall / Reorder Needed</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {lowStockData && lowStockData.length > 0 ? (
                  lowStockData.map((ls) => (
                    <tr key={ls.id}>
                      <td style={{ fontWeight: 700, color: '#fff' }}>{ls.name}</td>
                      <td className="font-mono">{ls.code}</td>
                      <td>{ls.category_name}</td>
                      <td>{ls.unit}</td>
                      <td style={{ fontWeight: 800, color: 'var(--danger)' }}>{ls.current_stock}</td>
                      <td>{ls.min_stock}</td>
                      <td style={{ fontWeight: 700, color: '#fbbf24' }}>
                        Need {ls.reorder_needed} {ls.unit}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button 
                          className="btn btn-sm btn-primary" 
                          onClick={() => handleOpenAdjustment(ls.id)}
                          style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                        >
                          + Inward Stock
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="8" style={{ textAlign: 'center', padding: '3rem', color: 'var(--success)' }}>
                      ✓ All stone items have healthy inventory above minimum stock limits!
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Stock Movement Ledger */}
      {activeTab === 'ledger' && (
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">
              <History size={18} style={{ color: '#38bdf8' }} />
              Stock Movement History
            </h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Select Stone:</span>
              <select 
                className="form-select" 
                style={{ width: 'auto' }}
                value={selectedProductId || ''} 
                onChange={(e) => setSelectedProductId(Number(e.target.value))}
              >
                {products && products.map(p => (
                  <option key={p.id} value={p.id}>{p.name} ({p.code})</option>
                ))}
              </select>
            </div>
          </div>

          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Movement Type</th>
                  <th>Quantity Changed</th>
                  <th>Reference Type</th>
                  <th>Remarks / Description</th>
                </tr>
              </thead>
              <tbody>
                {ledgerData && ledgerData.movements && ledgerData.movements.length > 0 ? (
                  ledgerData.movements.map((m) => (
                    <tr key={m.id}>
                      <td>{m.date}</td>
                      <td>
                        <span className={`badge ${m.type === 'purchase' ? 'badge-paid' : m.type === 'sale' ? 'badge-partially_paid' : m.type === 'damage' ? 'badge-overdue' : 'badge-draft'}`}>
                          {m.type}
                        </span>
                      </td>
                      <td style={{ fontWeight: 700, color: m.qty > 0 ? 'var(--success)' : 'var(--danger)' }}>
                        {m.qty > 0 ? `+${m.qty}` : m.qty}
                      </td>
                      <td className="font-mono" style={{ fontSize: '0.78rem' }}>{m.reference_type || '—'} #{m.reference_id || ''}</td>
                      <td style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{m.remarks || '—'}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                      No movement history found for this product.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Stock Item Modal */}
      {addStockModalOpen && (
        <div className="modal-overlay">
          <div className="modal-container" style={{ maxWidth: '520px' }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Plus size={18} color="#38bdf8" />
                <h3>Add New Stock Item</h3>
              </div>
              <button className="modal-close-btn" onClick={() => setAddStockModalOpen(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleSaveNewStock}>
              <div className="modal-body">
                {newStockError && (
                  <div style={{ padding: '0.75rem', background: 'var(--danger-bg)', border: '1px solid var(--danger-border)', color: 'var(--danger)', borderRadius: 'var(--radius-sm)', marginBottom: '1rem', fontSize: '0.82rem' }}>
                    {newStockError}
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label">Stone / Product Name *</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="e.g. Kashmiri White Granite 18mm Slab" 
                    value={newStockName} 
                    onChange={(e) => setNewStockName(e.target.value)} 
                    required 
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Item Code / SKU</label>
                    <input 
                      type="text" 
                      className="form-input font-mono" 
                      placeholder="BIL-GRA-005" 
                      value={newStockCode} 
                      onChange={(e) => setNewStockCode(e.target.value)} 
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Category *</label>
                    <select className="form-select" value={newStockCategory} onChange={(e) => setNewStockCategory(e.target.value)}>
                      <option value="Granite">Granite</option>
                      <option value="Marble">Marble</option>
                      <option value="Tiles">Tiles</option>
                      <option value="Natural Stone">Natural Stone</option>
                      <option value="Adhesives & Chemicals">Adhesives & Chemicals</option>
                    </select>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Measurement Unit *</label>
                    <select className="form-select" value={newStockUnit} onChange={(e) => setNewStockUnit(e.target.value)}>
                      <option value="sqft">Square Feet (sqft)</option>
                      <option value="sqm">Square Meter (sqm)</option>
                      <option value="piece">Piece / Slab (piece)</option>
                      <option value="box">Box / Bag (box)</option>
                      <option value="ton">Metric Ton (ton)</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Initial Stock *</label>
                    <input 
                      type="number" 
                      step="any" 
                      className="form-input" 
                      value={newStockOpening} 
                      onChange={(e) => setNewStockOpening(e.target.value)} 
                      required 
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Purchase Cost (₹)</label>
                    <input 
                      type="number" 
                      step="any" 
                      className="form-input" 
                      placeholder="e.g. 120" 
                      value={newStockPurchasePrice} 
                      onChange={(e) => setNewStockPurchasePrice(e.target.value)} 
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Selling Price (₹)</label>
                    <input 
                      type="number" 
                      step="any" 
                      className="form-input" 
                      placeholder="e.g. 165" 
                      value={newStockSellingPrice} 
                      onChange={(e) => setNewStockSellingPrice(e.target.value)} 
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Minimum Reorder Alert Level</label>
                  <input 
                    type="number" 
                    step="any" 
                    className="form-input" 
                    value={newStockMinStock} 
                    onChange={(e) => setNewStockMinStock(e.target.value)} 
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setAddStockModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={newStockSaving}>
                  {newStockSaving ? 'Saving...' : 'Create Stock Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Manual Stock Adjustment / Inward Modal */}
      {adjModalOpen && (
        <div className="modal-overlay">
          <div className="modal-container" style={{ maxWidth: '480px' }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sliders size={18} color="#38bdf8" />
                <h3>Stock Inward & Physical Adjustment</h3>
              </div>
              <button className="modal-close-btn" onClick={() => setAdjModalOpen(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleSaveAdjustment}>
              <div className="modal-body">
                {adjError && (
                  <div style={{ padding: '0.75rem', background: 'var(--danger-bg)', border: '1px solid var(--danger-border)', color: 'var(--danger)', borderRadius: 'var(--radius-sm)', marginBottom: '1rem', fontSize: '0.82rem' }}>
                    {adjError}
                  </div>
                )}
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                  Record stock inward (+), quarry receipt, or physical count adjustments. An audit movement is permanently registered.
                </p>

                <div className="form-group">
                  <label className="form-label">Stone Product *</label>
                  <select className="form-select" value={adjProductId} onChange={(e) => setAdjProductId(e.target.value)} required>
                    {products && products.map(p => (
                      <option key={p.id} value={p.id}>{p.name} (Current: {p.current_stock} {p.unit})</option>
                    ))}
                  </select>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Adjustment Qty (+ or -) *</label>
                    <input type="number" step="any" className="form-input" placeholder="+50 or -5" value={adjQty} onChange={(e) => setAdjQty(e.target.value)} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Audit Date *</label>
                    <input type="date" className="form-input" value={adjDate} onChange={(e) => setAdjDate(e.target.value)} required />
                  </div>
                </div>

                {/* Quick Presets */}
                <div style={{ display: 'flex', gap: '6px', marginBottom: '1rem' }}>
                  <button type="button" className="btn btn-sm btn-secondary" onClick={() => setAdjQty('10')}>+10</button>
                  <button type="button" className="btn btn-sm btn-secondary" onClick={() => setAdjQty('50')}>+50</button>
                  <button type="button" className="btn btn-sm btn-secondary" onClick={() => setAdjQty('100')}>+100</button>
                  <button type="button" className="btn btn-sm btn-secondary" onClick={() => setAdjQty('-5')}>-5 Shortage</button>
                </div>

                <div className="form-group">
                  <label className="form-label">Reason / Narration *</label>
                  <input type="text" className="form-input" placeholder="e.g. Quarry delivery inward / Physical count difference" value={adjReason} onChange={(e) => setAdjReason(e.target.value)} required />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setAdjModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={adjSaving}>
                  {adjSaving ? 'Applying...' : 'Apply Stock Change'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirm Delete Stock Modal */}
      <ConfirmModal
        isOpen={Boolean(deleteModalStock)}
        title="Delete Stone Item"
        message={deleteModalStock ? ("Are you sure you want to remove " + deleteModalStock.name + " from stock catalog? This will delete the item or mark it inactive if linked to prior sales/purchases.") : ""}
        confirmText="Delete Item"
        isLoading={isDeletingStock}
        onCancel={() => !isDeletingStock && setDeleteModalStock(null)}
        onConfirm={handleConfirmDeleteStock}
        itemDetails={deleteModalStock ? (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span style={{ color: '#94a3b8' }}>Stone:</span>
              <strong style={{ color: '#f8fafc' }}>{deleteModalStock.name}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span style={{ color: '#94a3b8' }}>Current Stock:</span>
              <strong style={{ color: '#38bdf8' }}>{deleteModalStock.current_stock} {deleteModalStock.unit}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span style={{ color: '#94a3b8' }}>Stock Valuation:</span>
              <strong style={{ color: '#34d399' }}>{formatMoney(deleteModalStock.stock_value)}</strong>
            </div>
          </div>
        ) : null}
      />
    </div>
  );
}
