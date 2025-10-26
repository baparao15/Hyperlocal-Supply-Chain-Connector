const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const User = require('../models/User');
const { body, validationResult } = require('express-validator');

const router = express.Router();

// Email transporter configuration
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },
  tls: {
    rejectUnauthorized: false
  }
});

// Verify transporter configuration on startup
let emailConfigured = false;
transporter.verify((error, success) => {
  if (error) {
    console.error('Email transporter configuration error:', error);
    console.log('⚠️  Email not configured - OTP will be logged to console for development');
    emailConfigured = false;
  } else {
    console.log('✅ Email server is ready to send messages');
    emailConfigured = true;
  }
});

// Generate OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Send OTP to email
router.post('/send-otp', [
  body('email').isEmail().normalizeEmail(),
  body('userType').isIn(['farmer', 'restaurant', 'transporter'])
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

    const { email, phone, userType, name, location, bankDetails, language = 'en' } = req.body;

    // Check if user already exists
    let user = await User.findOne({ email });
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    if (user) {
      // Update existing user's OTP
      user.otp = { code: otp, expiresAt };
      await user.save();
    } else {
      // Create new user (for signup)
      user = new User({
        email,
        phone: phone || '0000000000', // Phone is stored but not used for OTP
        userType,
        profile: {
          name: name || 'User',
          location: location || {
            coordinates: [78.4867, 17.3850],
            address: '',
            city: 'Hyderabad',
            state: 'Telangana'
          },
          bankDetails: bankDetails || {
            accountNumber: '',
            ifscCode: '',
            accountHolderName: ''
          },
          language
        },
        otp: { code: otp, expiresAt }
      });
      await user.save();
    }

    // Send OTP via email
    const mailOptions = {
      from: process.env.EMAIL_USER || 'noreply@gaonstabazar.com',
      to: email,
      subject: 'Hyperlocal Supply Chain Connector - OTP Verification',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
          <div style="background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <h2 style="color: #2d5016; margin-top: 0;">Hyperlocal Supply Chain Connector</h2>
            <h3 style="color: #333;">OTP Verification</h3>
            <p>Hello ${user.profile.name || 'User'},</p>
            <p>Your OTP for ${userType} account verification is:</p>
            <div style="background-color: #f0f8ff; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px;">
              <h1 style="color: #2d5016; font-size: 36px; margin: 0; letter-spacing: 4px;">${otp}</h1>
            </div>
            <p>This OTP is valid for 10 minutes.</p>
            <p style="color: #666; font-size: 14px;">If you didn't request this OTP, please ignore this email.</p>
            <hr style="margin: 20px 0; border: none; border-top: 1px solid #ddd;">
            <p style="color: #999; font-size: 12px; text-align: center;">
              © 2024 Hyperlocal Supply Chain Connector. All rights reserved.
            </p>
          </div>
        </div>
      `
    };

    // Send OTP via email
    try {
      const info = await transporter.sendMail(mailOptions);
      console.log(`✅ OTP sent successfully to ${email}. Message ID: ${info.messageId}`);
      
      res.json({
        success: true,
        message: 'OTP sent to your email successfully',
        data: {
          email,
          userType,
          expiresIn: 600 // 10 minutes in seconds
        }
      });
    } catch (emailError) {
      console.error('❌ Email sending error:', emailError);
      
      // For development: Log OTP to console when email fails
      if (process.env.NODE_ENV === 'development') {
        console.log(`🔑 DEVELOPMENT MODE - OTP for ${email}: ${otp}`);
        console.log(`⚠️  Email failed, but user can use OTP: ${otp}`);
        
        // Don't delete user, allow them to proceed with console OTP
        res.json({
          success: true,
          message: 'Email delivery failed, but OTP generated. Check server console for development OTP.',
          data: {
            email,
            userType,
            expiresIn: 600,
            developmentNote: 'Check server console for OTP'
          }
        });
      } else {
        // Production: Remove user if email fails
        if (!user.isVerified) {
          await User.findByIdAndDelete(user._id);
        }
        
        return res.status(500).json({
          success: false,
          message: 'Failed to send OTP email. Please check your email address and try again.',
          error: 'Email delivery failed'
        });
      }
    }

  } catch (error) {
    console.error('Send OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send OTP',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Verify OTP
router.post('/verify-otp', [
  body('email').isEmail().normalizeEmail(),
  body('otp').isLength({ min: 6, max: 6 }).isNumeric()
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

    const { email, otp } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if OTP exists and is not expired
    if (!user.otp || !user.otp.code || !user.otp.expiresAt) {
      return res.status(400).json({
        success: false,
        message: 'No OTP found. Please request a new OTP.'
      });
    }

    if (user.otp.code !== otp) {
      return res.status(400).json({
        success: false,
        message: 'Invalid OTP'
      });
    }

    if (new Date() > user.otp.expiresAt) {
      return res.status(400).json({
        success: false,
        message: 'OTP expired. Please request a new OTP.'
      });
    }

    // Verify user and clear OTP
    user.isVerified = true;
    user.otp = undefined;
    await user.save();

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user._id, 
        email: user.email, 
        userType: user.userType 
      },
      process.env.JWT_SECRET || 'secret_key',
      { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );

    res.json({
      success: true,
      message: 'OTP verified successfully',
      token: token,
      user: {
        id: user._id,
        email: user.email,
        phone: user.phone,
        userType: user.userType,
        profile: user.profile,
        isVerified: user.isVerified,
        rating: user.rating,
        totalOrders: user.totalOrders
      }
    });

  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify OTP',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Get user profile
router.get('/profile', async (req, res) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret_key');
    const user = await User.findById(decoded.userId).select('-otp');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: {
        user: {
          id: user._id,
          email: user.email,
          phone: user.phone,
          userType: user.userType,
          profile: user.profile,
          isVerified: user.isVerified,
          rating: user.rating,
          totalOrders: user.totalOrders
        }
      }
    });

  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get profile',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Update user profile
router.put('/profile', async (req, res) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret_key');
    const user = await User.findById(decoded.userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const { profile } = req.body;
    
    if (profile) {
      if (profile.name) user.profile.name = profile.name;
      if (profile.location) user.profile.location = { ...user.profile.location, ...profile.location };
      if (profile.bankDetails) user.profile.bankDetails = { ...user.profile.bankDetails, ...profile.bankDetails };
      if (profile.language) user.profile.language = profile.language;
    }

    await user.save();

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        user: {
          id: user._id,
          email: user.email,
          phone: user.phone,
          userType: user.userType,
          profile: user.profile,
          isVerified: user.isVerified
        }
      }
    });

  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update profile',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

module.exports = router;
