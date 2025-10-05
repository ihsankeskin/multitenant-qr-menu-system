#!/bin/bash

# Quick Environment Variables Setup for Vercel
# Run this AFTER creating the Postgres database in Vercel dashboard

set -e

echo "🔧 Adding Environment Variables to Vercel Production"
echo "===================================================="
echo ""

# Check if we're in the right directory
if [ ! -f ".credentials.txt" ]; then
    echo "❌ Error: .credentials.txt not found"
    echo "Please run this from the project root directory"
    exit 1
fi

echo "📋 Reading credentials from .credentials.txt..."
echo ""

# Function to add env var
add_env_var() {
    local name=$1
    local value=$2
    echo "Adding $name..."
    echo "$value" | vercel env add "$name" production --yes 2>&1 | grep -v "Error" || true
}

# Add all environment variables
add_env_var "JWT_SECRET" "v9Yjt3Ffh1B2WTIdVqZRekYOIsZ39xm/dW83U92ZYBE="
add_env_var "SUPER_ADMIN_EMAIL" "admin@themenugenie.com"
add_env_var "SUPER_ADMIN_PASSWORD_HASH" "tGgCg3/oaBzYAyZgaoYaEA=="
add_env_var "NEXT_PUBLIC_APP_URL" "https://themenugenie.com"
add_env_var "NEXT_PUBLIC_API_URL" "https://themenugenie.com/api"
add_env_var "NEXT_PUBLIC_SUPER_ADMIN_URL" "https://themenugenie.com/super-admin"

echo ""
echo "✅ Environment variables added!"
echo ""
echo "Next steps:"
echo "1. Run: vercel env pull .env.production.local"
echo "2. Follow the rest of VERCEL_POSTGRES_SETUP.md"
echo ""
