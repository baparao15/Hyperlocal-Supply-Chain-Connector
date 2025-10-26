@echo off
echo ========================================
echo 🚀 Hyperlocal Supply Chain Connector Quick Installer
echo ========================================
echo.

:: Check if running as administrator
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo ⚠️  Note: Some features may require administrator privileges
    echo.
)

:: Install npm dependencies
echo 📦 Installing Node.js dependencies...
npm install
if %errorlevel% neq 0 (
    echo ❌ Failed to install dependencies
    echo 💡 Make sure Node.js is installed: https://nodejs.org/
    pause
    exit /b 1
)

echo ✅ Dependencies installed successfully!
echo.

:: Check environment file
if exist backend\.env (
    echo ✅ Environment file found
) else (
    echo 📝 Environment file not found, please update backend\.env
)

echo.
echo ========================================
echo 🎉 Installation Complete!
echo ========================================
echo.
echo 🚀 To start the platform, run one of these:
echo    • dev-start.bat          (Recommended - includes MongoDB)
echo    • start-vil-platform.bat (Full service startup)
echo    • npm run dev:full       (Manual startup)
echo.
echo 📋 Next steps:
echo    1. Update backend\.env with your API keys
echo    2. Make sure MongoDB is installed
echo    3. Run dev-start.bat to launch the platform
echo.
echo 🌐 Platform URLs:
echo    • Frontend: http://localhost:3000
echo    • Backend:  http://localhost:5000
echo.
pause
