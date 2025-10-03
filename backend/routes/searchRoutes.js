// backend/routes/searchRoutes.js
import express from 'express';
import { authenticate } from '../middlewares/authMiddleware.js';
import { 
  searchUsersAndPosts,
  getTrendingHashtags,
  getSuggestedUsers 
} from '../controllers/searchController.js';

const router = express.Router();

// Main search (public - no auth required)
router.get('/', searchUsersAndPosts);

// Trending (public)
router.get('/trending', getTrendingHashtags);

// Suggestions (requires auth)
router.get('/suggestions', authenticate, getSuggestedUsers);

export default router;