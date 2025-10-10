-- ========================================
-- STEP 1: Delete Waseemco Tenant
-- ========================================

-- Find the waseemco tenant ID
-- SELECT id, "businessName", slug FROM tenants WHERE slug = 'waseemco';

-- Delete in proper order to avoid foreign key violations
-- Replace 'TENANT_ID_HERE' with the actual tenant ID from the SELECT above

BEGIN;

-- Delete audit logs for this tenant
DELETE FROM audit_logs WHERE "tenantId" = (SELECT id FROM tenants WHERE slug = 'waseemco');

-- Delete products
DELETE FROM products WHERE "tenantId" = (SELECT id FROM tenants WHERE slug = 'waseemco');

-- Delete categories
DELETE FROM categories WHERE "tenantId" = (SELECT id FROM tenants WHERE slug = 'waseemco');

-- Get users to delete
DELETE FROM users WHERE id IN (
  SELECT "userId" FROM tenant_users WHERE "tenantId" = (SELECT id FROM tenants WHERE slug = 'waseemco')
);

-- Delete tenant user relationships
DELETE FROM tenant_users WHERE "tenantId" = (SELECT id FROM tenants WHERE slug = 'waseemco');

-- Delete the tenant
DELETE FROM tenants WHERE slug = 'waseemco';

COMMIT;


-- ========================================
-- STEP 2: Create Demo Restaurant (Bella Italia)
-- ========================================

BEGIN;

-- Get super admin ID (replace if different)
-- SELECT id, email, role FROM users WHERE role = 'SUPER_ADMIN' LIMIT 1;

-- Get Restaurant business type ID
-- SELECT id, "nameEn" FROM business_types WHERE "nameEn" = 'Restaurant';

-- Create Restaurant Tenant
INSERT INTO tenants (
  id, slug, "businessName", "businessNameAr", "businessTypeId", 
  email, phone, address, "addressAr", "ownerName", "ownerEmail", "ownerPhone",
  subdomain, "defaultLanguage", currency, timezone,
  "primaryColor", "secondaryColor", "accentColor",
  description, "descriptionAr",
  "subscriptionStatus", "subscriptionPlan", "monthlyFee",
  "isActive", "createdById", "createdAt", "updatedAt"
) VALUES (
  'demo_restaurant_001',
  'bella-italia',
  'Bella Italia',
  'بيلا إيطاليا',
  (SELECT id FROM business_types WHERE "nameEn" = 'Restaurant' LIMIT 1),
  'info@bellaitalia.com',
  '+20 100 123 4567',
  '15 Tahrir Square, Downtown Cairo',
  '15 ميدان التحرير، وسط القاهرة',
  'Marco Rossi',
  'admin@bellaitalia.com',
  '+20 100 123 4567',
  'bellaitalia',
  'en',
  'EGP',
  'Africa/Cairo',
  '#D32F2F',
  '#388E3C',
  '#FBC02D',
  'Authentic Italian cuisine in the heart of Cairo',
  'مطبخ إيطالي أصيل في قلب القاهرة',
  'ACTIVE',
  'PREMIUM',
  500,
  true,
  (SELECT id FROM users WHERE role = 'SUPER_ADMIN' LIMIT 1),
  NOW(),
  NOW()
);

-- Create admin user for restaurant
INSERT INTO users (
  id, email, "firstName", "lastName", password, role,
  "mustChangePassword", "isActive", "createdAt", "updatedAt"
) VALUES (
  'demo_restaurant_admin_001',
  'admin@bellaitalia.com',
  'Marco',
  'Rossi',
  '$2a$10$xHhUvJFYvKZ9qKGVZDNqKe8T7vJk6YqKjKj4F0vRGZNqKjKj4F0vR',
  'ADMIN',
  false,
  true,
  NOW(),
  NOW()
);

-- Link user to tenant
INSERT INTO tenant_users (
  id, "tenantId", "userId", role, "createdAt", "updatedAt"
) VALUES (
  'demo_restaurant_tu_001',
  'demo_restaurant_001',
  'demo_restaurant_admin_001',
  'ADMIN',
  NOW(),
  NOW()
);

