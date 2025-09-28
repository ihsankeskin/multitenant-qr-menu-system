#!/bin/bash

# 🚀 Multi-Tenant QR Menu System - Simple Starter
set -e

echo "🚀 Starting Multi-Tenant QR Menu System"
echo "========================================"

# Configuration
PORT=3000

# Clean ports
echo "🔄 Cleaning existing processes..."
pkill -f "next" 2>/dev/null || true
pkill -f "node.*dev" 2>/dev/null || true

# Kill process on port 3000 if exists
if lsof -Pi :$PORT -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo "  Killing process on port $PORT..."
    lsof -Pi :$PORT -sTCP:LISTEN -t | xargs kill -9 2>/dev/null || true
    sleep 2
fi
echo "✅ Process cleanup complete"

# Check environment
echo "🔍 Validating environment..."
echo "✅ Node.js version: $(node --version)"
echo "✅ npm version: $(npm --version)"
echo "✅ Environment validation complete"

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
    echo "⚠️ .env.local not found. Creating basic config..."
    cat > .env.local << EOF
DATABASE_URL="file:./dev.db"
JWT_SECRET="your-super-secret-jwt-key-change-in-production"
NODE_ENV="development"
EOF
    echo "✅ Created .env.local"
fi

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
    echo "✅ Dependencies installed"
fi

# Generate Prisma client and push schema
echo "🗄️ Setting up database..."
npx prisma generate >/dev/null 2>&1
npx prisma db push >/dev/null 2>&1
echo "✅ Database ready"

# Start the application
echo "🌐 Starting development server..."
echo "✅ Server will be available at: http://localhost:$PORT"
echo "✅ Super Admin: http://localhost:$PORT/super-admin/login"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

# Start Next.js development server
npm run dev