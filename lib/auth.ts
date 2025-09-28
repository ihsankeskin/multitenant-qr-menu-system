import * as jose from 'jose'
import bcrypt from 'bcryptjs'
import type { AuthUser, AuthTokens } from '@/types'

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key'
const secret = new TextEncoder().encode(JWT_SECRET)

export async function hashPassword(password: string): Promise<string> {
  const rounds = parseInt(process.env.BCRYPT_ROUNDS || '12')
  return bcrypt.hash(password, rounds)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

export async function generateTokens(user: AuthUser, tenantId?: string): Promise<AuthTokens> {
  const accessToken = await new jose.SignJWT({ 
    sub: user.id, 
    email: user.email,
    role: user.role,
    tenantUsers: user.tenantUsers,
    tenantId: tenantId
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(process.env.JWT_EXPIRES_IN || '24h')
    .sign(secret)

  const refreshToken = await new jose.SignJWT({ 
    sub: user.id,
    type: 'refresh',
    tenantId: tenantId
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(process.env.JWT_REFRESH_EXPIRES_IN || '7d')
    .sign(secret)

  return { accessToken, refreshToken }
}

export async function verifyToken(token: string): Promise<jose.JWTPayload | null> {
  try {
    const { payload } = await jose.jwtVerify(token, secret)
    return payload
  } catch (error) {
    return null
  }
}

export async function refreshAccessToken(refreshToken: string): Promise<string | null> {
  try {
    const { payload } = await jose.jwtVerify(refreshToken, secret)
    
    if (payload.type !== 'refresh') {
      return null
    }

    const newAccessToken = await new jose.SignJWT({ 
      sub: payload.sub
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('24h')
      .sign(secret)

    return newAccessToken
  } catch (error) {
    return null
  }
}

export function generateSecurePassword(): string {
  const length = 12
  const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*"
  let password = ""
  
  // Ensure at least one character from each category
  password += "ABCDEFGHIJKLMNOPQRSTUVWXYZ"[Math.floor(Math.random() * 26)]
  password += "abcdefghijklmnopqrstuvwxyz"[Math.floor(Math.random() * 26)]
  password += "0123456789"[Math.floor(Math.random() * 10)]
  password += "!@#$%^&*"[Math.floor(Math.random() * 8)]
  
  // Fill the rest
  for (let i = password.length; i < length; i++) {
    password += charset[Math.floor(Math.random() * charset.length)]
  }
  
  // Shuffle the password
  return password.split('').sort(() => Math.random() - 0.5).join('')
}

export function validatePasswordStrength(password: string): {
  isValid: boolean
  errors: string[]
} {
  const errors: string[] = []
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long')
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter')
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter')
  }
  
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number')
  }
  
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one special character')
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}