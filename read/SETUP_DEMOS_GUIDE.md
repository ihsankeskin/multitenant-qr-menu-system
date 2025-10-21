# Delete Waseemco & Create Demo Menus Guide

## Quick Summary

This guide helps you:
1. **Delete** the broken "waseemco" tenant
2. **Create** two complete demo menus (Restaurant + Coffee Shop)

---

## ⚡ Fastest Method: Use Super Admin Dashboard

### Step 1: Delete Waseemco Tenant

1. Go to: https://themenugenie.com/super-admin/login
2. Login with your super admin credentials
3. Click on **"Tenants"** in the sidebar
4. Find the **"Waseem"** tenant in the list
5. Click the **Delete** button
6. Confirm the deletion

✅ **The deletion endpoint has been fixed** - it will now properly clean up all related data without errors!

### Step 2: Create Demo Menus Using SQL

The easiest way is to run the SQL commands in your Vercel Postgres database:

1. Go to your Vercel project dashboard
2. Navigate to **Storage → Your Postgres Database → Query**
3. Copy and paste the SQL from `DELETE_WASEEMCO_AND_CREATE_DEMOS.sql`
4. Run each section (Step 1, Step 2, Step 3) separately

---

## 📊 What You'll Get

### Demo Restaurant: Bella Italia 🍝

**Access:**
- Menu: https://themenugenie.com/menu/bella-italia
- Dashboard: https://themenugenie.com/tenant/bella-italia/dashboard
- Login: `admin@bellaitalia.com` / `123456`

**Content:**
- ✅ 3 Categories (Pasta, Pizza, Desserts)
- ✅ 8 Products with Arabic translations
- ✅ Prices in EGP, calories included
- ✅ Featured items marked
- ✅ Italian-themed colors (Red, Green, Yellow)

**Products:**
- Spaghetti Carbonara, Penne Arrabbiata, Fettuccine Alfredo
- Margherita, Quattro Formaggi, Pepperoni
- Tiramisu, Panna Cotta

---

### Demo Coffee Shop: Artisan Brew ☕

**Access:**
- Menu: https://themenugenie.com/menu/artisan-brew
- Dashboard: https://themenugenie.com/tenant/artisan-brew/dashboard
- Login: `admin@artisanbrew.com` / `123456`

**Content:**
- ✅ 4 Categories (Espresso Bar, Brewed Coffee, Pastries, Specialty Drinks)
- ✅ 12 Products with Arabic translations
- ✅ Specialty coffee pricing
- ✅ Coffee-themed colors (Brown, Tan, Dark Brown)

**Products:**
- Espresso drinks: Espresso, Cappuccino, Flat White, Latte
- Brewed: V60 Pour Over, Chemex, Cold Brew
- Pastries: Croissant, Chocolate Muffin, Almond Biscotti
- Specialty: Honey Lavender Latte, Cardamom Cappuccino

---

## 🔧 Alternative Method: Run SQL Manually

If you prefer full control, use the SQL file:

1. Open `DELETE_WASEEMCO_AND_CREATE_DEMOS.sql`
2. Connect to your Postgres database
3. Run **Step 1** (Delete Waseemco)
4. Run **Step 2** (Create Bella Italia)
5. Run **Step 3** (Create Artisan Brew)
6. Run the verification queries at the end

**Important Notes:**
- The SQL uses hardcoded IDs for simplicity
- Replace super admin ID if yours is different
- Business type IDs are queried dynamically

---

## ✅ Verification

After setup, check:

### Homepage
Visit https://themenugenie.com - You should see **both** menu cards:
- Bella Italia (with red/green gradient)
- Artisan Brew (with brown gradient)

### Restaurant Menu
Visit https://themenugenie.com/menu/bella-italia
- Should show 3 categories
- 8 products total
- Arabic and English names

### Coffee Shop Menu
Visit https://themenugenie.com/menu/artisan-brew
- Should show 4 categories
- 12 products total
- Specialty coffee items

### Dashboard Access
Try logging in to both dashboards:
- Restaurant: `admin@bellaitalia.com` / `123456`
- Coffee: `admin@artisanbrew.com` / `123456`

---

## 🐛 Troubleshooting

### Waseemco Deletion Still Fails (500 Error)

**Wait 1-2 minutes** - The fix was just deployed to Vercel. If it still fails:
1. Hard refresh your browser (Ctrl+Shift+R or Cmd+Shift+R)
2. Clear browser cache
3. Try again

### SQL Insert Fails: "User not found"

The SQL queries reference the super admin. Make sure you have a super admin user:

```sql
-- Check if super admin exists
SELECT id, email, role FROM users WHERE role = 'SUPER_ADMIN';
```

If not found, create one or update the `createdById` in the SQL to your existing admin user ID.

### SQL Insert Fails: "Business type not found"

Make sure business types exist:

```sql
SELECT id, "nameEn" FROM business_types;
```

If empty, you need to seed the database first with business types.

---

## 📝 Next Steps After Setup

1. **Add Logos** - Upload restaurant logos in Settings → General
2. **Add Product Images** - Make menus more attractive with photos
3. **Generate QR Codes** - Settings → QR رموز → Generate
4. **Test the Full Flow** - Scan QR codes, browse menus
5. **Share** - Send URLs to friends/colleagues

---

**🎉 Enjoy your new demo menus!**
