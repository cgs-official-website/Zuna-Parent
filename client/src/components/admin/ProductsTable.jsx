import React, { useState, useEffect, useRef } from 'react';
import * as Icons from 'lucide-react';
import { productsService } from '../../services/productsService';
import { exportToExcel, exportToPDF } from '../../services/exportService';
import ProductForm from './ProductForm';

const ProductsTable = () => {
  const [products, setProducts] = useState([]);
  const [viewMode, setViewMode] = useState('grid');
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  
  // Manage Settings Modal state
  const [managingProduct, setManagingProduct] = useState(null);
  const [copiedApiKey, setCopiedApiKey] = useState(false);

  const [refreshing, setRefreshing] = useState(false);
  const [showToast, setShowToast] = useState(false);

  // Export dropdown
  const [exportOpen, setExportOpen] = useState(false);
  const [exportToast, setExportToast] = useState('');
  const exportRef = useRef(null);

  const fetchProducts = async () => {
    try {
      const data = await productsService.getProducts();
      setProducts(data);
    } catch (err) {
      console.error('Error fetching products:', err);
    }
  };

  const handleRefreshClick = async () => {
    setRefreshing(true);
    await fetchProducts();
    setTimeout(() => {
      setRefreshing(false);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 2000);
    }, 400);
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (exportRef.current && !exportRef.current.contains(e.target)) {
        setExportOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const openAddProductModal = () => {
    setEditingProduct(null);
    setIsProductModalOpen(true);
  };

  const openEditProductModal = (product) => {
    setEditingProduct(product);
    setIsProductModalOpen(true);
  };

  const openManageModal = (product) => {
    setManagingProduct(product);
    setCopiedApiKey(false);
  };

  const toggleProductTenant = async (product) => {
    const updatedStatus = !product.tenantEnabled;
    try {
      await productsService.updateProduct(product.id, {
        ...product,
        tenantEnabled: updatedStatus
      });
      fetchProducts();
    } catch (err) {
      console.error('Error toggling tenant status:', err);
    }
  };

  const handleStatusChange = async (product, newStatus) => {
    try {
      await productsService.updateProduct(product.id, {
        ...product,
        status: newStatus
      });
      fetchProducts();
    } catch (err) {
      console.error('Error updating status:', err);
    }
  };

  const handleDeleteProduct = async (id) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    try {
      await productsService.deleteProduct(id);
      fetchProducts();
    } catch (err) {
      console.error('Error deleting product:', err);
      alert('Failed to delete product');
    }
  };

  const renderIcon = (iconName, size = 20, className = "") => {
    const IconComponent = Icons[iconName] || Icons.Layers;
    return <IconComponent className={className} size={size} />;
  };

  const formatUrl = (product) => {
    const rawUrl = product.productUrl || (product.url && product.url !== '#products' ? product.url : '');
    if (!rawUrl || rawUrl.trim() === '') {
      return <span style={{ color: 'var(--admin-text-muted)', fontStyle: 'italic', fontSize: '0.85rem' }}>No URL</span>;
    }
    const fullUrl = rawUrl.trim();
    const truncated = fullUrl.length > 28 ? fullUrl.substring(0, 28) + '...' : fullUrl;
    
    return (
      <a 
        href={fullUrl} 
        target="_blank" 
        rel="noopener noreferrer" 
        title={fullUrl}
        style={{ 
          color: 'var(--accent)', 
          textDecoration: 'none', 
          fontSize: '0.85rem',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.25rem'
        }}
      >
        <code style={{ background: 'rgba(0,132,255,0.08)', padding: '0.2rem 0.45rem', borderRadius: '4px', border: '1px solid rgba(0,132,255,0.15)', color: 'var(--accent)' }}>
          {truncated}
        </code>
        <Icons.ExternalLink size={12} />
      </a>
    );
  };

  const renderStatusBadge = (status) => {
    const s = status || 'Active';
    if (s === 'Maintenance') {
      return (
        <span style={{ background: 'rgba(245,158,11,0.15)', color: '#fbbf24', border: '1px solid rgba(245,158,11,0.3)', padding: '0.25rem 0.65rem', borderRadius: '50px', fontSize: '0.75rem', fontWeight: 600, whiteSpace: 'nowrap' }}>
          Maintenance
        </span>
      );
    }
    if (s === 'Deprecated' || s === 'Inactive') {
      return (
        <span style={{ background: 'rgba(239,68,68,0.15)', color: '#f87171', border: '1px solid rgba(239,68,68,0.3)', padding: '0.25rem 0.65rem', borderRadius: '50px', fontSize: '0.75rem', fontWeight: 600, whiteSpace: 'nowrap' }}>
          Deprecated
        </span>
      );
    }
    return (
      <span className="badge-pulse" style={{ background: 'rgba(0,210,196,0.12)', color: '#00F5D4', border: '1px solid rgba(0,210,196,0.3)', padding: '0.25rem 0.65rem', borderRadius: '50px', fontSize: '0.75rem', fontWeight: 700, display: 'inline-block', whiteSpace: 'nowrap' }}>
        Active
      </span>
    );
  };

  const handleExportExcel = () => {
    const data = products.map(p => ({
      'Product ID': p.id,
      'Product Name': p.name,
      'Target Audience': p.targetAudience,
      'Active Client Tenants': p.activeClients || 500,
      'Status': p.status || 'Active',
      'Multi-Tenant Enabled': p.tenantEnabled !== false ? 'Yes' : 'No'
    }));

    exportToExcel(data, null, 'Zuna_SaaS_Products');
    setExportOpen(false);
    setExportToast('✓ Products Exported to Excel!');
    setTimeout(() => setExportToast(''), 3000);
  };

  const handleExportPDF = () => {
    const headers = ['ID', 'Product Name', 'Target Audience', 'Active Clients', 'Status', 'Tenant Access'];
    const rows = products.map(p => [
      `#${p.id}`,
      p.name,
      p.targetAudience,
      `${p.activeClients || 500} Tenants`,
      p.status || 'Active',
      p.tenantEnabled !== false ? 'Enabled' : 'Disabled'
    ]);

    exportToPDF('Multi-Product SaaS Portfolio', headers, rows, 'Zuna_SaaS_Products');
    setExportOpen(false);
    setExportToast('✓ Products PDF Document Generated!');
    setTimeout(() => setExportToast(''), 3000);
  };

  return (
    <div className="admin-panel" style={{ position: 'relative' }}>
      {/* Top Header Bar */}
      <div className="panel-header" style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--admin-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--admin-text-main)', margin: 0 }}>Product Manager & Multi-Tenant Switcher</h2>
          <p style={{ margin: '0.2rem 0 0', fontSize: '0.84rem', color: 'var(--admin-text-muted)' }}>
            Manage configurations, multi-tenant toggles, and status for HRMS, Restaurant, College, School, Billing & CRM.
          </p>
        </div>

        <div className="panel-actions" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          {exportToast && (
            <span style={{ background: '#00F5D4', color: '#0f172a', padding: '0.35rem 0.85rem', borderRadius: '50px', fontSize: '0.78rem', fontWeight: 700 }}>
              {exportToast}
            </span>
          )}

          {/* View Toggle */}
          <div className="view-mode-toggle" style={{ display: 'flex', background: 'var(--theme-toggle-bg, rgba(255,255,255,0.05))', padding: '0.25rem', borderRadius: '10px', border: '1px solid var(--admin-border)' }}>
            <button 
              className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
              onClick={() => setViewMode('grid')}
              style={{ padding: '0.4rem 0.75rem', borderRadius: '8px', border: 'none', background: viewMode === 'grid' ? 'var(--accent, #0084FF)' : 'transparent', color: viewMode === 'grid' ? '#fff' : 'var(--admin-text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem', fontWeight: 600 }}
            >
              <Icons.LayoutGrid size={15} /> Grid
            </button>
            <button 
              className={`view-btn ${viewMode === 'table' ? 'active' : ''}`}
              onClick={() => setViewMode('table')}
              style={{ padding: '0.4rem 0.75rem', borderRadius: '8px', border: 'none', background: viewMode === 'table' ? 'var(--accent, #0084FF)' : 'transparent', color: viewMode === 'table' ? '#fff' : 'var(--admin-text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem', fontWeight: 600 }}
            >
              <Icons.Table size={15} /> Table
            </button>
          </div>

          {/* Export Dropdown */}
          <div className="navbar-dropdown-wrapper" ref={exportRef}>
            <button 
              className="btn btn-secondary"
              onClick={() => setExportOpen(!exportOpen)}
              style={{ padding: '0.55rem 0.95rem', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '0.35rem', height: '36px' }}
            >
              <Icons.Download size={15} /> Export
            </button>

            {exportOpen && (
              <div className="navbar-dropdown-panel" style={{ width: '200px', top: 'calc(100% + 0.4rem)', right: 0 }}>
                <div className="dropdown-header">Export Format</div>
                <div className="user-dropdown-menu">
                  <button className="dropdown-item" onClick={handleExportExcel}>
                    <Icons.FileSpreadsheet size={15} style={{ color: '#10b981' }} />
                    <span>Download Excel</span>
                  </button>
                  <button className="dropdown-item" onClick={handleExportPDF}>
                    <Icons.FileText size={15} style={{ color: '#ef4444' }} />
                    <span>Download PDF</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          <button 
            className="btn btn-secondary admin-refresh-btn" 
            onClick={handleRefreshClick} 
            disabled={refreshing}
            style={{ padding: '0.55rem 0.95rem', fontSize: '0.82rem', height: '36px' }}
          >
            <Icons.RotateCw size={15} className={refreshing ? 'spin-icon' : ''} style={{ color: 'var(--accent, #0084FF)', marginRight: '0.4rem' }} />
            <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
          </button>

          <button className="btn btn-primary" onClick={openAddProductModal} style={{ padding: '0.55rem 1.1rem', fontSize: '0.82rem', height: '36px' }}>
            <Icons.Plus size={16} style={{ marginRight: '0.3rem' }} /> Add Product
          </button>
        </div>
      </div>

      {/* BODY CONTENT: GRID CARDS VIEW */}
      {viewMode === 'grid' && (
        <div style={{ padding: '1.5rem' }}>
          <div className="product-cards-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
            {products.map((prod) => (
              <div key={prod.id} className="product-manager-card" style={{ background: 'var(--admin-card-bg)', border: '1px solid var(--admin-border)', borderRadius: '16px', padding: '1.35rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '1.1rem', transition: 'all 0.25s ease' }}>
                
                <div>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div className="unified-admin-icon" style={{ background: 'rgba(0, 132, 255, 0.12)', color: 'var(--accent)' }}>
                        {renderIcon(prod.icon || 'Layers', 22)}
                      </div>
                      <div>
                        <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'var(--admin-text-main)' }}>{prod.name}</h3>
                        <span style={{ fontSize: '0.78rem', color: 'var(--admin-text-muted)' }}>{prod.targetAudience || 'SaaS Solution'}</span>
                      </div>
                    </div>
                    {renderStatusBadge(prod.status)}
                  </div>

                  <p style={{ margin: '0 0 1rem', fontSize: '0.85rem', color: 'var(--admin-text-muted)', lineHeight: 1.45 }}>
                    {prod.description}
                  </p>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.65rem 0.85rem', background: 'var(--theme-toggle-bg, rgba(255,255,255,0.03))', borderRadius: '10px', border: '1px solid var(--admin-border)', fontSize: '0.8rem' }}>
                    <span style={{ color: 'var(--admin-text-muted)' }}>Active Clients:</span>
                    <strong style={{ color: 'var(--admin-text-main)' }}>{prod.activeClients ? prod.activeClients.toLocaleString() + ' Tenants' : 'No Tenants'}</strong>
                  </div>
                </div>

                <div style={{ borderTop: '1px solid var(--admin-border)', paddingTop: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <button 
                      onClick={() => toggleProductTenant(prod)}
                      style={{
                        padding: '0.35rem 0.75rem',
                        borderRadius: '50px',
                        border: '1px solid var(--admin-border)',
                        background: prod.tenantEnabled !== false ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                        color: prod.tenantEnabled !== false ? '#10b981' : '#f87171',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: prod.tenantEnabled !== false ? '#10b981' : '#f87171' }} />
                      {prod.tenantEnabled !== false ? 'Tenant Enabled' : 'Tenant Disabled'}
                    </button>
                  </div>

                  <div style={{ display: 'flex', gap: '0.4rem' }}>
                    <button 
                      className="btn btn-secondary"
                      onClick={() => openManageModal(prod)}
                      style={{ padding: '0.45rem 0.75rem', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                    >
                      <Icons.Settings size={14} /> Manage
                    </button>
                    <button className="btn-action btn-action-edit btn-interactive" onClick={() => openEditProductModal(prod)} title="Edit Product">
                      {renderIcon('Edit', 15)}
                    </button>
                    <button className="btn-action btn-action-delete btn-interactive" onClick={() => handleDeleteProduct(prod.id)} title="Delete Product">
                      {renderIcon('Trash2', 15)}
                    </button>
                  </div>
                </div>

              </div>
            ))}
          </div>
        </div>
      )}

      {/* BODY CONTENT: TABLE VIEW */}
      {viewMode === 'table' && (
        <div className="admin-table-container" style={{ width: '100%', overflowX: 'auto' }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th style={{ width: '110px' }}>ID</th>
                <th style={{ minWidth: '200px' }}>Product</th>
                <th style={{ width: '130px' }}>Status</th>
                <th style={{ width: '140px' }}>Active Clients</th>
                <th style={{ minWidth: '240px' }}>Description</th>
                <th style={{ minWidth: '180px' }}>Product URL</th>
                <th style={{ textAlign: 'right', width: '160px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((prod) => (
                <tr key={prod.id} className="admin-cascade-item">
                  <td style={{ fontWeight: 600, color: 'var(--admin-text-main)', whiteSpace: 'nowrap', verticalAlign: 'middle' }}>
                    #{String(prod.id).substring(0, 8)}
                  </td>
                  <td style={{ verticalAlign: 'middle' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                      <div className="unified-admin-icon sm" style={{ background: 'rgba(0, 132, 255, 0.1)', color: 'var(--accent)', flexShrink: 0 }}>
                        {renderIcon(prod.icon || 'Layers', 18)}
                      </div>
                      <div>
                        <span style={{ fontWeight: 700, color: 'var(--admin-text-main)', display: 'block', fontSize: '0.92rem', whiteSpace: 'nowrap' }}>{prod.name}</span>
                        <small style={{ color: 'var(--admin-text-muted)', fontSize: '0.76rem', whiteSpace: 'nowrap' }}>{prod.targetAudience}</small>
                      </div>
                    </div>
                  </td>
                  <td style={{ verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                    <select 
                      className="filter-select" 
                      style={{ padding: '0.25rem 0.5rem', fontSize: '0.78rem' }}
                      value={prod.status || 'Active'}
                      onChange={(e) => handleStatusChange(prod, e.target.value)}
                    >
                      <option value="Active">Active</option>
                      <option value="Maintenance">Maintenance</option>
                      <option value="Deprecated">Deprecated</option>
                    </select>
                  </td>
                  <td style={{ verticalAlign: 'middle', fontWeight: 600, color: 'var(--admin-text-main)', whiteSpace: 'nowrap' }}>
                    {prod.activeClients ? prod.activeClients.toLocaleString() + ' Tenants' : 'No Tenants'}
                  </td>
                  <td style={{ maxWidth: '280px', color: 'var(--admin-text-main)', fontSize: '0.85rem', lineHeight: 1.4, verticalAlign: 'middle' }}>
                    {prod.description}
                  </td>
                  <td style={{ verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                    {formatUrl(prod)}
                  </td>
                  <td style={{ textAlign: 'right', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                    <div className="actions-cell" style={{ justifyContent: 'flex-end', gap: '0.35rem' }}>
                      <button className="btn btn-secondary" onClick={() => openManageModal(prod)} style={{ padding: '0.35rem 0.65rem', fontSize: '0.78rem' }}>
                        Manage
                      </button>
                      <button className="btn-action btn-action-edit btn-interactive" onClick={() => openEditProductModal(prod)} title="Edit">
                        {renderIcon('Edit', 15)}
                      </button>
                      <button className="btn-action btn-action-delete btn-interactive" onClick={() => handleDeleteProduct(prod.id)} title="Delete">
                        {renderIcon('Trash2', 15)}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* DETAILED MANAGE CONFIG MODAL */}
      {managingProduct && (
        <div className="admin-modal-overlay" onClick={() => setManagingProduct(null)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '580px', width: '90%' }}>
            <div className="admin-modal-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '1rem', borderBottom: '1px solid var(--admin-border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div className="unified-admin-icon" style={{ background: 'rgba(0, 132, 255, 0.12)', color: 'var(--accent)' }}>
                  {renderIcon(managingProduct.icon || 'Layers', 22)}
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.15rem', color: 'var(--admin-text-main)' }}>{managingProduct.name} Settings</h3>
                  <span style={{ fontSize: '0.78rem', color: 'var(--admin-text-muted)' }}>Product & Multi-Tenant Management Drawer</span>
                </div>
              </div>
              <button onClick={() => setManagingProduct(null)} style={{ background: 'none', border: 'none', color: 'var(--admin-text-muted)', cursor: 'pointer' }}>
                <Icons.X size={20} />
              </button>
            </div>

            <div className="admin-modal-body" style={{ padding: '1.25rem 0', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <label style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--admin-text-main)', display: 'block', marginBottom: '0.35rem' }}>Product Secret API Key</label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input 
                    type="text" 
                    className="admin-input" 
                    readOnly 
                    value={managingProduct.apiKey || `zk_live_${managingProduct.id}_x99`}
                    style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}
                  />
                  <button 
                    className="btn btn-secondary"
                    onClick={() => {
                      navigator.clipboard.writeText(managingProduct.apiKey || `zk_live_${managingProduct.id}_x99`);
                      setCopiedApiKey(true);
                      setTimeout(() => setCopiedApiKey(false), 2000);
                    }}
                    style={{ whiteSpace: 'nowrap', fontSize: '0.8rem' }}
                  >
                    {copiedApiKey ? '✓ Copied' : 'Copy Key'}
                  </button>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--admin-text-main)', display: 'block', marginBottom: '0.35rem' }}>Lifecycle Status</label>
                  <select 
                    className="filter-select"
                    style={{ width: '100%', padding: '0.6rem' }}
                    value={managingProduct.status || 'Active'}
                    onChange={(e) => {
                      const newStatus = e.target.value;
                      handleStatusChange(managingProduct, newStatus);
                      setManagingProduct({ ...managingProduct, status: newStatus });
                    }}
                  >
                    <option value="Active">Active (Live Production)</option>
                    <option value="Maintenance">Maintenance Mode</option>
                    <option value="Deprecated">Deprecated</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--admin-text-main)', display: 'block', marginBottom: '0.35rem' }}>Multi-Tenant Access</label>
                  <button 
                    onClick={() => {
                      toggleProductTenant(managingProduct);
                      setManagingProduct({ ...managingProduct, tenantEnabled: !managingProduct.tenantEnabled });
                    }}
                    style={{
                      width: '100%',
                      padding: '0.6rem',
                      borderRadius: '8px',
                      border: '1px solid var(--admin-border)',
                      background: managingProduct.tenantEnabled !== false ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                      color: managingProduct.tenantEnabled !== false ? '#10b981' : '#f87171',
                      fontSize: '0.84rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      textAlign: 'center'
                    }}
                  >
                    {managingProduct.tenantEnabled !== false ? '✓ Enabled for All Tenants' : '✕ Tenant Access Disabled'}
                  </button>
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--admin-text-main)', display: 'block', marginBottom: '0.5rem' }}>Module Feature Flags</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem' }}>
                  {['Automated Daily Backups', 'Custom Webhooks & API', 'SSO / SAML 2.0', 'Multi-Currency & GST'].map((flag, idx) => (
                    <div key={idx} style={{ padding: '0.6rem 0.85rem', background: 'var(--theme-toggle-bg, rgba(255,255,255,0.03))', border: '1px solid var(--admin-border)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                      <span style={{ color: 'var(--admin-text-main)' }}>{flag}</span>
                      <Icons.Check size={14} style={{ color: '#00F5D4' }} />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="admin-modal-footer" style={{ borderTop: '1px solid var(--admin-border)', paddingTop: '1rem', display: 'flex', justifyContent: 'flex-end' }}>
              <button className="btn btn-primary" onClick={() => setManagingProduct(null)} style={{ padding: '0.6rem 1.25rem', fontSize: '0.85rem' }}>
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD / EDIT PRODUCT MODAL */}
      {isProductModalOpen && (
        <ProductForm 
          editingProduct={editingProduct}
          onClose={() => setIsProductModalOpen(false)}
          onRefresh={fetchProducts}
        />
      )}
    </div>
  );
};

export default ProductsTable;
