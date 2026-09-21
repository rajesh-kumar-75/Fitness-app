import { Conversation } from '../models/conversation.model.js';
import { Message } from '../models/message.model.js';
import { TrainerClient } from '../models/trainer-client.model.js';
import { User } from '../models/user.model.js';
import { ApiError } from '../utils/apiError.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { isUserOnline, getIO } from '../socket/index.js';

/**
 * Get all conversations for the authenticated user.
 * GET /api/v1/chat/conversations
 */
export const getConversations = async (req, res, next) => {
  try {
    const userId = req.user._id;

    const conversations = await Conversation.find({ participants: userId })
      .populate('participants', 'name email role profileImage')
      .populate('lastMessage')
      .populate('trainerClient')
      .sort({ lastMessageAt: -1 });

    const formattedConversations = conversations.map((conv) => {
      const partner = conv.participants.find(
        (p) => p._id.toString() !== userId.toString()
      );

      const unreadCount = conv.unreadCounts?.get(userId.toString()) || 0;

      return {
        _id: conv._id,
        partner: partner
          ? {
              _id: partner._id,
              name: partner.name,
              email: partner.email,
              role: partner.role,
              profileImage: partner.profileImage,
              isOnline: isUserOnline(partner._id),
            }
          : null,
        lastMessage: conv.lastMessage,
        lastMessageAt: conv.lastMessageAt,
        unreadCount,
        createdAt: conv.createdAt,
        updatedAt: conv.updatedAt,
      };
    });

    return ApiResponse.success(res, 'Conversations retrieved successfully', {
      conversations: formattedConversations,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get or create a conversation with a trainer or client.
 * POST /api/v1/chat/conversations
 */
export const getOrCreateConversation = async (req, res, next) => {
  try {
    const { partnerId } = req.body;

    if (!partnerId) {
      throw ApiError.badRequest('partnerId is required');
    }

    if (partnerId.toString() === req.user._id.toString()) {
      throw ApiError.badRequest('Cannot start a conversation with yourself');
    }

    const partner = await User.findById(partnerId);
    if (!partner) {
      throw ApiError.notFound('Partner user not found');
    }

    // Verify authorized trainer-client relationship unless ADMIN
    let connection = null;
    if (req.user.role !== 'ADMIN') {
      connection = await TrainerClient.findOne({
        $or: [
          { trainer: req.user._id, client: partnerId, status: 'active' },
          { trainer: partnerId, client: req.user._id, status: 'active' },
        ],
      });

      if (!connection) {
        throw ApiError.forbidden(
          'Messaging is only permitted between active clients and their assigned trainers'
        );
      }
    }

    // Check if conversation already exists
    let conversation = await Conversation.findOne({
      participants: { $all: [req.user._id, partnerId] },
    })
      .populate('participants', 'name email role profileImage')
      .populate('lastMessage');

    if (!conversation) {
      conversation = await Conversation.create({
        participants: [req.user._id, partnerId],
        trainerClient: connection?._id || null,
        unreadCounts: new Map([
          [req.user._id.toString(), 0],
          [partnerId.toString(), 0],
        ]),
      });

      conversation = await Conversation.findById(conversation._id)
        .populate('participants', 'name email role profileImage')
        .populate('lastMessage');
    }

    const partnerData = conversation.participants.find(
      (p) => p._id.toString() !== req.user._id.toString()
    );

    return ApiResponse.success(res, 'Conversation retrieved/created successfully', {
      conversation: {
        _id: conversation._id,
        partner: {
          _id: partnerData._id,
          name: partnerData.name,
          email: partnerData.email,
          role: partnerData.role,
          profileImage: partnerData.profileImage,
          isOnline: isUserOnline(partnerData._id),
        },
        lastMessage: conversation.lastMessage,
        lastMessageAt: conversation.lastMessageAt,
        unreadCount: conversation.unreadCounts?.get(req.user._id.toString()) || 0,
        createdAt: conversation.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get message history for a specific conversation.
 * GET /api/v1/chat/conversations/:conversationId/messages
 */
export const getMessages = async (req, res, next) => {
  try {
    const { conversationId } = req.params;
    const limit = parseInt(req.query.limit || '100', 10);

    const conv = await Conversation.findOne({
      _id: conversationId,
      participants: req.user._id,
    });

    if (!conv) {
      throw ApiError.forbidden('Conversation not found or access denied');
    }

    const messages = await Message.find({ conversation: conversationId })
      .populate('sender', 'name email profileImage role')
      .populate('recipient', 'name email profileImage role')
      .sort({ createdAt: 1 })
      .limit(limit);

    return ApiResponse.success(res, 'Messages retrieved successfully', {
      messages,
      total: messages.length,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * REST API to send a message (fallback / alternative to socket event).
 * POST /api/v1/chat/conversations/:conversationId/messages
 */
export const sendMessage = async (req, res, next) => {
  try {
    const { conversationId } = req.params;
    const { content } = req.body;

    if (!content || !content.trim()) {
      throw ApiError.badRequest('Message content cannot be empty');
    }

    const conv = await Conversation.findOne({
      _id: conversationId,
      participants: req.user._id,
    });

    if (!conv) {
      throw ApiError.forbidden('Conversation not found or access denied');
    }

    const recipientId = conv.participants.find(
      (p) => p.toString() !== req.user._id.toString()
    );

    const message = await Message.create({
      conversation: conversationId,
      sender: req.user._id,
      recipient: recipientId,
      content: content.trim(),
    });

    const populatedMessage = await Message.findById(message._id)
      .populate('sender', 'name email profileImage role')
      .populate('recipient', 'name email profileImage role');

    conv.lastMessage = message._id;
    conv.lastMessageAt = new Date();
    const unread = conv.unreadCounts.get(recipientId.toString()) || 0;
    conv.unreadCounts.set(recipientId.toString(), unread + 1);
    await conv.save();

    // Try emitting via Socket.IO if available
    try {
      const io = getIO();
      io.to(`conversation_${conversationId}`).emit('new_message', populatedMessage);
      io.to(`user_${recipientId.toString()}`).emit('new_notification', {
        type: 'message',
        message: populatedMessage,
        conversationId,
      });
    } catch (e) {
      // Socket.IO may not be active in unit tests; ignore
    }

    return ApiResponse.created(res, 'Message sent successfully', {
      message: populatedMessage,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Mark all unread messages in a conversation as read.
 * PATCH /api/v1/chat/conversations/:conversationId/read
 */
export const markConversationRead = async (req, res, next) => {
  try {
    const { conversationId } = req.params;

    const conv = await Conversation.findOne({
      _id: conversationId,
      participants: req.user._id,
    });

    if (!conv) {
      throw ApiError.forbidden('Conversation not found or access denied');
    }

    const now = new Date();

    const result = await Message.updateMany(
      {
        conversation: conversationId,
        recipient: req.user._id,
        isRead: false,
      },
      {
        isRead: true,
        readAt: now,
      }
    );

    conv.unreadCounts.set(req.user._id.toString(), 0);
    await conv.save();

    try {
      const io = getIO();
      io.to(`conversation_${conversationId}`).emit('messages_read', {
        conversationId,
        readBy: req.user._id.toString(),
        readAt: now,
      });
    } catch (e) {
      // ignore if socket offline
    }

    return ApiResponse.success(res, 'Messages marked as read', {
      modifiedCount: result.modifiedCount,
      readAt: now,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get total unread messages count for current user across all conversations.
 * GET /api/v1/chat/unread-count
 */
export const getUnreadCount = async (req, res, next) => {
  try {
    const totalUnread = await Message.countDocuments({
      recipient: req.user._id,
      isRead: false,
    });

    return ApiResponse.success(res, 'Unread count retrieved successfully', {
      totalUnread,
    });
  } catch (error) {
    next(error);
  }
};
