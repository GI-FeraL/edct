@echo off
echo Building Elite Dangerous Colonization Tracker for deployment...

echo.
echo Installing backend dependencies...
cd backend
call npm install
if %errorlevel% neq 0 (
    echo Backend dependency installation failed!
    pause
    exit /b 1
)

echo.
echo Installing frontend dependencies...
cd ..\frontend
call npm install
if %errorlevel% neq 0 (
    echo Frontend dependency installation failed!
    pause
    exit /b 1
)

echo.
echo Building frontend...
call npm run build
if %errorlevel% neq 0 (
    echo Frontend build failed!
    pause
    exit /b 1
)

echo.
echo Build completed successfully!
echo.
echo To deploy:
echo 1. Deploy backend to Railway, Render, or Heroku
echo 2. Update REACT_APP_SERVER_URL in frontend/.env
echo 3. Deploy frontend to Netlify
echo.
pause
