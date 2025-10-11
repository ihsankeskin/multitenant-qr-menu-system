# Fix 500 Error on Production

## Problem Identified
The production site at https://themenugenie.com is returning 500 errors because **environment variables are not properly configured in Vercel**.

The API endpoint `/api/v1/super-admin/tenants` cannot connect to the database because:
- `POSTGRES_PRISMA_URL` is not available in production
- `POSTGRES_URL_NON_POOLING` is not available in production
- `JWT_SECRET` is not available in production

## Solution: Add Environment Variables to Vercel

### Option 1: Via Vercel Dashboard (Recommended)

1. Go to: https://vercel.com/waseemghaly-progressiosos-projects/themenugenie/settings/environment-variables

2. Add the following environment variables (copy from `.env.production.local`):

   **Required Database Variables:**
   ```
   POSTGRES_PRISMA_URL=prisma+postgres://accelerate.prisma-data.net/?api_key=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqd3RfaWQiOjEsInNlY3VyZV9rZXkiOiJza19zQjBHODBxclJHUkdPNjE1bVVuQlEiLCJhcGlfa2V5IjoiMDFLNlRYUThTWjNLQlRGUlJUN01YUlozQTQiLCJ0ZW5hbnRfaWQiOiIyNjM3M2IxODM3YzlkNDQ2OGE0MmRlZTc0MGFjYjUzMzc4NGIwZjBlZGYxZTQ4MDk1ZWFkY2Q2ZDQ3OTMzNjk2IiwiaW50ZXJuYWxfc2VjcmV0IjoiMmU0NjdlODctY2IwMi00NWMwLTk2OWQtZTZkOTIzMThiMTQzIn0.Moqh1mfo3cNmnBRVwALsagHYFwJcs82dRPbYb-__km4
   ```

   ```
   POSTGRES_URL_NON_POOLING=postgres://26373b1837c9d4468a42dee740acb533784b0f0edf1e48095eadcd6d47933696:sk_sB0G80qrRGRGO615mUnBQ@db.prisma.io:5432/postgres?sslmode=require
   ```

   **Required Auth Variable:**
   ```
   JWT_SECRET=v9Yjt3Ffh1B2WTIdVqZRekYOIsZ39xm/dW83U92ZYBE=
   ```

   **Public Variables:**
   ```
   NEXT_PUBLIC_API_URL=https://themenugenie.com/api
   NEXT_PUBLIC_APP_URL=https://themenugenie.com
   NEXT_PUBLIC_SUPER_ADMIN_URL=https://themenugenie.com/super-admin
   ```

   **Admin Credentials:**
   ```
   SUPER_ADMIN_EMAIL=admin@themenugenie.com
   SUPER_ADMIN_PASSWORD_HASH=tGgCg3/oaBzYAyZgaoYaEA==
   ```

3. **Important:** Make sure to:
   - Select **Production** environment for each variable
   - Remove any trailing `\n` characters if they appear
   - Click "Save" after adding each variable

4. After adding all variables, **redeploy the application** by:
   - Going to: https://vercel.com/waseemghaly-progressiosos-projects/themenugenie/deployments
   - Click the three dots (⋯) on the latest deployment
   - Click "Redeploy"
   - Wait for deployment to complete

### Option 2: Via Vercel CLI (Faster)

Run the script provided below to automatically set all environment variables:

```bash
./fix-vercel-env.sh
```

## After Fixing

1. Wait 2-3 minutes for the deployment to complete
2. Visit https://themenugenie.com/super-admin
3. Login with your credentials
4. The dashboard should now load with data

## Verification

Test the API endpoint directly:
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" https://themenugenie.com/api/v1/super-admin/tenants
```

You should get a 200 response with tenant data instead of a 500 error.

## Root Cause

Environment variables in `.env.local`, `.env.production`, and `.env.production.local` files are **NOT automatically deployed** to Vercel. They must be manually configured in the Vercel dashboard or set via the Vercel CLI.

This is a security feature - sensitive credentials should never be committed to git and must be manually configured in the hosting environment.
