import React, { useEffect, useState } from 'react';
import { X, Printer, CreditCard, Download, CheckCircle2 } from 'lucide-react';
import { api } from '../services/api';

export default function InvoicePrintModal({ 
  invoiceId, 
  onClose, 
  currency, 
  onRecordPayment 
}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!invoiceId) return;
    setLoading(true);
    api.getInvoice(invoiceId)
      .then((res) => {
        setData(res);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [invoiceId]);

  if (!invoiceId) return null;

  const handlePrint = () => {
    window.print();
  };

  const formatMoney = (val) => `${currency} ${(Number(val) || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <div className="modal-overlay">
      <div className="modal-container modal-lg" style={{ maxHeight: '95vh' }}>
        <div className="modal-header no-print">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <h3>Invoice Preview & Print</h3>
            {data && (
              <span className={`badge badge-${data.invoice.status}`}>
                {data.invoice.status.replace('_', ' ')}
              </span>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <button className="btn btn-sm btn-primary" onClick={handlePrint}>
              <Printer size={15} />
              <span>Print / Save PDF</span>
            </button>
            {data && data.invoice.balance_due > 0 && (
              <button 
                className="btn btn-sm btn-success" 
                onClick={() => {
                  onClose();
                  onRecordPayment(data.invoice);
                }}
              >
                <CreditCard size={15} />
                <span>Record Payment</span>
              </button>
            )}
            <button className="modal-close-btn" onClick={onClose}>
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="modal-body" style={{ background: '#f1f5f9', padding: '2rem' }}>
          {loading && <div style={{ color: '#000', textAlign: 'center', padding: '2rem' }}>Loading invoice details...</div>}
          {error && <div style={{ color: 'red', textAlign: 'center' }}>Error: {error}</div>}

          {data && (
            <div className="invoice-print-wrapper">
              {/* Header */}
              <div className="inv-print-header">
                <div className="inv-company-brand">
                  <h2>{data.company?.company_name || 'Apex Innovations Inc.'}</h2>
                  <p>{data.company?.tagline || 'Enterprise Software & Cloud Services'}</p>
                  <p style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: '#64748b' }}>
                    {data.company?.address}<br />
                    Phone: {data.company?.phone} | Email: {data.company?.email}<br />
                    Tax ID / GSTIN: <strong>{data.company?.tax_id}</strong>
                  </p>
                </div>

                <div className="inv-meta-right">
                  <div className="inv-meta-title">INVOICE</div>
                  <div className="inv-meta-num">{data.invoice.invoice_number}</div>
                  <div style={{ marginTop: '0.6rem', fontSize: '0.82rem', color: '#475569' }}>
                    <div>Date of Issue: <strong>{data.invoice.issue_date}</strong></div>
                    <div>Payment Due: <strong style={{ color: data.invoice.status === 'overdue' ? '#dc2626' : 'inherit' }}>{data.invoice.due_date}</strong></div>
                    <div style={{ marginTop: '0.3rem' }}>
                      Status: <span style={{ textTransform: 'uppercase', fontWeight: 800, color: data.invoice.status === 'paid' ? '#059669' : data.invoice.status === 'overdue' ? '#dc2626' : '#d97706' }}>{data.invoice.status.replace('_', ' ')}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Billed To / Billed From */}
              <div className="inv-parties-grid">
                <div>
                  <div className="inv-party-title">Billed To (Client):</div>
                  <div className="inv-party-name">{data.customer?.name}</div>
                  {data.customer?.company_name && (
                    <div style={{ fontWeight: 600, color: '#334155', fontSize: '0.9rem' }}>{data.customer.company_name}</div>
                  )}
                  <div className="inv-party-details">
                    {data.customer?.billing_address || 'Address on file'}<br />
                    {data.customer?.email && <span>Email: {data.customer.email}<br /></span>}
                    {data.customer?.phone && <span>Phone: {data.customer.phone}<br /></span>}
                    {data.customer?.tax_id && <span>Tax ID: {data.customer.tax_id}</span>}
                  </div>
                </div>

                <div>
                  <div className="inv-party-title">Payment & Banking Details:</div>
                  <div style={{ fontSize: '0.85rem', color: '#334155', lineHeight: 1.5 }}>
                    <div>Bank Name: <strong>{data.company?.bank_name || 'Silicon Valley Commercial Bank'}</strong></div>
                    <div>Account No: <strong>{data.company?.bank_account_no || '987654321098'}</strong></div>
                    <div>Routing / IFSC: <strong>{data.company?.bank_routing_no || '121000358'}</strong></div>
                    <div style={{ marginTop: '0.4rem', color: '#64748b', fontSize: '0.78rem' }}>
                      Please cite <strong>{data.invoice.invoice_number}</strong> on wire references.
                    </div>
                  </div>
                </div>
              </div>

              {/* Items Table */}
              <table className="inv-print-table">
                <thead>
                  <tr>
                    <th style={{ width: '40%' }}>Description / Service</th>
                    <th style={{ width: '12%', textAlign: 'center' }}>Qty</th>
                    <th style={{ width: '16%', textAlign: 'right' }}>Unit Price</th>
                    <th style={{ width: '12%', textAlign: 'center' }}>Tax %</th>
                    <th style={{ width: '20%', textAlign: 'right' }}>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {data.items && data.items.map((item, idx) => (
                    <tr key={idx}>
                      <td>
                        <strong style={{ color: '#0f172a' }}>{item.item_name}</strong>
                        {item.description && (
                          <div style={{ fontSize: '0.76rem', color: '#64748b', marginTop: '2px' }}>{item.description}</div>
                        )}
                      </td>
                      <td style={{ textAlign: 'center' }}>{item.quantity}</td>
                      <td style={{ textAlign: 'right' }}>{formatMoney(item.unit_price)}</td>
                      <td style={{ textAlign: 'center' }}>{item.tax_rate}%</td>
                      <td style={{ textAlign: 'right', fontWeight: 600, color: '#0f172a' }}>{formatMoney(item.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Totals Breakdown */}
              <div className="inv-print-totals-wrap">
                <div className="inv-print-totals-box">
                  <div className="inv-print-total-row">
                    <span>Subtotal:</span>
                    <span>{formatMoney(data.invoice.subtotal)}</span>
                  </div>
                  <div className="inv-print-total-row">
                    <span>Tax Total:</span>
                    <span>{formatMoney(data.invoice.tax_total)}</span>
                  </div>
                  {data.invoice.discount_total > 0 && (
                    <div className="inv-print-total-row" style={{ color: '#059669' }}>
                      <span>Discount:</span>
                      <span>- {formatMoney(data.invoice.discount_total)}</span>
                    </div>
                  )}
                  <div className="inv-print-total-row final">
                    <span>Grand Total:</span>
                    <span>{formatMoney(data.invoice.grand_total)}</span>
                  </div>
                  <div className="inv-print-total-row" style={{ marginTop: '0.4rem', color: '#059669' }}>
                    <span>Amount Paid:</span>
                    <span>{formatMoney(data.invoice.paid_amount)}</span>
                  </div>
                  <div className="inv-print-total-row" style={{ fontWeight: 800, fontSize: '1rem', color: data.invoice.balance_due > 0 ? '#b45309' : '#059669' }}>
                    <span>Balance Due:</span>
                    <span>{formatMoney(data.invoice.balance_due)}</span>
                  </div>
                </div>
              </div>

              {/* Payment History on this invoice */}
              {data.payments && data.payments.length > 0 && (
                <div style={{ marginBottom: '1.5rem', background: '#f8fafc', padding: '1rem', borderRadius: '6px' }}>
                  <div style={{ fontSize: '0.76rem', fontWeight: 700, textTransform: 'uppercase', color: '#64748b', marginBottom: '0.5rem' }}>
                    Payments Recorded:
                  </div>
                  {data.payments.map((p, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: '#334155', padding: '0.2rem 0' }}>
                      <span>✓ {p.payment_date} via {p.payment_method} {p.transaction_reference ? `(Ref: ${p.transaction_reference})` : ''}</span>
                      <strong style={{ color: '#059669' }}>{formatMoney(p.amount)}</strong>
                    </div>
                  ))}
                </div>
              )}

              {/* Footer Terms & Signatures */}
              <div className="inv-print-footer">
                <div>
                  <div style={{ fontWeight: 700, color: '#0f172a', marginBottom: '0.2rem' }}>Terms & Instructions:</div>
                  <p>{data.invoice.terms || data.company?.payment_terms || 'Payment due within terms specified.'}</p>
                  {data.invoice.notes && (
                    <p style={{ marginTop: '0.4rem', fontStyle: 'italic' }}>Note: {data.invoice.notes}</p>
                  )}
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ height: '40px', borderBottom: '1px solid #94a3b8', width: '160px', marginLeft: 'auto', marginBottom: '0.4rem' }}></div>
                  <div style={{ fontSize: '0.78rem', fontWeight: 600, color: '#334155' }}>Authorized Signature</div>
                  <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Apex Technologies Inc.</div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer no-print">
          <button className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
          <button className="btn btn-primary" onClick={handlePrint}>
            <Printer size={16} />
            <span>Print Invoice</span>
          </button>
        </div>
      </div>
    </div>
  );
}
