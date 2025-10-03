// backend/routes/storyRoutes.js
import express from 'express';
import { authenticate } from '../middlewares/authMiddleware.js';
import {
  getStoriesFeed,
  getUserStories,
  createStory,
  viewStory,
  deleteStory,
  getStoryViewers,
  getMyStories
} from '../controllers/storyController.js';

const router = express.Router();

// All story routes require authentication
router.use(authenticate);

// Get stories feed (from following users)
router.get('/', getStoriesFeed);

// Get current user's stories
router.get('/my-stories', getMyStories);

// Create a new story
router.post('/', createStory);

// Get specific user's stories
router.get('/user/:userId', getUserStories);

// View a specific story (mark as viewed)
router.post('/:storyId/view', viewStory);

// Delete a story (only by owner)
router.delete('/:storyId', deleteStory);

// Get story viewers (only for story owner)
router.get('/:storyId/viewers', getStoryViewers);

export default router;