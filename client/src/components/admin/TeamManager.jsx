import React, { useState } from 'react';
import { FiUserPlus, FiUser, FiMail, FiCheck, FiX, FiShield, FiAlertCircle, FiEdit2, FiTrash2, FiKey, FiPlus } from 'react-icons/fi';
import { useTeam } from '../../hooks/useTeam.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { Modal } from '../common/Modal.jsx';
import { RoleBadge } from '../common/Badge.jsx';
import { TableSkeleton } from '../common/Skeleton.jsx';

export const TeamManager = () => {
  const { user } = useAuth();
  const { team, loading, roles, inviteMember, updateMember, deleteMember, createRole } = useTeam();

  // Invite / Add Modal State
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('SUPPORT_ENGINEER');
  const [inviting, setInviting] = useState(false);

  // Edit Modal State
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editRole, setEditRole] = useState('SUPPORT_ENGINEER');
  const [editIsActive, setEditIsActive] = useState(true);
  const [editPassword, setEditPassword] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);

  // Create Role Modal State
  const [isCreateRoleOpen, setIsCreateRoleOpen] = useState(false);
  const [newRoleName, setNewRoleName] = useState('');
  const [newRoleDescription, setNewRoleDescription] = useState('');
  const [newRoleBase, setNewRoleBase] = useState('SUPPORT_ENGINEER');
  const [creatingRole, setCreatingRole] = useState(false);

  const canManageTeam = !user || user?.role === 'SUPER_ADMIN' || user?.role === 'SUPPORT_LEAD' || user?.role === 'ADMIN';

  const handleInviteSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !password) return;

    setInviting(true);
    try {
      const matchedRole = roles.find((r) => r.id === role);
      await inviteMember({
        name: name.trim(),
        email: email.trim(),
        password,
        role,
        customRole: matchedRole && !matchedRole.isSystem ? matchedRole.name : null
      });
      setIsInviteOpen(false);
      setName('');
      setEmail('');
      setPassword('');
      setRole('SUPPORT_ENGINEER');
    } catch {
      // Toast handled
    } finally {
      setInviting(false);
    }
  };

  const handleOpenEdit = (member) => {
    setEditingMember(member);
    setEditName(member.name || '');
    setEditEmail(member.email || '');

    // Match either custom role ID or system role
    const matched = roles.find(
      (r) => r.name.toLowerCase() === (member.customRole || '').toLowerCase() || r.id === member.role
    );
    setEditRole(matched ? matched.id : member.role || 'SUPPORT_ENGINEER');
    setEditIsActive(member.isActive !== false);
    setEditPassword('');
    setIsEditOpen(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editingMember || !editName.trim() || !editEmail.trim()) return;

    setSavingEdit(true);
    try {
      const matchedRole = roles.find((r) => r.id === editRole);
      const payload = {
        name: editName.trim(),
        email: editEmail.trim(),
        role: editRole,
        customRole: matchedRole && !matchedRole.isSystem ? matchedRole.name : null,
        isActive: editIsActive
      };

      if (editPassword && editPassword.trim().length >= 6) {
        payload.password = editPassword.trim();
      }

      await updateMember(editingMember.id, payload);
      setIsEditOpen(false);
      setEditingMember(null);
    } catch {
      // Toast handled
    } finally {
      setSavingEdit(false);
    }
  };

  const handleCreateRoleSubmit = async (e) => {
    e.preventDefault();
    if (!newRoleName.trim()) return;

    setCreatingRole(true);
    try {
      const created = await createRole({
        name: newRoleName.trim(),
        description: newRoleDescription.trim(),
        baseRole: newRoleBase
      });

      // Automatically select the newly created role in the add modal
      setRole(created.id);
      setIsCreateRoleOpen(false);
      setNewRoleName('');
      setNewRoleDescription('');
      setNewRoleBase('SUPPORT_ENGINEER');
    } catch {
      // Toast handled
    } finally {
      setCreatingRole(false);
    }
  };

  const handleToggleActive = async (id, currentActive) => {
    try {
      await updateMember(id, { isActive: !currentActive });
    } catch {
      // Toast handled
    }
  };

  const handleDeleteMember = async (member) => {
    if (window.confirm(`Are you sure you want to permanently remove ${member.name} (${member.email}) from the staff team?`)) {
      try {
        await deleteMember(member.id);
      } catch {
        // Toast handled
      }
    }
  };

  const systemRolesList = roles.filter((r) => r.isSystem);
  const customRolesList = roles.filter((r) => !r.isSystem);

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
          <h1 style={{ fontSize: '1.75rem', marginBottom: '4px' }}>Staff & Role Access Control</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            Manage support engineers, leads, custom roles, and administrators handling CGS support.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {/* Create Role Button */}
          <button
            onClick={() => setIsCreateRoleOpen(true)}
            className="btn-secondary"
            style={{ height: '38px', gap: '6px', display: 'inline-flex', alignItems: 'center' }}
          >
            <FiShield size={16} />
            <span>Create Role</span>
          </button>

          {/* Add Team Member Button */}
          <button
            onClick={() => setIsInviteOpen(true)}
            className="btn-primary"
            style={{ height: '38px', gap: '6px', display: 'inline-flex', alignItems: 'center' }}
          >
            <FiUserPlus size={16} />
            <span>Add Team Member</span>
          </button>
        </div>
      </div>

      {/* Team Table */}
      {loading ? (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <TableSkeleton rows={4} cols={5} />
        </div>
      ) : (
        <>
          <div className="table-container hide-on-mobile">
          <table className="data-table">
            <thead>
              <tr>
                <th>Member</th>
                <th>Role</th>
                <th>Status</th>
                <th>Active Tickets</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {team.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: 'var(--space-8)' }}>
                    <div style={{ color: 'var(--text-muted)', marginBottom: 'var(--space-3)', fontSize: '0.9rem' }}>
                      No team members found yet.
                    </div>
                    <button
                      onClick={() => setIsInviteOpen(true)}
                      className="btn-primary"
                      style={{ height: '36px', gap: '6px', display: 'inline-flex', alignItems: 'center', margin: '0 auto' }}
                    >
                      <FiUserPlus size={15} />
                      <span>Add First Team Member</span>
                    </button>
                  </td>
                </tr>
              ) : (
                team.map((member) => (
                  <tr key={member.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div
                          style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: 'var(--radius-full)',
                            background: 'var(--surface-2)',
                            border: '1px solid var(--border)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 700,
                            color: 'var(--accent)'
                          }}
                        >
                          {member.name?.charAt(0).toUpperCase() || 'U'}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600 }}>{member.name}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{member.email}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <RoleBadge role={member.customRole || member.role} />
                    </td>
                    <td>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          color: member.isActive ? 'var(--success)' : 'var(--text-disabled)'
                        }}
                      >
                        <span
                          style={{
                            width: '6px',
                            height: '6px',
                            borderRadius: '50%',
                            background: 'currentColor'
                          }}
                        />
                        {member.isActive ? 'Active' : 'Disabled'}
                      </span>
                    </td>
                    <td style={{ fontWeight: 600, color: 'var(--text)' }}>
                      {member._count?.assignedTickets ?? 0}
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {/* Edit Button */}
                        <button
                          onClick={() => handleOpenEdit(member)}
                          className="btn-ghost"
                          title="Edit member details"
                          style={{
                            fontSize: '0.75rem',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            color: 'var(--accent)'
                          }}
                        >
                          <FiEdit2 size={13} />
                          <span>Edit</span>
                        </button>

                        {/* Status Toggle */}
                        {member.id !== user?.id && (
                          <button
                            onClick={() => handleToggleActive(member.id, member.isActive)}
                            className="btn-ghost"
                            style={{
                              fontSize: '0.75rem',
                              color: member.isActive ? 'var(--danger)' : 'var(--success)'
                            }}
                          >
                            {member.isActive ? 'Deactivate' : 'Reactivate'}
                          </button>
                        )}

                        {/* Delete Button (if not self) */}
                        {member.id !== user?.id && (
                          <button
                            onClick={() => handleDeleteMember(member)}
                            className="btn-ghost"
                            title="Delete staff account"
                            style={{
                              fontSize: '0.75rem',
                              color: 'var(--text-muted)',
                              padding: '4px 6px'
                            }}
                          >
                            <FiTrash2 size={13} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards View */}
        <div className="show-on-mobile mobile-card-list">
          {team.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: 'var(--space-6)', color: 'var(--text-muted)' }}>
              No team members found yet.
            </div>
          ) : (
            team.map((member) => (
              <div key={member.id} className="mobile-card-item">
                <div className="mobile-card-header">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '50%',
                        background: 'var(--accent)',
                        color: 'var(--accent-contrast)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 700,
                        fontSize: '0.85rem',
                        flexShrink: 0
                      }}
                    >
                      {(member.name || 'U').charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>
                        {member.name || 'Unnamed Agent'}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {member.email}
                      </div>
                    </div>
                  </div>
                  <RoleBadge role={member.customRole || member.role} />
                </div>

                <div className="mobile-card-body">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Access Status:</span>
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        color: member.isActive ? 'var(--success)' : 'var(--danger)'
                      }}
                    >
                      <span
                        style={{
                          width: '6px',
                          height: '6px',
                          borderRadius: '50%',
                          background: member.isActive ? 'var(--success)' : 'var(--danger)'
                        }}
                      />
                      {member.isActive ? 'Active' : 'Disabled'}
                    </span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Active Tickets:</span>
                    <span style={{ fontWeight: 700 }}>
                      {member._count?.assignedTickets ?? 0} tickets
                    </span>
                  </div>
                </div>

                <div className="mobile-card-footer" style={{ gap: '8px', flexWrap: 'wrap' }}>
                  <button
                    onClick={() => handleOpenEdit(member)}
                    className="btn-secondary"
                    style={{ padding: '6px 12px', fontSize: '0.8rem', gap: '4px' }}
                  >
                    <FiEdit2 size={13} />
                    <span>Edit Member</span>
                  </button>

                  {member.id !== user?.id && (
                    <button
                      onClick={() => handleToggleActive(member.id, member.isActive)}
                      className="btn-ghost"
                      style={{
                        fontSize: '0.8rem',
                        color: member.isActive ? 'var(--danger)' : 'var(--success)'
                      }}
                    >
                      {member.isActive ? 'Deactivate' : 'Reactivate'}
                    </button>
                  )}

                  {member.id !== user?.id && (
                    <button
                      onClick={() => handleDeleteMember(member)}
                      className="btn-ghost"
                      title="Delete staff account"
                      style={{
                        fontSize: '0.8rem',
                        color: 'var(--danger)',
                        marginLeft: 'auto'
                      }}
                    >
                      <FiTrash2 size={15} />
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </>
    )}

      {/* Add New Member Modal */}
      <Modal isOpen={isInviteOpen} onClose={() => setIsInviteOpen(false)} title="Add New Team Member">
        <form onSubmit={handleInviteSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>

          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '6px' }}>
              Full Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. William Butcher"
              required
              className="input-field"
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '6px' }}>
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="support.agent@company.com"
              required
              className="input-field"
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '6px' }}>
              Temporary Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min. 6 characters"
              required
              className="input-field"
            />
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <label style={{ fontSize: '0.8125rem', fontWeight: 600 }}>
                Role Assignment
              </label>
              <button
                type="button"
                onClick={() => setIsCreateRoleOpen(true)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--accent)',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: 0
                }}
              >
                <FiPlus size={12} /> Create Role
              </button>
            </div>
            <select value={role} onChange={(e) => setRole(e.target.value)} className="input-field" required>
              <optgroup label="System Roles">
                {systemRolesList.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
                {systemRolesList.length === 0 && (
                  <>
                    <option value="SUPPORT_ENGINEER">Support Engineer</option>
                    <option value="SUPPORT_LEAD">Support Lead</option>
                    <option value="PRODUCT_MANAGER">Product Manager</option>
                    <option value="SUPER_ADMIN">Super Admin</option>
                  </>
                )}
              </optgroup>

              {customRolesList.length > 0 && (
                <optgroup label="Custom Created Roles">
                  {customRolesList.map((r) => (
                    <option key={r.id} value={r.id}>
                      ⭐ {r.name} ({r.baseRole.replace(/_/g, ' ')})
                    </option>
                  ))}
                </optgroup>
              )}
            </select>
          </div>

          <div className="modal-actions-footer">
            <button type="button" onClick={() => setIsInviteOpen(false)} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={inviting} className="btn-primary">
              {inviting ? 'Adding Member...' : 'Add Team Member'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Member Details Modal */}
      <Modal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} title="Edit Team Member Details">
        <form onSubmit={handleEditSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '6px' }}>
              Full Name
            </label>
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              placeholder="Full Name"
              required
              className="input-field"
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '6px' }}>
              Email Address
            </label>
            <input
              type="email"
              value={editEmail}
              onChange={(e) => setEditEmail(e.target.value)}
              placeholder="email@company.com"
              required
              className="input-field"
            />
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <label style={{ fontSize: '0.8125rem', fontWeight: 600 }}>
                Role Assignment
              </label>
              <button
                type="button"
                onClick={() => setIsCreateRoleOpen(true)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--accent)',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: 0
                }}
              >
                <FiPlus size={12} /> Create Role
              </button>
            </div>
            <select value={editRole} onChange={(e) => setEditRole(e.target.value)} className="input-field">
              <optgroup label="System Roles">
                {systemRolesList.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
                {systemRolesList.length === 0 && (
                  <>
                    <option value="SUPPORT_ENGINEER">Support Engineer</option>
                    <option value="SUPPORT_LEAD">Support Lead</option>
                    <option value="PRODUCT_MANAGER">Product Manager</option>
                    <option value="SUPER_ADMIN">Super Admin</option>
                  </>
                )}
              </optgroup>

              {customRolesList.length > 0 && (
                <optgroup label="Custom Created Roles">
                  {customRolesList.map((r) => (
                    <option key={r.id} value={r.id}>
                      ⭐ {r.name} ({r.baseRole.replace(/_/g, ' ')})
                    </option>
                  ))}
                </optgroup>
              )}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '6px' }}>
              Account Status
            </label>
            <select
              value={editIsActive ? 'active' : 'disabled'}
              onChange={(e) => setEditIsActive(e.target.value === 'active')}
              className="input-field"
            >
              <option value="active">Active (Access Enabled)</option>
              <option value="disabled">Disabled (Access Blocked)</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '6px' }}>
              Reset Password (Optional)
            </label>
            <input
              type="password"
              value={editPassword}
              onChange={(e) => setEditPassword(e.target.value)}
              placeholder="Leave blank to keep current password"
              className="input-field"
            />
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
              Enter min. 6 characters only if you want to reset this user's password.
            </span>
          </div>

          <div className="modal-actions-footer">
            <button type="button" onClick={() => setIsEditOpen(false)} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={savingEdit} className="btn-primary">
              {savingEdit ? 'Saving Changes...' : 'Save Member Details'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Create New Role Modal */}
      <Modal isOpen={isCreateRoleOpen} onClose={() => setIsCreateRoleOpen(false)} title="Create New Role">
        <form onSubmit={handleCreateRoleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>

          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '6px' }}>
              Role Title / Name
            </label>
            <input
              type="text"
              value={newRoleName}
              onChange={(e) => setNewRoleName(e.target.value)}
              placeholder="e.g. Customer Success Manager"
              required
              className="input-field"
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '6px' }}>
              Base System Permission Level
            </label>
            <select
              value={newRoleBase}
              onChange={(e) => setNewRoleBase(e.target.value)}
              className="input-field"
              required
            >
              <option value="SUPPORT_ENGINEER">Support Engineer Level (Reply to tickets & resolve issues)</option>
              <option value="SUPPORT_LEAD">Support Lead Level (Assign tickets & supervise team)</option>
              <option value="PRODUCT_MANAGER">Product Manager Level (Manage products & analytics)</option>
              <option value="SUPER_ADMIN">Super Admin Level (Full system access & billing)</option>
            </select>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
              Determines the underlying operational permissions for members assigned this title.
            </span>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '6px' }}>
              Role Description (Optional)
            </label>
            <textarea
              value={newRoleDescription}
              onChange={(e) => setNewRoleDescription(e.target.value)}
              placeholder="Brief description of the responsibilities for this role..."
              className="input-field"
              style={{ minHeight: '80px', resize: 'vertical' }}
            />
          </div>

          <div className="modal-actions-footer">
            <button type="button" onClick={() => setIsCreateRoleOpen(false)} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={creatingRole} className="btn-primary">
              {creatingRole ? 'Creating Role...' : 'Create Role'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default TeamManager;
