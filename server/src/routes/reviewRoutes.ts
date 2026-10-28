import { Router } from 'express';
import { reviewController, wishlistController } from '../controllers/reviewWishlistController.js';
import { requireAuth, requireAdmin, optionalAuth } from '../middleware/auth.js';

const router = Router();

// Reviews
router.get('/products/:productId/reviews', reviewController.getProductReviews);
router.post('/reviews', optionalAuth, reviewController.createReview);

// Wishlist - Requires Authenticated Customer
router.get('/wishlist', requireAuth, wishlistController.getWishlist);
router.post('/wishlist', requireAuth, wishlistController.addToWishlist);
router.delete('/wishlist/:productId', requireAuth, wishlistController.removeFromWishlist);
router.post('/wishlist/:productId/toggle', requireAuth, wishlistController.toggleWishlist);

// Admin Reviews
router.get('/admin/reviews', requireAdmin, reviewController.getAllReviewsAdmin);
router.put('/admin/reviews/:id/status', requireAdmin, reviewController.updateReviewStatus);
router.patch('/admin/reviews/:id/status', requireAdmin, reviewController.updateReviewStatus);
router.delete('/admin/reviews/:id', requireAdmin, reviewController.deleteReview);

export default router;
