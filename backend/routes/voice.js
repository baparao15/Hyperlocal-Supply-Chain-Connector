const express = require('express');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const { body, validationResult } = require('express-validator');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const router = express.Router();

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

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

// Convert voice to text using Google Speech-to-Text API
router.post('/process', verifyToken, [
  body('audioData').notEmpty(),
  body('language').isIn(['en-US', 'te-IN']).optional()
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

    const { audioData, language = 'en-US' } = req.body;

    // Convert base64 audio to buffer
    const audioBuffer = Buffer.from(audioData, 'base64');

    // Google Speech-to-Text API configuration
    const config = {
      encoding: 'WEBM_OPUS', // or 'LINEAR16' depending on audio format
      sampleRateHertz: 48000,
      languageCode: language,
      alternativeLanguageCodes: ['en-US', 'te-IN'],
      enableAutomaticPunctuation: true,
      enableWordTimeOffsets: true,
    };

    const request = {
      config,
      audio: {
        content: audioBuffer.toString('base64')
      }
    };

    // Call Google Speech-to-Text API
    const response = await axios.post(
      `https://speech.googleapis.com/v1/speech:recognize?key=${process.env.GOOGLE_SPEECH_API_KEY}`,
      request,
      {
        headers: {
          'Content-Type': 'application/json',
        }
      }
    );

    const transcription = response.data.results?.[0]?.alternatives?.[0]?.transcript || '';

    if (!transcription) {
      return res.status(400).json({
        success: false,
        message: 'Could not transcribe audio. Please try again.'
      });
    }

    res.json({
      success: true,
      data: {
        transcription,
        confidence: response.data.results?.[0]?.alternatives?.[0]?.confidence || 0
      }
    });

  } catch (error) {
    console.error('Voice processing error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process voice input',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Process voice order (convert voice to structured order data)
router.post('/process-order', verifyToken, [
  body('voiceText').notEmpty().trim(),
  body('language').isIn(['en', 'te']).optional()
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

    const { voiceText, language = 'en' } = req.body;

    // Parse voice text to extract order information using Gemini AI
    const parsedOrder = await parseVoiceOrderWithAI(voiceText, language);

    if (parsedOrder.crops.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No crops found in voice input. Please try again with clearer speech.'
      });
    }

    res.json({
      success: true,
      data: {
        parsedOrder,
        originalText: voiceText
      }
    });

  } catch (error) {
    console.error('Voice order processing error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process voice order',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// AI-powered helper function to parse voice order using Gemini
async function parseVoiceOrderWithAI(voiceText, language = 'en') {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    
    const prompt = `
    You are an AI assistant for a farm-to-restaurant platform. Parse the following voice input and extract crop/product information.
    
    Voice Input: "${voiceText}"
    Language: ${language === 'te' ? 'Telugu' : 'English'}
    
    Extract and return ONLY a valid JSON object with this exact structure:
    {
      "crops": [
        {
          "name": "Crop Name",
          "description": "Brief description",
          "category": "vegetables|fruits|grains|spices|herbs|flowers|other",
          "unit": "kg|dozen|piece|quintal|ton|bunch|bag",
          "quantity": number,
          "price": number,
          "availableQuantity": number,
          "organic": boolean,
          "quality": "premium|good|average"
        }
      ],
      "totalCrops": number,
      "totalValue": number
    }
    
    Rules:
    1. Only extract crops/products that are clearly mentioned
    2. Infer reasonable quantities if not specified (default: 10)
    3. Infer reasonable prices if not specified (vegetables: ₹30-50/kg, fruits: ₹40-80/kg, grains: ₹20-40/kg)
    4. Set organic=true if "organic" is mentioned
    5. Set quality based on keywords (premium, good, average)
    6. Use appropriate units for each crop type
    7. Return empty crops array if no crops are found
    8. Do not include any explanation, only return the JSON object
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Clean the response to extract JSON
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No valid JSON found in AI response');
    }
    
    const parsedOrder = JSON.parse(jsonMatch[0]);
    
    // Validate the structure
    if (!parsedOrder.crops || !Array.isArray(parsedOrder.crops)) {
      throw new Error('Invalid crops array in AI response');
    }
    
    // Add additional fields and validation
    parsedOrder.crops = parsedOrder.crops.map(crop => ({
      ...crop,
      harvestDate: new Date(),
      availableQuantity: crop.availableQuantity || crop.quantity,
      weightPerUnit: getWeightPerUnit(crop.unit),
      rating: 0,
      totalOrders: 0
    }));
    
    parsedOrder.totalCrops = parsedOrder.crops.length;
    parsedOrder.totalValue = parsedOrder.crops.reduce((sum, crop) => sum + (crop.price * crop.quantity), 0);
    
    return parsedOrder;
    
  } catch (error) {
    console.error('AI parsing error:', error);
    // Fallback to basic parsing
    return parseVoiceOrderBasic(voiceText, language);
  }
}

// Fallback basic parsing function
function parseVoiceOrderBasic(voiceText, language = 'en') {
  const text = voiceText.toLowerCase();
  const crops = [];
  
  // Basic crop keywords
  const cropKeywords = {
    'tomato': { name: 'Tomato', category: 'vegetables', unit: 'kg' },
    'onion': { name: 'Onion', category: 'vegetables', unit: 'kg' },
    'potato': { name: 'Potato', category: 'vegetables', unit: 'kg' },
    'rice': { name: 'Rice', category: 'grains', unit: 'kg' },
    'wheat': { name: 'Wheat', category: 'grains', unit: 'kg' },
    'mango': { name: 'Mango', category: 'fruits', unit: 'dozen' },
    'banana': { name: 'Banana', category: 'fruits', unit: 'bunch' },
    'carrot': { name: 'Carrot', category: 'vegetables', unit: 'kg' },
    'cabbage': { name: 'Cabbage', category: 'vegetables', unit: 'piece' },
    'spinach': { name: 'Spinach', category: 'vegetables', unit: 'bunch' }
  };

  // Extract crops from voice text
  Object.keys(cropKeywords).forEach(keyword => {
    if (text.includes(keyword)) {
      const quantity = extractQuantity(text, language) || 10;
      const price = extractPrice(text) || 50;
      
      crops.push({
        ...cropKeywords[keyword],
        description: `Fresh ${cropKeywords[keyword].name} from farm`,
        price,
        quantity,
        availableQuantity: quantity,
        harvestDate: new Date(),
        organic: text.includes('organic'),
        quality: text.includes('premium') ? 'premium' : 'good',
        weightPerUnit: getWeightPerUnit(cropKeywords[keyword].unit),
        rating: 0,
        totalOrders: 0
      });
    }
  });

  return {
    crops,
    totalCrops: crops.length,
    totalValue: crops.reduce((sum, crop) => sum + (crop.price * crop.quantity), 0)
  };
}

// Helper function to get weight per unit
function getWeightPerUnit(unit) {
  const weights = {
    'kg': 1,
    'dozen': 0.5,
    'piece': 0.3,
    'quintal': 100,
    'ton': 1000,
    'bunch': 0.2,
    'bag': 50
  };
  return weights[unit] || 1;
}

function extractQuantity(text, language = 'en') {
  // English quantity patterns
  const englishPatterns = [
    /(\d+)\s*(kg|kilo|kilogram|kilograms)/gi,
    /(\d+)\s*(dozen|dozens)/gi,
    /(\d+)\s*(piece|pieces)/gi,
    /(\d+)\s*(quintal|quintals)/gi,
    /(\d+)\s*(ton|tons)/gi,
    /(\d+)\s*(bunch|bunches)/gi,
    /(\d+)\s*(bag|bags)/gi
  ];

  // Telugu quantity patterns
  const teluguPatterns = [
    /(\d+)\s*(కిలో|kg)/gi,
    /(\d+)\s*(డజను|dozen)/gi,
    /(\d+)\s*(ముక్క|piece)/gi
  ];

  const patterns = language === 'te' ? teluguPatterns : englishPatterns;
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      return parseInt(match[1]);
    }
  }
  
  return null;
}

function extractPrice(text) {
  // Price patterns for both languages
  const patterns = [
    /₹?(\d+)/g,
    /(\d+)\s*rupees?/gi,
    /(\d+)\s*రూపాయలు/gi
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      return parseInt(match[1]);
    }
  }
  
  return null;
}

module.exports = router;
module.exports.parseVoiceOrderWithAI = parseVoiceOrderWithAI;
