#!/bin/bash

# =====================================================
# The Menu Genie - Production Deployment to Vercel
# Domain: https://themenugenie.com
# =====================================================

set -e  # Exit on any error

echo "🚀 Starting deployment to Vercel..."
echo "=================================="

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo -e "${YELLOW}⚠️  Vercel CLI not found. Installing...${NC}"
    npm install -g vercel
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
required_files=("package.json" "next.config.production.js" "vercel-production.json" ".env.production.example")
for file in "${required_files[@]}"; do
    if [ ! -f "$file" ]; then
        echo -e "${RED}❌ Missing required file: $file${NC}"
        exit 1
    fi
done
echo -e "${GREEN}✅ All required files present${NC}"

# Step 2: Clean build
echo -e "\n${BLUE}🧹 Step 2: Cleaning previous builds...${NC}"
rm -rf .next
rm -rf node_modules/.cache
echo -e "${GREEN}✅ Clean completed${NC}"

# Step 3: Install dependencies
echo -e "\n${BLUE}📦 Step 3: Installing dependencies...${NC}"
npm ci
echo -e "${GREEN}✅ Dependencies installed${NC}"

# Step 4: Use production schema
echo -e "\n${BLUE}🗄️  Step 4: Setting up production database schema...${NC}"
if [ -f "prisma/schema-production.prisma" ]; then
    cp prisma/schema.prisma prisma/schema.prisma.backup
    cp prisma/schema-production.prisma prisma/schema.prisma
    echo -e "${GREEN}✅ Production schema activated${NC}"
else
    echo -e "${YELLOW}⚠️  schema-production.prisma not found, using existing schema${NC}"
fi

# Step 5: Generate Prisma Client
echo -e "\n${BLUE}🔧 Step 5: Generating Prisma Client...${NC}"
npx prisma generate
echo -e "${GREEN}✅ Prisma Client generated${NC}"

# Step 6: Use production config
echo -e "\n${BLUE}⚙️  Step 6: Switching to production configuration...${NC}"
if [ -f "next.config.production.js" ]; then
    cp next.config.js next.config.js.backup
    cp next.config.production.js next.config.js
    echo -e "${GREEN}✅ Production config activated${NC}"
fi

if [ -f "vercel-production.json" ]; then
    cp vercel.json vercel.json.backup 2>/dev/null || true
    cp vercel-production.json vercel.json
    echo -e "${GREEN}✅ Production Vercel config activated${NC}"
fi

# Step 7: Test build locally
echo -e "\n${BLUE}🏗️  Step 7: Testing production build...${NC}"
npm run build
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Build successful${NC}"
else
    echo -e "${RED}❌ Build failed. Please fix errors before deploying.${NC}"
    # Restore backups
    [ -f "prisma/schema.prisma.backup" ] && mv prisma/schema.prisma.backup prisma/schema.prisma
    [ -f "next.config.js.backup" ] && mv next.config.js.backup next.config.js
    [ -f "vercel.json.backup" ] && mv vercel.json.backup vercel.json
    exit 1
fi

# Step 8: Deploy to Vercel
echo -e "\n${BLUE}🚀 Step 8: Deploying to Vercel...${NC}"
echo -e "${YELLOW}Note: Make sure you have set all environment variables in Vercel dashboard!${NC}"
echo ""
echo "Required environment variables:"
echo "  - DATABASE_URL"
echo "  - JWT_SECRET"
echo "  - NEXT_PUBLIC_APP_URL=https://themenugenie.com"
echo "  - NEXT_PUBLIC_API_URL=https://themenugenie.com/api"
echo "  - NEXT_PUBLIC_SUPER_ADMIN_URL=https://themenugenie.com/super-admin"
echo "  - DEFAULT_SUPER_ADMIN_EMAIL"
echo "  - DEFAULT_SUPER_ADMIN_PASSWORD"
echo ""

read -p "Have you configured all environment variables? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}⚠️  Please configure environment variables first:${NC}"
    echo "   vercel env add DATABASE_URL production"
    echo "   vercel env add JWT_SECRET production"
    echo "   (and all other required variables)"
    exit 1
fi

# Login to Vercel (if not already logged in)
echo -e "\n${BLUE}🔐 Logging in to Vercel...${NC}"
vercel whoami || vercel login

# Deploy to production
echo -e "\n${BLUE}🌐 Deploying to production (themenugenie.com)...${NC}"
vercel --prod

# Step 9: Post-deployment tasks
echo -e "\n${BLUE}✨ Step 9: Post-deployment tasks...${NC}"

# Restore backup files
echo "Restoring backup configurations..."
[ -f "prisma/schema.prisma.backup" ] && mv prisma/schema.prisma.backup prisma/schema.prisma
[ -f "next.config.js.backup" ] && mv next.config.js.backup next.config.js
[ -f "vercel.json.backup" ] && mv vercel.json.backup vercel.json

echo -e "${GREEN}✅ Backup configurations restored${NC}"

# Step 10: Domain configuration reminder
echo -e "\n${BLUE}🌍 Step 10: Domain Configuration${NC}"
echo "=================================="
echo ""
echo "Configure your domain DNS settings:"
echo "  1. Go to your domain registrar (e.g., Namecheap, GoDaddy)"
echo "  2. Add the following records:"
echo ""
echo "     Type: A"
echo "     Name: @"
echo "     Value: 76.76.21.21"
echo ""
echo "     Type: CNAME"
echo "     Name: www"
echo "     Value: cname.vercel-dns.com"
echo ""
echo "  3. In Vercel dashboard, add domain: themenugenie.com"
echo "  4. Verify domain ownership"
echo ""

# Success message
echo ""
echo "=================================="
echo -e "${GREEN}🎉 Deployment Complete!${NC}"
echo "=================================="
echo ""
echo "Your application is now live at:"
echo -e "${BLUE}https://themenugenie.com${NC}"
echo ""
echo "Next steps:"
echo "  1. ✅ Verify the deployment: https://themenugenie.com"
echo "  2. ✅ Test super admin login: https://themenugenie.com/super-admin/login"
echo "  3. ✅ Change default admin password immediately"
echo "  4. ✅ Test menu creation and QR code generation"
echo "  5. ✅ Configure custom domain in Vercel (if not done)"
echo "  6. ✅ Set up SSL certificate (auto by Vercel)"
echo "  7. ✅ Configure email SMTP settings"
echo "  8. ✅ Enable monitoring and analytics"
echo ""
echo "Useful commands:"
echo "  vercel logs --prod              # View production logs"
echo "  vercel env ls --prod            # List environment variables"
echo "  vercel domains ls               # List configured domains"
echo "  vercel --prod                   # Deploy again"
echo ""
echo -e "${GREEN}Happy hosting! 🚀${NC}"
