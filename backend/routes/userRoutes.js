import express from 'express';
import { authenticate, optionalAuth } from '../middlewares/authMiddleware.js';
import { 
  getUsers, 
  getUserProfile, 
  followUser, 
  getUserFollowers, 
  getUserFollowing, 
  updateProfile,
  getUserPosts
} from '../controllers/userController.js';

const router = express.Router();

// Public routes (can work with or without authentication)
router.get('/', optionalAuth, getUsers);
router.get('/:identifier', optionalAuth, getUserProfile);
router.get('/:userId/followers', optionalAuth, getUserFollowers);
router.get('/:userId/following', optionalAuth, getUserFollowing);
router.get('/:userId/posts', optionalAuth, getUserPosts);

// Protected routes (require authentication)
router.post('/:userId/follow', authenticate, followUser);
router.put('/profile', authenticate, updateProfile);

export default router;