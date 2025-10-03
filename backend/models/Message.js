// backend/models/Message.js
import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  conversation: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Conversation',
    required: true,
    index: true
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  content: {
    type: {
      type: String,
      enum: ['text', 'image', 'video', 'file'],
      default: 'text'
    },
    text: {
      type: String,
      maxlength: 1000,
      required: function() { return this.content.type === 'text'; }
    },
    media: {
      url: String,
      filename: String,
      size: Number,
      mimetype: String
    }
  },
  readBy: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    readAt: {
      type: Date,
      default: Date.now
    }
  }],
  isDeleted: {
    type: Boolean,
    default: false
  },
  deletedFor: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  editedAt: {
    type: Date,
    default: null
  },
  originalContent: {
    type: String,
    default: null
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for efficient queries
messageSchema.index({ conversation: 1, createdAt: -1 });
messageSchema.index({ sender: 1, createdAt: -1 });
messageSchema.index({ recipient: 1, createdAt: -1 });

// Virtual for read status
messageSchema.virtual('isRead').get(function() {
  return this.readBy && this.readBy.length > 0;
});

// Method to mark as read
messageSchema.methods.markAsRead = function(userId) {
  const existingRead = this.readBy.find(r => r.user.toString() === userId.toString());
  if (!existingRead && this.sender.toString() !== userId.toString()) {
    this.readBy.push({ user: userId });
    return this.save();
  }
  return Promise.resolve(this);
};

// Static method to get conversation messages
messageSchema.statics.getConversationMessages = function(conversationId, limit = 50, page = 1) {
  const skip = (page - 1) * limit;
  
  return this.find({
    conversation: conversationId,
    isDeleted: false
  })
  .sort({ createdAt: -1 })
  .limit(parseInt(limit))
  .skip(skip)
  .populate('sender', 'username avatar')
  .populate('recipient', 'username avatar')
  .lean();
};

// Static method to get unread count for user
messageSchema.statics.getUnreadCount = function(userId) {
  return this.countDocuments({
    recipient: userId,
    readBy: { $not: { $elemMatch: { user: userId } } },
    isDeleted: false
  });
};

export default mongoose.model('Message', messageSchema);