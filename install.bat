@echo off
echo ============================================
echo   AVIATOR CRASH GAME - STARTUP SCRIPT
echo ============================================
echo.

:: Step 1: Install server deps
echo [1/4] Installing server dependencies...
cd /d "%~dp0server"
call npm install
if errorlevel 1 (
    echo ERROR: Server npm install failed!
    pause
    exit /b 1
)

:: Step 2: Create admin (ignore error if already exists)
echo.
echo [2/4] Creating admin account...
node scripts/createAdmin.js

:: Step 3: Install client deps
echo.
echo [3/4] Installing client dependencies...
cd /d "%~dp0client"
call npm install
if errorlevel 1 (
    echo ERROR: Client npm install failed!
    pause
    exit /b 1
)

echo.
echo ============================================
echo   INSTALLATION COMPLETE!
echo ============================================
echo.
echo Now start the servers in TWO separate terminals:
echo.
echo   Terminal 1 (Backend):
echo     cd server
echo     npm run dev
echo.
echo   Terminal 2 (Frontend):
echo     cd client
echo     npm run dev
echo.
echo   Then open: http://localhost:5173
echo.
echo   Admin login: admin@aviator.com / admin123
echo ============================================
pause
