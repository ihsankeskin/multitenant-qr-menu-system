# Comprehensive Test Plan - October 7, 2025

## Issues Fixed

### 1. ✅ Product Edit Form - Field Name Mismatch
**Problem**: Edit button didn't work - couldn't inherit category and price data  
**Root Cause**: ProductModal was using deprecated field names (`price`, `compareAtPrice`) instead of (`basePrice`, `discountPrice`)  
**Fix**: Updated ProductFormData interface and all references to use correct field names

### 2. ✅ Missing Translation Key
**Problem**: "tenant.categories.order" showing as raw key  
**Fix**: Added "order": "Sort Order" to en.json (ar.json already had it)

## Testing Sequence with Playwright MCP

### Phase 1: Data Cleanup (Manual via UI)
1. Login to https://themenugenie.com/tenant/waseemco/dashboard
2. Navigate to Products tab
3. Delete both existing products (Coffee, Tea)
4. Navigate to Categories tab
5. Delete the existing category (Waseem)
6. Verify empty state

### Phase 2: Create Fresh Data
7. Create a new category "Beverages" / "مشروبات"
8. Create second category "Desserts" / "حلويات"
9. Create product "Espresso" / "إسبريسو" - basePrice: 25 EGP, category: Beverages
10. Create product "Cappuccino" / "كابتشينو" - basePrice: 35 EGP, category: Beverages
11. Create product "Cheesecake" / "تشيز كيك" - basePrice: 45 EGP, category: Desserts

### Phase 3: Test Edit Functionality (CRITICAL)
12. Click edit on "Espresso" product
13. Verify form shows:
    - Category dropdown: "Beverages" is selected
    - Base Price field: 25
    - All other fields populated correctly
14. Change price to 30 EGP
15. Save and verify update
16. Click edit again to confirm price is now 30

### Phase 4: Verify Analytics Fix
17. Navigate to Analytics tab
18. Verify counts:
    - Total Categories: 2 (2 active)
    - Total Products: 3 (3 active)
    - Average Price: 33.33 EGP ((25+35+45)/3 or 30+35+45 if edited)
    - Lowest Price: 25 EGP (or 30 if edited)
    - Highest Price: 45 EGP
    - Inventory: 3 of 3 available

### Phase 5: Verify Category Product Count
19. Navigate to Categories tab
20. Verify:
    - Beverages: 2 Products
    - Desserts: 1 Product
    - Sort Order displays correctly (not raw key)

### Phase 6: Verify Product Category Display
21. Navigate to Products tab
22. Verify all products show correct category names:
    - Espresso: Category: Beverages (not "Unknown")
    - Cappuccino: Category: Beverages
    - Cheesecake: Category: Desserts

### Phase 7: Public Menu Verification
23. Navigate to https://themenugenie.com/menu/waseemco
24. Verify categories display with correct product counts
25. Verify products show correct prices
26. Test language switching

## Expected Results

### All Issues Resolved:
- ✅ Edit form inherits all product data correctly
- ✅ Analytics shows accurate counts
- ✅ Categories show correct product counts
- ✅ Products show correct category names (not "Unknown")
- ✅ Prices display correctly everywhere
- ✅ Translation keys display properly
- ✅ Full CRUD cycle works end-to-end

## Success Criteria
- [ ] All 26 test steps pass
- [ ] No "Unknown" category labels
- [ ] No zero counts in analytics when data exists
- [ ] Edit form properly populates with existing data
- [ ] Update operations work correctly
- [ ] No console errors
- [ ] No missing translation keys

## Notes
- Focus on the edit functionality as this was the newly reported issue
- Verify that all previous fixes remain working
- Take screenshots of key states for documentation
