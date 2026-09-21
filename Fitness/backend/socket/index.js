const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');

let io = null;

// Map of userId (string) -> Set of socketId (string)
const onlineUsers = new Map();

/**
 * Check if a specific user is currently online.
 */
const isUserOnline = (userId) => {
  if (!userId) return false;
  const sockets = onlineUsers.get(userId.toString());
  return !!sockets && sockets.size > 0;
};

/**
 * Get all online user IDs.
 */
const getOnlineUserIds = () => {
  return Array.from(onlineUsers.keys());
};

/**
 * Get the initialized Socket.IO instance.
 */
const getIO = () => {
  return io;
};

/**
 * Initialize Socket.IO with the HTTP server.
 */
const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: [
        'http://localhost:4200',
        'http://localhost:3000',
        'http://localhost:5173',
        'http://127.0.0.1:4200',
        'http://127.0.0.1:3000',
        process.env.CLIENT_URL,
        process.env.CORS_ORIGIN,
      ].filter(Boolean),
      credentials: true,
      methods: ['GET', 'POST'],
    },
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  // 1. JWT Authentication Middleware
  io.use(async (socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        (socket.handshake.headers?.authorization &&
          socket.handshake.headers.authorization.split(' ')[1]);

      if (!token) {
        return next(new Error('Authentication token required'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('-password');
      if (!user) {
        return next(new Error('User not found'));
      }

      socket.user = user;
      return next();
    } catch (err) {
      console.warn('[Socket.IO Auth Error]:', err.message);
      return next(new Error('Authentication failed: ' + err.message));
    }
  });

  // 2. Connection Handling
  io.on('connection', (socket) => {
    const userId = socket.user._id.toString();

    // Register user socket
    if (!onlineUsers.has(userId)) {
      onlineUsers.set(userId, new Set());
      // Broadcast online status to others
      socket.broadcast.emit('user_presence', {
        userId,
        status: 'online',
        timestamp: new Date(),
      });
    }
    onlineUsers.get(userId).add(socket.id);

    // Join personal user room for direct notifications
    socket.join(`user_${userId}`);

    // Send initial online users list to connecting client
    socket.emit('initial_presence', {
      onlineUserIds: getOnlineUserIds(),
    });

    console.log(`[Socket.IO] User connected: ${socket.user.name} (${userId}) on socket ${socket.id}`);

    // Join Conversation Room
    socket.on('join_conversation', ({ conversationId }) => {
      if (conversationId) {
        socket.join(`conversation_${conversationId}`);
        console.log(`[Socket.IO] User ${userId} joined room conversation_${conversationId}`);
      }
    });

    // Leave Conversation Room
    socket.on('leave_conversation', ({ conversationId }) => {
      if (conversationId) {
        socket.leave(`conversation_${conversationId}`);
        console.log(`[Socket.IO] User ${userId} left room conversation_${conversationId}`);
      }
    });

    // Send Real-time Message
    socket.on('send_message', async (data, callback) => {
      try {
        const { conversationId, content } = data;
        if (!conversationId || !content || !content.trim()) {
          if (typeof callback === 'function') {
            return callback({ success: false, error: 'conversationId and content are required' });
          }
          return;
        }

        const conversation = await Conversation.findById(conversationId);
        if (!conversation) {
          if (typeof callback === 'function') {
            return callback({ success: false, error: 'Conversation not found' });
          }
          return;
        }

        const isParticipant = conversation.participants.some(
          (p) => p.toString() === userId
        );
        if (!isParticipant) {
          if (typeof callback === 'function') {
            return callback({ success: false, error: 'Not authorized for this conversation' });
          }
          return;
        }

        const recipientId = conversation.participants.find(
          (p) => p.toString() !== userId
        );

        // Create Message
        const message = await Message.create({
          conversation: conversationId,
          sender: userId,
          recipient: recipientId,
          content: content.trim(),
        });

        // Update conversation
        conversation.lastMessage = message._id;
        conversation.lastMessageAt = new Date();
        const currentUnread = conversation.unreadCounts?.get(recipientId.toString()) || 0;
        if (!conversation.unreadCounts) conversation.unreadCounts = new Map();
        conversation.unreadCounts.set(recipientId.toString(), currentUnread + 1);
        await conversation.save();

        const populatedMessage = await Message.findById(message._id)
          .populate('sender', '_id name email role profileImage')
          .populate('recipient', '_id name email role profileImage');

        // Broadcast to conversation room
        io.to(`conversation_${conversationId}`).emit('new_message', populatedMessage);

        // Also notify recipient's personal room
        io.to(`user_${recipientId}`).emit('new_notification', {
          type: 'message',
          conversationId,
          senderName: socket.user.name,
        });

        if (typeof callback === 'function') {
          callback({ success: true, message: populatedMessage });
        }
      } catch (err) {
        console.error('[Socket.IO send_message Error]:', err);
        if (typeof callback === 'function') {
          callback({ success: false, error: err.message });
        }
      }
    });

    // Typing Indicators
    socket.on('typing_start', ({ conversationId, recipientId }) => {
      if (conversationId) {
        socket.to(`conversation_${conversationId}`).emit('user_typing', {
          conversationId,
          userName: socket.user.name,
          isTyping: true,
        });
      }
    });

    socket.on('typing_stop', ({ conversationId, recipientId }) => {
      if (conversationId) {
        socket.to(`conversation_${conversationId}`).emit('user_typing', {
          conversationId,
          userName: socket.user.name,
          isTyping: false,
        });
      }
    });

    // Mark Messages as Read
    socket.on('mark_as_read', async ({ conversationId }) => {
      try {
        if (!conversationId) return;

        const readAt = new Date();
        await Message.updateMany(
          {
            conversation: conversationId,
            recipient: userId,
            isRead: false,
          },
          {
            $set: { isRead: true, readAt },
          }
        );

        const conv = await Conversation.findById(conversationId);
        if (conv && conv.unreadCounts) {
          conv.unreadCounts.set(userId, 0);
          await conv.save();
        }

        io.to(`conversation_${conversationId}`).emit('messages_read', {
          conversationId,
          readBy: userId,
          readAt,
        });
      } catch (err) {
        console.error('[Socket.IO mark_as_read Error]:', err);
      }
    });

    // Disconnect Handling
    socket.on('disconnect', () => {
      const userSockets = onlineUsers.get(userId);
      if (userSockets) {
        userSockets.delete(socket.id);
        if (userSockets.size === 0) {
          onlineUsers.delete(userId);
          socket.broadcast.emit('user_presence', {
            userId,
            status: 'offline',
            timestamp: new Date(),
          });
        }
      }
      console.log(`[Socket.IO] Socket disconnected: ${socket.id} (User: ${userId})`);
    });
  });

  return io;
};

module.exports = {
  initSocket,
  getIO,
  isUserOnline,
  getOnlineUserIds,
};
