const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  phone: {
    type: String,
    required: true,
    trim: true
  },
  userType: {
    type: String,
    enum: ['farmer', 'restaurant', 'transporter'],
    required: true
  },
  profile: {
    name: {
      type: String,
      required: true,
      trim: true
    },
    location: {
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: true
      },
      address: {
        type: String,
        required: true
      },
      city: {
        type: String,
        required: true
      },
      state: {
        type: String,
        required: true
      }
    },
    bankDetails: {
      accountNumber: {
        type: String,
        required: true
      },
      ifscCode: {
        type: String,
        required: true
      },
      accountHolderName: {
        type: String,
        required: true
      }
    },
    language: {
      type: String,
      enum: ['en', 'te'],
      default: 'en'
    }
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  otp: {
    code: String,
    expiresAt: Date
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
userSchema.index({ 'profile.location.coordinates': '2dsphere' });

// Index for user type queries
userSchema.index({ userType: 1 });

module.exports = mongoose.model('User', userSchema);
