#!/bin/bash

set -e  # Exit on any error

echo "🧹 Deep cleaning project with timeout protection..."

# Function to run commands with timeout
run_with_timeout() {
    local timeout_duration=$1
    shift
    timeout $timeout_duration "$@" || {
        echo "⏰ Command timed out after ${timeout_duration}s, continuing..."
        return 0
    }
}

# Kill any running processes
echo "🔄 Stopping running processes..."
pkill -f "next" 2>/dev/null || true
pkill -f "node.*dev" 2>/dev/null || true
pkill -f "npm.*dev" 2>/dev/null || true
sleep 2

# Remove problematic directories with timeout protection
echo "🗑️ Removing build artifacts (with timeout protection)..."

# Try to remove .next directory with timeout
if [ -d ".next" ]; then
    echo "  Removing .next directory..."
    run_with_timeout 30 rm -rf .next || {
        echo "  .next removal timed out, trying alternative method..."
        mv .next .next.old.$(date +%s) 2>/dev/null || true
    }
fi

# Try to remove package-lock.json
if [ -f "package-lock.json" ]; then
    echo "  Removing package-lock.json..."
    run_with_timeout 10 rm -f package-lock.json || true
fi

# Handle node_modules more carefully
if [ -d "node_modules" ]; then
    echo "  Removing node_modules (this may take time)..."
    
    # First try with timeout
    run_with_timeout 60 rm -rf node_modules || {
        echo "  Standard removal timed out, trying alternative approach..."
        
        # Try moving it first (faster than deletion)
        mv node_modules node_modules.old.$(date +%s) 2>/dev/null || {
            echo "  Move failed, trying forced removal..."
            # Try removing specific problematic directories first
            run_with_timeout 30 rm -rf node_modules/.cache 2>/dev/null || true
            run_with_timeout 30 rm -rf node_modules/.bin 2>/dev/null || true
            run_with_timeout 30 rm -rf node_modules/@* 2>/dev/null || true
            run_with_timeout 60 rm -rf node_modules || true
        }
    }
fi

# Clear npm cache more thoroughly
echo "🧽 Clearing npm cache..."
run_with_timeout 30 npm cache clean --force 2>/dev/null || {
    echo "  npm cache clean timed out, trying alternative..."
    npm cache verify 2>/dev/null || true
}

echo "✅ Cleanup complete"

# Check npm and node versions
echo "🔍 Checking environment..."
echo "Node: $(node --version)"
echo "npm: $(npm --version)"

echo "📦 Installing dependencies (with timeout monitoring)..."

# Use timeout for npm install to prevent hanging
timeout 300 npm install --legacy-peer-deps --no-optional --progress=false || {
    echo "❌ npm install timed out after 5 minutes"
    echo "🔄 Trying alternative installation method..."
    
    # Try without legacy peer deps
    timeout 300 npm install --no-optional --progress=false --force || {
        echo "❌ All npm install attempts failed"
        echo "� Try running: npm install --verbose to see what's hanging"
        exit 1
    }
}

# Check if install was successful
if [ $? -eq 0 ]; then
    echo "✅ Dependencies installed successfully"
else
    echo "❌ npm install failed"
    exit 1
fi

echo "🔧 Generating Prisma client..."
timeout 60 npx prisma generate || {
    echo "❌ Prisma generation timed out"
    echo "🔄 Trying to continue without Prisma client..."
}

echo "🏗️ Building project..."
timeout 300 npm run build || {
    echo "❌ Build timed out or failed"
    echo "💡 Try running: npm run build --verbose to see detailed errors"
    exit 1
}

echo "✅ Build complete!"
echo "🚀 Ready to run with: npm run dev"