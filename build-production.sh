#!/bin/bash

# ================================
# Production Build Script
# Multi-Tenant QR Menu System
# ================================

set -e

echo "🚀 Starting Production Build Process..."

# Check Node.js version
echo "📋 Checking Node.js version..."
node_version=$(node -v)
echo "✅ Node.js version: $node_version"

# Install dependencies
echo "📦 Installing production dependencies..."
npm ci --only=production

# Generate Prisma client with production schema
echo "🗄️ Generating Prisma client for production..."
if [ -f "prisma/schema-production.prisma" ]; then
    cp prisma/schema-production.prisma prisma/schema.prisma
    echo "✅ Using production database schema"
else
    echo "⚠️ Production schema not found, using default schema"
fi

npx prisma generate

# Run database migrations (only if SKIP_DB_MIGRATIONS is not set)
if [ -z "$SKIP_DB_MIGRATIONS" ]; then
    echo "🔄 Running database migrations..."
    npx prisma migrate deploy || echo "⚠️ Migration failed or no migrations to run"
else
    echo "⏭️ Skipping database migrations (SKIP_DB_MIGRATIONS is set)"
fi

# Build the application
echo "🏗️ Building Next.js application..."
npm run build

# Validate build
if [ -d ".next" ]; then
    echo "✅ Build completed successfully"
    echo "📊 Build size:"
    du -sh .next
else
    echo "❌ Build failed - .next directory not found"
    exit 1
fi

echo "🎉 Production build completed successfully!"
echo ""
echo "🔧 Environment Configuration Checklist:"
echo "   ✓ Set DATABASE_URL for PostgreSQL"
echo "   ✓ Set JWT_SECRET (min 32 characters)"
echo "   ✓ Set NEXT_PUBLIC_APP_URL to your domain"
echo "   ✓ Configure SMTP settings (optional)"
echo "   ✓ Review security settings"
echo ""
echo "🚀 Ready for deployment!"