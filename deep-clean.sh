#!/bin/bash

echo "🧹 Deep cleaning project..."

# Kill any node processes
pkill -f node || true
pkill -f next || true

# Remove all build artifacts and caches
rm -rf .next || true
rm -rf dist || true
rm -rf build || true

# Remove node_modules more aggressively
if [ -d "node_modules" ]; then
    echo "Removing node_modules..."
    # First try normal removal
    rm -rf node_modules 2>/dev/null || {
        echo "Normal removal failed, trying with find..."
        # If that fails, use find to remove readonly files
        find node_modules -type f -exec chmod 777 {} + 2>/dev/null || true
        find node_modules -type d -exec chmod 777 {} + 2>/dev/null || true
        rm -rf node_modules 2>/dev/null || true
    }
fi

# Remove package locks
rm -f package-lock.json || true
rm -f yarn.lock || true

# Clear npm cache
npm cache clean --force

echo "✅ Deep clean completed!"

# Reinstall dependencies
echo "📦 Installing dependencies..."
npm install

# Generate Prisma client
echo "🔧 Generating Prisma client..."
npx prisma generate

echo "🎉 Project rebuilt successfully!"