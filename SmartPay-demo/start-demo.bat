@echo off
echo ========================================
echo SmartPay Demo - Quick Start Script
echo ========================================
echo.
echo This script will help you start the SmartPay Demo
echo No cryptocurrency or wallet required!
echo.
echo ========================================
echo.

:menu
echo Please choose an option:
echo.
echo 1. Start Backend Server
echo 2. Start Frontend Server
echo 3. Start Both (Recommended)
echo 4. Install Dependencies
echo 5. Setup Environment Files
echo 6. Exit
echo.
set /p choice="Enter your choice (1-6): "

if "%choice%"=="1" goto backend
if "%choice%"=="2" goto frontend
if "%choice%"=="3" goto both
if "%choice%"=="4" goto install
if "%choice%"=="5" goto setup
if "%choice%"=="6" goto end

echo Invalid choice. Please try again.
echo.
goto menu

:backend
echo.
echo Starting Backend Server...
echo.
cd backend
start cmd /k "npm start"
echo Backend started in new window
echo.
pause
goto menu

:frontend
echo.
echo Starting Frontend Server...
echo.
cd frontend
start cmd /k "npm run dev"
echo Frontend started in new window
echo.
echo Access the app at: http://localhost:3000
echo.
pause
goto menu

:both
echo.
echo Starting Backend...
cd backend
start cmd /k "npm start"
timeout /t 2 /nobreak >nul
echo.
echo Starting Frontend...
cd ..
cd frontend
start cmd /k "npm run dev"
echo.
echo ========================================
echo Both servers are starting!
echo ========================================
echo.
echo Backend:  http://localhost:5000
echo Frontend: http://localhost:3000
echo.
echo Wait a few seconds, then open your browser to:
echo http://localhost:3000
echo.
pause
goto menu

:install
echo.
echo Installing Dependencies...
echo.
echo Installing Backend dependencies...
cd backend
call npm install
echo.
echo Installing Frontend dependencies...
cd ..
cd frontend
call npm install
echo.
echo ========================================
echo Dependencies installed successfully!
echo ========================================
echo.
pause
goto menu

:setup
echo.
echo ========================================
echo Environment Setup Helper
echo ========================================
echo.
echo Creating .env files with default values...
echo.

cd backend
if not exist .env (
    echo Creating backend/.env...
    (
        echo MONGODB_URI=mongodb://localhost:27017/smartpay-demo
        echo PORT=5000
        echo NODE_ENV=development
    ) > .env
    echo Backend .env created!
) else (
    echo Backend .env already exists
)

cd ..
cd frontend
if not exist .env.local (
    echo Creating frontend/.env.local...
    (
        echo NEXT_PUBLIC_BACKEND_URL=http://localhost:5000
        echo NEXT_PUBLIC_DEMO_MODE=true
        echo NEXT_PUBLIC_APP_NAME=SmartPay Demo
    ) > .env.local
    echo Frontend .env.local created!
) else (
    echo Frontend .env.local already exists
)

cd ..
echo.
echo ========================================
echo Environment files created!
echo ========================================
echo.
echo NOTE: Make sure to update MONGODB_URI in backend/.env
echo with your MongoDB connection string
echo.
pause
goto menu

:end
echo.
echo Thank you for using SmartPay Demo!
echo.
pause
exit
