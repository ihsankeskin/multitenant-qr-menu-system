# The Menu App - Backlog

## High Priority Issues

### 1. Force Password Change on First Login for Tenant Admin
**Status:** To Be Investigated  
**Reported:** October 6, 2025  
**Description:** The force password change functionality for tenant admin first login was reported as already implemented and working, but needs verification in production environment.

**Investigation Needed:**
- Check if tenant change-password page exists
- Verify if tenant auth API includes mustChangePassword field
- Test the first-time login flow for newly created tenant admins
- Ensure the redirect to change-password page works correctly

**Files to Check:**
- `/app/tenant/[slug]/change-password/page.tsx` (may need to be created)
- `/app/api/v1/tenant/auth/change-password/route.ts` (may need to be created)
- `/app/tenant/[slug]/login/page.tsx` (verify mustChangePassword check)
- `/prisma/schema.prisma` (User model has mustChangePassword field)

**Related Code:**
- Super admin has this feature implemented in:
  - `/app/super-admin/change-password/page.tsx`
  - `/app/api/v1/super-admin/auth/change-password/route.ts`
- Can be used as reference for tenant implementation

**Acceptance Criteria:**
- [ ] Tenant admin redirected to change-password on first login
- [ ] Cannot access dashboard until password is changed
- [ ] Password validation enforced (min 8 chars, complexity rules)
- [ ] mustChangePassword flag set to false after successful change
- [ ] Works in production environment

---

## Medium Priority

### 2. Environment Variable Configuration
**Status:** Needs Documentation  
**Description:** Ensure NEXT_PUBLIC_APP_URL is properly set in Vercel environment variables to 'https://themenugenie.com'

**Action Items:**
- [ ] Verify NEXT_PUBLIC_APP_URL in Vercel dashboard
- [ ] Document the correct production environment variables
- [ ] Add environment variable validation

---

## Completed ✅

### ~~Currency Display Issue - EGP Not Showing~~
**Completed:** October 6, 2025  
**Fix:** Added EGP currency symbol (ج.م) to the formatPrice function in menu page  
**Commit:** 573f6a0

### ~~URLs Not Showing Full Domain~~
**Completed:** October 6, 2025  
**Fix:** Updated all URLs to show https://themenugenie.com/*** instead of relative paths  
**Commit:** 573f6a0

### ~~QR Code Using Relative URLs~~
**Completed:** October 6, 2025  
**Fix:** Updated QR code generation to use production domain  
**Commit:** 573f6a0

### ~~URLs Not Clickable~~
**Completed:** October 6, 2025  
**Fix:** Made all menu URLs clickable with target="_blank" in both super admin and tenant dashboard  
**Commit:** 573f6a0

### ~~TypeError: e.toFixed is not a function~~
**Completed:** October 6, 2025  
**Fix:** Added Number() conversion for Prisma Decimal types in API response  
**Commit:** 8f65a3b

### ~~Missing Translation Key for "unavailable"~~
**Completed:** October 6, 2025  
**Fix:** Added "unavailable" key to locales/en.json  
**Commit:** 8f65a3b

---

## Future Enhancements

### 3. Multi-Currency Support Enhancement
- Add more currency symbols (KWD, OMR, QAR, BHD, JOD, etc.)
- Support for cryptocurrency display
- Real-time currency conversion

### 4. URL Configuration
- Allow tenants to use custom domains
- Add subdomain configuration in tenant settings
- Generate short URLs for QR codes

### 5. QR Code Customization
- Allow tenants to customize QR code colors
- Add logo overlay to QR codes
- Different QR code styles (rounded, dotted, etc.)
- QR code analytics (scan tracking)

---

## Notes
- This backlog will be updated as new issues are discovered and resolved
- Priority levels: High (blocking), Medium (important), Low (nice to have)
- All completed items should be moved to "Completed" section with commit hash
