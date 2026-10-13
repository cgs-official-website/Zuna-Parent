import React, { useState } from 'react';
import { FiLifeBuoy } from 'react-icons/fi';
import { ticketsService } from '../../services/ticketsService';

const TicketRaiseForm = ({ products, initialProductId, initialProductName, onClose }) => {
  const [ticketForm, setTicketForm] = useState({
    name: '',
    email: '',
    productId: initialProductId || '',
    productName: initialProductName || '',
    subject: '',
    description: '',
    priority: 'medium'
  });
  const [ticketSuccess, setTicketSuccess] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleProductChange = (e) => {
    const selectedId = e.target.value;
    const selectedProd = products.find(p => p.id === selectedId);
    setTicketForm(prev => ({
      ...prev,
      productId: selectedId,
      productName: selectedProd ? selectedProd.name : ''
    }));
  };

  const handleTicketSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await ticketsService.addTicket({
        productId: ticketForm.productId,
        productName: ticketForm.productName,
        subject: ticketForm.subject,
        description: ticketForm.description,
        raisedBy: {
          name: ticketForm.name,
          email: ticketForm.email
        },
        priority: ticketForm.priority || 'medium'
      });
      setTicketSuccess(true);
    } catch (err) {
      console.error('Error submitting ticket:', err);
      setError('Error submitting ticket. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  if (ticketSuccess) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem 0' }}>
        <div style={{ width: '64px', height: '64px', background: 'rgba(255, 195, 0, 0.12)', borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)', marginBottom: '1.5rem' }}>
          <FiLifeBuoy size={32} />
        </div>
        <h3 style={{ fontSize: '1.75rem', marginBottom: '0.75rem', color: 'var(--primary)' }}>Support Ticket Raised!</h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginBottom: '2rem', maxWidth: '340px', marginLeft: 'auto', marginRight: 'auto' }}>
          Your support request for <strong>{ticketForm.productName}</strong> has been successfully registered. We will email updates to <strong>{ticketForm.email}</strong>.
        </p>
        <button className="btn btn-primary" onClick={onClose}>Close</button>
      </div>
    );
  }

  return (
    <>
      <h3 className="modal-title">Raise a Support Ticket</h3>
      <p className="modal-desc">Submit a technical ticket or request help for any of Zuna's products.</p>
      
      {error && (
        <div style={{ color: '#ef4444', background: 'rgba(239, 68, 68, 0.1)', padding: '0.75rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.9rem' }}>
          {error}
        </div>
      )}

      <form onSubmit={handleTicketSubmit}>
        <div className="form-group">
          <label className="form-label">Full Name</label>
          <input 
            type="text" 
            className="form-input" 
            placeholder="William Butcher" 
            value={ticketForm.name}
            onChange={(e) => setTicketForm(prev => ({ ...prev, name: e.target.value }))}
            required 
          />
        </div>
        <div className="form-group">
          <label className="form-label">Email Address</label>
          <input 
            type="email" 
            className="form-input" 
            placeholder="william@company.com" 
            value={ticketForm.email}
            onChange={(e) => setTicketForm(prev => ({ ...prev, email: e.target.value }))}
            required 
          />
        </div>
        <div className="form-group">
          <label className="form-label">Product</label>
          <select 
            className="form-select" 
            value={ticketForm.productId}
            onChange={handleProductChange}
            required
          >
            <option value="" disabled>Select the product...</option>
            {products.map(prod => (
              <option key={prod.id} value={prod.id}>{prod.name}</option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Priority Level</label>
          <select 
            className="form-select" 
            value={ticketForm.priority}
            onChange={(e) => setTicketForm(prev => ({ ...prev, priority: e.target.value }))}
          >
            <option value="low">Low Priority</option>
            <option value="medium">Medium Priority</option>
            <option value="high">High Priority</option>
            <option value="urgent">Urgent Priority (Critical)</option>
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Subject</label>
          <input 
            type="text" 
            className="form-input" 
            placeholder="Brief summary of the issue" 
            value={ticketForm.subject}
            onChange={(e) => setTicketForm(prev => ({ ...prev, subject: e.target.value }))}
            required 
          />
        </div>
        <div className="form-group">
          <label className="form-label">Ticket Details / Problem Description</label>
          <textarea 
            className="form-input" 
            style={{ minHeight: '120px', resize: 'vertical', paddingTop: '0.75rem' }}
            placeholder="Please describe the issue or help you need with the system..."
            value={ticketForm.description}
            onChange={(e) => setTicketForm(prev => ({ ...prev, description: e.target.value }))}
            required 
          />
        </div>
        <button type="submit" className="btn btn-primary modal-submit" disabled={loading}>
          {loading ? 'Submitting...' : 'Submit Ticket'}
        </button>
      </form>
    </>
  );
};

export default TicketRaiseForm;
