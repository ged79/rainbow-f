@echo off
echo 🌸 Flower Delivery Platform Setup
echo ==================================
echo.

echo Creating project structure...

:: Create main directories
mkdir apps 2>nul
mkdir apps\client 2>nul
mkdir packages 2>nul
mkdir packages\shared 2>nul
mkdir packages\ui 2>nul
mkdir packages\database 2>nul
mkdir docs 2>nul
mkdir scripts 2>nul

echo.
echo Project structure created!
echo.

echo Next steps:
echo 1. Initialize monorepo with pnpm
echo 2. Setup shared package
echo 3. Create client app with Next.js 14
echo.

pause
