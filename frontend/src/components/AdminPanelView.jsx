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
  Layers, 
  FileText, 
  Save, 
  RefreshCw, 
  Sliders,
  Crown,
  KeyRound,
  Building2,
  Mail,
  Phone,
  MapPin,
  CreditCard,
  UserCheck,
  UserX,
  Lock
} from 'lucide-react';
import { api, getApiUrl } from '../services/api';
import BackupMigrationView from './BackupMigrationView';
import Loader from './Loader';
import ConfirmModal from './ConfirmModal';

export default function AdminPanelView({ currentUser, currency, onRefresh }) {
  const isSudo = currentUser?.role?.toLowerCase() === 'sudo';
  const isAdmin = isSudo || currentUser?.role?.toLowerCase().includes('admin');

  const [activeSubTab, setActiveSubTab] = useState(isSudo ? 'users-section' : 'client-fields');
  
  // Loading & message states
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // 1. Dynamic Client Fields State
  const [fields, setFields] = useState([]);
  const [deleteModalAdmin, setDeleteModalAdmin] = useState(null);
  const [isDeletingAdmin, setIsDeletingAdmin] = useState(false);
  const [showFieldModal, setShowFieldModal] = useState(false);
  const [fieldModalMode, setFieldModalMode] = useState('add');
  const [selectedField, setSelectedField] = useState(null);
  const [fieldFormData, setFieldFormData] = useState({
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

  // 2. Users & Roles Management State
  const [usersList, setUsersList] = useState([]);
  const [showUserModal, setShowUserModal] = useState(false);
  const [userModalMode, setUserModalMode] = useState('add'); // 'add' or 'edit'
  const [selectedUser, setSelectedUser] = useState(null);
  const [userFormData, setUserFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'sales',
    status: 'Active'
  });

  // 3. Client & Site Details (Company Settings) State
  const [companySettings, setCompanySettings] = useState({
    company_name: '',
    business_type: '',
    tagline: '',
    phone: '',
    email: '',
    address: '',
    gstin: '',
    invoice_prefix: 'BIL26-27 ',
    purchase_prefix: 'PUR-BIL-',
    currency_symbol: '₹',
    default_tax_rate: 18.0,
    payment_terms: 'Net 30 Days'
  });

  useEffect(() => {
    if (isAdmin) {
      loadFields();
      loadUsers();
      loadCompanySettings();
    }
  }, [isAdmin]);

  const loadFields = async () => {
    try {
      const data = await api.getClientFields();
      setFields(data || []);
    } catch (err) {
      console.warn('Error loading dynamic fields:', err);
    }
  };

  const loadUsers = async () => {
    try {
      const data = await api.getUsers();
      setUsersList(data || []);
    } catch (err) {
      console.warn('Error loading users:', err);
    }
  };

  const loadCompanySettings = async () => {
    try {
      const data = await api.getCompanySettings();
      if (data) {
        setCompanySettings({
          company_name: data.company_name || '',
          business_type: data.business_type || '',
          tagline: data.tagline || '',
          phone: data.phone || '',
          email: data.email || '',
          address: data.address || '',
          gstin: data.gstin || '',
          invoice_prefix: data.invoice_prefix || 'BIL26-27 ',
          purchase_prefix: data.purchase_prefix || 'PUR-BIL-',
          currency_symbol: data.currency_symbol || '₹',
          default_tax_rate: data.default_tax_rate !== undefined ? data.default_tax_rate : 18.0,
          payment_terms: data.payment_terms || 'Net 30 Days'
        });
      }
    } catch (err) {
      console.warn('Error loading company settings:', err);
    }
  };

  // --- CLIENT FIELDS HANDLERS ---
  const handleOpenAddFieldModal = () => {
    setFieldModalMode('add');
    setSelectedField(null);
    setFieldFormData({
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

  const handleOpenEditFieldModal = (f) => {
    setFieldModalMode('edit');
    setSelectedField(f);
    setFieldFormData({
      field_key: f.field_key,
      field_label: f.field_label,
      field_type: f.field_type,
      options: f.options || '',
      placeholder: f.placeholder || '',
      default_value: f.default_value || '',
      is_required: Boolean(f.is_required),
      is_active: Boolean(f.is_active),
      sort_order: f.sort_order || 1
    });
    setShowFieldModal(true);
  };

  const handleSaveField = async (e) => {
    e.preventDefault();
    if (!fieldFormData.field_label.trim()) {
      alert('Field Label is required');
      return;
    }
    setSaving(true);
    try {
      if (fieldModalMode === 'add') {
        const key = fieldFormData.field_key.trim() || fieldFormData.field_label.toLowerCase().replace(/[^a-z0-9]/g, '_');
        await api.createClientField({ ...fieldFormData, field_key: key });
        setSuccess(`Dynamic field "${fieldFormData.field_label}" created successfully!`);
      } else {
        await api.updateClientField(selectedField.id, fieldFormData);
        setSuccess(`Dynamic field "${fieldFormData.field_label}" updated successfully!`);
      }
      setShowFieldModal(false);
      await loadFields();
    } catch (err) {
      alert(err.message || 'Failed to save dynamic field');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteField = (id, label) => {
    setDeleteModalAdmin({
      type: 'field',
      id,
      title: 'Delete Dynamic Client Field',
      message: 'Are you sure you want to delete dynamic field "' + label + '"? Client documents will no longer display this field.',
      itemDetails: <div><span style={{ color: "#94a3b8" }}>Field: </span><strong style={{ color: "#f8fafc" }}>{label}</strong></div>
    });
  };

  // --- USER & ROLES HANDLERS ---
  const handleOpenAddUserModal = () => {
    setUserModalMode('add');
    setSelectedUser(null);
    setUserFormData({
      name: '',
      email: '',
      password: '',
      role: 'sales',
      status: 'Active'
    });
    setShowUserModal(true);
  };

  const handleOpenEditUserModal = (u) => {
    setUserModalMode('edit');
    setSelectedUser(u);
    setUserFormData({
      name: u.name,
      email: u.email,
      password: '', // leave empty unless changing
      role: u.role,
      status: u.status || 'Active'
    });
    setShowUserModal(true);
  };

  const handleSaveUser = async (e) => {
    e.preventDefault();
    if (!userFormData.name.trim() || !userFormData.email.trim()) {
      alert('Name and Email / Username are required');
      return;
    }

    if (userModalMode === 'add' && !userFormData.password.trim()) {
      alert('Password is required when creating a new user');
      return;
    }

    setSaving(true);
    try {
      if (userModalMode === 'add') {
        await api.createUser(userFormData);
        setSuccess(`User "${userFormData.name}" with role "${userFormData.role}" created successfully!`);
      } else {
        const payload = {
          name: userFormData.name,
          email: userFormData.email,
          role: userFormData.role,
          status: userFormData.status
        };
        if (userFormData.password.trim()) {
          payload.password = userFormData.password.trim();
        }
        await api.updateUser(selectedUser.id, payload);
        setSuccess(`User "${userFormData.name}" updated with role "${userFormData.role}"!`);
      }
      setShowUserModal(false);
      await loadUsers();
    } catch (err) {
      alert(err.message || 'Failed to save user');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteUser = (id, name, role) => {
    if (role === 'sudo' || id === 5) {
      alert('Security Protection: The root Sudo user cannot be deleted.');
      return;
    }
    setDeleteModalAdmin({
      type: 'user',
      id,
      name,
      title: 'Delete Staff User',
      message: 'Are you sure you want to delete staff account "' + name + '" (' + role + ')? This user will lose access immediately.',
      itemDetails: <div><span style={{ color: "#94a3b8" }}>User: </span><strong style={{ color: "#f8fafc" }}>{name}</strong> • <span style={{ color: "#38bdf8" }}>{role}</span></div>
    });
  };

  const handleConfirmAdminDelete = async () => {
    if (!deleteModalAdmin) return;
    setIsDeletingAdmin(true);
    try {
      if (deleteModalAdmin.type === 'field') {
        await api.deleteClientField(deleteModalAdmin.id);
        setSuccess('Dynamic field deleted successfully.');
        await loadFields();
      } else if (deleteModalAdmin.type === 'user') {
        await api.deleteUser(deleteModalAdmin.id);
        setSuccess('User deleted successfully.');
        await loadUsers();
      }
      setDeleteModalAdmin(null);
    } catch (err) {
      alert(err.message || 'Deletion failed');
    } finally {
      setIsDeletingAdmin(false);
    }
  };

  // --- COMPANY SETTINGS HANDLER ---
  const handleSaveCompanySettings = async (e) => {
    e.preventDefault();
    if (!companySettings.company_name.trim()) {
      alert('Company / Client Name is required.');
      return;
    }

    setSaving(true);
    try {
      await api.updateCompanySettings(companySettings);
      setSuccess('Client Name & Company Site Details updated successfully!');
      if (onRefresh) onRefresh();
    } catch (err) {
      alert(err.message || 'Failed to update company settings');
    } finally {
      setSaving(false);
    }
  };

  const getRoleBadge = (role) => {
    const r = (role || '').toLowerCase();
    if (r === 'sudo') {
      return (
        <span style={{ 
          background: 'linear-gradient(135deg, #7c3aed 0%, #4c1d95 100%)', 
          color: '#fdf4ff', 
          padding: '4px 10px', 
          borderRadius: '12px', 
          fontSize: '0.74rem', 
          fontWeight: 800,
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          boxShadow: '0 0 10px rgba(124, 58, 237, 0.4)'
        }}>
          <Crown size={12} /> SUDO ROOT
        </span>
      );
    }
    if (r === 'admin') {
      return (
        <span style={{ 
          background: '#0284c7', 
          color: '#ffffff', 
          padding: '4px 10px', 
          borderRadius: '12px', 
          fontSize: '0.74rem', 
          fontWeight: 700 
        }}>
          ADMIN
        </span>
      );
    }
    if (r === 'accountant') {
      return (
        <span style={{ 
          background: '#059669', 
          color: '#ffffff', 
          padding: '4px 10px', 
          borderRadius: '12px', 
          fontSize: '0.74rem', 
          fontWeight: 700 
        }}>
          ACCOUNTANT
        </span>
      );
    }
    if (r === 'sales') {
      return (
        <span style={{ 
          background: '#0891b2', 
          color: '#ffffff', 
          padding: '4px 10px', 
          borderRadius: '12px', 
          fontSize: '0.74rem', 
          fontWeight: 700 
        }}>
          SALES COUNTER
        </span>
      );
    }
    if (r === 'store') {
      return (
        <span style={{ 
          background: '#d97706', 
          color: '#ffffff', 
          padding: '4px 10px', 
          borderRadius: '12px', 
          fontSize: '0.74rem', 
          fontWeight: 700 
        }}>
          STORE YARD
        </span>
      );
    }
    return (
      <span style={{ background: '#64748b', color: '#ffffff', padding: '3px 8px', borderRadius: '12px', fontSize: '0.72rem' }}>
        {role}
      </span>
    );
  };

  if (!isAdmin) {
    return (
      <div className="section-container" style={{ padding: '60px 20px', textAlign: 'center' }}>
        <div style={{ maxWidth: '480px', margin: '0 auto', background: '#fff', padding: '36px', borderRadius: '16px', boxShadow: '0 10px 25px rgba(0,0,0,0.06)' }}>
          <AlertCircle size={48} color="#ef4444" style={{ marginBottom: '16px' }} />
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#1e293b', marginBottom: '8px' }}>Admin / Sudo Access Required</h2>
          <p style={{ color: '#64748b', fontSize: '0.92rem', lineHeight: 1.5 }}>
            This console is restricted to Administrator and Sudo root users. Please sign in with appropriate authority.
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
              background: isSudo ? 'linear-gradient(135deg, #7c3aed, #4c1d95)' : 'linear-gradient(135deg, #0284c7, #0369a1)', 
              color: '#fff', 
              padding: '6px 12px', 
              borderRadius: '8px', 
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.8rem',
              fontWeight: 800,
              boxShadow: isSudo ? '0 0 14px rgba(124, 58, 237, 0.4)' : 'none'
            }}>
              {isSudo ? <Crown size={15} /> : <ShieldCheck size={15} />}
              {isSudo ? 'Sudo Root Console' : 'Administrator Console'}
            </span>
            <h1 style={{ fontSize: '1.6rem', fontWeight: 800, margin: 0, color: '#0f172a' }}>
              {isSudo ? 'Sudo Site Control & User Management' : 'Billora Administration & Configuration'}
            </h1>
          </div>
          <p style={{ color: '#64748b', fontSize: '0.9rem', marginTop: '4px' }}>
            {isSudo 
              ? 'Handle client enterprise name, customize site details, assign staff roles, and manage site access.'
              : 'Configure dynamic client fields, access interactive stock manual, and monitor automated backups.'}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <a 
            href={getApiUrl("/admin/documentation/stock-guide-pdf")} 
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
        paddingBottom: '2px',
        overflowX: 'auto'
      }}>
        {/* Sudo / Admin: Users & Roles */}
        <button
          className={`btn btn-sm ${activeSubTab === 'users-section' ? 'btn-primary' : 'btn-ghost'}`}
          onClick={() => setActiveSubTab('users-section')}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', borderRadius: '8px 8px 0 0', padding: '8px 16px' }}
        >
          <Users size={16} />
          <span>Users & Set Roles</span>
          <span style={{ 
            background: activeSubTab === 'users-section' ? 'rgba(255,255,255,0.25)' : '#e2e8f0', 
            padding: '2px 7px', 
            borderRadius: '12px', 
            fontSize: '0.72rem',
            fontWeight: 700 
          }}>
            {usersList.length}
          </span>
        </button>

        {/* Sudo / Admin: Client Name & Site Details */}
        <button
          className={`btn btn-sm ${activeSubTab === 'site-details' ? 'btn-primary' : 'btn-ghost'}`}
          onClick={() => setActiveSubTab('site-details')}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', borderRadius: '8px 8px 0 0', padding: '8px 16px' }}
        >
          <Building2 size={16} />
          <span>Client & Site Details</span>
        </button>

        {/* Dynamic Client Fields */}
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

        {/* Client Stock Manual */}
        <button
          className={`btn btn-sm ${activeSubTab === 'stock-guide' ? 'btn-primary' : 'btn-ghost'}`}
          onClick={() => setActiveSubTab('stock-guide')}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', borderRadius: '8px 8px 0 0', padding: '8px 16px' }}
        >
          <BookOpen size={16} />
          <span>Client Stock Manual</span>
        </button>

        {/* Backup & Migration */}
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

      {/* TAB 1: USERS & ROLES MANAGEMENT */}
      {activeSubTab === 'users-section' && (
        <div className="card-box" style={{ background: '#fff', borderRadius: '12px', padding: '24px', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: '#1e293b' }}>
                System Users & Site Role Assignment
              </h3>
              <p style={{ margin: '4px 0 0 0', color: '#64748b', fontSize: '0.85rem' }}>
                Control staff authorization, set roles (Sudo, Admin, Accountant, Sales Counter, Store Yard), and manage terminal passwords.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button className="btn btn-secondary btn-sm" onClick={loadUsers} disabled={loading}>
                <RefreshCw size={14} className={loading ? 'spin-icon' : ''} />
                <span>Refresh</span>
              </button>
              <button className="btn btn-primary btn-sm" onClick={handleOpenAddUserModal}>
                <Plus size={14} />
                <span>+ Add User & Set Role</span>
              </button>
            </div>
          </div>

          <div className="table-responsive">
            <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0', textAlign: 'left' }}>
                  <th style={{ padding: '10px 14px', fontSize: '0.8rem', color: '#475569' }}>User Profile</th>
                  <th style={{ padding: '10px 14px', fontSize: '0.8rem', color: '#475569' }}>Username / Email</th>
                  <th style={{ padding: '10px 14px', fontSize: '0.8rem', color: '#475569' }}>Assigned Role</th>
                  <th style={{ padding: '10px 14px', fontSize: '0.8rem', color: '#475569' }}>Site Access Permissions</th>
                  <th style={{ padding: '10px 14px', fontSize: '0.8rem', color: '#475569' }}>Status</th>
                  <th style={{ padding: '10px 14px', fontSize: '0.8rem', color: '#475569', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {usersList.map((u) => {
                  const roleStr = (u.role || '').toLowerCase();
                  let roleDesc = 'Operational staff';
                  if (roleStr === 'sudo') roleDesc = 'Full Master Access: Company details, Roles, DB Backups, ERP Control';
                  else if (roleStr === 'admin') roleDesc = 'Admin Console, Stock management, Invoicing, Dynamic Client Fields';
                  else if (roleStr === 'accountant') roleDesc = 'Daybook, Payments, Customer Ledgers, Financial Reports';
                  else if (roleStr === 'sales') roleDesc = 'GST Billing Counter, Customer Profiles, Quotes';
                  else if (roleStr === 'store') roleDesc = 'Stone Yard Stock, Products, Damage Entries, Slabs Inventory';

                  return (
                    <tr key={u.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '50%',
                            background: roleStr === 'sudo' ? 'linear-gradient(135deg, #7c3aed, #4c1d95)' : '#0284c7',
                            color: '#fff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 700,
                            fontSize: '0.88rem'
                          }}>
                            {u.name.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontWeight: 700, fontSize: '0.92rem', color: '#0f172a' }}>{u.name}</div>
                            {u.id === 5 && <span style={{ fontSize: '0.72rem', color: '#7c3aed', fontWeight: 700 }}>★ Root Sudo Authority</span>}
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '12px 14px', fontSize: '0.85rem', color: '#0284c7', fontFamily: 'monospace', fontWeight: 600 }}>
                        {u.email}
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        {getRoleBadge(u.role)}
                      </td>
                      <td style={{ padding: '12px 14px', fontSize: '0.82rem', color: '#475569', maxWidth: '280px' }}>
                        {roleDesc}
                      </td>
                      <td style={{ padding: '12px 14px', fontSize: '0.82rem' }}>
                        {u.status === 'Active' || !u.status ? (
                          <span style={{ color: '#16a34a', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <span className="live-dot" style={{ width: '6px', height: '6px' }}></span> Active
                          </span>
                        ) : (
                          <span style={{ color: '#ef4444', fontWeight: 600 }}>Suspended</span>
                        )}
                      </td>
                      <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '6px' }}>
                          <button 
                            className="btn btn-secondary btn-sm"
                            onClick={() => handleOpenEditUserModal(u)}
                            title="Edit User & Set Role"
                            style={{ padding: '4px 10px', fontSize: '0.78rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                          >
                            <Edit3 size={13} />
                            <span>Set Role</span>
                          </button>
                          {u.role !== 'sudo' && u.id !== 5 && (
                            <button 
                              className="btn btn-ghost btn-sm"
                              onClick={() => handleDeleteUser(u.id, u.name, u.role)}
                              title="Delete User"
                              style={{ padding: '4px 8px' }}
                            >
                              <Trash2 size={14} color="#ef4444" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: CLIENT & SITE DETAILS (COMPANY SETTINGS) */}
      {activeSubTab === 'site-details' && (
        <div className="card-box" style={{ background: '#fff', borderRadius: '12px', padding: '28px', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
          <div style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '16px', marginBottom: '24px' }}>
            <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>
              Client Name & Company Site Configuration
            </h3>
            <p style={{ margin: '4px 0 0 0', color: '#64748b', fontSize: '0.88rem' }}>
              Handled by Sudo user to customize client enterprise name, GSTIN, yard site address, invoice prefixes, and branding across the entire software.
            </p>
          </div>

          <form onSubmit={handleSaveCompanySettings}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 700, color: '#1e293b' }}>Client Enterprise Name *</label>
                <input
                  type="text"
                  className="form-input"
                  style={{ fontSize: '0.95rem', fontWeight: 600 }}
                  value={companySettings.company_name}
                  onChange={(e) => setCompanySettings({ ...companySettings, company_name: e.target.value })}
                  placeholder="e.g. BILLORA MARBLES & GRANITES"
                  required
                />
                <span style={{ fontSize: '0.74rem', color: '#64748b' }}>Displayed in main navbar, headers, printed GST invoices, and vouchers.</span>
              </div>

              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 700, color: '#1e293b' }}>Business Category / Sector</label>
                <input
                  type="text"
                  className="form-input"
                  value={companySettings.business_type}
                  onChange={(e) => setCompanySettings({ ...companySettings, business_type: e.target.value })}
                  placeholder="e.g. Granite, Marble & Natural Stone ERP"
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px', marginBottom: '20px' }}>
              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 700, color: '#1e293b' }}>Tagline / Enterprise Slogan</label>
                <input
                  type="text"
                  className="form-input"
                  value={companySettings.tagline}
                  onChange={(e) => setCompanySettings({ ...companySettings, tagline: e.target.value })}
                  placeholder="e.g. Smart GST Billing & Stone Inventory ERP System"
                />
              </div>

              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 700, color: '#1e293b' }}>GSTIN Registration *</label>
                <input
                  type="text"
                  className="form-input font-mono"
                  style={{ fontWeight: 700, color: '#0284c7' }}
                  value={companySettings.gstin}
                  onChange={(e) => setCompanySettings({ ...companySettings, gstin: e.target.value })}
                  placeholder="e.g. 32FGZPR5431L1ZL"
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 700, color: '#1e293b' }}>Official Phone / Mobiles</label>
                <input
                  type="text"
                  className="form-input"
                  value={companySettings.phone}
                  onChange={(e) => setCompanySettings({ ...companySettings, phone: e.target.value })}
                  placeholder="e.g. 9460110878, 8504882265"
                />
              </div>

              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 700, color: '#1e293b' }}>Official Email Address</label>
                <input
                  type="email"
                  className="form-input"
                  value={companySettings.email}
                  onChange={(e) => setCompanySettings({ ...companySettings, email: e.target.value })}
                  placeholder="e.g. admin@billora.com"
                />
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: '20px' }}>
              <label className="form-label" style={{ fontWeight: 700, color: '#1e293b' }}>Stone Yard Site / Physical Address</label>
              <input
                type="text"
                className="form-input"
                value={companySettings.address}
                onChange={(e) => setCompanySettings({ ...companySettings, address: e.target.value })}
                placeholder="e.g. Chengamanadu, Kottarakkara, Kollam, Kerala - 691557"
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 600 }}>Sales Invoice Prefix</label>
                <input
                  type="text"
                  className="form-input font-mono"
                  value={companySettings.invoice_prefix}
                  onChange={(e) => setCompanySettings({ ...companySettings, invoice_prefix: e.target.value })}
                  placeholder="e.g. BIL26-27 "
                />
              </div>

              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 600 }}>Purchase Prefix</label>
                <input
                  type="text"
                  className="form-input font-mono"
                  value={companySettings.purchase_prefix}
                  onChange={(e) => setCompanySettings({ ...companySettings, purchase_prefix: e.target.value })}
                  placeholder="e.g. PUR-BIL-"
                />
              </div>

              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 600 }}>Default GST Tax Rate (%)</label>
                <input
                  type="number"
                  step="0.1"
                  className="form-input"
                  value={companySettings.default_tax_rate}
                  onChange={(e) => setCompanySettings({ ...companySettings, default_tax_rate: parseFloat(e.target.value) || 18.0 })}
                />
              </div>

              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 600 }}>Currency Symbol</label>
                <input
                  type="text"
                  className="form-input"
                  value={companySettings.currency_symbol}
                  onChange={(e) => setCompanySettings({ ...companySettings, currency_symbol: e.target.value })}
                  placeholder="e.g. ₹"
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button type="submit" className="btn btn-primary" disabled={saving} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                <Save size={16} />
                <span>{saving ? 'Updating Client Details...' : 'Save Client & Site Details'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 3: DYNAMIC CLIENT FIELDS */}
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
              <button className="btn btn-primary btn-sm" onClick={handleOpenAddFieldModal}>
                <Plus size={14} />
                <span>+ Add Dynamic Field</span>
              </button>
            </div>
          </div>

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
                          onClick={() => handleOpenEditFieldModal(f)}
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
        </div>
      )}

      {/* TAB 4: CLIENT STOCK & OPERATIONS MANUAL */}
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
              href={getApiUrl("/admin/documentation/stock-guide-pdf")} 
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
            {/* Guide Card 1 */}
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

            {/* Guide Card 2 */}
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

            {/* Guide Card 3 */}
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
        </div>
      )}

      {/* TAB 5: BACKUP & DATA MIGRATION ENGINE */}
      {activeSubTab === 'backup-migration' && (
        <div>
          <BackupMigrationView currency={currency} onRefresh={onRefresh} />
        </div>
      )}

      {/* MODAL: ADD / EDIT USER & SET ROLE */}
      {showUserModal && (
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
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <KeyRound size={20} color="#0284c7" />
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#0f172a' }}>
                  {userModalMode === 'add' ? 'Create User & Assign Site Role' : `Edit User & Set Role: ${selectedUser?.name}`}
                </h3>
              </div>
              <button 
                type="button" 
                onClick={() => setShowUserModal(false)}
                style={{ background: 'none', border: 'none', fontSize: '1.4rem', color: '#64748b', cursor: 'pointer' }}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSaveUser} style={{ padding: '24px' }}>
              <div className="form-group" style={{ marginBottom: '14px' }}>
                <label className="form-label" style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                  Full Name *
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Thomas Kovoor"
                  value={userFormData.name}
                  onChange={(e) => setUserFormData({ ...userFormData, name: e.target.value })}
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: '14px' }}>
                <label className="form-label" style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                  Username / Email Address *
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. thomas@billora.com or thomas"
                  value={userFormData.email}
                  onChange={(e) => setUserFormData({ ...userFormData, email: e.target.value })}
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: '14px' }}>
                <label className="form-label" style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                  Password {userModalMode === 'edit' && <span style={{ color: '#94a3b8' }}>(Leave blank to keep current)</span>}
                </label>
                <input
                  type="password"
                  className="form-input"
                  placeholder={userModalMode === 'add' ? 'Set account password' : 'Enter new password if changing'}
                  value={userFormData.password}
                  onChange={(e) => setUserFormData({ ...userFormData, password: e.target.value })}
                  required={userModalMode === 'add'}
                />
              </div>

              {/* ROLE SELECTOR */}
              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label className="form-label" style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#0369a1', marginBottom: '6px' }}>
                  Assign Site Access Role *
                </label>
                <select
                  className="form-input"
                  style={{ fontWeight: 600, fontSize: '0.9rem' }}
                  value={userFormData.role}
                  onChange={(e) => setUserFormData({ ...userFormData, role: e.target.value })}
                >
                  <option value="sales">Sales Counter Staff (Billing, Customers, Quotes)</option>
                  <option value="accountant">Accountant (Daybook, Ledger, Payments, Dues)</option>
                  <option value="store">Store Yard Keeper (Stock, Damage Entry, Slab Inventory)</option>
                  <option value="admin">Administrator (Operations, Dynamic Fields, Reports)</option>
                  <option value="sudo">Sudo Master (Full Site Control, Client Details & Roles)</option>
                </select>
                <span style={{ fontSize: '0.74rem', color: '#64748b', marginTop: '4px', display: 'block' }}>
                  The assigned role immediately controls which navigation tabs and capabilities this user has on the site.
                </span>
              </div>

              <div className="form-group" style={{ marginBottom: '20px' }}>
                <label className="form-label" style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                  Account Status
                </label>
                <select
                  className="form-input"
                  value={userFormData.status}
                  onChange={(e) => setUserFormData({ ...userFormData, status: e.target.value })}
                >
                  <option value="Active">Active (Permitted to sign in)</option>
                  <option value="Suspended">Suspended (Login blocked)</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => setShowUserModal(false)}
                  disabled={saving}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  disabled={saving}
                >
                  {saving ? 'Saving...' : (userModalMode === 'add' ? 'Create User' : 'Update Role & Profile')}
                </button>
              </div>
            </form>
          </div>
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
                {fieldModalMode === 'add' ? 'Add Dynamic Client Field' : 'Edit Dynamic Client Field'}
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
                  value={fieldFormData.field_label}
                  onChange={(e) => setFieldFormData({ ...fieldFormData, field_label: e.target.value })}
                  required
                />
              </div>

              {fieldModalMode === 'add' && (
                <div className="form-group" style={{ marginBottom: '14px' }}>
                  <label className="form-label" style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                    Field Key (Slug)
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. site_route (auto-generated if blank)"
                    value={fieldFormData.field_key}
                    onChange={(e) => setFieldFormData({ ...fieldFormData, field_key: e.target.value })}
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
                    value={fieldFormData.field_type}
                    onChange={(e) => setFieldFormData({ ...fieldFormData, field_type: e.target.value })}
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
                    value={fieldFormData.sort_order}
                    onChange={(e) => setFieldFormData({ ...fieldFormData, sort_order: parseInt(e.target.value) || 1 })}
                    min="1"
                  />
                </div>
              </div>

              {fieldFormData.field_type === 'select' && (
                <div className="form-group" style={{ marginBottom: '14px' }}>
                  <label className="form-label" style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                    Dropdown Options (comma-separated)
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Premium Galaxy,Italian Marble,Standard Granite"
                    value={fieldFormData.options}
                    onChange={(e) => setFieldFormData({ ...fieldFormData, options: e.target.value })}
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
                  value={fieldFormData.placeholder}
                  onChange={(e) => setFieldFormData({ ...fieldFormData, placeholder: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.88rem', color: '#334155' }}>
                  <input
                    type="checkbox"
                    checked={fieldFormData.is_required}
                    onChange={(e) => setFieldFormData({ ...fieldFormData, is_required: e.target.checked })}
                  />
                  <span>Mandatory / Required Field</span>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.88rem', color: '#334155' }}>
                  <input
                    type="checkbox"
                    checked={fieldFormData.is_active}
                    onChange={(e) => setFieldFormData({ ...fieldFormData, is_active: e.target.checked })}
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
                  {saving ? 'Saving Field...' : (fieldModalMode === 'add' ? 'Create Field' : 'Update Field')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* In-App Confirm Delete Modal */}
      <ConfirmModal
        isOpen={Boolean(deleteModalAdmin)}
        title={deleteModalAdmin?.title || 'Confirm Deletion'}
        message={deleteModalAdmin?.message || ''}
        confirmText="Confirm Delete"
        isLoading={isDeletingAdmin}
        onCancel={() => !isDeletingAdmin && setDeleteModalAdmin(null)}
        onConfirm={handleConfirmAdminDelete}
        itemDetails={deleteModalAdmin?.itemDetails}
      />
    </div>
  );
}
