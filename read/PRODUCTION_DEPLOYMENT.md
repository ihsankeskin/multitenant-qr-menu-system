# 🚀 The Menu Genie - Production Deployment Guide
## Deploy to https://themenugenie.com

---

## 📋 Quick Start

### Option 1: Deploy to Vercel (Recommended)
```bash
chmod +x deploy-vercel-production.sh
./deploy-vercel-production.sh
```

### Option 2: Deploy to Railway
```bash
chmod +x deploy-railway-production.sh
./deploy-railway-production.sh
```

---

## 🎯 Pre-Deployment Checklist

### ✅ Requirements
- [x] Node.js 18+ installed
- [x] Domain purchased: **themenugenie.com**
- [x] Git repository ready
- [x] Database provider chosen (PostgreSQL recommended)
- [x] Email SMTP configured (optional but recommended)

### ✅ Files Ready
- [x] `.env.production.example` - Environment variables template
- [x] `next.config.production.js` - Production Next.js config
- [x] `vercel-production.json` - Vercel deployment config
- [x] `railway-production.json` - Railway deployment config
- [x] `prisma/schema-production.prisma` - PostgreSQL schema
- [x] `deploy-vercel-production.sh` - Vercel deployment script
- [x] `deploy-railway-production.sh` - Railway deployment script

---

## 🗄️ Database Setup

### PostgreSQL Providers (Choose One)

#### Option 1: Vercel Postgres (Recommended for Vercel)
```bash
# Install Vercel CLI
npm i -g vercel

# Create database
vercel postgres create themenugenie-db

# Link to project
vercel link
vercel env pull
```

**Pros:**
- ✅ Seamless Vercel integration
- ✅ Automatic DATABASE_URL configuration
- ✅ Built-in connection pooling
- ✅ Free tier: 256 MB storage, 60 hours compute

#### Option 2: Railway Postgres (Recommended for Railway)
```bash
# Install Railway CLI
npm i -g @railway/cli

# Login and init
railway login
railway init

# Add PostgreSQL
railway add
# Select: PostgreSQL

# DATABASE_URL is automatically configured
```

**Pros:**
- ✅ Integrated with Railway platform
- ✅ One-click database creation
- ✅ Automatic backups
- ✅ Free tier: $5/month credit

#### Option 3: Supabase
**Website:** https://supabase.com

```bash
# 1. Create account at supabase.com
# 2. Create new project
# 3. Get connection string from project settings
# 4. Add to environment variables:
DATABASE_URL="postgresql://postgres:[password]@db.[project].supabase.co:5432/postgres"
```

**Pros:**
- ✅ Free tier: 500 MB, 2 projects
- ✅ Built-in authentication
- ✅ Real-time subscriptions
- ✅ Storage included

#### Option 4: Neon
**Website:** https://neon.tech

```bash
# 1. Create account at neon.tech
# 2. Create new project
# 3. Copy connection string
# 4. Add to environment variables:
DATABASE_URL="postgresql://[user]:[password]@[host]/[database]?sslmode=require"
```

**Pros:**
- ✅ Free tier: 3 GB storage, 3 projects
- ✅ Branching for databases
- ✅ Instant provisioning
- ✅ Autoscaling

---

## 🔐 Environment Variables

### Step 1: Generate Secure Secrets
```bash
# Generate JWT secret (32+ characters)
openssl rand -base64 32

# Generate admin password
openssl rand -base64 16
```

### Step 2: Create Environment File

Copy `.env.production.example` and fill in values:

```bash
cp .env.production.example .env.production
```

### Step 3: Required Variables

```bash
# Database (Get from your database provider)
DATABASE_URL="postgresql://username:password@host:5432/database?sslmode=require"

# Security (Generate using openssl commands above)
JWT_SECRET="your-generated-32-char-secret"
JWT_EXPIRES_IN="24h"
JWT_REFRESH_EXPIRES_IN="7d"
BCRYPT_ROUNDS="12"

# Application URLs
NEXT_PUBLIC_APP_URL="https://themenugenie.com"
NEXT_PUBLIC_API_URL="https://themenugenie.com/api"
NEXT_PUBLIC_SUPER_ADMIN_URL="https://themenugenie.com/super-admin"

# Admin Credentials (CHANGE AFTER FIRST LOGIN!)
DEFAULT_SUPER_ADMIN_EMAIL="admin@themenugenie.com"
DEFAULT_SUPER_ADMIN_PASSWORD="your-generated-password"

# Production Settings
NODE_ENV="production"
```

### Step 4: Optional Variables

```bash
# Email Configuration (Recommended)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_SECURE="false"
SMTP_USER="noreply@themenugenie.com"
SMTP_PASS="your-app-password"
FROM_EMAIL="noreply@themenugenie.com"
FROM_NAME="The Menu Genie"

# Image Upload
MAX_IMAGE_SIZE_MB="5"
ALLOWED_IMAGE_TYPES="image/jpeg,image/png,image/webp,image/gif"

# Security
ALLOWED_ORIGINS="https://themenugenie.com"
RATE_LIMIT_MAX="100"
RATE_LIMIT_WINDOW="15"
```

