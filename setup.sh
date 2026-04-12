#!/bin/bash
# CISOLens — Setup Script
# Installs all dependencies, configures .env, runs DB migrations and seed
# Usage: bash setup.sh

set -e

CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo ""
echo -e "${CYAN}╔══════════════════════════════════════╗${NC}"
echo -e "${CYAN}║       CISOLens — Setup               ║${NC}"
echo -e "${CYAN}╚══════════════════════════════════════╝${NC}"
echo ""

# ── 1. Node version check ─────────────────────────────────────────────────────
echo -e "${CYAN}[1/5] Checking Node.js...${NC}"
NODE_VER=$(node -v 2>/dev/null | sed 's/v//')
NODE_MAJOR=$(echo "$NODE_VER" | cut -d. -f1)
if [ -z "$NODE_VER" ] || [ "$NODE_MAJOR" -lt 18 ]; then
  echo -e "${RED}✗ Node.js 18+ is required. Found: ${NODE_VER:-none}${NC}"
  echo "  Download from: https://nodejs.org"
  exit 1
fi
echo -e "${GREEN}✓ Node.js v${NODE_VER}${NC}"

# ── 2. Backend .env ───────────────────────────────────────────────────────────
echo ""
echo -e "${CYAN}[2/5] Configuring backend environment...${NC}"
if [ ! -f backend/.env ]; then
  cp backend/.env.example backend/.env
  # Generate random secrets
  ACCESS_SECRET=$(node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")
  REFRESH_SECRET=$(node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")
  if [[ "$OSTYPE" == "darwin"* ]]; then
    sed -i '' "s/change-this-to-a-long-random-secret-in-production/$ACCESS_SECRET/" backend/.env
    sed -i '' "s/change-this-too-different-from-above/$REFRESH_SECRET/" backend/.env
  else
    sed -i "s/change-this-to-a-long-random-secret-in-production/$ACCESS_SECRET/" backend/.env
    sed -i "s/change-this-too-different-from-above/$REFRESH_SECRET/" backend/.env
  fi
  echo -e "${GREEN}✓ backend/.env created with generated secrets${NC}"
else
  echo -e "${YELLOW}⚠ backend/.env already exists — skipping${NC}"
fi

# ── 3. Install dependencies ───────────────────────────────────────────────────
echo ""
echo -e "${CYAN}[3/5] Installing dependencies...${NC}"
echo "  → Backend..."
(cd backend && npm install --silent)
echo -e "${GREEN}  ✓ Backend dependencies installed${NC}"
echo "  → Frontend..."
(cd frontend && npm install --silent)
echo -e "${GREEN}  ✓ Frontend dependencies installed${NC}"

# ── 4. Database setup ─────────────────────────────────────────────────────────
echo ""
echo -e "${CYAN}[4/5] Setting up database...${NC}"
(cd backend && npx prisma migrate dev --name init 2>&1 | tail -5)
echo -e "${GREEN}  ✓ Migrations applied${NC}"
echo "  → Seeding demo data..."
(cd backend && npx tsx prisma/seed.ts)
echo -e "${GREEN}  ✓ Database seeded${NC}"

# ── 5. Done ───────────────────────────────────────────────────────────────────
echo ""
echo -e "${GREEN}╔══════════════════════════════════════╗${NC}"
echo -e "${GREEN}║       Setup Complete!                ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════╝${NC}"
echo ""
echo "  Demo credentials:"
echo -e "    Email:    ${CYAN}khaled@cisolens.io${NC}"
echo -e "    Password: ${CYAN}Demo1234!${NC}"
echo ""
echo "  To start the application:"
echo -e "    ${CYAN}bash start.sh${NC}"
echo ""
