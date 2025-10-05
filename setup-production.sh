#!/bin/bash

# =====================================================
# The Menu Genie - Quick Production Setup
# Generate secure credentials and prepare for deployment
# =====================================================

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "🧞 The Menu Genie - Production Setup Wizard"
echo "=========================================="
echo ""

# Step 1: Check prerequisites
echo -e "${BLUE}📋 Checking prerequisites...${NC}"

if ! command -v openssl &> /dev/null; then
    echo -e "${YELLOW}⚠️  OpenSSL not found. Some features may not work.${NC}"
else
    echo -e "${GREEN}✅ OpenSSL found${NC}"
fi

if ! command -v node &> /dev/null; then
    echo -e "${YELLOW}⚠️  Node.js not found. Please install Node.js 18+${NC}"
    exit 1
else
    echo -e "${GREEN}✅ Node.js found: $(node -v)${NC}"
fi

# Step 2: Generate secure credentials
echo ""
echo -e "${BLUE}🔐 Generating secure credentials...${NC}"

JWT_SECRET=$(openssl rand -base64 32 2>/dev/null || cat /dev/urandom | LC_ALL=C tr -dc 'a-zA-Z0-9' | fold -w 32 | head -n 1)
ADMIN_PASSWORD=$(openssl rand -base64 16 2>/dev/null || cat /dev/urandom | LC_ALL=C tr -dc 'a-zA-Z0-9!@#$%' | fold -w 16 | head -n 1)

echo -e "${GREEN}✅ JWT Secret generated${NC}"
echo -e "${GREEN}✅ Admin password generated${NC}"

# Step 3: Create production environment file
echo ""
echo -e "${BLUE}📝 Creating production environment file...${NC}"

cat > .env.production << EOF
# ================================
# The Menu Genie - Production Environment
# Generated: $(date)
# ================================

# IMPORTANT: Update DATABASE_URL with your actual database credentials!
DATABASE_URL="postgresql://username:password@hostname:5432/themenugenie_production?schema=public&sslmode=require"

# Security (Auto-generated - Keep these secret!)
JWT_SECRET="$JWT_SECRET"
JWT_EXPIRES_IN="24h"
JWT_REFRESH_EXPIRES_IN="7d"
BCRYPT_ROUNDS="12"

# Application URLs (Update after deploying)
NEXT_PUBLIC_APP_URL="https://themenugenie.com"
NEXT_PUBLIC_API_URL="https://themenugenie.com/api"
NEXT_PUBLIC_SUPER_ADMIN_URL="https://themenugenie.com/super-admin"

# Super Admin Credentials (CHANGE AFTER FIRST LOGIN!)
DEFAULT_SUPER_ADMIN_EMAIL="admin@themenugenie.com"
DEFAULT_SUPER_ADMIN_PASSWORD="$ADMIN_PASSWORD"

# Image Upload
MAX_IMAGE_SIZE_MB="5"
ALLOWED_IMAGE_TYPES="image/jpeg,image/png,image/webp,image/gif"

# Email Configuration (Optional - Update with your SMTP details)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_SECURE="false"
SMTP_USER="noreply@themenugenie.com"
SMTP_PASS="your-app-password-here"
FROM_EMAIL="noreply@themenugenie.com"
FROM_NAME="The Menu Genie"

# Security
ALLOWED_ORIGINS="https://themenugenie.com,https://www.themenugenie.com"
RATE_LIMIT_MAX="100"
RATE_LIMIT_WINDOW="15"

# Production Settings
NODE_ENV="production"
NEXT_TELEMETRY_DISABLED="1"
EOF

echo -e "${GREEN}✅ .env.production created${NC}"

# Step 4: Save credentials securely
echo ""
echo -e "${BLUE}💾 Saving credentials to secure file...${NC}"

cat > .credentials.txt << EOF
============================================
The Menu Genie - Production Credentials
Generated: $(date)
============================================

🔐 KEEP THIS FILE SECURE AND DELETE AFTER SAVING TO PASSWORD MANAGER!

JWT Secret:
$JWT_SECRET

Super Admin Email:
admin@themenugenie.com

Super Admin Password:
$ADMIN_PASSWORD

Database URL (MUST UPDATE):
postgresql://username:password@hostname:5432/themenugenie_production?schema=public&sslmode=require

Application URLs:
- Main: https://themenugenie.com
- API: https://themenugenie.com/api
- Admin: https://themenugenie.com/super-admin

============================================
IMPORTANT NOTES:
============================================

1. UPDATE DATABASE_URL in .env.production with real credentials
2. CHANGE admin password after first login
3. NEVER commit .env.production or .credentials.txt to git
4. Store these credentials in a secure password manager
5. DELETE .credentials.txt after saving securely

============================================
EOF

chmod 600 .credentials.txt

echo -e "${GREEN}✅ Credentials saved to .credentials.txt${NC}"

# Step 5: Make deployment scripts executable
echo ""
echo -e "${BLUE}🔧 Making deployment scripts executable...${NC}"

chmod +x deploy-vercel-production.sh 2>/dev/null && echo -e "${GREEN}✅ deploy-vercel-production.sh${NC}" || echo -e "${YELLOW}⚠️  deploy-vercel-production.sh not found${NC}"
chmod +x deploy-railway-production.sh 2>/dev/null && echo -e "${GREEN}✅ deploy-railway-production.sh${NC}" || echo -e "${YELLOW}⚠️  deploy-railway-production.sh not found${NC}"

# Step 6: Display summary
echo ""
echo "=========================================="
echo -e "${GREEN}✅ Production Setup Complete!${NC}"
echo "=========================================="
echo ""
echo "📄 Files created:"
echo "   - .env.production (environment variables)"
echo "   - .credentials.txt (secure credentials backup)"
echo ""
echo "🔐 Your Credentials:"
echo "   Admin Email: admin@themenugenie.com"
echo "   Admin Password: $ADMIN_PASSWORD"
echo ""
echo -e "${YELLOW}⚠️  IMPORTANT NEXT STEPS:${NC}"
echo ""
echo "1. 📝 Save credentials from .credentials.txt to password manager"
echo "2. 🗑️  Delete .credentials.txt after saving: rm .credentials.txt"
echo "3. 🗄️  Update DATABASE_URL in .env.production with real database"
echo "4. 📧 Update SMTP settings in .env.production (optional)"
echo "5. 🚀 Choose deployment option:"
echo ""
echo "   Option A - Deploy to Vercel:"
echo "   $ ./deploy-vercel-production.sh"
echo ""
echo "   Option B - Deploy to Railway:"
echo "   $ ./deploy-railway-production.sh"
echo ""
echo "6. 🔒 Change admin password after first login!"
echo ""
echo "📖 Full guide: See PRODUCTION_DEPLOYMENT.md"
echo ""
echo -e "${GREEN}Happy deploying! 🚀${NC}"
