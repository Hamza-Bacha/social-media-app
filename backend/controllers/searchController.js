// backend/controllers/searchController.js
import User from '../models/User.js';
import Post from '../models/Post.js';

// Simple search for users and posts
export const searchUsersAndPosts = async (req, res) => {
  const { query = '', limit = 5 } = req.query;

  try {
    // Search users
    const users = await User.find({
      username: { $regex: query, $options: 'i' }
    })
    .select('username avatar bio followersCount postsCount')
    .limit(parseInt(limit));

    // Search posts
    const posts = await Post.find({
      content: { $regex: query, $options: 'i' }
    })
    .populate('user', 'username avatar')
    .limit(parseInt(limit))
    .lean();

    res.json({ 
      users, 
      posts,
      totalResults: users.length + posts.length
    });
  } catch (err) {
    console.error('Search error:', err);
    res.status(500).json({ message: 'Search failed' });
  }
};

// Get trending hashtags (simple version)
export const getTrendingHashtags = async (req, res) => {
  try {
    res.json({ hashtags: [] }); // Return empty for now
  } catch (err) {
    res.status(500).json({ message: 'Error getting trending' });
  }
};

// Get user suggestions (simple version)
export const getSuggestedUsers = async (req, res) => {
  try {
    const users = await User.find({ _id: { $ne: req.user._id } })
      .select('username avatar bio followersCount')
      .limit(10)
      .sort({ followersCount: -1 });
    
    res.json({ suggestions: users });
  } catch (err) {
    res.status(500).json({ message: 'Error getting suggestions' });
  }
};