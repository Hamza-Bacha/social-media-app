import express from 'express';
import { authenticate, optionalAuth } from '../middlewares/authMiddleware.js';
import { 
  getComments, 
  createComment, 
  deleteComment, 
  likeComment 
} from '../controllers/commentController.js';

const router = express.Router();

// Public routes (can work with or without authentication)
router.get('/:postId', optionalAuth, getComments);

// Protected routes (require authentication)
router.post('/:postId', authenticate, createComment);
router.post('/:commentId/like', authenticate, likeComment);
router.delete('/:commentId', authenticate, deleteComment);

export default router;