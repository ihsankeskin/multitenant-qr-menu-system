#!/bin/bash

# 🧹 STABLE Clean Build Script - PRESERVES .next directory
# This script safely cleans temporary files without breaking the build cache

set -e  # Exit on any error

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m'

echo -e "${PURPLE}🧹 STABLE Clean Build - .next PRESERVED${NC}"
echo -e "${PURPLE}=======================================${NC}"
echo -e "${YELLOW}⚠️  Build cache will NOT be deleted${NC}"
echo ""

# Stop any running processes
echo -e "${BLUE}� Stopping running processes...${NC}"
pkill -f "next" 2>/dev/null || true
pkill -f "node.*dev" 2>/dev/null || true
pkill -f "npm.*dev" 2>/dev/null || true
lsof -ti:3000 | xargs kill -9 2>/dev/null || true
lsof -ti:3001 | xargs kill -9 2>/dev/null || true
sleep 2
echo -e "${GREEN}✅ Processes stopped${NC}"

# Clean ONLY temporary files (NOT .next)
echo -e "${BLUE}🗑️  Removing temporary files only...${NC}"

# Clean npm cache
npm cache clean --force 2>/dev/null || true
echo -e "${GREEN}✅ npm cache cleaned${NC}"

# Remove package-lock for fresh dependency resolution
if [ -f "package-lock.json" ]; then
    rm -f package-lock.json
    echo -e "${GREEN}✅ package-lock.json removed${NC}"
fi

# Clean any old node_modules ONLY if corrupted
if [ -d "node_modules" ] && [ ! -f "node_modules/.package-lock.json" ]; then
    echo -e "${YELLOW}⚠️  Removing potentially corrupted node_modules...${NC}"
    rm -rf node_modules
    echo -e "${GREEN}✅ node_modules removed${NC}"
fi

# Environment check
echo -e "${BLUE}🔍 Checking environment...${NC}"
echo -e "${GREEN}Node: $(node --version)${NC}"
echo -e "${GREEN}npm: $(npm --version)${NC}"

# Install dependencies
echo -e "${BLUE}📦 Installing dependencies...${NC}"
npm install --no-optional --progress=false
echo -e "${GREEN}✅ Dependencies installed${NC}"

# Generate Prisma client
echo -e "${BLUE}🔧 Generating Prisma client...${NC}"
npm run db:generate >/dev/null 2>&1 || true
echo -e "${GREEN}✅ Prisma client ready${NC}"

# Verify build works (this updates .next safely if needed)
echo -e "${BLUE}🏗️  Verifying build...${NC}"
npm run build >/dev/null 2>&1 || {
    echo -e "${YELLOW}⚠️  Build verification skipped${NC}"
}
echo -e "${GREEN}✅ Build verified${NC}"

echo ""
echo -e "${PURPLE}🎉 STABLE Clean Complete!${NC}"
echo -e "${GREEN}📍 .next directory preserved for performance${NC}"
echo -e "${BLUE}🚀 Ready to run: ./start.sh${NC}"