---

## 🚀 Deployment to Vercel

### Automatic Deployment (Recommended)

```bash
# Run automated deployment script
chmod +x deploy-vercel-production.sh
./deploy-vercel-production.sh
```

### Manual Deployment

#### Step 1: Install Vercel CLI
```bash
npm install -g vercel
```

#### Step 2: Login to Vercel
```bash
vercel login
```

#### Step 3: Link Project
```bash
vercel link
```

#### Step 4: Set Environment Variables
```bash
# Set variables one by one
vercel env add DATABASE_URL production
vercel env add JWT_SECRET production
vercel env add NEXT_PUBLIC_APP_URL production
vercel env add NEXT_PUBLIC_API_URL production
vercel env add NEXT_PUBLIC_SUPER_ADMIN_URL production
vercel env add DEFAULT_SUPER_ADMIN_EMAIL production
vercel env add DEFAULT_SUPER_ADMIN_PASSWORD production

# Or import from file
vercel env pull .env.local
```

#### Step 5: Deploy
```bash
# Deploy to production
vercel --prod
```

### Post-Deployment

#### 1. Configure Domain
```bash
# Add domain in Vercel dashboard or via CLI
vercel domains add themenugenie.com
vercel domains add www.themenugenie.com
```

#### 2. Update DNS Records

Go to your domain registrar (GoDaddy, Namecheap, etc.) and add:

**For root domain:**
```
Type: A
Name: @
Value: 76.76.21.21
```

**For www subdomain:**
```
Type: CNAME
Name: www
Value: cname.vercel-dns.com
```

#### 3. Run Database Migrations
```bash
# SSH into Vercel (not directly supported, use Railway for this)
# Or run migrations locally with production DATABASE_URL

npx prisma migrate deploy
npx prisma db seed  # Optional: seed initial data
```

---

## 🚂 Deployment to Railway

### Automatic Deployment (Recommended)

```bash
# Run automated deployment script
chmod +x deploy-railway-production.sh
./deploy-railway-production.sh
```

### Manual Deployment

#### Step 1: Install Railway CLI
```bash
npm install -g @railway/cli
```

#### Step 2: Login to Railway
```bash
railway login
```

#### Step 3: Initialize Project
```bash
railway init
```

#### Step 4: Add PostgreSQL
```bash
railway add
# Select: PostgreSQL
```

#### Step 5: Set Environment Variables
```bash
railway variables set NODE_ENV=production
railway variables set NEXT_PUBLIC_APP_URL=https://themenugenie.com
railway variables set NEXT_PUBLIC_API_URL=https://themenugenie.com/api
railway variables set NEXT_PUBLIC_SUPER_ADMIN_URL=https://themenugenie.com/super-admin
railway variables set JWT_SECRET=$(openssl rand -base64 32)
railway variables set DEFAULT_SUPER_ADMIN_EMAIL=admin@themenugenie.com
railway variables set DEFAULT_SUPER_ADMIN_PASSWORD=your-password
```

#### Step 6: Deploy
```bash
railway up
```

#### Step 7: Run Migrations
```bash
railway run npx prisma migrate deploy
railway run npm run db:seed  # Optional
```

### Post-Deployment

#### 1. Get Railway Domain
```bash
railway status
# Note the generated URL
```

#### 2. Add Custom Domain

1. Go to Railway dashboard
2. Click on your project
3. Go to Settings → Domains
4. Click "Add Domain"
5. Enter: `themenugenie.com`
6. Railway will provide CNAME records

#### 3. Update DNS Records

Add the CNAME records provided by Railway:

```
Type: CNAME
Name: @
Value: [railway-provided-value]

Type: CNAME
Name: www
Value: [railway-provided-value]
```

---

## 🧪 Testing Your Deployment

### 1. Health Check
```bash
# Test main site
curl -I https://themenugenie.com

# Test API
curl https://themenugenie.com/api/v1/business-types
```

### 2. Super Admin Login

1. Visit: https://themenugenie.com/super-admin/login
2. Login with credentials:
   - Email: `admin@themenugenie.com`
   - Password: `your-configured-password`
3. **IMPORTANT:** Change password immediately!

### 3. Functional Tests

- [ ] Super admin dashboard loads
- [ ] Can create a new tenant
- [ ] Tenant slug generates correctly
- [ ] Can create categories
- [ ] Can create products
- [ ] Can upload images
- [ ] QR code generates correctly
- [ ] Public menu displays at `/menu/[slug]`
- [ ] Language switching works (EN/AR)
- [ ] Payment records can be created
- [ ] Analytics display correctly

### 4. Performance Tests

