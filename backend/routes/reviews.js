const express = require('express');
const jwt = require('jsonwebtoken');
const Review = require('../models/Review');
const User = require('../models/User');
const Order = require('../models/Order');
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

// Create a review (Restaurant rates Farmer or Transporter)
router.post('/', verifyToken, [
  body('orderId').isMongoId(),
  body('ratedUserId').isMongoId(),
  body('ratedUserType').isIn(['farmer', 'transporter']),
  body('rating').isInt({ min: 1, max: 5 }),
  body('comment').optional().isString().trim().isLength({ max: 500 })
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

    const { orderId, ratedUserId, ratedUserType, rating, comment } = req.body;
    const reviewerId = req.user.userId;

    // Verify order exists and reviewer is part of it
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Verify the user being rated is part of the order
    const orderUserIds = [order.farmerId.toString(), order.restaurantId.toString()];
    if (order.transporterId) {
      orderUserIds.push(order.transporterId.toString());
    }

    if (!orderUserIds.includes(ratedUserId)) {
      return res.status(400).json({
        success: false,
        message: 'User being rated must be part of this order'
      });
    }

    if (order.restaurantId.toString() !== reviewerId) {
      return res.status(403).json({
        success: false,
        message: 'Only restaurants can rate farmers and transporters'
      });
    }

    // Check if review already exists
    const existingReview = await Review.findOne({
      reviewerId,
      orderId,
      reviewedUserId: ratedUserId
    });

    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: 'You have already reviewed this user for this order'
      });
    }

    // Create review
    const review = new Review({
      reviewerId,
      reviewerType: 'restaurant',
      reviewedUserId: ratedUserId,
      reviewedUserType: ratedUserType,
      orderId,
      rating,
      comment
    });
    await review.save();

    // Update user's average rating
    const reviews = await Review.find({ reviewedUserId: ratedUserId });
    const averageRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;

    await User.findByIdAndUpdate(ratedUserId, {
      rating: Math.round(averageRating * 10) / 10,
      totalOrders: reviews.length
    });

    res.json({
      success: true,
      message: 'Review submitted successfully',
      data: { review }
    });
  } catch (error) {
    console.error('Create review error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create review',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Get reviews for a user
router.get('/user/:userId', verifyToken, async (req, res) => {
  try {
    const { userId } = req.params;

    const reviews = await Review.find({ reviewedUserId: userId })
      .populate('reviewerId', 'profile.name profile.email')
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({
      success: true,
      data: { reviews }
    });
  } catch (error) {
    console.error('Get reviews error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get reviews',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

module.exports = router;

