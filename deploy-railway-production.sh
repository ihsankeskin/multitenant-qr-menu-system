#!/bin/bash

# =====================================================
# The Menu Genie - Production Deployment to Railway
# Domain: https://themenugenie.com
# =====================================================

set -e  # Exit on any error

echo "🚀 Starting deployment to Railway..."
echo "===================================="

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo -e "${YELLOW}⚠️  Railway CLI not found. Installing...${NC}"
    npm install -g @railway/cli
fi

# Step 1: Pre-deployment checks
echo -e "\n${BLUE}📋 Step 1: Pre-deployment checks...${NC}"

# Check Node version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo -e "${RED}❌ Error: Node.js 18+ is required. Current: $(node -v)${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Node.js version: $(node -v)${NC}"

# Check for required files
required_files=("package.json" "next.config.production.js" "railway-production.json" ".env.production.example")
for file in "${required_files[@]}"; do
    if [ ! -f "$file" ]; then
        echo -e "${RED}❌ Missing required file: $file${NC}"
        exit 1
    fi
done
echo -e "${GREEN}✅ All required files present${NC}"

# Step 2: Login to Railway
echo -e "\n${BLUE}🔐 Step 2: Logging in to Railway...${NC}"
railway whoami || railway login

# Step 3: Initialize Railway project (if needed)
echo -e "\n${BLUE}🏗️  Step 3: Initializing Railway project...${NC}"
if [ ! -f "railway.json" ]; then
    cp railway-production.json railway.json
    echo -e "${GREEN}✅ Railway config copied${NC}"
fi

# Check if project exists
if ! railway status &> /dev/null; then
    echo -e "${YELLOW}📦 Creating new Railway project...${NC}"
    railway init
    echo -e "${GREEN}✅ Railway project created${NC}"
else
    echo -e "${GREEN}✅ Railway project already initialized${NC}"
fi

# Step 4: Set up production database schema
echo -e "\n${BLUE}🗄️  Step 4: Setting up production database schema...${NC}"
if [ -f "prisma/schema-production.prisma" ]; then
    cp prisma/schema.prisma prisma/schema.prisma.backup
    cp prisma/schema-production.prisma prisma/schema.prisma
    echo -e "${GREEN}✅ Production schema activated${NC}"
else
    echo -e "${YELLOW}⚠️  schema-production.prisma not found, using existing schema${NC}"
fi

# Step 5: Set up PostgreSQL database
echo -e "\n${BLUE}🗄️  Step 5: Setting up PostgreSQL database...${NC}"
echo ""
echo "Add PostgreSQL to your Railway project:"
echo "  1. Go to Railway dashboard: https://railway.app/dashboard"
echo "  2. Click on your project"
echo "  3. Click 'New' → 'Database' → 'Add PostgreSQL'"
echo "  4. Railway will automatically set DATABASE_URL"
echo ""

# Step 6: Configure environment variables
echo -e "\n${BLUE}⚙️  Step 6: Configuring environment variables...${NC}"
echo ""
echo "Set the following environment variables in Railway:"
echo "  railway variables set NODE_ENV=production"
echo "  railway variables set NEXT_PUBLIC_APP_URL=https://themenugenie.com"
echo "  railway variables set NEXT_PUBLIC_API_URL=https://themenugenie.com/api"
echo "  railway variables set NEXT_PUBLIC_SUPER_ADMIN_URL=https://themenugenie.com/super-admin"
echo "  railway variables set JWT_SECRET=your-secure-secret-key"
echo "  railway variables set DEFAULT_SUPER_ADMIN_EMAIL=admin@themenugenie.com"
echo "  railway variables set DEFAULT_SUPER_ADMIN_PASSWORD=your-secure-password"
echo "  railway variables set BCRYPT_ROUNDS=12"
echo "  railway variables set JWT_EXPIRES_IN=24h"
echo ""

read -p "Have you configured PostgreSQL and environment variables? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}⚠️  Please configure database and environment variables first.${NC}"
    echo ""
    echo "Quick setup commands:"
    echo "  railway add                                                    # Add PostgreSQL"
    echo "  railway variables set NODE_ENV=production"
    echo "  railway variables set NEXT_PUBLIC_APP_URL=https://themenugenie.com"
    echo "  railway variables set JWT_SECRET=\$(openssl rand -base64 32)"
    echo ""
    exit 1
fi

# Step 7: Use production config
echo -e "\n${BLUE}⚙️  Step 7: Switching to production configuration...${NC}"
if [ -f "next.config.production.js" ]; then
    cp next.config.js next.config.js.backup
    cp next.config.production.js next.config.js
    echo -e "${GREEN}✅ Production Next.js config activated${NC}"
