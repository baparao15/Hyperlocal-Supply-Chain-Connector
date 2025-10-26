const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  reviewerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  reviewerType: {
    type: String,
    enum: ['restaurant', 'farmer', 'transporter'],
    required: true
  },
  reviewedUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  reviewedUserType: {
    type: String,
    enum: ['farmer', 'transporter'],
    required: true
  },
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  comment: {
    type: String,
    trim: true,
    maxlength: 500
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for user ratings
reviewSchema.index({ reviewedUserId: 1 });
reviewSchema.index({ reviewerId: 1, orderId: 1 }, { unique: true });

module.exports = mongoose.model('Review', reviewSchema);

