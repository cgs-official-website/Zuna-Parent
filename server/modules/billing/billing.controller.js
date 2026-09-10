import { BillingService } from './billing.service.js';
import {
  createSubscriptionSchema,
  updateSubscriptionSchema,
  createInvoiceSchema,
  updateInvoiceSchema,
  querySubscriptionsSchema,
  queryInvoicesSchema
} from './billing.validator.js';

export class BillingController {
  // -------------------------------------------------------------
  // Subscriptions
  // -------------------------------------------------------------

  static async listSubscriptions(req, res, next) {
    try {
      const query = querySubscriptionsSchema.parse(req.query);
      const result = await BillingService.listSubscriptions(query);
      return res.status(200).json({
        success: true,
        data: result.data,
        meta: result.meta
      });
    } catch (error) {
      if (error.name === 'ZodError') {
        return res.status(400).json({
          success: false,
          error: { message: 'Validation failed', details: error.errors }
        });
      }
      next(error);
    }
  }

  static async getSubscriptionById(req, res, next) {
    try {
      const { id } = req.params;
      const sub = await BillingService.getSubscriptionById(id);
      return res.status(200).json({
        success: true,
        data: sub
      });
    } catch (error) {
      next(error);
    }
  }

  static async createSubscription(req, res, next) {
    try {
      const validated = createSubscriptionSchema.parse(req.body);
      const sub = await BillingService.createSubscription(validated);
      return res.status(201).json({
        success: true,
        data: sub
      });
    } catch (error) {
      if (error.name === 'ZodError') {
        return res.status(400).json({
          success: false,
          error: { message: 'Validation failed', details: error.errors }
        });
      }
      next(error);
    }
  }

  static async updateSubscription(req, res, next) {
    try {
      const { id } = req.params;
      const validated = updateSubscriptionSchema.parse(req.body);
      const updated = await BillingService.updateSubscription(id, validated);
      return res.status(200).json({
        success: true,
        data: updated
      });
    } catch (error) {
      if (error.name === 'ZodError') {
        return res.status(400).json({
          success: false,
          error: { message: 'Validation failed', details: error.errors }
        });
      }
      next(error);
    }
  }

  static async deleteSubscription(req, res, next) {
    try {
      const { id } = req.params;
      const result = await BillingService.deleteSubscription(id);
      return res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  // -------------------------------------------------------------
  // Invoices
  // -------------------------------------------------------------

  static async listInvoices(req, res, next) {
    try {
      const query = queryInvoicesSchema.parse(req.query);
      const result = await BillingService.listInvoices(query);
      return res.status(200).json({
        success: true,
        data: result.data,
        meta: result.meta
      });
    } catch (error) {
      if (error.name === 'ZodError') {
        return res.status(400).json({
          success: false,
          error: { message: 'Validation failed', details: error.errors }
        });
      }
      next(error);
    }
  }

  static async getInvoiceById(req, res, next) {
    try {
      const { id } = req.params;
      const invoice = await BillingService.getInvoiceById(id);
      return res.status(200).json({
        success: true,
        data: invoice
      });
    } catch (error) {
      next(error);
    }
  }

  static async createInvoice(req, res, next) {
    try {
      const validated = createInvoiceSchema.parse(req.body);
      const invoice = await BillingService.createInvoice(validated);
      return res.status(201).json({
        success: true,
        data: invoice
      });
    } catch (error) {
      if (error.name === 'ZodError') {
        return res.status(400).json({
          success: false,
          error: { message: 'Validation failed', details: error.errors }
        });
      }
      next(error);
    }
  }

  static async markInvoicePaid(req, res, next) {
    try {
      const { id } = req.params;
      const invoice = await BillingService.markInvoicePaid(id);
      return res.status(200).json({
        success: true,
        data: invoice
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateInvoice(req, res, next) {
    try {
      const { id } = req.params;
      const validated = updateInvoiceSchema.parse(req.body);
      const invoice = await BillingService.updateInvoice(id, validated);
      return res.status(200).json({
        success: true,
        data: invoice
      });
    } catch (error) {
      if (error.name === 'ZodError') {
        return res.status(400).json({
          success: false,
          error: { message: 'Validation failed', details: error.errors }
        });
      }
      next(error);
    }
  }

  static async triggerRenewalScan(req, res, next) {
    try {
      const result = await BillingService.processSubscriptionRenewals();
      return res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }
}
