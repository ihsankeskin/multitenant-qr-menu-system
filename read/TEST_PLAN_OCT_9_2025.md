# Test Plan - Authentication & Form Fixes
## Date: October 9, 2025

## Test Environment
- **Platform:** https://themenugenie.com
- **Tenant:** demo-restaurant
- **Testing Tool:** Playwright MCP Server
- **Test Data:**
  - 2 Categories (Beverages, Main Dishes)
  - 1 Product (Espresso in Beverages category)

---

## Test Suite 1: Authentication Flow

### Test 1.1: No Token Redirect ✓
**Objective:** Verify dashboard redirects to login when no token exists

**Steps:**
1. Clear all localStorage data
2. Navigate to `/tenant/demo-restaurant/dashboard`
3. Verify redirect to `/tenant/demo-restaurant/login`

**Expected Result:** User is redirected to login page

**Status:** PENDING

---

### Test 1.2: Expired Token Redirect ✓
**Objective:** Verify dashboard handles expired tokens gracefully

**Steps:**
1. Set an invalid/expired token in localStorage
2. Navigate to `/tenant/demo-restaurant/dashboard`
3. Verify token verification API call is made
4. Verify localStorage is cleared
5. Verify redirect to login page

**Expected Result:** 
- Token verification fails
- Storage cleared
- User redirected to login

**Status:** PENDING

---

### Test 1.3: Valid Token Success ✓
**Objective:** Verify dashboard loads normally with valid token

**Steps:**
1. Login with valid credentials (admin@demo-restaurant.com)
2. Verify token is stored
3. Navigate to dashboard
4. Verify dashboard content loads
5. Verify no 401 errors in console

**Expected Result:** Dashboard loads successfully with all data

**Status:** PENDING

---

### Test 1.4: Token Expiration During Session
**Objective:** Verify behavior when token expires mid-session

**Steps:**
1. Login successfully
2. Wait for token to expire (or manually invalidate)
3. Try to perform an action (e.g., edit product)
4. Verify redirect to login

**Expected Result:** User is redirected to login when token becomes invalid

**Status:** PENDING

---

### Test 1.5: Logout and Re-login ✓
**Objective:** Verify logout clears data and re-login works

**Steps:**
1. Login successfully
2. Navigate to dashboard
3. Click logout button
4. Verify localStorage is cleared
5. Verify redirect to login
6. Login again
7. Verify dashboard loads

**Expected Result:** Clean logout and successful re-login

**Status:** PENDING

---

## Test Suite 2: Product Edit Form

### Test 2.1: Category Dropdown Preselection ✓
**Objective:** Verify category dropdown shows selected category when editing

**Pre-conditions:** Espresso product exists with categoryId set to Beverages

**Steps:**
1. Navigate to Products tab
2. Click edit button on Espresso product
3. Observe category dropdown in edit modal
4. Verify "Beverages" is selected (not "Select a category")

**Expected Result:** Category dropdown shows "Beverages" as selected

**Status:** PENDING

---

### Test 2.2: Price Field Shows Value ✓
**Objective:** Verify price field populates with product's basePrice

**Steps:**
1. Edit Espresso product (basePrice: 25.00)
2. Observe Base Price field
3. Verify field shows "25" or "25.00"

**Expected Result:** Base Price field contains product's price

**Status:** ALREADY WORKING (verified Oct 7)

---

### Test 2.3: Update Product with Category ✓
**Objective:** Verify product updates save category correctly

**Steps:**
1. Edit Espresso product
2. Change category to "Main Dishes"
3. Click Save
4. Verify success message
5. Reload page
6. Verify product shows under Main Dishes

**Expected Result:** Product category updates successfully

**Status:** PENDING

---

### Test 2.4: Create New Product ✓
**Objective:** Verify new products can be created with category

**Steps:**
1. Navigate to Products tab
2. Click "Add Product" button
3. Fill in all required fields
4. Select "Beverages" category
5. Set base price to 15.00
6. Click Save
7. Verify product appears in list

