import React, { useState, useEffect } from 'react';
import { BarChart3, Download, Calendar, Users, Package, RefreshCw } from 'lucide-react';
import { api } from '../services/api';

export default function ReportsView({ currency }) {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchReports = () => {
    setLoading(true);
    api.getReportsSummary({ start_date: startDate, end_date: endDate })
      .then(res => setData(res))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchReports();
  }, [startDate, endDate]);

  const formatMoney = (val) => `${currency} ${(Number(val) || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const setPreset = (type) => {
    const now = new Date();
    if (type === 'all') {
      setStartDate('');
      setEndDate('');
    } else if (type === 'this_month') {
      const first = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      const last = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
      setStartDate(first);
      setEndDate(last);
    } else if (type === 'this_year') {
      const first = new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0];
      const last = new Date(now.getFullYear(), 11, 31).toISOString().split('T')[0];
      setStartDate(first);
      setEndDate(last);
    }
  };

  const handleExportCSV = () => {
    if (!data) return;
    let csv = "Report: Apex Billing Summary\n";
    csv += `Date Range: ${startDate || 'All Time'} to ${endDate || 'All Time'}\n\n`;
    csv += "--- FINANCIAL METRICS ---\n";
    csv += `Gross Sales,${data.totals?.gross_sales || 0}\n`;
    csv += `Total Tax Collected,${data.totals?.total_tax_collected || 0}\n`;
    csv += `Discounts,${data.totals?.total_discounts || 0}\n`;
    csv += `Net Billed,${data.totals?.net_billed || 0}\n`;
    csv += `Total Received,${data.totals?.total_received || 0}\n`;
    csv += `Total Outstanding,${data.totals?.total_outstanding || 0}\n\n`;

    csv += "--- TOP CUSTOMERS ---\n";
    csv += "Customer Name,Company,Invoices,Total Amount,Paid Amount,Outstanding\n";
    (data.top_customers || []).forEach(c => {
      csv += `"${c.name}","${c.company_name || ''}",${c.invoices_count},${c.total_amount},${c.paid_amount},${c.outstanding}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `billing_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const totals = data?.totals || {};

  return (
    <div>
      {/* Header */}
      <div className="view-header">
        <div className="view-title-group">
          <h2>Tax & Financial Reports</h2>
          <p>Revenue analysis, sales taxes collected, client receivables, and audit reports</p>
        </div>
        <div className="header-actions">
          <button className="btn btn-secondary" onClick={handleExportCSV}>
            <Download size={15} />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Date Filter Bar */}
      <div className="card" style={{ padding: '1.2rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Calendar size={16} />
              Date Filter:
            </span>
            <input 
              type="date" 
              className="form-input" 
              style={{ width: 'auto' }}
              value={startDate} 
              onChange={(e) => setStartDate(e.target.value)} 
            />
            <span style={{ color: 'var(--text-dim)' }}>to</span>
            <input 
              type="date" 
              className="form-input" 
              style={{ width: 'auto' }}
              value={endDate} 
              onChange={(e) => setEndDate(e.target.value)} 
            />
            <button className="btn btn-sm btn-secondary" onClick={fetchReports}>
              <RefreshCw size={14} />
            </button>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className="btn btn-sm btn-secondary" onClick={() => setPreset('all')}>All Time</button>
            <button className="btn btn-sm btn-secondary" onClick={() => setPreset('this_month')}>This Month</button>
            <button className="btn btn-sm btn-secondary" onClick={() => setPreset('this_year')}>This Year</button>
          </div>
        </div>
      </div>

      {/* KPI Cards for Report */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-label">Gross Subtotal</div>
          <div className="kpi-value" style={{ marginTop: '0.5rem' }}>{formatMoney(totals.gross_sales)}</div>
          <div className="kpi-subtext">Before taxes & discounts</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-label">Total Tax Collected</div>
          <div className="kpi-value" style={{ marginTop: '0.5rem', color: 'var(--accent-cyan)' }}>{formatMoney(totals.total_tax_collected)}</div>
          <div className="kpi-subtext">Sales tax & GST liability</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-label">Net Billed Revenue</div>
          <div className="kpi-value" style={{ marginTop: '0.5rem', color: '#fff' }}>{formatMoney(totals.net_billed)}</div>
          <div className="kpi-subtext">{totals.invoice_count || 0} invoices issued in period</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-label">Total Realized Cash</div>
          <div className="kpi-value" style={{ marginTop: '0.5rem', color: 'var(--success)' }}>{formatMoney(totals.total_received)}</div>
          <div className="kpi-subtext">Outstanding: {formatMoney(totals.total_outstanding)}</div>
        </div>
      </div>

      {/* Top Clients by Revenue */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '1.5rem' }}>
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">
              <Users size={18} style={{ color: 'var(--primary)' }} />
              Top Clients by Billed Volume
            </h3>
          </div>
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Client</th>
                  <th>Invoices</th>
                  <th>Total Billed</th>
                  <th>Collected</th>
                  <th>Balance</th>
                </tr>
              </thead>
              <tbody>
                {data?.top_customers && data.top_customers.length > 0 ? (
                  data.top_customers.map(c => (
                    <tr key={c.id}>
                      <td>
                        <div style={{ fontWeight: 600 }}>{c.name}</div>
                        <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>{c.company_name}</div>
                      </td>
                      <td>{c.invoices_count}</td>
                      <td style={{ fontWeight: 700 }}>{formatMoney(c.total_amount)}</td>
                      <td style={{ color: 'var(--success)', fontWeight: 600 }}>{formatMoney(c.paid_amount)}</td>
                      <td style={{ color: c.outstanding > 0 ? '#fbbf24' : 'var(--text-muted)', fontWeight: 600 }}>
                        {formatMoney(c.outstanding)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan="5" style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)' }}>No customer data</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Product Sales Breakdown */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">
              <Package size={18} style={{ color: 'var(--accent-cyan)' }} />
              Top Services & Product Sales
            </h3>
          </div>
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Service / Product</th>
                  <th>Category</th>
                  <th>Qty Sold</th>
                  <th>Total Revenue</th>
                  <th>Tax</th>
                </tr>
              </thead>
              <tbody>
                {data?.product_sales && data.product_sales.length > 0 ? (
                  data.product_sales.map((p, idx) => (
                    <tr key={idx}>
                      <td style={{ fontWeight: 600 }}>{p.item_name}</td>
                      <td>
                        <span className="badge" style={{ background: 'rgba(255,255,255,0.06)', color: 'var(--text-muted)' }}>
                          {p.category}
                        </span>
                      </td>
                      <td>{p.total_qty_sold}</td>
                      <td style={{ fontWeight: 700 }}>{formatMoney(p.total_revenue)}</td>
                      <td style={{ color: 'var(--text-muted)' }}>{formatMoney(p.total_tax)}</td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan="5" style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)' }}>No product sales recorded in period</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
