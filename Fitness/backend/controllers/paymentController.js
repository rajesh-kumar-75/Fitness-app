const Payment = require('../models/Payment');
const Member = require('../models/Member');

/**
 * @desc    Create a payment record
 * @route   POST /api/payments
 * @access  Private
 */
const createPayment = async (req, res) => {
  try {
    const { memberId, membershipId, amount, paymentMethod, transactionId } = req.body;

    if (!memberId || !membershipId || amount === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Member ID, Membership ID, and amount are required',
      });
    }

    const payment = await Payment.create({
      member: memberId,
      membership: membershipId,
      amount,
      paymentMethod: paymentMethod || 'Online',
      transactionId: transactionId || 'TXN-' + Date.now(),
      paymentStatus: 'Completed',
    });

    const populated = await Payment.findById(payment._id)
      .populate('member', 'name email phone')
      .populate('membership', 'name price duration');

    return res.status(201).json({
      success: true,
      message: 'Payment created successfully',
      data: populated,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Error processing payment',
    });
  }
};

/**
 * @desc    Get all payments
 * @route   GET /api/payments
 * @access  Private/Admin
 */
const getPayments = async (req, res) => {
  try {
    const payments = await Payment.find()
      .populate('member', 'name email phone')
      .populate('membership', 'name price')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: payments.length,
      data: payments,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Error fetching payments',
    });
  }
};

/**
 * @desc    Get single payment by ID
 * @route   GET /api/payments/:id
 * @access  Private
 */
const getPaymentById = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id)
      .populate('member', 'name email phone')
      .populate('membership', 'name price duration');

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found',
      });
    }

    return res.status(200).json({
      success: true,
      data: payment,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Error fetching payment',
    });
  }
};

/**
 * @desc    Get payments for a specific member
 * @route   GET /api/payments/member/:memberId
 * @access  Private
 */
const getMemberPayments = async (req, res) => {
  try {
    const payments = await Payment.find({ member: req.params.memberId })
      .populate('membership', 'name price duration')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: payments.length,
      data: payments,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Error fetching member payments',
    });
  }
};

/**
 * @desc    Update payment status
 * @route   PUT /api/payments/:id/status
 * @access  Private/Admin
 */
const updatePaymentStatus = async (req, res) => {
  try {
    const { paymentStatus } = req.body;

    if (!['Pending', 'Completed', 'Failed', 'Refunded'].includes(paymentStatus)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payment status',
      });
    }

    const payment = await Payment.findByIdAndUpdate(
      req.params.id,
      { paymentStatus },
      { new: true }
    )
      .populate('member', 'name email')
      .populate('membership', 'name price');

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Payment status updated successfully',
      data: payment,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Error updating payment status',
    });
  }
};

module.exports = {
  createPayment,
  getPayments,
  getPaymentById,
  getMemberPayments,
  updatePaymentStatus,
};
