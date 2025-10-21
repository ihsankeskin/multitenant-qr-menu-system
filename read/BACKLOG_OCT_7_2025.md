# Product Backlog - October 7, 2025

## Executive Summary
Comprehensive analysis using Playwright MCP testing revealed 6 critical issues affecting the tenant dashboard analytics, category relationships, and translations.

## Test Environment
- **Production URL**: https://themenugenie.com
- **Test Tenant**: waseemco
- **Test User**: waseem.ghaly@progressiosolutions.com
- **Test Date**: October 7, 2025
- **Test Method**: Playwright MCP automated testing

## Issues Found

### 🔴 CRITICAL: Issue #1 - Analytics API Returning Zero Counts
**Priority**: P0 - Critical
**Status**: 🔴 Open
**Component**: `/app/api/v1/tenant/analytics/route.ts`

**Description**:
The Analytics API is returning `totalCategories: 0` and `totalProducts: 0` even though the database contains 1 category and 2 products.

**Evidence** (Screenshots):
- `analytics-tab.png`: Shows "Total Categories: 0 (0 active)" and "Total Products: 0 (2 active)"
- `dashboard-empty-stats.png`: Dashboard showing "Categories: 0 (0 active)" and "Products: 0 (2 active)"

**Expected Behavior**:
- Total Categories: 1 (1 active)
- Total Products: 2 (2 active)

**Actual Behavior**:
- Total Categories: 0 (0 active)
- Total Products: 0 (**2 active**) ← Contradictory!

**Impact**:
- Dashboard displays incorrect statistics
- Users cannot see accurate menu health metrics
- Business intelligence data is unreliable

**Root Cause Hypothesis**:
The `activeProducts` count returns 2 correctly, but `totalProducts` and `totalCategories` return 0. This suggests:
1. The count queries might be using incorrect filters
2. There might be a data integrity issue (products/categories have null tenantId?)
3. The Promise.all destructuring might be misaligned

**Acceptance Criteria**:
- [ ] Analytics API returns `totalCategories: 1`
- [ ] Analytics API returns `totalProducts: 2`
- [ ] Dashboard displays correct counts
- [ ] Playwright test verifies counts are accurate

---

### 🔴 CRITICAL: Issue #2 - Products Show "Category: Unknown"
**Priority**: P0 - Critical
**Status**: 🔴 Open
**Component**: `/app/tenant/[slug]/dashboard/page.tsx`

**Description**:
Both products (Coffee and Tea) display "Category: Unknown" even though:
1. A category "Waseem" exists
2. Products should be linked to this category
3. The category dropdown shows "Waseem" as an option

**Evidence** (Screenshots):
- `products-tab.png`: Shows both Coffee (ج.م30.00) and Tea (ج.م15.00) with "Category: Unknown"

**Expected Behavior**:
- Coffee: Category: Waseem
- Tea: Category: Waseem

**Actual Behavior**:
- Coffee: Category: Unknown
- Tea: Category: Unknown

**Impact**:
- Products cannot be properly organized
- Menu display is confusing
- Category filtering doesn't work

**Root Cause Hypothesis**:
The category lookup logic `categories.find(c => c.id === product.categoryId)?.nameEn || 'Unknown'` is returning undefined because:
1. The `categories` array might be empty when products render
2. Products might have invalid/null `categoryId` values
3. There's a timing issue with data loading

**Code Location**:
```tsx
// Line ~1467 in dashboard/page.tsx
{t('tenant.products.category')}: {categories.find(c => c.id === product.categoryId)?.nameEn || t('tenant.products.unknown')}
```

**Acceptance Criteria**:
- [ ] Products display correct category name "Waseem"
- [ ] Category lookup logic finds the category successfully
- [ ] Data integrity verified (products have valid categoryId)
- [ ] Playwright test confirms category names display correctly

---

### 🔴 CRITICAL: Issue #3 - Category Shows "0 Products"
**Priority**: P0 - Critical
**Status**: 🔴 Open
**Component**: `/app/tenant/[slug]/dashboard/page.tsx` & `/app/api/v1/tenant/categories/route.ts`

**Description**:
The "Waseem" category displays "0 Products" even though 2 products exist and are active.

