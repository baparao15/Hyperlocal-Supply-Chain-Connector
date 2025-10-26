const express = require('express');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const Crop = require('../models/Crop');
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

// Get farmer's crops
router.get('/crops', verifyToken, async (req, res) => {
  try {
    const crops = await Crop.find({ farmerId: req.user.userId })
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: { crops }
    });
  } catch (error) {
    console.error('Get crops error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get crops',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Helper function to calculate weight per unit based on unit type
function getWeightPerUnit(unit) {
  const weightMap = {
    'kg': 1,      // 1 kg per unit
    'dozen': 0.12, // 12 pieces = 1.2 kg (avg 100g per piece)
    'piece': 0.1,  // Average 100g per piece
    'quintal': 100, // 1 quintal = 100 kg
    'ton': 1000,   // 1 ton = 1000 kg
    'bunch': 0.5,  // Average 500g per bunch
    'bag': 30      // Average 30 kg per bag
  };
  return weightMap[unit] || 1;
}

// Add new crop
router.post('/crops', verifyToken, [
  body('name').notEmpty().trim(),
  body('description').notEmpty().trim(),
  body('price').isNumeric().isFloat({ min: 0 }),
  body('unit').isIn(['kg', 'dozen', 'piece', 'quintal', 'ton', 'bunch', 'bag']),
  body('category').isIn(['vegetables', 'fruits', 'grains', 'spices', 'herbs', 'flowers', 'other']),
  body('quantity').isNumeric().isFloat({ min: 0 }),
  body('harvestDate').isISO8601(),
  body('location.coordinates').isArray({ min: 2, max: 2 }),
  body('location.address').notEmpty()
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

    const {
      name,
      description,
      price,
      unit,
      category,
      quantity,
      harvestDate,
      location,
      organic = false,
      quality = 'good',
      weightPerUnit
    } = req.body;

    // Use provided weight or calculate based on unit
    const cropWeightPerUnit = weightPerUnit || getWeightPerUnit(unit);

    const crop = new Crop({
      farmerId: req.user.userId,
      name,
      description,
      price,
      unit,
      category,
      quantity,
      availableQuantity: quantity,
      harvestDate: new Date(harvestDate),
      location,
      organic,
      quality,
      weightPerUnit: cropWeightPerUnit
    });

    await crop.save();

    res.status(201).json({
      success: true,
      message: 'Crop added successfully',
      data: { crop }
    });
  } catch (error) {
    console.error('Add crop error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add crop',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Update crop
router.put('/crops/:id', verifyToken, async (req, res) => {
  try {
    const crop = await Crop.findOne({ 
      _id: req.params.id, 
      farmerId: req.user.userId 
    });

    if (!crop) {
      return res.status(404).json({
        success: false,
        message: 'Crop not found'
      });
    }

    const updates = req.body;
    Object.keys(updates).forEach(key => {
      if (updates[key] !== undefined) {
        crop[key] = updates[key];
      }
    });

    await crop.save();

    res.json({
      success: true,
      message: 'Crop updated successfully',
      data: { crop }
    });
  } catch (error) {
    console.error('Update crop error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update crop',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Delete crop
router.delete('/crops/:id', verifyToken, async (req, res) => {
  try {
    const crop = await Crop.findOne({ 
      _id: req.params.id, 
      farmerId: req.user.userId 
    });

    if (!crop) {
      return res.status(404).json({
        success: false,
        message: 'Crop not found'
      });
    }

    await Crop.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Crop deleted successfully'
    });
  } catch (error) {
    console.error('Delete crop error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete crop',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Process voice order
router.post('/voice-order', verifyToken, [
  body('voiceText').notEmpty().trim(),
  body('location.coordinates').isArray({ min: 2, max: 2 }),
  body('location.address').notEmpty()
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

    const { voiceText, location } = req.body;

    // Simple voice text parsing (in production, use AI/NLP)
    const crops = parseVoiceOrder(voiceText);
    
    if (crops.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No crops found in voice input'
      });
    }

    // Create crops from voice input
    const createdCrops = [];
    for (const cropData of crops) {
      const crop = new Crop({
        farmerId: req.user.userId,
        ...cropData,
        location,
        status: 'available'
      });
      await crop.save();
      createdCrops.push(crop);
    }

    res.json({
      success: true,
      message: 'Voice order processed successfully',
      data: { crops: createdCrops }
    });
  } catch (error) {
    console.error('Voice order error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process voice order',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Get farmer's orders
router.get('/orders', verifyToken, async (req, res) => {
  try {
    const orders = await Order.find({ farmerId: req.user.userId })
      .populate('restaurantId', 'profile.name profile.location')
      .populate('transporterId', 'profile.name')
      .populate('crops.cropId', 'name images')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: { orders }
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

// Get farmer dashboard stats
router.get('/dashboard-stats', verifyToken, async (req, res) => {
  try {
    const farmerId = req.user.userId;
    
    const [
      totalCrops,
      availableCrops,
      totalOrders,
      pendingOrders,
      totalEarnings,
      monthlyEarnings
    ] = await Promise.all([
      Crop.countDocuments({ farmerId }),
      Crop.countDocuments({ farmerId, status: 'available' }),
      Order.countDocuments({ farmerId }),
      Order.countDocuments({ farmerId, status: { $in: ['pending', 'confirmed'] } }),
      Order.aggregate([
        { $match: { farmerId: farmerId, paymentStatus: 'paid' } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } }
      ]),
      Order.aggregate([
        { 
          $match: { 
            farmerId: farmerId, 
            paymentStatus: 'paid',
            createdAt: { $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) }
          } 
        },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } }
      ])
    ]);

    res.json({
      success: true,
      data: {
        totalCrops,
        availableCrops,
        totalOrders,
        pendingOrders,
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

// Helper function to parse voice order (simplified)
function parseVoiceOrder(voiceText) {
  const crops = [];
  const text = voiceText.toLowerCase();
  
  // Simple keyword matching (in production, use AI/NLP)
  const cropKeywords = {
    'tomato': { name: 'Tomato', category: 'vegetables', unit: 'kg' },
    'onion': { name: 'Onion', category: 'vegetables', unit: 'kg' },
    'potato': { name: 'Potato', category: 'vegetables', unit: 'kg' },
    'rice': { name: 'Rice', category: 'grains', unit: 'kg' },
    'wheat': { name: 'Wheat', category: 'grains', unit: 'kg' },
    'mango': { name: 'Mango', category: 'fruits', unit: 'dozen' },
    'banana': { name: 'Banana', category: 'fruits', unit: 'bunch' }
  };

  Object.keys(cropKeywords).forEach(keyword => {
    if (text.includes(keyword)) {
      const quantity = extractQuantity(text) || 10;
      const price = extractPrice(text) || 50;
      
      crops.push({
        ...cropKeywords[keyword],
        description: `Fresh ${cropKeywords[keyword].name} from farm`,
        price,
        quantity,
        availableQuantity: quantity,
        harvestDate: new Date(),
        organic: text.includes('organic'),
        quality: text.includes('premium') ? 'premium' : 'good'
      });
    }
  });

  return crops;
}

function extractQuantity(text) {
  const match = text.match(/(\d+)\s*(kg|dozen|piece|quintal|ton|bunch|bag)/);
  return match ? parseInt(match[1]) : null;
}

function extractPrice(text) {
  const match = text.match(/₹?(\d+)/);
  return match ? parseInt(match[1]) : null;
}

// Voice-based crop listing
router.post('/crops/voice', verifyToken, [
  body('voiceText').notEmpty().trim(),
  body('language').isIn(['en', 'te']).optional(),
  body('location.coordinates').isArray({ min: 2, max: 2 }),
  body('location.address').notEmpty()
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

    const { voiceText, language = 'en', location } = req.body;

    // Parse voice input directly using the voice processing function
    const voiceModule = require('./voice');
    const parsedOrder = await voiceModule.parseVoiceOrderWithAI(voiceText, language);
    const createdCrops = [];

    // Create crops from parsed voice data
    for (const cropData of parsedOrder.crops) {
      const crop = new Crop({
        farmerId: req.user.userId,
        name: cropData.name,
        description: cropData.description,
        price: cropData.price,
        unit: cropData.unit,
        category: cropData.category,
        quantity: cropData.quantity,
        availableQuantity: cropData.availableQuantity,
        harvestDate: cropData.harvestDate,
        location,
        organic: cropData.organic,
        quality: cropData.quality,
        weightPerUnit: cropData.weightPerUnit
      });

      await crop.save();
      createdCrops.push(crop);
    }

    res.status(201).json({
      success: true,
      message: `Successfully added ${createdCrops.length} crops via voice input`,
      data: { 
        crops: createdCrops,
        originalText: voiceText,
        totalValue: parsedOrder.totalValue
      }
    });

  } catch (error) {
    console.error('Voice crop listing error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process voice crop listing',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Get farmer's orders
router.get('/orders', verifyToken, async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    
    let query = { farmerId: req.user.userId };
    if (status) {
      query.status = status;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const orders = await Order.find(query)
      .populate('restaurantId', 'profile.name profile.location')
      .populate('transporterId', 'profile.name')
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
    console.error('Get farmer orders error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get orders',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Confirm order
router.post('/orders/:orderId/confirm', verifyToken, async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findOne({
      _id: orderId,
      farmerId: req.user.userId,
      status: 'pending'
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found or already processed'
      });
    }

    // Update order status
    order.status = 'confirmed';
    await order.save();

    // Send notification to restaurant
    const notificationService = require('../services/notificationService');
    await notificationService.notifyRestaurantOrderConfirmed(orderId);

    // Notify available transporters about new delivery opportunity
    const transporters = await User.find({ 
      userType: 'transporter',
      isVerified: true 
    }).select('email');

    for (const transporter of transporters) {
      await notificationService.notifyTransporterNewDelivery(orderId, transporter.email);
    }

    res.json({
      success: true,
      message: 'Order confirmed successfully',
      data: { order }
    });
  } catch (error) {
    console.error('Confirm order error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to confirm order',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Cancel order
router.post('/orders/:orderId/cancel', verifyToken, [
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

    const { orderId } = req.params;
    const { reason } = req.body;

    const order = await Order.findOne({
      _id: orderId,
      farmerId: req.user.userId,
      status: { $in: ['pending', 'confirmed'] }
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found or cannot be cancelled'
      });
    }

    // Update order status
    order.status = 'cancelled';
    order.notes = `Cancelled by farmer: ${reason}`;
    await order.save();

    // Restore crop quantities
    for (const cropOrder of order.crops) {
      await Crop.findByIdAndUpdate(cropOrder.cropId, {
        $inc: { availableQuantity: cropOrder.quantity },
        status: 'available'
      });
    }

    res.json({
      success: true,
      message: 'Order cancelled successfully',
      data: { order }
    });
  } catch (error) {
    console.error('Cancel order error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel order',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Get farmer dashboard stats
router.get('/dashboard', verifyToken, async (req, res) => {
  try {
    const farmerId = req.user.userId;

    // Get crop statistics
    const totalCrops = await Crop.countDocuments({ farmerId });
    const availableCrops = await Crop.countDocuments({ farmerId, status: 'available' });
    const soldCrops = await Crop.countDocuments({ farmerId, status: 'sold' });

    // Get order statistics
    const totalOrders = await Order.countDocuments({ farmerId });
    const pendingOrders = await Order.countDocuments({ farmerId, status: 'pending' });
    const confirmedOrders = await Order.countDocuments({ farmerId, status: 'confirmed' });
    const deliveredOrders = await Order.countDocuments({ farmerId, status: 'delivered' });

    // Calculate earnings
    const earningsResult = await Order.aggregate([
      { $match: { farmerId: new mongoose.Types.ObjectId(farmerId), paymentStatus: 'paid' } },
      { $group: { _id: null, totalEarnings: { $sum: '$totalAmount' } } }
    ]);
    const totalEarnings = earningsResult[0]?.totalEarnings || 0;

    // Get recent orders
    const recentOrders = await Order.find({ farmerId })
      .populate('restaurantId', 'profile.name')
      .populate('crops.cropId', 'name')
      .sort({ createdAt: -1 })
      .limit(5);

    const stats = {
      crops: {
        total: totalCrops,
        available: availableCrops,
        sold: soldCrops
      },
      orders: {
        total: totalOrders,
        pending: pendingOrders,
        confirmed: confirmedOrders,
        delivered: deliveredOrders
      },
      earnings: {
        total: totalEarnings,
        currency: 'INR'
      },
      recentOrders
    };

    res.json({
      success: true,
      data: { stats }
    });
  } catch (error) {
    console.error('Get farmer dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get dashboard data',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

module.exports = router;
