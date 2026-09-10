import { ProductsService } from './products.service.js';
import { createProductSchema, updateProductSchema } from './products.validator.js';

export class ProductsController {
  static async listAdminProducts(req, res, next) {
    try {
      const products = await ProductsService.listAdminProducts();
      return res.status(200).json({
        success: true,
        data: products
      });
    } catch (error) {
      next(error);
    }
  }

  static async listPublicProducts(req, res, next) {
    try {
      const products = await ProductsService.listPublicProducts();
      return res.status(200).json({
        success: true,
        data: products
      });
    } catch (error) {
      next(error);
    }
  }

  static async getProductById(req, res, next) {
    try {
      const { id } = req.params;
      const product = await ProductsService.getProductById(id);
      return res.status(200).json({
        success: true,
        data: product
      });
    } catch (error) {
      next(error);
    }
  }

  static async createProduct(req, res, next) {
    try {
      const validated = createProductSchema.parse(req.body);
      const product = await ProductsService.createProduct(validated);
      return res.status(201).json({
        success: true,
        data: product
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

  static async updateProduct(req, res, next) {
    try {
      const { id } = req.params;
      const validated = updateProductSchema.parse(req.body);
      const product = await ProductsService.updateProduct(id, validated);
      return res.status(200).json({
        success: true,
        data: product
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

  static async deleteProduct(req, res, next) {
    try {
      const { id } = req.params;
      const result = await ProductsService.deleteProduct(id);
      return res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }
}
