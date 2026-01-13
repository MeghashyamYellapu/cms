@echo off
echo ========================================
echo Cable Billing Management System
echo Environment Setup Script
echo ========================================
echo.

REM Check if .env exists
if exist .env (
    echo [WARNING] .env file already exists!
    echo.
    set /p overwrite="Do you want to overwrite it? (y/n): "
    if /i not "%overwrite%"=="y" (
        echo Setup cancelled.
        pause
        exit /b
    )
)

echo Creating .env file from template...
copy .env.example .env >nul

echo.
echo ========================================
echo IMPORTANT: Configure Your .env File
echo ========================================
echo.
echo Please update the following in .env:
echo.
echo 1. MONGODB_URI
echo    Replace: ^<db_username^> and ^<db_password^>
echo    With your MongoDB Atlas credentials
echo.
echo 2. JWT_SECRET
echo    Change to a random 32+ character string
echo.
echo 3. ENCRYPTION_KEY
echo    Change to exactly 32 characters
echo.
echo 4. COMPANY_* variables
echo    Update with your company details
echo.
echo ========================================
echo.

set /p edit="Open .env file now? (y/n): "
if /i "%edit%"=="y" (
    notepad .env
)

echo.
echo ========================================
echo Next Steps:
echo ========================================
echo.
echo 1. Ensure MongoDB Atlas is configured:
echo    - Database user created
echo    - IP address whitelisted (0.0.0.0/0 for dev)
echo.
echo 2. Install dependencies:
echo    npm install
echo.
echo 3. Seed super admin:
echo    npm run seed
echo.
echo 4. Start server:
echo    npm run dev
echo.
echo ========================================
echo.
echo For detailed instructions, see MONGODB_SETUP.md
echo.
pause
