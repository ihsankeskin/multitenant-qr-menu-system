#!/bin/bash

# Quick fix script for when npm install gets stuck
echo "🚀 Quick Fix - Alternative Installation"

# Stop all processes
pkill -f "next" 2>/dev/null || true
pkill -f "node" 2>/dev/null || true

# Remove only the most problematic parts
echo "🧹 Selective cleanup..."
rm -rf .next
rm -f package-lock.json

# Try installing with different approach
echo "📦 Quick install attempt..."

# Method 1: Use yarn if available
if command -v yarn &> /dev/null; then
    echo "Using yarn for installation..."
    yarn install
else
    # Method 2: Use npm with minimal flags
    echo "Using npm with minimal flags..."
    npm install --no-audit --no-fund
fi

# Generate Prisma
echo "🔧 Generating Prisma..."
npx prisma generate

# Try development build
echo "🏗️ Starting dev server..."
npm run dev

echo "✅ Quick fix complete!"