#!/bin/bash

echo "🔧 DEFINITIVE PROJECT FIX - Resolving all TypeScript and dependency issues"
echo "=============================================================================="

# Kill any hanging processes
echo "1️⃣ Cleaning up processes..."
pkill -f "next" 2>/dev/null || true
pkill -f "node.*dev" 2>/dev/null || true  
pkill -f "npm" 2>/dev/null || true
sleep 2

# Navigate to project directory
cd "/Users/waseemghaly/Documents/PRG/Emad/VS Projects/The Menu App/Menu App" || exit 1

# Force remove any remaining corrupted directories
echo "2️⃣ Force cleaning corrupted files..."
if [ -d "node_modules" ]; then
    echo "  Moving node_modules to backup..."
    mv node_modules "node_modules.backup.$(date +%s)" 2>/dev/null || true
fi

rm -rf .next package-lock.json 2>/dev/null || true

# Clear all caches
echo "3️⃣ Clearing all caches..."
npm cache clean --force 2>/dev/null || true
# Clear Prisma cache
rm -rf node_modules/.prisma 2>/dev/null || true
# Clear TypeScript build info
rm -rf tsconfig*.tsbuildinfo 2>/dev/null || true

# Check environment
echo "4️⃣ Environment check..."
echo "  Node: $(node --version)"
echo "  npm: $(npm --version)"

# Install dependencies with specific flags to avoid issues
echo "5️⃣ Installing dependencies (fresh install)..."
npm install --no-cache --legacy-peer-deps --no-optional 2>&1 | head -50

# Check if critical packages are installed
echo "6️⃣ Verifying critical packages..."
if [ -d "node_modules/next" ]; then
    echo "  ✅ Next.js installed"
else
    echo "  ❌ Next.js missing - trying to install specifically"
    npm install next@14.2.8
fi

if [ -d "node_modules/react" ]; then
    echo "  ✅ React installed"
else
    echo "  ❌ React missing - trying to install specifically"
    npm install react react-dom
fi

if [ -d "node_modules/@types/node" ]; then
    echo "  ✅ Node types installed"
else
    echo "  ❌ Node types missing - trying to install specifically"
    npm install @types/node
fi

if [ -d "node_modules/jose" ]; then
    echo "  ✅ jose installed"
else
    echo "  ❌ jose missing - trying to install specifically"
    npm install jose
fi

# Generate Prisma client
echo "7️⃣ Generating Prisma client..."
npx prisma generate || echo "  Warning: Prisma generation failed"

# Restart TypeScript server (if VS Code is running)
echo "8️⃣ TypeScript server restart..."
echo "  NOTE: Please restart your TypeScript server in VS Code:"
echo "  - Press Cmd+Shift+P"
echo "  - Type: TypeScript: Restart TS Server" 
echo "  - Press Enter"

# Try to start development server
echo "9️⃣ Starting development server..."
echo "=============================================================================="

# Start the server
npm run dev