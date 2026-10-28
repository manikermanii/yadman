import { Router } from 'express';
import { cartController, orderController, couponController } from '../controllers/cartOrderCouponController.js';
import { requireAuth, requireAdmin, optionalAuth } from '../middleware/auth.js';

const router = Router();

// Cart APIs - Requires Authenticated Customer
router.get('/cart', requireAuth, cartController.getCart);
router.post('/cart', requireAuth, cartController.addItem);
router.post('/cart/items', requireAuth, cartController.addItem);
router.put('/cart/:itemId', requireAuth, cartController.updateItemQuantity);
router.put('/cart/items/:itemId', requireAuth, cartController.updateItemQuantity);
router.patch('/cart/:itemId', requireAuth, cartController.updateItemQuantity);
router.patch('/cart/items/:itemId', requireAuth, cartController.updateItemQuantity);
router.delete('/cart/:itemId', requireAuth, cartController.removeItem);
router.delete('/cart/items/:itemId', requireAuth, cartController.removeItem);
router.delete('/cart', requireAuth, cartController.clearCart);

// Coupons
router.post('/coupons/validate', couponController.validateCoupon);
router.get('/coupons/active', couponController.getActiveCoupons);
router.get('/admin/coupons', requireAdmin, couponController.getCouponsAdmin);
router.post('/admin/coupons', requireAdmin, couponController.createCoupon);
router.put('/admin/coupons/:id', requireAdmin, couponController.updateCoupon);
router.delete('/admin/coupons/:id', requireAdmin, couponController.deleteCoupon);

// Orders
router.post('/orders', requireAuth, orderController.createOrder);
router.get('/orders/my', requireAuth, orderController.getMyOrders);
router.get('/orders/:id', requireAuth, orderController.getOrderById);

// Admin Orders
router.get('/admin/orders', requireAdmin, orderController.getAllOrdersAdmin);
router.get('/admin/orders/:id', requireAdmin, orderController.getOrderByIdAdmin);
router.put('/admin/orders/:id/status', requireAdmin, orderController.updateOrderStatus);
router.patch('/admin/orders/:id/status', requireAdmin, orderController.updateOrderStatus);
router.delete('/admin/orders/:id', requireAdmin, orderController.deleteOrder);

export default router;
