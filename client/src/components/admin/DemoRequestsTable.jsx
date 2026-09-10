import React, { useState, useEffect } from 'react';
import * as Icons from 'lucide-react';
import { demoService } from '../../services/demoService';
import Skeleton from '../common/Skeleton';
import RefreshHeaderPanel from '../common/RefreshControl';

const DemoRequestsTable = () => {
  const [demos, setDemos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchDemos = async () => {
    setLoading(true);
    try {
      const data = await demoService.getDemoRequests();
      setDemos(data);
    } catch (err) {
      console.error('Error fetching demo requests:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDemos();
  }, []);

  const handleStatusChange = async (id, newStatus) => {
    try {
      await demoService.updateDemoStatus(id, newStatus);
      fetchDemos();
    } catch (err) {
      console.error('Error updating status:', err);
    }
  };

  const handleDeleteDemo = async (id) => {
    if (!window.confirm('Are you sure you want to delete this demo request?')) return;
    try {
      await demoService.deleteDemoRequest(id);
      fetchDemos();
    } catch (err) {
      console.error('Error deleting demo request:', err);
    }
  };

  const filteredDemos = demos.filter(d => {
    const matchesStatus = filterStatus === 'all' || d.status === filterStatus;
    const matchesSearch =
      (d.name && d.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (d.email && d.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (d.company && d.company.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (d.product && d.product.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="admin-overview-container">
      {/* Refreshable Header Bar */}
      <RefreshHeaderPanel
        title="Demo Requests"
        defaultStatusText="Track and manage incoming product demo requests"
        loadingText="Skeleton loading"
        onRefresh={fetchDemos}
        isLoading={loading}
      />

      {/* Filter Bar */}
      <div className="panel-header" style={{ marginBottom: '1rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', minWidth: '220px', flex: '1 1 auto', maxWidth: '320px' }}>
          <Icons.Search size={15} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--admin-text-muted)' }} />
          <input
            type="text"
            placeholder="Search demo requests..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              height: '36px',
              paddingLeft: '2.2rem',
              paddingRight: '0.75rem',
              fontSize: '0.82rem',
              borderRadius: '8px',
              border: '1px solid var(--admin-border)',
              background: 'var(--admin-input-bg)',
              color: 'var(--admin-text-main)'
            }}
          />
        </div>

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          style={{
            height: '36px',
            padding: '0 0.85rem',
            fontSize: '0.82rem',
            borderRadius: '8px',
            border: '1px solid var(--admin-border)',
            background: 'var(--admin-input-bg)',
            color: 'var(--admin-text-main)'
          }}
        >
          <option value="all">All Statuses</option>
          <option value="New">New</option>
          <option value="Contacted">Contacted</option>
          <option value="Completed">Completed</option>
        </select>
      </div>

      {/* Table / Empty State */}
      <div className="admin-panel">
        {loading ? (
          <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {[1, 2, 3].map(idx => (
              <Skeleton key={idx} width="100%" height="45px" borderRadius="8px" />
            ))}
          </div>
        ) : filteredDemos.length === 0 ? (
          <div style={{ padding: '3.5rem 1.5rem', textAlign: 'center', color: 'var(--admin-text-muted)' }}>
            <Icons.Calendar size={44} style={{ opacity: 0.3, margin: '0 auto 1rem', display: 'block' }} />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0 0 0.4rem', color: 'var(--admin-text-main)' }}>No Demo Requests Found</h3>
            <p style={{ fontSize: '0.85rem', margin: 0, color: 'var(--admin-text-muted)', maxWidth: '400px', marginLeft: 'auto', marginRight: 'auto' }}>
              {demos.length === 0
                ? 'No demo requests have been submitted from the landing page yet.'
                : 'No demo requests match the selected status or search filter.'}
            </p>
          </div>
        ) : (
          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Applicant Name</th>
                  <th>Work Email</th>
                  <th>Phone Number</th>
                  <th>Company</th>
                  <th>Product of Interest</th>
                  <th>Status</th>
                  <th>Submitted Date</th>
                  <th style={{ textAlign: 'center' }}>Update Status</th>
                  <th style={{ textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredDemos.map(d => (
                  <tr key={d.id}>
                    <td style={{ fontWeight: 700, color: 'var(--admin-text-main)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: 'rgba(0, 132, 255, 0.12)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.8rem' }}>
                          {d.name ? d.name.charAt(0).toUpperCase() : 'D'}
                        </div>
                        <span>{d.name}</span>
                      </div>
                    </td>
                    <td style={{ color: 'var(--admin-text-muted)', fontSize: '0.85rem' }}>{d.email}</td>
                    <td style={{ color: 'var(--admin-text-main)', fontSize: '0.85rem' }}>{d.phone || '—'}</td>
                    <td style={{ fontWeight: 600 }}>{d.company || 'N/A'}</td>
                    <td style={{ color: 'var(--accent)', fontWeight: 600 }}>{d.product || 'General Suite'}</td>
                    <td>
                      <span style={{
                        padding: '0.2rem 0.65rem',
                        borderRadius: '50px',
                        fontSize: '0.74rem',
                        fontWeight: 700,
                        background: d.status === 'New' ? 'rgba(245, 158, 11, 0.15)' : d.status === 'Contacted' ? 'rgba(0, 132, 255, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                        color: d.status === 'New' ? '#fbbf24' : d.status === 'Contacted' ? 'var(--accent)' : '#10b981'
                      }}>
                        {d.status}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--admin-text-muted)' }}>
                      {d.createdAt ? new Date(d.createdAt).toLocaleDateString() : 'Recent'}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <select
                        value={d.status}
                        onChange={(e) => handleStatusChange(d.id, e.target.value)}
                        style={{
                          fontSize: '0.78rem',
                          padding: '0.25rem 0.5rem',
                          borderRadius: '6px',
                          border: '1px solid var(--admin-border)',
                          background: 'var(--admin-input-bg)',
                          color: 'var(--admin-text-main)'
                        }}
                      >
                        <option value="New">New</option>
                        <option value="Contacted">Contacted</option>
                        <option value="Completed">Completed</option>
                      </select>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <button
                        onClick={() => handleDeleteDemo(d.id)}
                        title="Delete demo request"
                        style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '0.3rem' }}
                      >
                        <Icons.Trash2 size={16} />
                      </button>
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

export default DemoRequestsTable;
