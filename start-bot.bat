@echo off
echo ========================================
echo   NxrthStack Discord Bot Launcher
echo ========================================
echo.

:: Start the bot in a new window
echo Starting Discord Bot...
start "NxrthStack Bot" cmd /k "cd /d D:\Projects\nxrthstack\nxrthstack-bot && npm run dev"

:: Wait for bot to start
echo Waiting for bot to initialize...
timeout /t 3 /nobreak >nul

:: Start Cloudflare tunnel in a new window
echo Starting Cloudflare Tunnel...
start "Cloudflare Tunnel" cmd /k "cloudflared tunnel --url http://localhost:3001"

echo.
echo ========================================
echo   Both services started!
echo ========================================
echo.
echo IMPORTANT: Check the "Cloudflare Tunnel" window for your public URL.
echo Copy the URL and update DISCORD_BOT_API_URL in Vercel if it changed.
echo.
echo Press any key to close this window...
pause >nul
