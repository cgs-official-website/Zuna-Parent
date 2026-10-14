import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  FiInbox,
  FiDollarSign,
  FiUsers,
  FiClock,
  FiTrendingUp,
  FiActivity,
  FiArrowUpRight,
  FiRefreshCw
} from 'react-icons/fi';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { useAnalytics } from '../../hooks/useAnalytics.js';
import { useTickets } from '../../hooks/useTickets.js';
import { useTheme } from '../../context/ThemeContext.jsx';
import { CardSkeleton } from '../common/Skeleton.jsx';
import { PriorityBadge, StatusBadge } from '../common/Badge.jsx';

export const DashboardOverview = () => {
  const [timeRange, setTimeRange] = useState('30d');
  const { kpis, volume, distribution, loading, refetch } = useAnalytics(timeRange);
  const { tickets } = useTickets({ limit: 5 });
  const { isDark } = useTheme();

  // Color constants for charts
  const accentColor = isDark ? '#8FB596' : '#4A6B50';
  const gridColor = isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.06)';
  const textColor = isDark ? '#CFC6B6' : '#8C8378';

  const productColors = ['#4A6B50', '#A9BCA0', '#E8773F', '#D9B26F', '#8C8378'];

  return (
    <div className="admin-container">
      {/* Page Header */}
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
          <h1 style={{ fontSize: '1.75rem', marginBottom: '4px' }}>Executive Command Desk</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            Live performance metrics across all 5 CGS SaaS vertical ecosystems.
          </p>
        </div>

        <button
          onClick={refetch}
          className="btn-secondary"
          title="Refresh metrics"
          style={{ height: '38px', gap: '8px' }}
        >
          <FiRefreshCw size={16} />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* KPI Stats Grid */}
      {loading && !kpis ? (
        <CardSkeleton count={4} />
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: 'var(--space-4)',
            marginBottom: 'var(--space-6)'
          }}
        >
          {/* Card 1: Open Tickets */}
          <KpiCard
            title="Open Tickets"
            value={kpis?.openTicketCount ?? kpis?.openTickets ?? tickets.filter((t) => t.status !== 'RESOLVED' && t.status !== 'CLOSED').length}
            icon={FiInbox}
            trend={kpis?.ticketTrend || null}
            accentColor="var(--info)"
          />

          {/* Card 2: Active Subscriptions */}
          <KpiCard
            title="Active Customers"
            value={kpis?.activeCustomers ?? kpis?.activeSubscriptions ?? 0}
            icon={FiUsers}
            trend={kpis?.customerTrend || null}
            accentColor="var(--success)"
          />

          {/* Card 3: MRR (Paise to INR) */}
          <KpiCard
            title="Monthly Recurring Rev."
            value={
              kpis?.mrrPaise
                ? `₹${(kpis.mrrPaise / 100).toLocaleString('en-IN')}`
                : (kpis?.mrrRupees ? `₹${kpis.mrrRupees.toLocaleString('en-IN')}` : '₹0')
            }
            icon={FiDollarSign}
            trend={kpis?.mrrTrend || null}
            accentColor="var(--accent)"
          />

          {/* Card 4: Avg Resolution SLA */}
          <KpiCard
            title="Average Resolution SLA"
            value={
              kpis?.avgResolutionHours
                ? `${kpis.avgResolutionHours} hrs`
                : (kpis?.avgResolutionTime || '0 hrs')
            }
            icon={FiClock}
            trend={kpis?.slaTrend || null}
            accentColor="var(--warning)"
          />
        </div>
      )}

      {/* Charts Section */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: 'var(--space-5)',
          marginBottom: 'var(--space-6)'
        }}
      >
        {/* Ticket Volume Area Chart */}
        <div
          className="card"
          style={{
            gridColumn: 'span 2',
            minHeight: '380px',
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 'var(--space-4)'
            }}
          >
            <div>
              <h3 style={{ fontSize: '1.0625rem', marginBottom: '2px' }}>Ticket Volume Over Time</h3>
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                Incident velocity across CGS product lines
              </p>
            </div>

            {/* Time Range Selector */}
            <div
              style={{
                display: 'flex',
                background: 'var(--surface-2)',
                padding: '3px',
                borderRadius: 'var(--radius-sm)',
                gap: '2px'
              }}
            >
              {['7d', '30d', '90d'].map((r) => (
                <button
                  key={r}
                  onClick={() => setTimeRange(r)}
                  style={{
                    padding: '4px 10px',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    borderRadius: 'var(--radius-xs)',
                    background: timeRange === r ? 'var(--accent)' : 'transparent',
                    color: timeRange === r ? 'var(--accent-contrast)' : 'var(--text-secondary)'
                  }}
                >
                  {r.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          <div style={{ flex: 1, width: '100%', minHeight: '280px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {volume && volume.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={volume}>
                  <defs>
                    <linearGradient id="ticketVolumeGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={accentColor} stopOpacity={0.4} />
                      <stop offset="95%" stopColor={accentColor} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" stroke={textColor} fontSize={12} tickLine={false} />
                  <YAxis stroke={textColor} fontSize={12} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      background: 'var(--surface-overlay)',
                      backdropFilter: 'blur(8px)',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-sm)',
                      color: 'var(--text)'
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="tickets"
                    stroke={accentColor}
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#ticketVolumeGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                <FiActivity size={32} style={{ opacity: 0.3, marginBottom: '8px' }} />
                <p>No ticket volume data recorded for this range.</p>
              </div>
            )}
          </div>
        </div>

        {/* Product Category Distribution Donut */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ fontSize: '1.0625rem', marginBottom: '2px' }}>Product Breakdown</h3>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: 'var(--space-4)' }}>
            Ticket load per vertical product
          </p>

          <div style={{ flex: 1, minHeight: '220px', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {distribution?.byProduct && distribution.byProduct.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={distribution.byProduct}
                    innerRadius={60}
                    outerRadius={85}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {distribution.byProduct.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={productColors[index % productColors.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: 'var(--surface)',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-sm)',
                      color: 'var(--text)'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                <p>No product breakdown available yet.</p>
              </div>
            )}
          </div>

          {/* Legend */}
          {distribution?.byProduct && distribution.byProduct.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: 'auto' }}>
              {distribution.byProduct.map((item, i) => (
                <div
                  key={item.name}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '0.75rem',
                    color: 'var(--text-muted)'
                  }}
                >
                  <span
                    style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      background: productColors[i % productColors.length]
                    }}
                  />
                  <span>{item.name}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent Incidents Table Preview */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div
          style={{
            padding: 'var(--space-4) var(--space-6)',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div>
            <h3 style={{ fontSize: '1rem', margin: 0 }}>Recent Ingestion Stream</h3>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', margin: 0 }}>
              Real-time incoming support tickets from external apps
            </p>
          </div>

          <a
            href="/admin/dashboard/tickets"
            style={{
              fontSize: '0.8125rem',
              fontWeight: 600,
              color: 'var(--accent)',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <span>View All Tickets</span>
            <FiArrowUpRight size={16} />
          </a>
        </div>

        <div className="table-container" style={{ border: 'none', borderRadius: 0 }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Subject</th>
                <th>Product</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {tickets.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: 'var(--space-8)', color: 'var(--text-muted)' }}>
                    No incoming tickets in the stream yet.
                  </td>
                </tr>
              ) : (
                tickets.slice(0, 5).map((ticket) => (
                  <tr key={ticket.id}>
                    <td style={{ fontWeight: 700, color: 'var(--accent)' }}>#{ticket.id}</td>
                    <td style={{ fontWeight: 600, maxWidth: '280px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {ticket.subject}
                    </td>
                    <td>{ticket.product?.title || ticket.productNameSnapshot || 'General'}</td>
                    <td>
                      <PriorityBadge priority={ticket.priority} />
                    </td>
                    <td>
                      <StatusBadge status={ticket.status} />
                    </td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.8125rem' }}>
                      {new Date(ticket.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// Subcomponent: Animated KPI Card
const KpiCard = ({ title, value, icon: Icon, trend, accentColor }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="card card-hover"
      style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-muted)' }}>
          {title}
        </span>
        <div
          style={{
            width: '36px',
            height: '36px',
            borderRadius: 'var(--radius-icon, 16px)',
            background: 'var(--bg-sage-soft)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--primary)'
          }}
        >
          <Icon size={18} />
        </div>
      </div>

      <div
        style={{
          fontSize: '1.875rem',
          fontWeight: 800,
          fontFamily: 'var(--font-display)',
          color: 'var(--text-heading)',
          letterSpacing: '-0.02em',
          lineHeight: 1.1
        }}
      >
        {value}
      </div>

      {trend && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            fontSize: '0.75rem',
            color: 'var(--text-secondary)',
            marginTop: '4px'
          }}
        >
          <FiTrendingUp size={12} color="var(--success)" />
          <span>{trend}</span>
        </div>
      )}
    </motion.div>
  );
};

export default DashboardOverview;
