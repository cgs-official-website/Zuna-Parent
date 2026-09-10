import { prisma } from '../../lib/prisma.js';
import { redis } from '../../lib/redis.js';
import { logger } from '../../lib/logger.js';

const CACHE_KEY_PUBLIC_PRODUCTS = 'cache:public:products';
const CACHE_TTL_SECONDS = 3600; // 1 hour

export class ProductsService {
  /**
   * List all products for internal admin portal
   */
  static async listAdminProducts() {
    const products = await prisma.product.findMany({
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
      include: {
        _count: {
          select: {
            tickets: true,
            demoRequests: true,
            subscriptions: true,
            apiKeys: true
          }
        }
      }
    });

    return products.map((p) => ({
      ...p,
      productUrl: p.demoUrl,
      url: p.demoUrl
    }));
  }

  /**
   * List published products for public landing page (cached in Redis)
   */
  static async listPublicProducts() {
    try {
      if (redis.status === 'ready' || redis.status === 'connecting') {
        const cached = await redis.get(CACHE_KEY_PUBLIC_PRODUCTS);
        if (cached) {
          logger.debug('Served public products from Redis cache');
          return JSON.parse(cached);
        }
      }
    } catch (err) {
      logger.warn({ err: err.message }, 'Redis cache read error for public products');
    }

    const products = await prisma.product.findMany({
      where: { isPublished: true },
      orderBy: { sortOrder: 'asc' },
      select: {
        id: true,
        title: true,
        category: true,
        badgeColor: true,
        description: true,
        tier: true,
        demoUrl: true,
        iconKey: true,
        featureTags: true,
        sortOrder: true
      }
    });

    const formatted = products.map((p) => ({
      ...p,
      productUrl: p.demoUrl,
      url: p.demoUrl
    }));

    try {
      if (redis.status === 'ready' || redis.status === 'connecting') {
        await redis.set(
          CACHE_KEY_PUBLIC_PRODUCTS,
          JSON.stringify(formatted),
          'EX',
          CACHE_TTL_SECONDS
        );
      }
    } catch (err) {
      logger.warn({ err: err.message }, 'Redis cache write error for public products');
    }

    return formatted;
  }

  /**
   * Invalidate the public products Redis cache
   */
  static async invalidateCache() {
    try {
      await redis.del(CACHE_KEY_PUBLIC_PRODUCTS);
      logger.debug('Invalidated public products Redis cache');
    } catch (err) {
      logger.warn({ err: err.message }, 'Failed to invalidate public products Redis cache');
    }
  }

  /**
   * Get single product by ID
   */
  static async getProductById(id) {
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            tickets: true,
            demoRequests: true,
            subscriptions: true,
            apiKeys: true
          }
        }
      }
    });

    if (!product) {
      const error = new Error(`Product with ID ${id} not found.`);
      error.statusCode = 404;
      throw error;
    }

    return {
      ...product,
      productUrl: product.demoUrl,
      url: product.demoUrl
    };
  }

  /**
   * Create a new product (invalidates public cache)
   */
  static async createProduct(data) {
    const demoUrl = data.demoUrl || data.productUrl || data.url || null;

    const product = await prisma.product.create({
      data: {
        title: data.title,
        category: data.category,
        badgeColor: data.badgeColor || null,
        description: data.description || null,
        tier: data.tier || 'STARTER',
        demoUrl,
        iconKey: data.iconKey || null,
        featureTags: data.featureTags || [],
        isPublished: data.isPublished !== undefined ? data.isPublished : true,
        sortOrder: data.sortOrder || 0
      }
    });

    await this.invalidateCache();
    return product;
  }

  /**
   * Update an existing product (invalidates public cache)
   */
  static async updateProduct(id, data) {
    await this.getProductById(id);

    const updateData = { ...data };
    if (data.productUrl || data.url) {
      updateData.demoUrl = data.productUrl || data.url;
      delete updateData.productUrl;
      delete updateData.url;
    }

    const updated = await prisma.product.update({
      where: { id },
      data: updateData
    });

    await this.invalidateCache();
    return updated;
  }

  /**
   * Delete product (invalidates public cache)
   */
  static async deleteProduct(id) {
    await this.getProductById(id);

    await prisma.product.delete({
      where: { id }
    });

    await this.invalidateCache();
    return { id, deleted: true };
  }
}