**Evidence** (Screenshots):
- `categories-tab.png`: Shows category "Waseem" with "0 Products"

**Expected Behavior**:
- Waseem: 2 Products

**Actual Behavior**:
- Waseem: 0 Products

**Impact**:
- Incorrect product count misleads users
- Cannot see which categories have products
- Menu organization appears empty

**Root Cause Hypothesis**:
1. The category API might not be including the product count properly
2. The products might have invalid categoryId that doesn't match
3. The UI might be counting from a filtered/empty array instead of using API data

**Code Location**:
Categories API should include `_count` with products:
```typescript
_count: {
  select: { products: true }
}
```

**Acceptance Criteria**:
- [ ] Category displays "2 Products"
- [ ] Product count reflects actual number of products in category
- [ ] Count updates when products are added/removed
- [ ] Playwright test verifies product count is accurate

---

### 🟡 HIGH: Issue #4 - Analytics Prices All Show 0.00 EGP
**Priority**: P1 - High
**Status**: 🔴 Open
**Component**: `/app/api/v1/tenant/analytics/route.ts`

**Description**:
The Pricing Overview in Analytics shows all zeros:
- Average Price: 0.00 EGP
- Lowest Price: 0.00 EGP
- Highest Price: 0.00 EGP

**Evidence** (Screenshots):
- `analytics-tab.png`: Pricing Overview section shows all 0.00 EGP

**Expected Behavior**:
- Average Price: 22.50 EGP ((30+15)/2)
- Lowest Price: 15.00 EGP
- Highest Price: 30.00 EGP

**Actual Behavior**:
- All prices show 0.00 EGP

**Impact**:
- Cannot analyze pricing strategy
- Business intelligence data incomplete
- Revenue projections impossible

**Root Cause Hypothesis**:
Since the Analytics API shows `totalProducts: 0`, the pricing calculations are based on an empty dataset:
1. If no products found, min/max/avg all return 0
2. The Prisma aggregation might be filtering out products incorrectly
3. The Decimal to Number conversion might be failing

**Code Location**:
```typescript
// Analytics route - pricing aggregation
const pricing = await prisma.product.aggregate({
  where: { tenantId, isActive: true },
  _avg: { basePrice: true },
  _min: { basePrice: true },
  _max: { basePrice: true }
})
```

**Acceptance Criteria**:
- [ ] Average Price: 22.50 EGP
- [ ] Lowest Price: 15.00 EGP
- [ ] Highest Price: 30.00 EGP
- [ ] Prices update dynamically when products change
- [ ] Playwright test verifies pricing calculations

---

### 🟡 HIGH: Issue #5 - Missing Translation Key
**Priority**: P1 - High
**Status**: 🔴 Open
**Component**: `/locales/en.json` & `/locales/ar.json`

**Description**:
The translation key "tenant.categories.order" is missing, causing the raw key to display in the Categories tab.

**Evidence**:
- Console warnings: "Translation missing for key: tenant.categories.order in language: en"
- `categories-tab.png`: Shows "tenant.categories.order: 0" instead of translated text

**Expected Behavior**:
- Display: "Sort Order: 0" (English)
- Display: "ترتيب الفرز: 0" (Arabic)

**Actual Behavior**:
- Display: "tenant.categories.order: 0"

**Impact**:
- Unprofessional UI appearance
- Poor user experience
- Indicates incomplete i18n implementation

**Solution**:
Add to `locales/en.json`:
```json
{
  "tenant": {
    "categories": {
      "order": "Sort Order"
    }
  }
}
```

Add to `locales/ar.json`:
```json
{
  "tenant": {
    "categories": {
      "order": "ترتيب الفرز"
    }
  }
}
```

**Acceptance Criteria**:
- [ ] Translation key added to en.json
- [ ] Translation key added to ar.json
- [ ] Categories tab shows "Sort Order: 0" in English
- [ ] Categories tab shows "ترتيب الفرز: 0" in Arabic
- [ ] No console warnings about missing translations
- [ ] Playwright test verifies correct translation displays

---

