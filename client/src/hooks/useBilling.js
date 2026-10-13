import { useState, useEffect, useCallback } from 'react';
import { billingService } from '../services/billingService.js';
import { useToast } from '../context/ToastContext.jsx';

export const useBilling = () => {
  const { showToast } = useToast();
  const [subscriptions, setSubscriptions] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchBilling = useCallback(async () => {
    setLoading(true);
    try {
      const [subsData, invsData] = await Promise.all([
        billingService.listSubscriptions().catch(() => []),
        billingService.listInvoices().catch(() => [])
      ]);
      setSubscriptions(Array.isArray(subsData) ? subsData : subsData?.subscriptions || []);
      setInvoices(Array.isArray(invsData) ? invsData : invsData?.invoices || []);
      setError(null);
    } catch (err) {
      const msg = err.response?.data?.error?.message || err.message || 'Failed to fetch billing details';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBilling();
  }, [fetchBilling]);

  const markInvoicePaid = async (id) => {
    try {
      const updated = await billingService.markInvoicePaid(id);
      setInvoices((prev) =>
        prev.map((inv) => (inv.id === id ? { ...inv, status: 'PAID', paidAt: new Date().toISOString() } : inv))
      );
      showToast('Invoice marked as paid', 'success');
      return updated;
    } catch (err) {
      const msg = err.response?.data?.error?.message || err.message;
      showToast(`Action failed: ${msg}`, 'error');
      throw err;
    }
  };

  return {
    subscriptions,
    invoices,
    loading,
    error,
    refetch: fetchBilling,
    markInvoicePaid
  };
};
