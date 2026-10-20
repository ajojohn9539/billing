import React, { useState, useRef, useEffect } from 'react';
import { 
  LayoutDashboard, 
  FileText, 
  ShoppingBag, 
  Package, 
  Layers, 
  Users, 
  ShieldCheck, 
  Crown, 
  MoreHorizontal, 
  AlertTriangle, 
  LogOut, 
  Plus,
  Sun,
  Moon,
  BookOpen,
  Archive,
  Menu,
  ChevronDown,
  Check
} from 'lucide-react';

export default function Navbar({ 
  activeTab, 
  setActiveTab, 
  onQuickSale, 
  onQuickPurchase, 
  companyName, 
  settings, 
  currentUser,
  onLogout,
  theme = 'dark',
  toggleTheme
}) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef(null);

  // Close dropdown on click outside or escape key
  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
    }
    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        setIsMenuOpen(false);
      }
    }
    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isMenuOpen]);

  // Determine current user & role from props or storage
  let user = currentUser;
  if (!user) {
    try {
      const stored = localStorage.getItem('billing_user') || sessionStorage.getItem('billing_user') || localStorage.getItem('billora_user');
      user = stored ? JSON.parse(stored) : null;
    } catch (e) {
      user = null;
    }
  }
  if (!user) {
    user = { name: 'Admin Staff', role: 'admin' };
  }

  const role = (user?.role || 'admin').toLowerCase();
  const isSudo = role === 'sudo';
  const isAdmin = role === 'admin';
  const isAccountant = role === 'accountant';
  const isSales = role === 'sales';
  const isStore = role === 'store';

  // Define tabs with the 4 primary daily modules first, then remaining in menu
  let tabs = [];
  if (isSudo) {
    tabs = [
      { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
      { id: 'sales', label: 'Sales', icon: FileText },
      { id: 'purchase', label: 'Purchase', icon: ShoppingBag },
      { id: 'daybook', label: 'Daybook', icon: BookOpen },
      // Remaining items in Menu bar
      { id: 'products', label: 'Products', icon: Package },
      { id: 'stock', label: 'Stock', icon: Layers },
      { id: 'damage', label: 'Damage Entry', icon: AlertTriangle },
      { id: 'contacts', label: 'Contacts', icon: Users },
      { id: 'archives', label: 'Archives & Activity', icon: Archive },
      { id: 'admin', label: 'Sudo Console', icon: Crown },
      { id: 'others', label: 'Others', icon: MoreHorizontal },
    ];
  } else if (isAdmin) {
    tabs = [
      { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
      { id: 'sales', label: 'Sales', icon: FileText },
      { id: 'purchase', label: 'Purchase', icon: ShoppingBag },
      { id: 'daybook', label: 'Daybook', icon: BookOpen },
      // Remaining items in Menu bar
      { id: 'products', label: 'Products', icon: Package },
      { id: 'stock', label: 'Stock', icon: Layers },
      { id: 'damage', label: 'Damage Entry', icon: AlertTriangle },
      { id: 'contacts', label: 'Contacts', icon: Users },
      { id: 'archives', label: 'Archives & Activity', icon: Archive },
      { id: 'admin', label: 'Admin Panel', icon: ShieldCheck },
      { id: 'others', label: 'Others', icon: MoreHorizontal },
    ];
  } else if (isAccountant) {
    tabs = [
      { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
      { id: 'daybook', label: 'Daybook', icon: BookOpen },
      { id: 'sales', label: 'Sales Invoices', icon: FileText },
      { id: 'contacts', label: 'Client Accounts', icon: Users },
      // Remaining items in Menu bar
      { id: 'archives', label: 'Archives & Activity', icon: Archive },
      { id: 'others', label: 'Financial Reports', icon: MoreHorizontal },
    ];
  } else if (isSales) {
    tabs = [
      { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
      { id: 'sales', label: 'Sales Counter', icon: FileText },
      { id: 'contacts', label: 'Customer Directory', icon: Users },
      { id: 'products', label: 'Product Catalog', icon: Package },
      // Remaining items in Menu bar
      { id: 'stock', label: 'Current Stock', icon: Layers },
    ];
  } else if (isStore) {
    tabs = [
      { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
      { id: 'stock', label: 'Yard Stock', icon: Layers },
      { id: 'products', label: 'Products & Slabs', icon: Package },
      { id: 'damage', label: 'Damage Entry', icon: AlertTriangle },
      // Remaining items in Menu bar
      { id: 'purchase', label: 'Purchase Inward', icon: ShoppingBag },
    ];
  } else {
    tabs = [
      { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
      { id: 'sales', label: 'Sales', icon: FileText },
      { id: 'purchase', label: 'Purchase', icon: ShoppingBag },
      { id: 'daybook', label: 'Daybook', icon: BookOpen },
      { id: 'products', label: 'Products', icon: Package },
      { id: 'stock', label: 'Stock', icon: Layers },
      { id: 'damage', label: 'Damage Entry', icon: AlertTriangle },
      { id: 'contacts', label: 'Contacts', icon: Users },
      { id: 'archives', label: 'Archives & Activity', icon: Archive },
      { id: 'others', label: 'Others', icon: MoreHorizontal },
    ];
  }

  // EXACTLY 4 ITEMS VISIBLE IN HEADER, ALL OTHERS IN MENU BAR
  const visibleTabs = tabs.slice(0, 4);
  const dropdownTabs = tabs.slice(4);
  const isDropdownActive = dropdownTabs.some(t => t.id === activeTab);
  const activeDropdownItem = dropdownTabs.find(t => t.id === activeTab);

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
            width: '42px', 
            height: '42px', 
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

      {/* HEADER NAV: EXACTLY 4 PRIMARY ITEMS + SLEEK DROPDOWN MENU BAR */}
      <nav className="nav-tabs">
        {visibleTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              className={`nav-tab-btn ${isActive ? 'active' : ''}`}
              onClick={() => {
                setActiveTab(tab.id);
                setIsMenuOpen(false);
              }}
            >
              <Icon size={16} />
              <span>{tab.label}</span>
            </button>
          );
        })}

        {/* MENU BAR BUTTON FOR ALL OTHER MODULES */}
        {dropdownTabs.length > 0 && (
          <div className="nav-dropdown-wrapper" ref={menuRef} style={{ position: 'relative' }}>
            <button
              type="button"
              className={`nav-tab-btn nav-tab-menu ${isDropdownActive ? 'active' : ''} ${isMenuOpen ? 'menu-open' : ''}`}
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              title="Click to open more modules menu"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                position: 'relative'
              }}
            >
              {isDropdownActive && activeDropdownItem ? (
                <>
                  {React.createElement(activeDropdownItem.icon, { size: 16 })}
                  <span>{activeDropdownItem.label}</span>
                </>
              ) : (
                <>
                  <Menu size={16} />
                  <span>Menu</span>
                </>
              )}
              <ChevronDown 
                size={14} 
                style={{ 
                  transform: isMenuOpen ? 'rotate(180deg)' : 'none', 
                  transition: 'transform 0.2s ease',
                  opacity: 0.8
                }} 
              />
              {isDropdownActive && (
                <span style={{
                  position: 'absolute',
                  top: '4px',
                  right: '4px',
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  background: '#38bdf8',
                  boxShadow: '0 0 6px #38bdf8'
                }} />
              )}
            </button>

            {/* FLOATING GLASSMORPHIC POPUP MENU */}
            {isMenuOpen && (
              <div 
                className="nav-dropdown-menu"
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 8px)',
                  left: 0,
                  minWidth: '270px',
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '14px',
                  boxShadow: '0 16px 40px -8px rgba(0, 0, 0, 0.45), 0 0 0 1px var(--border-subtle)',
                  backdropFilter: 'blur(16px)',
                  zIndex: 99999,
                  padding: '8px',
                  animation: 'scaleIn 0.15s ease-out'
                }}
              >
                <div style={{
                  padding: '8px 12px 6px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  borderBottom: '1px solid var(--border-subtle)',
                  marginBottom: '6px'
                }}>
                  <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    Additional Modules
                  </span>
                  <span style={{ fontSize: '0.68rem', padding: '2px 6px', borderRadius: '4px', background: 'var(--bg-secondary)', color: 'var(--text-muted)', fontWeight: 600 }}>
                    {dropdownTabs.length} items
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                  {dropdownTabs.map((tab) => {
                    const Icon = tab.icon;
                    const isTabActive = activeTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => {
                          setActiveTab(tab.id);
                          setIsMenuOpen(false);
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          padding: '8px 12px',
                          borderRadius: '8px',
                          border: isTabActive ? '1px solid var(--primary-light)' : '1px solid transparent',
                          background: isTabActive ? 'var(--primary-light)' : 'transparent',
                          color: isTabActive ? 'var(--primary)' : 'var(--text-main)',
                          cursor: 'pointer',
                          textAlign: 'left',
                          fontFamily: 'inherit',
                          fontSize: '0.86rem',
                          fontWeight: isTabActive ? 700 : 500,
                          transition: 'all 0.15s ease'
                        }}
                        onMouseEnter={(e) => {
                          if (!isTabActive) {
                            e.currentTarget.style.background = 'var(--bg-secondary)';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!isTabActive) {
                            e.currentTarget.style.background = 'transparent';
                          }
                        }}
                      >
                        <div style={{
                          width: '30px',
                          height: '30px',
                          borderRadius: '8px',
                          background: isTabActive ? 'var(--primary)' : 'var(--bg-secondary)',
                          color: isTabActive ? '#ffffff' : 'var(--text-muted)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0
                        }}>
                          <Icon size={16} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <span style={{ fontSize: '0.86rem', fontWeight: isTabActive ? 700 : 600, color: 'var(--text-main)' }}>
                              {tab.label}
                            </span>
                            {isTabActive && <Check size={14} color="var(--primary)" />}
                          </div>
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {tab.id === 'products' && 'Catalog & slab variants'}
                            {tab.id === 'stock' && 'Yard inventory & sqft'}
                            {tab.id === 'damage' && 'Stone loss & breakage entry'}
                            {tab.id === 'contacts' && 'Customer & supplier directory'}
                            {tab.id === 'archives' && 'Recycle bin & activity audit'}
                            {tab.id === 'admin' && (isSudo ? 'Sudo superuser console' : 'Staff roles & company settings')}
                            {tab.id === 'others' && 'Banking & financial reports'}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
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

        {/* Light / Dark Mode Toggle */}
        <button 
          className="btn-theme-toggle" 
          onClick={toggleTheme}
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.45rem',
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '20px',
            padding: '0.35rem 0.75rem',
            color: theme === 'dark' ? '#fbbf24' : '#4f46e5',
            cursor: 'pointer',
            fontSize: '0.8rem',
            fontWeight: 700,
            boxShadow: 'var(--shadow-sm)',
            transition: 'all 0.2s ease'
          }}
        >
          {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
          <span style={{ color: 'var(--text-main)', fontSize: '0.78rem' }}>{theme === 'dark' ? 'Light' : 'Dark'}</span>
        </button>

        {/* User Profile & Dedicated Logout Section in Header */}
        <div className="user-profile-bar" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div className="user-profile-badge" title={`${user.name || 'User'} (${user.role || 'Staff'})`}>
            <div className="user-avatar-circle" style={{
              background: isSudo ? 'linear-gradient(135deg, #7c3aed, #4c1d95)' : undefined
            }}>
              {isSudo ? <Crown size={14} /> : getInitials(user.name || 'User')}
            </div>
            <div className="user-details-text">
              <span className="user-name-display">{(user.name || 'User').split('(')[0].trim()}</span>
              <span className="user-role-tag" style={{
                background: isSudo ? 'linear-gradient(135deg, #7c3aed, #4c1d95)' : undefined,
                color: isSudo ? '#ffffff' : undefined,
                fontWeight: isSudo ? 800 : undefined
              }}>
                {(user.role || 'ADMIN').toUpperCase()}
              </span>
            </div>
          </div>

          <button 
            type="button"
            className="btn-logout" 
            onClick={onLogout} 
            title="Sign Out of Billing Terminal"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 700,
              fontSize: '0.82rem',
              transition: 'all 0.2s ease'
            }}
          >
            <LogOut size={15} />
            <span className="logout-text">Logout</span>
          </button>
        </div>
      </div>
    </header>
  );
}
