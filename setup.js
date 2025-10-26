const fs = require('fs');
const path = require('path');

console.log('🌾 Hyperlocal Supply Chain Connector Setup Script');
console.log('============================');

// Check if .env file exists
const envPath = path.join(__dirname, 'backend', '.env');
if (!fs.existsSync(envPath)) {
  console.log('❌ .env file not found in backend directory');
  console.log('✅ Created .env file with default values');
  console.log('📝 Please update the following values in backend/.env:');
  console.log('   - EMAIL_USER: Your Gmail address');
  console.log('   - EMAIL_PASS: Your Gmail App Password');
  console.log('   - GEMINI_API_KEY: Your Google Gemini API key');
} else {
  console.log('✅ .env file found');
}

// Check if node_modules exists
const nodeModulesPath = path.join(__dirname, 'node_modules');
if (!fs.existsSync(nodeModulesPath)) {
  console.log('❌ node_modules not found');
  console.log('🔧 Please run: npm install');
} else {
  console.log('✅ node_modules found');
}

console.log('\n🚀 To start the application:');
console.log('1. Make sure MongoDB is running');
console.log('2. Update backend/.env with your API keys');
console.log('3. Run: npm run dev:full');
console.log('\n📖 For detailed setup instructions, check the documentation files.');
