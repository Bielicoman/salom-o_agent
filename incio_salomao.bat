@echo off
title CÉREBRO SALOMÃO v6.8
echo ===================================================
echo   INICIANDO O AGENTE SALOMÃO (V6.8 ULTRA MASTER)
echo ===================================================
if not exist "downloads" mkdir downloads

echo Iniciando Backend (FastAPI)...
start "Salomao Backend" cmd /k "cd backend && ..\venv\Scripts\activate && uvicorn main:app --reload --port 8000"

timeout /t 3 /nobreak >nul

echo Iniciando Frontend (Interface Web Cinematografica)...
start "Salomao Frontend" cmd /k "cd frontend && npm run dev"

echo Iniciando WhatsApp Microservice...
start "WhatsApp Bot" cmd /k "cd whatsapp && node bot.js"

echo.
echo ===================================================
echo Todos os modulos foram iniciados em segundo plano! 
echo ===================================================
echo 1. A interface Web abrira no seu navegador ou acesse http://localhost:5173.
echo 2. Para conectar o WhatsApp, abra a janela CMD chamada "WhatsApp Bot", aguarde o QR Code e escaneie.
echo.
pause
