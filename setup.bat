@echo off
REM CISOLens — Setup Script (Windows)
REM Installs all dependencies, configures .env, runs DB migrations and seed
REM Usage: setup.bat

echo.
echo  ======================================
echo        CISOLens -- Setup
echo  ======================================
echo.

REM ── 1. Node version check ─────────────────────────────────────────────────
echo [1/5] Checking Node.js...
node -v >nul 2>&1
IF ERRORLEVEL 1 (
  echo  ERROR: Node.js is not installed or not in PATH.
  echo  Download from: https://nodejs.org
  exit /b 1
)
FOR /F "tokens=*" %%i IN ('node -v') DO SET NODE_VER=%%i
echo  OK: Node.js %NODE_VER%

REM ── 2. Backend .env ───────────────────────────────────────────────────────
echo.
echo [2/5] Configuring backend environment...
IF NOT EXIST backend\.env (
  COPY backend\.env.example backend\.env >nul
  REM Generate secrets using Node crypto
  FOR /F "tokens=*" %%i IN ('node -e "process.stdout.write(require('crypto').randomBytes(64).toString('hex'))"') DO SET ACCESS_SECRET=%%i
  FOR /F "tokens=*" %%i IN ('node -e "process.stdout.write(require('crypto').randomBytes(64).toString('hex'))"') DO SET REFRESH_SECRET=%%i
  REM Use PowerShell to do the string replacement (sed not available natively on Windows)
  powershell -Command "(Get-Content backend\.env) -replace 'change-this-to-a-long-random-secret-in-production','%ACCESS_SECRET%' | Set-Content backend\.env"
  powershell -Command "(Get-Content backend\.env) -replace 'change-this-too-different-from-above','%REFRESH_SECRET%' | Set-Content backend\.env"
  echo  OK: backend\.env created with generated secrets
) ELSE (
  echo  SKIP: backend\.env already exists
)

REM ── 3. Install dependencies ───────────────────────────────────────────────
echo.
echo [3/5] Installing dependencies...
echo   Backend...
cd backend
CALL npm install --silent
IF ERRORLEVEL 1 ( echo  ERROR: Backend npm install failed & cd .. & exit /b 1 )
echo   OK: Backend dependencies installed
cd ..
echo   Frontend...
cd frontend
CALL npm install --silent
IF ERRORLEVEL 1 ( echo  ERROR: Frontend npm install failed & cd .. & exit /b 1 )
echo   OK: Frontend dependencies installed
cd ..

REM ── 4. Database setup ─────────────────────────────────────────────────────
echo.
echo [4/5] Setting up database...
cd backend
CALL npx prisma migrate dev --name init
IF ERRORLEVEL 1 ( echo  ERROR: Prisma migration failed & cd .. & exit /b 1 )
echo   OK: Migrations applied
echo   Seeding demo data...
CALL npx tsx prisma/seed.ts
IF ERRORLEVEL 1 ( echo  ERROR: Seed failed & cd .. & exit /b 1 )
echo   OK: Database seeded
cd ..

REM ── 5. Done ───────────────────────────────────────────────────────────────
echo.
echo  ======================================
echo        Setup Complete!
echo  ======================================
echo.
echo   Demo credentials:
echo     Email:    khaled@cisolens.io
echo     Password: Demo1234!
echo.
echo   To start the application:
echo     start.bat
echo.
