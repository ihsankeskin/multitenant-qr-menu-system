# 🚀 Production Deployment Guide
## Multi-Tenant QR Menu System v2.0

This guide covers deploying your QR Menu System to production on **Vercel** (frontend + API) and **Railway** (database + full-stack).

---

## 📋 Pre-Deployment Checklist

### ✅ Required Components
- [x] Next.js application with API routes
- [x] PostgreSQL database (production-ready)
- [x] Environment variables configured
- [x] Build scripts prepared
- [x] Prisma schema optimized for production

### ✅ Files Prepared
- [x] `.env.example` - Template for environment variables
- [x] `vercel.json` - Vercel deployment configuration
- [x] `railway.json` - Railway deployment configuration
- [x] `schema-production.prisma` - PostgreSQL optimized schema
- [x] `build-production.sh` - Production build script
- [x] `deploy-vercel.sh` - Vercel deployment automation
- [x] `deploy-railway.sh` - Railway deployment automation

---

## 🔧 Environment Variables Setup

### Core Variables (Required)
```bash
# Database
DATABASE_URL="postgresql://username:password@hostname:5432/database_name"

# Security
JWT_SECRET="your-super-secure-jwt-secret-key-min-32-chars"
JWT_EXPIRES_IN="24h"
JWT_REFRESH_EXPIRES_IN="7d"
BCRYPT_ROUNDS="12"

# Application URLs
NEXT_PUBLIC_APP_URL="https://your-domain.com"
NEXT_PUBLIC_API_URL="https://your-domain.com/api"
NEXT_PUBLIC_SUPER_ADMIN_URL="https://your-domain.com/super-admin"

# Admin Credentials (Change after first login)
DEFAULT_SUPER_ADMIN_EMAIL="admin@qrmenu.system"
DEFAULT_SUPER_ADMIN_PASSWORD="ChangeMe123!"

# Production Settings
NODE_ENV="production"
NEXT_TELEMETRY_DISABLED="1"
```

### Optional Variables
```bash
# Email Configuration (for notifications)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_SECURE="false"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
FROM_EMAIL="noreply@your-domain.com"
FROM_NAME="QR Menu System"

# Security & Performance
ALLOWED_ORIGINS="https://your-domain.com"
RATE_LIMIT_MAX="100"
RATE_LIMIT_WINDOW="15"
MAX_IMAGE_SIZE_MB="3"
```

---

## 🚀 Deployment Options

### Option 1: Vercel (Recommended for Next.js)

**Advantages:**
- ✅ Optimized for Next.js applications
- ✅ Automatic HTTPS and CDN
- ✅ Serverless functions for API routes
- ✅ Easy domain management
- ✅ Excellent performance

**Steps:**

1. **Prepare for deployment:**
   ```bash
   chmod +x deploy-vercel.sh
   ./deploy-vercel.sh
   ```

2. **Manual Setup Alternative:**
   ```bash
   # Install Vercel CLI
   npm i -g vercel
   
   # Login to Vercel
   vercel login
   
   # Deploy
   vercel --prod
   ```

3. **Configure Database:**
   - Use **Supabase**, **PlanetScale**, or **Neon** for PostgreSQL
   - Set `DATABASE_URL` in Vercel environment variables

4. **Domain Setup:**
   - Add your custom domain in Vercel dashboard
   - Update `NEXT_PUBLIC_APP_URL` to match your domain

### Option 2: Railway (Full-Stack Platform)

**Advantages:**
- ✅ Integrated PostgreSQL database
- ✅ Simple deployment process
- ✅ Built-in database management
- ✅ Environment variable management
- ✅ Automatic SSL certificates

**Steps:**

1. **Prepare for deployment:**
   ```bash
   chmod +x deploy-railway.sh
   ./deploy-railway.sh
   ```

2. **Manual Setup Alternative:**
   ```bash
   # Install Railway CLI
   npm i -g @railway/cli
   
   # Login to Railway
   railway login
   
   # Create project and deploy
   railway init
   railway up
   ```

3. **Database Setup:**
   - Railway provides integrated PostgreSQL
   - Database URL is automatically configured
   - Access database via Railway dashboard

---

## 🗄️ Database Setup

### PostgreSQL Schema Migration

1. **Use production schema:**
   ```bash
   cp prisma/schema-production.prisma prisma/schema.prisma
   ```

2. **Generate Prisma client:**
   ```bash
   npx prisma generate
   ```

3. **Run migrations:**
   ```bash
   npx prisma migrate deploy
   ```

4. **Seed initial data (optional):**
   ```bash
   npm run db:seed
   ```

### Database Providers

