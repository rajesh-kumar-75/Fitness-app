import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';
import { User } from '../models/user.model.js';
import { Conversation } from '../models/conversation.model.js';
import { Message } from '../models/message.model.js';

let io = null;

// In-memory registry of online users: userId (string) -> Set of socketId (string)
const onlineUsers = new Map();

/**
 * Check if a specific user is currently online.
 */
export const isUserOnline = (userId) => {
  const sockets = onlineUsers.get(userId?.toString());
  return !!sockets && sockets.size > 0;
};

/**
 * Get all currently online user IDs.
 */
export const getOnlineUserIds = () => {
  return Array.from(onlineUsers.keys());
};

/**
 * Initialize Socket.IO with HTTP server.
 */
export const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: [config.corsOrigin, 'http://localhost:4200'],
      credentials: true,
      methods: ['GET', 'POST'],
    },
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  // 1. Handshake Authentication Middleware (Database Disconnected Guard)
  io.use(async (socket, next) => {
    // In disconnected mode, reject gracefully without querying MongoDB
    return next(new Error('Database is currently disconnected.'));
  });

  // 2. Connection Handling
  io.on('connection', (socket) => {
    const userId = socket.user._id.toString();

    // Register socket in online user registry
    if (!onlineUsers.has(userId)) {
      onlineUsers.set(userId, new Set());
      // Broadcast online status
      socket.broadcast.emit('user_presence', {
        userId,
        status: 'online',
        timestamp: new Date(),
      });
    }
    onlineUsers.get(userId).add(socket.id);

    // Join personal user room for direct events and notifications
    socket.join(`user_${userId}`);

    // Send initial list of online users to the newly connected socket
    socket.emit('initial_presence', {
      onlineUserIds: getOnlineUserIds(),
    });

    console.log(`[Socket.IO] User connected: ${socket.user.name} (${userId}) - Socket: ${socket.id}`);

    // --- Join Conversation Room ---
    socket.on('join_conversation', async ({ conversationId }, callback) => {
      try {
        if (!conversationId) return;

        const conv = await Conversation.findOne({
          _id: conversationId,
          participants: socket.user._id,
        });

        if (!conv) {
          if (callback) callback({ error: 'Conversation not found or access denied' });
          return;
        }

        socket.join(`conversation_${conversationId}`);
        if (callback) callback({ success: true, conversationId });
      } catch (error) {
        if (callback) callback({ error: error.message });
      }
    });

    // --- Leave Conversation Room ---
    socket.on('leave_conversation', ({ conversationId }) => {
      if (conversationId) {
        socket.leave(`conversation_${conversationId}`);
      }
    });

    // --- Send Message ---
    socket.on('send_message', async ({ conversationId, content }, callback) => {
      try {
        if (!conversationId || !content || !content.trim()) {
          if (callback) callback({ error: 'Conversation ID and message content are required' });
          return;
        }

        const conv = await Conversation.findOne({
          _id: conversationId,
          participants: socket.user._id,
        });

        if (!conv) {
          if (callback) callback({ error: 'Conversation not found or access denied' });
          return;
        }

        // Determine recipient
        const recipientId = conv.participants.find(
          (p) => p.toString() !== socket.user._id.toString()
        );

        if (!recipientId) {
          if (callback) callback({ error: 'Recipient could not be identified' });
          return;
        }

        // Create message in MongoDB
        const message = await Message.create({
          conversation: conversationId,
          sender: socket.user._id,
          recipient: recipientId,
          content: content.trim(),
        });

        const populatedMessage = await Message.findById(message._id)
          .populate('sender', 'name email profileImage role')
          .populate('recipient', 'name email profileImage role');

        // Update conversation lastMessage & unreadCounts
        conv.lastMessage = message._id;
        conv.lastMessageAt = new Date();
        const currentUnread = conv.unreadCounts.get(recipientId.toString()) || 0;
        conv.unreadCounts.set(recipientId.toString(), currentUnread + 1);
        await conv.save();

        // Emit to conversation room (real-time chat view)
        io.to(`conversation_${conversationId}`).emit('new_message', populatedMessage);

        // Emit notification to recipient's personal room
        io.to(`user_${recipientId.toString()}`).emit('new_notification', {
          type: 'message',
          message: populatedMessage,
          conversationId,
        });

        if (callback) callback({ success: true, message: populatedMessage });
      } catch (error) {
        console.error('[Socket.IO] send_message error:', error);
        if (callback) callback({ error: error.message });
      }
    });

    // --- Typing Indicators ---
    socket.on('typing_start', ({ conversationId, recipientId }) => {
      if (conversationId) {
        socket.to(`conversation_${conversationId}`).emit('user_typing', {
          conversationId,
          userId,
          userName: socket.user.name,
          isTyping: true,
        });
      }
      if (recipientId) {
        socket.to(`user_${recipientId}`).emit('user_typing', {
          conversationId,
          userId,
          userName: socket.user.name,
          isTyping: true,
        });
      }
    });

    socket.on('typing_stop', ({ conversationId, recipientId }) => {
      if (conversationId) {
        socket.to(`conversation_${conversationId}`).emit('user_typing', {
          conversationId,
          userId,
          userName: socket.user.name,
          isTyping: false,
        });
      }
      if (recipientId) {
        socket.to(`user_${recipientId}`).emit('user_typing', {
          conversationId,
          userId,
          userName: socket.user.name,
          isTyping: false,
        });
      }
    });

    // --- Mark Messages as Read ---
    socket.on('mark_as_read', async ({ conversationId }, callback) => {
      try {
        if (!conversationId) return;

        const now = new Date();

        // Update messages in MongoDB
        await Message.updateMany(
          {
            conversation: conversationId,
            recipient: socket.user._id,
            isRead: false,
          },
          {
            isRead: true,
            readAt: now,
          }
        );

        // Reset conversation unread count
        const conv = await Conversation.findById(conversationId);
        if (conv) {
          conv.unreadCounts.set(socket.user._id.toString(), 0);
          await conv.save();
        }

        // Notify conversation room of read event
        io.to(`conversation_${conversationId}`).emit('messages_read', {
          conversationId,
          readBy: socket.user._id.toString(),
          readAt: now,
        });

        if (callback) callback({ success: true, readAt: now });
      } catch (error) {
        console.error('[Socket.IO] mark_as_read error:', error);
        if (callback) callback({ error: error.message });
      }
    });

    // --- Disconnect Handling ---
    socket.on('disconnect', () => {
      const userSockets = onlineUsers.get(userId);
      if (userSockets) {
        userSockets.delete(socket.id);
        if (userSockets.size === 0) {
          onlineUsers.delete(userId);
          // Broadcast offline status with timestamp
          socket.broadcast.emit('user_presence', {
            userId,
            status: 'offline',
            lastSeen: new Date(),
          });
        }
      }
      console.log(`[Socket.IO] Socket disconnected: ${socket.id} (User: ${socket.user.name})`);
    });
  });

  return io;
};

/**
 * Access the active Socket.IO server instance.
 */
export const getIO = () => {
  if (!io) {
    throw new Error('Socket.IO has not been initialized yet!');
  }
  return io;
};

export default { initSocket, getIO, isUserOnline, getOnlineUserIds };
