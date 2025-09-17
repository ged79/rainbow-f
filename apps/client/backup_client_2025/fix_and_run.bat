@echo off
echo Installing missing next-pwa package...
cd C:\work_station\flower\apps\client
pnpm add next-pwa
echo Installation complete!
echo.
echo Now running dev server...
pnpm dev