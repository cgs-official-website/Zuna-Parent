import React, { useState, useEffect } from 'react';
import * as Icons from 'lucide-react';
import { usersService } from '../../services/usersService';
import Skeleton from '../common/Skeleton';
import RefreshHeaderPanel from '../common/RefreshControl';

const TeamManager = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'Support Engineer',
    status: 'Active'
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const data = await usersService.getUsers();
      setUsers(data);
    } catch (err) {
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleAddUser = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim()) return;
    setSubmitting(true);
    try {
      await usersService.addUser(formData);
      setFormData({ name: '', email: '', role: 'Support Engineer', status: 'Active' });
      setShowAddModal(false);
      fetchUsers();
    } catch (err) {
      console.error('Error adding user:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteUser = async (id) => {
    if (!window.confirm('Are you sure you want to remove this team member?')) return;
    try {
      await usersService.deleteUser(id);
      fetchUsers();
    } catch (err) {
      console.error('Error deleting user:', err);
    }
  };

  return (
    <div className="admin-overview-container">
      {/* Refreshable Header Bar */}
      <RefreshHeaderPanel
        title="Team & User Management"
        defaultStatusText="Roles, and status for tables"
        loadingText="Skeleton loading"
        onRefresh={fetchUsers}
        isLoading={loading}
        extraActions={
          <button
            className="btn btn-primary"
            onClick={() => setShowAddModal(true)}
            style={{ padding: '0.55rem 1.1rem', fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <Icons.UserPlus size={16} />
            <span>Add Team Member</span>
          </button>
        }
      />

      {/* Users Table / Empty State */}
      <div className="admin-panel">
        {loading ? (
          <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {[1, 2, 3].map(idx => (
              <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <Skeleton width="40px" height="40px" borderRadius="50%" />
                <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  <Skeleton width="180px" height="16px" borderRadius="4px" />
                  <Skeleton width="130px" height="12px" borderRadius="4px" />
                </div>
                <Skeleton width="90px" height="24px" borderRadius="50px" />
              </div>
            ))}
          </div>
        ) : users.length === 0 ? (
          <div style={{ padding: '3.5rem 1.5rem', textAlign: 'center', color: 'var(--admin-text-muted)' }}>
            <Icons.Users size={44} style={{ opacity: 0.3, margin: '0 auto 1rem', display: 'block' }} />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0 0 0.4rem', color: 'var(--admin-text-main)' }}>No Team Members Registered</h3>
            <p style={{ fontSize: '0.85rem', margin: '0 0 1.5rem', color: 'var(--admin-text-muted)', maxWidth: '400px', marginLeft: 'auto', marginRight: 'auto' }}>
              No team members have been added to your system database yet. Click below to add staff engineers, support managers, or administrators.
            </p>
            <button
              className="btn btn-primary"
              onClick={() => setShowAddModal(true)}
              style={{ padding: '0.55rem 1.2rem', fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
            >
              <Icons.UserPlus size={16} /> Add First Team Member
            </button>
          </div>
        ) : (
          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>User / Name</th>
                  <th>Email Address</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th style={{ textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id}>
                    <td style={{ fontWeight: 700, color: 'var(--admin-text-main)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                        <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(0, 132, 255, 0.15)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.82rem' }}>
                          {u.name ? u.name.charAt(0).toUpperCase() : 'U'}
                        </div>
                        <span>{u.name}</span>
                      </div>
                    </td>
                    <td style={{ color: 'var(--admin-text-muted)', fontSize: '0.85rem' }}>{u.email}</td>
                    <td style={{ fontWeight: 600 }}>{u.role}</td>
                    <td>
                      <span style={{
                        padding: '0.2rem 0.65rem',
                        borderRadius: '50px',
                        fontSize: '0.74rem',
                        fontWeight: 700,
                        background: u.status === 'Active' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                        color: u.status === 'Active' ? '#10b981' : '#fbbf24'
                      }}>
                        {u.status}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--admin-text-muted)' }}>
                      {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : 'Recent'}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <button
                        onClick={() => handleDeleteUser(u.id)}
                        title="Remove member"
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

      {/* Add Team Member Modal */}
      {showAddModal && (
        <div className="modal-backdrop" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="modal-content" style={{ background: 'var(--admin-card-bg)', border: '1px solid var(--admin-border)', borderRadius: '16px', padding: '1.5rem', width: '90%', maxWidth: '450px', boxShadow: '0 20px 40px rgba(0,0,0,0.4)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.15rem', color: 'var(--admin-text-main)' }}>Add New Team Member</h3>
              <button onClick={() => setShowAddModal(false)} style={{ background: 'none', border: 'none', color: 'var(--admin-text-muted)', cursor: 'pointer' }}>
                <Icons.X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddUser} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--admin-text-muted)', marginBottom: '0.35rem' }}>Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Home Lander"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  style={{ width: '100%', height: '38px', padding: '0 0.75rem', borderRadius: '8px', border: '1px solid var(--admin-border)', background: 'var(--admin-input-bg)', color: 'var(--admin-text-main)' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--admin-text-muted)', marginBottom: '0.35rem' }}>Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="homelander@abccompany.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  style={{ width: '100%', height: '38px', padding: '0 0.75rem', borderRadius: '8px', border: '1px solid var(--admin-border)', background: 'var(--admin-input-bg)', color: 'var(--admin-text-main)' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--admin-text-muted)', marginBottom: '0.35rem' }}>Role</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  style={{ width: '100%', height: '38px', padding: '0 0.75rem', borderRadius: '8px', border: '1px solid var(--admin-border)', background: 'var(--admin-input-bg)', color: 'var(--admin-text-main)' }}
                >
                  <option value="Admin">Administrator</option>
                  <option value="Support Engineer">Support Engineer</option>
                  <option value="Product Manager">Product Manager</option>
                  <option value="Billing Lead">Billing Lead</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.65rem', marginTop: '0.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Saving...' : 'Add Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamManager;
