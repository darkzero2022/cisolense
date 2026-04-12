#!/bin/bash
# CISOLens — Start Script
# Starts backend (port 3001) and frontend (port 5173) concurrently
# Usage: bash start.sh

CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo ""
echo -e "${CYAN}╔══════════════════════════════════════╗${NC}"
echo -e "${CYAN}║       CISOLens — Starting            ║${NC}"
echo -e "${CYAN}╚══════════════════════════════════════╝${NC}"
echo ""

# Check .env exists
if [ ! -f backend/.env ]; then
  echo -e "${YELLOW}⚠ backend/.env not found. Run: bash setup.sh${NC}"
  exit 1
fi

echo -e "  ${CYAN}Backend${NC}  → http://localhost:3001"
echo -e "  ${CYAN}Frontend${NC} → http://localhost:5173"
echo ""
echo -e "  ${YELLOW}Press Ctrl+C to stop both servers${NC}"
echo ""

# Trap Ctrl+C to kill both child processes
cleanup() {
  echo ""
  echo -e "${YELLOW}Stopping servers...${NC}"
  kill "$BACKEND_PID" "$FRONTEND_PID" 2>/dev/null
  wait "$BACKEND_PID" "$FRONTEND_PID" 2>/dev/null
  echo -e "${GREEN}Done.${NC}"
  exit 0
}
trap cleanup INT TERM

# Start backend
(cd backend && npm run dev) &
BACKEND_PID=$!

# Give backend a moment to bind
sleep 2

# Start frontend
(cd frontend && npm run dev) &
FRONTEND_PID=$!

wait "$BACKEND_PID" "$FRONTEND_PID"
