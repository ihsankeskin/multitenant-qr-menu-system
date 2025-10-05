# 🧞 The Menu Genie - Production Ready

## 🌐 Live at: [https://themenugenie.com](https://themenugenie.com)

Multi-Tenant QR Menu System for Restaurants & Cafes

---

## 🚀 Quick Deploy

### Step 1: Setup Production Environment
```bash
./setup-production.sh
```

This will:
- ✅ Generate secure JWT secret
- ✅ Generate admin password
- ✅ Create `.env.production` file
- ✅ Create `.credentials.txt` backup
- ✅ Make deployment scripts executable

### Step 2: Choose Deployment Platform

#### Option A: Vercel (Recommended)
```bash
./deploy-vercel-production.sh
```

#### Option B: Railway
```bash
./deploy-railway-production.sh
```

### Step 3: Configure Domain
Follow the DNS instructions provided by your deployment script.

---

## 📋 What You Get

### Features
- ✅ **Multi-Tenant Architecture** - Host unlimited restaurants
- ✅ **QR Code Menus** - Instant digital menus
- ✅ **Bilingual Support** - English & Arabic
- ✅ **Super Admin Panel** - Complete control
- ✅ **Tenant Management** - Full CRUD operations
- ✅ **Payment Tracking** - Subscription management
- ✅ **Analytics Dashboard** - Real-time insights
- ✅ **Role-Based Access** - SUPER_ADMIN & ADMIN roles
- ✅ **Secure Authentication** - JWT with forced password reset
- ✅ **Image Management** - Base64 or cloud storage
- ✅ **Responsive Design** - Mobile-first approach
- ✅ **Production Ready** - Optimized and secure

### Tech Stack
- **Framework:** Next.js 14.2.8 (App Router)
- **Database:** PostgreSQL (Production) / SQLite (Development)
- **ORM:** Prisma
- **Authentication:** JWT + bcrypt
- **Styling:** Tailwind CSS
- **UI Components:** Radix UI
- **Icons:** Lucide React
- **QR Codes:** qrcode library
- **Deployment:** Vercel / Railway

---

## 📁 Project Structure

```
Menu App/
├── app/                          # Next.js App Router
│   ├── api/v1/                  # API Routes
│   │   ├── super-admin/         # Super Admin APIs
│   │   ├── tenant/              # Tenant APIs
│   │   └── public/              # Public APIs
│   ├── super-admin/             # Super Admin Pages
│   ├── tenant/                  # Tenant Pages
│   └── menu/                    # Public Menu Pages
├── prisma/                       # Database
│   ├── schema.prisma           # Development (SQLite)
│   └── schema-production.prisma # Production (PostgreSQL)
├── components/                   # React Components
├── lib/                         # Utilities
├── locales/                     # Translations (EN/AR)
├── types/                       # TypeScript Types
└── public/                      # Static Assets
```

---

## 🔐 Security Features

### Authentication & Authorization
- JWT-based authentication
- Role-based access control (SUPER_ADMIN, ADMIN, TENANT_ADMIN, etc.)
- Forced password reset for new accounts
- Password hashing with bcrypt (12 rounds in production)
- Session management with secure tokens

### Security Headers
- X-Frame-Options: SAMEORIGIN
- X-Content-Type-Options: nosniff
- X-XSS-Protection: 1; mode=block
- Strict-Transport-Security (HSTS)
- Content Security Policy (CSP)

### Data Protection
- SQL injection protection via Prisma
- XSS protection via React
- CSRF protection
- Rate limiting on API endpoints
- Input validation and sanitization

---

## 📊 Admin Panel Features

### Super Admin Dashboard
- **Overview:** Total tenants, revenue, system health
- **Tenant Management:** Create, update, suspend, delete tenants
- **Admin Management:** Create and manage admin users
- **Financial Tracking:** Payment records, invoices, overdue tracking
- **Analytics:** Platform-wide statistics and insights
- **System Settings:** Configure platform settings
- **Audit Logs:** Track all system activities

### Tenant Dashboard
- **Menu Management:** Categories and products
- **QR Code Generation:** Download printable QR codes
- **Settings:** Business info, branding, languages
- **Analytics:** Menu views, popular items
- **Staff Management:** Add and manage staff access

---

## 🌍 Internationalization

### Supported Languages
- **English (EN)** - Primary
- **Arabic (AR)** - Full RTL support

### Translation Files
- `locales/en.json` - English translations
- `locales/ar.json` - Arabic translations

### Adding New Languages
1. Create new translation file: `locales/[lang].json`
2. Copy structure from `en.json`
3. Translate all keys
4. Update `LocalizationContext.tsx`