```bash
# Test page load speed
curl -w "@curl-format.txt" -o /dev/null -s https://themenugenie.com

# Create curl-format.txt:
echo "time_namelookup: %{time_namelookup}\ntime_connect: %{time_connect}\ntime_starttransfer: %{time_starttransfer}\ntime_total: %{time_total}\n" > curl-format.txt
```

---

## 🔧 Post-Deployment Configuration

### 1. Change Default Credentials

**Immediately after first login:**

1. Go to: https://themenugenie.com/super-admin/change-password
2. Enter current password
3. Set strong new password
4. Save changes

### 2. Email Configuration (Optional)

#### Gmail SMTP Setup:

1. Enable 2-factor authentication on Gmail
2. Generate app-specific password:
   - Go to: https://myaccount.google.com/apppasswords
   - Create new app password
3. Update environment variables:
   ```bash
   SMTP_HOST="smtp.gmail.com"
   SMTP_PORT="587"
   SMTP_USER="your-email@gmail.com"
   SMTP_PASS="your-app-password"
   ```

### 3. SSL Certificate

**Vercel:** SSL is automatic
**Railway:** SSL is automatic after custom domain is configured

### 4. Monitoring Setup

#### Vercel Analytics
- Already included in Vercel deployments
- View at: Vercel Dashboard → Analytics

#### Railway Metrics
- View at: Railway Dashboard → Metrics
- Shows CPU, Memory, Network usage

#### Optional: Sentry for Error Tracking
```bash
npm install @sentry/nextjs
# Follow Sentry setup guide
```

---

## 📊 Maintenance & Monitoring

### View Logs

**Vercel:**
```bash
vercel logs --prod
```

**Railway:**
```bash
railway logs
```

### Check Deployment Status

**Vercel:**
```bash
vercel ls
```

**Railway:**
```bash
railway status
```

### Database Backup

**Vercel Postgres:**
- Automatic backups included
- View in Vercel dashboard

**Railway Postgres:**
- Automatic backups included
- Manual backup:
  ```bash
  railway run pg_dump $DATABASE_URL > backup.sql
  ```

### Update Deployment

**Vercel:**
```bash
# Push to git, auto-deploys
git push origin main

# Or manual deploy
vercel --prod
```

**Railway:**
```bash
# Push to git, auto-deploys
git push origin main

# Or manual deploy
railway up
```

---

## 🐛 Troubleshooting

### Build Failures

```bash
# Clear cache and rebuild
rm -rf .next node_modules
npm install
npm run build
```

### Database Connection Issues

```bash
# Test database connection
npx prisma db pull

# Verify DATABASE_URL format
echo $DATABASE_URL

# Check if PostgreSQL is accessible
pg_isready -d $DATABASE_URL
```

### Environment Variable Issues

**Vercel:**
```bash
# List all variables
vercel env ls

# Pull variables locally
vercel env pull
```

**Railway:**
```bash
# List all variables
railway variables

# Set variable
railway variables set KEY=value
```

### Domain Not Working

1. Check DNS propagation:
   ```bash
   dig themenugenie.com
   dig www.themenugenie.com
   ```

2. Wait 5-30 minutes for DNS propagation

3. Clear browser cache

4. Try incognito mode

---

## 📞 Support Resources

### Documentation
- **Next.js:** https://nextjs.org/docs
- **Prisma:** https://www.prisma.io/docs
- **Vercel:** https://vercel.com/docs
- **Railway:** https://docs.railway.app

### Useful Links
- **Vercel Dashboard:** https://vercel.com/dashboard
- **Railway Dashboard:** https://railway.app/dashboard
- **Domain DNS Checker:** https://dnschecker.org

---

## 🎉 Success!

Your Menu Genie application is now live at:

## 🌐 **https://themenugenie.com**

### What's Next?

1. ✅ **Security First:** Change default admin password
2. ✅ **Create First Tenant:** Add your first restaurant
3. ✅ **Design Menu:** Add categories and products
4. ✅ **Generate QR Code:** Download and print for tables
5. ✅ **Test Everything:** Scan QR code with phone
6. ✅ **Monitor:** Watch logs and analytics
7. ✅ **Backup:** Configure regular database backups
8. ✅ **Scale:** Monitor performance and scale as needed

### Quick Commands Reference

```bash
# Vercel
vercel --prod                    # Deploy
vercel logs --prod              # View logs
vercel env add KEY production   # Add variable
vercel domains ls               # List domains

# Railway
railway up                      # Deploy
railway logs                    # View logs
railway variables set KEY=value # Add variable
railway status                  # Check status

# Database
npx prisma migrate deploy       # Run migrations
npx prisma db seed             # Seed data
npx prisma studio              # View database
```

---

## 🚀 Happy Hosting!

Your multi-tenant QR menu system is production-ready and live!

For questions or issues, check the documentation or create an issue on GitHub.

**The Menu Genie Team** 🧞‍♂️✨
