import { Router } from 'express';
import { productController, categoryController } from '../controllers/productCategoryController.js';
import { productService } from '../services/productService.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { requireAdmin } from '../middleware/auth.js';

const router = Router();

// Admin Statistics API
router.get('/admin/stats', requireAdmin, async (req, res, next) => {
  try {
    const stats = await productService.getAdminStats();
    return sendSuccess(res, stats);
  } catch (err) {
    next(err);
  }
});

// Public Product APIs
router.get('/products', productController.getProducts);
router.get('/products/:identifier', productController.getProductBySlugOrId);

// Admin Product APIs
router.post('/admin/products', requireAdmin, productController.createProduct);
router.put('/admin/products/:id', requireAdmin, productController.updateProduct);
router.delete('/admin/products/:id', requireAdmin, productController.deleteProduct);

// Public Categories
router.get('/categories', categoryController.getCategories);
router.get('/categories/:slug', categoryController.getCategoryBySlug);

// Admin Categories
router.post('/admin/categories', requireAdmin, categoryController.createCategory);
router.put('/admin/categories/:id', requireAdmin, categoryController.updateCategory);
router.delete('/admin/categories/:id', requireAdmin, categoryController.deleteCategory);

export default router;
