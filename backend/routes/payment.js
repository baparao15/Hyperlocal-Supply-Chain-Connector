const express = require('express');
const jwt = require('jsonwebtoken');
const Razorpay = require('razorpay');
const Order = require('../models/Order');
const User = require('../models/User');
const { body, validationResult } = require('express-validator');

const router = express.Router();

// Initialize Razorpay (optional for development)
let razorpay = null;
if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
  razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
  console.log('✅ Razorpay initialized');
} else {
  console.log('⚠️  Razorpay not configured - payment features disabled');
}

// Middleware to verify JWT token
const verifyToken = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access denied. No token provided.'
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Invalid token.'
    });
  }
};

// Calculate payment splits
router.post('/calculate', verifyToken, [
  body('orderId').isMongoId()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { orderId } = req.body;

    const order = await Order.findById(orderId)
      .populate('farmerId', 'profile.bankDetails')
      .populate('transporterId', 'profile.bankDetails');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Calculate payment splits
    const paymentSplits = {
      farmer: {
        amount: order.totalAmount,
        accountNumber: order.farmerId.profile.bankDetails.accountNumber,
        ifscCode: order.farmerId.profile.bankDetails.ifscCode,
        accountHolderName: order.farmerId.profile.bankDetails.accountHolderName
      },
      transporter: {
        amount: order.deliveryFee,
        accountNumber: order.transporterId?.profile.bankDetails.accountNumber || '',
        ifscCode: order.transporterId?.profile.bankDetails.ifscCode || '',
        accountHolderName: order.transporterId?.profile.bankDetails.accountHolderName || ''
      },
      restaurant: {
        totalAmount: order.totalAmount + order.restaurantDeliveryShare,
        farmerAmount: order.totalAmount,
        deliveryShare: order.restaurantDeliveryShare
      }
    };

    res.json({
      success: true,
      data: { paymentSplits }
    });
  } catch (error) {
    console.error('Calculate payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to calculate payment',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Create payment order
router.post('/create-order', verifyToken, [
  body('orderId').isMongoId(),
  body('amount').isNumeric().isFloat({ min: 1 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { orderId, amount } = req.body;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Check if Razorpay is configured
    if (!razorpay) {
      return res.status(503).json({
        success: false,
        message: 'Payment gateway not configured. Please contact administrator.'
      });
    }

    // Create Razorpay order
    const options = {
      amount: amount * 100, // Convert to paise
      currency: 'INR',
      receipt: `order_${orderId}_${Date.now()}`,
      notes: {
        orderId: orderId,
        userId: req.user.userId,
        userType: req.user.userType
      }
    };

    const razorpayOrder = await razorpay.orders.create(options);

    res.json({
      success: true,
      data: {
        razorpayOrderId: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        receipt: razorpayOrder.receipt
      }
    });
  } catch (error) {
    console.error('Create payment order error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create payment order',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Verify payment
router.post('/verify', verifyToken, [
  body('razorpayOrderId').notEmpty(),
  body('razorpayPaymentId').notEmpty(),
  body('razorpaySignature').notEmpty(),
  body('orderId').isMongoId()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { razorpayOrderId, razorpayPaymentId, razorpaySignature, orderId } = req.body;

    // Check if Razorpay is configured
    if (!razorpay || !process.env.RAZORPAY_KEY_SECRET) {
      return res.status(503).json({
        success: false,
        message: 'Payment gateway not configured. Cannot verify payments.'
      });
    }

    // Verify payment signature
    const crypto = require('crypto');
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpayOrderId}|${razorpayPaymentId}`)
      .digest('hex');

    if (expectedSignature !== razorpaySignature) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payment signature'
      });
    }

    // Update order payment status
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    order.paymentStatus = 'paid';
    order.paymentDetails = {
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
      paidAt: new Date()
    };

    await order.save();

    // Process split payments
    await processSplitPayments(order);

    res.json({
      success: true,
      message: 'Payment verified successfully',
      data: { order }
    });
  } catch (error) {
    console.error('Verify payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify payment',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Process split payments to farmers and transporters
async function processSplitPayments(order) {
  try {
    // In a real implementation, you would use Razorpay's Payouts API
    // or integrate with UPI/bank APIs to transfer money directly
    
    // For now, we'll just log the payment details
    console.log('Processing split payments for order:', order._id);
    console.log('Farmer amount:', order.totalAmount);
    console.log('Transporter amount:', order.deliveryFee);
    console.log('Restaurant total:', order.totalAmount + order.restaurantDeliveryShare);
    
    // Update order status
    order.status = 'confirmed';
    await order.save();
    
    // In production, implement actual bank transfers here
    // This would involve:
    // 1. Transfer order.totalAmount to farmer's account
    // 2. Transfer order.deliveryFee to transporter's account
    // 3. Send payment confirmation notifications
    
  } catch (error) {
    console.error('Split payment processing error:', error);
    throw error;
  }
}

// Get payment history
router.get('/history', verifyToken, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    let query = {};
    
    // Filter by user type
    if (req.user.userType === 'farmer') {
      query.farmerId = req.user.userId;
    } else if (req.user.userType === 'restaurant') {
      query.restaurantId = req.user.userId;
    } else if (req.user.userType === 'transporter') {
      query.transporterId = req.user.userId;
    }

    const orders = await Order.find(query)
      .populate('farmerId', 'profile.name')
      .populate('restaurantId', 'profile.name')
      .populate('transporterId', 'profile.name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const totalOrders = await Order.countDocuments(query);

    res.json({
      success: true,
      data: {
        orders,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalOrders / parseInt(limit)),
          totalOrders,
          hasNext: skip + orders.length < totalOrders,
          hasPrev: parseInt(page) > 1
        }
      }
    });
  } catch (error) {
    console.error('Get payment history error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get payment history',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Refund payment
router.post('/refund', verifyToken, [
  body('orderId').isMongoId(),
  body('amount').isNumeric().isFloat({ min: 1 }).optional(),
  body('reason').notEmpty().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { orderId, amount, reason } = req.body;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    if (order.paymentStatus !== 'paid') {
      return res.status(400).json({
        success: false,
        message: 'Order is not paid'
      });
    }

    // Check if Razorpay is configured
    if (!razorpay) {
      return res.status(503).json({
        success: false,
        message: 'Payment gateway not configured. Refunds not available.'
      });
    }

    // Create refund
    const refundAmount = amount || (order.totalAmount + order.restaurantDeliveryShare);
    const refund = await razorpay.payments.refund(order.paymentDetails.razorpayPaymentId, {
      amount: refundAmount * 100, // Convert to paise
      notes: {
        reason: reason,
        orderId: orderId
      }
    });

    // Update order status
    order.paymentStatus = 'refunded';
    order.refundDetails = {
      refundId: refund.id,
      amount: refundAmount,
      reason: reason,
      refundedAt: new Date()
    };

    await order.save();

    res.json({
      success: true,
      message: 'Refund processed successfully',
      data: { refund }
    });
  } catch (error) {
    console.error('Refund error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process refund',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Settle payment - transfer money to farmer and transporter
router.post('/settle', verifyToken, [
  body('orderId').isMongoId(),
  body('razorpayPaymentId').notEmpty()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { orderId, razorpayPaymentId } = req.body;

    const order = await Order.findById(orderId)
      .populate('farmerId', 'profile.bankDetails email profile.name')
      .populate('transporterId', 'profile.bankDetails email profile.name');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    if (order.restaurantId.toString() !== req.user.userId) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized to settle this order'
      });
    }

    if (order.paymentStatus === 'paid') {
      return res.status(400).json({
        success: false,
        message: 'Order already settled'
      });
    }

    // Update payment details
    order.paymentDetails = {
      razorpayPaymentId,
      farmerTransferStatus: 'processing',
      transporterTransferStatus: order.transporterId ? 'processing' : 'completed',
      settledAt: new Date()
    };
    order.paymentStatus = 'paid';

    await order.save();

    // Simulate money transfer (in real implementation, integrate with banking APIs)
    // For now, we'll mark transfers as completed after a delay
    setTimeout(async () => {
      try {
        // Update transfer status to completed
        await Order.findByIdAndUpdate(orderId, {
          'paymentDetails.farmerTransferStatus': 'completed',
          'paymentDetails.transporterTransferStatus': 'completed'
        });

        // Send notification emails
        const notificationService = require('../services/notificationService');
        await notificationService.notifyPaymentSettled(orderId);
      } catch (error) {
        console.error('Error completing transfers:', error);
      }
    }, 2000); // 2 second delay to simulate processing

    res.json({
      success: true,
      message: 'Payment settlement initiated successfully',
      data: {
        order,
        transfers: {
          farmer: {
            amount: order.totalAmount,
            status: 'processing',
            account: `***${order.farmerId.profile.bankDetails.accountNumber.slice(-4)}`
          },
          transporter: order.transporterId ? {
            amount: order.deliveryFee,
            status: 'processing',
            account: `***${order.transporterId.profile.bankDetails.accountNumber.slice(-4)}`
          } : null
        }
      }
    });

  } catch (error) {
    console.error('Payment settlement error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to settle payment',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Get payment status
router.get('/status/:orderId', verifyToken, async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findById(orderId)
      .populate('farmerId', 'profile.name profile.bankDetails')
      .populate('transporterId', 'profile.name profile.bankDetails')
      .populate('restaurantId', 'profile.name');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Check if user has access to this order
    const userId = req.user.userId;
    const hasAccess = order.farmerId._id.toString() === userId ||
                     order.restaurantId._id.toString() === userId ||
                     (order.transporterId && order.transporterId._id.toString() === userId);

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized to view this payment status'
      });
    }

    const paymentStatus = {
      orderId: order._id,
      status: order.paymentStatus,
      totalAmount: order.totalAmount + order.restaurantDeliveryShare,
      breakdown: {
        farmerAmount: order.totalAmount,
        deliveryFee: order.deliveryFee,
        restaurantDeliveryShare: order.restaurantDeliveryShare
      },
      transfers: {
        farmer: {
          amount: order.totalAmount,
          status: order.paymentDetails?.farmerTransferStatus || 'pending',
          recipient: order.farmerId.profile.name
        },
        transporter: order.transporterId ? {
          amount: order.deliveryFee,
          status: order.paymentDetails?.transporterTransferStatus || 'pending',
          recipient: order.transporterId.profile.name
        } : null
      },
      settledAt: order.paymentDetails?.settledAt || null
    };

    res.json({
      success: true,
      data: { paymentStatus }
    });

  } catch (error) {
    console.error('Get payment status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get payment status',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

module.exports = router;
