const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  farmerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  restaurantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  transporterId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  crops: [{
    cropId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Crop',
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      min: 1
    },
    price: {
      type: Number,
      required: true,
      min: 0
    },
    unit: {
      type: String,
      required: true
    },
    weight: {
      type: Number,
      required: true,
      min: 0
    }
  }],
  totalAmount: {
    type: Number,
    required: true,
    min: 0
  },
  deliveryFee: {
    type: Number,
    required: true,
    min: 0
  },
  farmerDeliveryShare: {
    type: Number,
    required: true,
    min: 0
  },
  restaurantDeliveryShare: {
    type: Number,
    required: true,
    min: 0
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'picked_up', 'in_transit', 'delivered', 'cancelled'],
    default: 'pending'
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'disputed', 'refunded'],
    default: 'pending'
  },
  pickupLocation: {
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true
    },
    address: {
      type: String,
      required: true
    }
  },
  deliveryLocation: {
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true
    },
    address: {
      type: String,
      required: true
    }
  },
  distance: {
    type: Number, // in km
    required: true,
    min: 0
  },
  estimatedDeliveryTime: {
    type: Date,
    required: true
  },
  actualDeliveryTime: {
    type: Date,
    default: null
  },
  complaints: [{
    raisedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    description: {
      type: String,
      required: true
    },
    status: {
      type: String,
      enum: ['open', 'resolved', 'rejected'],
      default: 'open'
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    resolvedAt: {
      type: Date,
      default: null
    }
  }],
  notes: {
    type: String,
    default: ''
  },
  voiceOrder: {
    type: String, // Voice input text
    default: null
  },
  qualityVerification: {
    score: {
      type: Number,
      min: 1,
      max: 5
    },
    notes: String,
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    verifiedAt: Date
  },
  paymentDetails: {
    razorpayOrderId: String,
    razorpayPaymentId: String,
    farmerTransferStatus: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed'],
      default: 'pending'
    },
    transporterTransferStatus: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed'],
      default: 'pending'
    },
    settledAt: Date
  }
}, {
  timestamps: true
});

// Index for user queries
orderSchema.index({ farmerId: 1 });
orderSchema.index({ restaurantId: 1 });
orderSchema.index({ transporterId: 1 });

// Index for status queries
orderSchema.index({ status: 1, paymentStatus: 1 });

// Index for date queries
orderSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Order', orderSchema);
