import { Router } from 'express';
import { inquiriesController } from '../controllers/inquiriesController.js';
import { requireAdmin, optionalAuth } from '../middleware/auth.js';

const router = Router();

// Corporate Inquiries
router.post('/corporate-inquiries', optionalAuth, inquiriesController.createCorporateInquiry);
router.get('/admin/corporate-inquiries', requireAdmin, inquiriesController.getCorporateInquiriesAdmin);
router.get('/admin/inquiries', requireAdmin, inquiriesController.getCorporateInquiriesAdmin);
router.put('/admin/corporate-inquiries/:id', requireAdmin, inquiriesController.updateCorporateInquiry);
router.delete('/admin/corporate-inquiries/:id', requireAdmin, inquiriesController.deleteCorporateInquiry);
router.delete('/admin/inquiries/:id', requireAdmin, inquiriesController.deleteCorporateInquiry);

// Consultations
router.post('/consultations', optionalAuth, inquiriesController.createConsultation);
router.get('/admin/consultations', requireAdmin, inquiriesController.getConsultationsAdmin);
router.put('/admin/consultations/:id', requireAdmin, inquiriesController.updateConsultation);
router.delete('/admin/consultations/:id', requireAdmin, inquiriesController.deleteConsultation);

// Custom Gift Boxes
router.post('/custom-gift-boxes', optionalAuth, inquiriesController.createCustomGiftBox);
router.get('/admin/custom-gift-boxes', requireAdmin, inquiriesController.getCustomGiftBoxesAdmin);
router.delete('/admin/custom-gift-boxes/:id', requireAdmin, inquiriesController.deleteCustomGiftBox);

// Custom Items / Box Options
router.get('/custom-items', inquiriesController.getCustomItems);
router.get('/admin/custom-items', requireAdmin, inquiriesController.getCustomItemsAdmin);
router.post('/admin/custom-items', requireAdmin, inquiriesController.createCustomItem);
router.put('/admin/custom-items/:id', requireAdmin, inquiriesController.updateCustomItem);
router.delete('/admin/custom-items/:id', requireAdmin, inquiriesController.deleteCustomItem);

export default router;