### 🟢 MEDIUM: Issue #6 - Inventory Status Shows 0 of 0
**Priority**: P2 - Medium
**Status**: 🔴 Open
**Component**: `/app/api/v1/tenant/analytics/route.ts`

**Description**:
The Inventory Status section shows "Available Items: 0 of 0" when there should be 2 available items.

**Evidence** (Screenshots):
- `analytics-tab.png`: Inventory Status shows "0 of 0" and "0 items" out of stock

**Expected Behavior**:
- Available Items: 2 of 2
- Out of Stock: 0 items

**Actual Behavior**:
- Available Items: 0 of 0
- Out of Stock: 0 items

**Impact**:
- Cannot track inventory status
- Stock management is blind
- Risk of showing out-of-stock items to customers

**Root Cause Hypothesis**:
This is related to Issue #1 - since `totalProducts` returns 0, all derived calculations show 0.

**Acceptance Criteria**:
- [ ] Available Items: 2 of 2
- [ ] Out of Stock count is accurate
- [ ] Stock status updates when products change
- [ ] Playwright test verifies inventory counts

---

## Issue Relationships

```
Issue #1 (Analytics Returns Zeros)
  ├─> Causes Issue #4 (Prices Show 0.00)
  ├─> Causes Issue #6 (Inventory Shows 0 of 0)
  └─> Related to Issue #2 & #3 (Category relationships)

Issue #2 (Products Show Unknown Category)
  └─> Related to Issue #3 (Category Shows 0 Products)

Issue #5 (Missing Translation)
  └─> Independent - quick fix
```

## Root Cause Analysis

### Primary Issue: Data Integrity vs. API Logic

The core problem appears to be one of two scenarios:

**Scenario A: Data Integrity Issue**
- Products exist but have null/invalid `categoryId`
- Products exist but have null/invalid `tenantId`
- Category exists but has no products linked

**Scenario B: API Logic Issue**
- Count queries are using incorrect filters
- Prisma queries are not finding the data
- Promise.all destructuring is misaligned

**Evidence Points to Scenario B** because:
1. `activeProducts: 2` works correctly
2. Products display with correct prices
3. Category dropdown shows "Waseem" option
4. This suggests data exists but queries are wrong

## Fix Strategy

### Phase 1: Investigate & Diagnose (30 minutes)
1. ✅ Add database query script to verify actual data
2. ✅ Check product.categoryId values
3. ✅ Check product.tenantId values  
4. ✅ Check category.id matches product.categoryId
5. ✅ Review Analytics API count queries

### Phase 2: Fix Analytics API (45 minutes)
1. Fix count queries in `/app/api/v1/tenant/analytics/route.ts`
2. Add logging to debug what tenantId is being used
3. Verify Prisma query syntax
4. Add error handling and validation
5. Test with Playwright

### Phase 3: Fix Category Relationships (30 minutes)
1. Update categories API to include proper product count
2. Fix dashboard category lookup logic
3. Add null checks and fallbacks
4. Test with Playwright

### Phase 4: Fix Translations (10 minutes)
1. Add missing translation keys
2. Test in both languages
3. Verify no console warnings

### Phase 5: Comprehensive Testing (30 minutes)
1. Run full Playwright test suite
2. Verify all issues resolved
3. Check edge cases
4. Document fixes

**Total Estimated Time**: 2.5 hours

## Success Criteria

All issues must be resolved and verified with Playwright tests:

- [ ] Dashboard shows: Categories: 1 (1 active), Products: 2 (2 active)
- [ ] Analytics shows: Total Categories: 1, Total Products: 2
- [ ] Products show: Category: Waseem (not Unknown)
- [ ] Category shows: 2 Products (not 0)
- [ ] Pricing shows: Avg: 22.50, Low: 15.00, High: 30.00 EGP
- [ ] Translation "Sort Order: 0" displays correctly
- [ ] Inventory shows: 2 of 2 available
- [ ] No console errors or warnings
- [ ] All Playwright tests pass

## Next Steps

1. Create database diagnostic script ✅ DONE
2. Run diagnostic to confirm data integrity
3. Begin Phase 2: Fix Analytics API
4. Iterative testing with Playwright after each fix
5. Document all changes
6. Create comprehensive test report
