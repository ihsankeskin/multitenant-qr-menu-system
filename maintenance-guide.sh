#!/bin/bash

# 🛡️ PROTECTED FILES AND DIRECTORIES
# This script documents what should NEVER be deleted during optimization

echo "🛡️  PROTECTED FILES - DO NOT DELETE"
echo "=================================="
echo ""

echo "🔒 CRITICAL BUILD CACHE:"
echo "  .next/                 - Next.js build cache (NEVER DELETE)"
echo "  node_modules/          - Dependencies (only if corrupted)"
echo "  .prisma/               - Prisma client cache"
echo ""

echo "🔒 ESSENTIAL CONFIGURATION:"
echo "  package.json           - Project configuration"
echo "  package-lock.json      - Dependency lock (ok to regenerate)"
echo "  .env.local             - Environment variables"
echo "  prisma/schema.prisma   - Database schema"
echo "  prisma/dev.db          - SQLite database"
echo ""

echo "🗑️  SAFE TO DELETE:"
echo "  *backup*               - Any backup files"
echo "  *corrupted*            - Any corrupted directories"
echo "  *~ *.tmp *.old         - Temporary files"
echo "  *.2.* *.3.*           - Duplicate version files"
echo ""

echo "⚠️  WHY .next IS SACRED:"
echo "  • Contains compiled TypeScript"
echo "  • Webpack build cache"
echo "  • Route optimizations"
echo "  • Deleting forces expensive rebuilds"
echo "  • Can introduce temporary compilation errors"
echo ""

echo "✅ OPTIMIZATION RULE:"
echo "  Clean = Remove unnecessary files"
echo "  Clean ≠ Remove build performance cache"
echo ""

echo "📋 TO CHECK WHAT'S SAFE TO DELETE:"
echo "  ls -la | grep -E '(backup|corrupted|\.backup| 2\.| 3\.)'"
echo ""

echo "🚀 RECOMMENDED WORKFLOW:"
echo "  1. ./start.sh           (preserves .next)"
echo "  2. Only run clean-build.sh if truly needed"
echo "  3. Never manually delete .next"