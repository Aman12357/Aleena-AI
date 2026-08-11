@echo off
title Aleena AI Master Companion Launcher
echo ========================================================
echo  🚀 Starting Aleena AI Master Companion...
echo ========================================================
echo.
echo 1. Starting FastAPI Python Backend (Port 8765)...
start "Aleena Python Backend" /min cmd /c "python web_server.py"

timeout /t 3 /nobreak >nul

echo 2. Starting Next.js Web Companion Frontend (Port 3000)...
start "Aleena Next.js Frontend" /min cmd /c "cd web && npm run dev"

echo.
echo ========================================================
echo  ✅ Aleena AI Servers Started!
echo  
echo  📱 Web App Access: http://localhost:3000
echo  ⚙️ Backend API:    http://localhost:8765
echo ========================================================
echo.
pause