---

## 🗄️ Database Schema

### Main Models
- **User** - System users (admins, tenants, staff)
- **Tenant** - Restaurant/cafe accounts
- **TenantUser** - User-tenant relationships
- **BusinessType** - Restaurant categories
- **Category** - Menu categories
- **Product** - Menu items
- **PaymentRecord** - Subscription payments
- **AuditLog** - System activity logs

### Database Migrations
```bash
# Development (SQLite)
npx prisma migrate dev

# Production (PostgreSQL)
npx prisma migrate deploy
```

---

## 🔧 Configuration

### Environment Variables

#### Required
```bash
DATABASE_URL="postgresql://..."
JWT_SECRET="your-32-char-secret"
NEXT_PUBLIC_APP_URL="https://themenugenie.com"
NEXT_PUBLIC_API_URL="https://themenugenie.com/api"
DEFAULT_SUPER_ADMIN_EMAIL="admin@themenugenie.com"
DEFAULT_SUPER_ADMIN_PASSWORD="your-password"
```

#### Optional
```bash
SMTP_HOST="smtp.gmail.com"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
MAX_IMAGE_SIZE_MB="5"
RATE_LIMIT_MAX="100"
```

---

## 🧪 Testing

### Run Tests
```bash
npm test                    # Unit tests
npm run test:e2e           # E2E tests
npm run test:integration   # Integration tests
```

### Manual Testing Checklist
- [ ] Super admin login
- [ ] Create tenant
- [ ] Create category
- [ ] Create product
- [ ] Upload image
- [ ] Generate QR code
- [ ] View public menu
- [ ] Switch languages
- [ ] Record payment
- [ ] View analytics

---

## 📈 Performance

### Optimizations
- **Image Optimization:** Next.js Image component with WebP/AVIF
- **Code Splitting:** Automatic route-based splitting
- **Caching:** API response caching
- **Database Indexing:** Optimized queries
- **CDN:** Static assets via Vercel/Railway CDN
- **Compression:** Gzip/Brotli compression

### Performance Targets
- ⚡ First Contentful Paint: < 1.5s
- ⚡ Time to Interactive: < 3s
- ⚡ Largest Contentful Paint: < 2.5s
- ⚡ API Response Time: < 500ms
- ⚡ Lighthouse Score: > 90

---

## 🔄 Deployment Process

### Development → Production

1. **Local Development**
   ```bash
   npm run dev
   ```

2. **Test Build**
   ```bash
   npm run build
   npm start
   ```

3. **Run Setup**
   ```bash
   ./setup-production.sh
   ```

4. **Deploy**
   ```bash
   # Vercel
   ./deploy-vercel-production.sh
   
   # Or Railway
   ./deploy-railway-production.sh
   ```

5. **Verify**
   - Test all features
   - Check logs
   - Monitor performance

---

## 📞 Support & Documentation

### Documentation Files
- **PRODUCTION_DEPLOYMENT.md** - Complete deployment guide
- **PAYMENT_REGISTRATION_FEATURE.md** - Payment system docs
- **MULTITENANT_REQUIREMENTS.md** - Architecture overview
- **DEPLOYMENT_GUIDE.md** - General deployment info

### Useful Commands

```bash
# Development
npm run dev                 # Start dev server
npm run build              # Build for production
npm start                  # Start production server

# Database
npx prisma studio          # Open database GUI
npx prisma migrate dev     # Run migrations (dev)
npx prisma migrate deploy  # Run migrations (prod)
npx prisma db seed         # Seed database

# Deployment
vercel --prod              # Deploy to Vercel
railway up                 # Deploy to Railway

# Monitoring
vercel logs --prod         # View Vercel logs
railway logs               # View Railway logs
```

---

## 🐛 Troubleshooting

### Common Issues

**Build Fails:**
```bash
rm -rf .next node_modules
npm install
npm run build
```

**Database Connection Error:**
```bash
# Check DATABASE_URL format
echo $DATABASE_URL

# Test connection
npx prisma db pull
```

**Environment Variables Not Loading:**
```bash
# Vercel
vercel env pull

# Railway
railway variables
```

---

## 📜 License

Proprietary - All rights reserved

---

## 👥 Credits

**The Menu Genie Team**

Built with ❤️ using Next.js, Prisma, and modern web technologies.

---

## 🎉 Ready to Deploy?

Run this command to get started:

```bash
./setup-production.sh
```

Then follow the prompts to deploy to **themenugenie.com**!

**Questions?** Check `PRODUCTION_DEPLOYMENT.md` for the complete guide.

---

**🚀 Happy Hosting!** 🧞‍♂️✨
