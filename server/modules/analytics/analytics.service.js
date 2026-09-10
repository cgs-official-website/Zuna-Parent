import { prisma } from '../../lib/prisma.js';
import { redis } from '../../lib/redis.js';
import { logger } from '../../lib/logger.js';

const CACHE_KEY_KPIS = 'cache:analytics:kpis';
const CACHE_TTL_KPIS_SECONDS = 60; // 60s TTL as specified

export class AnalyticsService {
  /**
   * KPI summary endpoint with 60s Redis caching
   */
  static async getKPISummary() {
    // 1. Check Redis Cache
    try {
      if (redis.status === 'ready' || redis.status === 'connecting') {
        const cached = await redis.get(CACHE_KEY_KPIS);
        if (cached) {
          logger.debug('Served KPI summary from Redis cache');
          return JSON.parse(cached);
        }
      }
    } catch (err) {
      logger.warn({ err: err.message }, 'Redis cache read error for KPIs');
    }

    // 2. Compute KPIs from PostgreSQL
    const [activeCustomersGroups, mrrAggregate, openTicketCount, resolvedTickets] =
      await Promise.all([
        // Active customer companies
        prisma.subscription.groupBy({
          by: ['clientCompanyName'],
          where: { status: 'ACTIVE' }
        }),

        // Monthly Recurring Revenue (MRR) from active subscriptions
        prisma.subscription.aggregate({
          _sum: { monthlyAmountPaise: true },
          where: { status: 'ACTIVE' }
        }),

        // Total currently open / in-progress tickets
        prisma.ticket.count({
          where: {
            status: { in: ['OPEN', 'IN_PROGRESS'] }
          }
        }),

        // Sample of resolved tickets to compute average resolution time
        prisma.ticket.findMany({
          where: {
            status: { in: ['RESOLVED', 'CLOSED'] }
          },
          select: {
            createdAt: true,
            updatedAt: true
          },
          take: 200,
          orderBy: { updatedAt: 'desc' }
        })
      ]);

    const activeCustomers = activeCustomersGroups.length;
    const mrrPaise = mrrAggregate._sum.monthlyAmountPaise || 0;
    const mrrRupees = Math.round(mrrPaise / 100);

    // Calculate Average Resolution Time in Hours
    let avgResolutionHours = 0;
    if (resolvedTickets.length > 0) {
      const totalHours = resolvedTickets.reduce((acc, t) => {
        const diffMs = new Date(t.updatedAt).getTime() - new Date(t.createdAt).getTime();
        return acc + Math.max(0, diffMs / (1000 * 60 * 60));
      }, 0);
      avgResolutionHours = Math.round((totalHours / resolvedTickets.length) * 10) / 10;
    }

    const payload = {
      activeCustomers,
      mrrPaise,
      mrrRupees,
      openTicketCount,
      avgResolutionHours,
      sampleSize: resolvedTickets.length,
      cachedAt: new Date().toISOString()
    };

    // 3. Save into Redis with 60s TTL
    try {
      if (redis.status === 'ready' || redis.status === 'connecting') {
        await redis.set(
          CACHE_KEY_KPIS,
          JSON.stringify(payload),
          'EX',
          CACHE_TTL_KPIS_SECONDS
        );
      }
    } catch (err) {
      logger.warn({ err: err.message }, 'Redis cache write error for KPIs');
    }

    return payload;
  }

  /**
   * Time series and distribution analytics for 7d | 30d | 90d
   */
  static async getChartsData(range = '7d') {
    let days = 7;
    if (range === '30d') days = 30;
    if (range === '90d') days = 90;

    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const [ticketsInRange, activeSubscriptions, products] = await Promise.all([
      prisma.ticket.findMany({
        where: {
          createdAt: { gte: startDate }
        },
        select: {
          id: true,
          productId: true,
          productNameSnapshot: true,
          priority: true,
          status: true,
          createdAt: true,
          product: {
            select: { id: true, title: true }
          }
        }
      }),

      prisma.subscription.findMany({
        where: { status: 'ACTIVE' },
        select: {
          productId: true,
          monthlyAmountPaise: true,
          product: {
            select: { id: true, title: true }
          }
        }
      }),

      prisma.product.findMany({
        select: { id: true, title: true }
      })
    ]);

    // 1. Revenue by Product
    const revenueMap = {};
    products.forEach((p) => {
      revenueMap[p.title] = 0;
    });

    activeSubscriptions.forEach((sub) => {
      const title = sub.product?.title || 'Unknown Product';
      revenueMap[title] = (revenueMap[title] || 0) + sub.monthlyAmountPaise / 100;
    });

    const revenueByProduct = Object.entries(revenueMap).map(([product, amountRupees]) => ({
      product,
      amountRupees
    }));

    // 2. Ticket Volume by Product
    const ticketProductMap = {};
    products.forEach((p) => {
      ticketProductMap[p.title] = 0;
    });

    ticketsInRange.forEach((t) => {
      const prodName = t.product?.title || t.productNameSnapshot || 'General Support';
      ticketProductMap[prodName] = (ticketProductMap[prodName] || 0) + 1;
    });

    const ticketVolumeByProduct = Object.entries(ticketProductMap).map(([product, count]) => ({
      product,
      count
    }));

    // 3. Ticket Volume by Priority
    const priorityMap = { LOW: 0, MEDIUM: 0, HIGH: 0, URGENT: 0 };
    ticketsInRange.forEach((t) => {
      if (priorityMap[t.priority] !== undefined) {
        priorityMap[t.priority]++;
      }
    });

    const ticketVolumeByPriority = Object.entries(priorityMap).map(([priority, count]) => ({
      priority,
      count
    }));

    // 4. Daily Time Series
    const dateMap = {};
    for (let i = 0; i < days; i++) {
      const d = new Date(Date.now() - (days - 1 - i) * 24 * 60 * 60 * 1000);
      const dateKey = d.toISOString().slice(0, 10);
      dateMap[dateKey] = 0;
    }

    ticketsInRange.forEach((t) => {
      const dateKey = t.createdAt.toISOString().slice(0, 10);
      if (dateMap[dateKey] !== undefined) {
        dateMap[dateKey]++;
      }
    });

    const timeSeries = Object.entries(dateMap).map(([date, count]) => ({
      date,
      count
    }));

    return {
      range,
      days,
      totalTickets: ticketsInRange.length,
      revenueByProduct,
      ticketVolumeByProduct,
      ticketVolumeByPriority,
      timeSeries
    };
  }
}
