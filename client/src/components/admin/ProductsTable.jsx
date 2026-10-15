import React, { useState } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiKey, FiExternalLink, FiLayers, FiShield } from 'react-icons/fi';
import { useProducts } from '../../hooks/useProducts.js';
import { Modal } from '../common/Modal.jsx';
import { ProductForm } from './ProductForm.jsx';
import { CardSkeleton } from '../common/Skeleton.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { productsService } from '../../services/productsService.js';

export const ProductsTable = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const { products, loading, createProduct, updateProduct, deleteProduct } = useProducts();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formLoading, setFormLoading] = useState(false);

  // API Key Generation Modal state
  const [apiKeyModal, setApiKeyModal] = useState({ open: false, key: '', productTitle: '' });

  const handleOpenCreate = () => {
    setEditingProduct(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (product) => {
    setEditingProduct(product);
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (formData) => {
    setFormLoading(true);
    try {
      if (editingProduct) {
        await updateProduct(editingProduct.id, formData);
      } else {
        await createProduct(formData);
      }
      setIsModalOpen(false);
    } catch {
      // Toast handled in hook
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (id, title) => {
    if (!window.confirm(`Are you sure you want to delete "${title}"?`)) return;
    try {
      await deleteProduct(id);
    } catch {
      // Toast handled
    }
  };

  const handleGenerateKey = async (productId, title) => {
    try {
      const res = await productsService.generateApiKey(productId, `Ingestion Key - ${title}`);
      setApiKeyModal({
        open: true,
        key: res.key || res.apiKey || res.rawKey,
        productTitle: title
      });
    } catch (err) {
      showToast(`Key generation failed: ${err.message}`, 'error');
    }
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
          <h1 style={{ fontSize: '1.75rem', marginBottom: '4px' }}>SaaS Product Catalog</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            Manage the 5 vertical applications in the Carrezza Global Solutions ecosystem.
          </p>
        </div>

        {user?.role === 'SUPER_ADMIN' && (
          <button onClick={handleOpenCreate} className="btn-primary" style={{ height: '38px', gap: '6px' }}>
            <FiPlus size={16} />
            <span>Add New Product</span>
          </button>
        )}
      </div>

      {/* Product Cards Grid */}
      {loading ? (
        <CardSkeleton count={5} />
      ) : products.length === 0 ? (
        <div className="card" style={{ padding: 'var(--space-10) var(--space-4)', textAlign: 'center', color: 'var(--text-muted)' }}>
          <FiLayers size={48} style={{ opacity: 0.4, marginBottom: '12px' }} />
          <h3>No Products Found</h3>
          <p>Click "Add New Product" to create your first vertical SaaS application.</p>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 280px), 1fr))',
            gap: 'var(--space-5)'
          }}
        >
          {products.map((prod) => (
            <div key={prod.id} className="card card-hover" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div
                    style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: 'var(--radius-sm)',
                      background: 'var(--accent-light)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--accent)',
                      fontWeight: 800
                    }}
                  >
                    <FiLayers size={20} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.0625rem', margin: 0 }}>{prod.title}</h3>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{prod.category}</span>
                  </div>
                </div>

                {prod.badge && (
                  <span
                    style={{
                      background: 'var(--surface-2)',
                      padding: '2px 8px',
                      borderRadius: 'var(--radius-full)',
                      fontSize: '0.6875rem',
                      fontWeight: 700,
                      color: 'var(--accent)'
                    }}
                  >
                    {prod.badge}
                  </span>
                )}
              </div>

              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.5, flex: 1, marginBottom: '16px' }}>
                {prod.description || 'No description provided.'}
              </p>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingTop: '12px',
                  borderTop: '1px solid var(--border)',
                  fontSize: '0.8125rem'
                }}
              >
                <div style={{ display: 'flex', gap: '6px' }}>
                  <span
                    style={{
                      background: 'var(--surface-2)',
                      padding: '2px 8px',
                      borderRadius: 'var(--radius-sm)',
                      fontWeight: 600
                    }}
                  >
                    Tier: {prod.tier || 'PRO'}
                  </span>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: '4px' }}>
                  {prod.demoUrl && (
                    <a
                      href={prod.demoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-ghost"
                      title="Open Live App"
                      style={{ padding: '6px' }}
                    >
                      <FiExternalLink size={16} />
                    </a>
                  )}

                  {user?.role === 'SUPER_ADMIN' && (
                    <>
                      <button
                        onClick={() => handleGenerateKey(prod.id, prod.title)}
                        className="btn-ghost"
                        title="Generate Ingestion API Key"
                        style={{ padding: '6px', color: 'var(--accent)' }}
                      >
                        <FiKey size={16} />
                      </button>
                      <button
                        onClick={() => handleOpenEdit(prod)}
                        className="btn-ghost"
                        title="Edit Product"
                        style={{ padding: '6px' }}
                      >
                        <FiEdit2 size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(prod.id, prod.title)}
                        className="btn-ghost"
                        title="Delete Product"
                        style={{ padding: '6px', color: 'var(--danger)' }}
                      >
                        <FiTrash2 size={16} />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Product Create/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingProduct ? 'Edit SaaS Product' : 'Add New SaaS Vertical'}
      >
        <ProductForm
          product={editingProduct}
          onSubmit={handleFormSubmit}
          onCancel={() => setIsModalOpen(false)}
          loading={formLoading}
        />
      </Modal>

      {/* API Key Modal (Shows key once upon generation) */}
      <Modal
        isOpen={apiKeyModal.open}
        onClose={() => setApiKeyModal({ open: false, key: '', productTitle: '' })}
        title="Ingestion API Key Generated"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ background: 'var(--warning-bg)', border: '1px solid rgba(245, 158, 11, 0.3)', padding: '12px', borderRadius: 'var(--radius-sm)', color: 'var(--warning)', fontSize: '0.8125rem', lineHeight: 1.4 }}>
            ⚠️ <strong>Important:</strong> Copy this API key now. For security purposes, it will never be displayed again.
          </div>

          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Product: {apiKeyModal.productTitle}</span>
            <div
              style={{
                background: 'var(--surface-2)',
                padding: '12px',
                borderRadius: 'var(--radius-sm)',
                fontFamily: 'monospace',
                fontSize: '0.875rem',
                color: 'var(--accent)',
                wordBreak: 'break-all',
                marginTop: '4px'
              }}
            >
              {apiKeyModal.key}
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              navigator.clipboard.writeText(apiKeyModal.key);
              showToast('API Key copied to clipboard!', 'success');
              setApiKeyModal({ open: false, key: '', productTitle: '' });
            }}
            className="btn-primary"
            style={{ width: '100%' }}
          >
            Copy Key & Close
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default ProductsTable;
