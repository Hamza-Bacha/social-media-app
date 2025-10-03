// backend/models/Conversation.js
import mongoose from 'mongoose';

const conversationSchema = new mongoose.Schema({
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }],
  lastMessage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message',
    default: null
  },
  lastActivity: {
    type: Date,
    default: Date.now,
    index: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  // For future group chat support
  isGroup: {
    type: Boolean,
    default: false
  },
  groupName: {
    type: String,
    default: null
  },
  groupImage: {
    type: String,
    default: null
  },
  // Privacy settings
  settings: {
    notifications: {
      type: Boolean,
      default: true
    },
    archived: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      archivedAt: {
        type: Date,
        default: Date.now
      }
    }]
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Compound index for participants (for finding conversations between users)
conversationSchema.index({ participants: 1 });
conversationSchema.index({ lastActivity: -1 });
conversationSchema.index({ isActive: 1, lastActivity: -1 });

// Virtual for participant count
conversationSchema.virtual('participantCount').get(function() {
  return this.participants.length;
});

// Static method to find conversation between two users
conversationSchema.statics.findBetweenUsers = function(user1Id, user2Id) {
  return this.findOne({
    participants: { $all: [user1Id, user2Id], $size: 2 },
    isGroup: false,
    isActive: true
  }).populate('participants', 'username avatar')
    .populate('lastMessage');
};

// Static method to get user's conversations
conversationSchema.statics.getUserConversations = function(userId, limit = 20, page = 1) {
  const skip = (page - 1) * limit;
  
  return this.find({
    participants: userId,
    isActive: true
  })
  .sort({ lastActivity: -1 })
  .limit(parseInt(limit))
  .skip(skip)
  .populate('participants', 'username avatar')
  .populate('lastMessage')
  .lean();
};

// Method to add participant (for group chats)
conversationSchema.methods.addParticipant = function(userId) {
  if (!this.participants.includes(userId)) {
    this.participants.push(userId);
    return this.save();
  }
  return Promise.resolve(this);
};

// Method to remove participant
conversationSchema.methods.removeParticipant = function(userId) {
  this.participants = this.participants.filter(id => id.toString() !== userId.toString());
  if (this.participants.length === 0) {
    this.isActive = false;
  }
  return this.save();
};

// Method to update last activity
conversationSchema.methods.updateLastActivity = function(messageId = null) {
  this.lastActivity = new Date();
  if (messageId) {
    this.lastMessage = messageId;
  }
  return this.save();
};

// Method to get other participant (for 1-on-1 chats)
conversationSchema.methods.getOtherParticipant = function(currentUserId) {
  return this.participants.find(p => p._id.toString() !== currentUserId.toString());
};

export default mongoose.model('Conversation', conversationSchema);