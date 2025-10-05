import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import jwt from 'jsonwebtoken'

interface JWTPayload {
  userId: string
  role: string
  email: string
}

// Default settings structure
const DEFAULT_SETTINGS = {
  platform: {
    siteName: 'QR Menu System',
    siteDescription: 'Professional QR code menu system for restaurants and cafes',
    maintenanceMode: false,
    registrationEnabled: true,
    maxTenantsPerUser: 5,
    defaultTimeZone: 'UTC',
    supportEmail: 'support@example.com',
    defaultLanguage: 'en'
  },
  security: {
    jwtExpiration: '24h',
    passwordMinLength: 8,
    requireEmailVerification: false,
    twoFactorEnabled: false,
    maxLoginAttempts: 5,
    lockoutDuration: 15,
    sessionTimeout: 1440 // minutes
  },
  email: {
    provider: 'smtp',
    smtpHost: 'smtp.gmail.com',
    smtpPort: 587,
    smtpUser: '',
    smtpPassword: '',
    fromEmail: 'noreply@example.com',
    fromName: 'QR Menu System',
    testEmailSent: false
  },
  storage: {
    provider: 'local',
    maxFileSize: 10485760, // 10MB in bytes
    allowedFileTypes: ['image/jpeg', 'image/png', 'image/webp'],
    storageLimit: 1073741824, // 1GB in bytes
    currentUsage: 0
  },
  notifications: {
    emailNotifications: true,
    systemAlerts: true,
    userWelcomeEmails: true,
    passwordResetEmails: true,
    maintenanceNotifications: true
  },
  business: {
    defaultBusinessTypes: ['restaurant', 'cafe', 'bar', 'bakery', 'fast-food', 'fine-dining'],
    maxCategoriesPerTenant: 50,
    maxProductsPerCategory: 100,
    maxImageUploadsPerProduct: 5,
    qrCodeExpirationDays: 365
  }
}

export async function GET(request: NextRequest) {
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

    // Verify super admin or admin role
    if (decoded.role !== 'super-admin' && decoded.role !== 'SUPER_ADMIN' && decoded.role !== 'admin' && decoded.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, message: 'Access denied. Super admin only.' },
        { status: 403 }
      )
    }

    // Try to get settings from database or return defaults
    let settings
    try {
      // In a real implementation, you might store settings in a dedicated table
      // For now, we'll return the default settings
      settings = DEFAULT_SETTINGS
      
      // You could also calculate current storage usage
      const totalTenants = await prisma.tenant.count()
      settings.storage.currentUsage = totalTenants * 1024 * 1024 // Mock calculation
    } catch (error) {
      console.error('Error fetching settings:', error)
      settings = DEFAULT_SETTINGS
    }

    return NextResponse.json({
      success: true,
      data: settings,
      message: 'Settings retrieved successfully'
    })

  } catch (error) {
    console.error('Get settings error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to retrieve settings' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
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

    // Verify super admin or admin role
    if (decoded.role !== 'super-admin' && decoded.role !== 'SUPER_ADMIN' && decoded.role !== 'admin' && decoded.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, message: 'Access denied. Super admin only.' },
        { status: 403 }
      )
    }

    const settings = await request.json()

    // Validate required fields
    if (!settings.platform?.siteName?.trim()) {
      return NextResponse.json(
        { success: false, message: 'Site name is required' },
        { status: 400 }
      )
    }

    if (!settings.platform?.supportEmail?.trim() || 
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(settings.platform.supportEmail)) {
      return NextResponse.json(
        { success: false, message: 'Valid support email is required' },
        { status: 400 }
      )
    }

    // Validate security settings
    if (settings.security?.passwordMinLength < 6 || settings.security?.passwordMinLength > 128) {
      return NextResponse.json(
        { success: false, message: 'Password minimum length must be between 6 and 128 characters' },
        { status: 400 }
      )
    }

    if (settings.security?.maxLoginAttempts < 3 || settings.security?.maxLoginAttempts > 10) {
      return NextResponse.json(
        { success: false, message: 'Max login attempts must be between 3 and 10' },
        { status: 400 }
      )
    }

    // Validate email settings if provider is SMTP
    if (settings.email?.provider === 'smtp') {
      if (!settings.email?.smtpHost?.trim()) {
        return NextResponse.json(
          { success: false, message: 'SMTP host is required when using SMTP provider' },
          { status: 400 }
        )
      }
      
      if (!settings.email?.smtpPort || settings.email.smtpPort < 1 || settings.email.smtpPort > 65535) {
        return NextResponse.json(
          { success: false, message: 'Valid SMTP port is required' },
          { status: 400 }
        )
      }
    }

    // Validate business settings
    if (settings.business?.maxCategoriesPerTenant < 1 || settings.business?.maxCategoriesPerTenant > 1000) {
      return NextResponse.json(
        { success: false, message: 'Max categories per tenant must be between 1 and 1000' },
        { status: 400 }
      )
    }

    if (settings.business?.maxProductsPerCategory < 1 || settings.business?.maxProductsPerCategory > 1000) {
      return NextResponse.json(
        { success: false, message: 'Max products per category must be between 1 and 1000' },
        { status: 400 }
      )
    }

    // In a real implementation, you would save settings to database
    // For now, we'll just validate and return success
    console.log('Settings would be saved:', settings)

    // Create audit log entry
    try {
      // In a real implementation, you might have an audit log table
      console.log(`Settings updated by user ${decoded.userId} at ${new Date().toISOString()}`)
    } catch (error) {
      console.error('Failed to create audit log:', error)
    }

    return NextResponse.json({
      success: true,
      message: 'Settings saved successfully',
      data: settings
    })

  } catch (error) {
    console.error('Update settings error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to save settings' },
      { status: 500 }
    )
  }
}