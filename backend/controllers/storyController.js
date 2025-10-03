// backend/controllers/storyController.js
import Story from '../models/Story.js';
import User from '../models/User.js';
import { createNotification } from './notificationController.js'; // Add this import

// Get stories for feed (from following users + own stories)
export const getStoriesFeed = async (req, res) => {
  try {
    const currentUser = await User.findById(req.user._id);
    if (!currentUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get following user IDs + current user
    const followingIds = [...currentUser.following, req.user._id];

    // Get grouped stories by user
    const storyGroups = await Story.getFollowingStories(followingIds, req.user._id);

    res.status(200).json({
      storyGroups,
      totalUsers: storyGroups.length
    });
  } catch (err) {
    console.error('Error fetching stories feed:', err);
    res.status(500).json({ message: 'Error fetching stories' });
  }
};

// Get specific user's stories
export const getUserStories = async (req, res) => {
  try {
    const { userId } = req.params;
    
    const stories = await Story.getActiveStoriesForUser(userId);

    // Mark stories as viewed/unviewed for current user
    const storiesWithViewStatus = stories.map(story => ({
      ...story.toObject(),
      hasViewed: story.hasViewedBy(req.user._id),
      isOwn: story.user._id.toString() === req.user._id.toString()
    }));

    res.status(200).json({
      stories: storiesWithViewStatus,
      user: stories[0]?.user || null
    });
  } catch (err) {
    console.error('Error fetching user stories:', err);
    res.status(500).json({ message: 'Error fetching user stories' });
  }
};

// Create a new story
export const createStory = async (req, res) => {
  try {
    const { type, text, image, backgroundColor } = req.body;
    
    console.log('Creating story with data:', { type, text, image: image ? 'IMAGE_PROVIDED' : 'NO_IMAGE', backgroundColor });

    // Validation
    if (!type || !['text', 'image'].includes(type)) {
      return res.status(400).json({ message: 'Invalid story type' });
    }

    if (type === 'text') {
      if (!text || text.trim().length === 0) {
        return res.status(400).json({ message: 'Text content is required for text stories' });
      }
      if (text.length > 200) {
        return res.status(400).json({ message: 'Text must be less than 200 characters' });
      }
    }

    if (type === 'image') {
      if (!image) {
        console.log('Image story validation failed - no image provided');
        return res.status(400).json({ message: 'Image is required for image stories' });
      }
      console.log('Image story validation passed - image provided:', image.substring(0, 50) + '...');
    }

    // Check if user has reached daily story limit (optional)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const existingTodayStories = await Story.countDocuments({
      user: req.user._id,
      createdAt: { $gte: today },
      isActive: true
    });

    if (existingTodayStories >= 10) { // Max 10 stories per day
      return res.status(400).json({ message: 'Daily story limit reached (10 stories)' });
    }

    const storyData = {
      user: req.user._id,
      content: {
        type,
        backgroundColor: backgroundColor || '#667eea'
      }
    };

    if (type === 'text') {
      storyData.content.text = text.trim();
    } else {
      storyData.content.image = image;
    }

    console.log('Final story data:', JSON.stringify(storyData, null, 2));

    const story = new Story(storyData);
    await story.save();
    await story.populate('user', 'username avatar');

    console.log('Story created successfully:', story._id);

    res.status(201).json({
      message: 'Story created successfully',
      story
    });
  } catch (err) {
    console.error('Error creating story:', err);
    res.status(500).json({ message: 'Error creating story' });
  }
};

// View a story (mark as viewed)
export const viewStory = async (req, res) => {
  try {
    const { storyId } = req.params;

    const story = await Story.findById(storyId)
      .populate('user', 'username avatar');

    if (!story) {
      return res.status(404).json({ message: 'Story not found' });
    }

    if (story.isExpired) {
      return res.status(410).json({ message: 'Story has expired' });
    }

    // Add viewer if not already viewed and not own story
    if (story.user._id.toString() !== req.user._id.toString()) {
      await story.addViewer(req.user._id);
    }

    res.status(200).json({
      story: {
        ...story.toObject(),
        hasViewed: story.hasViewedBy(req.user._id),
        isOwn: story.user._id.toString() === req.user._id.toString()
      }
    });
  } catch (err) {
    console.error('Error viewing story:', err);
    res.status(500).json({ message: 'Error viewing story' });
  }
};

// Delete a story (only by owner)
export const deleteStory = async (req, res) => {
  try {
    const { storyId } = req.params;

    const story = await Story.findById(storyId);
    if (!story) {
      return res.status(404).json({ message: 'Story not found' });
    }

    // Check if user is the owner
    if (story.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this story' });
    }

    await Story.findByIdAndDelete(storyId);

    res.status(200).json({ message: 'Story deleted successfully' });
  } catch (err) {
    console.error('Error deleting story:', err);
    res.status(500).json({ message: 'Error deleting story' });
  }
};

// Get story viewers (only for story owner)
export const getStoryViewers = async (req, res) => {
  try {
    const { storyId } = req.params;

    const story = await Story.findById(storyId)
      .populate('viewers.user', 'username avatar')
      .populate('user', 'username');

    if (!story) {
      return res.status(404).json({ message: 'Story not found' });
    }

    // Check if user is the owner
    if (story.user._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to view story analytics' });
    }

    res.status(200).json({
      viewers: story.viewers.map(viewer => ({
        user: viewer.user,
        viewedAt: viewer.viewedAt
      })),
      viewersCount: story.viewers.length
    });
  } catch (err) {
    console.error('Error fetching story viewers:', err);
    res.status(500).json({ message: 'Error fetching story viewers' });
  }
};

// Get current user's stories
export const getMyStories = async (req, res) => {
  try {
    const stories = await Story.getActiveStoriesForUser(req.user._id);

    const storiesWithViewers = stories.map(story => ({
      ...story.toObject(),
      viewersCount: story.viewers.length,
      isOwn: true
    }));

    res.status(200).json({
      stories: storiesWithViewers,
      totalStories: stories.length
    });
  } catch (err) {
    console.error('Error fetching my stories:', err);
    res.status(500).json({ message: 'Error fetching your stories' });
  }
};