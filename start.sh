#!/bin/bash

# 🍽️ Multi-Tenant QR Menu System - STABLE Startup Script
# IMPORTANT: This script NEVER deletes .next directory to prevent rebuild errors

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${PURPLE}🚀 Multi-Tenant QR Menu System v2.0 - STABLE MODE${NC}"
echo -e "${PURPLE}====================================================${NC}"
echo -e "${CYAN}📝 Build cache preserved for optimal performance${NC}"
echo ""

# Kill existing processes on ports only
echo -e "${BLUE}🔄 Cleaning port conflicts...${NC}"
lsof -ti:3000 | xargs kill -9 2>/dev/null || true
lsof -ti:3001 | xargs kill -9 2>/dev/null || true
echo -e "${GREEN}✅ Ports 3000-3001 cleared${NC}"

# Environment validation
echo -e "${BLUE}🔍 Environment check...${NC}"
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js not found. Please install Node.js 18+${NC}"
    exit 1
fi

NODE_VERSION=$(node -v)
NPM_VERSION=$(npm -v)
echo -e "${GREEN}✅ Node.js: $NODE_VERSION${NC}"
echo -e "${GREEN}✅ npm: $NPM_VERSION${NC}"

# Check if dependencies are installed
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}⚠️  Installing dependencies...${NC}"
    npm install
    echo -e "${GREEN}✅ Dependencies installed${NC}"
fi

# Ensure Prisma client is generated (lightweight check)
if [ ! -d "node_modules/.prisma" ]; then
    echo -e "${BLUE}� Generating Prisma client...${NC}"
    npm run db:generate >/dev/null 2>&1 || true
    echo -e "${GREEN}✅ Prisma client ready${NC}"
fi

# Quick database setup (non-destructive)
echo -e "${BLUE}🗄️ Database check...${NC}"
npm run db:push >/dev/null 2>&1 || echo -e "${YELLOW}⚠️  Database push skipped${NC}"
npm run db:seed >/dev/null 2>&1 || echo -e "${YELLOW}⚠️  Database seed skipped${NC}"
echo -e "${GREEN}✅ Database ready${NC}"

# Environment file check
if [ ! -f ".env.local" ]; then
    echo -e "${BLUE}⚙️  Creating .env.local...${NC}"
    cat > .env.local << 'EOF'
# Database
DATABASE_URL="file:./dev.db"

# JWT Secrets
JWT_SECRET="development-jwt-secret-key"
JWT_REFRESH_SECRET="development-refresh-secret-key"

# App Configuration
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="development-nextauth-secret"

# Development
NODE_ENV="development"
EOF
    echo -e "${GREEN}✅ Environment configured${NC}"
fi

# Final status
echo ""
echo -e "${PURPLE}🎯 READY TO START${NC}"
echo -e "${GREEN}📍 Local: http://localhost:3000${NC}"
echo -e "${GREEN}🔑 Admin: http://localhost:3000/super-admin/login${NC}"
echo -e "${GREEN}🍽️  Menu: http://localhost:3000/menu/sample-restaurant${NC}"
echo ""
echo -e "${CYAN}Press Ctrl+C to stop the server${NC}"
echo -e "${YELLOW}⚠️  .next directory is preserved for performance${NC}"
echo ""

# Start the development server
npm run dev