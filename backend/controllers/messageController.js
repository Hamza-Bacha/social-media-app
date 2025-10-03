// backend/controllers/messageController.js
import Message from '../models/Message.js';
import Conversation from '../models/Conversation.js';
import User from '../models/User.js';

// Get user's conversations list
export const getConversations = async (req, res) => {
  try {
    const { limit = 20, page = 1 } = req.query;
    const userId = req.user._id;

    const conversations = await Conversation.getUserConversations(userId, limit, page);

    // Add unread message count and format response
    const conversationsWithUnread = await Promise.all(
      conversations.map(async (conv) => {
        const unreadCount = await Message.countDocuments({
          conversation: conv._id,
          recipient: userId,
          readBy: { $not: { $elemMatch: { user: userId } } },
          isDeleted: false
        });

        // Get other participant for 1-on-1 chats
        const otherParticipant = conv.participants.find(
          p => p._id.toString() !== userId.toString()
        );

        return {
          ...conv,
          unreadCount,
          otherParticipant,
          displayName: conv.isGroup ? conv.groupName : otherParticipant?.username,
          displayImage: conv.isGroup ? conv.groupImage : otherParticipant?.avatar
        };
      })
    );

    res.status(200).json({
      conversations: conversationsWithUnread,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        hasMore: conversations.length === parseInt(limit)
      }
    });
  } catch (err) {
    console.error('Error fetching conversations:', err);
    res.status(500).json({ message: 'Error fetching conversations' });
  }
};

// Get messages from a specific conversation
export const getConversationMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { limit = 50, page = 1 } = req.query;
    const userId = req.user._id;

    // Verify user is participant in conversation
    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: userId,
      isActive: true
    });

    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    const messages = await Message.getConversationMessages(conversationId, limit, page);

    // Mark messages as read
    await Message.updateMany(
      {
        conversation: conversationId,
        recipient: userId,
        readBy: { $not: { $elemMatch: { user: userId } } }
      },
      { $push: { readBy: { user: userId } } }
    );

    res.status(200).json({
      messages: messages.reverse(), // Reverse to show oldest first
      conversation,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        hasMore: messages.length === parseInt(limit)
      }
    });
  } catch (err) {
    console.error('Error fetching messages:', err);
    res.status(500).json({ message: 'Error fetching messages' });
  }
};

// Send a new message
export const sendMessage = async (req, res) => {
  try {
    const { recipientId, content, type = 'text' } = req.body;
    const senderId = req.user._id;

    // Validation
    if (senderId.toString() === recipientId) {
      return res.status(400).json({ message: 'Cannot send message to yourself' });
    }

    if (type === 'text' && (!content || content.trim().length === 0)) {
      return res.status(400).json({ message: 'Message content is required' });
    }

    if (type === 'text' && content.length > 1000) {
      return res.status(400).json({ message: 'Message too long (max 1000 characters)' });
    }

    // Verify recipient exists
    const recipient = await User.findById(recipientId);
    if (!recipient) {
      return res.status(404).json({ message: 'Recipient not found' });
    }

    // Find or create conversation
    let conversation = await Conversation.findBetweenUsers(senderId, recipientId);
    
    if (!conversation) {
      conversation = new Conversation({
        participants: [senderId, recipientId],
        isGroup: false
      });
      await conversation.save();
      await conversation.populate('participants', 'username avatar');
    }

    // Create message
    const messageData = {
      conversation: conversation._id,
      sender: senderId,
      recipient: recipientId,
      content: {
        type
      }
    };

    if (type === 'text') {
      messageData.content.text = content.trim();
    } else {
      // Handle media messages (future enhancement)
      messageData.content.media = req.body.media;
    }

    const message = new Message(messageData);
    await message.save();
    await message.populate([
      { path: 'sender', select: 'username avatar' },
      { path: 'recipient', select: 'username avatar' }
    ]);

    // Update conversation's last activity
    await conversation.updateLastActivity(message._id);

    // Emit socket event for real-time delivery (if socket.io is connected)
    if (req.io) {
      req.io.to(recipientId.toString()).emit('newMessage', {
        message,
        conversation: conversation._id
      });
    }

    res.status(201).json({
      message: 'Message sent successfully',
      data: message,
      conversationId: conversation._id
    });
  } catch (err) {
    console.error('Error sending message:', err);
    res.status(500).json({ message: 'Error sending message' });
  }
};

// Start new conversation with a user
export const startConversation = async (req, res) => {
  try {
    const { recipientId } = req.body;
    const userId = req.user._id;

    if (userId.toString() === recipientId) {
      return res.status(400).json({ message: 'Cannot start conversation with yourself' });
    }

    // Verify recipient exists
    const recipient = await User.findById(recipientId);
    if (!recipient) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if conversation already exists
    let conversation = await Conversation.findBetweenUsers(userId, recipientId);
    
    if (!conversation) {
      conversation = new Conversation({
        participants: [userId, recipientId],
        isGroup: false
      });
      await conversation.save();
    }

    await conversation.populate('participants', 'username avatar');

    const otherParticipant = conversation.participants.find(
      p => p._id.toString() !== userId.toString()
    );

    res.status(200).json({
      conversation: {
        ...conversation.toObject(),
        otherParticipant,
        displayName: otherParticipant.username,
        displayImage: otherParticipant.avatar,
        unreadCount: 0
      }
    });
  } catch (err) {
    console.error('Error starting conversation:', err);
    res.status(500).json({ message: 'Error starting conversation' });
  }
};

// Mark message as read
export const markAsRead = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user._id;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    await message.markAsRead(userId);

    res.status(200).json({ message: 'Message marked as read' });
  } catch (err) {
    console.error('Error marking message as read:', err);
    res.status(500).json({ message: 'Error marking message as read' });
  }
};

// Delete message
export const deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { deleteFor = 'me' } = req.body; // 'me' or 'everyone'
    const userId = req.user._id;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    // Check if user can delete the message
    const canDelete = message.sender.toString() === userId.toString() || 
                     message.recipient.toString() === userId.toString();

    if (!canDelete) {
      return res.status(403).json({ message: 'Not authorized to delete this message' });
    }

    if (deleteFor === 'everyone' && message.sender.toString() !== userId.toString()) {
      return res.status(403).json({ message: 'Can only delete for everyone if you sent the message' });
    }

    if (deleteFor === 'everyone') {
      // Delete for everyone
      message.isDeleted = true;
      await message.save();
    } else {
      // Delete for current user only
      if (!message.deletedFor.includes(userId)) {
        message.deletedFor.push(userId);
        await message.save();
      }
    }

    // Emit socket event for real-time update
    if (req.io && deleteFor === 'everyone') {
      const otherUserId = message.sender.toString() === userId.toString() 
        ? message.recipient.toString() 
        : message.sender.toString();
      
      req.io.to(otherUserId).emit('messageDeleted', {
        messageId: message._id,
        conversationId: message.conversation
      });
    }

    res.status(200).json({ message: 'Message deleted successfully' });
  } catch (err) {
    console.error('Error deleting message:', err);
    res.status(500).json({ message: 'Error deleting message' });
  }
};

// Get unread message count
export const getUnreadCount = async (req, res) => {
  try {
    const userId = req.user._id;
    const unreadCount = await Message.getUnreadCount(userId);
    
    res.status(200).json({ unreadCount });
  } catch (err) {
    console.error('Error getting unread count:', err);
    res.status(500).json({ message: 'Error getting unread count' });
  }
};