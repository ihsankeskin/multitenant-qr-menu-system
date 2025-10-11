#!/bin/bash

# Fix Vercel Environment Variables
# This script automatically sets all required environment variables for production

set -e

echo "🔧 Setting Vercel Environment Variables for Production..."
echo ""

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI is not installed."
    echo "   Install it with: npm i -g vercel"
    exit 1
fi

# Check if logged in
echo "📋 Checking Vercel authentication..."
vercel whoami || {
    echo "❌ Not logged in to Vercel"
    echo "   Run: vercel login"
    exit 1
}

echo "✅ Authenticated with Vercel"
echo ""

# Project details
PROJECT_NAME="themenugenie"
TEAM="waseemghaly-progressiosos-projects"

echo "📦 Project: $PROJECT_NAME"
echo "👥 Team: $TEAM"
echo ""

# Function to add environment variable
add_env() {
    local key=$1
    local value=$2
    echo "   Adding: $key"
    echo "$value" | vercel env add "$key" production --force
}

echo "🔑 Setting Database Variables..."
add_env "POSTGRES_PRISMA_URL" "prisma+postgres://accelerate.prisma-data.net/?api_key=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqd3RfaWQiOjEsInNlY3VyZV9rZXkiOiJza19zQjBHODBxclJHUkdPNjE1bVVuQlEiLCJhcGlfa2V5IjoiMDFLNlRYUThTWjNLQlRGUlJUN01YUlozQTQiLCJ0ZW5hbnRfaWQiOiIyNjM3M2IxODM3YzlkNDQ2OGE0MmRlZTc0MGFjYjUzMzc4NGIwZjBlZGYxZTQ4MDk1ZWFkY2Q2ZDQ3OTMzNjk2IiwiaW50ZXJuYWxfc2VjcmV0IjoiMmU0NjdlODctY2IwMi00NWMwLTk2OWQtZTZkOTIzMThiMTQzIn0.Moqh1mfo3cNmnBRVwALsagHYFwJcs82dRPbYb-__km4"

add_env "POSTGRES_URL_NON_POOLING" "postgres://26373b1837c9d4468a42dee740acb533784b0f0edf1e48095eadcd6d47933696:sk_sB0G80qrRGRGO615mUnBQ@db.prisma.io:5432/postgres?sslmode=require"

echo ""
echo "🔐 Setting Authentication Variables..."
add_env "JWT_SECRET" "v9Yjt3Ffh1B2WTIdVqZRekYOIsZ39xm/dW83U92ZYBE="

add_env "SUPER_ADMIN_EMAIL" "admin@themenugenie.com"

add_env "SUPER_ADMIN_PASSWORD_HASH" "tGgCg3/oaBzYAyZgaoYaEA=="

echo ""
echo "🌐 Setting Public Variables..."
add_env "NEXT_PUBLIC_API_URL" "https://themenugenie.com/api"

add_env "NEXT_PUBLIC_APP_URL" "https://themenugenie.com"

add_env "NEXT_PUBLIC_SUPER_ADMIN_URL" "https://themenugenie.com/super-admin"

echo ""
echo "✅ All environment variables set successfully!"
echo ""
echo "📤 Now redeploying the application..."
echo ""

# Trigger a new deployment
vercel --prod

echo ""
echo "🎉 Deployment complete!"
echo ""
echo "⏳ Wait 2-3 minutes for the deployment to propagate..."
echo "🔗 Then visit: https://themenugenie.com/super-admin"
echo ""
