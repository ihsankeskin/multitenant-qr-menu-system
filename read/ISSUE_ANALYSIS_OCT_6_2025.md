# Issue Analysis - October 6, 2025

## Summary
Dashboard displaying incorrect statistics despite correct data in database and component state.

## Evidence from Playwright Testing

### Dashboard Statistics Display
- **Categories: 0** (0 active)
- **Products: 0** (2 active) ← **Contradictory!**
- **Menu Health: 67%** (0 featured)

### Categories Tab
- 1 Category exists: "Waseem" (وسيم)  
- Shows **0 Products** associated

### Products Tab
- 2 Products exist:
  1. **Coffe** (قهوة) - ج.م30.00 - **Category: Unknown**
  2. **Tea** (شاي) - ج.م15.00 - **Category: Unknown**

### React Component State Analysis
From browser console inspection:

**Analytics State (index 2):**
```json
{
  "overview": {
    "totalCategories": 0,        ← WRONG
    "activeCategories": 0,
    "totalProducts": 0,           ← WRONG
    "activeProducts": 2,          ← CORRECT
    "inactiveProducts": -2        ← WRONG (negative!)
  }
}
```

**Categories State (index 3):**
```json
[
  {
    "id": "cmgfj9tcq000h106bqmqjoi14",
    "nameEn": "Waseem",
    "nameAr": "وسيم",
    "productCount": 2             ← Shows 2 products correctly
  }
]
```

**Products State (index 4):**
```json
[
  {
    "nameEn": "Coffe",
    "categoryId": "cmgfj9tcq000h106bqmqjoi14",  ← Valid category ID
    "basePrice": 30,
    "category": {
      "id": "cmgfj9tcq000h106bqmqjoi14",
      "nameEn": "Waseem",
      "isActive": true
    }
  },
  {
    "nameEn": "Tea",
    "categoryId": "cmgfj9tcq000h106bqmqjoi14",  ← Valid category ID
    "basePrice": 15,
    "category": {
      "id": "cmgfj9tcq000h106bqmqjoi14",
      "nameEn": "Waseem",
      "isActive": true
    }
  }
]
```

## Root Cause Analysis

### Issue #1: Analytics API Counting Bug
**Location:** `app/api/v1/tenant/analytics/route.ts`

**Problem:** The Analytics API returns:
- `totalCategories: 0` 
- `totalProducts: 0`
- But `activeProducts: 2`

**Impact:** Dashboard shows "0 categories, 0 products" misleading users.

### Issue #2: Category Display Shows "Unknown"
**Location:** `app/tenant/[slug]/dashboard/page.tsx` line 1467

**Problem:** Products display "Category: Unknown" even though:
- Products have valid `categoryId`
- Category relationship is loaded in product state
- The lookup code is: `categories.find(c => c.id === product.categoryId)?.nameEn || 'Unknown'`

**Root Cause:** The `categories` state array is loaded correctly, and products have the category in their response, BUT the Products tab UI is using a separate find() operation that's returning undefined.

### Issue #3: Category Product Count
**Problem:** Categories tab shows "0 Products" for "Waseem" category, but the category state shows `productCount: 2`.

**Impact:** Inconsistent data display confusing users.

## Hypotheses

### Hypothesis 1: Analytics API Count Logic Error
The Prisma queries in analytics route might be filtering incorrectly or the tenant matching is failing.

### Hypothesis 2: Data Display Logic Issue  
The dashboard is using `analytics.overview.totalCategories` but the actual data is correct in the database - it's a display/calculation issue.

### Hypothesis 3: Frontend State Management Issue
The categories array loaded in state (index 3) might not be the same array used by the Products tab display logic.

## Action Plan

### Priority 1 (Critical)
1. **Fix Analytics API Counting** - Investigate why `prisma.category.count()` returns 0
2. **Fix Product Category Display** - Show actual category name instead of "Unknown"
3. **Fix Category Product Count** - Display correct product count on Categories tab

### Priority 2 (High)
4. Add missing translation key: `tenant.categories.order`
5. Verify database state with direct query
6. Add error handling and validation

### Priority 3 (Medium)
7. Add loading states
8. Add data validation
9. Improve error messages
10. Add retry logic for failed API calls

## Next Steps
1. Check Analytics API route counting logic
2. Check if tenant scoping is working correctly
3. Verify Prisma queries are executed properly
4. Check if environment variables are correct
5. Test with Playwright after fixes

## Timeline
- Analysis: Complete
- Fix Implementation: In progress
- Testing: Pending
- Deployment: Pending