-- Create Categories
INSERT INTO categories (
  id, "tenantId", "nameEn", "nameAr", "descriptionEn", "descriptionAr",
  "sortOrder", "isActive", "createdById", "createdAt", "updatedAt"
) VALUES
('cat_pasta_001', 'demo_restaurant_001', 'Pasta', 'معكرونة', 'Handmade pasta dishes', 'أطباق معكرونة مصنوعة يدوياً', 1, true, 'demo_restaurant_admin_001', NOW(), NOW()),
('cat_pizza_001', 'demo_restaurant_001', 'Pizza', 'بيتزا', 'Wood-fired authentic Italian pizzas', 'بيتزا إيطالية أصلية مطهوة في الفرن', 2, true, 'demo_restaurant_admin_001', NOW(), NOW()),
('cat_desserts_001', 'demo_restaurant_001', 'Desserts', 'حلويات', 'Traditional Italian desserts', 'حلويات إيطالية تقليدية', 3, true, 'demo_restaurant_admin_001', NOW(), NOW());

-- Create Products
INSERT INTO products (
  id, "tenantId", "categoryId", "nameEn", "nameAr", "descriptionEn", "descriptionAr",
  "basePrice", calories, "isActive", "isFeatured", "sortOrder", "createdById", "createdAt", "updatedAt"
) VALUES
-- Pasta
('prod_carbonara_001', 'demo_restaurant_001', 'cat_pasta_001', 'Spaghetti Carbonara', 'سباغيتي كاربونارا', 'Classic Roman pasta with eggs and cheese', 'معكرونة رومانية كلاسيكية', 150.00, 450, true, true, 1, 'demo_restaurant_admin_001', NOW(), NOW()),
('prod_arrabbiata_001', 'demo_restaurant_001', 'cat_pasta_001', 'Penne Arrabbiata', 'بيني أرابياتا', 'Spicy tomato sauce pasta', 'معكرونة بصلصة طماطم حارة', 120.00, 380, true, false, 2, 'demo_restaurant_admin_001', NOW(), NOW()),
('prod_alfredo_001', 'demo_restaurant_001', 'cat_pasta_001', 'Fettuccine Alfredo', 'فيتوتشيني ألفريدو', 'Creamy pasta with parmesan', 'معكرونة كريمية بالبارميزان', 140.00, 520, true, true, 3, 'demo_restaurant_admin_001', NOW(), NOW()),
-- Pizza
('prod_margherita_001', 'demo_restaurant_001', 'cat_pizza_001', 'Margherita', 'مارغريتا', 'Tomato, mozzarella, and basil', 'طماطم، موتزاريلا، وريحان', 130.00, 680, true, true, 1, 'demo_restaurant_admin_001', NOW(), NOW()),
('prod_quattro_001', 'demo_restaurant_001', 'cat_pizza_001', 'Quattro Formaggi', 'أربع أجبان', 'Four cheese pizza', 'بيتزا بأربع أجبان', 160.00, 750, true, false, 2, 'demo_restaurant_admin_001', NOW(), NOW()),
('prod_pepperoni_001', 'demo_restaurant_001', 'cat_pizza_001', 'Pepperoni', 'بيبروني', 'Classic pepperoni pizza', 'بيتزا بيبروني كلاسيكية', 145.00, 720, true, true, 3, 'demo_restaurant_admin_001', NOW(), NOW()),
-- Desserts
('prod_tiramisu_001', 'demo_restaurant_001', 'cat_desserts_001', 'Tiramisu', 'تيراميسو', 'Coffee and mascarpone dessert', 'حلوى بالقهوة والماسكاربوني', 80.00, 450, true, true, 1, 'demo_restaurant_admin_001', NOW(), NOW()),
('prod_pannacotta_001', 'demo_restaurant_001', 'cat_desserts_001', 'Panna Cotta', 'بانا كوتا', 'Creamy Italian dessert', 'حلوى إيطالية كريمية', 70.00, 320, true, false, 2, 'demo_restaurant_admin_001', NOW(), NOW());

COMMIT;


-- ========================================
-- STEP 3: Create Demo Coffee Shop (Artisan Brew)
-- ========================================

BEGIN;

