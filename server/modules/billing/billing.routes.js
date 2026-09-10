import { Router } from 'express';
import { BillingController } from './billing.controller.js';
import { requireAuth } from '../../middleware/requireAuth.js';

const router = Router();

// Protect all billing routes
router.use(requireAuth);

// Subscriptions
router.get('/subscriptions', BillingController.listSubscriptions);
router.post('/subscriptions', BillingController.createSubscription);
router.get('/subscriptions/:id', BillingController.getSubscriptionById);
router.patch('/subscriptions/:id', BillingController.updateSubscription);
router.delete('/subscriptions/:id', BillingController.deleteSubscription);

// Invoices
router.get('/invoices', BillingController.listInvoices);
router.post('/invoices', BillingController.createInvoice);
router.get('/invoices/:id', BillingController.getInvoiceById);
router.post('/invoices/:id/mark-paid', BillingController.markInvoicePaid);
router.patch('/invoices/:id', BillingController.updateInvoice);

// Manual Renewal Trigger (Admin)
router.post('/process-renewals', BillingController.triggerRenewalScan);

export default router;
