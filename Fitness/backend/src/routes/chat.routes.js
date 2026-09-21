import { Router } from 'express';
import {
  getConversations,
  getOrCreateConversation,
  getMessages,
  sendMessage,
  markConversationRead,
  getUnreadCount,
} from '../controllers/chat.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';

const router = Router();

// All chat routes require authentication
router.use(authenticate);

// Unread count
router.get('/unread-count', getUnreadCount);

// Conversations list & creation
router.get('/conversations', getConversations);
router.post('/conversations', getOrCreateConversation);

// Messages inside a conversation
router.get('/conversations/:conversationId/messages', getMessages);
router.post('/conversations/:conversationId/messages', sendMessage);

// Mark conversation read
router.patch('/conversations/:conversationId/read', markConversationRead);

export default router;
