import { Router } from 'express';
import { ProductsController } from './products.controller.js';
import { ApiKeyController } from './apiKey.controller.js';
import { requireAuth } from '../../middleware/requireAuth.js';
import { requireRole } from '../../middleware/requireRole.js';

const router = Router();

// Protect all admin product routes
router.use(requireAuth);

// Read routes accessible by all authenticated admins
router.get('/', ProductsController.listAdminProducts);
router.get('/:id', ProductsController.getProductById);

// Write/Mutate routes restricted to PRODUCT_MANAGER and SUPER_ADMIN
router.post(
  '/',
  requireRole('PRODUCT_MANAGER', 'SUPER_ADMIN'),
  ProductsController.createProduct
);
router.patch(
  '/:id',
  requireRole('PRODUCT_MANAGER', 'SUPER_ADMIN'),
  ProductsController.updateProduct
);
router.delete(
  '/:id',
  requireRole('PRODUCT_MANAGER', 'SUPER_ADMIN'),
  ProductsController.deleteProduct
);

// Product API Key Management (SUPER_ADMIN only)
router.post(
  '/:id/api-key',
  requireRole('SUPER_ADMIN'),
  ApiKeyController.generateProductApiKey
);
router.get(
  '/:id/api-keys',
  requireRole('SUPER_ADMIN'),
  ApiKeyController.listProductApiKeys
);

export default router;
