import User from "../models/User.js";
import Post from "../models/Post.js";
import { createNotification } from "./notificationController.js"; // Add notification support

// Get all users (for search/discovery)
export const getUsers = async (req, res) => {
  try {
    const { search, limit = 10, page = 1 } = req.query;
    const skip = (page - 1) * limit;
    
    let query = {};
    
    if (search) {
      query = {
        $or: [
          { username: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } }
        ]
      };
    }
    
    const users = await User.find(query)
      .select('-password -email') // Don't send password or email
      .limit(parseInt(limit))
      .skip(skip)
      .sort({ followersCount: -1, createdAt: -1 });
    
    // Add follow status if user is authenticated
    if (req.user) {
      users.forEach(user => {
        user._doc.isFollowing = req.user.following.includes(user._id);
        user._doc.isOwnProfile = user._id.toString() === req.user._id.toString();
      });
    }
    
    res.status(200).json({
      users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        hasMore: users.length === parseInt(limit)
      }
    });
  } catch (err) {
    console.error("Error fetching users:", err);
    res.status(500).json({ message: "Server error fetching users" });
  }
};

// Get user profile by ID or username
export const getUserProfile = async (req, res) => {
  try {
    const { identifier } = req.params; // Can be userId or username
    
    let user;
    
    // Try to find by MongoDB ObjectId first, then by username
    if (identifier.match(/^[0-9a-fA-F]{24}$/)) {
      user = await User.findById(identifier).select('-password');
    } else {
      user = await User.findOne({ username: identifier }).select('-password');
    }
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    // Add relationship status if viewer is authenticated
    let profileData = user.toObject();
    
    if (req.user) {
      profileData.isFollowing = req.user.following.includes(user._id);
      profileData.isOwnProfile = user._id.toString() === req.user._id.toString();
      profileData.followsYou = user.following.includes(req.user._id);
    }
    
    res.status(200).json(profileData);
  } catch (err) {
    console.error("Error fetching user profile:", err);
    res.status(500).json({ message: "Server error fetching user profile" });
  }
};

// Follow/Unfollow a user
export const followUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user._id;
    
    if (userId === currentUserId.toString()) {
      return res.status(400).json({ message: "You cannot follow yourself" });
    }
    
    const userToFollow = await User.findById(userId).select('username');
    if (!userToFollow) {
      return res.status(404).json({ message: "User not found" });
    }
    
    const currentUser = await User.findById(currentUserId);
    const isFollowing = currentUser.following.includes(userId);
    
    if (isFollowing) {
      // Unfollow
      currentUser.following = currentUser.following.filter(
        id => id.toString() !== userId
      );
      userToFollow.followers = userToFollow.followers.filter(
        id => id.toString() !== currentUserId.toString()
      );
    } else {
      // Follow
      currentUser.following.push(userId);
      userToFollow.followers.push(currentUserId);
      
      // Create follow notification
      await createNotification({
        recipient: userId,
        sender: currentUserId,
        type: 'follow'
      });
    }
    
    await Promise.all([currentUser.save(), userToFollow.save()]);
    
    res.status(200).json({
      message: isFollowing ? "Unfollowed successfully" : "Followed successfully",
      isFollowing: !isFollowing,
      followersCount: userToFollow.followers.length,
      followingCount: currentUser.following.length
    });
    
  } catch (err) {
    console.error("Error following user:", err);
    res.status(500).json({ message: "Error following user" });
  }
};

// Get user's followers
export const getUserFollowers = async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 20, page = 1 } = req.query;
    const skip = (page - 1) * limit;
    
    const user = await User.findById(userId)
      .populate({
        path: 'followers',
        select: 'username avatar bio followersCount',
        options: {
          limit: parseInt(limit),
          skip: skip,
          sort: { followersCount: -1 }
        }
      });
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    // Add follow status if viewer is authenticated
    if (req.user) {
      user.followers.forEach(follower => {
        follower._doc.isFollowing = req.user.following.includes(follower._id);
        follower._doc.isOwnProfile = follower._id.toString() === req.user._id.toString();
      });
    }
    
    res.status(200).json({
      followers: user.followers,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        hasMore: user.followers.length === parseInt(limit)
      }
    });
  } catch (err) {
    console.error("Error fetching followers:", err);
    res.status(500).json({ message: "Server error fetching followers" });
  }
};

// Get user's following
export const getUserFollowing = async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 20, page = 1 } = req.query;
    const skip = (page - 1) * limit;
    
    const user = await User.findById(userId)
      .populate({
        path: 'following',
        select: 'username avatar bio followersCount',
        options: {
          limit: parseInt(limit),
          skip: skip,
          sort: { followersCount: -1 }
        }
      });
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    // Add follow status if viewer is authenticated
    if (req.user) {
      user.following.forEach(following => {
        following._doc.isFollowing = req.user.following.includes(following._id);
        following._doc.isOwnProfile = following._id.toString() === req.user._id.toString();
      });
    }
    
    res.status(200).json({
      following: user.following,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        hasMore: user.following.length === parseInt(limit)
      }
    });
  } catch (err) {
    console.error("Error fetching following:", err);
    res.status(500).json({ message: "Server error fetching following" });
  }
};

// Update user profile
export const updateProfile = async (req, res) => {
  try {
    const { username, bio, avatar } = req.body;
    const userId = req.user._id;
    
    // Validation
    if (username && username.length < 3) {
      return res.status(400).json({ message: "Username must be at least 3 characters" });
    }
    
    if (bio && bio.length > 160) {
      return res.status(400).json({ message: "Bio must be less than 160 characters" });
    }
    
    // Check if username is already taken (if changing)
    if (username && username !== req.user.username) {
      const existingUser = await User.findOne({ 
        username: username.toLowerCase(),
        _id: { $ne: userId }
      });
      
      if (existingUser) {
        return res.status(400).json({ message: "Username already taken" });
      }
    }
    
    const updateData = {};
    if (username) updateData.username = username.trim();
    if (bio !== undefined) updateData.bio = bio.trim();
    if (avatar !== undefined) updateData.avatar = avatar;
    
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');
    
    res.status(200).json({
      message: "Profile updated successfully",
      user: updatedUser
    });
    
  } catch (err) {
    console.error("Error updating profile:", err);
    
    if (err.code === 11000) {
      return res.status(400).json({ message: "Username already taken" });
    }
    
    res.status(500).json({ message: "Error updating profile" });
  }
};

// Get user's posts
export const getUserPosts = async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 10, page = 1 } = req.query;
    const skip = (page - 1) * limit;
    
    const posts = await Post.find({ user: userId })
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip)
      .populate("user", "username avatar bio")
      .lean();
    
    // Add user-specific data if authenticated
    if (req.user) {
      posts.forEach(post => {
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
    console.error("Error fetching user posts:", err);
    res.status(500).json({ message: "Server error fetching user posts" });
  }
};