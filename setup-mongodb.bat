@echo off
echo ========================================
echo 🍃 MongoDB Setup Script for Hyperlocal Supply Chain Connector
echo ========================================
echo.

:: Check if MongoDB is installed
where mongod >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ MongoDB not found in PATH
    echo.
    echo 📥 Please download and install MongoDB Community Server from:
    echo    https://www.mongodb.com/try/download/community
    echo.
    echo 💡 During installation, make sure to:
    echo    1. Check "Install MongoDB as a Service"
    echo    2. Check "Install MongoDB Compass" (optional GUI)
    echo    3. Add MongoDB to PATH
    echo.
    pause
    exit /b 1
)

:: Create MongoDB directories
echo 📁 Creating MongoDB directories...
if not exist "%USERPROFILE%\mongodb" mkdir "%USERPROFILE%\mongodb"
if not exist "%USERPROFILE%\mongodb\data" mkdir "%USERPROFILE%\mongodb\data"
if not exist "%USERPROFILE%\mongodb\logs" mkdir "%USERPROFILE%\mongodb\logs"

:: Try to start MongoDB service
echo 🚀 Attempting to start MongoDB service...
net start MongoDB >nul 2>nul
if %errorlevel% equ 0 (
    echo ✅ MongoDB service started successfully
    goto :test_connection
)

net start "MongoDB Server" >nul 2>nul
if %errorlevel% equ 0 (
    echo ✅ MongoDB Server service started successfully
    goto :test_connection
)

:: If service doesn't exist, start manually
echo 📂 MongoDB service not found, starting manually...
echo 💡 Starting MongoDB on default port 27017...
start /min cmd /c "mongod --dbpath=%USERPROFILE%\mongodb\data --logpath=%USERPROFILE%\mongodb\logs\mongod.log --port 27017"
echo ⏳ Waiting for MongoDB to start...
timeout /t 5 >nul

:test_connection
:: Test MongoDB connection
echo 🔍 Testing MongoDB connection...
mongo --eval "print('MongoDB connection test successful!')" >nul 2>nul
if %errorlevel% equ 0 (
    echo ✅ MongoDB is running and accessible
    echo 🌐 MongoDB is available at: mongodb://localhost:27017
) else (
    echo ⚠️  MongoDB connection test failed
    echo 💡 You may need to:
    echo    1. Check if MongoDB is properly installed
    echo    2. Ensure no other process is using port 27017
    echo    3. Check Windows Firewall settings
)

echo.
echo ========================================
echo 📋 MongoDB Status Summary
echo ========================================
echo 📍 Data Directory: %USERPROFILE%\mongodb\data
echo 📄 Log File: %USERPROFILE%\mongodb\logs\mongod.log
echo 🌐 Connection URL: mongodb://localhost:27017
echo 🗃️  Database Name: hyperlocal_supply_chain
echo.
echo 💡 To connect manually: mongo
echo 💡 To stop: taskkill /f /im mongod.exe
echo.
pause
