#!/bin/bash

# ================================
# Quick Production Setup Test
# Multi-Tenant QR Menu System
# ================================

echo "🚀 Quick Production Setup Test"
echo "=============================="

# Run production readiness check
echo "1️⃣ Running production readiness check..."
./verify-production.sh

if [ $? -eq 0 ]; then
    echo ""
    echo "2️⃣ Production setup appears ready!"
    echo ""
    echo "🎯 Choose your deployment option:"
    echo ""
    echo "A. Vercel (Recommended for Next.js)"
    echo "   - Optimized for Next.js applications"
    echo "   - Serverless functions"
    echo "   - Global CDN"
    echo "   - Custom domains"
    echo ""
    echo "B. Railway (Full-stack platform)"
    echo "   - Integrated PostgreSQL database"
    echo "   - Simple deployment"
    echo "   - Built-in monitoring"
    echo "   - Environment management"
    echo ""
    echo "C. Docker (Self-hosted)"
    echo "   - Full control over infrastructure"
    echo "   - Use provided Dockerfile"
    echo "   - Deploy anywhere"
    echo ""
    echo "📋 Before deploying, make sure you have:"
    echo "   ✅ Production database ready (PostgreSQL)"
    echo "   ✅ Environment variables configured"
    echo "   ✅ Domain name (optional)"
    echo "   ✅ Deployment platform account"
    echo ""
    echo "🔗 Quick commands:"
    echo "   Deploy to Vercel:  npm run deploy:vercel"
    echo "   Deploy to Railway: npm run deploy:railway" 
    echo "   Build for production: npm run build:prod"
    echo ""
    echo "📚 For detailed instructions, see DEPLOYMENT_GUIDE.md"
else
    echo ""
    echo "❌ Please fix the issues above before proceeding with deployment."
fi