-- Create Coffee Shop Tenant
INSERT INTO tenants (
  id, slug, "businessName", "businessNameAr", "businessTypeId",
  email, phone, address, "addressAr", "ownerName", "ownerEmail", "ownerPhone",
  subdomain, "defaultLanguage", currency, timezone,
  "primaryColor", "secondaryColor", "accentColor",
  description, "descriptionAr",
  "subscriptionStatus", "subscriptionPlan", "monthlyFee",
  "isActive", "createdById", "createdAt", "updatedAt"
) VALUES (
  'demo_coffee_001',
  'artisan-brew',
  'Artisan Brew Coffee',
  'أرتيزان برو كافيه',
  (SELECT id FROM business_types WHERE "nameEn" = 'Cafe' LIMIT 1),
  'hello@artisanbrew.com',
  '+20 111 234 5678',
  '42 Zamalek Street, Zamalek, Cairo',
  '42 شارع الزمالك، الزمالك، القاهرة',
  'Sarah Ahmed',
  'admin@artisanbrew.com',
  '+20 111 234 5678',
  'artisanbrew',
  'en',
  'EGP',
  'Africa/Cairo',
  '#6F4E37',
  '#D4A574',
  '#2C1810',
  'Specialty coffee roasted in-house',
  'قهوة مختصة محمصة محلياً',
  'ACTIVE',
  'PREMIUM',
  500,
  true,
  (SELECT id FROM users WHERE role = 'SUPER_ADMIN' LIMIT 1),
  NOW(),
  NOW()
);

-- Create admin user for coffee shop
INSERT INTO users (
  id, email, "firstName", "lastName", password, role,
  "mustChangePassword", "isActive", "createdAt", "updatedAt"
) VALUES (
  'demo_coffee_admin_001',
  'admin@artisanbrew.com',
  'Sarah',
  'Ahmed',
  '$2a$10$xHhUvJFYvKZ9qKGVZDNqKe8T7vJk6YqKjKj4F0vRGZNqKjKj4F0vR',
  'ADMIN',
  false,
  true,
  NOW(),
  NOW()
);

-- Link user to tenant
INSERT INTO tenant_users (
  id, "tenantId", "userId", role, "createdAt", "updatedAt"
) VALUES (
  'demo_coffee_tu_001',
  'demo_coffee_001',
  'demo_coffee_admin_001',
  'ADMIN',
  NOW(),
  NOW()
);

-- Create Categories
INSERT INTO categories (
  id, "tenantId", "nameEn", "nameAr", "descriptionEn", "descriptionAr",
  "sortOrder", "isActive", "createdById", "createdAt", "updatedAt"
) VALUES
('cat_espresso_001', 'demo_coffee_001', 'Espresso Bar', 'قهوة إسبريسو', 'Classic espresso-based drinks', 'مشروبات إسبريسو كلاسيكية', 1, true, 'demo_coffee_admin_001', NOW(), NOW()),
('cat_brewed_001', 'demo_coffee_001', 'Brewed Coffee', 'قهوة مخمرة', 'Pour over and filter coffee', 'قهوة منسكبة ومفلترة', 2, true, 'demo_coffee_admin_001', NOW(), NOW()),
('cat_pastries_001', 'demo_coffee_001', 'Pastries & Treats', 'معجنات وحلويات', 'Freshly baked daily', 'مخبوزة طازجة يومياً', 3, true, 'demo_coffee_admin_001', NOW(), NOW()),
('cat_specialty_001', 'demo_coffee_001', 'Specialty Drinks', 'مشروبات مميزة', 'Unique seasonal creations', 'إبداعات موسمية فريدة', 4, true, 'demo_coffee_admin_001', NOW(), NOW());

