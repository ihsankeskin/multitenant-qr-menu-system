# 🚀 Vercel Postgres Setup Guide

Follow these steps **in order** to set up your production database on Vercel.

## Prerequisites
✅ Vercel account connected (waseemghaly-6400)
✅ Project deployed on Vercel
✅ .credentials.txt file exists

---

## Step 1: Create Vercel Postgres Database

### Via Vercel Dashboard:
1. Go to: https://vercel.com/waseemghaly-progressiosos-projects/themenugenie
2. Click **"Storage"** tab in the top menu
3. Click **"Create Database"** button
4. Select **"Postgres"**
5. Choose region: **Washington D.C. (iad1)** (closest to your users)
6. Database name: `themenugeniedb` (or leave default)
7. Click **"Create"**

⏳ **Wait** for database creation (takes ~30 seconds)

✅ **Database created!** Vercel automatically adds these env vars to your project:
   - `POSTGRES_URL`
   - `POSTGRES_PRISMA_URL`
   - `POSTGRES_URL_NON_POOLING`

---

## Step 2: Add Additional Environment Variables

### Method A: Via Vercel Dashboard (Recommended for beginners)
1. Still in your project, click **"Settings"** tab
2. Click **"Environment Variables"** in sidebar
3. Add each variable below:

```bash
JWT_SECRET=v9Yjt3Ffh1B2WTIdVqZRekYOIsZ39xm/dW83U92ZBYE=
SUPER_ADMIN_EMAIL=admin@themenugenie.com
SUPER_ADMIN_PASSWORD_HASH=[get from .credentials.txt]
NEXT_PUBLIC_APP_URL=https://themenugenie.com
NEXT_PUBLIC_API_URL=https://themenugenie.com/api
NEXT_PUBLIC_SUPER_ADMIN_URL=https://themenugenie.com/super-admin
```

For each variable:
- Click **"Add New"**
- Name: (e.g., `JWT_SECRET`)
- Value: (paste value)
- Environment: Select **"Production"** only
- Click **"Save"**

### Method B: Via Terminal (Automated)
Run this script from the project root:
```bash
./setup-vercel-database.sh
```

---

## Step 3: Pull Environment Variables Locally

```bash
vercel env pull .env.production.local
```

This downloads all environment variables (including database URLs) to a local file.

---

## Step 4: Update Prisma Schema for Production

```bash
# Backup current (SQLite) schema
cp prisma/schema.prisma prisma/schema.prisma.local.backup

# Copy production (PostgreSQL) schema
cp prisma/schema-production.prisma prisma/schema.prisma

# Generate Prisma Client for PostgreSQL
npx prisma generate
```

---

## Step 5: Run Database Migrations

```bash
# Make sure you have .env.production.local from Step 3
# This will create all tables in your Vercel Postgres database
npx prisma migrate deploy --schema=./prisma/schema.prisma
```

If you get an error about migrations not existing:
```bash
# Create initial migration
npx prisma migrate dev --name init --create-only
npx prisma migrate deploy
```

---

## Step 6: Seed Production Database

```bash
# This creates the super admin user and business types
npx prisma db seed
```

**Verify** the seed worked:
```bash
npx prisma studio
```
- Opens in browser at http://localhost:5555
- Check **users** table for admin@themenugenie.com
- Check **business_types** table for seeded data

---

## Step 7: Deploy with New Environment Variables

```bash
# Trigger a new production deployment
vercel --prod
```

This rebuilds your app with:
✅ PostgreSQL database connection
✅ All environment variables
✅ Production Prisma Client

---

## Step 8: Verify Production Deployment

### Check Deployment Status:
```bash
vercel ls themenugenie
```

Look for the latest deployment with **"Ready"** status.

### Test Login API:
```bash
curl -X POST https://[your-vercel-url]/api/v1/super-admin/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@themenugenie.com",
    "password": "[get from .credentials.txt]"
  }'
```

Should return a JWT token.

### Test in Browser:
1. Go to: https://[your-vercel-url]/super-admin/login
2. Login with:
   - Email: `admin@themenugenie.com`
   - Password: (from .credentials.txt)
3. Should successfully log in to dashboard

---

## Step 9: Configure Custom Domain (themenugenie.com)

### In Vercel Dashboard:
1. Go to project settings
2. Click **"Domains"** tab
3. Click **"Add"**
4. Enter: `themenugenie.com`
5. Click **"Add"**

### Configure DNS (at your domain registrar):
Vercel will show you the DNS records to add:

**A Record:**
```
Type: A
Name: @
Value: 76.76.21.21
```

**CNAME Record (for www):**
```
Type: CNAME
Name: www
Value: cname.vercel-dns.com
```

⏳ **Wait** 10-60 minutes for DNS propagation

✅ **Done!** Your app will be live at https://themenugenie.com

---

## Step 10: Restore Local Development Schema

```bash
# Switch back to SQLite for local dev
cp prisma/schema.prisma.local.backup prisma/schema.prisma

# Regenerate Prisma Client for SQLite
npx prisma generate
```

Now you have:
- 🟢 **Local Dev:** SQLite database (prisma/dev.db)
- 🟢 **Production:** PostgreSQL database (Vercel Postgres)

---

## Troubleshooting

### Issue: Migration fails with "relation already exists"
```bash
# Reset the migration state
npx prisma migrate resolve --applied "migration-name"
```

### Issue: Can't connect to database
- Check environment variables are set in Vercel
- Verify `POSTGRES_PRISMA_URL` exists
- Try running: `vercel env pull .env.production.local` again

### Issue: 500 error on login API
- Check Vercel deployment logs: `vercel logs [deployment-url]`
- Verify super admin user exists: Use Prisma Studio or Vercel Postgres console
- Check JWT_SECRET is set correctly

### Issue: Seed command fails
- Make sure migrations ran first
- Check prisma/seed.ts doesn't have syntax errors
- Manually create admin user via Prisma Studio if needed

---

## Next Steps After Setup

1. ✅ Change default admin password
2. ✅ Create your first tenant
3. ✅ Test QR menu generation
4. ✅ Set up monitoring/alerts in Vercel
5. ✅ Configure backup strategy for database

---

## Quick Reference

### Useful Commands:
```bash
# Check Vercel login
vercel whoami

# List deployments
vercel ls

# View logs
vercel logs [deployment-url]

# Pull env vars
vercel env pull .env.production.local

# Open Prisma Studio
npx prisma studio

# Generate Prisma Client
npx prisma generate

# Run migrations
npx prisma migrate deploy

# Seed database
npx prisma db seed
```

### Important URLs:
- Vercel Dashboard: https://vercel.com/waseemghaly-progressiosos-projects/themenugenie
- Production App: https://themenugenie.com (after DNS)
- Super Admin Login: https://themenugenie.com/super-admin/login

---

**Need help?** Check the terminal output for specific error messages and refer to this guide.
