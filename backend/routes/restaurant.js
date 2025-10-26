const express = require('express');
const jwt = require('jsonwebtoken');
const Crop = require('../models/Crop');
const Order = require('../models/Order');
const User = require('../models/User');
const geolib = require('geolib');
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

// Find nearby farmers (within 30-40km radius)
router.get('/nearby-farmers', verifyToken, async (req, res) => {
  try {
    const { latitude, longitude, maxDistance = 40 } = req.query;
    
    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        message: 'Latitude and longitude are required'
      });
    }

    const farmers = await User.find({
      userType: 'farmer',
      'profile.location.coordinates': {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(longitude), parseFloat(latitude)]
          },
          $maxDistance: maxDistance * 1000 // Convert km to meters
        }
      }
    }).select('profile.name profile.location rating totalOrders');

    res.json({
      success: true,
      data: { farmers }
    });
  } catch (error) {
    console.error('Get nearby farmers error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get nearby farmers',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Browse available crops with filters
router.get('/crops', verifyToken, async (req, res) => {
  try {
    const { 
      latitude, 
      longitude, 
      maxDistance = 40, 
      category, 
      minPrice, 
      maxPrice, 
      organic,
      quality,
      page = 1,
      limit = 20
    } = req.query;

    let query = { status: 'available' };

    // Add category filter
    if (category) {
      query.category = category;
    }

    // Add price range filter
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = parseFloat(minPrice);
      if (maxPrice) query.price.$lte = parseFloat(maxPrice);
    }

    // Add organic filter
    if (organic !== undefined) {
      query.organic = organic === 'true';
    }

    // Add quality filter
    if (quality) {
      query.quality = quality;
    }

    // Add location filter
    if (latitude && longitude) {
      query['location.coordinates'] = {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(longitude), parseFloat(latitude)]
          },
          $maxDistance: maxDistance * 1000
        }
      };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const crops = await Crop.find(query)
      .populate('farmerId', 'profile.name profile.location rating')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const totalCrops = await Crop.countDocuments(query);

    res.json({
      success: true,
      data: { 
        crops,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalCrops / parseInt(limit)),
          totalCrops,
          hasNext: skip + crops.length < totalCrops,
          hasPrev: parseInt(page) > 1
        }
      }
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

// Place order
router.post('/orders', verifyToken, [
  body('crops').isArray({ min: 1 }),
  body('crops.*.cropId').isMongoId(),
  body('crops.*.quantity').isNumeric().isFloat({ min: 1 }),
  body('deliveryLocation.coordinates').isArray({ min: 2, max: 2 }),
  body('deliveryLocation.address').notEmpty()
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

    const { crops, deliveryLocation, notes = '' } = req.body;

    // Validate crops and calculate total amount
    let totalAmount = 0;
    const validatedCrops = [];

    for (const cropOrder of crops) {
      const crop = await Crop.findById(cropOrder.cropId);
      if (!crop) {
        return res.status(404).json({
          success: false,
          message: `Crop with ID ${cropOrder.cropId} not found`
        });
      }

      if (crop.status !== 'available') {
        return res.status(400).json({
          success: false,
          message: `Crop ${crop.name} is not available`
        });
      }

      if (crop.availableQuantity < cropOrder.quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient quantity for ${crop.name}. Available: ${crop.availableQuantity}`
        });
      }

      const cropTotal = crop.price * cropOrder.quantity;
      totalAmount += cropTotal;

      validatedCrops.push({
        cropId: crop._id,
        quantity: cropOrder.quantity,
        price: crop.price,
        unit: crop.unit,
        weight: crop.weightPerUnit || 0 // Include weight per unit in kg
      });
    }

    // Calculate total weight for delivery fee
    let totalWeight = 0;
    for (const cropData of validatedCrops) {
      totalWeight += (cropData.weight || 0) * cropData.quantity;
    }

    // Get farmer location from first crop
    const firstCrop = await Crop.findById(validatedCrops[0].cropId).populate('farmerId');
    const farmer = firstCrop.farmerId;
    const farmerLocation = farmer.profile.location.coordinates;
    const distance = geolib.getDistance(
      { latitude: farmerLocation[1], longitude: farmerLocation[0] },
      { latitude: deliveryLocation.coordinates[1], longitude: deliveryLocation.coordinates[0] }
    ) / 1000; // Convert to km

    // Calculate delivery fee based on distance and weight
    const deliveryFee = calculateDeliveryFee(distance, totalWeight);
    const farmerDeliveryShare = deliveryFee * 0.5;
    const restaurantDeliveryShare = deliveryFee * 0.5;

    // Create order
    const order = new Order({
      farmerId: farmer._id,
      restaurantId: req.user.userId,
      crops: validatedCrops,
      totalAmount,
      deliveryFee,
      farmerDeliveryShare,
      restaurantDeliveryShare,
      pickupLocation: farmer.profile.location,
      deliveryLocation,
      distance,
      estimatedDeliveryTime: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      notes
    });

    await order.save();

    // Update crop quantities
    for (const cropOrder of validatedCrops) {
      await Crop.findByIdAndUpdate(cropOrder.cropId, {
        $inc: { availableQuantity: -cropOrder.quantity }
      });
    }

    // Update crop status if no quantity left
    for (const cropOrder of validatedCrops) {
      const crop = await Crop.findById(cropOrder.cropId);
      if (crop.availableQuantity <= 0) {
        crop.status = 'out_of_stock';
        await crop.save();
      }
    }

    // Send notification to farmer
    const notificationService = require('../services/notificationService');
    await notificationService.notifyFarmerNewOrder(order._id);

    res.status(201).json({
      success: true,
      message: 'Order placed successfully',
      data: { order }
    });
  } catch (error) {
    console.error('Place order error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to place order',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Get restaurant's orders
router.get('/orders', verifyToken, async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    
    let query = { restaurantId: req.user.userId };
    if (status) {
      query.status = status;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const orders = await Order.find(query)
      .populate('farmerId', 'profile.name profile.location')
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
    console.error('Get orders error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get orders',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Raise complaint
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
      restaurantId: req.user.userId
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

// Get restaurant dashboard stats
router.get('/dashboard-stats', verifyToken, async (req, res) => {
  try {
    const restaurantId = req.user.userId;
    
    const [
      totalOrders,
      pendingOrders,
      totalSpent,
      monthlySpent,
      activeFarmers
    ] = await Promise.all([
      Order.countDocuments({ restaurantId }),
      Order.countDocuments({ restaurantId, status: { $in: ['pending', 'confirmed'] } }),
      Order.aggregate([
        { $match: { restaurantId: restaurantId, paymentStatus: 'paid' } },
        { $group: { _id: null, total: { $sum: { $add: ['$totalAmount', '$restaurantDeliveryShare'] } } } }
      ]),
      Order.aggregate([
        { 
          $match: { 
            restaurantId: restaurantId, 
            paymentStatus: 'paid',
            createdAt: { $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) }
          } 
        },
        { $group: { _id: null, total: { $sum: { $add: ['$totalAmount', '$restaurantDeliveryShare'] } } } }
      ]),
      Order.distinct('farmerId', { restaurantId })
    ]);

    res.json({
      success: true,
      data: {
        totalOrders,
        pendingOrders,
        totalSpent: totalSpent[0]?.total || 0,
        monthlySpent: monthlySpent[0]?.total || 0,
        activeFarmers: activeFarmers.length
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

// Helper function to calculate delivery fee based on distance and weight
function calculateDeliveryFee(distance, totalWeight) {
  // Base delivery fee in Indian Rupees
  const baseFee = 50; // ₹50 base fee
  const perKmFee = 5; // ₹5 per km
  const perKgFee = 2; // ₹2 per kg
  const minFee = 50; // Minimum ₹50
  const maxFee = 500; // Maximum ₹500
  
  // Calculate distance-based fee
  let fee = baseFee + (distance * perKmFee);
  
  // Add weight-based fee (if totalWeight is provided)
  if (totalWeight) {
    fee += (totalWeight * perKgFee);
  }
  
  // Adjust based on distance
  if (distance > 30) {
    fee *= 1.2; // 20% surcharge for distances over 30km
  }
  
  if (distance < 5) {
    fee *= 0.8; // 20% discount for nearby deliveries (<5km)
  }
  
  return Math.max(minFee, Math.min(maxFee, Math.round(fee)));
}

module.exports = router;
