import Comment from "../models/Comment.js";
import Post from "../models/Post.js";
import { createNotification } from "./notificationController.js"; // Add notification support

// Get comments for a specific post
export const getComments = async (req, res) => {
  try {
    const { postId } = req.params;
    const { limit = 10, page = 1 } = req.query;
    const skip = (page - 1) * limit;
    
    // Verify post exists
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }
    
    const comments = await Comment.find({ post: postId })
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip)
      .populate("user", "username avatar")
      .lean();
    
    // Add user-specific data if authenticated
    if (req.user) {
      comments.forEach(comment => {
        comment.isLiked = comment.likes.includes(req.user._id);
        comment.canDelete = comment.user._id.toString() === req.user._id.toString();
      });
    }
    
    res.status(200).json({
      comments,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        hasMore: comments.length === parseInt(limit)
      }
    });
  } catch (err) {
    console.error("Error fetching comments:", err);
    res.status(500).json({ message: "Server error fetching comments" });
  }
};

// Create a new comment
export const createComment = async (req, res) => {
  try {
    const { content } = req.body;
    const { postId } = req.params;
    
    if (!content || content.trim().length === 0) {
      return res.status(400).json({ message: "Comment content is required" });
    }
    
    if (content.length > 300) {
      return res.status(400).json({ message: "Comment must be less than 300 characters" });
    }
    
    if (!req.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    // Verify post exists and get post owner info
    const post = await Post.findById(postId).populate('user', 'username');
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }
    
    const comment = new Comment({
      content: content.trim(),
      user: req.user._id,
      post: postId
    });
    
    const savedComment = await comment.save();
    await savedComment.populate("user", "username avatar");
    
    // Update post's comments count
    await Post.findByIdAndUpdate(postId, {
      $inc: { commentsCount: 1 }
    });
    
    // Create notification for post owner
    await createNotification({
      recipient: post.user._id,
      sender: req.user._id,
      type: 'comment',
      relatedPost: postId,
      relatedComment: savedComment._id
    });
    
    // Add user-specific data
    const commentResponse = savedComment.toObject();
    commentResponse.isLiked = false;
    commentResponse.canDelete = true;
    
    res.status(201).json({
      message: "Comment created successfully",
      comment: commentResponse
    });
    
  } catch (err) {
    console.error("Error creating comment:", err);
    res.status(500).json({ message: "Error creating comment" });
  }
};

// Like/Unlike a comment
export const likeComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const userId = req.user._id;
    
    const comment = await Comment.findById(commentId).populate('user', 'username');
    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }
    
    const isLiked = comment.likes.includes(userId);
    
    if (isLiked) {
      // Unlike
      comment.likes = comment.likes.filter(id => id.toString() !== userId.toString());
    } else {
      // Like
      comment.likes.push(userId);
      
      // Create notification for comment owner (if not liking own comment)
      if (comment.user._id.toString() !== userId.toString()) {
        await createNotification({
          recipient: comment.user._id,
          sender: userId,
          type: 'like',
          relatedComment: commentId
        });
      }
    }
    
    await comment.save();
    
    res.status(200).json({
      message: isLiked ? "Comment unliked" : "Comment liked",
      liked: !isLiked,
      likesCount: comment.likes.length
    });
    
  } catch (err) {
    console.error("Error liking comment:", err);
    res.status(500).json({ message: "Error liking comment" });
  }
};

// Delete a comment
export const deleteComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    
    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }
    
    // Check if user is the author of the comment
    if (comment.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized to delete this comment" });
    }
    
    // Update post's comments count
    await Post.findByIdAndUpdate(comment.post, {
      $inc: { commentsCount: -1 }
    });
    
    await Comment.findByIdAndDelete(commentId);
    
    res.status(200).json({ message: "Comment deleted successfully" });
    
  } catch (err) {
    console.error("Error deleting comment:", err);
    res.status(500).json({ message: "Error deleting comment" });
  }
};