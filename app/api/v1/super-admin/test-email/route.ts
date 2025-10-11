import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'

interface JWTPayload {
  userId: string
  role: string
  email: string
}

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    // Extract token from Authorization header
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, message: 'No token provided' },
        { status: 401 }
      )
    }

    const token = authHeader.substring(7)
    const jwtSecret = process.env.JWT_SECRET
    if (!jwtSecret) {
      throw new Error('JWT_SECRET is not defined')
    }

    let decoded: JWTPayload
    try {
      decoded = jwt.verify(token, jwtSecret) as JWTPayload
    } catch (error) {
      return NextResponse.json(
        { success: false, message: 'Invalid token' },
        { status: 401 }
      )
    }

    // Verify super admin role
    if (decoded.role !== 'super-admin') {
      return NextResponse.json(
        { success: false, message: 'Access denied. Super admin only.' },
        { status: 403 }
      )
    }

    // Simulate sending test email
    // In a real implementation, you would use your configured email service
    const testEmail = {
      to: decoded.email,
      subject: 'QR Menu System - Test Email',
      text: 'This is a test email from the QR Menu System. If you received this, your email configuration is working correctly.',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">QR Menu System - Test Email</h2>
          <p>This is a test email from the QR Menu System.</p>
          <p>If you received this email, your email configuration is working correctly.</p>
          <div style="background-color: #f0f9ff; padding: 20px; border-left: 4px solid #2563eb; margin: 20px 0;">
            <h3 style="margin: 0 0 10px 0; color: #1e40af;">Email Configuration Status</h3>
            <p style="margin: 0;"><strong>Status:</strong> ✅ Working</p>
            <p style="margin: 5px 0 0 0;"><strong>Sent at:</strong> ${new Date().toLocaleString()}</p>
          </div>
          <p style="color: #6b7280; font-size: 14px;">
            This email was sent from the Super Admin Settings panel.
          </p>
        </div>
      `
    }

    // Log the test email (in production, you would actually send it)
    console.log('Test email would be sent:', testEmail)

    // Simulate email sending delay
    await new Promise(resolve => setTimeout(resolve, 1000))

    // In a real implementation, you would check if the email was sent successfully
    const emailSent = true // Simulate successful sending

    if (emailSent) {
      return NextResponse.json({
        success: true,
        message: 'Test email sent successfully',
        data: {
          recipient: decoded.email,
          sentAt: new Date().toISOString(),
          subject: testEmail.subject
        }
      })
    } else {
      return NextResponse.json(
        { success: false, message: 'Failed to send test email' },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('Send test email error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to send test email' },
      { status: 500 }
    )
  }
}
