import { Router } from 'express';
import { cmsController } from '../controllers/cmsController.js';
import { requireAdmin } from '../middleware/auth.js';

const router = Router();

// Homepage CMS
router.get('/cms/homepage', cmsController.getHomepageCMS);
router.put('/admin/cms/homepage', requireAdmin, cmsController.updateHomepageCMS);
router.post('/admin/cms/homepage/reset', requireAdmin, cmsController.resetHomepageCMS);

// Site Settings & SEO
router.get('/cms/settings', cmsController.getSiteSettings);
router.put('/admin/cms/settings', requireAdmin, cmsController.updateSiteSettings);
router.get('/cms/seo', cmsController.getSeoSettings);

export default router;
