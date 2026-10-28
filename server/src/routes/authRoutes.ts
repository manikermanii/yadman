import { Router } from 'express';
import { authController } from '../controllers/authController.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';

const router = Router();

// Customer Auth
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/logout', authController.logout);
router.get('/me', requireAuth, authController.getMe);
router.put('/profile', requireAuth, authController.updateProfile);
router.put('/change-password', requireAuth, authController.changePassword);

// Admin Auth
router.post('/admin/login', authController.adminLogin);
router.post('/admin/logout', authController.logout);
router.get('/admin/me', requireAdmin, authController.getMe);
router.get('/admin/users', requireAdmin, authController.getAllUsers);
router.patch('/admin/users/:id/status', requireAdmin, authController.updateUserStatus);
router.put('/admin/users/:id/status', requireAdmin, authController.updateUserStatus);
router.patch('/admin/users/:id', requireAdmin, authController.updateUserStatus);
router.put('/admin/users/:id', requireAdmin, authController.updateUserStatus);

export default router;
