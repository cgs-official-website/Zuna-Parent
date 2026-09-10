import crypto from 'crypto';
import { prisma } from '../../lib/prisma.js';

export class ApiKeyController {
  /**
   * Generate or rotate API key for a SaaS product (SUPER_ADMIN only)
   */
  static async generateProductApiKey(req, res, next) {
    try {
      const { id } = req.params;
      const label = req.body.label || 'Production API Key';

      const product = await prisma.product.findUnique({
        where: { id }
      });

      if (!product) {
        return res.status(404).json({
          success: false,
          error: { message: `Product with ID ${id} not found.` }
        });
      }

      // Generate raw secret key with identifiable prefix
      const rawKey = `zuna_live_${crypto.randomBytes(24).toString('hex')}`;
      const keyHash = crypto.createHash('sha256').update(rawKey).digest('hex');

      // Deactivate any existing active keys for this product
      await prisma.apiKey.updateMany({
        where: { productId: id, isActive: true },
        data: { isActive: false }
      });

      // Insert new active key record
      const apiKeyRecord = await prisma.apiKey.create({
        data: {
          productId: id,
          keyHash,
          label: `${product.title} - ${label}`,
          createdBy: req.admin.email,
          isActive: true
        }
      });

      return res.status(201).json({
        success: true,
        data: {
          apiKey: rawKey,
          id: apiKeyRecord.id,
          label: apiKeyRecord.label,
          productId: product.id,
          productTitle: product.title,
          createdAt: apiKeyRecord.createdAt
        },
        warning: 'Make sure to copy this API key now. It will never be displayed again.'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * List API keys for a product (metadata only, no raw key)
   */
  static async listProductApiKeys(req, res, next) {
    try {
      const { id } = req.params;

      const keys = await prisma.apiKey.findMany({
        where: { productId: id },
        select: {
          id: true,
          label: true,
          isActive: true,
          lastUsedAt: true,
          createdBy: true,
          createdAt: true
        },
        orderBy: { createdAt: 'desc' }
      });

      return res.status(200).json({
        success: true,
        data: keys
      });
    } catch (error) {
      next(error);
    }
  }
}
