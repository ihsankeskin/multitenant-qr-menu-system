#!/bin/bash

# ================================
# Vercel Deployment Script
# Multi-Tenant QR Menu System
# ================================

set -e

echo "🚀 Deploying to Vercel..."

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "📦 Installing Vercel CLI..."
    npm i -g vercel
fi

# Login to Vercel (if not already logged in)
echo "🔐 Checking Vercel authentication..."
vercel whoami || vercel login

# Set up environment variables
echo "⚙️ Setting up environment variables..."
echo "Please configure the following environment variables in Vercel dashboard:"
echo ""
echo "Required Variables:"
echo "- DATABASE_URL (PostgreSQL connection string)"
echo "- JWT_SECRET (secure random string, min 32 chars)"
echo "- NEXT_PUBLIC_APP_URL (your domain URL)"
echo ""
echo "Optional Variables:"
echo "- SMTP_* (email configuration)"
echo "- DEFAULT_SUPER_ADMIN_* (admin credentials)"
echo ""

read -p "Have you configured all environment variables in Vercel? (y/n): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Please configure environment variables first"
    echo "🔗 Go to: https://vercel.com/dashboard"
    exit 1
fi

# Deploy to Vercel
echo "🚀 Starting deployment..."
vercel --prod

echo ""
echo "🎉 Deployment completed!"
echo ""
echo "📋 Post-deployment checklist:"
echo "   ✓ Test super admin login"
echo "   ✓ Create a test tenant"
echo "   ✓ Verify QR code generation"
echo "   ✓ Test menu display"
echo "   ✓ Check database connections"
echo ""
echo "🔗 Your application should be live at your Vercel domain"