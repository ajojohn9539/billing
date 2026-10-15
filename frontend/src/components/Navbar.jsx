import React from 'react';
import { 
  Users, 
  Package, 
  ShoppingBag, 
  FileText, 
  AlertTriangle, 
  Layers, 
  BookOpen, 
  MoreHorizontal,
  Plus,
  LogOut,
  ShieldCheck
} from 'lucide-react';

export default function Navbar({ 
  activeTab, 
  setActiveTab, 
  onQuickSale, 
  onQuickPurchase, 
  companyName,
  settings,
  currentUser,
  onLogout
}) {
  const isAdmin = currentUser?.role?.toLowerCase().includes('admin');

  // Base operational tabs for staff
  const baseTabs = [
    { id: 'daybook', label: 'Daybook', icon: BookOpen },
    { id: 'sales', label: 'Sales', icon: FileText },
    { id: 'purchase', label: 'Purchase', icon: ShoppingBag },
    { id: 'products', label: 'Products', icon: Package },
    { id: 'stock', label: 'Stock', icon: Layers },
    { id: 'damage', label: 'Damage Entry', icon: AlertTriangle },
    { id: 'contacts', label: 'Contacts', icon: Users },
  ];

  // Admin-only modules are placed strictly in the Admin Panel
  const tabs = isAdmin 
    ? [...baseTabs, { id: 'admin', label: 'Admin Panel', icon: ShieldCheck }, { id: 'others', label: 'Others', icon: MoreHorizontal }]
    : [...baseTabs, { id: 'others', label: 'Others', icon: MoreHorizontal }];

  const getInitials = (name) => {
    if (!name) return 'U';
    const parts = name.split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <header className="top-header no-print">
      <div className="brand-section">
        <img 
          src="/logo.png" 
          alt="Billora Logo" 
          className="brand-logo-img" 
          style={{ 
            width: '42px', 
            height: '42px', 
            borderRadius: '50%', 
            objectFit: 'cover',
            border: '2px solid rgba(255, 255, 255, 0.4)',
            boxShadow: '0 0 12px rgba(2, 132, 199, 0.45)'
          }} 
        />
        <div className="brand-info">
          <h1>{companyName || 'BILLORA MARBLES & GRANITES'}</h1>
          <p><span className="live-dot" style={{ marginRight: '6px' }}></span>Chengamanadu • GSTIN: {settings?.gstin || '32FGZPR5431L1ZL'}</p>
        </div>
      </div>

      <nav className="nav-tabs">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              className={`nav-tab-btn ${activeTab === tab.id ? 'active' : ''} ${tab.id === 'admin' ? 'nav-tab-admin' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <Icon size={16} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="header-actions">
        <button className="btn btn-secondary btn-sm" onClick={onQuickPurchase}>
          <ShoppingBag size={14} />
          <span>+ Purchase</span>
        </button>
        <button className="btn btn-primary btn-sm" onClick={onQuickSale}>
          <Plus size={14} />
          <span>+ New Sale</span>
        </button>

        {currentUser && (
          <div className="user-profile-bar">
            <div className="user-profile-badge" title={`${currentUser.name} (${currentUser.role})`}>
              <div className="user-avatar-circle">
                {getInitials(currentUser.name)}
              </div>
              <div className="user-details-text">
                <span className="user-name-display">{currentUser.name.split('(')[0].trim()}</span>
                <span className="user-role-tag">{currentUser.role}</span>
              </div>
            </div>

            <button 
              className="btn-logout" 
              onClick={onLogout} 
              title="Sign Out of Terminal"
            >
              <LogOut size={16} />
              <span className="logout-text">Logout</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
