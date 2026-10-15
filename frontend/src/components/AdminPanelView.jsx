import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Settings, 
  Users, 
  Database, 
  BookOpen, 
  Plus, 
  Trash2, 
  Edit3, 
  Download, 
  CheckCircle, 
  AlertCircle, 
  HelpCircle,
  Layers,
  FileText,
  Save,
  RefreshCw,
  Sliders
} from 'lucide-react';
import { api } from '../services/api';
import BackupMigrationView from './BackupMigrationView';
import Loader from './Loader';

export default function AdminPanelView({ currentUser, currency, onRefresh }) {
  const [activeSubTab, setActiveSubTab] = useState('client-fields');
  const [fields, setFields] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Field Modal State
  const [showFieldModal, setShowFieldModal] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add' or 'edit'
  const [selectedField, setSelectedField] = useState(null);
  const [formData, setFormData] = useState({
    field_key: '',
    field_label: '',
    field_type: 'text',
    options: '',
    placeholder: '',
    default_value: '',
    is_required: false,
    is_active: true,
    sort_order: 1
  });

  const isAdmin = currentUser?.role?.toLowerCase().includes('admin');

  useEffect(() => {
    if (isAdmin) {
      loadFields();
    }
  }, [isAdmin]);

  const loadFields = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getClientFields();
      setFields(data || []);
    } catch (err) {
      setError(err.message || 'Failed to load dynamic client fields');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAddModal = () => {
    setModalMode('add');
    setSelectedField(null);
    setFormData({
      field_key: '',
      field_label: '',
      field_type: 'text',
      options: '',
      placeholder: '',
      default_value: '',
      is_required: false,
      is_active: true,
      sort_order: fields.length + 1
    });
    setShowFieldModal(true);
  };

  const handleOpenEditModal = (field) => {
    setModalMode('edit');
    setSelectedField(field);
    setFormData({
      field_key: field.field_key,
      field_label: field.field_label,
      field_type: field.field_type,
      options: field.options || '',
      placeholder: field.placeholder || '',
      default_value: field.default_value || '',
      is_required: Boolean(field.is_required),
      is_active: Boolean(field.is_active),
      sort_order: field.sort_order || 1
    });
    setShowFieldModal(true);
  };

  const handleSaveField = async (e) => {
    e.preventDefault();
    if (!formData.field_label.trim()) {
      alert('Field Label is required');
      return;
    }

    setSaving(true);
    try {
      if (modalMode === 'add') {
        const key = formData.field_key.trim() || formData.field_label.toLowerCase().replace(/[^a-z0-9]/g, '_');
        await api.createClientField({
          ...formData,
          field_key: key
        });
        setSuccess(`Dynamic field "${formData.field_label}" created successfully!`);
      } else {
        await api.updateClientField(selectedField.id, formData);
        setSuccess(`Dynamic field "${formData.field_label}" updated successfully!`);
      }
      setShowFieldModal(false);
      await loadFields();
    } catch (err) {
      alert(err.message || 'Failed to save dynamic field');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteField = async (id, label) => {
    if (!window.confirm(`Are you sure you want to remove dynamic field "${label}"?`)) return;
    try {
      await api.deleteClientField(id);
      setSuccess(`Field "${label}" removed.`);
      await loadFields();
    } catch (err) {
      alert(err.message || 'Failed to delete dynamic field');
    }
  };

  if (!isAdmin) {
    return (
      <div className="section-container" style={{ padding: '60px 20px', textAlign: 'center' }}>
        <div style={{ maxWidth: '480px', margin: '0 auto', background: '#fff', padding: '36px', borderRadius: '16px', boxShadow: '0 10px 25px rgba(0,0,0,0.06)' }}>
          <AlertCircle size={48} color="#ef4444" style={{ marginBottom: '16px' }} />
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#1e293b', marginBottom: '8px' }}>Admin Access Required</h2>
          <p style={{ color: '#64748b', fontSize: '0.92rem', lineHeight: 1.5 }}>
            This module contains confidential administration settings, dynamic field configuration, and database controls. 
            Please sign in with an Administrator account to continue.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="section-container">
      {/* Top Banner */}
      <div className="page-header-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ 
              background: 'linear-gradient(135deg, #0284c7, #0369a1)', 
              color: '#fff', 
              padding: '6px 10px', 
              borderRadius: '8px', 
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.8rem',
              fontWeight: 700 
            }}>
              <ShieldCheck size={16} /> Admin Console
            </span>
            <h1 style={{ fontSize: '1.6rem', fontWeight: 800, margin: 0, color: '#0f172a' }}>
              Billora Administration & Configuration
            </h1>
          </div>
          <p style={{ color: '#64748b', fontSize: '0.9rem', marginTop: '4px' }}>
            Configure dynamic client attributes, access interactive stock guides, and manage automated database backups.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <a 
            href="/api/admin/documentation/stock-guide-pdf" 
            target="_blank" 
            rel="noreferrer"
            className="btn btn-secondary btn-sm"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', textDecoration: 'none' }}
          >
            <Download size={14} />
            <span>Stock Guide (PDF)</span>
          </a>
        </div>
      </div>

      {/* Admin Nav Tabs */}
      <div style={{ 
        display: 'flex', 
        gap: '8px', 
        borderBottom: '2px solid #e2e8f0', 
        marginBottom: '24px',
        paddingBottom: '2px'
      }}>
        <button
          className={`btn btn-sm ${activeSubTab === 'client-fields' ? 'btn-primary' : 'btn-ghost'}`}
          onClick={() => setActiveSubTab('client-fields')}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', borderRadius: '8px 8px 0 0', padding: '8px 16px' }}
        >
          <Sliders size={16} />
          <span>Dynamic Client Fields</span>
          <span style={{ 
            background: activeSubTab === 'client-fields' ? 'rgba(255,255,255,0.25)' : '#e2e8f0', 
            padding: '2px 7px', 
            borderRadius: '12px', 
            fontSize: '0.72rem',
            fontWeight: 700 
          }}>
            {fields.length}
          </span>
        </button>

        <button
          className={`btn btn-sm ${activeSubTab === 'stock-guide' ? 'btn-primary' : 'btn-ghost'}`}
          onClick={() => setActiveSubTab('stock-guide')}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', borderRadius: '8px 8px 0 0', padding: '8px 16px' }}
        >
          <BookOpen size={16} />
          <span>Client Stock Manual</span>
        </button>

        <button
          className={`btn btn-sm ${activeSubTab === 'backup-migration' ? 'btn-primary' : 'btn-ghost'}`}
          onClick={() => setActiveSubTab('backup-migration')}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', borderRadius: '8px 8px 0 0', padding: '8px 16px' }}
        >
          <Database size={16} />
          <span>Backup & Migration Engine</span>
        </button>
      </div>

      {/* Notifications */}
      {success && (
        <div style={{
          background: '#f0fdf4',
          border: '1px solid #bbf7d0',
          color: '#15803d',
          padding: '12px 16px',
          borderRadius: '8px',
          marginBottom: '18px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckCircle size={18} />
            <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>{success}</span>
          </div>
          <button onClick={() => setSuccess(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#15803d', fontWeight: 700 }}>×</button>
        </div>
      )}

      {/* TAB 1: DYNAMIC CLIENT FIELDS */}
      {activeSubTab === 'client-fields' && (
        <div className="card-box" style={{ background: '#fff', borderRadius: '12px', padding: '24px', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: '#1e293b' }}>
                Configured Dynamic Client Fields
              </h3>
              <p style={{ margin: '4px 0 0 0', color: '#64748b', fontSize: '0.85rem' }}>
                Dynamic fields appear automatically in the Customer/Client registration and invoice forms.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button className="btn btn-secondary btn-sm" onClick={loadFields} disabled={loading}>
                <RefreshCw size={14} className={loading ? 'spin-icon' : ''} />
                <span>Refresh</span>
              </button>
              <button className="btn btn-primary btn-sm" onClick={handleOpenAddModal}>
                <Plus size={14} />
                <span>+ Add Dynamic Field</span>
              </button>
            </div>
          </div>

          {loading ? (
            <Loader message="Loading dynamic client attributes..." />
          ) : fields.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
              <Sliders size={36} style={{ marginBottom: '10px', opacity: 0.5 }} />
              <p>No dynamic client fields defined yet. Click '+ Add Dynamic Field' to create one.</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0', textAlign: 'left' }}>
                    <th style={{ padding: '10px 14px', fontSize: '0.8rem', color: '#475569' }}>Order</th>
                    <th style={{ padding: '10px 14px', fontSize: '0.8rem', color: '#475569' }}>Field Label</th>
                    <th style={{ padding: '10px 14px', fontSize: '0.8rem', color: '#475569' }}>Key (Slug)</th>
                    <th style={{ padding: '10px 14px', fontSize: '0.8rem', color: '#475569' }}>Type</th>
                    <th style={{ padding: '10px 14px', fontSize: '0.8rem', color: '#475569' }}>Options / Placeholder</th>
                    <th style={{ padding: '10px 14px', fontSize: '0.8rem', color: '#475569' }}>Required</th>
                    <th style={{ padding: '10px 14px', fontSize: '0.8rem', color: '#475569' }}>Status</th>
                    <th style={{ padding: '10px 14px', fontSize: '0.8rem', color: '#475569', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {fields.map((f, idx) => (
                    <tr key={f.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '12px 14px', fontSize: '0.85rem', color: '#64748b' }}>{f.sort_order || idx + 1}</td>
                      <td style={{ padding: '12px 14px', fontSize: '0.9rem', fontWeight: 600, color: '#0f172a' }}>
                        {f.field_label}
                      </td>
                      <td style={{ padding: '12px 14px', fontSize: '0.82rem', fontFamily: 'monospace', color: '#0284c7' }}>
                        {f.field_key}
                      </td>
                      <td style={{ padding: '12px 14px', fontSize: '0.82rem' }}>
                        <span style={{ 
                          background: '#f1f5f9', 
                          padding: '3px 8px', 
                          borderRadius: '6px', 
                          fontWeight: 600,
                          color: '#334155'
                        }}>
                          {f.field_type}
                        </span>
                      </td>
                      <td style={{ padding: '12px 14px', fontSize: '0.82rem', color: '#64748b', maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {f.options ? `Opts: ${f.options}` : (f.placeholder || '—')}
                      </td>
                      <td style={{ padding: '12px 14px', fontSize: '0.82rem' }}>
                        {f.is_required ? (
                          <span style={{ color: '#ef4444', fontWeight: 600 }}>Yes</span>
                        ) : (
                          <span style={{ color: '#94a3b8' }}>Optional</span>
                        )}
                      </td>
                      <td style={{ padding: '12px 14px', fontSize: '0.82rem' }}>
                        {f.is_active ? (
                          <span style={{ color: '#16a34a', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <span className="live-dot" style={{ width: '6px', height: '6px' }}></span> Active
                          </span>
                        ) : (
                          <span style={{ color: '#94a3b8' }}>Disabled</span>
                        )}
                      </td>
                      <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '6px' }}>
                          <button 
                            className="btn btn-ghost btn-sm"
                            onClick={() => handleOpenEditModal(f)}
                            title="Edit dynamic field"
                            style={{ padding: '4px 8px' }}
                          >
                            <Edit3 size={14} color="#0284c7" />
                          </button>
                          <button 
                            className="btn btn-ghost btn-sm"
                            onClick={() => handleDeleteField(f.id, f.field_label)}
                            title="Delete dynamic field"
                            style={{ padding: '4px 8px' }}
                          >
                            <Trash2 size={14} color="#ef4444" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: CLIENT STOCK & OPERATIONS MANUAL */}
      {activeSubTab === 'stock-guide' && (
        <div className="card-box" style={{ background: '#fff', borderRadius: '12px', padding: '28px', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #e2e8f0', paddingBottom: '16px', marginBottom: '20px' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>
                Billora Client Operations Manual: Stock & Inventory Management
              </h3>
              <p style={{ margin: '4px 0 0 0', color: '#64748b', fontSize: '0.88rem' }}>
                Step-by-step instructions for client personnel on adding Purchasers, General Inventory, and Natural Stone Items.
              </p>
            </div>
            <a 
              href="/api/admin/documentation/stock-guide-pdf" 
              target="_blank" 
              rel="noreferrer" 
              className="btn btn-primary"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}
            >
              <Download size={16} />
              <span>Download Official Manual (PDF)</span>
            </a>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px', marginBottom: '28px' }}>
            {/* Guide Card 1: Adding Purchasers */}
            <div style={{ border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px', background: '#f8fafc' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <span style={{ background: '#0284c7', color: '#fff', width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.85rem' }}>1</span>
                <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#0f172a' }}>Adding Purchasers (Suppliers)</h4>
              </div>
              <p style={{ fontSize: '0.84rem', color: '#475569', lineHeight: 1.5, marginBottom: '12px' }}>
                Purchasers provide raw granite blocks and polished slabs. Accurate GSTIN entry guarantees ITC tax reconciliation.
              </p>
              <ol style={{ fontSize: '0.82rem', color: '#334155', paddingLeft: '18px', margin: 0, lineHeight: 1.6 }}>
                <li>Go to <b>Contacts</b> tab -&gt; click <b>'+ Add Contact'</b></li>
                <li>Set <b>Type</b> to <b>'Supplier'</b></li>
                <li>Enter Company Name (e.g. <i>Rajasthan Granites Ltd</i>)</li>
                <li>Provide mobile number, email, and quarry address</li>
                <li>Input 15-digit <b>GSTIN</b> (e.g. <code>08AABCR1234F1Z5</code>)</li>
                <li>Set opening balance with <b>'To Pay'</b> if prior dues exist</li>
                <li>Click <b>'Save Contact'</b></li>
              </ol>
            </div>

            {/* Guide Card 2: Adding General Items */}
            <div style={{ border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px', background: '#f8fafc' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <span style={{ background: '#0284c7', color: '#fff', width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.85rem' }}>2</span>
                <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#0f172a' }}>Adding General Inventory Items</h4>
              </div>
              <p style={{ fontSize: '0.84rem', color: '#475569', lineHeight: 1.5, marginBottom: '12px' }}>
                For non-stone consumables such as epoxy kits, glues, sealants, cutting blades, and hardware items.
              </p>
              <ol style={{ fontSize: '0.82rem', color: '#334155', paddingLeft: '18px', margin: 0, lineHeight: 1.6 }}>
                <li>Go to <b>Products</b> tab -&gt; click <b>'+ Add Product'</b></li>
                <li>Enter Product Name (e.g. <i>Tenax Epoxy Adhesive 5kg</i>)</li>
                <li>Set <b>Category</b> to <i>Adhesives & Chemicals</i></li>
                <li>Select <b>Unit</b>: <code>box</code>, <code>piece</code>, or <code>kg</code></li>
                <li>Set <b>HSN Code: 3506</b></li>
                <li>Enter Purchase Cost and Selling Price</li>
                <li>Set GST Rate to <b>18.0%</b></li>
                <li>Enter Opening Stock count and Save</li>
              </ol>
            </div>

            {/* Guide Card 3: Adding Stone Items */}
            <div style={{ border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px', background: '#f8fafc' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <span style={{ background: '#0284c7', color: '#fff', width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.85rem' }}>3</span>
                <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#0f172a' }}>Adding Stone Items (Granite & Marble)</h4>
              </div>
              <p style={{ fontSize: '0.84rem', color: '#475569', lineHeight: 1.5, marginBottom: '12px' }}>
                Natural stone items are measured strictly in <b>Square Feet (Sq.Ft)</b> and billed under <b>HSN 6802</b>.
              </p>
              <ol style={{ fontSize: '0.82rem', color: '#334155', paddingLeft: '18px', margin: 0, lineHeight: 1.6 }}>
                <li>Go to <b>Products</b> -&gt; click <b>'+ Add Product'</b></li>
                <li>Name: e.g. <i>Black Galaxy Granite Slab</i></li>
                <li>Category: select <b>Granite</b> or <b>Marble</b></li>
                <li><b>Unit: 'sqft'</b> (Crucial for stone rate calculation)</li>
                <li>Size/Thickness: e.g. <i>18mm Gangsaw Polished Slabs</i></li>
                <li><b>HSN Code: 6802</b></li>
                <li>Rate per Sq.Ft (e.g. ₹175/sqft)</li>
                <li>Enter Opening Stock in <b>Total Square Feet</b></li>
              </ol>
            </div>
          </div>

          {/* Slab Measurement Formula Banner */}
          <div style={{ background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: '10px', padding: '16px 20px', display: 'flex', gap: '16px', alignItems: 'center' }}>
            <Layers size={32} color="#0284c7" />
            <div>
              <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0369a1', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Stone Yard Measurement Standard Formula
              </span>
              <p style={{ margin: '4px 0 0 0', fontSize: '0.88rem', color: '#0f172a', fontFamily: 'monospace' }}>
                Sq.Ft per Slab = (Length in inches × Height in inches) ÷ 144 | Total Billable Sq.Ft = Sq.Ft per Slab × Slabs Count
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: BACKUP & DATA MIGRATION ENGINE */}
      {activeSubTab === 'backup-migration' && (
        <div>
          <BackupMigrationView currency={currency} onRefresh={onRefresh} />
        </div>
      )}

      {/* MODAL: ADD / EDIT DYNAMIC FIELD */}
      {showFieldModal && (
        <div className="modal-backdrop" style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(4px)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <div className="modal-card" style={{
            background: '#fff',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '520px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
            overflow: 'hidden'
          }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#0f172a' }}>
                {modalMode === 'add' ? 'Add Dynamic Client Field' : 'Edit Dynamic Client Field'}
              </h3>
              <button 
                type="button" 
                onClick={() => setShowFieldModal(false)}
                style={{ background: 'none', border: 'none', fontSize: '1.4rem', color: '#64748b', cursor: 'pointer' }}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSaveField} style={{ padding: '24px' }}>
              <div className="form-group" style={{ marginBottom: '14px' }}>
                <label className="form-label" style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                  Field Label *
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Site Delivery Route / Landmark"
                  value={formData.field_label}
                  onChange={(e) => setFormData({ ...formData, field_label: e.target.value })}
                  required
                />
              </div>

              {modalMode === 'add' && (
                <div className="form-group" style={{ marginBottom: '14px' }}>
                  <label className="form-label" style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                    Field Key (Slug)
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. site_route (auto-generated if blank)"
                    value={formData.field_key}
                    onChange={(e) => setFormData({ ...formData, field_key: e.target.value })}
                  />
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                <div className="form-group">
                  <label className="form-label" style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                    Field Type
                  </label>
                  <select
                    className="form-input"
                    value={formData.field_type}
                    onChange={(e) => setFormData({ ...formData, field_type: e.target.value })}
                  >
                    <option value="text">Text Input</option>
                    <option value="number">Numeric</option>
                    <option value="select">Dropdown Select</option>
                    <option value="date">Date Picker</option>
                    <option value="boolean">Yes / No Toggle</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                    Display Order
                  </label>
                  <input
                    type="number"
                    className="form-input"
                    value={formData.sort_order}
                    onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 1 })}
                    min="1"
                  />
                </div>
              </div>

              {formData.field_type === 'select' && (
                <div className="form-group" style={{ marginBottom: '14px' }}>
                  <label className="form-label" style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                    Dropdown Options (comma-separated)
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Premium Galaxy,Italian Marble,Standard Granite"
                    value={formData.options}
                    onChange={(e) => setFormData({ ...formData, options: e.target.value })}
                  />
                </div>
              )}

              <div className="form-group" style={{ marginBottom: '14px' }}>
                <label className="form-label" style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                  Placeholder Text
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Near St. Mary Church, Main Road"
                  value={formData.placeholder}
                  onChange={(e) => setFormData({ ...formData, placeholder: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.88rem', color: '#334155' }}>
                  <input
                    type="checkbox"
                    checked={formData.is_required}
                    onChange={(e) => setFormData({ ...formData, is_required: e.target.checked })}
                  />
                  <span>Mandatory / Required Field</span>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.88rem', color: '#334155' }}>
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  />
                  <span>Active in Client Forms</span>
                </label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => setShowFieldModal(false)}
                  disabled={saving}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  disabled={saving}
                >
                  {saving ? 'Saving Field...' : (modalMode === 'add' ? 'Create Field' : 'Update Field')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
