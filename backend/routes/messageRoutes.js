// backend/routes/messageRoutes.js
import express from 'express';
import { authenticate } from '../middlewares/authMiddleware.js';
import {
  getConversations,
  getConversationMessages,
  sendMessage,
  startConversation,
  markAsRead,
  deleteMessage,
  getUnreadCount
} from '../controllers/messageController.js';

const router = express.Router();

// All message routes require authentication
router.use(authenticate);

// Get user's conversations
router.get('/conversations', getConversations);

// Get messages from a conversation
router.get('/conversations/:conversationId/messages', getConversationMessages);

// Send a message
router.post('/send', sendMessage);

// Start new conversation
router.post('/conversations', startConversation);

// Mark message as read
router.put('/:messageId/read', markAsRead);

// Delete message
router.delete('/:messageId', deleteMessage);

// Get unread message count
router.get('/unread-count', getUnreadCount);

export default router;