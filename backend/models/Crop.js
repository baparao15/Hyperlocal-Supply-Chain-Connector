const mongoose = require('mongoose');

const cropSchema = new mongoose.Schema({
  farmerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  unit: {
    type: String,
    required: true,
    enum: ['kg', 'dozen', 'piece', 'quintal', 'ton', 'bunch', 'bag']
  },
  images: [{
    type: String, // Cloudinary URLs
    required: true
  }],
  location: {
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true
    },
    address: {
      type: String,
      required: true
    }
  },
  status: {
    type: String,
    enum: ['available', 'sold', 'out_of_stock'],
    default: 'available'
  },
  category: {
    type: String,
    required: true,
    enum: ['vegetables', 'fruits', 'grains', 'spices', 'herbs', 'flowers', 'other']
  },
  quantity: {
    type: Number,
    required: true,
    min: 0
  },
  availableQuantity: {
    type: Number,
    required: true,
    min: 0
  },
  harvestDate: {
    type: Date,
    required: true
  },
  organic: {
    type: Boolean,
    default: false
  },
  quality: {
    type: String,
    enum: ['premium', 'good', 'average'],
    default: 'good'
  },
  weightPerUnit: {
    type: Number, // Weight per unit in kg (default based on unit type)
    required: true,
    min: 0
  },
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  totalOrders: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Index for location-based queries
cropSchema.index({ 'location.coordinates': '2dsphere' });

// Index for farmer queries
cropSchema.index({ farmerId: 1 });

// Index for status and category
cropSchema.index({ status: 1, category: 1 });

module.exports = mongoose.model('Crop', cropSchema);
