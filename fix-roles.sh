#!/bin/bash

# Fix all super-admin API role checks to allow both SUPER_ADMIN and ADMIN

# Fix tenants/route.ts
sed -i '' 's/decodedToken\.role !== '\''SUPER_ADMIN'\''/\(decodedToken.role !== '\''SUPER_ADMIN'\'' \&\& decodedToken.role !== '\''ADMIN'\''\)/g' app/api/v1/super-admin/tenants/route.ts

# Fix dashboard/stats/route.ts  
sed -i '' 's/decodedToken\.role !== '\''SUPER_ADMIN'\''/\(decodedToken.role !== '\''SUPER_ADMIN'\'' \&\& decodedToken.role !== '\''ADMIN'\''\)/g' app/api/v1/super-admin/dashboard/stats/route.ts

# Fix analytics/route.ts
sed -i '' 's/decoded\.role !== '\''SUPER_ADMIN'\''/\(decoded.role !== '\''SUPER_ADMIN'\'' \&\& decoded.role !== '\''ADMIN'\''\)/g' app/api/v1/super-admin/analytics/route.ts

# Fix financials/register-payment/route.ts
sed -i '' 's/decoded\.role !== '\''SUPER_ADMIN'\''/\(decoded.role !== '\''SUPER_ADMIN'\'' \&\& decoded.role !== '\''ADMIN'\''\)/g' app/api/v1/super-admin/financials/register-payment/route.ts

# Fix system-users/route.ts
sed -i '' 's/normalizedRole !== '\''SUPER_ADMIN'\''/\(normalizedRole !== '\''SUPER_ADMIN'\'' \&\& normalizedRole !== '\''ADMIN'\''\)/g' app/api/v1/super-admin/system-users/route.ts

echo "Fixed all role checks"
