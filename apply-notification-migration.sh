#!/bin/bash

# Apply Notifications Table Migration
# This script creates the notifications table for the password reset notification system

echo "🔄 Applying notification table migration..."

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ] && [ -z "$POSTGRES_PRISMA_URL" ]; then
    echo "❌ Error: DATABASE_URL or POSTGRES_PRISMA_URL environment variable not set"
    echo "Please set one of these environment variables with your PostgreSQL connection string"
    exit 1
fi

# Use POSTGRES_PRISMA_URL if available, otherwise use DATABASE_URL
DB_URL="${POSTGRES_PRISMA_URL:-$DATABASE_URL}"

echo "📝 Executing SQL migration..."

# Execute the migration
psql "$DB_URL" -f migrations/add_notifications_table.sql

if [ $? -eq 0 ]; then
    echo "✅ Migration applied successfully!"
    echo ""
    echo "The following has been created:"
    echo "  ✓ notifications table"
    echo "  ✓ Index on userId and isRead"
    echo "  ✓ Index on createdAt"
    echo "  ✓ Foreign key to users table"
    echo ""
    echo "🎉 Password reset notification system is now ready!"
else
    echo "❌ Migration failed. Please check the error messages above."
    exit 1
fi
