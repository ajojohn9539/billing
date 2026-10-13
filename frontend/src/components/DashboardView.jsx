import React from 'react';
import { 
  TrendingUp, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  FileText, 
  CreditCard, 
  ArrowUpRight,
  Eye,
  Plus
} from 'lucide-react';

export default function DashboardView({ 
  stats, 
  currency, 
  onViewInvoice, 
  onRecordPayment, 
  onNewInvoice, 
  onNavigateTab 
}) {
  if (!stats) return <div className="card">Loading analytics...</div>;

  const formatMoney = (val) => `${currency} ${(Number(val) || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const maxBilled = Math.max(...(stats.monthly_trend?.map(m => m.billed) || [1]), 100);

  return (
    <div>
      {/* View Header */}
      <div className="view-header">
        <div className="view-title-group">
          <h2>Financial Dashboard</h2>
          <p>Real-time billing overview, cash flow analytics, and pending collections</p>
        </div>
        <div className="header-actions">
          <button className="btn btn-secondary" onClick={() => onNavigateTab('reports')}>
            <TrendingUp size={16} />
            <span>Detailed Reports</span>
          </button>
          <button className="btn btn-primary" onClick={onNewInvoice}>
            <Plus size={16} />
            <span>Create Invoice</span>
          </button>
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-label">Total Billed</span>
            <div className="kpi-icon-wrap indigo">
              <TrendingUp size={20} />
            </div>
          </div>
          <div className="kpi-value">{formatMoney(stats.total_billed)}</div>
          <div className="kpi-subtext">{stats.total_invoices || 0} total invoices issued</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-label">Total Collected</span>
            <div className="kpi-icon-wrap emerald">
              <CheckCircle2 size={20} />
            </div>
          </div>
          <div className="kpi-value" style={{ color: 'var(--success)' }}>
            {formatMoney(stats.total_collected)}
          </div>
          <div className="kpi-subtext">Realized revenue in account</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-label">Outstanding Balance</span>
            <div className="kpi-icon-wrap amber">
              <Clock size={20} />
            </div>
          </div>
          <div className="kpi-value" style={{ color: '#fbbf24' }}>
            {formatMoney(stats.total_receivable)}
          </div>
          <div className="kpi-subtext">Awaiting payment settlement</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-label">Overdue Invoices</span>
            <div className="kpi-icon-wrap rose">
              <AlertCircle size={20} />
            </div>
          </div>
          <div className="kpi-value" style={{ color: 'var(--danger)' }}>
            {formatMoney(stats.overdue_amount)}
          </div>
          <div className="kpi-subtext">{stats.overdue_count || 0} overdue bills require follow-up</div>
        </div>
      </div>

      {/* Grid: Revenue Trend Chart + Status Breakdown */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.5rem', marginBottom: '1.75rem' }}>
        
        {/* Monthly Revenue Bar Chart */}
        <div className="card" style={{ marginBottom: 0 }}>
          <div className="card-header">
            <h3 className="card-title">
              <TrendingUp size={18} style={{ color: 'var(--primary)' }} />
              Monthly Revenue Performance
            </h3>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Last 12 Months</span>
          </div>
          
          <div className="chart-bar-container">
            {stats.monthly_trend && stats.monthly_trend.length > 0 ? (
              stats.monthly_trend.map((item, idx) => {
                const heightPercent = Math.max(12, Math.round((item.billed / maxBilled) * 100));
                return (
                  <div key={idx} className="chart-bar-col" title={`Month: ${item.month}\nBilled: ${formatMoney(item.billed)}\nCollected: ${formatMoney(item.collected)}`}>
                    <div 
                      className="chart-bar-fill" 
                      style={{ height: `${heightPercent}%` }}
                    />
                    <span className="chart-bar-label">{item.month?.substring(5) || item.month}</span>
                  </div>
                );
              })
            ) : (
              <div style={{ margin: 'auto', color: 'var(--text-muted)' }}>No monthly trend data available yet</div>
            )}
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            <span>📊 Total active customers: <strong style={{ color: '#fff' }}>{stats.customers_count}</strong></span>
            <span>📦 Total products/services: <strong style={{ color: '#fff' }}>{stats.products_count}</strong></span>
          </div>
        </div>

        {/* Invoice Pipeline & Status Breakdown */}
        <div className="card" style={{ marginBottom: 0 }}>
          <div className="card-header">
            <h3 className="card-title">
              <FileText size={18} style={{ color: 'var(--accent-cyan)' }} />
              Invoice Distribution
            </h3>
            <button className="btn btn-sm btn-secondary" onClick={() => onNavigateTab('invoices')}>
              <span>View All</span>
              <ArrowUpRight size={14} />
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {stats.status_summary && stats.status_summary.length > 0 ? (
              stats.status_summary.map((st, i) => (
                <div 
                  key={i} 
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between',
                    padding: '0.75rem 1rem',
                    background: 'var(--bg-secondary)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-subtle)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span className={`badge badge-${st.status}`}>{st.status.replace('_', ' ')}</span>
                    <span style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>{st.count} invoices</span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#fff' }}>{formatMoney(st.total_amount)}</div>
                    {st.balance_due > 0 && (
                      <div style={{ fontSize: '0.72rem', color: '#fbbf24' }}>Due: {formatMoney(st.balance_due)}</div>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div style={{ color: 'var(--text-muted)' }}>No invoices recorded yet.</div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Invoices Table */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">
            <FileText size={18} style={{ color: 'var(--primary)' }} />
            Recent Invoices
          </h3>
          <button className="btn btn-sm btn-secondary" onClick={() => onNavigateTab('invoices')}>
            <span>Manage All Invoices</span>
            <ArrowUpRight size={14} />
          </button>
        </div>

        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Invoice #</th>
                <th>Client</th>
                <th>Issue Date</th>
                <th>Due Date</th>
                <th>Total</th>
                <th>Balance Due</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {stats.recent_invoices && stats.recent_invoices.length > 0 ? (
                stats.recent_invoices.map((inv) => (
                  <tr key={inv.id}>
                    <td className="font-mono" style={{ fontWeight: 600, color: '#fff' }}>{inv.invoice_number}</td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{inv.customer_name}</div>
                      {inv.customer_company && (
                        <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>{inv.customer_company}</div>
                      )}
                    </td>
                    <td>{inv.issue_date}</td>
                    <td>{inv.due_date}</td>
                    <td style={{ fontWeight: 700 }}>{formatMoney(inv.grand_total)}</td>
                    <td style={{ color: inv.balance_due > 0 ? '#fbbf24' : 'var(--success)', fontWeight: 600 }}>
                      {formatMoney(inv.balance_due)}
                    </td>
                    <td>
                      <span className={`badge badge-${inv.status}`}>{inv.status.replace('_', ' ')}</span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '0.4rem' }}>
                        <button 
                          className="btn btn-sm btn-secondary" 
                          onClick={() => onViewInvoice(inv.id)}
                          title="View / Print Invoice"
                        >
                          <Eye size={14} />
                          <span>View</span>
                        </button>
                        {inv.balance_due > 0 && (
                          <button 
                            className="btn btn-sm btn-primary" 
                            onClick={() => onRecordPayment(inv)}
                            title="Record Payment"
                          >
                            <CreditCard size={14} />
                            <span>Pay</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                    No invoices yet. Click "Create Invoice" to issue your first bill.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Payments Feed */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">
            <CreditCard size={18} style={{ color: 'var(--success)' }} />
            Recent Payment Transactions
          </h3>
          <button className="btn btn-sm btn-secondary" onClick={() => onNavigateTab('payments')}>
            <span>View Payments Ledger</span>
            <ArrowUpRight size={14} />
          </button>
        </div>

        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Payment Date</th>
                <th>Invoice #</th>
                <th>Customer</th>
                <th>Payment Method</th>
                <th>Reference ID</th>
                <th style={{ textAlign: 'right' }}>Amount Paid</th>
              </tr>
            </thead>
            <tbody>
              {stats.recent_payments && stats.recent_payments.length > 0 ? (
                stats.recent_payments.map((pmt) => (
                  <tr key={pmt.id}>
                    <td>{pmt.payment_date}</td>
                    <td className="font-mono">{pmt.invoice_number}</td>
                    <td style={{ fontWeight: 600 }}>{pmt.customer_name}</td>
                    <td>
                      <span className="badge" style={{ background: 'rgba(255,255,255,0.06)', color: '#fff' }}>
                        {pmt.payment_method}
                      </span>
                    </td>
                    <td className="font-mono" style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      {pmt.transaction_reference || 'N/A'}
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--success)' }}>
                      + {formatMoney(pmt.amount)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                    No payments recorded yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
