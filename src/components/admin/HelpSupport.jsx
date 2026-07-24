import React, { useState } from 'react';
import * as Icons from 'lucide-react';

const HelpSupport = () => {
  const [activeFaq, setActiveFaq] = useState(0);
  const [ticketSubject, setTicketSubject] = useState('');
  const [selectedProduct, setSelectedProduct] = useState('HRMS');
  const [ticketMessage, setTicketMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const faqs = [
    {
      q: 'How do I add or disable a multi-tenant client for HRMS or Restaurant POS?',
      a: 'Go to Product Manager from the sidebar. Each of the 6 SaaS products has a "Tenant Enabled" toggle button that allows instant activation or revocation of tenant access.'
    },
    {
      q: 'Where do I find the secret API keys for custom integration webhooks?',
      a: 'In Product Manager, click the "Manage" button on any product card to expand the settings drawer, which contains the product API key, feature flags, and rate limits.'
    },
    {
      q: 'How are support ticket escalation rules configured?',
      a: 'Tickets marked as "Urgent" automatically trigger real-time notification bells in the top navbar and assign senior support engineers.'
    },
    {
      q: 'Can I export analytics data for revenue and product usage?',
      a: 'Yes! Navigate to the Analytics / Reports tab in the sidebar to view detailed monthly metrics and click "Export CSV / PDF" at the top right.'
    }
  ];

  const handleSubmitTicket = (e) => {
    e.preventDefault();
    setSubmitted(true);
    setTicketSubject('');
    setTicketMessage('');
    setTimeout(() => setSubmitted(false), 3000);
  };

  return (
    <div className="admin-overview-container">
      {/* Header */}
      <div className="panel-header" style={{ marginBottom: '1.75rem' }}>
        <div>
          <h2 className="panel-title" style={{ fontSize: '1.5rem', margin: 0 }}>Help & Knowledge Base</h2>
          <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem', color: 'var(--admin-text-muted)' }}>
            Get instant assistance, browse multi-product SaaS guides, or submit an administrative support inquiry.
          </p>
        </div>
        {submitted && (
          <span style={{ background: '#00F5D4', color: '#0f172a', padding: '0.4rem 1rem', borderRadius: '50px', fontSize: '0.82rem', fontWeight: 700 }}>
            ✓ Support Ticket Submitted to Desk!
          </span>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1.75rem' }}>
        {/* FAQs */}
        <div className="admin-panel">
          <div className="panel-header" style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--admin-border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <div className="unified-admin-icon sm" style={{ background: 'rgba(0, 132, 255, 0.12)', color: 'var(--accent)' }}>
                <Icons.HelpCircle size={18} />
              </div>
              <span className="panel-title" style={{ fontSize: '1.1rem' }}>Frequently Asked Questions</span>
            </div>
          </div>

          <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {faqs.map((faq, idx) => {
              const isOpen = activeFaq === idx;
              return (
                <div 
                  key={idx}
                  onClick={() => setActiveFaq(isOpen ? null : idx)}
                  style={{
                    padding: '1rem',
                    borderRadius: '12px',
                    background: 'var(--theme-toggle-bg, rgba(255,255,255,0.03))',
                    border: '1px solid var(--admin-border)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 700, fontSize: '0.9rem', color: 'var(--admin-text-main)' }}>
                    <span>{faq.q}</span>
                    <Icons.ChevronDown size={16} style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease', color: 'var(--admin-text-muted)' }} />
                  </div>
                  {isOpen && (
                    <p style={{ margin: '0.65rem 0 0', fontSize: '0.84rem', color: 'var(--admin-text-muted)', lineHeight: 1.5 }}>
                      {faq.a}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Contact Support Form */}
        <div className="admin-panel">
          <div className="panel-header" style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--admin-border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <div className="unified-admin-icon sm" style={{ background: 'rgba(0, 245, 212, 0.12)', color: '#00F5D4' }}>
                <Icons.Send size={18} />
              </div>
              <span className="panel-title" style={{ fontSize: '1.1rem' }}>Contact Platform Support</span>
            </div>
          </div>

          <form onSubmit={handleSubmitTicket} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 600, color: 'var(--admin-text-main)', marginBottom: '0.35rem' }}>Related SaaS Product</label>
              <select 
                className="filter-select" 
                style={{ width: '100%' }}
                value={selectedProduct}
                onChange={(e) => setSelectedProduct(e.target.value)}
              >
                <option value="HRMS">HRMS Platform</option>
                <option value="Restaurant Management">Restaurant Management POS</option>
                <option value="College Management">College Management System</option>
                <option value="School Management">School Management Portal</option>
                <option value="Billing Software">Billing Software</option>
                <option value="CRM">CRM Software</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 600, color: 'var(--admin-text-main)', marginBottom: '0.35rem' }}>Issue Subject</label>
              <input 
                type="text" 
                className="admin-input" 
                placeholder="Brief summary of inquiry..." 
                value={ticketSubject}
                onChange={(e) => setTicketSubject(e.target.value)}
                required
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 600, color: 'var(--admin-text-main)', marginBottom: '0.35rem' }}>Detailed Message</label>
              <textarea 
                className="admin-textarea" 
                rows="4" 
                placeholder="Explain the problem or requirement..."
                value={ticketMessage}
                onChange={(e) => setTicketMessage(e.target.value)}
                required
                style={{ width: '100%', padding: '0.75rem', borderRadius: '10px', background: 'var(--admin-input-bg)', border: '1px solid var(--admin-border)', color: 'var(--admin-text-main)', fontSize: '0.85rem' }}
              />
            </div>

            <button type="submit" className="btn btn-primary" style={{ padding: '0.65rem 1.25rem', fontSize: '0.85rem', alignSelf: 'flex-start' }}>
              Submit Inquiry
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default HelpSupport;
