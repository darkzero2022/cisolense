#!/bin/bash
# CISOLens — One-time GitHub repo setup script
# Usage: bash setup-repo.sh YOUR_GITHUB_USERNAME

set -e

USERNAME=${1:-"YOUR_GITHUB_USERNAME"}
REPO="cisolens"

echo ""
echo "🚀 CISOLens — GitHub Repository Setup"
echo "======================================"
echo ""

# 1. Git init
echo "1. Initialising git..."
git init
git checkout -b main

# 2. Create backend .env from example
echo "2. Setting up backend .env..."
if [ ! -f backend/.env ]; then
  cp backend/.env.example backend/.env
  # Generate random secrets inline
  ACCESS_SECRET=$(node -e "console.log(require('crypto').randomBytes(64).toString('base64'))")
  REFRESH_SECRET=$(node -e "console.log(require('crypto').randomBytes(64).toString('base64'))")
  sed -i "s/replace_with_random_64_char_secret/$ACCESS_SECRET/" backend/.env
  sed -i "s/replace_with_another_random_64_char_secret/$REFRESH_SECRET/" backend/.env
  echo "   ✅ backend/.env created with generated secrets"
else
  echo "   ⚠️  backend/.env already exists — skipping"
fi

# 3. Create frontend .env
echo "3. Setting up frontend .env..."
if [ ! -f frontend/.env ]; then
  echo "VITE_API_URL=http://localhost:3001/api" > frontend/.env
  echo "   ✅ frontend/.env created"
fi

# 4. Initial commit
echo "4. Creating initial commit..."
git add .
git commit -m "feat: initial CISOLens scaffold

- Full multi-tenant schema (Platform Admin > vCISO > Client Org)
- HttpOnly JWT auth with refresh token rotation
- NIST CSF 2.0 assessment engine with scoring service
- Client org CRUD with framework assignment
- Auto-generated remediation actions from low scores
- React 19 + TypeScript + Vite frontend
- Dashboard, Clients, Assessment flow, Results, Actions kanban
- Recharts radar graph for posture visualisation"

# 5. Create GitHub repo and push
echo ""
echo "5. Creating GitHub repository..."
echo ""
echo "   Option A — GitHub CLI (recommended):"
echo "   gh repo create $USERNAME/$REPO --private --push --source=."
echo ""
echo "   Option B — Manual:"
echo "   1. Go to https://github.com/new"
echo "   2. Name: $REPO | Private | No README (we have one)"
echo "   3. Then run:"
echo "      git remote add origin https://github.com/$USERNAME/$REPO.git"
echo "      git push -u origin main"
echo ""
echo "======================================"
echo "✅ Local repo ready!"
echo ""
echo "Next steps:"
echo "  cd backend && npm install && npx prisma migrate dev --name init && npm run db:seed"
echo "  cd frontend && npm install"
echo "  # Open two terminals:"
echo "  cd backend && npm run dev     # → http://localhost:3001"
echo "  cd frontend && npm run dev    # → http://localhost:5173"
echo ""
echo "  Login: khaled@cisolens.io / Demo1234!"
echo ""
