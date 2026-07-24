import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import * as Icons from 'lucide-react';
import { productsService } from '../../services/productsService';
import { exportToExcel, exportToPDF } from '../../services/exportService';
import Skeleton from '../common/Skeleton';

const Analytics = () => {
  const [selectedTimeframe, setSelectedTimeframe] = useState('30d');
  const [exportDropdownOpen, setExportDropdownOpen] = useState(false);
  const [downloadSuccessToast, setDownloadSuccessToast] = useState('');
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const exportRef = useRef(null);

  const fetchAnalyticsData = async () => {
    setLoading(true);
    try {
      const pData = await productsService.getProducts();
      setProducts(pData);
    } catch (err) {
      console.error('Error fetching analytics data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalyticsData();
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (exportRef.current && !exportRef.current.contains(e.target)) {
        setExportDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Compute metrics dynamically from database products
  const productPerformance = products.map((p, idx) => {
    const rawMrr = parseFloat(p.monthlyRevenue || p.mrr || p.price || 0);
    const activeTenants = parseInt(p.activeClients || p.clients || p.tenants || 0, 10);

    return {
      id: p.id || `PRD-0${idx + 1}`,
      name: p.name || p.title || 'SaaS Product',
      rawMrr,
      mrr: `₹${rawMrr.toLocaleString()}`,
      activeTenants,
      growth: p.growth || '0%',
      churn: p.churn || '0%',
      color: p.color || '#0084FF'
    };
  });

  const totalMrr = productPerformance.reduce((acc, p) => acc + p.rawMrr, 0);
  const totalTenants = productPerformance.reduce((acc, p) => acc + p.activeTenants, 0);
  const arpu = totalTenants > 0 ? Math.round(totalMrr / totalTenants) : 0;

  const handleDownloadExcel = () => {
    const exportData = productPerformance.map(p => ({
      'Product Code': p.id,
      'Product Name': p.name,
      'Monthly Revenue (MRR)': p.mrr,
      'Active Tenant Clients': p.activeTenants,
      'MoM Growth Rate': p.growth,
      'Churn Rate': p.churn
    }));

    exportToExcel(exportData, null, `Zuna_Financial_Analytics_${selectedTimeframe}`);
    setExportDropdownOpen(false);
    setDownloadSuccessToast('✓ Excel Report Downloaded!');
    setTimeout(() => setDownloadSuccessToast(''), 3000);
  };

  const handleDownloadPDF = () => {
    const headers = ['Product Code', 'Product Name', 'MRR (₹)', 'Active Tenants', 'Growth', 'Churn'];
    const rows = productPerformance.map(p => [
      p.id,
      p.name,
      p.mrr,
      `${p.activeTenants} Clients`,
      p.growth,
      p.churn
    ]);

    exportToPDF(`SaaS Analytics & Revenue Report (${selectedTimeframe})`, headers, rows, `Zuna_Analytics_${selectedTimeframe}`);
    setExportDropdownOpen(false);
    setDownloadSuccessToast('✓ PDF Document Generated!');
    setTimeout(() => setDownloadSuccessToast(''), 3000);
  };

  return (
    <div className="admin-overview-container">
      {/* Header Bar */}
      <div className="panel-header" style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 className="panel-title" style={{ fontSize: '1.4rem', margin: 0, color: 'var(--admin-text-main)' }}>Analytics & Financial Reports</h2>
          <p style={{ margin: '0.2rem 0 0', fontSize: '0.84rem', color: 'var(--admin-text-muted)' }}>
            Real-time SaaS product revenue performance, tenant active metrics, and financial breakdown.
          </p>
        </div>

        <div className="panel-actions" style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          {downloadSuccessToast && (
            <span style={{ background: '#00F5D4', color: '#0f172a', padding: '0.35rem 0.85rem', borderRadius: '50px', fontSize: '0.78rem', fontWeight: 700 }}>
              {downloadSuccessToast}
            </span>
          )}

          {/* Timeframe Selector */}
          <select 
            className="filter-select"
            value={selectedTimeframe}
            onChange={(e) => setSelectedTimeframe(e.target.value)}
          >
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Quarter to Date (Q3)</option>
            <option value="1y">Year to Date</option>
          </select>

          {/* Download Options Dropdown */}
          <div className="navbar-dropdown-wrapper" ref={exportRef}>
            <button 
              className="btn btn-primary" 
              onClick={() => setExportDropdownOpen(!exportDropdownOpen)} 
              disabled={products.length === 0}
              style={{ padding: '0.55rem 1.1rem', fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem', height: '38px' }}
            >
              <Icons.Download size={15} />
              <span>Export Reports</span>
              <Icons.ChevronDown size={14} style={{ transform: exportDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease' }} />
            </button>

            {exportDropdownOpen && (
              <div className="navbar-dropdown-panel" style={{ width: '220px', top: 'calc(100% + 0.4rem)', right: 0 }}>
                <div className="dropdown-header">Choose Download Format</div>
                <div className="user-dropdown-menu">
                  <button className="dropdown-item" onClick={handleDownloadExcel}>
                    <Icons.FileSpreadsheet size={16} style={{ color: '#10b981' }} />
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontWeight: 600 }}>Download Excel</span>
                      <small style={{ fontSize: '0.72rem', color: 'var(--admin-text-muted)' }}>Spreadsheet (.xlsx / .csv)</small>
                    </div>
                  </button>

                  <button className="dropdown-item" onClick={handleDownloadPDF}>
                    <Icons.FileText size={16} style={{ color: '#ef4444' }} />
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontWeight: 600 }}>Download PDF</span>
                      <small style={{ fontSize: '0.72rem', color: 'var(--admin-text-muted)' }}>Printable PDF Document</small>
                    </div>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="admin-stats-grid">
        <div className="admin-stat-card">
          <div className="stat-card-header">
            <div className="unified-admin-icon" style={{ background: 'rgba(0, 132, 255, 0.12)', color: 'var(--accent)' }}>
              <Icons.IndianRupee size={22} />
            </div>
          </div>
          <div className="stat-card-body">
            <span className="stat-value">₹{totalMrr.toLocaleString()}</span>
            <span className="stat-label">Total Monthly Recurring Revenue (MRR)</span>
            <span className="stat-subtext">Across {products.length} Active Database Products</span>
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="stat-card-header">
            <div className="unified-admin-icon" style={{ background: 'rgba(0, 245, 212, 0.12)', color: '#00F5D4' }}>
              <Icons.TrendingUp size={22} />
            </div>
          </div>
          <div className="stat-card-body">
            <span className="stat-value">₹{arpu.toLocaleString()}</span>
            <span className="stat-label">Average Revenue Per User (ARPU)</span>
            <span className="stat-subtext">Calculated from registered tenant licenses</span>
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="stat-card-header">
            <div className="unified-admin-icon" style={{ background: 'rgba(16, 185, 129, 0.12)', color: '#10b981' }}>
              <Icons.ShieldCheck size={22} />
            </div>
          </div>
          <div className="stat-card-body">
            <span className="stat-value">{totalTenants > 0 ? '100%' : 'N/A'}</span>
            <span className="stat-label">Active Tenant Retention</span>
            <span className="stat-subtext">Database registered products</span>
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="stat-card-header">
            <div className="unified-admin-icon" style={{ background: 'rgba(99, 102, 241, 0.12)', color: '#6366f1' }}>
              <Icons.Layers size={22} />
            </div>
          </div>
          <div className="stat-card-body">
            <span className="stat-value">{totalTenants.toLocaleString()}</span>
            <span className="stat-label">Total Active Paid Licenses</span>
            <span className="stat-subtext">Active client subscriptions in database</span>
          </div>
        </div>
      </div>

      {/* Multi-Product Performance Table / Empty State */}
      <div className="admin-panel" style={{ marginTop: '1.75rem' }}>
        <div className="panel-header" style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--admin-border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div className="unified-admin-icon sm" style={{ background: 'rgba(0, 132, 255, 0.12)', color: 'var(--accent)' }}>
              <Icons.BarChart2 size={18} />
            </div>
            <span className="panel-title" style={{ fontSize: '1.15rem' }}>Product-wise Financial Metrics</span>
          </div>
        </div>

        {loading ? (
          <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {[1, 2, 3].map(idx => (
              <Skeleton key={idx} width="100%" height="45px" borderRadius="8px" />
            ))}
          </div>
        ) : productPerformance.length === 0 ? (
          <div style={{ padding: '3.5rem 1.5rem', textAlign: 'center', color: 'var(--admin-text-muted)' }}>
            <Icons.PieChart size={44} style={{ opacity: 0.3, margin: '0 auto 1rem', display: 'block' }} />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0 0 0.4rem', color: 'var(--admin-text-main)' }}>No Analytics Data Found</h3>
            <p style={{ fontSize: '0.85rem', margin: '0 0 1.5rem', color: 'var(--admin-text-muted)', maxWidth: '420px', marginLeft: 'auto', marginRight: 'auto' }}>
              No products or active subscription records exist in your database yet. Add SaaS products in the Product Manager to generate financial reports.
            </p>
            <Link to="/admin/dashboard/products" className="btn btn-primary" style={{ padding: '0.55rem 1.2rem', fontSize: '0.85rem', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
              <Icons.Plus size={16} /> Manage Products
            </Link>
          </div>
        ) : (
          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th style={{ minWidth: '200px' }}>Product Module</th>
                  <th style={{ width: '150px' }}>Monthly Revenue</th>
                  <th style={{ width: '130px' }}>MoM Growth</th>
                  <th style={{ width: '160px' }}>Active Tenant Count</th>
                  <th style={{ width: '120px' }}>Churn Rate</th>
                  <th style={{ textAlign: 'center', width: '180px', minWidth: '180px' }}>Performance</th>
                </tr>
              </thead>
              <tbody>
                {productPerformance.map((prod, i) => (
                  <tr key={i}>
                    <td style={{ fontWeight: 700, color: 'var(--admin-text-main)', whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                        <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: prod.color }} />
                        <span>{prod.name}</span>
                      </div>
                    </td>
                    <td style={{ fontWeight: 700, color: 'var(--admin-text-main)', whiteSpace: 'nowrap' }}>{prod.mrr}</td>
                    <td style={{ color: '#10b981', fontWeight: 700, whiteSpace: 'nowrap' }}>{prod.growth}</td>
                    <td style={{ fontWeight: 600, color: 'var(--admin-text-main)', whiteSpace: 'nowrap' }}>{prod.activeTenants.toLocaleString()} Tenants</td>
                    <td style={{ color: 'var(--admin-text-muted)', whiteSpace: 'nowrap' }}>{prod.churn}</td>
                    <td style={{ textAlign: 'center', verticalAlign: 'middle', whiteSpace: 'nowrap', width: '180px' }}>
                      <span className="badge-performance badge-performance-green" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '0.35rem 0.85rem', background: 'rgba(16, 185, 129, 0.12)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '50px', fontSize: '0.75rem', fontWeight: 700, whiteSpace: 'nowrap' }}>
                        Active
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Analytics;
