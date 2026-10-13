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
  Plus
} from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab, onQuickSale, onQuickPurchase, companyName }) {
  const tabs = [
    { id: 'daybook', label: 'Daybook', icon: BookOpen },
    { id: 'sales', label: 'Sales', icon: FileText },
    { id: 'purchase', label: 'Purchase', icon: ShoppingBag },
    { id: 'products', label: 'Products', icon: Package },
    { id: 'stock', label: 'Stock', icon: Layers },
    { id: 'damage', label: 'Damage Entry', icon: AlertTriangle },
    { id: 'contacts', label: 'Contacts', icon: Users },
    { id: 'others', label: 'Others', icon: MoreHorizontal },
  ];

  return (
    <header className="top-header no-print">
      <div className="brand-section">
        <div className="brand-logo-badge" style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' }}>
          🪨
        </div>
        <div className="brand-info">
          <h1>{companyName || 'Rock Palace'}</h1>
          <p><span className="live-dot" style={{ marginRight: '6px' }}></span>Aster Billing (Stone Shop)</p>
        </div>
      </div>

      <nav className="nav-tabs">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              className={`nav-tab-btn ${activeTab === tab.id ? 'active' : ''}`}
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
      </div>
    </header>
  );
}
