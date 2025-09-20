import express from 'express';
import { authenticate } from '../middlewares/authMiddleware.js';
import { uploadImage, handleImageUpload } from '../controllers/uploadController.js';

const router = express.Router();

// Upload image route
router.post('/image', authenticate, uploadImage, handleImageUpload);

export default router;