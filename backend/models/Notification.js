// backend/models/Notification.js
import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['like', 'comment', 'follow', 'story_view', 'mention'],
    required: true
  },
  message: {
    type: String,
    required: true
  },
  relatedPost: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post',
    default: null
  },
  relatedComment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Comment', 
    default: null
  },
  relatedStory: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Story',
    default: null
  },
  read: {
    type: Boolean,
    default: false,
    index: true
  },
  readAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Compound indexes for efficient queries
notificationSchema.index({ recipient: 1, createdAt: -1 });
notificationSchema.index({ recipient: 1, read: 1, createdAt: -1 });

// Static method to create notification
notificationSchema.statics.createNotification = async function(data) {
  const { recipient, sender, type, relatedPost, relatedComment, relatedStory } = data;
  
  // Don't send notification to yourself
  if (recipient.toString() === sender.toString()) {
    return null;
  }

  // Check for duplicate notifications (within last 5 minutes)
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
  const existingNotification = await this.findOne({
    recipient,
    sender,
    type,
    relatedPost: relatedPost || null,
    relatedComment: relatedComment || null,
    relatedStory: relatedStory || null,
    createdAt: { $gte: fiveMinutesAgo }
  });

  if (existingNotification) {
    return existingNotification;
  }

  // Generate message based on type
  let message = '';
  switch (type) {
    case 'like':
      message = 'liked your post';
      break;
    case 'comment':
      message = 'commented on your post';
      break;
    case 'follow':
      message = 'started following you';
      break;
    case 'story_view':
      message = 'viewed your story';
      break;
    case 'mention':
      message = 'mentioned you in a post';
      break;
    default:
      message = 'interacted with your content';
  }

  const notification = new this({
    recipient,
    sender,
    type,
    message,
    relatedPost,
    relatedComment,
    relatedStory
  });

  await notification.save();
  await notification.populate([
    { path: 'sender', select: 'username avatar' },
    { path: 'relatedPost', select: 'content image' }
  ]);

  return notification;
};

// Method to mark as read
notificationSchema.methods.markAsRead = function() {
  this.read = true;
  this.readAt = new Date();
  return this.save();
};

// Static method to mark multiple as read
notificationSchema.statics.markAllAsRead = function(userId) {
  return this.updateMany(
    { recipient: userId, read: false },
    { read: true, readAt: new Date() }
  );
};

// Static method to get unread count
notificationSchema.statics.getUnreadCount = function(userId) {
  return this.countDocuments({ recipient: userId, read: false });
};

// Auto-delete old notifications (older than 30 days)
notificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 });

export default mongoose.model('Notification', notificationSchema);