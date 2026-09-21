const Membership = require('../models/Membership');
const Member = require('../models/Member');
const Payment = require('../models/Payment');

/**
 * @desc    Get all memberships
 * @route   GET /api/memberships
 * @access  Public / Private
 */
const getMemberships = async (req, res) => {
  try {
    const memberships = await Membership.find().sort({ price: 1 });

    return res.status(200).json({
      success: true,
      count: memberships.length,
      data: memberships,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Error fetching memberships',
    });
  }
};

/**
 * @desc    Get single membership by ID
 * @route   GET /api/memberships/:id
 * @access  Public / Private
 */
const getMembershipById = async (req, res) => {
  try {
    const membership = await Membership.findById(req.params.id);

    if (!membership) {
      return res.status(404).json({
        success: false,
        message: 'Membership plan not found',
      });
    }

    return res.status(200).json({
      success: true,
      data: membership,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Error fetching membership',
    });
  }
};

/**
 * @desc    Create a new membership plan
 * @route   POST /api/memberships
 * @access  Private/Admin
 */
const createMembership = async (req, res) => {
  try {
    const { name, description, price, duration, features, status } = req.body;

    if (!name || price === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Name and price are required',
      });
    }

    const membership = await Membership.create({
      name,
      description: description || '',
      price,
      duration: duration || 30,
      features: features || [],
      status: status || 'Active',
    });

    return res.status(201).json({
      success: true,
      message: 'Membership plan created successfully',
      data: membership,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Error creating membership',
    });
  }
};

/**
 * @desc    Update a membership plan
 * @route   PUT /api/memberships/:id
 * @access  Private/Admin
 */
const updateMembership = async (req, res) => {
  try {
    const membership = await Membership.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!membership) {
      return res.status(404).json({
        success: false,
        message: 'Membership plan not found',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Membership plan updated successfully',
      data: membership,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Error updating membership',
    });
  }
};

/**
 * @desc    Delete a membership plan
 * @route   DELETE /api/memberships/:id
 * @access  Private/Admin
 */
const deleteMembership = async (req, res) => {
  try {
    const membership = await Membership.findByIdAndDelete(req.params.id);

    if (!membership) {
      return res.status(404).json({
        success: false,
        message: 'Membership plan not found',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Membership plan deleted successfully',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Error deleting membership',
    });
  }
};

/**
 * @desc    Subscribe member to a membership plan
 * @route   POST /api/memberships/subscribe
 * @access  Private
 */
const subscribeMembership = async (req, res) => {
  try {
    const { membershipId, memberId, paymentMethod } = req.body;

    let targetMemberId = memberId;

    if (!targetMemberId && req.user) {
      const member = await Member.findOne({
        $or: [{ user: req.user._id }, { email: req.user.email }],
      });
      if (member) targetMemberId = member._id;
    }

    if (!targetMemberId || !membershipId) {
      return res.status(400).json({
        success: false,
        message: 'Member ID and Membership ID are required',
      });
    }

    const membership = await Membership.findById(membershipId);
    if (!membership) {
      return res.status(404).json({
        success: false,
        message: 'Membership plan not found',
      });
    }

    const member = await Member.findById(targetMemberId);
    if (!member) {
      return res.status(404).json({
        success: false,
        message: 'Member not found',
      });
    }

    const startDate = new Date();
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + (membership.duration || 30));

    member.membership = membership._id;
    member.membershipStartDate = startDate;
    member.membershipEndDate = endDate;
    await member.save();

    // Create Payment record
    const payment = await Payment.create({
      member: member._id,
      membership: membership._id,
      amount: membership.price,
      paymentMethod: paymentMethod || 'Online',
      paymentStatus: 'Completed',
      paymentDate: startDate,
    });

    const populatedMember = await Member.findById(member._id).populate('membership');

    return res.status(200).json({
      success: true,
      message: `Successfully subscribed to ${membership.name} plan!`,
      data: {
        member: populatedMember,
        payment,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Error subscribing to membership',
    });
  }
};

module.exports = {
  getMemberships,
  getMembershipById,
  createMembership,
  updateMembership,
  deleteMembership,
  subscribeMembership,
};
