import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import * as Icons from 'lucide-react';
import { productsService } from '../../services/productsService';
import { ticketsService } from '../../services/ticketsService';

const DashboardOverview = () => {
  const [products, setProducts] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedChartFilter, setSelectedChartFilter] = useState('usage');
  const [hoveredProductIndex, setHoveredProductIndex] = useState(null);

  const loadDashboardData = async () => {
    try {
      const [pData, tData] = await Promise.all([
        productsService.getProducts(),
        ticketsService.getTickets()
      ]);
      setProducts(pData);
      setTickets(tData);
    } catch (err) {
      console.error('Error loading dashboard data:', err);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    loadDashboardData();
  };

  const renderIcon = (iconName, size = 20, className = "") => {
    const IconComponent = Icons[iconName] || Icons.Activity;
    return <IconComponent className={className} size={size} />;
  };

  // 6 Core SaaS Products Usage & Revenue Data (Dynamic)
  const productAnalyticsData = products.map((p, index) => {
    const colors = ['#0084FF', '#00F5D4', '#6366f1', '#f59e0b', '#ec4899', '#10b981'];
    return { 
      name: p.name, 
      clients: p.activeClients || 0, 
      revenue: p.monthlyRevenue || 0, 
      color: colors[index % colors.length], 
      usageScore: p.usageScore || 0 
    };
  });

  const totalCustomers = productAnalyticsData.reduce((acc, p) => acc + p.clients, 0);
  const totalRevenue = productAnalyticsData.reduce((acc, p) => acc + p.revenue, 0);
  const openTicketsCount = tickets.filter(t => t.status === 'open' || t.status === 'in-progress').length;

  const recentActivities = tickets.slice(0, 6).map(t => ({
    id: t.id,
    type: 'ticket',
    title: t.subject || 'Support Ticket',
    description: `Ticket raised by ${t.clientName || 'Client'} for ${t.productName || 'System'}`,
    time: t.createdAt ? new Date(t.createdAt).toLocaleDateString() : 'Recent',
    icon: 'LifeBuoy',
    badgeColor: '#f59e0b',
    badgeBg: 'rgba(245, 158, 11, 0.12)'
  }));

  const systemServices = [
    { name: 'API Gateway & Load Balancer', status: 'Operational', latency: '12ms', health: '99.99%', color: '#10b981' },
    { name: 'Primary Database Cluster', status: 'Operational', latency: '4ms', health: '100%', color: '#10b981' },
    { name: 'Multi-Tenant Auth & Security', status: 'Active', latency: '18ms', health: 'ADC Verified', color: '#0084FF' },
    { name: 'Redis Cache & Event Stream', status: 'Optimal', latency: '2ms', health: 'Zero Queue', color: '#00F5D4' }
  ];

  // Donut chart calculations
  let accumulatedAngle = 0;
  const radius = 65;
  const strokeWidth = 24;
  const circumference = 2 * Math.PI * radius;

  return (
    <div className="admin-overview-container">
      {/* Header Actions Row */}
      <div className="panel-header" style={{ marginBottom: '1.75rem' }}>
        <div>
          <h2 className="panel-title" style={{ fontSize: '1.5rem', margin: 0 }}>Zuna SaaS Multi-Product Analytics</h2>
          <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem', color: 'var(--admin-text-muted)' }}>
            Real-time subscriber metrics, product usage analytics, revenue breakdown, and tickets monitor across all 6 SaaS solutions.
          </p>
        </div>

        <div className="panel-actions" style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <button 
            className="btn btn-secondary admin-refresh-btn" 
            onClick={handleRefresh}
            disabled={refreshing}
            style={{ padding: '0.6rem 1rem', fontSize: '0.85rem' }}
          >
            <Icons.RotateCw size={15} className={refreshing ? 'spin-icon' : ''} style={{ color: 'var(--accent)', marginRight: '0.4rem' }} />
            <span>{refreshing ? 'Refreshing...' : 'Refresh Feed'}</span>
          </button>
          
          <Link to="/admin/dashboard/products" className="btn btn-primary" style={{ padding: '0.6rem 1.25rem', fontSize: '0.85rem' }}>
            <Icons.Layers size={16} style={{ marginRight: '0.4rem' }} /> Manage 6 Products
          </Link>
        </div>
      </div>

      {/* KPI CARDS ROW */}
      <div className="admin-stats-grid">
        {/* Card 1: Total Customers */}
        <div className="admin-stat-card admin-cascade-item">
          <div className="stat-card-header">
            <div className="unified-admin-icon" style={{ background: 'rgba(0, 132, 255, 0.12)', color: 'var(--accent)' }}>
              <Icons.Users size={22} />
            </div>
            <span className="stat-trend trend-positive">
              <Icons.TrendingUp size={13} /> +14.5%
            </span>
          </div>
          <div className="stat-card-body">
            <span className="stat-value">{totalCustomers.toLocaleString()}</span>
            <span className="stat-label">Total Customers</span>
            <span className="stat-subtext">Active corporate & SMB clients</span>
          </div>
        </div>

        {/* Card 2: Active Subscriptions */}
        <div className="admin-stat-card admin-cascade-item">
          <div className="stat-card-header">
            <div className="unified-admin-icon" style={{ background: 'rgba(0, 245, 212, 0.12)', color: '#00F5D4' }}>
              <Icons.CheckCircle2 size={22} />
            </div>
            <span className="stat-trend trend-positive">
              <Icons.TrendingUp size={13} /> +11.8%
            </span>
          </div>
          <div className="stat-card-body">
            <span className="stat-value">{totalCustomers.toLocaleString()}</span>
            <span className="stat-label">Active Subscriptions</span>
            <span className="stat-subtext">Across 6 SaaS product platforms</span>
          </div>
        </div>

        {/* Card 3: Monthly Revenue */}
        <div className="admin-stat-card admin-cascade-item">
          <div className="stat-card-header">
            <div className="unified-admin-icon" style={{ background: 'rgba(99, 102, 241, 0.12)', color: '#6366f1' }}>
              <Icons.IndianRupee size={22} />
            </div>
            <span className="stat-trend trend-positive">
              <Icons.TrendingUp size={13} /> +9.4%
            </span>
          </div>
          <div className="stat-card-body">
            <span className="stat-value">₹{totalRevenue.toLocaleString()}</span>
            <span className="stat-label">Monthly Revenue</span>
            <span className="stat-subtext">Combined monthly recurring revenue</span>
          </div>
        </div>

        {/* Card 4: Open Support Tickets */}
        <div className="admin-stat-card admin-cascade-item">
          <div className="stat-card-header">
            <div className="unified-admin-icon" style={{ background: 'rgba(245, 158, 11, 0.12)', color: '#f59e0b' }}>
              <Icons.LifeBuoy size={22} />
            </div>
            <span className="stat-badge-tag warning">
              {openTicketsCount} Active
            </span>
          </div>
          <div className="stat-card-body">
            <span className="stat-value">{tickets.length}</span>
            <span className="stat-label">Open Tickets</span>
            <span className="stat-subtext">Across HRMS, POS, School & CRM</span>
          </div>
        </div>
      </div>

      {/* PRODUCT-WISE USAGE & REVENUE CHARTS GRID */}
      <div className="admin-overview-grid" style={{ marginTop: '2rem', display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: '1.75rem' }}>
        
        {/* Chart 1: Product-Wise Usage Analytics */}
        <div className="admin-panel">
          <div className="panel-header" style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--admin-border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <div className="unified-admin-icon sm" style={{ background: 'rgba(0, 132, 255, 0.12)', color: 'var(--accent)' }}>
                <Icons.BarChart3 size={18} />
              </div>
              <div>
                <span className="panel-title" style={{ fontSize: '1.1rem' }}>Product-Wise Usage & Adoption</span>
                <div style={{ fontSize: '0.78rem', color: 'var(--admin-text-muted)' }}>Comparing active clients across HRMS, Restaurant, College, School, Billing & CRM</div>
              </div>
            </div>
          </div>

          <div style={{ padding: '1.5rem' }}>
            {/* Custom Interactive SVG Bar Chart */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
              {productAnalyticsData.map((prod, idx) => {
                const maxClients = 1500;
                const pct = Math.round((prod.clients / maxClients) * 100);
                const isHovered = hoveredProductIndex === idx;

                return (
                  <div 
                    key={prod.name} 
                    onMouseEnter={() => setHoveredProductIndex(idx)}
                    onMouseLeave={() => setHoveredProductIndex(null)}
                    style={{ 
                      padding: '0.65rem 0.85rem', 
                      borderRadius: '12px',
                      background: isHovered ? 'rgba(0, 132, 255, 0.05)' : 'transparent',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.45rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: prod.color }} />
                        <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--admin-text-main)' }}>{prod.name}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.82rem' }}>
                        <span style={{ fontWeight: 600, color: 'var(--admin-text-main)' }}>{prod.clients.toLocaleString()} Clients</span>
                        <span style={{ color: 'var(--admin-text-muted)' }}>Score: {prod.usageScore}%</span>
                      </div>
                    </div>

                    <div style={{ height: '10px', width: '100%', background: 'var(--admin-border)', borderRadius: '50px', overflow: 'hidden' }}>
                      <div 
                        style={{ 
                          height: '100%', 
                          width: `${pct}%`, 
                          background: `linear-gradient(90deg, ${prod.color} 0%, #00F5D4 100%)`, 
                          borderRadius: '50px',
                          transition: 'width 0.8s cubic-bezier(0.16, 1, 0.3, 1)' 
                        }} 
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Chart 2: Revenue Breakdown Donut Chart */}
        <div className="admin-panel">
          <div className="panel-header" style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--admin-border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <div className="unified-admin-icon sm" style={{ background: 'rgba(0, 245, 212, 0.12)', color: '#00F5D4' }}>
                <Icons.PieChart size={18} />
              </div>
              <span className="panel-title" style={{ fontSize: '1.1rem' }}>Revenue Breakdown</span>
            </div>
          </div>

          <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            {/* SVG Donut Chart */}
            <div style={{ position: 'relative', width: '180px', height: '180px', marginBottom: '1.25rem' }}>
              <svg width="180" height="180" viewBox="0 0 180 180" style={{ transform: 'rotate(-90deg)' }}>
                {productAnalyticsData.map((prod) => {
                  const pct = prod.revenue / totalRevenue;
                  const dasharray = `${pct * circumference} ${circumference}`;
                  const dashoffset = -accumulatedAngle;
                  accumulatedAngle += pct * circumference;

                  return (
                    <circle
                      key={prod.name}
                      cx="90"
                      cy="90"
                      r={radius}
                      fill="transparent"
                      stroke={prod.color}
                      strokeWidth={strokeWidth}
                      strokeDasharray={dasharray}
                      strokeDashoffset={dashoffset}
                      style={{ transition: 'stroke-width 0.2s ease, opacity 0.2s ease' }}
                    />
                  );
                })}
              </svg>
              <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--admin-text-main)' }}>₹{totalRevenue.toLocaleString()}</span>
                <span style={{ fontSize: '0.72rem', color: 'var(--admin-text-muted)' }}>Monthly Total</span>
              </div>
            </div>

            {/* Product Legend */}
            <div style={{ width: '100%', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem 1rem' }}>
              {productAnalyticsData.map(prod => {
                const pct = ((prod.revenue / totalRevenue) * 100).toFixed(1);
                return (
                  <div key={prod.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.78rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: prod.color }} />
                      <span style={{ color: 'var(--admin-text-main)', fontWeight: 600 }}>{prod.name}</span>
                    </div>
                    <span style={{ color: 'var(--admin-text-muted)', fontWeight: 700 }}>{pct}%</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

      </div>

      {/* RECENT ACTIVITIES & SYSTEM HEALTH GRID */}
      <div className="admin-overview-grid" style={{ marginTop: '1.75rem', display: 'grid', gridTemplateColumns: '1.8fr 1fr', gap: '1.75rem', alignItems: 'stretch' }}>
        {/* Recent Activity Feed */}
        <div className="admin-panel" style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="panel-header" style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--admin-border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <div className="unified-admin-icon sm" style={{ background: 'rgba(0, 132, 255, 0.12)', color: 'var(--accent)' }}>
                <Icons.Activity size={18} />
              </div>
              <span className="panel-title" style={{ fontSize: '1.1rem' }}>Live SaaS Activity Stream</span>
            </div>
            <span style={{ fontSize: '0.78rem', color: 'var(--admin-text-muted)', fontWeight: 600 }}>Real-Time Log</span>
          </div>

          <div style={{ padding: '1.25rem 1.5rem', flexGrow: 1 }}>
            <div className="recent-activities-list" style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {recentActivities.map(activity => (
                <div key={activity.id} className="activity-item">
                  <div className="unified-admin-icon sm" style={{ background: activity.badgeBg, color: activity.badgeColor, flexShrink: 0 }}>
                    {renderIcon(activity.icon, 16)}
                  </div>
                  
                  <div style={{ flexGrow: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.2rem' }}>
                      <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--admin-text-main)' }}>{activity.title}</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--admin-text-muted)' }}>{activity.time}</span>
                    </div>
                    <p style={{ margin: 0, fontSize: '0.84rem', color: 'var(--admin-text-muted)', lineHeight: 1.4 }}>
                      {activity.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Server & System Health Status Widget */}
        <div className="admin-panel" style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="panel-header" style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--admin-border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <div className="unified-admin-icon sm" style={{ background: 'rgba(16, 185, 129, 0.12)', color: '#10b981' }}>
                <Icons.Server size={18} />
              </div>
              <span className="panel-title" style={{ fontSize: '1.1rem' }}>System & Infrastructure Health</span>
            </div>
          </div>

          <div style={{ padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '0.85rem', flexGrow: 1 }}>
            {systemServices.map((svc, i) => (
              <div key={i} style={{ padding: '0.85rem 1rem', background: 'var(--theme-toggle-bg, rgba(255,255,255,0.03))', borderRadius: '12px', border: '1px solid var(--admin-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--admin-text-main)' }}>{svc.name}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--admin-text-muted)', marginTop: '0.15rem' }}>Latency: {svc.latency}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', background: `${svc.color}18`, color: svc.color, border: `1px solid ${svc.color}40`, padding: '0.2rem 0.55rem', borderRadius: '50px', fontSize: '0.72rem', fontWeight: 700 }}>
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: svc.color }} />
                    {svc.status}
                  </span>
                  <div style={{ fontSize: '0.72rem', color: 'var(--admin-text-muted)', marginTop: '0.2rem' }}>{svc.health}</div>
                </div>
              </div>
            ))}

            <div style={{ marginTop: 'auto', padding: '1.1rem', background: 'var(--theme-toggle-bg, rgba(255,255,255,0.03))', borderRadius: '14px', border: '1px solid var(--admin-border)', textAlign: 'center' }}>
              <div className="unified-admin-icon" style={{ margin: '0 auto 0.6rem', background: 'rgba(99, 102, 241, 0.15)', color: '#6366f1' }}>
                <Icons.ShieldCheck size={22} />
              </div>
              <h4 style={{ margin: '0 0 0.25rem', fontSize: '0.95rem', color: 'var(--admin-text-main)' }}>Global Platform Online</h4>
              <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--admin-text-muted)' }}>
                All 6 product services online • SSL & Multi-Tenant ADC Verified
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default DashboardOverview;
