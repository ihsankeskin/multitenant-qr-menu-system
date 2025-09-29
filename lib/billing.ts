/**
 * Billing utilities for prorated monthly fees and payment calculations
 */

/**
 * Calculate prorated amount for a tenant who joins mid-month
 * @param monthlyAmount - The full monthly subscription fee
 * @param joinDate - The date the tenant joined/started service
 * @returns Prorated amount for the remaining days of the month
 */
export function calculateProratedAmount(monthlyAmount: number, joinDate: Date): number {
  const joinDay = joinDate.getDate()
  const year = joinDate.getFullYear()
  const month = joinDate.getMonth()
  
  // Get total days in the month
  const totalDaysInMonth = new Date(year, month + 1, 0).getDate()
  
  // Calculate remaining days (including the join day)
  const remainingDays = totalDaysInMonth - joinDay + 1
  
  // Calculate daily rate
  const dailyRate = monthlyAmount / totalDaysInMonth
  
  // Calculate prorated amount
  const proratedAmount = dailyRate * remainingDays
  
  return Math.round(proratedAmount * 100) / 100 // Round to 2 decimal places
}

/**
 * Calculate the next payment date based on current date and billing cycle
 * @param currentDate - Current date or last payment date
 * @param isFirstPayment - Whether this is the first payment (prorated)
 * @returns Next payment due date
 */
export function calculateNextPaymentDate(currentDate: Date, isFirstPayment: boolean = false): Date {
  const nextDate = new Date(currentDate)
  
  if (isFirstPayment) {
    // For first payment, next payment is on the 1st of next month
    nextDate.setMonth(nextDate.getMonth() + 1)
    nextDate.setDate(1)
  } else {
    // For regular payments, add one month
    nextDate.setMonth(nextDate.getMonth() + 1)
  }
  
  return nextDate
}

/**
 * Generate invoice number with proper formatting
 * @param tenantId - Tenant ID
 * @param date - Payment date
 * @returns Formatted invoice number
 */
export function generateInvoiceNumber(tenantId: string, date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const shortTenantId = tenantId.substring(0, 8).toUpperCase()
  const timestamp = Date.now().toString().slice(-4)
  
  return `INV-${year}${month}-${shortTenantId}-${timestamp}`
}

/**
 * Calculate payment period description
 * @param startDate - Start date of billing period
 * @param endDate - End date of billing period  
 * @param isProrated - Whether this is a prorated payment
 * @returns Human-readable description of the billing period
 */
export function getPaymentPeriodDescription(startDate: Date, endDate: Date, isProrated: boolean = false): string {
  const startMonth = startDate.toLocaleString('en-US', { month: 'long' })
  const endMonth = endDate.toLocaleString('en-US', { month: 'long' })
  const year = startDate.getFullYear()
  
  if (isProrated) {
    const startDay = startDate.getDate()
    const endDay = endDate.getDate()
    
    if (startMonth === endMonth) {
      return `${startMonth} ${startDay}-${endDay}, ${year} (Prorated)`
    } else {
      return `${startMonth} ${startDay} - ${endMonth} ${endDay}, ${year} (Prorated)`
    }
  }
  
  if (startMonth === endMonth) {
    return `${startMonth} ${year}`
  }
  
  return `${startMonth} - ${endMonth} ${year}`
}

/**
 * Check if a tenant needs a prorated first payment
 * @param joinDate - Date tenant joined
 * @returns Whether prorated payment is needed
 */
export function needsProratedPayment(joinDate: Date): boolean {
  const joinDay = joinDate.getDate()
  return joinDay > 1 // If joined after the 1st of the month
}

/**
 * Calculate billing summary for a tenant
 * @param monthlyFee - Monthly subscription fee
 * @param joinDate - Date tenant joined
 * @returns Complete billing information
 */
export function calculateTenantBilling(monthlyFee: number, joinDate: Date) {
  const needsProrated = needsProratedPayment(joinDate)
  
  if (!needsProrated) {
    // Joined on the 1st, no proration needed
    return {
      firstPaymentAmount: monthlyFee,
      firstPaymentProrated: false,
      nextPaymentAmount: monthlyFee,
      nextPaymentDate: calculateNextPaymentDate(joinDate, false),
      firstPaymentPeriod: getPaymentPeriodDescription(
        joinDate, 
        new Date(joinDate.getFullYear(), joinDate.getMonth() + 1, 0),
        false
      )
    }
  }
  
  // Calculate prorated first payment
  const proratedAmount = calculateProratedAmount(monthlyFee, joinDate)
  const nextPaymentDate = calculateNextPaymentDate(joinDate, true)
  const endOfMonth = new Date(joinDate.getFullYear(), joinDate.getMonth() + 1, 0)
  
  return {
    firstPaymentAmount: proratedAmount,
    firstPaymentProrated: true,
    nextPaymentAmount: monthlyFee,
    nextPaymentDate,
    firstPaymentPeriod: getPaymentPeriodDescription(joinDate, endOfMonth, true),
    daysInFirstPeriod: endOfMonth.getDate() - joinDate.getDate() + 1,
    totalDaysInMonth: endOfMonth.getDate()
  }
}