#!/bin/bash

# ================================
# Vercel Postgres Setup Script
# ================================

set -e

echo "🚀 Setting up Vercel Postgres for The Menu Genie"
echo "================================================"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if .credentials.txt exists
if [ ! -f .credentials.txt ]; then
    echo -e "${RED}❌ Error: .credentials.txt not found${NC}"
    echo "Please run setup-production.sh first to generate credentials"
    exit 1
fi

echo ""
echo -e "${BLUE}Step 1: Creating Vercel Postgres Database${NC}"
echo "============================================="
echo ""
echo "Please follow these steps in your browser:"
echo ""
echo "1. Go to: https://vercel.com/waseemghaly-progressiosos-projects/themenugenie"
echo "2. Click on 'Storage' tab"
echo "3. Click 'Create Database'"
echo "4. Select 'Postgres'"
echo "5. Choose a region close to your users (e.g., Washington D.C. - iad1)"
echo "6. Click 'Create'"
echo ""
echo -e "${YELLOW}⏳ Waiting for you to create the database...${NC}"
echo ""
read -p "Press ENTER once you've created the Postgres database..."

echo ""
echo -e "${GREEN}✓ Database created!${NC}"
echo ""

echo -e "${BLUE}Step 2: Linking Database to Project${NC}"
echo "====================================="
echo ""
echo "The database should automatically be linked to your project."
echo "Vercel will automatically add these environment variables:"
echo "  - POSTGRES_URL"
echo "  - POSTGRES_PRISMA_URL"
echo "  - POSTGRES_URL_NON_POOLING"
echo ""

echo -e "${BLUE}Step 3: Adding Additional Environment Variables${NC}"
echo "================================================"
echo ""
echo "Now we need to add the remaining environment variables."
echo ""

# Read credentials from file
JWT_SECRET=$(grep "JWT_SECRET=" .credentials.txt | cut -d'=' -f2)
ADMIN_EMAIL=$(grep "SUPER_ADMIN_EMAIL=" .credentials.txt | cut -d'=' -f2)
ADMIN_PASSWORD_HASH=$(grep "SUPER_ADMIN_PASSWORD_HASH=" .credentials.txt | cut -d'=' -f2)

echo "I'll now set the environment variables using Vercel CLI..."
echo ""

# Set environment variables
echo -e "${YELLOW}Setting JWT_SECRET...${NC}"
echo "$JWT_SECRET" | vercel env add JWT_SECRET production

echo -e "${YELLOW}Setting SUPER_ADMIN_EMAIL...${NC}"
echo "$ADMIN_EMAIL" | vercel env add SUPER_ADMIN_EMAIL production

echo -e "${YELLOW}Setting SUPER_ADMIN_PASSWORD_HASH...${NC}"
echo "$ADMIN_PASSWORD_HASH" | vercel env add SUPER_ADMIN_PASSWORD_HASH production

echo -e "${YELLOW}Setting NEXT_PUBLIC_APP_URL...${NC}"
echo "https://themenugenie.com" | vercel env add NEXT_PUBLIC_APP_URL production

echo -e "${YELLOW}Setting NEXT_PUBLIC_API_URL...${NC}"
echo "https://themenugenie.com/api" | vercel env add NEXT_PUBLIC_API_URL production

echo -e "${YELLOW}Setting NEXT_PUBLIC_SUPER_ADMIN_URL...${NC}"
echo "https://themenugenie.com/super-admin" | vercel env add NEXT_PUBLIC_SUPER_ADMIN_URL production

echo ""
echo -e "${GREEN}✓ Environment variables set!${NC}"
echo ""

echo -e "${BLUE}Step 4: Preparing Database Schema${NC}"
echo "==================================="
echo ""
echo "We need to use the PostgreSQL schema for production..."

# Backup current schema
cp prisma/schema.prisma prisma/schema.prisma.local.backup

