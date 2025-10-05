#!/bin/bash

# ================================
# Production Readiness Check
# Multi-Tenant QR Menu System
# ================================

set -e

echo "🔍 Production Readiness Verification"
echo "=================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Track issues
ISSUES=0

# Check Node.js version
echo "📋 Checking Node.js version..."
NODE_VERSION=$(node -v | cut -d'v' -f2)
MAJOR_VERSION=$(echo $NODE_VERSION | cut -d'.' -f1)
if [ "$MAJOR_VERSION" -ge 18 ]; then
    echo -e "${GREEN}✅ Node.js $NODE_VERSION (OK)${NC}"
else
    echo -e "${RED}❌ Node.js $NODE_VERSION (Requires 18+)${NC}"
    ISSUES=$((ISSUES + 1))
fi

# Check npm version
echo "📦 Checking npm version..."
NPM_VERSION=$(npm -v)
echo -e "${GREEN}✅ npm $NPM_VERSION${NC}"

# Check package.json
echo "📄 Checking package.json..."
if [ -f "package.json" ]; then
    echo -e "${GREEN}✅ package.json exists${NC}"
    
    # Check for production scripts
    if grep -q "build:prod" package.json; then
        echo -e "${GREEN}✅ Production build script configured${NC}"
    else
        echo -e "${YELLOW}⚠️ Production build script missing${NC}"
    fi
    
    if grep -q "postinstall" package.json; then
        echo -e "${GREEN}✅ Postinstall script configured${NC}"
    else
        echo -e "${YELLOW}⚠️ Postinstall script missing${NC}"
    fi
else
    echo -e "${RED}❌ package.json not found${NC}"
    ISSUES=$((ISSUES + 1))
fi

# Check environment configuration
echo "⚙️ Checking environment configuration..."
if [ -f ".env.example" ]; then
    echo -e "${GREEN}✅ .env.example exists${NC}"
else
    echo -e "${RED}❌ .env.example missing${NC}"
    ISSUES=$((ISSUES + 1))
fi

if [ -f ".env.local" ]; then
    echo -e "${GREEN}✅ .env.local exists${NC}"
    
    # Check for required variables
    if grep -q "DATABASE_URL" .env.local; then
        echo -e "${GREEN}✅ DATABASE_URL configured${NC}"
    else
        echo -e "${RED}❌ DATABASE_URL missing${NC}"
        ISSUES=$((ISSUES + 1))
    fi
    
    if grep -q "JWT_SECRET" .env.local; then
        echo -e "${GREEN}✅ JWT_SECRET configured${NC}"
    else
        echo -e "${RED}❌ JWT_SECRET missing${NC}"
        ISSUES=$((ISSUES + 1))
    fi
    
    if grep -q "NEXT_PUBLIC_APP_URL" .env.local; then
        echo -e "${GREEN}✅ NEXT_PUBLIC_APP_URL configured${NC}"
    else
        echo -e "${YELLOW}⚠️ NEXT_PUBLIC_APP_URL missing${NC}"
    fi
else
    echo -e "${YELLOW}⚠️ .env.local not found (OK for production)${NC}"
fi

# Check Prisma configuration
echo "🗄️ Checking database configuration..."
if [ -f "prisma/schema.prisma" ]; then
    echo -e "${GREEN}✅ Prisma schema exists${NC}"
else
    echo -e "${RED}❌ Prisma schema missing${NC}"
    ISSUES=$((ISSUES + 1))
fi

if [ -f "prisma/schema-production.prisma" ]; then
    echo -e "${GREEN}✅ Production schema available${NC}"
else
    echo -e "${YELLOW}⚠️ Production schema missing${NC}"
fi

# Check deployment configurations
echo "🚀 Checking deployment configurations..."
if [ -f "vercel.json" ]; then
    echo -e "${GREEN}✅ Vercel configuration exists${NC}"
else
    echo -e "${YELLOW}⚠️ Vercel configuration missing${NC}"
fi

if [ -f "railway.json" ]; then
    echo -e "${GREEN}✅ Railway configuration exists${NC}"
else
    echo -e "${YELLOW}⚠️ Railway configuration missing${NC}"
fi

if [ -f "Dockerfile" ]; then
    echo -e "${GREEN}✅ Docker configuration exists${NC}"
else
    echo -e "${YELLOW}⚠️ Docker configuration missing${NC}"
fi

# Check deployment scripts
echo "📜 Checking deployment scripts..."
if [ -f "build-production.sh" ] && [ -x "build-production.sh" ]; then
    echo -e "${GREEN}✅ Production build script ready${NC}"
else
    echo -e "${RED}❌ Production build script missing or not executable${NC}"
    ISSUES=$((ISSUES + 1))
fi

if [ -f "deploy-vercel.sh" ] && [ -x "deploy-vercel.sh" ]; then
    echo -e "${GREEN}✅ Vercel deployment script ready${NC}"
else
    echo -e "${YELLOW}⚠️ Vercel deployment script missing or not executable${NC}"
fi

if [ -f "deploy-railway.sh" ] && [ -x "deploy-railway.sh" ]; then
    echo -e "${GREEN}✅ Railway deployment script ready${NC}"
else
    echo -e "${YELLOW}⚠️ Railway deployment script missing or not executable${NC}"
fi

# Check documentation
echo "📚 Checking documentation..."
if [ -f "DEPLOYMENT_GUIDE.md" ]; then
    echo -e "${GREEN}✅ Deployment guide exists${NC}"
else
    echo -e "${YELLOW}⚠️ Deployment guide missing${NC}"
fi

if [ -f "README.md" ]; then
    echo -e "${GREEN}✅ README exists${NC}"
else
    echo -e "${YELLOW}⚠️ README missing${NC}"
fi

# Check build dependencies
echo "🔧 Checking build readiness..."
if [ -d "node_modules" ]; then
    echo -e "${GREEN}✅ Dependencies installed${NC}"
else
    echo -e "${RED}❌ Dependencies not installed (run npm install)${NC}"
    ISSUES=$((ISSUES + 1))
fi

# Test build (optional)
echo "🏗️ Testing build process..."
echo "Do you want to test the build process? (y/n)"
read -r response
if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
    echo "Building application..."
    if npm run build > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Build successful${NC}"
    else
        echo -e "${RED}❌ Build failed${NC}"
        ISSUES=$((ISSUES + 1))
    fi
fi

# Security checks
echo "🔐 Security checks..."
if [ -f ".gitignore" ]; then
    if grep -q ".env" .gitignore; then
        echo -e "${GREEN}✅ Environment files ignored in git${NC}"
    else
        echo -e "${RED}❌ Environment files not ignored in git${NC}"
        ISSUES=$((ISSUES + 1))
    fi
else
    echo -e "${RED}❌ .gitignore missing${NC}"
    ISSUES=$((ISSUES + 1))
fi

# Final report
echo ""
echo "=================================="
echo "🎯 Production Readiness Report"
echo "=================================="

if [ $ISSUES -eq 0 ]; then
    echo -e "${GREEN}🎉 READY FOR PRODUCTION!${NC}"
    echo -e "${GREEN}✅ All critical checks passed${NC}"
    echo ""
    echo "🚀 Next steps:"
    echo "1. Choose deployment platform (Vercel or Railway)"
    echo "2. Configure production environment variables"
    echo "3. Set up production database"
    echo "4. Run deployment script"
    echo "5. Test production deployment"
else
    echo -e "${RED}❌ $ISSUES CRITICAL ISSUES FOUND${NC}"
    echo -e "${RED}Please fix the issues above before deploying${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}Happy deploying! 🚀${NC}"