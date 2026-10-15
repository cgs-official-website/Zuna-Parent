import React, { useState } from 'react';
import { FiCreditCard, FiDollarSign, FiCheckCircle, FiAlertCircle, FiClock, FiFileText } from 'react-icons/fi';
import { useBilling } from '../../hooks/useBilling.js';
import { TableSkeleton } from '../common/Skeleton.jsx';

export const BillingManager = () => {
  const { subscriptions, invoices, loading, markInvoicePaid } = useBilling();
  const [activeTab, setActiveTab] = useState('invoices');

  const formatPaise = (paise) => {
    if (typeof paise !== 'number') return '₹0';
    return `₹${(paise / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
  };

  return (
    <div className="admin-container">
      {/* Header */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 'var(--space-4)',
          marginBottom: 'var(--space-6)'
        }}
      >
        <div>
          <h1 style={{ fontSize: '1.75rem', marginBottom: '4px' }}>Billing & Invoicing Command</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            Multi-product customer subscriptions and automated recurring invoices.
          </p>
        </div>

        {/* Tab Toggle */}
        <div
          style={{
            display: 'flex',
            background: 'var(--surface-2)',
            padding: '3px',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border)'
          }}
        >
          <button
            onClick={() => setActiveTab('invoices')}
            style={{
              padding: '6px 14px',
              fontSize: '0.8125rem',
              fontWeight: 600,
              borderRadius: 'var(--radius-xs)',
              background: activeTab === 'invoices' ? 'var(--accent)' : 'transparent',
              color: activeTab === 'invoices' ? 'var(--accent-contrast)' : 'var(--text-secondary)'
            }}
          >
            Invoices ({invoices.length})
          </button>
          <button
            onClick={() => setActiveTab('subscriptions')}
            style={{
              padding: '6px 14px',
              fontSize: '0.8125rem',
              fontWeight: 600,
              borderRadius: 'var(--radius-xs)',
              background: activeTab === 'subscriptions' ? 'var(--accent)' : 'transparent',
              color: activeTab === 'subscriptions' ? 'var(--accent-contrast)' : 'var(--text-secondary)'
            }}
          >
            Subscriptions ({subscriptions.length})
          </button>
        </div>
      </div>

      {loading ? (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <TableSkeleton rows={5} cols={5} />
        </div>
      ) : activeTab === 'invoices' ? (
        <>
          {/* Desktop Invoices Table */}
          <div className="table-container hide-on-mobile">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Invoice #</th>
                  <th>Customer</th>
                  <th>Product</th>
                  <th>Amount (₹)</th>
                  <th>Status</th>
                  <th>Due Date</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {invoices.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: 'var(--space-8)', color: 'var(--text-muted)' }}>
                      No invoices recorded yet.
                    </td>
                  </tr>
                ) : (
                  invoices.map((inv) => {
                    const isOverdue = inv.status === 'OVERDUE';
                    const isPaid = inv.status === 'PAID';

                    return (
                      <tr key={inv.id}>
                        <td style={{ fontWeight: 800, color: 'var(--accent)' }}>
                          {inv.invoiceNumber || `#${inv.id}`}
                        </td>
                        <td>
                          <div style={{ fontWeight: 600 }}>{inv.customerName || inv.subscription?.customerName || 'Customer'}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{inv.customerEmail}</div>
                        </td>
                        <td>{inv.product?.title || inv.subscription?.product?.title || 'SaaS Plan'}</td>
                        <td style={{ fontWeight: 700, fontSize: '0.9375rem' }}>
                          {formatPaise(inv.amountPaise)}
                        </td>
                        <td>
                          <span
                            className={`badge ${isPaid ? 'badge-resolved' : isOverdue ? 'badge-urgent badge-pulse' : 'badge-progress'}`}
                          >
                            <span className="badge-dot" />
                            {inv.status}
                          </span>
                        </td>
                        <td style={{ fontSize: '0.8125rem', color: isOverdue ? 'var(--danger)' : 'var(--text-secondary)' }}>
                          {inv.dueDate ? new Date(inv.dueDate).toLocaleDateString() : 'N/A'}
                        </td>
                        <td>
                          {!isPaid && (
                            <button
                              onClick={() => markInvoicePaid(inv.id)}
                              className="btn-secondary"
                              style={{ padding: '4px 10px', fontSize: '0.75rem', gap: '4px' }}
                            >
                              <FiCheckCircle size={14} color="var(--success)" />
                              <span>Mark Paid</span>
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Invoices Cards */}
          <div className="show-on-mobile mobile-card-list">
            {invoices.length === 0 ? (
              <div className="card" style={{ textAlign: 'center', padding: 'var(--space-6)', color: 'var(--text-muted)' }}>
                No invoices recorded yet.
              </div>
            ) : (
              invoices.map((inv) => {
                const isOverdue = inv.status === 'OVERDUE';
                const isPaid = inv.status === 'PAID';

                return (
                  <div key={inv.id} className="mobile-card-item">
                    <div className="mobile-card-header">
                      <div>
                        <span style={{ fontWeight: 800, color: 'var(--accent)', fontSize: '0.9rem' }}>
                          {inv.invoiceNumber || `#${inv.id}`}
                        </span>
                        <div style={{ fontWeight: 700, fontSize: '0.95rem', marginTop: '2px' }}>
                          {inv.customerName || inv.subscription?.customerName || 'Customer'}
                        </div>
                      </div>
                      <span
                        className={`badge ${isPaid ? 'badge-resolved' : isOverdue ? 'badge-urgent badge-pulse' : 'badge-progress'}`}
                      >
                        <span className="badge-dot" />
                        {inv.status}
                      </span>
                    </div>

                    <div className="mobile-card-body">
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Product:</span>
                        <span style={{ fontWeight: 600 }}>{inv.product?.title || inv.subscription?.product?.title || 'SaaS Plan'}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Amount:</span>
                        <span style={{ fontWeight: 800, color: 'var(--accent)', fontSize: '1rem' }}>{formatPaise(inv.amountPaise)}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Due Date:</span>
                        <span>{inv.dueDate ? new Date(inv.dueDate).toLocaleDateString() : 'N/A'}</span>
                      </div>
                    </div>

                    {!isPaid && (
                      <div className="mobile-card-footer" style={{ justifyContent: 'flex-end' }}>
                        <button
                          onClick={() => markInvoicePaid(inv.id)}
                          className="btn-primary"
                          style={{ padding: '6px 14px', fontSize: '0.8rem', gap: '6px' }}
                        >
                          <FiCheckCircle size={14} />
                          <span>Mark Paid</span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </>
      ) : (
        <>
          {/* Desktop Subscriptions Table */}
          <div className="table-container hide-on-mobile">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Subscription ID</th>
                  <th>Customer</th>
                  <th>Product</th>
                  <th>Monthly Rate</th>
                  <th>Status</th>
                  <th>Next Billing Date</th>
                </tr>
              </thead>
              <tbody>
                {subscriptions.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: 'var(--space-8)', color: 'var(--text-muted)' }}>
                      No active subscriptions yet.
                    </td>
                  </tr>
                ) : (
                  subscriptions.map((sub) => (
                    <tr key={sub.id}>
                      <td style={{ fontWeight: 700, color: 'var(--accent)' }}>#{sub.id}</td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{sub.customerName}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{sub.customerEmail}</div>
                      </td>
                      <td>{sub.product?.title || 'SaaS Application'}</td>
                      <td style={{ fontWeight: 700 }}>
                        {formatPaise(sub.amountPaise)} / mo
                      </td>
                      <td>
                        <span className={`badge ${sub.status === 'ACTIVE' ? 'badge-resolved' : 'badge-low'}`}>
                          <span className="badge-dot" />
                          {sub.status}
                        </span>
                      </td>
                      <td style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                        {sub.nextBillingDate ? new Date(sub.nextBillingDate).toLocaleDateString() : 'Active'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Subscriptions Cards */}
          <div className="show-on-mobile mobile-card-list">
            {subscriptions.length === 0 ? (
              <div className="card" style={{ textAlign: 'center', padding: 'var(--space-6)', color: 'var(--text-muted)' }}>
                No active subscriptions yet.
              </div>
            ) : (
              subscriptions.map((sub) => (
                <div key={sub.id} className="mobile-card-item">
                  <div className="mobile-card-header">
                    <div>
                      <span style={{ fontWeight: 800, color: 'var(--accent)', fontSize: '0.875rem' }}>
                        #{sub.id}
                      </span>
                      <div style={{ fontWeight: 700, fontSize: '0.95rem', marginTop: '2px' }}>
                        {sub.customerName}
                      </div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{sub.customerEmail}</span>
                    </div>
                    <span className={`badge ${sub.status === 'ACTIVE' ? 'badge-resolved' : 'badge-low'}`}>
                      <span className="badge-dot" />
                      {sub.status}
                    </span>
                  </div>

                  <div className="mobile-card-body">
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Product:</span>
                      <span style={{ fontWeight: 600 }}>{sub.product?.title || 'SaaS Application'}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Rate:</span>
                      <span style={{ fontWeight: 700, color: 'var(--accent)' }}>{formatPaise(sub.amountPaise)} / mo</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Next Bill Date:</span>
                      <span>{sub.nextBillingDate ? new Date(sub.nextBillingDate).toLocaleDateString() : 'Active'}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default BillingManager;
