import { prisma } from '../../lib/prisma.js';
import { emitDemoRequestCreated, emitNotification } from '../../lib/socket.js';
import { logger } from '../../lib/logger.js';

export class DemosService {
  /**
   * Create new demo request lead (from public landing page modal or API)
   */
  static async createDemoRequest(data) {
    const contactName = data.contactName || data.name;
    const contactEmail = (data.contactEmail || data.email).toLowerCase().trim();
    const companyName = data.companyName || data.company || 'N/A';
    const contactPhone = data.contactPhone || data.phone || null;
    const message = data.message || null;

    let productId = data.productId || null;
    let productTitle = 'General Suite';

    if (!productId && data.product) {
      const matched = await prisma.product.findFirst({
        where: {
          OR: [
            { id: data.product },
            { title: { equals: data.product, mode: 'insensitive' } }
          ]
        }
      });
      if (matched) {
        productId = matched.id;
        productTitle = matched.title;
      } else {
        productTitle = data.product;
      }
    } else if (productId) {
      const prod = await prisma.product.findUnique({ where: { id: productId } });
      if (prod) productTitle = prod.title;
    }

    const result = await prisma.$transaction(async (tx) => {
      const demoRequest = await tx.demoRequest.create({
        data: {
          productId,
          companyName,
          contactName,
          contactEmail,
          contactPhone,
          message,
          status: 'NEW'
        },
        include: {
          product: {
            select: { id: true, title: true, category: true, badgeColor: true }
          }
        }
      });

      const notification = await tx.notification.create({
        data: {
          adminId: null, // Broadcast to all staff
          type: 'NEW_DEMO_REQUEST',
          payload: {
            demoRequestId: demoRequest.id,
            contactName,
            companyName,
            contactEmail,
            productTitle
          },
          relatedDemoRequestId: demoRequest.id
        }
      });

      return { demoRequest, notification };
    });

    // Realtime notifications
    emitDemoRequestCreated(result.demoRequest);
    emitNotification(result.notification);

    logger.info({ demoRequestId: result.demoRequest.id, companyName }, 'New demo request created');

    return result.demoRequest;
  }

  /**
   * List demo requests with filtering and pagination
   */
  static async listDemoRequests({ page = 1, limit = 20, status, productId, search }) {
    const andConditions = [];

    if (status && status !== 'all') {
      andConditions.push({ status });
    }

    if (productId && productId !== 'all') {
      andConditions.push({ productId });
    }

    if (search && search.trim()) {
      const query = search.trim();
      andConditions.push({
        OR: [
          { companyName: { contains: query, mode: 'insensitive' } },
          { contactName: { contains: query, mode: 'insensitive' } },
          { contactEmail: { contains: query, mode: 'insensitive' } }
        ]
      });
    }

    const where = andConditions.length > 0 ? { AND: andConditions } : {};
    const skip = (page - 1) * limit;

    const [demos, total] = await Promise.all([
      prisma.demoRequest.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          product: {
            select: { id: true, title: true, category: true, badgeColor: true }
          }
        }
      }),
      prisma.demoRequest.count({ where })
    ]);

    return {
      data: demos,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
        hasNextPage: page * limit < total
      }
    };
  }

  /**
   * Get single demo request by ID
   */
  static async getDemoRequestById(id) {
    const demo = await prisma.demoRequest.findUnique({
      where: { id },
      include: {
        product: true
      }
    });

    if (!demo) {
      const error = new Error(`Demo request with ID ${id} not found.`);
      error.statusCode = 404;
      throw error;
    }

    return demo;
  }

  /**
   * Update demo request status or scheduled appointment timestamp
   */
  static async updateDemoRequest(id, data) {
    await this.getDemoRequestById(id);

    const updateData = {};
    if (data.status) updateData.status = data.status;
    if (data.scheduledAt !== undefined) {
      updateData.scheduledAt = data.scheduledAt ? new Date(data.scheduledAt) : null;
      if (data.scheduledAt && (!data.status || data.status === 'NEW')) {
        updateData.status = 'SCHEDULED';
      }
    }

    const updated = await prisma.demoRequest.update({
      where: { id },
      data: updateData,
      include: {
        product: true
      }
    });

    return updated;
  }

  /**
   * Delete demo request
   */
  static async deleteDemoRequest(id) {
    await this.getDemoRequestById(id);

    await prisma.demoRequest.delete({
      where: { id }
    });

    return { id, deleted: true };
  }
}
