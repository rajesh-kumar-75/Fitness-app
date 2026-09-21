const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const User = require('../models/User');
const Trainer = require('../models/Trainer');
const TrainerClient = require('../models/TrainerClient');
const { getIO, isUserOnline } = require('../socket');

/**
 * @desc    Get total unread message count for authenticated user
 * @route   GET /api/v1/chat/unread-count
 * @access  Private
 */
const getUnreadCount = async (req, res) => {
  try {
    const userId = req.user._id;
    const totalUnread = await Message.countDocuments({
      recipient: userId,
      isRead: false,
    });

    return res.status(200).json({
      success: true,
      data: { totalUnread },
    });
  } catch (error) {
    console.error('getUnreadCount error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve unread message count',
      error: error.message,
    });
  }
};

/**
 * @desc    Get all conversations for authenticated user
 * @route   GET /api/v1/chat/conversations
 * @access  Private
 */
const getConversations = async (req, res) => {
  try {
    const userId = req.user._id;

    const conversations = await Conversation.find({ participants: userId })
      .populate('participants', '_id name email role profileImage')
      .populate({
        path: 'lastMessage',
        populate: { path: 'sender recipient', select: '_id name email role profileImage' },
      })
      .sort({ lastMessageAt: -1, updatedAt: -1 });

    const formatted = conversations
      .map((conv) => {
        const partner = conv.participants.find(
          (p) => p && p._id.toString() !== userId.toString()
        );

        if (!partner) return null;

        const unreadCount = conv.unreadCounts?.get
          ? conv.unreadCounts.get(userId.toString()) || 0
          : (conv.unreadCounts && conv.unreadCounts[userId.toString()]) || 0;

        return {
          _id: conv._id,
          partner: {
            _id: partner._id,
            name: partner.name,
            email: partner.email,
            role: partner.role,
            profileImage: partner.profileImage || '',
            isOnline: isUserOnline(partner._id),
          },
          lastMessage: conv.lastMessage || null,
          lastMessageAt: conv.lastMessageAt || conv.updatedAt,
          unreadCount,
          createdAt: conv.createdAt,
          updatedAt: conv.updatedAt,
        };
      })
      .filter(Boolean);

    return res.status(200).json({
      success: true,
      data: {
        conversations: formatted,
      },
    });
  } catch (error) {
    console.error('getConversations error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve conversations',
      error: error.message,
    });
  }
};

/**
 * @desc    Get or create conversation between authenticated user and partner (trainer or client)
 * @route   POST /api/v1/chat/conversations
 * @access  Private
 */
const getOrCreateConversation = async (req, res) => {
  try {
    const userId = req.user._id;
    const { partnerId } = req.body;

    if (!partnerId) {
      return res.status(400).json({
        success: false,
        message: 'partnerId is required',
      });
    }

    if (partnerId.toString() === userId.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Cannot start conversation with yourself',
      });
    }

    // Resolve partner: can be either User ID or Trainer ID
    let partnerUser = await User.findById(partnerId).select('-password');
    if (!partnerUser) {
      const trainerDoc = await Trainer.findById(partnerId);
      if (trainerDoc) {
        if (trainerDoc.user) {
          partnerUser = await User.findById(trainerDoc.user).select('-password');
        }
        if (!partnerUser) {
          partnerUser = await User.findOne({ email: trainerDoc.email.toLowerCase() }).select('-password');
          if (!partnerUser) {
            partnerUser = await User.create({
              name: trainerDoc.name,
              email: trainerDoc.email.toLowerCase(),
              password: 'TrainerPassword123!',
              role: 'trainer',
              profileImage: trainerDoc.profileImage || '',
            });
          }
          trainerDoc.user = partnerUser._id;
          await trainerDoc.save();
        }
      }
    }

    if (!partnerUser) {
      return res.status(404).json({
        success: false,
        message: 'Partner user or trainer could not be found',
      });
    }

    // Check if conversation already exists
    let conversation = await Conversation.findOne({
      participants: { $all: [userId, partnerUser._id] },
    })
      .populate('participants', '_id name email role profileImage')
      .populate('lastMessage');

    if (!conversation) {
      const unreadMap = new Map();
      unreadMap.set(userId.toString(), 0);
      unreadMap.set(partnerUser._id.toString(), 0);

      conversation = await Conversation.create({
        participants: [userId, partnerUser._id],
        unreadCounts: unreadMap,
        lastMessageAt: new Date(),
      });

      // Populate created conversation
      conversation = await Conversation.findById(conversation._id)
        .populate('participants', '_id name email role profileImage')
        .populate('lastMessage');
    }

    const partner = conversation.participants.find(
      (p) => p && p._id.toString() !== userId.toString()
    );

    const formattedConversation = {
      _id: conversation._id,
      partner: {
        _id: partner._id,
        name: partner.name,
        email: partner.email,
        role: partner.role,
        profileImage: partner.profileImage || '',
        isOnline: isUserOnline(partner._id),
      },
      lastMessage: conversation.lastMessage || null,
      lastMessageAt: conversation.lastMessageAt || conversation.createdAt,
      unreadCount: conversation.unreadCounts?.get
        ? conversation.unreadCounts.get(userId.toString()) || 0
        : 0,
      createdAt: conversation.createdAt,
      updatedAt: conversation.updatedAt,
    };

    return res.status(200).json({
      success: true,
      message: 'Conversation ready',
      data: {
        conversation: formattedConversation,
      },
    });
  } catch (error) {
    console.error('getOrCreateConversation error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to start or retrieve conversation',
      error: error.message,
    });
  }
};

