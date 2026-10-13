import React, { useState, useEffect } from 'react';

export const ProductForm = ({ product, onSubmit, onCancel, loading }) => {
  const [title, setTitle] = useState(product?.title || '');
  const [category, setCategory] = useState(product?.category || 'HRMS');
  const [badge, setBadge] = useState(product?.badge || '');
  const [description, setDescription] = useState(product?.description || '');
  const [tier, setTier] = useState(product?.tier || 'PRO');
  const [demoUrl, setDemoUrl] = useState(product?.demoUrl || '');

  useEffect(() => {
    if (product) {
      setTitle(product.title || '');
      setCategory(product.category || 'HRMS');
      setBadge(product.badge || '');
      setDescription(product.description || '');
      setTier(product.tier || 'PRO');
      setDemoUrl(product.demoUrl || '');
    }
  }, [product]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    onSubmit({
      title: title.trim(),
      category,
      badge: badge.trim(),
      description: description.trim(),
      tier,
      demoUrl: demoUrl.trim()
    });
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
      <div>
        <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '6px' }}>
          Product Title
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Clinic Management System"
          required
          className="input-field"
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <div>
          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '6px' }}>
            Category Vertical
          </label>
          <select value={category} onChange={(e) => setCategory(e.target.value)} className="input-field">
            <option value="HRMS">HRMS (Attendance)</option>
            <option value="CLINIC">Clinic MS</option>
            <option value="SCHOOL">School MS</option>
            <option value="COLLEGE">College MS</option>
            <option value="HOSPITAL">Hospital MS</option>
            <option value="GENERAL">General Support</option>
          </select>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '6px' }}>
            Subscription Tier
          </label>
          <select value={tier} onChange={(e) => setTier(e.target.value)} className="input-field">
            <option value="STARTER">Starter</option>
            <option value="PRO">Pro</option>
            <option value="ENTERPRISE">Enterprise</option>
          </select>
        </div>
      </div>

      <div>
        <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '6px' }}>
          Badge Tag (Optional)
        </label>
        <input
          type="text"
          value={badge}
          onChange={(e) => setBadge(e.target.value)}
          placeholder="e.g. Popular, Healthcare, Campus"
          className="input-field"
        />
      </div>

      <div>
        <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '6px' }}>
          Description
        </label>
        <textarea
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe the SaaS solution features..."
          className="input-field"
          style={{ height: 'auto', padding: '10px' }}
        />
      </div>

      <div>
        <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '6px' }}>
          External Demo URL
        </label>
        <input
          type="url"
          value={demoUrl}
          onChange={(e) => setDemoUrl(e.target.value)}
          placeholder="https://clinic.carrezzaglobalsolutions.com"
          className="input-field"
        />
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: 'var(--space-2)' }}>
        <button type="button" onClick={onCancel} className="btn-secondary">
          Cancel
        </button>
        <button type="submit" disabled={loading} className="btn-primary">
          {loading ? 'Saving...' : product ? 'Update Product' : 'Create Product'}
        </button>
      </div>
    </form>
  );
};

export default ProductForm;
