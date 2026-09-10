import { prisma } from '../../lib/prisma.js';
import { logger } from '../../lib/logger.js';

export class BillingService {
  // -------------------------------------------------------------
  // Subscriptions
  // -------------------------------------------------------------

  static async listSubscriptions({ page = 1, limit = 20, status, productId, search }) {
    const andConditions = [];

    if (status && status !== 'all') {
      andConditions.push({ status });
    }

    if (productId && productId !== 'all') {
      andConditions.push({ productId });
    }

    if (search && search.trim()) {
      andConditions.push({
        clientCompanyName: { contains: search.trim(), mode: 'insensitive' }
      });
    }

    const where = andConditions.length > 0 ? { AND: andConditions } : {};
    const skip = (page - 1) * limit;

    const [subscriptions, total] = await Promise.all([
      prisma.subscription.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          product: {
            select: { id: true, title: true, category: true, badgeColor: true }
          },
          _count: {
            select: { invoices: true }
          }
        }
      }),
      prisma.subscription.count({ where })
    ]);

    return {
      data: subscriptions,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
        hasNextPage: page * limit < total
      }
    };
  }

  static async getSubscriptionById(id) {
    const sub = await prisma.subscription.findUnique({
      where: { id },
      include: {
        product: true,
        invoices: {
          orderBy: { issuedAt: 'desc' }
        }
      }
    });

    if (!sub) {
      const error = new Error(`Subscription with ID ${id} not found.`);
      error.statusCode = 404;
      throw error;
    }

    return sub;
  }

  static async createSubscription(data) {
    const now = new Date();
    const periodStart = data.currentPeriodStart ? new Date(data.currentPeriodStart) : now;
    const periodEnd = data.currentPeriodEnd
      ? new Date(data.currentPeriodEnd)
      : new Date(periodStart.getTime() + 30 * 24 * 60 * 60 * 1000);

    const result = await prisma.$transaction(async (tx) => {
      const sub = await tx.subscription.create({
        data: {
          clientCompanyName: data.clientCompanyName,
          productId: data.productId,
          tier: data.tier || 'STARTER',
          monthlyAmountPaise: data.monthlyAmountPaise,
          status: data.status || 'TRIALING',
          currentPeriodStart: periodStart,
          currentPeriodEnd: periodEnd
        },
        include: {
          product: true
        }
      });

      // Automatically generate initial invoice for the subscription
      const invoice = await tx.invoice.create({
        data: {
          subscriptionId: sub.id,
          amountPaise: sub.monthlyAmountPaise,
          status: 'PENDING',
          issuedAt: now,
          dueAt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
        }
      });

      return { sub, invoice };
    });

    logger.info({ subscriptionId: result.sub.id, client: data.clientCompanyName }, 'Created new subscription and initial invoice');
    return result.sub;
  }

  static async updateSubscription(id, data) {
    await this.getSubscriptionById(id);

    const updateData = {};
    if (data.clientCompanyName) updateData.clientCompanyName = data.clientCompanyName;
    if (data.productId) updateData.productId = data.productId;
    if (data.tier) updateData.tier = data.tier;
    if (data.monthlyAmountPaise !== undefined) updateData.monthlyAmountPaise = data.monthlyAmountPaise;
    if (data.status) updateData.status = data.status;
    if (data.currentPeriodStart) updateData.currentPeriodStart = new Date(data.currentPeriodStart);
    if (data.currentPeriodEnd) updateData.currentPeriodEnd = new Date(data.currentPeriodEnd);

    const updated = await prisma.subscription.update({
      where: { id },
      data: updateData,
      include: {
        product: true
      }
    });

    return updated;
  }

  static async deleteSubscription(id) {
    await this.getSubscriptionById(id);

    await prisma.subscription.delete({
      where: { id }
    });

    return { id, deleted: true };
  }

  // -------------------------------------------------------------
  // Invoices
  // -------------------------------------------------------------

  static async listInvoices({ page = 1, limit = 20, status, subscriptionId }) {
    const andConditions = [];

    if (status && status !== 'all') {
      andConditions.push({ status });
    }

    if (subscriptionId) {
      andConditions.push({ subscriptionId });
    }

    const where = andConditions.length > 0 ? { AND: andConditions } : {};
    const skip = (page - 1) * limit;

    const [invoices, total] = await Promise.all([
      prisma.invoice.findMany({
        where,
        skip,
        take: limit,
        orderBy: { issuedAt: 'desc' },
        include: {
          subscription: {
            select: {
              id: true,
              clientCompanyName: true,
              tier: true,
              product: {
                select: { id: true, title: true }
              }
            }
          }
        }
      }),
      prisma.invoice.count({ where })
    ]);

    return {
      data: invoices,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
        hasNextPage: page * limit < total
      }
    };
  }

  static async getInvoiceById(id) {
    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        subscription: {
          include: {
            product: true
          }
        }
      }
    });

    if (!invoice) {
      const error = new Error(`Invoice with ID ${id} not found.`);
      error.statusCode = 404;
      throw error;
    }

    return invoice;
  }

  static async createInvoice(data) {
    const now = new Date();
    const dueAt = data.dueAt ? new Date(data.dueAt) : new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const invoice = await prisma.invoice.create({
      data: {
        subscriptionId: data.subscriptionId,
        amountPaise: data.amountPaise,
        status: data.status || 'PENDING',
        issuedAt: now,
        dueAt
      },
      include: {
        subscription: {
          select: { clientCompanyName: true }
        }
      }
    });

    logger.info({ invoiceId: invoice.id, amountPaise: invoice.amountPaise }, 'Created invoice');
    return invoice;
  }

  static async markInvoicePaid(id) {
    await this.getInvoiceById(id);

    const updated = await prisma.invoice.update({
      where: { id },
      data: {
        status: 'PAID',
        paidAt: new Date()
      },
      include: {
        subscription: true
      }
    });

    logger.info({ invoiceId: id }, 'Marked invoice as PAID');
    return updated;
  }

  static async updateInvoice(id, data) {
    await this.getInvoiceById(id);

    const updateData = {};
    if (data.amountPaise !== undefined) updateData.amountPaise = data.amountPaise;
    if (data.status) updateData.status = data.status;
    if (data.dueAt) updateData.dueAt = new Date(data.dueAt);
    if (data.paidAt !== undefined) updateData.paidAt = data.paidAt ? new Date(data.paidAt) : null;

    const updated = await prisma.invoice.update({
      where: { id },
      data: updateData,
      include: {
        subscription: true
      }
    });

    return updated;
  }

  // -------------------------------------------------------------
  // Cron Processing: Check Overdue Subscriptions & Generate Invoices
  // -------------------------------------------------------------

  static async processSubscriptionRenewals() {
    const now = new Date();

    // Find ACTIVE subscriptions that have passed currentPeriodEnd
    const expiredActiveSubs = await prisma.subscription.findMany({
      where: {
        status: 'ACTIVE',
        currentPeriodEnd: { lte: now }
      }
    });

    logger.info({ count: expiredActiveSubs.length }, 'Cron scan: Checking expired active subscriptions');

    let processedCount = 0;

    for (const sub of expiredActiveSubs) {
      try {
        await prisma.$transaction(async (tx) => {
          // 1. Flip status to PAST_DUE
          await tx.subscription.update({
            where: { id: sub.id },
            data: { status: 'PAST_DUE' }
          });

          // 2. Generate next Invoice
          await tx.invoice.create({
            data: {
              subscriptionId: sub.id,
              amountPaise: sub.monthlyAmountPaise,
              status: 'PENDING',
              issuedAt: now,
              dueAt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
            }
          });
        });

        processedCount++;
      } catch (err) {
        logger.error({ subscriptionId: sub.id, err: err.message }, 'Failed processing subscription renewal');
      }
    }

    logger.info({ processedCount }, 'Cron scan: Finished subscription renewal processing');
    return { processedCount };
  }
}