/**
 * @desc    Get messages inside a conversation
 * @route   GET /api/v1/chat/conversations/:conversationId/messages
 * @access  Private
 */
const getMessages = async (req, res) => {
  try {
    const userId = req.user._id;
    const { conversationId } = req.params;

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found',
      });
    }

    const isParticipant = conversation.participants.some(
      (p) => p.toString() === userId.toString()
    );
    if (!isParticipant) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access messages in this conversation',
      });
    }

    const messages = await Message.find({ conversation: conversationId })
      .populate('sender', '_id name email role profileImage')
      .populate('recipient', '_id name email role profileImage')
      .sort({ createdAt: 1 });

    return res.status(200).json({
      success: true,
      data: {
        messages,
        total: messages.length,
      },
    });
  } catch (error) {
    console.error('getMessages error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve messages',
      error: error.message,
    });
  }
};

/**
 * @desc    Send a message in a conversation via REST
 * @route   POST /api/v1/chat/conversations/:conversationId/messages
 * @access  Private
 */
const sendMessage = async (req, res) => {
  try {
    const userId = req.user._id;
    const { conversationId } = req.params;
    const { content } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Message content is required',
      });
    }

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found',
      });
    }

    const isParticipant = conversation.participants.some(
      (p) => p.toString() === userId.toString()
    );
    if (!isParticipant) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to message this conversation',
      });
    }

    const recipientId = conversation.participants.find(
      (p) => p.toString() !== userId.toString()
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
    if (!conversation.unreadCounts) conversation.unreadCounts = new Map();
    const currentUnread = conversation.unreadCounts.get(recipientId.toString()) || 0;
    conversation.unreadCounts.set(recipientId.toString(), currentUnread + 1);
    await conversation.save();

    const populatedMessage = await Message.findById(message._id)
      .populate('sender', '_id name email role profileImage')
      .populate('recipient', '_id name email role profileImage');

    // Broadcast via Socket.IO if active
    const io = getIO();
    if (io) {
      io.to(`conversation_${conversationId}`).emit('new_message', populatedMessage);
      io.to(`user_${recipientId}`).emit('new_notification', {
        type: 'message',
        conversationId,
        senderName: req.user.name,
      });
    }

    return res.status(201).json({
      success: true,
      message: 'Message sent successfully',
      data: {
        message: populatedMessage,
      },
    });
  } catch (error) {
    console.error('sendMessage error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to send message',
      error: error.message,
    });
  }
};

/**
 * @desc    Mark conversation messages as read
 * @route   PATCH /api/v1/chat/conversations/:conversationId/read
 * @access  Private
 */
const markConversationRead = async (req, res) => {
  try {
    const userId = req.user._id;
    const { conversationId } = req.params;

    const readAt = new Date();
    const updateResult = await Message.updateMany(
      {
        conversation: conversationId,
        recipient: userId,
        isRead: false,
      },
      {
        $set: { isRead: true, readAt },
      }
    );

    const conversation = await Conversation.findById(conversationId);
    if (conversation && conversation.unreadCounts) {
      conversation.unreadCounts.set(userId.toString(), 0);
      await conversation.save();
    }

    const io = getIO();
    if (io) {
      io.to(`conversation_${conversationId}`).emit('messages_read', {
        conversationId,
        readBy: userId.toString(),
        readAt,
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Messages marked as read',
      data: {
        modifiedCount: updateResult.modifiedCount || 0,
        readAt: readAt.toISOString(),
      },
    });
  } catch (error) {
    console.error('markConversationRead error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to mark messages as read',
      error: error.message,
    });
  }
};

/**
 * Seed starter coaching conversation if none exist
 */
const seedDefaultChatIfEmpty = async () => {
  try {
    const existing = await Conversation.countDocuments();
    if (existing > 0) return;

    const memberUser = await User.findOne({ email: 'member@fitness.com' });
    const trainerUser = await User.findOne({ email: 'trainer@fitness.com' });

    if (!memberUser || !trainerUser) return;

    const unreadMap = new Map();
    unreadMap.set(memberUser._id.toString(), 0);
    unreadMap.set(trainerUser._id.toString(), 0);

    const conv = await Conversation.create({
      participants: [memberUser._id, trainerUser._id],
      unreadCounts: unreadMap,
      lastMessageAt: new Date(),
    });

    const msg1 = await Message.create({
      conversation: conv._id,
      sender: trainerUser._id,
      recipient: memberUser._id,
      content: 'Welcome to FitPlatform coaching! I reviewed your fitness goals and I am excited to help you achieve your targets. Let me know if you need adjustments to your weekly workout routine.',
      isRead: true,
      readAt: new Date(),
    });

    const msg2 = await Message.create({
      conversation: conv._id,
      sender: memberUser._id,
      recipient: trainerUser._id,
      content: 'Thank you coach! I just completed my first workout and logged my nutrition. Feeling motivated!',
      isRead: true,
      readAt: new Date(),
    });

    conv.lastMessage = msg2._id;
    conv.lastMessageAt = new Date();
    await conv.save();

    console.log('💬 [Coaching Chat] Initial conversation seeded between trainer and member.');
  } catch (err) {
    console.error('💬 [Coaching Chat] Seeding error:', err.message);
  }
};

module.exports = {
  getUnreadCount,
  getConversations,
  getOrCreateConversation,
  getMessages,
  sendMessage,
  markConversationRead,
  seedDefaultChatIfEmpty,
};
