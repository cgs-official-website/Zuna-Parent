import React, { useState, useEffect } from 'react';
import * as Icons from 'lucide-react';
import { billingService } from '../../services/billingService';
import Skeleton from '../common/Skeleton';

const BillingManager = () => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    clientName: '',
    planName: 'Enterprise SaaS Suite',
    amount: '',
    status: 'Paid',
    invoiceDate: new Date().toISOString().split('T')[0]
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const data = await billingService.getBillingData();
      setInvoices(data);
    } catch (err) {
      console.error('Error fetching billing data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  const handleAddInvoice = async (e) => {
    e.preventDefault();
    if (!formData.clientName.trim() || !formData.amount) return;
    setSubmitting(true);
    try {
      await billingService.addInvoice(formData);
      setFormData({
        clientName: '',
        planName: 'Enterprise SaaS Suite',
        amount: '',
        status: 'Paid',
        invoiceDate: new Date().toISOString().split('T')[0]
      });
      setShowAddModal(false);
      fetchInvoices();
    } catch (err) {
      console.error('Error adding invoice:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const totalCollected = invoices
    .filter(i => i.status === 'Paid')
    .reduce((acc, curr) => acc + (parseFloat(curr.amount) || 0), 0);

  return (
    <div className="admin-overview-container">
      {/* Header Bar */}
      <div className="panel-header" style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 className="panel-title" style={{ fontSize: '1.4rem', margin: 0, color: 'var(--admin-text-main)' }}>Billing & Subscriptions</h2>
          <p style={{ margin: '0.2rem 0 0', fontSize: '0.84rem', color: 'var(--admin-text-muted)' }}>
            Track client SaaS subscriptions, recurring revenue billing, and invoice records.
          </p>
        </div>

        <button
          className="btn btn-primary"
          onClick={() => setShowAddModal(true)}
          style={{ padding: '0.55rem 1.1rem', fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
        >
          <Icons.CreditCard size={16} />
          <span>Record New Invoice</span>
        </button>
      </div>

      {/* Integration Notice Alert */}
      <div style={{ background: 'rgba(0, 132, 255, 0.08)', border: '1px solid rgba(0, 132, 255, 0.25)', borderRadius: '12px', padding: '0.9rem 1.2rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <Icons.Info size={20} style={{ color: 'var(--accent)', flexShrink: 0 }} />
        <div style={{ fontSize: '0.83rem', color: 'var(--admin-text-main)' }}>
          <strong>Payment Gateway Integration Pending:</strong> Automated webhook sync with Stripe / Razorpay is currently unconfigured. Manual invoice entry is supported below.
        </div>
      </div>

      {/* Overview Stat Cards */}
      <div className="admin-stats-grid" style={{ marginBottom: '1.5rem' }}>
        <div className="admin-stat-card">
          <div className="stat-card-header">
            <div className="unified-admin-icon" style={{ background: 'rgba(16, 185, 129, 0.12)', color: '#10b981' }}>
              <Icons.IndianRupee size={20} />
            </div>
          </div>
          <div className="stat-card-body">
            <span className="stat-value">₹{totalCollected.toLocaleString()}</span>
            <span className="stat-label">Total Real Revenue Collected</span>
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="stat-card-header">
            <div className="unified-admin-icon" style={{ background: 'rgba(0, 132, 255, 0.12)', color: 'var(--accent)' }}>
              <Icons.FileText size={20} />
            </div>
          </div>
          <div className="stat-card-body">
            <span className="stat-value">{invoices.length}</span>
            <span className="stat-label">Total Invoices Recorded</span>
          </div>
        </div>
      </div>

      {/* Invoices Table / Empty State */}
      <div className="admin-panel">
        {loading ? (
          <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {[1, 2, 3].map(idx => (
              <Skeleton key={idx} width="100%" height="45px" borderRadius="8px" />
            ))}
          </div>
        ) : invoices.length === 0 ? (
          <div style={{ padding: '3.5rem 1.5rem', textAlign: 'center', color: 'var(--admin-text-muted)' }}>
            <Icons.Receipt size={44} style={{ opacity: 0.3, margin: '0 auto 1rem', display: 'block' }} />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0 0 0.4rem', color: 'var(--admin-text-main)' }}>No Billing History Found</h3>
            <p style={{ fontSize: '0.85rem', margin: '0 0 1.5rem', color: 'var(--admin-text-muted)', maxWidth: '420px', marginLeft: 'auto', marginRight: 'auto' }}>
              No client payment invoices or subscriptions have been created in the database yet. Click below to record a subscription payment or invoice manually.
            </p>
            <button
              className="btn btn-primary"
              onClick={() => setShowAddModal(true)}
              style={{ padding: '0.55rem 1.2rem', fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
            >
              <Icons.CreditCard size={16} /> Record First Invoice
            </button>
          </div>
        ) : (
          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Client / Tenant</th>
                  <th>Subscription Plan</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map(inv => (
                  <tr key={inv.id}>
                    <td style={{ fontWeight: 700, color: 'var(--admin-text-main)' }}>{inv.clientName}</td>
                    <td style={{ color: 'var(--admin-text-muted)' }}>{inv.planName}</td>
                    <td style={{ fontWeight: 700, color: 'var(--admin-text-main)' }}>₹{parseFloat(inv.amount).toLocaleString()}</td>
                    <td>
                      <span style={{
                        padding: '0.2rem 0.65rem',
                        borderRadius: '50px',
                        fontSize: '0.74rem',
                        fontWeight: 700,
                        background: inv.status === 'Paid' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                        color: inv.status === 'Paid' ? '#10b981' : '#ef4444'
                      }}>
                        {inv.status}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--admin-text-muted)' }}>{inv.invoiceDate || 'Recent'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Record Invoice Modal */}
      {showAddModal && (
        <div className="modal-backdrop" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="modal-content" style={{ background: 'var(--admin-card-bg)', border: '1px solid var(--admin-border)', borderRadius: '16px', padding: '1.5rem', width: '90%', maxWidth: '450px', boxShadow: '0 20px 40px rgba(0,0,0,0.4)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.15rem', color: 'var(--admin-text-main)' }}>Record Subscription Invoice</h3>
              <button onClick={() => setShowAddModal(false)} style={{ background: 'none', border: 'none', color: 'var(--admin-text-muted)', cursor: 'pointer' }}>
                <Icons.X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddInvoice} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--admin-text-muted)', marginBottom: '0.35rem' }}>Client / Tenant Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Acme Enterprise"
                  value={formData.clientName}
                  onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                  style={{ width: '100%', height: '38px', padding: '0 0.75rem', borderRadius: '8px', border: '1px solid var(--admin-border)', background: 'var(--admin-input-bg)', color: 'var(--admin-text-main)' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--admin-text-muted)', marginBottom: '0.35rem' }}>Subscription Plan</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. HRMS Platform Tier 1"
                  value={formData.planName}
                  onChange={(e) => setFormData({ ...formData, planName: e.target.value })}
                  style={{ width: '100%', height: '38px', padding: '0 0.75rem', borderRadius: '8px', border: '1px solid var(--admin-border)', background: 'var(--admin-input-bg)', color: 'var(--admin-text-main)' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--admin-text-muted)', marginBottom: '0.35rem' }}>Amount (₹)</label>
                <input
                  type="number"
                  required
                  placeholder="5000"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  style={{ width: '100%', height: '38px', padding: '0 0.75rem', borderRadius: '8px', border: '1px solid var(--admin-border)', background: 'var(--admin-input-bg)', color: 'var(--admin-text-main)' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--admin-text-muted)', marginBottom: '0.35rem' }}>Payment Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  style={{ width: '100%', height: '38px', padding: '0 0.75rem', borderRadius: '8px', border: '1px solid var(--admin-border)', background: 'var(--admin-input-bg)', color: 'var(--admin-text-main)' }}
                >
                  <option value="Paid">Paid</option>
                  <option value="Pending">Pending</option>
                  <option value="Overdue">Overdue</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.65rem', marginTop: '0.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Saving...' : 'Record Invoice'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BillingManager;