**Expected Result:** New product created with correct category

**Status:** PENDING

---

## Test Suite 3: Product Category Display

### Test 3.1: Product Card Shows Category Name ✓
**Objective:** Verify product cards display category name (not "Unknown")

**Steps:**
1. Navigate to Dashboard tab
2. Observe Espresso product card
3. Check category display
4. Verify shows "Category: Beverages" (not "Unknown")

**Expected Result:** Product card shows correct category name

**Status:** PENDING

---

### Test 3.2: Product Card with Missing Category
**Objective:** Verify graceful handling when category is missing

**Steps:**
1. Create a product without category relation (manually via API if needed)
2. Navigate to dashboard
3. Observe product card
4. Verify shows "Category: Unknown" gracefully

**Expected Result:** Shows "Unknown" without errors

**Status:** PENDING (Nice to have)

---

### Test 3.3: Multiple Products Different Categories ✓
**Objective:** Verify all products show their correct categories

**Steps:**
1. Create products in different categories
2. Navigate to dashboard
3. Verify each product shows its own category

**Expected Result:** Each product displays its assigned category

**Status:** PENDING

---

## Test Suite 4: Category Product Counts

### Test 4.1: Category Shows Product Count ✓
**Objective:** Verify categories display correct product counts

**Pre-conditions:** Beverages has 1 product (Espresso)

**Steps:**
1. Navigate to Categories tab
2. Observe Beverages category card
3. Check product count display
4. Verify shows "1 Product" or "1 Products"

**Expected Result:** Shows "1" (not "0")

**Status:** PENDING

---

### Test 4.2: Product Count Updates on Add ✓
**Objective:** Verify count updates when product is added

**Steps:**
1. Note current product count for Beverages
2. Create new product in Beverages category
3. Return to Categories tab
4. Verify count increased by 1

**Expected Result:** Product count increments

**Status:** PENDING

---

### Test 4.3: Product Count Updates on Delete ✓
**Objective:** Verify count updates when product is deleted

**Steps:**
1. Note current product count for Beverages
2. Delete a product from Beverages
3. Return to Categories tab
4. Verify count decreased by 1

**Expected Result:** Product count decrements

**Status:** PENDING

---

## Test Suite 5: Analytics (Investigation Needed)

### Test 5.1: Total Counts Accuracy ✓
**Objective:** Verify analytics shows correct total counts

**Steps:**
1. Navigate to Analytics tab
2. Check Total Categories count
3. Check Total Products count
4. Compare with actual data

**Expected Result:** 
- Categories: 2
- Products: 1 (or current count)

**Status:** ALREADY WORKING (verified Oct 7)

---

### Test 5.2: Active Counts with Active Items
**Objective:** Verify active counts when items have isActive: true

**Steps:**
1. Ensure test category has isActive: true
2. Ensure test product has isActive: true
3. Navigate to Analytics tab
4. Check active counts

**Expected Result:** Shows non-zero active counts

**Status:** PENDING (Needs new test data)

---

### Test 5.3: Pricing Calculations ⚠️
**Objective:** Verify analytics shows correct pricing data

**Pre-conditions:** Espresso product with basePrice: 25.00

**Steps:**
1. Navigate to Analytics tab
2. Check Average Price
3. Check Lowest Price
4. Check Highest Price

**Expected Result:** 
- All show 25.00 EGP (not 0.00)

**Status:** NEEDS INVESTIGATION - Known Issue

---

### Test 5.4: Inventory Status ✓
**Objective:** Verify inventory calculations are correct

**Steps:**
1. Navigate to Analytics tab
2. Check "X of Y available" status
3. Verify matches actual product stock

**Expected Result:** Shows "1 of 1 available"

**Status:** ALREADY WORKING (verified Oct 7)

---

## Test Suite 6: Admin Access (Future)

### Test 6.1: Super-Admin Creates Admin
**Objective:** Verify admin creation flow

