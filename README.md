# 🌾 Hyperlocal Supply Chain Connector

<div align="center">

**A revolutionary farm-to-restaurant ecosystem connecting farmers, restaurants, and transporters with AI-powered voice technology, real-time tracking, and automated payment settlements.**

[🚀 Quick Start](#-quick-start) • [✨ Features](#-features) • [📖 Documentation](#-documentation) • [🛠 Tech Stack](#-tech-stack) • [🤝 Contributing](#-contributing)

</div>

---

## 📋 Table of Contents

- [🌟 Overview](#-overview)
- [✨ Features](#-features)
- [🚀 Quick Start](#-quick-start)
- [🏗 Installation](#-installation)
- [⚙️ Configuration](#️-configuration)
- [🎯 Usage](#-usage)
- [📱 User Roles](#-user-roles)
- [🔌 API Reference](#-api-reference)
- [🛠 Tech Stack](#-tech-stack)
- [🏛 Architecture](#-architecture)
- [🧪 Testing](#-testing)
- [🚀 Deployment](#-deployment)
- [🤝 Contributing](#-contributing)
- [📄 License](#-license)

---

## 🌟 Overview

Hyperlocal Supply Chain Connector is a comprehensive digital ecosystem that bridges the gap between rural farmers and urban restaurants through technology. The platform leverages AI-powered voice recognition, geospatial matching, and automated payment systems to create a seamless farm-to-table experience.

### 🎯 Mission
Empower farmers with direct market access while providing restaurants with fresh, traceable produce through an efficient, transparent, and technology-driven supply chain.

### 🌍 Impact
- **Direct Farmer Benefits**: Eliminate middlemen, increase profit margins
- **Restaurant Advantages**: Fresh produce, transparent pricing, reliable supply
- **Transporter Opportunities**: Flexible earning through delivery services
- **Consumer Benefits**: Fresher food, supporting local agriculture

---

## ✨ Features

### 🎤 **AI-Powered Voice Technology**
- **Multilingual Support**: English and Telugu voice commands
- **Smart Crop Recognition**: AI extracts crop details from natural speech
- **Voice-to-Order**: "I have 10 kg tomatoes, 5 kg onions" → Automatic listing

### 🗺 **Intelligent Geospatial Matching**
- **Proximity-Based Discovery**: Find farmers within 30-40km radius
- **Route Optimization**: Efficient delivery path calculation
- **Location-Aware Pricing**: Distance-based delivery fees

### 📱 **Real-Time Order Management**
- **Live Status Updates**: Pending → Confirmed → Picked Up → In Transit → Delivered
- **Quality Verification**: Transporter crop quality checks (1-5 rating)
- **Transparent Timeline**: Real-time notifications at every stage

### 💰 **Automated Payment System**
- **Smart Payment Splits**: Automatic distribution to farmers and transporters
- **One-Click Settlement**: Instant payment processing
- **Transparent Breakdown**: Clear fee structure and profit sharing
- **Multiple Payment Methods**: Razorpay integration for secure transactions

### 📧 **Comprehensive Notification System**
- **Email Alerts**: Automated notifications for all stakeholders
- **Order Updates**: Real-time status changes via email
- **Payment Confirmations**: Instant settlement notifications

### 🔍 **Advanced Filtering & Search**
- **Category-Based Browsing**: Vegetables, fruits, grains, spices
- **Quality Filters**: Organic, premium, good quality options
- **Price Range Selection**: Budget-friendly filtering
- **Availability Status**: Real-time inventory updates

---

## 🚀 Quick Start

### 🖱 **One-Click Startup (Windows)**
```bash
# Double-click to start everything:
dev-start.bat
```

### 🖥 **Manual Startup**
```bash
# 1. Install dependencies
npm install

# 2. Start the platform
npm run dev:full
```

### 🌐 **Access URLs**
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **API Health**: http://localhost:5000/api/health

---

## 🏗 Installation

### 📋 **Prerequisites**
- **Node.js** (v18.0.0 or higher) - [Download](https://nodejs.org/)
- **MongoDB** (v5.0 or higher) - [Download](https://www.mongodb.com/try/download/community)
- **Git** - [Download](https://git-scm.com/)

### 🔽 **Clone Repository**
```bash
git clone https://github.com/your-username/hyperlocal-supply-chain-connector.git
cd hyperlocal-supply-chain-connector
```

### 📦 **Install Dependencies**
```bash
# Install all dependencies
npm install

# Or use the installer script
install.bat  # Windows
```

### 🗃 **Database Setup**
```bash
# Start MongoDB
mongod --dbpath=./data

# Or use the setup script
setup-mongodb.bat  # Windows
```

---

## ⚙️ Configuration

### 🔐 **Environment Variables**

Create `backend/.env` file:

```env
# Database Configuration
MONGODB_URI=mongodb://localhost:27017/hyperlocal_supply_chain

# Server Configuration
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
```

### 🔑 **API Key Setup**

#### Gmail App Password
1. Enable 2-Factor Authentication on Gmail
2. Generate App Password: [Google Account Settings](https://myaccount.google.com/apppasswords)
3. Use the generated password in `EMAIL_PASS`

#### Google Gemini API
1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create new API key
3. Add to `GEMINI_API_KEY`

#### Razorpay (Optional)
1. Create account at [Razorpay](https://razorpay.com/)
2. Get API keys from dashboard
3. Add to environment variables

---

## 🎯 Usage

### 👨‍🌾 **For Farmers**

#### Voice Crop Listing
```
🎤 "I have 10 kg tomatoes, 5 kg onions, and 20 kg rice available"
→ AI automatically creates crop listings with pricing
```

#### Manual Crop Management
- Add crops with detailed information
- Set pricing and availability
- Manage inventory levels
- Track order history and earnings

#### Order Management
- Receive instant email notifications for new orders
- Confirm or decline orders with one click
- Track delivery status in real-time
- View payment settlements

### 🍽 **For Restaurants**

#### Discover Local Farmers
- Browse farmers within 30-40km radius
- View farmer profiles and ratings
- Check crop availability and pricing
- Filter by organic, quality, category

#### Place Orders
- Add crops to cart from multiple farmers
- Review order details and pricing
- Confirm orders with delivery information
- Track order status in real-time

#### Payment Management
- View transparent payment breakdown
- One-click payment settlement
- Automatic money transfer to farmers and transporters
- Payment history and receipts

### 🚛 **For Transporters**

#### Find Delivery Opportunities
- View available delivery requests
- See distance, earnings, and route details
- Accept deliveries with one click
- Optimize routes for maximum earnings

#### Delivery Management
- Update delivery status in real-time
- Verify crop quality during pickup
- Navigate with integrated maps
- Complete deliveries and receive payments

---

## 📱 User Roles

### 👨‍🌾 **Farmer Dashboard**
- **Voice Crop Listing**: AI-powered product entry
- **Inventory Management**: Real-time stock updates
- **Order Processing**: Confirm/decline incoming orders
- **Earnings Tracking**: Revenue analytics and payment history
- **Profile Management**: Bank details, location, preferences

### 🍽 **Restaurant Dashboard**
- **Farmer Discovery**: Geospatial search and filtering
- **Crop Browsing**: Category-wise product exploration
- **Order Management**: Cart, checkout, and tracking
- **Payment Center**: Settlement and transaction history
- **Supplier Relations**: Farmer ratings and feedback

### 🚛 **Transporter Dashboard**
- **Delivery Marketplace**: Available job listings
- **Route Optimization**: Distance and earnings calculator
- **Status Updates**: Real-time delivery tracking
- **Quality Control**: Crop verification system
- **Earnings Analytics**: Income tracking and statistics

---

## 🔌 API Reference

### 🔐 **Authentication**
```http
POST /api/auth/register    # User registration
POST /api/auth/login       # User login
POST /api/auth/verify-otp  # OTP verification
```

### 👨‍🌾 **Farmer Endpoints**
```http
GET    /api/farmer/crops                    # Get farmer's crops
POST   /api/farmer/crops                    # Add new crop
POST   /api/farmer/crops/voice              # Voice crop listing
GET    /api/farmer/orders                   # Get orders
POST   /api/farmer/orders/:id/confirm       # Confirm order
GET    /api/farmer/dashboard                # Dashboard stats
```

### 🍽 **Restaurant Endpoints**
```http
GET    /api/restaurant/nearby-farmers       # Find nearby farmers
GET    /api/restaurant/crops                # Browse crops
POST   /api/restaurant/orders               # Place order
GET    /api/restaurant/orders               # Get orders
```

### 🚛 **Transporter Endpoints**
```http
GET    /api/transporter/available-orders    # Available deliveries
POST   /api/transporter/accept-order        # Accept delivery
POST   /api/transporter/mark-picked-up      # Update status
POST   /api/transporter/mark-delivered      # Complete delivery
GET    /api/transporter/earnings            # Earnings data
```

### 💰 **Payment Endpoints**
```http
POST   /api/payment/calculate               # Calculate splits
POST   /api/payment/create-order            # Create payment
POST   /api/payment/settle                  # Settle payment
GET    /api/payment/status/:orderId         # Payment status
```

### 🎤 **Voice Processing**
```http
POST   /api/voice/process                   # Speech to text
POST   /api/voice/process-order             # AI crop extraction
```

---

## 🛠 Tech Stack

### 🎨 **Frontend**
- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript for type safety
- **Styling**: Tailwind CSS for responsive design
- **UI Components**: shadcn/ui for consistent interface
- **Icons**: Lucide React for beautiful icons
- **State Management**: React Hooks and Context

### ⚙️ **Backend**
- **Runtime**: Node.js with Express.js framework
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT with bcrypt encryption
- **File Upload**: Multer with Cloudinary integration
- **Email Service**: Nodemailer with Gmail SMTP
- **Validation**: Express Validator for input sanitization

### 🤖 **AI & Integration**
- **Voice Processing**: Google Gemini AI for natural language understanding
- **Speech Recognition**: Web Speech API for voice input
- **Geospatial**: MongoDB 2dsphere indexing for location queries
- **Payment Gateway**: Razorpay for secure transactions
- **Maps**: Integration ready for Google Maps API

### 🔧 **Development Tools**
- **Process Management**: Concurrently for running multiple services
- **Development Server**: Nodemon for auto-restart
- **Code Quality**: ESLint and Prettier for consistent code
- **Version Control**: Git with conventional commits

---

## 🏛 Architecture

### 🏗 **System Architecture**
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend API   │    │   Database      │
│   (Next.js)     │◄──►│   (Express.js)  │◄──►│   (MongoDB)     │
│   Port: 3000    │    │   Port: 5000    │    │   Port: 27017   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │              ┌─────────────────┐              │
         └──────────────►│  External APIs  │◄─────────────┘
                        │  - Gemini AI    │
                        │  - Gmail SMTP   │
                        │  - Razorpay     │
                        └─────────────────┘
```

### 📊 **Data Flow**
1. **Voice Input** → Gemini AI → Crop Extraction → Database Storage
2. **Order Placement** → Geospatial Matching → Farmer Notification → Email Alert
3. **Delivery Tracking** → Status Updates → Real-time Notifications → Payment Settlement

### 🔒 **Security Layers**
- **Authentication**: JWT tokens with expiration
- **Authorization**: Role-based access control
- **Input Validation**: Server-side sanitization
- **Data Encryption**: Bcrypt password hashing
- **API Security**: Rate limiting and CORS protection

---

## 🧪 Testing

### 🔍 **Test Complete Order Flow**

#### Step 1: Farmer Registration & Crop Listing
```bash
# Register as farmer
POST /api/auth/register
{
  "userType": "farmer",
  "email": "farmer@test.com",
  "profile": { "name": "Test Farmer" }
}

# Add crops via voice
POST /api/farmer/crops/voice
{
  "voiceText": "I have 10 kg tomatoes and 5 kg onions",
  "language": "en"
}
```

#### Step 2: Restaurant Order Placement
```bash
# Browse nearby crops
GET /api/restaurant/crops?latitude=17.385&longitude=78.4867

# Place order
POST /api/restaurant/orders
{
  "crops": [{"cropId": "...", "quantity": 5}],
  "deliveryLocation": {...}
}
```

#### Step 3: Transporter Delivery
```bash
# Accept delivery
POST /api/transporter/accept-order
{"orderId": "..."}

# Update status
POST /api/transporter/mark-delivered
{"orderId": "..."}
```

#### Step 4: Payment Settlement
```bash
# Settle payment
POST /api/payment/settle
{
  "orderId": "...",
  "razorpayPaymentId": "..."
}
```

### 📋 **Test Scenarios**
- ✅ Voice crop listing in English and Telugu
- ✅ Geospatial farmer discovery within radius
- ✅ End-to-end order flow with notifications
- ✅ Payment settlement with automatic transfers
- ✅ Quality verification by transporters
- ✅ Email notifications at each stage

---

## 🚀 Deployment

### 🌐 **Production Deployment**

#### Environment Setup
```bash
# Production environment variables
NODE_ENV=production
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/hyperlocal_supply_chain
FRONTEND_URL=https://your-domain.com
```

#### Docker Deployment
```dockerfile
# Dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000 5000
CMD ["npm", "start"]
```

#### Cloud Deployment Options
- **Frontend**: Vercel, Netlify, AWS Amplify
- **Backend**: Railway, Render, AWS EC2, Google Cloud Run
- **Database**: MongoDB Atlas, AWS DocumentDB
- **File Storage**: Cloudinary, AWS S3

### 📊 **Performance Optimization**
- Database indexing for geospatial queries
- Image optimization with Next.js
- API response caching
- CDN integration for static assets
- Compression middleware for API responses

---

## 🤝 Contributing

We welcome contributions from the community! Here's how you can help:

### 🐛 **Bug Reports**
- Use GitHub Issues to report bugs
- Include detailed reproduction steps
- Provide environment information

### ✨ **Feature Requests**
- Discuss new features in GitHub Discussions
- Follow the feature request template
- Consider backward compatibility

### 🔧 **Development Setup**
```bash
# Fork the repository
git clone https://github.com/your-username/hyperlocal-supply-chain-connector.git

# Create feature branch
git checkout -b feature/amazing-feature

# Make changes and test
npm run test

# Commit with conventional commits
git commit -m "feat: add amazing feature"

# Push and create pull request
git push origin feature/amazing-feature
```

### 📝 **Coding Standards**
- Follow TypeScript best practices
- Use ESLint and Prettier configurations
- Write meaningful commit messages
- Add tests for new features
- Update documentation

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **Google Gemini AI** for intelligent voice processing
- **MongoDB** for robust geospatial capabilities
- **Next.js Team** for the amazing React framework
- **Tailwind CSS** for beautiful, responsive design
- **Open Source Community** for inspiration and tools

---

## 📞 Support & Contact

- **Documentation**: [Wiki](https://github.com/your-username/hyperlocal-supply-chain-connector/wiki)
- **Issues**: [GitHub Issues](https://github.com/your-username/hyperlocal-supply-chain-connector/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-username/hyperlocal-supply-chain-connector/discussions)
- **Email**: support@hyperlocalconnector.com

---

<div align="center">

**Made with ❤️ for farmers, restaurants, and transporters**

[⭐ Star this project](https://github.com/your-username/hyperlocal-supply-chain-connector) • [🍴 Fork it](https://github.com/your-username/hyperlocal-supply-chain-connector/fork) • [📢 Share it](https://twitter.com/intent/tweet?text=Check%20out%20Hyperlocal%20Supply%20Chain%20Connector%20-%20Farm%20to%20Restaurant%20Ecosystem)

</div>
#
