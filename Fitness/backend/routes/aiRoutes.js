const express = require('express');
const router = express.Router();
const { chat, getSuggestions } = require('../controllers/aiController');

// AI Assistant Endpoints
router.post('/chat', chat);
router.get('/suggestions', getSuggestions);

module.exports = router;