fi

# Step 8: Test build locally
echo -e "\n${BLUE}🏗️  Step 8: Testing production build...${NC}"
npm ci
npx prisma generate
npm run build

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Build successful${NC}"
else
    echo -e "${RED}❌ Build failed. Please fix errors before deploying.${NC}"
    # Restore backups
    [ -f "prisma/schema.prisma.backup" ] && mv prisma/schema.prisma.backup prisma/schema.prisma
    [ -f "next.config.js.backup" ] && mv next.config.js.backup next.config.js
    exit 1
fi

# Step 9: Deploy to Railway
echo -e "\n${BLUE}🚀 Step 9: Deploying to Railway...${NC}"
railway up

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Deployment successful${NC}"
else
    echo -e "${RED}❌ Deployment failed${NC}"
    exit 1
fi

# Step 10: Run database migrations
echo -e "\n${BLUE}🗄️  Step 10: Running database migrations...${NC}"
echo ""
echo "Run migrations using Railway CLI:"
echo "  railway run npx prisma migrate deploy"
echo ""
read -p "Run migrations now? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    railway run npx prisma migrate deploy
    echo -e "${GREEN}✅ Migrations completed${NC}"
fi

# Step 11: Seed database (optional)
echo -e "\n${BLUE}🌱 Step 11: Seed database (optional)...${NC}"
read -p "Seed database with initial data? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    railway run npm run db:seed
    echo -e "${GREEN}✅ Database seeded${NC}"
fi

# Step 12: Post-deployment tasks
echo -e "\n${BLUE}✨ Step 12: Post-deployment tasks...${NC}"

# Restore backup files
echo "Restoring backup configurations..."
[ -f "prisma/schema.prisma.backup" ] && mv prisma/schema.prisma.backup prisma/schema.prisma
[ -f "next.config.js.backup" ] && mv next.config.js.backup next.config.js

echo -e "${GREEN}✅ Backup configurations restored${NC}"

# Step 13: Get deployment URL
echo -e "\n${BLUE}🌍 Step 13: Getting deployment URL...${NC}"
RAILWAY_URL=$(railway status 2>/dev/null | grep -oP '(?<=URL: ).*' || echo "")

if [ -n "$RAILWAY_URL" ]; then
    echo -e "${GREEN}✅ Deployment URL: $RAILWAY_URL${NC}"
else
    echo -e "${YELLOW}⚠️  Could not retrieve deployment URL. Check Railway dashboard.${NC}"
fi

# Step 14: Domain configuration
echo -e "\n${BLUE}🌐 Step 14: Domain Configuration${NC}"
echo "=================================="
echo ""
echo "Configure your custom domain:"
echo "  1. Go to Railway dashboard"
echo "  2. Click on your project → Settings → Domains"
echo "  3. Add custom domain: themenugenie.com"
echo "  4. Copy the CNAME record provided by Railway"
echo "  5. Add the CNAME record to your domain DNS settings:"
echo ""
echo "     Type: CNAME"
echo "     Name: @"
echo "     Value: [Railway provides this]"
echo ""
echo "     Type: CNAME"
echo "     Name: www"
echo "     Value: [Railway provides this]"
echo ""

# Success message
echo ""
echo "=================================="
echo -e "${GREEN}🎉 Deployment Complete!${NC}"
echo "=================================="
echo ""
echo "Your application is deployed!"
echo -e "${BLUE}Railway URL: $RAILWAY_URL${NC}"
echo -e "${BLUE}Custom Domain: https://themenugenie.com (after DNS configuration)${NC}"
echo ""
echo "Next steps:"
echo "  1. ✅ Configure custom domain in Railway dashboard"
echo "  2. ✅ Update DNS records at your domain registrar"
echo "  3. ✅ Wait for DNS propagation (5-30 minutes)"
echo "  4. ✅ Verify deployment: https://themenugenie.com"
echo "  5. ✅ Test super admin login"
echo "  6. ✅ Change default admin password"
echo "  7. ✅ Test all features"
echo "  8. ✅ Configure email SMTP (optional)"
echo "  9. ✅ Set up monitoring"
echo ""
echo "Useful commands:"
echo "  railway logs                    # View deployment logs"
echo "  railway status                  # Check deployment status"
echo "  railway variables               # List environment variables"
echo "  railway run [command]           # Run command in Railway environment"
echo "  railway up                      # Deploy again"
echo ""
echo -e "${GREEN}Happy hosting! 🚀${NC}"