# Use production schema
if [ -f prisma/schema-production.prisma ]; then
    cp prisma/schema-production.prisma prisma/schema.prisma
    echo -e "${GREEN}✓ Switched to PostgreSQL schema${NC}"
else
    echo -e "${YELLOW}⚠ Production schema not found, updating current schema...${NC}"
    # Update datasource in schema
    sed -i '' 's/provider = "sqlite"/provider = "postgresql"/' prisma/schema.prisma
fi

echo ""
echo -e "${BLUE}Step 5: Getting Database Connection String${NC}"
echo "==========================================="
echo ""
echo "We need to get your database connection string from Vercel."
echo ""
echo "Run this command in another terminal:"
echo ""
echo -e "${YELLOW}vercel env pull .env.production.local${NC}"
echo ""
read -p "Press ENTER once you've pulled the environment variables..."

if [ -f .env.production.local ]; then
    # Extract DATABASE_URL
    DATABASE_URL=$(grep "POSTGRES_PRISMA_URL=" .env.production.local | cut -d'=' -f2-)
    
    if [ -n "$DATABASE_URL" ]; then
        echo ""
        echo -e "${GREEN}✓ Database URL found!${NC}"
        echo ""
        
        # Create temporary .env for migrations
        echo "DATABASE_URL=$DATABASE_URL" > .env.temp
        
        echo -e "${BLUE}Step 6: Running Database Migrations${NC}"
        echo "====================================="
        echo ""
        
        # Generate Prisma Client
        echo "Generating Prisma Client..."
        npx prisma generate
        
        # Run migrations
        echo ""
        echo "Running migrations..."
        DATABASE_URL="$DATABASE_URL" npx prisma migrate deploy
        
        echo ""
        echo -e "${GREEN}✓ Migrations completed!${NC}"
        
        # Clean up
        rm .env.temp
        
        echo ""
        echo -e "${BLUE}Step 7: Seeding Database${NC}"
        echo "========================"
        echo ""
        echo "Do you want to seed the database with initial data?"
        read -p "Seed database? (y/n): " -n 1 -r
        echo ""
        
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            DATABASE_URL="$DATABASE_URL" npx prisma db seed
            echo -e "${GREEN}✓ Database seeded!${NC}"
        else
            echo "Skipping database seeding."
        fi
        
    else
        echo -e "${RED}❌ Could not find POSTGRES_PRISMA_URL in .env.production.local${NC}"
        exit 1
    fi
else
    echo -e "${RED}❌ .env.production.local not found${NC}"
    echo "Please run: vercel env pull .env.production.local"
    exit 1
fi

echo ""
echo -e "${BLUE}Step 8: Triggering Redeployment${NC}"
echo "================================"
echo ""
echo "Now we need to redeploy with the new environment variables..."
echo ""

vercel --prod

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}   ✓ Setup Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "Your application is now deployed with Vercel Postgres!"
echo ""
echo "📝 Important Information:"
echo "------------------------"
echo ""
echo "1. Production URL:"
echo "   https://themenugenie.com (once DNS is configured)"
echo "   or your Vercel URL: https://themenugenie-xxxxx.vercel.app"
echo ""
echo "2. Super Admin Login:"
echo "   Email: $ADMIN_EMAIL"
echo "   Password: Check .credentials.txt file"
echo ""
echo "3. Next Steps:"
echo "   - Configure your domain DNS in Vercel dashboard"
echo "   - Test super admin login"
echo "   - Change default admin password"
echo "   - Create your first tenant"
echo ""
echo "4. Database Management:"
echo "   - View in Vercel Dashboard: https://vercel.com/waseemghaly-progressiosos-projects/themenugenie/stores"
echo "   - Use Prisma Studio: npx prisma studio"
echo ""
echo -e "${YELLOW}⚠ Remember to restore local schema if needed:${NC}"
echo "   cp prisma/schema.prisma.local.backup prisma/schema.prisma"
echo ""
echo -e "${GREEN}Happy deploying! 🚀${NC}"
echo ""
