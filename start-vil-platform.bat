@echo off
echo ========================================
echo 🌾 Hyperlocal Supply Chain Connector Startup Script
echo ========================================
echo.

:: Check if MongoDB is installed and start it
echo 🔍 Checking MongoDB installation...
where mongod >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ MongoDB not found in PATH
    echo 📥 Please install MongoDB from: https://www.mongodb.com/try/download/community
    pause
    exit /b 1
)

:: Try different MongoDB service names
echo 🚀 Starting MongoDB...
net start MongoDB >nul 2>nul
if %errorlevel% neq 0 (
    net start "MongoDB Server" >nul 2>nul
    if %errorlevel% neq 0 (
        echo 📂 Starting MongoDB manually...
        start /min cmd /c "mongod --dbpath=%USERPROFILE%\mongodb\data --logpath=%USERPROFILE%\mongodb\logs\mongod.log"
        timeout /t 3 >nul
    )
)

:: Check if MongoDB is running
echo 🔍 Checking MongoDB connection...
timeout /t 2 >nul
mongo --eval "db.runCommand('ping')" >nul 2>nul
if %errorlevel% neq 0 (
    echo ⚠️  MongoDB may not be running properly
    echo 💡 You can manually start MongoDB with: mongod
    echo.
)

:: Check if Node.js is installed
echo 🔍 Checking Node.js installation...
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ Node.js not found
    echo 📥 Please install Node.js from: https://nodejs.org/
    pause
    exit /b 1
)

:: Check if npm dependencies are installed
echo 🔍 Checking npm dependencies...
if not exist node_modules (
    echo 📦 Installing npm dependencies...
    npm install
    if %errorlevel% neq 0 (
        echo ❌ Failed to install dependencies
        pause
        exit /b 1
    )
)

:: Check environment file
echo 🔍 Checking environment configuration...
if not exist backend\.env (
    echo ❌ Environment file not found
    echo 📝 Please update backend\.env with your API keys
    pause
    exit /b 1
)

:: Start the application
echo.
echo ========================================
echo 🚀 Starting Hyperlocal Supply Chain Connector...
echo ========================================
echo 📱 Frontend will be available at: http://localhost:3000
echo 🔧 Backend API will be available at: http://localhost:5000
echo.
echo 💡 Press Ctrl+C to stop all services
echo.

:: Start both frontend and backend
npm run dev:full

echo.
echo ========================================
echo 🛑 Hyperlocal Supply Chain Connector Stopped
echo ========================================
pause
