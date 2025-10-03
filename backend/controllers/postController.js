import Post from "../models/Post.js";
import User from "../models/User.js";
import Comment from "../models/Comment.js";
import { createNotification } from "./notificationController.js"; // Add this import

// Get all posts (with optional user filtering)
export const getPosts = async (req, res) => {
  try {
    const { userId, limit = 20, page = 1 } = req.query;
    const skip = (page - 1) * limit;

    let query = {};
    if (userId) {
      query.user = userId;
    }

    const posts = await Post.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip)
      .populate("user", "username avatar bio")
      .lean(); // Use lean for better performance

    // Add user-specific data if authenticated
    if (req.user) {
      posts.forEach(post => {
        // Ensure likes is always an array
        if (!Array.isArray(post.likes)) post.likes = [];
        post.isLiked = post.likes.includes(req.user._id);
      });
    }

    res.status(200).json({
      posts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        hasMore: posts.length === parseInt(limit)
      }
    });
  } catch (err) {
    console.error("Error fetching posts:", err);
    res.status(500).json({ message: "Server error fetching posts" });
  }
};

// Get single post
export const getPost = async (req, res) => {
  try {
    const { postId } = req.params;

    const post = await Post.findById(postId)
      .populate("user", "username avatar bio")
      .lean();

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    // Add user-specific data if authenticated
    if (req.user) {
      if (!Array.isArray(post.likes)) post.likes = [];
      post.isLiked = post.likes.includes(req.user._id);
    }

    res.status(200).json(post);
  } catch (err) {
    console.error("Error fetching post:", err);
    res.status(500).json({ message: "Server error fetching post" });
  }
};

// Create a new post
export const createPost = async (req, res) => {
  try {
    const { content, image } = req.body;

    // Trim content if it exists
    const trimmedContent = content ? content.trim() : '';
    
    // Validate: must have either content OR image (or both)
    if (!trimmedContent && !image) {
      return res.status(400).json({ message: "Please add some content or an image" });
    }

    if (trimmedContent && trimmedContent.length > 500) {
      return res.status(400).json({ message: "Content must be less than 500 characters" });
    }

    if (!req.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    // Create post data
    const postData = {
      user: req.user._id,
      image: image || null
    };

    // Only add content if it's not empty (model handles the validation)
    if (trimmedContent) {
      postData.content = trimmedContent;
    }

    const post = new Post(postData);
    const savedPost = await post.save();
    await savedPost.populate("user", "username avatar bio");

    // Update user's posts count
    await User.findByIdAndUpdate(req.user._id, {
      $inc: { postsCount: 1 }
    });

    res.status(201).json({
      message: "Post created successfully",
      post: savedPost
    });

  } catch (err) {
    console.error("Error creating post:", err);
    res.status(500).json({ message: "Error creating post" });
  }
};

// Like/Unlike a post
export const likePost = async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user._id;

    const post = await Post.findById(postId).populate('user', 'username');
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    if (!Array.isArray(post.likes)) post.likes = [];

    const isLiked = post.likes.includes(userId);

    if (isLiked) {
      // Unlike - remove user from likes array
      post.likes = post.likes.filter(id => id.toString() !== userId.toString());
    } else {
      // Like - add user to likes array
      post.likes.push(userId);
      
      // Create notification for post owner
      await createNotification({
        recipient: post.user._id,
        sender: userId,
        type: 'like',
        relatedPost: postId
      });
    }

    await post.save();

    res.status(200).json({
      message: isLiked ? "Post unliked" : "Post liked",
      liked: !isLiked,
      likesCount: post.likes.length,
      likes: post.likes
    });

  } catch (err) {
    console.error("Error liking post:", err);
    res.status(500).json({ message: "Error liking post" });
  }
};

// Delete a post
export const deletePost = async (req, res) => {
  try {
    const { postId } = req.params;

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    // Check if user is the author
    if (post.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized to delete this post" });
    }

    // Delete all comments for this post
    await Comment.deleteMany({ post: postId });

    // Delete the post
    await Post.findByIdAndDelete(postId);

    // Update user's posts count
    await User.findByIdAndUpdate(req.user._id, {
      $inc: { postsCount: -1 }
    });

    res.status(200).json({ message: "Post deleted successfully" });

  } catch (err) {
    console.error("Error deleting post:", err);
    res.status(500).json({ message: "Error deleting post" });
  }
};

// Get posts from followed users (Feed)
export const getFeed = async (req, res) => {
  try {
    const { limit = 20, page = 1 } = req.query;
    const skip = (page - 1) * limit;

    const user = await User.findById(req.user._id);
    const followingIds = user.following;

    // Include user's own posts in feed
    const feedQuery = {
      $or: [
        { user: { $in: followingIds } },
        { user: req.user._id }
      ]
    };

    const posts = await Post.find(feedQuery)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip)
      .populate("user", "username avatar bio")
      .lean();

    // Add user-specific data
    posts.forEach(post => {
      if (!Array.isArray(post.likes)) post.likes = [];
      post.isLiked = post.likes.includes(req.user._id);
    });

    res.status(200).json({
      posts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        hasMore: posts.length === parseInt(limit)
      }
    });

  } catch (err) {
    console.error("Error fetching feed:", err);
    res.status(500).json({ message: "Server error fetching feed" });
  }
};