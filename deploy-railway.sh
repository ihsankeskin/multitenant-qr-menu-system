#!/bin/bash

# ================================
# Railway Deployment Script
# Multi-Tenant QR Menu System
# ================================

set -e

echo "🚂 Deploying to Railway..."

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "📦 Installing Railway CLI..."
    npm i -g @railway/cli
fi

# Login to Railway (if not already logged in)
echo "🔐 Checking Railway authentication..."
railway whoami || railway login

# Initialize Railway project (if not already initialized)
if [ ! -f "railway.toml" ]; then
    echo "🛠️ Initializing Railway project..."
    railway init
fi

# Set up environment variables
echo "⚙️ Setting up environment variables..."
echo "Configuring required environment variables..."

# Set NODE_ENV
railway variables set NODE_ENV=production

echo ""
echo "📋 Manual configuration required:"
echo "Please set the following variables using 'railway variables set KEY=VALUE':"
echo ""
echo "Required Variables:"
echo "- DATABASE_URL (PostgreSQL connection from Railway)"
echo "- JWT_SECRET (secure random string, min 32 chars)"
echo "- NEXT_PUBLIC_APP_URL (your Railway domain)"
echo ""
echo "Example commands:"
echo "railway variables set JWT_SECRET=\"$(openssl rand -hex 32)\""
echo "railway variables set NEXT_PUBLIC_APP_URL=\"https://your-app.railway.app\""
echo ""

read -p "Have you configured all environment variables? (y/n): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Please configure environment variables first"
    echo "💡 Use: railway variables set KEY=VALUE"
    exit 1
fi

# Deploy to Railway
echo "🚀 Starting deployment..."
railway up

echo ""
echo "🎉 Deployment completed!"
echo ""
echo "📋 Post-deployment checklist:"
echo "   ✓ Check deployment logs: railway logs"
echo "   ✓ Test super admin login"
echo "   ✓ Create a test tenant"
echo "   ✓ Verify QR code generation"
echo "   ✓ Test menu display"
echo "   ✓ Check database connections"
echo ""
echo "🔗 Your application should be live at your Railway domain"
echo "💡 Get your domain: railway domain"