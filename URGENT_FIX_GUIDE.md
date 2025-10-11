# 🔥 URGENT: Fix 500 Error - Environment Variables Missing

## Problem
Your production site https://themenugenie.com is showing 500 errors because **environment variables are not configured in Vercel**.

## ⚡ Quick Fix (5 minutes)

### Step 1: Go to Vercel Dashboard
Open this link: https://vercel.com/waseemghaly-progressiosos-projects/themenugenie/settings/environment-variables

### Step 2: Add These Variables

Click "Add New" for each variable below:

#### 1. POSTGRES_PRISMA_URL
```
prisma+postgres://accelerate.prisma-data.net/?api_key=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqd3RfaWQiOjEsInNlY3VyZV9rZXkiOiJza19zQjBHODBxclJHUkdPNjE1bVVuQlEiLCJhcGlfa2V5IjoiMDFLNlRYUThTWjNLQlRGUlJUN01YUlozQTQiLCJ0ZW5hbnRfaWQiOiIyNjM3M2IxODM3YzlkNDQ2OGE0MmRlZTc0MGFjYjUzMzc4NGIwZjBlZGYxZTQ4MDk1ZWFkY2Q2ZDQ3OTMzNjk2IiwiaW50ZXJuYWxfc2VjcmV0IjoiMmU0NjdlODctY2IwMi00NWMwLTk2OWQtZTZkOTIzMThiMTQzIn0.Moqh1mfo3cNmnBRVwALsagHYFwJcs82dRPbYb-__km4
```
Environment: **Production**

#### 2. POSTGRES_URL_NON_POOLING
```
postgres://26373b1837c9d4468a42dee740acb533784b0f0edf1e48095eadcd6d47933696:sk_sB0G80qrRGRGO615mUnBQ@db.prisma.io:5432/postgres?sslmode=require
```
Environment: **Production**

#### 3. JWT_SECRET
```
v9Yjt3Ffh1B2WTIdVqZRekYOIsZ39xm/dW83U92ZBYE=
```
Environment: **Production**

#### 4. NEXT_PUBLIC_API_URL
```
https://themenugenie.com/api
```
Environment: **Production**

#### 5. NEXT_PUBLIC_APP_URL
```
https://themenugenie.com
```
Environment: **Production**

#### 6. NEXT_PUBLIC_SUPER_ADMIN_URL
```
https://themenugenie.com/super-admin
```
Environment: **Production**

#### 7. SUPER_ADMIN_EMAIL
```
admin@themenugenie.com
```
Environment: **Production**

#### 8. SUPER_ADMIN_PASSWORD_HASH
```
tGgCg3/oaBzYAyZgaoYaEA==
```
Environment: **Production**

### Step 3: Redeploy

After adding all variables:
1. Go to: https://vercel.com/waseemghaly-progressiosos-projects/themenugenie/deployments
2. Find the latest deployment
3. Click the three dots (⋯) menu
4. Click "Redeploy"
5. Wait 2-3 minutes

### Step 4: Test
Visit: https://themenugenie.com/super-admin

You should now see data loading without errors!

---

## 🤖 Alternative: Use CLI Script

If you prefer automation:

```bash
cd "/Users/waseemghaly/Documents/PRG/Emad/VS Projects/The Menu App/Menu App"
./quick-fix-vercel.sh
```

**Note:** You must have Vercel CLI installed and be logged in:
```bash
npm i -g vercel
vercel login
```

---

## Why This Happened

Environment files (`.env.local`, `.env.production`, etc.) are **NOT deployed** to Vercel for security reasons. They must be manually configured in the Vercel dashboard.

The database connection string, JWT secret, and other sensitive data were in local files but not in Vercel's production environment, causing the API to crash.

---

## After Fixing

All these endpoints will work:
- ✅ `GET /api/v1/super-admin/tenants`
- ✅ `GET /api/v1/super-admin/analytics`
- ✅ Dashboard loads with data
- ✅ No more 500 errors
