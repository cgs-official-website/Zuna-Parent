import React, { useState } from 'react';
import { FiBarChart2, FiClock, FiCheckCircle, FiTrendingUp, FiUser, FiActivity } from 'react-icons/fi';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid
} from 'recharts';
import { useAnalytics } from '../../hooks/useAnalytics.js';
import { useTheme } from '../../context/ThemeContext.jsx';
import { CardSkeleton } from '../common/Skeleton.jsx';

export const Analytics = () => {
  const [range, setRange] = useState('30d');
  const { kpis, volume, performance, loading } = useAnalytics(range);
  const { isDark } = useTheme();

  const accentColor = isDark ? '#8FB596' : '#4A6B50';
  const textColor = isDark ? '#CFC6B6' : '#8C8378';

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
          <h1 style={{ fontSize: '1.75rem', marginBottom: '4px' }}>Deep Analytics & SLA Compliance</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            System-wide incident volume trends, resolution rates, and staff benchmarks.
          </p>
        </div>

        {/* Range Selector */}
        <div
          style={{
            display: 'flex',
            background: 'var(--surface-2)',
            padding: '3px',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border)'
          }}
        >
          {['7d', '30d', '90d'].map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              style={{
                padding: '6px 14px',
                fontSize: '0.8125rem',
                fontWeight: 600,
                borderRadius: 'var(--radius-xs)',
                background: range === r ? 'var(--accent)' : 'transparent',
                color: range === r ? 'var(--accent-contrast)' : 'var(--text-secondary)'
              }}
            >
              Last {r.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* SLA Metric Cards */}
      {loading && !kpis ? (
        <CardSkeleton count={3} />
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: 'var(--space-4)',
            marginBottom: 'var(--space-6)'
          }}
        >
          <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: 'var(--radius-md)',
                background: 'var(--success-bg)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--success)'
              }}
            >
              <FiCheckCircle size={24} />
            </div>
            <div>
              <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>SLA Compliance Rate</span>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, fontFamily: 'var(--font-display)' }}>
                {kpis?.slaComplianceRate ? `${kpis.slaComplianceRate}%` : 'N/A'}
              </div>
            </div>
          </div>

          <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: 'var(--radius-md)',
                background: 'var(--accent-light)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--accent)'
              }}
            >
              <FiClock size={24} />
            </div>
            <div>
              <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>Mean Time to Resolve</span>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, fontFamily: 'var(--font-display)' }}>
                {kpis?.avgResolutionHours ? `${kpis.avgResolutionHours} hrs` : '0 hrs'}
              </div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                {kpis?.sampleSize ? `Based on ${kpis.sampleSize} tickets` : 'No resolved tickets'}
              </span>
            </div>
          </div>

          <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: 'var(--radius-md)',
                background: 'var(--info-bg)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--info)'
              }}
            >
              <FiActivity size={24} />
            </div>
            <div>
              <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>First Contact Resolution</span>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, fontFamily: 'var(--font-display)' }}>
                {kpis?.firstContactResolution ? `${kpis.firstContactResolution}%` : 'N/A'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Ticket Velocity Chart */}
      <div className="card" style={{ minHeight: '380px', marginBottom: 'var(--space-6)', display: 'flex', flexDirection: 'column' }}>
        <h3 style={{ fontSize: '1.0625rem', marginBottom: '4px' }}>Incident Ingestion Velocity</h3>
        <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: 'var(--space-4)' }}>
          Daily ticket generation across all integrated SaaS verticals
        </p>

        <div style={{ flex: 1, minHeight: '280px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {volume && volume.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={volume}>
                <defs>
                  <linearGradient id="analyticsGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={accentColor} stopOpacity={0.4} />
                    <stop offset="95%" stopColor={accentColor} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" stroke={textColor} fontSize={12} tickLine={false} />
                <YAxis stroke={textColor} fontSize={12} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    background: 'var(--surface-overlay)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-sm)',
                    color: 'var(--text)'
                  }}
                />
                <Area type="monotone" dataKey="tickets" stroke={accentColor} strokeWidth={2.5} fill="url(#analyticsGradient)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
              <FiActivity size={32} style={{ opacity: 0.3, marginBottom: '8px' }} />
              <p>No ticket velocity data recorded for this range.</p>
            </div>
          )}
        </div>
      </div>

      {/* Staff Resolution Leaderboard */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: 'var(--space-4) var(--space-6)', borderBottom: '1px solid var(--border)' }}>
          <h3 style={{ fontSize: '1rem', margin: 0 }}>Support Engineer Performance</h3>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', margin: 0 }}>
            Incident resolution counts and average response latency
          </p>
        </div>

        <div className="table-container" style={{ border: 'none', borderRadius: 0 }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Engineer</th>
                <th>Resolved Tickets</th>
                <th>Average Resolution</th>
                <th>Satisfaction Score</th>
              </tr>
            </thead>
            <tbody>
              {performance && performance.length > 0 ? (
                performance.map((staff, idx) => (
                  <tr key={idx}>
                    <td style={{ fontWeight: 600 }}>{staff.name || 'Staff Member'}</td>
                    <td style={{ fontWeight: 700, color: 'var(--accent)' }}>{staff.resolvedCount ?? 0}</td>
                    <td>{staff.avgTime || '0 hrs'}</td>
                    <td style={{ color: 'var(--success)', fontWeight: 600 }}>{staff.csat ? `${staff.csat} / 5.0` : 'N/A'}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} style={{ textAlign: 'center', padding: 'var(--space-8)', color: 'var(--text-muted)' }}>
                    No staff resolution data recorded yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
