import { Router } from 'express';
import { uploadController } from '../controllers/uploadController.js';
import { upload } from '../middleware/upload.js';
import { requireAdmin } from '../middleware/auth.js';

const router = Router();

router.post('/upload/single', upload.single('file'), uploadController.uploadSingleImage);
router.post('/upload/multiple', upload.array('files', 10), uploadController.uploadMultipleImages);
router.post('/upload/voice', uploadController.uploadVoice);
router.delete('/upload', requireAdmin, uploadController.deleteFile);

export default router;
