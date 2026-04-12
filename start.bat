@echo off
REM CISOLens — Start Script (Windows)
REM Starts backend (port 3001) and frontend (port 5173) in separate windows
REM Usage: start.bat

echo.
echo  ======================================
echo        CISOLens -- Starting
echo  ======================================
echo.

IF NOT EXIST backend\.env (
  echo  WARNING: backend\.env not found. Run setup.bat first.
  exit /b 1
)

echo   Backend  --^> http://localhost:3001
echo   Frontend --^> http://localhost:5173
echo.
echo   Two terminal windows will open.
echo   Close both to stop the servers.
echo.

REM Start backend in a new window
start "CISOLens Backend" cmd /k "cd /d %~dp0backend && npm run dev"

REM Give backend a moment to start
timeout /t 2 /nobreak >nul

REM Start frontend in a new window
start "CISOLens Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"

echo   Servers started in separate windows.
echo.
