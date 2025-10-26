const express = require('express');
const jwt = require('jsonwebtoken');
const Order = require('../models/Order');
const User = require('../models/User');
const { body, validationResult } = require('express-validator');

const router = express.Router();

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

// Get available delivery jobs
router.get('/available-orders', verifyToken, async (req, res) => {
  try {
    const { latitude, longitude, maxDistance = 50 } = req.query;
    
    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        message: 'Latitude and longitude are required'
      });
    }

    // Find orders that need transporters (confirmed but no transporter assigned)
    const orders = await Order.find({
      status: 'confirmed',
      transporterId: null,
      'pickupLocation.coordinates': {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(longitude), parseFloat(latitude)]
          },
          $maxDistance: maxDistance * 1000 // Convert km to meters
        }
      }
    })
    .populate('farmerId', 'profile.name profile.location')
    .populate('restaurantId', 'profile.name profile.location')
    .populate('crops.cropId', 'name images')
    .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: { orders }
    });
  } catch (error) {
    console.error('Get available orders error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get available orders',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Accept delivery job
router.post('/accept-order', verifyToken, [
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

    const order = await Order.findOne({
      _id: orderId,
      status: 'confirmed',
      transporterId: null
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not available or already assigned'
      });
    }

    // Assign transporter to order
    order.transporterId = req.user.userId;
    // Status should remain 'confirmed' until actually picked up
    await order.save();

    res.json({
      success: true,
      message: 'Order accepted successfully',
      data: { order }
    });
  } catch (error) {
    console.error('Accept order error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to accept order',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Get transporter's orders
router.get('/orders', verifyToken, async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    
    let query = { transporterId: req.user.userId };
    if (status) {
      query.status = status;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const orders = await Order.find(query)
      .populate('farmerId', 'profile.name profile.location')
      .populate('restaurantId', 'profile.name profile.location')
      .populate('crops.cropId', 'name images')
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
    console.error('Get orders error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get orders',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Mark order as picked up
router.post('/mark-picked-up', verifyToken, [
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

    const order = await Order.findOne({
      _id: orderId,
      transporterId: req.user.userId,
      status: 'confirmed'
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found or not in correct status'
      });
    }

    // Update order status to picked up
    order.status = 'picked_up';
    await order.save();

    // Send notification
    const notificationService = require('../services/notificationService');
    await notificationService.notifyOrderPickedUp(orderId);

    res.json({
      success: true,
      message: 'Order marked as picked up',
      data: { order }
    });
  } catch (error) {
    console.error('Mark picked up error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark order as picked up',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Mark order as in transit
router.post('/mark-in-transit', verifyToken, [
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

    const order = await Order.findOne({
      _id: orderId,
      transporterId: req.user.userId,
      status: 'picked_up'
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found or not in correct status'
      });
    }

    // Update order status to in transit
    order.status = 'in_transit';
    await order.save();

    res.json({
      success: true,
      message: 'Order marked as in transit',
      data: { order }
    });
  } catch (error) {
    console.error('Mark in transit error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark order as in transit',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Verify crop quality during pickup
router.post('/verify-quality', verifyToken, [
  body('orderId').isMongoId(),
  body('qualityScore').isNumeric().isFloat({ min: 1, max: 5 }),
  body('notes').optional().isString()
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

    const { orderId, qualityScore, notes = '' } = req.body;

    const order = await Order.findOne({
      _id: orderId,
      transporterId: req.user.userId,
      status: 'picked_up'
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found or not in correct status'
      });
    }

    // Update order with quality verification
    order.qualityVerification = {
      score: qualityScore,
      notes,
      verifiedBy: req.user.userId,
      verifiedAt: new Date()
    };

    await order.save();

    res.json({
      success: true,
      message: 'Quality verification completed',
      data: { order }
    });
  } catch (error) {
    console.error('Verify quality error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify quality',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Mark order as delivered
router.post('/mark-delivered', verifyToken, [
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

    const order = await Order.findOne({
      _id: orderId,
      transporterId: req.user.userId,
      status: 'picked_up'
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found or not in correct status'
      });
    }

    // Update order status
    order.status = 'delivered';
    order.actualDeliveryTime = new Date();
    await order.save();

    // Update farmer and restaurant order counts
    await User.findByIdAndUpdate(order.farmerId, { $inc: { totalOrders: 1 } });
    await User.findByIdAndUpdate(order.restaurantId, { $inc: { totalOrders: 1 } });
    await User.findByIdAndUpdate(order.transporterId, { $inc: { totalOrders: 1 } });

    // Send delivery notifications
    const notificationService = require('../services/notificationService');
    await notificationService.notifyOrderDelivered(orderId);

    res.json({
      success: true,
      message: 'Order marked as delivered',
      data: { order }
    });
  } catch (error) {
    console.error('Mark delivered error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark order as delivered',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Raise quality complaint
router.post('/complaints', verifyToken, [
  body('orderId').isMongoId(),
  body('description').notEmpty().trim()
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

    const { orderId, description } = req.body;

    const order = await Order.findOne({
      _id: orderId,
      transporterId: req.user.userId
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    order.complaints.push({
      raisedBy: req.user.userId,
      description,
      status: 'open'
    });

    await order.save();

    res.json({
      success: true,
      message: 'Complaint raised successfully',
      data: { complaint: order.complaints[order.complaints.length - 1] }
    });
  } catch (error) {
    console.error('Raise complaint error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to raise complaint',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Get transporter earnings
router.get('/earnings', verifyToken, async (req, res) => {
  try {
    const { period = 'all' } = req.query;
    
    let dateFilter = {};
    if (period === 'month') {
      dateFilter = {
        createdAt: { $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) }
      };
    } else if (period === 'week') {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      dateFilter = { createdAt: { $gte: weekAgo } };
    }

    const earnings = await Order.aggregate([
      {
        $match: {
          transporterId: req.user.userId,
          status: 'delivered',
          paymentStatus: 'paid',
          ...dateFilter
        }
      },
      {
        $group: {
          _id: null,
          totalEarnings: { $sum: '$deliveryFee' },
          totalOrders: { $sum: 1 },
          averageEarnings: { $avg: '$deliveryFee' }
        }
      }
    ]);

    const monthlyEarnings = await Order.aggregate([
      {
        $match: {
          transporterId: req.user.userId,
          status: 'delivered',
          paymentStatus: 'paid',
          createdAt: { $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) }
        }
      },
      {
        $group: {
          _id: { $month: '$createdAt' },
          earnings: { $sum: '$deliveryFee' },
          orders: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json({
      success: true,
      data: {
        totalEarnings: earnings[0]?.totalEarnings || 0,
        totalOrders: earnings[0]?.totalOrders || 0,
        averageEarnings: earnings[0]?.averageEarnings || 0,
        monthlyEarnings
      }
    });
  } catch (error) {
    console.error('Get earnings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get earnings',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Get transporter dashboard stats
router.get('/dashboard-stats', verifyToken, async (req, res) => {
  try {
    const transporterId = req.user.userId;
    
    const [
      totalOrders,
      pendingOrders,
      completedOrders,
      totalEarnings,
      monthlyEarnings
    ] = await Promise.all([
      Order.countDocuments({ transporterId }),
      Order.countDocuments({ transporterId, status: { $in: ['picked_up'] } }),
      Order.countDocuments({ transporterId, status: 'delivered' }),
      Order.aggregate([
        { $match: { transporterId: transporterId, status: 'delivered', paymentStatus: 'paid' } },
        { $group: { _id: null, total: { $sum: '$deliveryFee' } } }
      ]),
      Order.aggregate([
        { 
          $match: { 
            transporterId: transporterId, 
            status: 'delivered',
            paymentStatus: 'paid',
            createdAt: { $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) }
          } 
        },
        { $group: { _id: null, total: { $sum: '$deliveryFee' } } }
      ])
    ]);

    res.json({
      success: true,
      data: {
        totalOrders,
        pendingOrders,
        completedOrders,
        totalEarnings: totalEarnings[0]?.total || 0,
        monthlyEarnings: monthlyEarnings[0]?.total || 0
      }
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get dashboard stats',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

module.exports = router;
