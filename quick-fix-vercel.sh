#!/bin/bash

# Quick Fix for Vercel Environment Variables
# This script uses Vercel CLI to set environment variables one by one

set -e

echo "🔧 Quick Fix: Setting Vercel Environment Variables"
echo ""
echo "⚠️  NOTE: You must be logged in to Vercel CLI"
echo "   If not logged in, run: vercel login"
echo ""
read -p "Press Enter to continue or Ctrl+C to cancel..."

cd "/Users/waseemghaly/Documents/PRG/Emad/VS Projects/The Menu App/Menu App"

echo ""
echo "Setting environment variables..."
echo ""

# Method 1: Using vercel env pull to check current state
echo "📋 Checking current environment variables..."
vercel env ls || echo "Could not list environment variables"

echo ""
echo "Setting required variables..."
echo ""

# Set each variable
echo "v9Yjt3Ffh1B2WTIdVqZRekYOIsZ39xm/dW83U92ZYBE=" | vercel env add JWT_SECRET production

echo "prisma+postgres://accelerate.prisma-data.net/?api_key=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqd3RfaWQiOjEsInNlY3VyZV9rZXkiOiJza19zQjBHODBxclJHUkdPNjE1bVVuQlEiLCJhcGlfa2V5IjoiMDFLNlRYUThTWjNLQlRGUlJUN01YUlozQTQiLCJ0ZW5hbnRfaWQiOiIyNjM3M2IxODM3YzlkNDQ2OGE0MmRlZTc0MGFjYjUzMzc4NGIwZjBlZGYxZTQ4MDk1ZWFkY2Q2ZDQ3OTMzNjk2IiwiaW50ZXJuYWxfc2VjcmV0IjoiMmU0NjdlODctY2IwMi00NWMwLTk2OWQtZTZkOTIzMThiMTQzIn0.Moqh1mfo3cNmnBRVwALsagHYFwJcs82dRPbYb-__km4" | vercel env add POSTGRES_PRISMA_URL production

echo "postgres://26373b1837c9d4468a42dee740acb533784b0f0edf1e48095eadcd6d47933696:sk_sB0G80qrRGRGO615mUnBQ@db.prisma.io:5432/postgres?sslmode=require" | vercel env add POSTGRES_URL_NON_POOLING production

echo "https://themenugenie.com/api" | vercel env add NEXT_PUBLIC_API_URL production

echo "https://themenugenie.com" | vercel env add NEXT_PUBLIC_APP_URL production

echo "https://themenugenie.com/super-admin" | vercel env add NEXT_PUBLIC_SUPER_ADMIN_URL production

echo "admin@themenugenie.com" | vercel env add SUPER_ADMIN_EMAIL production

echo "tGgCg3/oaBzYAyZgaoYaEA==" | vercel env add SUPER_ADMIN_PASSWORD_HASH production

echo ""
echo "✅ Environment variables set!"
echo ""
echo "📤 Triggering redeploy..."
vercel --prod

echo ""
echo "🎉 Complete! Wait 2-3 minutes for deployment to finish."
echo "🔗 Then test: https://themenugenie.com/super-admin"
