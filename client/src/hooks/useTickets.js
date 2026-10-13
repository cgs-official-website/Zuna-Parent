import { useState, useEffect, useCallback } from 'react';
import { ticketsService } from '../services/ticketsService.js';
import { useToast } from '../context/ToastContext.jsx';

export const useTickets = (initialFilters = {}) => {
  const { showToast } = useToast();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState(initialFilters);
  const [meta, setMeta] = useState({ total: 0, page: 1, limit: 20 });
  const [pulsingRowId, setPulsingRowId] = useState(null);

  const fetchTickets = useCallback(async () => {
    setLoading(true);
    try {
      const res = await ticketsService.listTickets(filters);
      if (Array.isArray(res)) {
        setTickets(res);
      } else if (res?.tickets) {
        setTickets(res.tickets);
        if (res.meta) setMeta(res.meta);
      } else {
        setTickets([]);
      }
      setError(null);
    } catch (err) {
      const msg = err.response?.data?.error?.message || err.message || 'Failed to fetch tickets';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  // Realtime Socket integration
  useEffect(() => {
    const handleCreated = (e) => {
      const newTicket = e.detail;
      if (!newTicket?.id) return;
      setTickets((prev) => [newTicket, ...prev.filter((t) => t.id !== newTicket.id)]);
      setPulsingRowId(newTicket.id);
      setTimeout(() => setPulsingRowId(null), 3000);
    };

    const handleUpdated = (e) => {
      const updated = e.detail;
      if (!updated?.id) return;
      setTickets((prev) =>
        prev.map((t) => (t.id === updated.id ? { ...t, ...updated } : t))
      );
      setPulsingRowId(updated.id);
      setTimeout(() => setPulsingRowId(null), 3000);
    };

    window.addEventListener('socket:ticket:created', handleCreated);
    window.addEventListener('socket:ticket:updated', handleUpdated);

    return () => {
      window.removeEventListener('socket:ticket:created', handleCreated);
      window.removeEventListener('socket:ticket:updated', handleUpdated);
    };
  }, []);

  const updateTicket = async (id, data) => {
    try {
      const updated = await ticketsService.updateTicket(id, data);
      setTickets((prev) =>
        prev.map((t) => (t.id === id ? { ...t, ...updated } : t))
      );
      showToast('Ticket updated successfully', 'success');
      return updated;
    } catch (err) {
      const msg = err.response?.data?.error?.message || err.message;
      showToast(`Update failed: ${msg}`, 'error');
      throw err;
    }
  };

  const notifyAgent = async (id) => {
    try {
      const res = await ticketsService.notifyAgent(id);
      showToast(res.message || 'Assignment notification dispatched via Nodemailer', 'success');
      return res;
    } catch (err) {
      const msg = err.response?.data?.error?.message || err.message;
      showToast(`Notification failed: ${msg}`, 'error');
      throw err;
    }
  };

  return {
    tickets,
    loading,
    error,
    filters,
    setFilters,
    meta,
    pulsingRowId,
    refetch: fetchTickets,
    updateTicket,
    notifyAgent
  };
};
