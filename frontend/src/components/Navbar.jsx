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
  ShieldCheck,
  Crown,
  LayoutDashboard
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
  const role = (currentUser?.role || '').toLowerCase();
  const isSudo = role === 'sudo';
  const isAdmin = isSudo || role.includes('admin');
  const isAccountant = role === 'accountant';
  const isSales = role === 'sales';
  const isStore = role === 'store';

  let tabs = [];
  if (isSudo) {
    tabs = [
      { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
      { id: 'admin', label: 'Sudo Console', icon: Crown },
      { id: 'daybook', label: 'Daybook', icon: BookOpen },
      { id: 'sales', label: 'Sales', icon: FileText },
      { id: 'purchase', label: 'Purchase', icon: ShoppingBag },
      { id: 'products', label: 'Products', icon: Package },
      { id: 'stock', label: 'Stock', icon: Layers },
      { id: 'damage', label: 'Damage Entry', icon: AlertTriangle },
      { id: 'contacts', label: 'Contacts', icon: Users },
      { id: 'others', label: 'Others', icon: MoreHorizontal },
    ];
  } else if (isAdmin) {
    tabs = [
      { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
      { id: 'admin', label: 'Admin Panel', icon: ShieldCheck },
      { id: 'daybook', label: 'Daybook', icon: BookOpen },
      { id: 'sales', label: 'Sales', icon: FileText },
      { id: 'purchase', label: 'Purchase', icon: ShoppingBag },
      { id: 'products', label: 'Products', icon: Package },
      { id: 'stock', label: 'Stock', icon: Layers },
      { id: 'damage', label: 'Damage Entry', icon: AlertTriangle },
      { id: 'contacts', label: 'Contacts', icon: Users },
      { id: 'others', label: 'Others', icon: MoreHorizontal },
    ];
  } else if (isAccountant) {
    tabs = [
      { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
      { id: 'daybook', label: 'Daybook', icon: BookOpen },
      { id: 'sales', label: 'Sales Invoices', icon: FileText },
      { id: 'contacts', label: 'Client Accounts', icon: Users },
      { id: 'others', label: 'Financial Reports', icon: MoreHorizontal },
    ];
  } else if (isSales) {
    tabs = [
      { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
      { id: 'sales', label: 'Sales Counter', icon: FileText },
      { id: 'contacts', label: 'Customer Directory', icon: Users },
      { id: 'products', label: 'Product Catalog', icon: Package },
      { id: 'stock', label: 'Current Stock', icon: Layers },
    ];
  } else if (isStore) {
    tabs = [
      { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
      { id: 'stock', label: 'Yard Stock', icon: Layers },
      { id: 'products', label: 'Products & Slabs', icon: Package },
      { id: 'damage', label: 'Damage Entry', icon: AlertTriangle },
      { id: 'purchase', label: 'Purchase Inward', icon: ShoppingBag },
    ];
  } else {
    tabs = [
      { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
      { id: 'daybook', label: 'Daybook', icon: BookOpen },
      { id: 'sales', label: 'Sales', icon: FileText },
      { id: 'purchase', label: 'Purchase', icon: ShoppingBag },
      { id: 'products', label: 'Products', icon: Package },
      { id: 'stock', label: 'Stock', icon: Layers },
      { id: 'damage', label: 'Damage Entry', icon: AlertTriangle },
      { id: 'contacts', label: 'Contacts', icon: Users },
      { id: 'others', label: 'Others', icon: MoreHorizontal },
    ];
  }

  const getInitials = (name) => {
    if (!name) return 'U';
    const parts = name.split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.substring(0, 2).toUpperCase();
  };

  const logoSrc = settings?.logo_url || '/logo.png';

  return (
    <header className="top-header no-print">
      <div className="brand-section">
        <img 
          src={logoSrc} 
          alt="Billora Logo" 
          className="brand-logo-img" 
          style={{ 
            width: '44px', 
            height: '44px', 
            borderRadius: '12px', 
            objectFit: 'cover',
            border: isSudo ? '2px solid #a855f7' : '2px solid rgba(56, 189, 248, 0.4)',
            boxShadow: isSudo ? '0 0 16px rgba(168, 85, 247, 0.5)' : '0 0 14px rgba(2, 132, 199, 0.45)',
            transition: 'all 0.2s ease'
          }} 
          onError={(e) => { e.currentTarget.src = '/logo.png'; }}
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
              className={`nav-tab-btn ${activeTab === tab.id ? 'active' : ''} ${tab.id === 'admin' ? (isSudo ? 'nav-tab-sudo' : 'nav-tab-admin') : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <Icon size={16} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="header-actions">
        {/* Only sales/admin/sudo can create quick sale */}
        {(isSudo || isAdmin || isSales) && (
          <button className="btn btn-primary btn-sm" onClick={onQuickSale}>
            <Plus size={14} />
            <span>+ New Sale</span>
          </button>
        )}

        {/* Only store/admin/sudo can create quick purchase */}
        {(isSudo || isAdmin || isStore) && (
          <button className="btn btn-secondary btn-sm" onClick={onQuickPurchase}>
            <ShoppingBag size={14} />
            <span>+ Purchase</span>
          </button>
        )}

        {currentUser && (
          <div className="user-profile-bar">
            <div className="user-profile-badge" title={`${currentUser.name} (${currentUser.role})`}>
              <div className="user-avatar-circle" style={{
                background: isSudo ? 'linear-gradient(135deg, #7c3aed, #4c1d95)' : undefined
              }}>
                {isSudo ? <Crown size={14} /> : getInitials(currentUser.name)}
              </div>
              <div className="user-details-text">
                <span className="user-name-display">{currentUser.name.split('(')[0].trim()}</span>
                <span className="user-role-tag" style={{
                  background: isSudo ? 'linear-gradient(135deg, #7c3aed, #4c1d95)' : undefined,
                  color: isSudo ? '#ffffff' : undefined,
                  fontWeight: isSudo ? 800 : undefined
                }}>
                  {currentUser.role.toUpperCase()}
                </span>
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
