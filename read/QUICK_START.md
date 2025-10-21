# 📋 Quick Start: Vercel Postgres Setup

**Total Time:** ~15 minutes

## One-Line Setup (After Creating Database in Dashboard)

```bash
# 1. Create database in Vercel dashboard first (see VERCEL_POSTGRES_SETUP.md Step 1)

# 2. Then run these commands:
vercel env pull .env.production.local && \
cp prisma/schema.prisma prisma/schema.prisma.local.backup && \
cp prisma/schema-production.prisma prisma/schema.prisma && \
npx prisma generate && \
npx prisma migrate deploy && \
npx prisma db seed && \
vercel --prod && \
cp prisma/schema.prisma.local.backup prisma/schema.prisma && \
npx prisma generate
```

**That's it!** ✅

## What This Does

1. ⬇️ Downloads database credentials from Vercel
2. 📦 Switches to PostgreSQL schema
3. 🔧 Generates Prisma Client
4. 🗄️ Creates database tables
5. 🌱 Seeds initial data (admin user + business types)
6. 🚀 Deploys to production
7. ♻️ Restores local SQLite schema

## Manual Steps Required

### Before Running Commands:
1. **Create Vercel Postgres Database:**
   - Go to https://vercel.com/waseemghaly-progressiosos-projects/themenugenie
   - Storage → Create Database → Postgres
   - Choose Washington D.C. region
   - Wait for creation

2. **Add Environment Variables** (if not automated):
   - Settings → Environment Variables
   - Add from `.credentials.txt`:
     - JWT_SECRET
     - SUPER_ADMIN_EMAIL
     - SUPER_ADMIN_PASSWORD_HASH
   - Add URLs:
     - NEXT_PUBLIC_APP_URL=https://themenugenie.com
     - NEXT_PUBLIC_API_URL=https://themenugenie.com/api

### After Running Commands:
3. **Configure Domain:**
   - Vercel Dashboard → Domains → Add `themenugenie.com`
   - Update DNS at your registrar (A and CNAME records)

## Verification

```bash
# Check deployment
vercel ls themenugenie

# Test login API
curl -X POST https://[your-url]/api/v1/super-admin/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@themenugenie.com","password":"[from .credentials.txt]"}'

# Open Prisma Studio (to view database)
npx prisma studio
```

## Credentials

Check `.credentials.txt` for:
- Admin Email
- Admin Password
- JWT Secret

## Production URLs

- App: https://themenugenie.com (after DNS)
- Temp: https://themenugenie-xxxxx.vercel.app
- Admin: https://themenugenie.com/super-admin/login

## Need Help?

See full guide: `VERCEL_POSTGRES_SETUP.md`

## Architecture

```
┌─────────────────┐
│  Local Dev      │
│  SQLite         │  ← You develop here
│  prisma/dev.db  │
└─────────────────┘

┌─────────────────┐
│  Production     │
│  Vercel         │  ← Live app here
│  PostgreSQL     │
└─────────────────┘
```

**Two separate databases!**
- Changes in local don't affect production
- Must deploy to update production
