// backend/models/Story.js
import mongoose from 'mongoose';
import User from './User.js';

const storySchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content: {
    type: Object,
    required: true // { type: 'text'|'image', text?, image?, backgroundColor? }
  },
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  viewers: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    viewedAt: { type: Date, default: Date.now }
  }],
  createdAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, required: true, default: () => new Date(Date.now() + 24*60*60*1000) } // 24h expiry
}, { timestamps: true });

// ----- STATIC METHODS -----

// Get active stories for a specific user
storySchema.statics.getActiveStoriesForUser = function(userId) {
  return this.find({
    user: userId,
    expiresAt: { $gt: new Date() }
  }).sort({ createdAt: -1 }).populate('user', 'username avatar');
};

// Get active stories from an array of user IDs
storySchema.statics.getFollowingStories = function(userIds, currentUserId) {
  return this.find({
    user: { $in: userIds },
    expiresAt: { $gt: new Date() }
  })
    .sort({ createdAt: -1 })
    .populate('user', 'username avatar');
};

// ----- INSTANCE METHODS -----

// Check if a user has viewed the story
storySchema.methods.hasViewedBy = function(userId) {
  return this.viewers.some(v => v.user.toString() === userId.toString());
};

// Add a viewer
storySchema.methods.addViewer = async function(userId) {
  if (!this.hasViewedBy(userId)) {
    this.viewers.push({ user: userId });
    await this.save();
  }
};

// Check if story is expired
storySchema.virtual('isExpired').get(function() {
  return new Date() > this.expiresAt;
});

export default mongoose.models.Story || mongoose.model('Story', storySchema);
