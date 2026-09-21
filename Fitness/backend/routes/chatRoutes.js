const express = require('express');
const {
  getUnreadCount,
  getConversations,
  getOrCreateConversation,
  getMessages,
  sendMessage,
  markConversationRead,
} = require('../controllers/chatController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// All chat routes require valid JWT authentication
router.use(protect);

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

module.exports = router;
