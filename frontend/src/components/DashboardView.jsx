import React, { useState } from 'react';
import { 
  TrendingUp, 
  Layers, 
  CreditCard, 
  FileText, 
  AlertTriangle, 
  Plus, 
  ArrowUpRight, 
  ArrowDownRight, 
  Clock, 
  ShoppingBag, 
  Building2, 
  CheckCircle,
  ExternalLink,
  ShieldCheck,
  Sparkles,
  Wallet,
  Landmark
} from 'lucide-react';

export default function DashboardView({ 
  sales = [], 
  purchases = [], 
  products = [], 
  contacts = [], 
  bankAccounts = [], 
  settings = null, 
  companyName = 'BILLORA MARBLES & GRANITES',
  currency = '₹', 
  onNavigate 
}) {
  const todayStr = new Date().toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });

  const formatMoney = (val) => `${currency} ${(Number(val) || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/-`;

  // Financial Calculations
  const totalBankBalance = bankAccounts.reduce((acc, b) => acc + (parseFloat(b.current_balance) || 0), 0);
  const totalSalesRevenue = sales.reduce((acc, s) => acc + (parseFloat(s.total) || 0), 0);
  const totalSalesDue = sales.reduce((acc, s) => acc + (parseFloat(s.due) || 0), 0);
  const totalInventoryValuation = products.reduce((acc, p) => acc + ((parseFloat(p.current_stock) || 0) * (parseFloat(p.purchase_price) || 0)), 0);
  const totalPurchases = purchases.reduce((acc, p) => acc + (parseFloat(p.total) || 0), 0);
  const lowStockCount = products.filter(p => (parseFloat(p.current_stock) || 0) <= (parseFloat(p.min_stock) || 10)).length;

  const recentSales = [...sales].slice(0, 5);
  const recentPurchases = [...purchases].slice(0, 5);

  return (
    <div className="dashboard-container" style={{ animation: 'fadeIn 0.25s ease-out' }}>
      
      {/* 1. Welcome Executive Hero Banner */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.9) 100%)',
        border: '1px solid rgba(56, 189, 248, 0.25)',
        borderRadius: '16px',
        padding: '24px 28px',
        marginBottom: '24px',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '20px',
        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.25)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '14px',
            padding: '2px',
            background: 'linear-gradient(135deg, #0284c7 0%, #10b981 100%)',
            boxShadow: '0 0 20px rgba(2, 132, 199, 0.45)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <img 
              src={settings?.logo_url || '/logo.png'} 
              alt="Logo" 
              style={{ width: '100%', height: '100%', borderRadius: '12px', objectFit: 'cover' }}
              onError={(e) => { e.currentTarget.src = '/logo.png'; }}
            />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span className="live-dot"></span>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#38bdf8', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                Executive Dashboard Active
              </span>
            </div>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#ffffff', margin: 0, letterSpacing: '-0.02em' }}>
              {companyName}
            </h2>
            <p style={{ color: '#cbd5e1', fontSize: '0.88rem', margin: '4px 0 0 0' }}>
              {settings?.tagline || 'Smart GST Billing & Stone Inventory ERP System'} • GSTIN: <strong style={{ color: '#38bdf8' }}>{settings?.gstin || '32FGZPR5431L1ZL'}</strong>
            </p>
          </div>
        </div>

        <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            background: 'rgba(2, 132, 199, 0.15)',
            border: '1px solid rgba(56, 189, 248, 0.35)',
            padding: '6px 14px',
            borderRadius: '20px',
            fontSize: '0.82rem',
            color: '#38bdf8',
            fontWeight: 600
          }}>
            <Clock size={14} />
            <span>{todayStr}</span>
          </div>
          <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
            Daily Accounting & Stock Registers Active
          </span>
        </div>
      </div>

      {/* 2. Primary 4 Executive KPI Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: '16px',
        marginBottom: '24px'
      }}>
        {/* KPI 1: Bank & Cash Liquidity */}
        <div style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
          borderTop: '4px solid #10b981',
          borderRadius: '14px',
          padding: '20px',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#059669', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Total Bank & Cash Liquidity
            </span>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#059669' }}>
              <Landmark size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.02em', marginBottom: '6px' }}>
            {formatMoney(totalBankBalance)}
          </div>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 500 }}>
            Across {bankAccounts.length} active bank & cash accounts
          </span>
        </div>

        {/* KPI 2: Total Stock Inventory Valuation */}
        <div style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
          borderTop: '4px solid #0284c7',
          borderRadius: '14px',
          padding: '20px',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#0284c7', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Stone Stock Valuation
            </span>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(2, 132, 199, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0284c7' }}>
              <Layers size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.02em', marginBottom: '6px' }}>
            {formatMoney(totalInventoryValuation)}
          </div>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 500 }}>
            {products.length} Stone catalog items in yard
          </span>
        </div>

        {/* KPI 3: Sales Turnover */}
        <div style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
          borderTop: '4px solid #6366f1',
          borderRadius: '14px',
          padding: '20px',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#4f46e5', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Total Invoiced Sales
            </span>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(99, 102, 241, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4f46e5' }}>
              <TrendingUp size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.02em', marginBottom: '6px' }}>
            {formatMoney(totalSalesRevenue)}
          </div>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 500 }}>
            {sales.length} GST Sales bills generated
          </span>
        </div>

        {/* KPI 4: Customer Outstanding Dues */}
        <div style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
          borderTop: '4px solid #ef4444',
          borderRadius: '14px',
          padding: '20px',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#dc2626', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Customer Receivables (Due)
            </span>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(239, 68, 68, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#dc2626' }}>
              <CreditCard size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#dc2626', letterSpacing: '-0.02em', marginBottom: '6px' }}>
            {formatMoney(totalSalesDue)}
          </div>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 500 }}>
            Uncollected balance pending recovery
          </span>
        </div>
      </div>

      {/* 3. DEDICATED TOTAL BANK BALANCE SECTION */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '34px', height: '34px', borderRadius: '8px', background: 'rgba(56, 189, 248, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-cyan)' }}>
              <Landmark size={18} />
            </div>
            <div>
              <h3 className="card-title" style={{ margin: 0 }}>Total Bank Balance & Cash Register</h3>
              <p style={{ margin: '2px 0 0 0', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Real-time liquidity across all registered commercial banks and shop cash drawers
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button 
              className="btn btn-secondary btn-sm" 
              onClick={() => onNavigate('daybook')}
              style={{ fontSize: '0.78rem' }}
            >
              + Record Daybook Entry
            </button>
            <button 
              className="btn btn-secondary btn-sm" 
              onClick={() => onNavigate('others')}
              style={{ fontSize: '0.78rem' }}
            >
              Transfer Funds
            </button>
          </div>
        </div>

        {/* Bank Account Cards Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '14px',
          padding: '16px'
        }}>
          {bankAccounts && bankAccounts.length > 0 ? (
            bankAccounts.map((acc) => (
              <div 
                key={acc.id}
                style={{
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '12px',
                  padding: '16px 18px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '12px',
                  transition: 'all 0.2s ease',
                  position: 'relative'
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.98rem', color: 'var(--text-main)' }}>
                      {acc.name}
                    </span>
                    <span className="badge badge-paid" style={{ fontSize: '0.68rem' }}>
                      Active
                    </span>
                  </div>
                  <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                    {acc.account_type ? acc.account_type.toUpperCase() : 'CURRENT'} • {acc.account_number ? `A/C: ${acc.account_number}` : 'Cash Register'}
                  </div>
                </div>

                <div style={{ borderTop: '1px dashed var(--border-subtle)', paddingTop: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                  <div>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block' }}>
                      Available Balance
                    </span>
                    <span style={{ fontWeight: 800, fontSize: '1.25rem', color: 'var(--text-main)' }}>
                      {formatMoney(acc.current_balance)}
                    </span>
                  </div>
                  {acc.ifsc_code && (
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                      IFSC: {acc.ifsc_code}
                    </span>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
              No bank accounts configured. Configure accounts in Settings.
            </div>
          )}
        </div>
      </div>

      {/* 4. Quick Action Launchpad */}
      <div style={{ marginBottom: '24px' }}>
        <h4 style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-main)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '12px' }}>
          Quick Action Launchpad
        </h4>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
          gap: '12px'
        }}>
          <button 
            type="button" 
            className="btn btn-primary" 
            onClick={() => onNavigate('sales')}
            style={{ padding: '14px 16px', justifyContent: 'flex-start', gap: '10px', borderRadius: '12px' }}
          >
            <Plus size={18} />
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontWeight: 700, fontSize: '0.88rem' }}>+ New GST Bill</div>
              <div style={{ fontSize: '0.72rem', opacity: 0.9 }}>Counter Sales Invoice</div>
            </div>
          </button>

          <button 
            type="button" 
            className="btn btn-secondary" 
            onClick={() => onNavigate('purchase')}
            style={{ padding: '14px 16px', justifyContent: 'flex-start', gap: '10px', borderRadius: '12px' }}
          >
            <ShoppingBag size={18} color="#0284c7" />
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--text-main)' }}>+ Inward Purchase</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Quarry & Slabs Receipt</div>
            </div>
          </button>

          <button 
            type="button" 
            className="btn btn-secondary" 
            onClick={() => onNavigate('stock')}
            style={{ padding: '14px 16px', justifyContent: 'flex-start', gap: '10px', borderRadius: '12px' }}
          >
            <Layers size={18} color="#059669" />
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--text-main)' }}>+ Stock Inward</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Manage Slabs & Adjust</div>
            </div>
          </button>

          <button 
            type="button" 
            className="btn btn-secondary" 
            onClick={() => onNavigate('daybook')}
            style={{ padding: '14px 16px', justifyContent: 'flex-start', gap: '10px', borderRadius: '12px' }}
          >
            <Wallet size={18} color="#d97706" />
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--text-main)' }}>+ Daybook Cash</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Receipts & Expenses</div>
            </div>
          </button>

          <button 
            type="button" 
            className="btn btn-secondary" 
            onClick={() => onNavigate('damage')}
            style={{ padding: '14px 16px', justifyContent: 'flex-start', gap: '10px', borderRadius: '12px' }}
          >
            <AlertTriangle size={18} color="#dc2626" />
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--text-main)' }}>+ Log Damage</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Broken Stone Loss</div>
            </div>
          </button>
        </div>
      </div>

      {/* 5. Split Section: Recent Bills & Low Stock Watchlist */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(440px, 1fr))', gap: '20px' }}>
        
        {/* Recent Sales Bills */}
        <div className="card" style={{ marginBottom: 0 }}>
          <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 className="card-title" style={{ margin: 0 }}>
              <FileText size={18} color="var(--primary)" />
              Recent GST Sales Bills
            </h3>
            <button className="btn btn-secondary btn-sm" onClick={() => onNavigate('sales')} style={{ fontSize: '0.75rem' }}>
              View All ({sales.length})
            </button>
          </div>
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Bill No</th>
                  <th>Customer</th>
                  <th>Date</th>
                  <th>Total</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentSales.length > 0 ? (
                  recentSales.map(s => (
                    <tr key={s.id}>
                      <td className="font-mono" style={{ fontWeight: 700, color: 'var(--text-main)' }}>
                        {s.bill_no}
                      </td>
                      <td style={{ fontWeight: 600, color: 'var(--text-main)' }}>
                        {s.customer_name}
                      </td>
                      <td style={{ color: 'var(--text-muted)', fontSize: '0.82rem', fontWeight: 500 }}>
                        {s.date}
                      </td>
                      <td style={{ fontWeight: 700, color: 'var(--accent-cyan)' }}>
                        {formatMoney(s.total)}
                      </td>
                      <td>
                        <span className={`badge ${s.status === 'Paid' ? 'badge-paid' : 'badge-overdue'}`}>
                          {s.status}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                      No sales recorded yet. Click "+ New GST Bill" to start billing.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Low Stock Watchlist */}
        <div className="card" style={{ marginBottom: 0 }}>
          <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertTriangle size={18} color="#dc2626" />
              <h3 className="card-title" style={{ margin: 0 }}>Low Stock & Inventory Watchlist</h3>
            </div>
            <button className="btn btn-secondary btn-sm" onClick={() => onNavigate('stock')} style={{ fontSize: '0.75rem' }}>
              Manage Stock
            </button>
          </div>
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Stone Slab</th>
                  <th>Category</th>
                  <th>Current Stock</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {products.length > 0 ? (
                  products.slice(0, 5).map(p => {
                    const isLow = (parseFloat(p.current_stock) || 0) <= (parseFloat(p.min_stock) || 10);
                    return (
                      <tr key={p.id}>
                        <td style={{ fontWeight: 700, color: 'var(--text-main)' }}>
                          {p.name}
                        </td>
                        <td>
                          <span className="badge" style={{ background: 'var(--bg-secondary)', color: 'var(--text-muted)', border: '1px solid var(--border-subtle)', fontWeight: 600 }}>
                            {p.category || 'Granite'}
                          </span>
                        </td>
                        <td style={{ fontWeight: 700, color: isLow ? '#dc2626' : '#059669' }}>
                          {p.current_stock} {p.unit || 'sqft'}
                        </td>
                        <td>
                          <span className={`badge ${isLow ? 'badge-overdue' : 'badge-paid'}`}>
                            {isLow ? 'Low Stock' : 'In Stock'}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="4" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                      No products found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

    </div>
  );
}