**Recommended Services:**
- **Supabase** (Free tier: 500MB, 2 projects)
- **PlanetScale** (Free tier: 1 database, 1GB storage)
- **Neon** (Free tier: 3 projects, 3GB storage)
- **Railway PostgreSQL** (Integrated with Railway deployment)
- **Vercel Postgres** (Integrated with Vercel)

---

## 🔐 Security Configuration

### 1. Environment Variables Security
- ✅ Never commit `.env` files to version control
- ✅ Use strong, unique JWT secrets (32+ characters)
- ✅ Rotate secrets regularly
- ✅ Use different secrets for different environments

### 2. Database Security
- ✅ Use connection pooling
- ✅ Enable SSL connections
- ✅ Restrict database access by IP
- ✅ Regular backups

### 3. Application Security
- ✅ HTTPS only in production
- ✅ Content Security Policy headers
- ✅ Rate limiting enabled
- ✅ Input validation and sanitization

---

## 🧪 Testing Deployment

### 1. Application Health Check
```bash
# Test main application
curl -I https://your-domain.com

# Test API endpoint
curl -I https://your-domain.com/api/v1/business-types

# Test super admin login
curl -X POST https://your-domain.com/api/v1/super-admin/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@qrmenu.system","password":"ChangeMe123!"}'
```

### 2. Functional Testing
- [ ] Super admin login works
- [ ] Can create a new tenant
- [ ] Tenant dashboard loads
- [ ] Menu display works
- [ ] QR code generation works
- [ ] Image upload works
- [ ] Language switching works
- [ ] Mobile responsiveness

### 3. Performance Testing
- [ ] Page load times < 3 seconds
- [ ] API response times < 500ms
- [ ] Image loading optimized
- [ ] Database queries optimized

---

## 📊 Monitoring & Maintenance

### 1. Application Monitoring
- **Vercel Analytics**: Built-in performance monitoring
- **Railway Metrics**: CPU, memory, and network monitoring
- **Database Monitoring**: Query performance and connection pooling

### 2. Error Tracking
- **Sentry** for error tracking (optional)
- **LogRocket** for session recording (optional)
- **Vercel/Railway logs** for server-side errors

### 3. Backup Strategy
- **Database Backups**: Daily automated backups
- **Code Repository**: Git with multiple remotes
- **Environment Variables**: Secure backup of configuration

---

## 🔄 CI/CD Pipeline (Optional)

### GitHub Actions Integration

1. **Create `.github/workflows/deploy.yml`:**
   ```yaml
   name: Deploy to Production
   on:
     push:
       branches: [main]
   
   jobs:
     deploy:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v2
         - name: Setup Node.js
           uses: actions/setup-node@v2
           with:
             node-version: '18'
         - name: Install dependencies
           run: npm ci
         - name: Build application
           run: npm run build
         - name: Deploy to Vercel
           uses: amondnet/vercel-action@v20
           with:
             vercel-token: ${{ secrets.VERCEL_TOKEN }}
             vercel-org-id: ${{ secrets.ORG_ID }}
             vercel-project-id: ${{ secrets.PROJECT_ID }}
   ```

---

## 🚨 Troubleshooting

### Common Issues

1. **Build Failures:**
   ```bash
   # Clear build cache
   rm -rf .next
   npm run build
   
   # Check Node.js version
   node -v  # Should be 18+
   ```

2. **Database Connection Issues:**
   ```bash
   # Test database connection
   npx prisma db pull
   
   # Check environment variables
   echo $DATABASE_URL
   ```

3. **Environment Variable Issues:**
   ```bash
   # Verify all required variables are set
   cat .env.local
   
   # Test JWT secret length
   echo -n "$JWT_SECRET" | wc -c  # Should be 32+
   ```

4. **Image Upload Issues:**
   - Check file size limits (3MB default)
   - Verify image formats (JPEG, PNG, WebP, GIF)
   - Test base64 encoding/decoding

---

## 📞 Support

### Documentation
- **Next.js Docs**: https://nextjs.org/docs
- **Prisma Docs**: https://www.prisma.io/docs
- **Vercel Docs**: https://vercel.com/docs
- **Railway Docs**: https://docs.railway.app

### Community
- **GitHub Issues**: Report bugs and feature requests
- **Discussions**: Ask questions and share experiences

---

## 🎉 Congratulations!

Your Multi-Tenant QR Menu System is now ready for production! 

**What's Next:**
1. 🔐 Change default admin password
2. 🏢 Create your first tenant
3. 📱 Test QR code scanning
4. 🌍 Configure your domain
5. 📧 Set up email notifications (optional)
6. 📊 Monitor application performance

**Happy Hosting! 🚀**