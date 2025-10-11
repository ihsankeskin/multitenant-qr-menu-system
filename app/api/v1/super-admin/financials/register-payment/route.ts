import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '../../../../../../lib/auth'
import { prisma } from '../../../../../../lib/prisma'

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const token = authHeader.substring(7)
    const decoded = await verifyToken(token)

    if (!decoded || decoded.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - Super Admin access required' },
        { status: 403 }
      )
    }

    const userId = String(decoded.sub || decoded.id || decoded.userId || 'unknown')

    // Parse request body
    const body = await request.json()
    const { tenantIds, month, amount, method, notes } = body

    // Validation
    if (!tenantIds || !Array.isArray(tenantIds) || tenantIds.length === 0) {
      return NextResponse.json(
        { success: false, error: 'At least one tenant must be selected' },
        { status: 400 }
      )
    }

    if (!month || !amount || !method) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Parse the month to get the date
    const [year, monthNum] = month.split('-')
    const paymentDate = new Date(parseInt(year), parseInt(monthNum) - 1, 1)
    const dueDate = new Date(parseInt(year), parseInt(monthNum) - 1, 28) // End of month

    // Create payment records for each selected tenant
    const paymentRecords = await Promise.all(
      tenantIds.map(async (tenantId: string) => {
        // Generate invoice number
        const invoiceNumber = `INV-${year}${monthNum}-${Math.random().toString(36).substring(2, 9).toUpperCase()}`
        
        // Get tenant info
        const tenant = await prisma.tenant.findUnique({
          where: { id: tenantId },
          select: { businessName: true }
        })

        // Create payment record
        return await prisma.paymentRecord.create({
          data: {
            tenantId,
            amount: parseFloat(amount),
            method,
            status: 'PAID',
            paidAt: new Date(),
            dueDate,
            description: `Payment for ${tenant?.businessName || 'Tenant'} - ${month}`,
            invoiceNumber,
            notes: notes || `Payment registered by Super Admin for ${month}`,
            createdById: userId
          }
        })
      })
    )

    return NextResponse.json({
      success: true,
      message: `Successfully registered ${paymentRecords.length} payment(s)`,
      data: {
        payments: paymentRecords,
        count: paymentRecords.length
      }
    })

  } catch (error) {
    console.error('Error registering payment:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to register payment',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