**Steps:**
1. Login as super-admin
2. Navigate to Admins section
3. Create new admin user
4. Assign to demo-restaurant tenant
5. Verify success

**Expected Result:** Admin created with tenant access

**Status:** PENDING

---

### Test 6.2: Admin Logs In
**Objective:** Verify admin can login with credentials

**Steps:**
1. Logout from super-admin
2. Navigate to demo-restaurant login
3. Login with new admin credentials
4. Verify successful login

**Expected Result:** Admin logs in successfully

**Status:** PENDING

---

### Test 6.3: Admin Accesses Assigned Tenant
**Objective:** Verify admin has access to assigned tenant

**Steps:**
1. Login as admin
2. Verify dashboard loads
3. Verify can view/edit data

**Expected Result:** Full tenant access granted

**Status:** PENDING

---

### Test 6.4: Admin Cannot Access Unassigned Tenant
**Objective:** Verify admin restricted to assigned tenants

**Steps:**
1. Login as admin assigned to demo-restaurant
2. Try to access different tenant (manually change URL)
3. Verify access denied

**Expected Result:** 403 or redirect to login

**Status:** PENDING

---

## Test Execution Order

### Phase 1: Critical Fixes (IMMEDIATE)
1. Authentication Flow Tests (1.1, 1.2, 1.3)
2. Category Dropdown Test (2.1)
3. Product Category Display (3.1)
4. Category Product Count (4.1)

### Phase 2: Functionality Verification (NEXT)
5. Product CRUD Operations (2.3, 2.4)
6. Multiple Products Test (3.3)
7. Product Count Updates (4.2, 4.3)

### Phase 3: Analytics Investigation (AFTER)
8. Active Counts Test (5.2) - Requires new test data
9. Pricing Calculations Investigation (5.3) - Known issue

### Phase 4: Admin Access (FUTURE SPRINT)
10. Admin Creation and Access Tests (6.1-6.4)

---

## Success Criteria

### Must Pass (Phase 1)
- ✅ Dashboard redirects to login when no/invalid token
- ✅ Category dropdown preselects in edit form
- ✅ Product cards show category names (not "Unknown")
- ✅ Categories show accurate product counts

### Should Pass (Phase 2)
- ✅ Product updates save correctly
- ✅ New products can be created
- ✅ Product counts update on add/delete

### Nice to Have (Phase 3+)
- ⚠️ Analytics pricing calculations work
- ⚠️ Active counts reflect isActive status
- 📋 Admin access works end-to-end

---

## Test Data Setup

### Required Test Data
```javascript
// Categories
1. Beverages (isActive: true)
2. Main Dishes (isActive: true)

// Products
1. Espresso
   - categoryId: Beverages.id
   - basePrice: 25.00
   - isActive: true
   - isOutOfStock: false
```

### Setup Script
```javascript
// Login
await page.goto('https://themenugenie.com/tenant/demo-restaurant/login')
await page.fill('input[type="email"]', 'admin@demo-restaurant.com')
await page.fill('input[type="password"]', 'DemoAdmin123!')
await page.click('button[type="submit"]')
await page.waitForURL('**/dashboard')

// Create Categories if needed
// Create Products if needed
```

---

## Notes

- All tests should be automated with Playwright where possible
- Manual verification needed for visual elements (colors, styles)
- Error console should be checked during all tests
- Network tab should be monitored for failed requests
- Tests should be repeatable and cleanup after themselves

---

## Report Template

After each test run, document:
- ✅ PASS / ❌ FAIL / ⚠️ NEEDS FIX
- Screenshots if applicable
- Error messages if failed
- Steps to reproduce if failed
- Time to execute

---

## Status Legend
- ✅ PASS - Test passed completely
- ❌ FAIL - Test failed, needs fix
- ⚠️ NEEDS FIX - Known issue, documented
- 📋 PENDING - Not yet executed
- 🔄 IN PROGRESS - Currently testing
- ⏭️ SKIPPED - Skipped for now
