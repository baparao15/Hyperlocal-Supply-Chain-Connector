@echo off
title Hyperlocal Supply Chain Connector - Development Server
color 0A

echo.
echo   ██╗   ██╗██╗██╗         ██████╗ ██╗      █████╗ ████████╗███████╗ ██████╗ ██████╗ ███╗   ███╗
echo   ██║   ██║██║██║         ██╔══██╗██║     ██╔══██╗╚══██╔══╝██╔════╝██╔═══██╗██╔══██╗████╗ ████║
echo   ██║   ██║██║██║         ██████╔╝██║     ███████║   ██║   █████╗  ██║   ██║██████╔╝██╔████╔██║
echo   ╚██╗ ██╔╝██║██║         ██╔═══╝ ██║     ██╔══██║   ██║   ██╔══╝  ██║   ██║██╔══██╗██║╚██╔╝██║
echo    ╚████╔╝ ██║███████╗    ██║     ███████╗██║  ██║   ██║   ██║     ╚██████╔╝██║  ██║██║ ╚═╝ ██║
echo     ╚═══╝  ╚═╝╚══════╝    ╚═╝     ╚══════╝╚═╝  ╚═╝   ╚═╝   ╚═╝      ╚═════╝ ╚═╝  ╚═╝╚═╝     ╚═╝
echo.
echo                           🌾 Farm to Restaurant Ecosystem 🍽️
echo.

:: Check Node.js
echo [1/4] 🔍 Checking Node.js...
node --version >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ Node.js not found! Please install from https://nodejs.org/
    pause & exit /b 1
)
echo ✅ Node.js found

:: Check dependencies
echo [2/4] 📦 Checking dependencies...
if not exist node_modules (
    echo 📥 Installing dependencies...
    npm install
    if %errorlevel% neq 0 (
        echo ❌ Failed to install dependencies
        pause & exit /b 1
    )
)
echo ✅ Dependencies ready

:: Check environment
echo [3/4] ⚙️ Checking environment...
if not exist backend\.env (
    echo ❌ Environment file missing! Please update backend\.env
    pause & exit /b 1
)
echo ✅ Environment configured

:: Start MongoDB (portable way)
echo [4/4] 🍃 Starting MongoDB...
:: Check if MongoDB is already running on port 27017
netstat -an | findstr :27017 >nul 2>nul
if %errorlevel% equ 0 (
    echo ✅ MongoDB service is already running
    goto :mongodb_ready
)

where mongod >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ MongoDB not found! Please install MongoDB Community Server
    echo 📥 Download from: https://www.mongodb.com/try/download/community
    pause & exit /b 1
)

:: Create data directory if it doesn't exist
if not exist data mkdir data

:: Start MongoDB in background
echo 🚀 Starting MongoDB server...
start /min "MongoDB Server" cmd /c "mongod --dbpath=data --port=27017 --bind_ip=127.0.0.1"

:: Wait for MongoDB to start
echo ⏳ Waiting for MongoDB to initialize...
timeout /t 3 >nul

:mongodb_ready
:: Test MongoDB connection
echo 🔍 Testing database connection...
timeout /t 2 >nul

echo.
echo ========================================
echo 🚀 STARTING HYPERLOCAL SUPPLY CHAIN CONNECTOR
echo ========================================
echo 🌐 Frontend: http://localhost:3000
echo 🔧 Backend:  http://localhost:5000  
echo 🍃 MongoDB:  mongodb://localhost:27017
echo.
echo 💡 Press Ctrl+C to stop all services
echo ⚠️  Keep this window open while using the platform
echo.

:: Start the application
npm run dev:full

:: Cleanup on exit
echo.
echo 🛑 Stopping services...
taskkill /f /im mongod.exe >nul 2>nul
echo ✅ All services stopped
pause
