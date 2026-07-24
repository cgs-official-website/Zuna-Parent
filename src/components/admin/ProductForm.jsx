import React, { useState } from 'react';
import { productsService } from '../../services/productsService';

const availableIcons = [
  'Users', 'GraduationCap', 'Utensils', 'BookOpen', 'Receipt', 
  'Briefcase', 'Layers', 'Shield', 'Sparkles', 'PhoneCall', 
  'Activity', 'HelpCircle', 'Laptop', 'TrendingUp', 'HeartHandshake'
];

const ProductForm = ({ editingProduct, onClose, onRefresh }) => {
  const [productForm, setProductForm] = useState({
    name: editingProduct ? editingProduct.name : '',
    description: editingProduct ? editingProduct.description : '',
    targetAudience: editingProduct ? (editingProduct.targetAudience || '') : '',
    productUrl: editingProduct ? (editingProduct.productUrl || editingProduct.url || '') : '',
    icon: editingProduct ? (editingProduct.icon || 'Layers') : 'Layers',
    features: editingProduct ? (editingProduct.features || '') : '',
    status: editingProduct ? (editingProduct.status || 'Active') : 'Active'
  });
  const [urlError, setUrlError] = useState('');
  const [loading, setLoading] = useState(false);

  const validateUrl = (urlStr) => {
    if (!urlStr || urlStr.trim() === '') return true; // Optional field
    const trimmed = urlStr.trim();
    if (!/^https?:\/\//i.test(trimmed)) return false;
    try {
      new URL(trimmed);
      return true;
    } catch (_) {
      return false;
    }
  };

  const handleProductSubmit = async (e) => {
    e.preventDefault();
    setUrlError('');

    if (productForm.productUrl && !validateUrl(productForm.productUrl)) {
      setUrlError('Please enter a valid URL starting with http:// or https:// (e.g. https://example.com/hrms)');
      return;
    }

    setLoading(true);
    try {
      const dataToSave = {
        ...productForm,
        url: productForm.productUrl || '#products',
        isCustomStatus: true
      };

      if (editingProduct) {
        await productsService.updateProduct(editingProduct.id, dataToSave);
      } else {
        await productsService.addProduct(dataToSave);
      }
      onRefresh();
      onClose();
    } catch (err) {
      console.error('Error saving product:', err);
      alert('Failed to save product. Make sure you are an admin.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-modal-overlay" onClick={onClose} style={{ animation: 'fadeIn 0.3s ease' }}>
      <div className="admin-modal" onClick={(e) => e.stopPropagation()} style={{ animation: 'modalSlideInRight 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards' }}>
        <div className="admin-modal-header">
          <h3 className="admin-modal-title">{editingProduct ? 'Edit Product' : 'Add New Product'}</h3>
          <button className="admin-modal-close btn-interactive" onClick={onClose}>&times;</button>
        </div>

        <form onSubmit={handleProductSubmit}>
          <div className="admin-input-group admin-cascade-item" style={{ animationDelay: '0.05s' }}>
            <label>Product Name *</label>
            <input 
              type="text" 
              className="admin-input" 
              value={productForm.name}
              onChange={(e) => setProductForm(prev => ({ ...prev, name: e.target.value }))}
              required 
            />
          </div>

          <div className="admin-input-group admin-cascade-item" style={{ animationDelay: '0.1s' }}>
            <label>Description *</label>
            <textarea 
              className="admin-textarea" 
              value={productForm.description}
              onChange={(e) => setProductForm(prev => ({ ...prev, description: e.target.value }))}
              required 
            />
          </div>

          <div className="admin-input-group admin-cascade-item" style={{ animationDelay: '0.15s' }}>
            <label>Target Audience</label>
            <input 
              type="text" 
              className="admin-input" 
              placeholder="e.g. HR Managers & Enterprise Business"
              value={productForm.targetAudience}
              onChange={(e) => setProductForm(prev => ({ ...prev, targetAudience: e.target.value }))}
            />
          </div>

          <div className="admin-input-group admin-cascade-item" style={{ animationDelay: '0.2s' }}>
            <label>Product URL <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 'normal' }}>(Optional)</span></label>
            <input 
              type="text" 
              className="admin-input" 
              placeholder="https://example.com/hrms"
              maxLength={500}
              value={productForm.productUrl}
              onChange={(e) => {
                setProductForm(prev => ({ ...prev, productUrl: e.target.value }));
                if (urlError) setUrlError('');
              }}
              style={urlError ? { borderColor: '#ef4444' } : {}}
            />
            <small style={{ display: 'block', marginTop: '0.35rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
              Enter the product's website or documentation URL
            </small>
            {urlError && (
              <span style={{ color: '#ef4444', fontSize: '0.85rem', marginTop: '0.25rem', display: 'block' }}>
                {urlError}
              </span>
            )}
          </div>

          <div className="admin-form-grid admin-cascade-item" style={{ animationDelay: '0.25s' }}>
            <div className="admin-input-group">
              <label>Product Icon</label>
              <select 
                className="admin-input"
                value={productForm.icon}
                onChange={(e) => setProductForm(prev => ({ ...prev, icon: e.target.value }))}
              >
                {availableIcons.map(icon => (
                  <option key={icon} value={icon}>{icon}</option>
                ))}
              </select>
            </div>

            <div className="admin-input-group">
              <label>Status</label>
              <select 
                className="admin-input"
                value={productForm.status}
                onChange={(e) => setProductForm(prev => ({ ...prev, status: e.target.value }))}
              >
                <option value="Active">Active</option>
                <option value="Upcoming">Upcoming</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>

          <div className="admin-input-group admin-cascade-item" style={{ marginTop: '1rem', animationDelay: '0.3s' }}>
            <label>Key Features</label>
            <input 
              type="text" 
              className="admin-input" 
              placeholder="e.g. Payroll, Attendance, Employee Portal"
              value={productForm.features}
              onChange={(e) => setProductForm(prev => ({ ...prev, features: e.target.value }))}
            />
          </div>

          <div className="admin-cascade-item" style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '2rem', animationDelay: '0.35s' }}>
            <button type="button" className="btn btn-secondary btn-interactive" onClick={onClose} style={{ padding: '0.75rem 1.5rem' }}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary btn-interactive" style={{ padding: '0.75rem 1.5rem' }} disabled={loading}>
              {loading ? 'Saving...' : 'Save Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProductForm;

