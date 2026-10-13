import React, { useState, useEffect } from 'react';
import { FiCalendar, FiMail, FiPhone, FiCheck, FiClock, FiUser } from 'react-icons/fi';
import { demoService } from '../../services/demoService.js';
import { TableSkeleton } from '../common/Skeleton.jsx';
import { useToast } from '../../context/ToastContext.jsx';

export const DemoRequestsTable = () => {
  const { showToast } = useToast();
  const [demos, setDemos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDemos = async () => {
      try {
        const data = await demoService.listDemoRequests();
        setDemos(Array.isArray(data) ? data : data?.demoRequests || []);
      } catch (err) {
        setDemos([]);
      } finally {
        setLoading(false);
      }
    };

    fetchDemos();
  }, []);

  const handleStatusUpdate = async (id, newStatus) => {
    try {
      await demoService.updateDemoRequest(id, { status: newStatus });
      setDemos((prev) =>
        prev.map((d) => (d.id === id ? { ...d, status: newStatus } : d))
      );
      showToast('Lead status updated', 'success');
    } catch (err) {
      showToast(`Update failed: ${err.message}`, 'error');
    }
  };

  return (
    <div className="admin-container">
      <div style={{ marginBottom: 'var(--space-6)' }}>
        <h1 style={{ fontSize: '1.75rem', marginBottom: '4px' }}>Demo Inquiries Pipeline</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
          Prospective client demo bookings submitted through the public SaaS portal.
        </p>
      </div>

      {loading ? (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <TableSkeleton rows={4} cols={5} />
        </div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Lead / Contact</th>
                <th>Product Requested</th>
                <th>Phone Number</th>
                <th>Pipeline Status</th>
                <th>Received</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {demos.map((item) => (
                <tr key={item.id}>
                  <td>
                    <div style={{ fontWeight: 600 }}>{item.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{item.email}</div>
                  </td>
                  <td>
                    <span style={{ fontWeight: 600, color: 'var(--accent)' }}>
                      {item.product?.title || item.productName || 'SaaS Solution'}
                    </span>
                  </td>
                  <td style={{ fontSize: '0.8125rem' }}>{item.phone || 'N/A'}</td>
                  <td>
                    <span
                      className={`badge ${
                        item.status === 'NEW'
                          ? 'badge-open badge-pulse'
                          : item.status === 'COMPLETED'
                          ? 'badge-resolved'
                          : 'badge-progress'
                      }`}
                    >
                      <span className="badge-dot" />
                      {item.status}
                    </span>
                  </td>
                  <td style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {new Date(item.createdAt).toLocaleDateString()}
                  </td>
                  <td>
                    <select
                      value={item.status}
                      onChange={(e) => handleStatusUpdate(item.id, e.target.value)}
                      className="input-field"
                      style={{ height: '32px', fontSize: '0.75rem', padding: '0 8px' }}
                    >
                      <option value="NEW">New</option>
                      <option value="CONTACTED">Contacted</option>
                      <option value="SCHEDULED">Scheduled</option>
                      <option value="COMPLETED">Completed</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default DemoRequestsTable;
