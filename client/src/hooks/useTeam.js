import { useState, useEffect, useCallback } from 'react';
import { teamService } from '../services/teamService.js';
import { useToast } from '../context/ToastContext.jsx';

export const useTeam = () => {
  const { showToast } = useToast();
  const [team, setTeam] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [roles, setRoles] = useState([]);
  const [loadingRoles, setLoadingRoles] = useState(false);

  const fetchTeam = useCallback(async () => {
    setLoading(true);
    try {
      const data = await teamService.listTeam();
      setTeam(Array.isArray(data) ? data : data?.team || []);
      setError(null);
    } catch (err) {
      const msg = err.response?.data?.error?.message || err.message || 'Failed to fetch team members';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchRoles = useCallback(async () => {
    setLoadingRoles(true);
    try {
      const data = await teamService.getRoles();
      setRoles(Array.isArray(data) ? data : []);
    } catch (err) {
      console.warn('Failed to fetch roles:', err);
    } finally {
      setLoadingRoles(false);
    }
  }, []);

  useEffect(() => {
    fetchTeam();
    fetchRoles();
  }, [fetchTeam, fetchRoles]);

  const createRole = async (roleData) => {
    try {
      const newRole = await teamService.createRole(roleData);
      setRoles((prev) => [...prev, newRole]);
      showToast(`Role "${newRole.name}" created successfully!`, 'success');
      return newRole;
    } catch (err) {
      const msg = err.response?.data?.error?.message || err.message;
      showToast(`Failed to create role: ${msg}`, 'error');
      throw err;
    }
  };

  const inviteMember = async (memberData) => {
    try {
      const invited = await teamService.inviteMember(memberData);
      setTeam((prev) => [invited, ...prev]);
      showToast(`Invited ${invited.name} — Credentials sent via Nodemailer!`, 'success', 5000);
      return invited;
    } catch (err) {
      const msg = err.response?.data?.error?.message || err.message;
      showToast(`Invitation failed: ${msg}`, 'error');
      throw err;
    }
  };

  const updateMember = async (id, memberData) => {
    try {
      const updated = await teamService.updateMember(id, memberData);
      setTeam((prev) => prev.map((m) => (m.id === id ? { ...m, ...updated } : m)));
      showToast('Staff details updated successfully', 'success');
      return updated;
    } catch (err) {
      const msg = err.response?.data?.error?.message || err.message;
      showToast(`Update failed: ${msg}`, 'error');
      throw err;
    }
  };

  const deleteMember = async (id) => {
    try {
      await teamService.deleteMember(id);
      setTeam((prev) => prev.filter((m) => m.id !== id));
      showToast('Team member removed successfully', 'success');
    } catch (err) {
      const msg = err.response?.data?.error?.message || err.message;
      showToast(`Delete failed: ${msg}`, 'error');
      throw err;
    }
  };

  return {
    team,
    loading,
    error,
    roles,
    loadingRoles,
    refetch: fetchTeam,
    refetchRoles: fetchRoles,
    inviteMember,
    updateMember,
    deleteMember,
    createRole
  };
};