-- Create Products
INSERT INTO products (
  id, "tenantId", "categoryId", "nameEn", "nameAr", "descriptionEn", "descriptionAr",
  "basePrice", calories, "isActive", "isFeatured", "sortOrder", "createdById", "createdAt", "updatedAt"
) VALUES
-- Espresso
('prod_espresso_001', 'demo_coffee_001', 'cat_espresso_001', 'Single Origin Espresso', 'إسبريسو منشأ واحد', 'Ethiopian beans espresso', 'إسبريسو من حبوب إثيوبية', 45.00, 5, true, true, 1, 'demo_coffee_admin_001', NOW(), NOW()),
('prod_cappuccino_001', 'demo_coffee_001', 'cat_espresso_001', 'Cappuccino', 'كابتشينو', 'Espresso with steamed milk', 'إسبريسو مع حليب مبخر', 50.00, 120, true, true, 2, 'demo_coffee_admin_001', NOW(), NOW()),
('prod_flatwhite_001', 'demo_coffee_001', 'cat_espresso_001', 'Flat White', 'فلات وايت', 'Double espresso with microfoam', 'إسبريسو مزدوج بالرغوة', 55.00, 130, true, false, 3, 'demo_coffee_admin_001', NOW(), NOW()),
('prod_latte_001', 'demo_coffee_001', 'cat_espresso_001', 'Latte', 'لاتيه', 'Espresso with steamed milk', 'إسبريسو مع حليب مبخر', 52.00, 150, true, true, 4, 'demo_coffee_admin_001', NOW(), NOW()),
-- Brewed
('prod_v60_001', 'demo_coffee_001', 'cat_brewed_001', 'V60 Pour Over', 'في60 صب', 'Hand-poured single-origin', 'قهوة منشأ واحد مسكوبة يدوياً', 60.00, 5, true, true, 1, 'demo_coffee_admin_001', NOW(), NOW()),
('prod_chemex_001', 'demo_coffee_001', 'cat_brewed_001', 'Chemex', 'كيمكس', 'Clean, bright coffee', 'قهوة نظيفة ومشرقة', 65.00, 5, true, false, 2, 'demo_coffee_admin_001', NOW(), NOW()),
('prod_coldbrew_001', 'demo_coffee_001', 'cat_brewed_001', 'Cold Brew', 'قهوة باردة', 'Steeped for 18 hours', 'منقوعة 18 ساعة', 58.00, 10, true, true, 3, 'demo_coffee_admin_001', NOW(), NOW()),
-- Pastries
('prod_croissant_001', 'demo_coffee_001', 'cat_pastries_001', 'Croissant', 'كرواسون', 'Buttery French croissant', 'كرواسون فرنسي بالزبدة', 35.00, 230, true, false, 1, 'demo_coffee_admin_001', NOW(), NOW()),
('prod_muffin_001', 'demo_coffee_001', 'cat_pastries_001', 'Chocolate Muffin', 'مافن بالشوكولاتة', 'Rich chocolate muffin', 'مافن شوكولاتة غني', 30.00, 380, true, true, 2, 'demo_coffee_admin_001', NOW(), NOW()),
('prod_biscotti_001', 'demo_coffee_001', 'cat_pastries_001', 'Almond Biscotti', 'بسكوتي باللوز', 'Crunchy Italian cookie', 'بسكويت إيطالي مقرمش', 25.00, 150, true, false, 3, 'demo_coffee_admin_001', NOW(), NOW()),
-- Specialty
('prod_lavender_001', 'demo_coffee_001', 'cat_specialty_001', 'Honey Lavender Latte', 'لاتيه بالعسل والخزامى', 'Latte with honey and lavender', 'لاتيه مع عسل وخزامى', 65.00, 180, true, true, 1, 'demo_coffee_admin_001', NOW(), NOW()),
('prod_cardamom_001', 'demo_coffee_001', 'cat_specialty_001', 'Cardamom Cappuccino', 'كابتشينو بالهيل', 'Cappuccino with cardamom', 'كابتشينو مع هيل', 58.00, 125, true, true, 2, 'demo_coffee_admin_001', NOW(), NOW());

COMMIT;

-- ========================================
-- VERIFICATION
-- ========================================

-- Check tenants
SELECT id, "businessName", slug, email FROM tenants WHERE slug IN ('bella-italia', 'artisan-brew');

-- Check categories
SELECT t."businessName", c."nameEn", c."sortOrder" 
FROM categories c 
JOIN tenants t ON c."tenantId" = t.id 
WHERE t.slug IN ('bella-italia', 'artisan-brew')
ORDER BY t."businessName", c."sortOrder";

-- Check products count
SELECT t."businessName", COUNT(p.id) as product_count
FROM tenants t
LEFT JOIN products p ON p."tenantId" = t.id
WHERE t.slug IN ('bella-italia', 'artisan-brew')
GROUP BY t.id, t."businessName";

-- ========================================
-- SUMMARY
-- ========================================
-- Restaurant (Bella Italia):
--   Login: admin@bellaitalia.com / 123456
--   Dashboard: https://themenugenie.com/tenant/bella-italia/dashboard
--   Menu: https://themenugenie.com/menu/bella-italia
--   3 categories, 8 products

-- Coffee Shop (Artisan Brew):
--   Login: admin@artisanbrew.com / 123456
--   Dashboard: https://themenugenie.com/tenant/artisan-brew/dashboard
--   Menu: https://themenugenie.com/menu/artisan-brew
--   4 categories, 12 products
