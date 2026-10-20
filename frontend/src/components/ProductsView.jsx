import React, { useState } from 'react';
import { Package, Search, Plus, Edit3, Trash2, X, CheckCircle2 } from 'lucide-react';
import { api } from '../services/api';
import ConfirmModal from './ConfirmModal';
import Loader from './Loader';

export default function ProductsView({ 
  products, 
  currency, 
  onRefresh 
}) {
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [deleteModalProduct, setDeleteModalProduct] = useState(null);
  const [isDeletingProduct, setIsDeletingProduct] = useState(false);

  // Form fields
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [description, setDescription] = useState('');
  const [unitPrice, setUnitPrice] = useState('');
  const [taxRate, setTaxRate] = useState(10);
  const [unit, setUnit] = useState('pcs');
  const [stockQuantity, setStockQuantity] = useState(100);
  const [category, setCategory] = useState('Services');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const formatMoney = (val) => `${currency} ${(Number(val) || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const openAddModal = () => {
    setEditingProduct(null);
    setName('');
    setSku(`PRD-${Math.floor(1000 + Math.random() * 9000)}`);
    setDescription('');
    setUnitPrice('');
    setTaxRate(10);
    setUnit('pcs');
    setStockQuantity(100);
    setCategory('Services');
    setError(null);
    setModalOpen(true);
  };

  const openEditModal = (prod) => {
    setEditingProduct(prod);
    setName(prod.name);
    setSku(prod.sku || '');
    setDescription(prod.description || '');
    setUnitPrice(prod.unit_price);
    setTaxRate(prod.tax_rate);
    setUnit(prod.unit || 'pcs');
    setStockQuantity(prod.stock_quantity);
    setCategory(prod.category || 'Services');
    setError(null);
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Product name is required.');
      return;
    }

    const price = parseFloat(unitPrice);
    if (isNaN(price) || price < 0) {
      setError('Please provide a valid unit price.');
      return;
    }

    setLoading(true);
    const payload = {
      name,
      sku: sku.trim() || undefined,
      description,
      unit_price: price,
      tax_rate: parseFloat(taxRate) || 0,
      unit,
      stock_quantity: parseInt(stockQuantity, 10) || 0,
      category,
    };

    try {
      if (editingProduct) {
        await api.updateProduct(editingProduct.id, payload);
      } else {
        await api.createProduct(payload);
      }
      setModalOpen(false);
      onRefresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (p) => {
    setDeleteModalProduct(p);
  };

  const handleConfirmDeleteProduct = async () => {
    if (!deleteModalProduct) return;
    setIsDeletingProduct(true);
    try {
      await api.deleteProduct(deleteModalProduct.id);
      setDeleteModalProduct(null);
      if (onRefresh) onRefresh();
    } catch (err) {
      alert(err.message || "Failed to delete product");
    } finally {
      setIsDeletingProduct(false);
    }
  };

  const filtered = products.filter(p => {
    const q = search.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      (p.sku && p.sku.toLowerCase().includes(q)) ||
      (p.category && p.category.toLowerCase().includes(q)) ||
      (p.description && p.description.toLowerCase().includes(q))
    );
  });

  return (
    <div>
      {/* Header */}
      <div className="view-header">
        <div className="view-title-group">
          <h2>Products & Services Catalog</h2>
          <p>Inventory pricing, tax schedules, product SKUs, and service items</p>
        </div>
        <div className="header-actions">
          <button className="btn btn-primary" onClick={openAddModal}>
            <Plus size={16} />
            <span>Add Item</span>
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="filter-bar">
        <div className="search-input-wrap" style={{ width: '320px' }}>
          <Search />
          <input 
            type="text" 
            className="search-input" 
            placeholder="Search items, SKU, or category..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <span style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>
          Showing {filtered.length} catalog items
        </span>
      </div>

      {/* Catalog Table */}
      <div className="card">
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Item / SKU</th>
                <th>Category</th>
                <th>Unit Price</th>
                <th>Default Tax %</th>
                <th>Unit Type</th>
                <th>Stock / Availability</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered && filtered.length > 0 ? (
                filtered.map((prod) => (
                  <tr key={prod.id}>
                    <td>
                      <div style={{ fontWeight: 700, color: '#fff' }}>{prod.name}</div>
                      <div className="font-mono" style={{ fontSize: '0.74rem', color: 'var(--text-dim)', marginTop: '2px' }}>
                        {prod.sku || 'No SKU'}
                      </div>
                      {prod.description && (
                        <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '2px', maxWidth: '360px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {prod.description}
                        </div>
                      )}
                    </td>
                    <td>
                      <span className="badge" style={{ background: 'rgba(99, 102, 241, 0.1)', color: 'var(--primary)' }}>
                        {prod.category || 'General'}
                      </span>
                    </td>
                    <td style={{ fontWeight: 700, color: '#fff' }}>
                      {formatMoney(prod.unit_price)}
                    </td>
                    <td>
                      <span className="badge" style={{ background: 'rgba(255, 255, 255, 0.05)', color: 'var(--text-muted)' }}>
                        {prod.tax_rate}%
                      </span>
                    </td>
                    <td style={{ textTransform: 'lowercase', color: 'var(--text-muted)' }}>
                      per {prod.unit || 'pcs'}
                    </td>
                    <td>
                      <span style={{ 
                        fontWeight: 600, 
                        color: prod.stock_quantity > 10 ? 'var(--success)' : '#fbbf24' 
                      }}>
                        {prod.stock_quantity} in stock
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '0.35rem' }}>
                        <button 
                          className="btn btn-sm btn-secondary" 
                          onClick={() => openEditModal(prod)}
                          title="Edit Item"
                        >
                          <Edit3 size={14} />
                        </button>
                        <button 
                          className="btn btn-sm btn-danger-outline" 
                          onClick={() => handleDeleteClick(prod)}
                          title="Delete Item"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                    No items found. Click "Add Item" to add products or services to your catalog.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Product Modal */}
      {modalOpen && (
        <div className="modal-overlay">
          <div className="modal-container" style={{ maxWidth: '580px' }}>
            <div className="modal-header">
              <h3>{editingProduct ? 'Edit Catalog Item' : 'Add Catalog Item'}</h3>
              <button className="modal-close-btn" onClick={() => setModalOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                {error && (
                  <div style={{ padding: '0.75rem', background: 'var(--danger-bg)', border: '1px solid var(--danger-border)', color: 'var(--danger)', borderRadius: 'var(--radius-md)', marginBottom: '1rem', fontSize: '0.84rem' }}>
                    {error}
                  </div>
                )}

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Item / Service Name *</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="e.g. Cloud Architecture Consulting"
                      value={name} 
                      onChange={(e) => setName(e.target.value)}
                      required 
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">SKU / Code</label>
                    <input 
                      type="text" 
                      className="form-input font-mono" 
                      placeholder="e.g. SRV-CLOUD-01"
                      value={sku} 
                      onChange={(e) => setSku(e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Description</label>
                  <textarea 
                    className="form-textarea" 
                    rows="2"
                    placeholder="Details that will populate on line item descriptions..."
                    value={description} 
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Unit Price ({currency}) *</label>
                    <input 
                      type="number" 
                      step="0.01" 
                      min="0"
                      className="form-input" 
                      placeholder="0.00"
                      value={unitPrice} 
                      onChange={(e) => setUnitPrice(e.target.value)}
                      required 
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Default Tax Rate (%)</label>
                    <input 
                      type="number" 
                      step="0.1" 
                      min="0"
                      className="form-input" 
                      value={taxRate} 
                      onChange={(e) => setTaxRate(e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Unit (e.g. pcs, hours, month, sprint)</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      value={unit} 
                      onChange={(e) => setUnit(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Category</label>
                    <select 
                      className="form-select"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                    >
                      <option value="Services">Services</option>
                      <option value="Consulting">Consulting</option>
                      <option value="Development">Development</option>
                      <option value="Design">Design</option>
                      <option value="Hosting">Hosting</option>
                      <option value="Support">Support</option>
                      <option value="Security">Security</option>
                      <option value="Products">Products / Hardware</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  <CheckCircle2 size={16} />
                  <span>{loading ? 'Saving...' : editingProduct ? 'Update Item' : 'Create Item'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirm Delete Product Modal */}
      <ConfirmModal
        isOpen={Boolean(deleteModalProduct)}
        title="Delete Product"
        message={deleteModalProduct ? ("Are you sure you want to delete product \"" + deleteModalProduct.name + "\"? This will remove or mark it inactive in the stone inventory catalog.") : ""}
        confirmText="Delete Product"
        isLoading={isDeletingProduct}
        onCancel={() => !isDeletingProduct && setDeleteModalProduct(null)}
        onConfirm={handleConfirmDeleteProduct}
        itemDetails={deleteModalProduct ? (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
              <span style={{ color: "#94a3b8" }}>Item Name:</span>
              <strong style={{ color: "#f8fafc" }}>{deleteModalProduct.name}</strong>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
              <span style={{ color: "#94a3b8" }}>Current Stock:</span>
              <strong style={{ color: "#38bdf8" }}>{deleteModalProduct.current_stock} {deleteModalProduct.unit}</strong>
            </div>
          </div>
        ) : null}
      />
    </div>
  );
}
