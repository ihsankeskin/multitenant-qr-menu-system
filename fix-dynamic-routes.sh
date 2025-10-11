#!/bin/bash

# Script to add 'export const dynamic = force-dynamic' to all API route files
# This fixes the Next.js static rendering error

echo "Fixing API routes to use dynamic rendering..."

# Find all route.ts files in the API directory
find app/api -name "route.ts" -type f | while read file; do
    # Check if the file already has the export
    if ! grep -q "export const dynamic = 'force-dynamic'" "$file"; then
        echo "Fixing: $file"
        
        # Create a temporary file with the export statement
        # Insert after the imports and before the first export async function
        awk '
            BEGIN { added = 0 }
            /^export async function/ && !added {
                print "// Force dynamic rendering for this API route"
                print "export const dynamic = '\''force-dynamic'\''"
                print ""
                added = 1
            }
            { print }
        ' "$file" > "$file.tmp"
        
        # Replace the original file
        mv "$file.tmp" "$file"
        echo "✓ Fixed: $file"
    else
        echo "⊘ Already fixed: $file"
    fi
done

echo ""
echo "✅ All API routes have been updated!"
echo "Run 'npm run build' to verify the fix."
