import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'

export const dynamic = 'force-dynamic'

// File size limits (in bytes)
const MAX_FILE_SIZE = 3 * 1024 * 1024 // 3MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

// POST /api/v1/upload/image - Upload image and convert to base64
export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const authHeader = request.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      )
    }

    const token = authHeader.substring(7)
    const payload = await verifyToken(token)
    if (!payload || !payload.sub) {
      return NextResponse.json(
        { success: false, message: 'Invalid token' },
        { status: 401 }
      )
    }

    const formData = await request.formData()
    const file = formData.get('image') as File

    if (!file) {
      return NextResponse.json(
        { success: false, message: 'No file provided' },
        { status: 400 }
      )
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed.' 
        },
        { status: 400 }
      )
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { 
          success: false, 
          message: `File too large. Maximum size is ${MAX_FILE_SIZE / (1024 * 1024)}MB.` 
        },
        { status: 400 }
      )
    }

    // Convert file to buffer and then to base64
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const base64String = buffer.toString('base64')
    const dataUrl = `data:${file.type};base64,${base64String}`

    // Calculate file info
    const fileInfo = {
      originalName: file.name,
      mimeType: file.type,
      size: file.size,
      sizeFormatted: formatFileSize(file.size),
      base64: dataUrl
    }

    return NextResponse.json({
      success: true,
      data: fileInfo,
      message: 'Image uploaded successfully'
    })

  } catch (error) {
    console.error('Image upload error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to upload image' },
      { status: 500 }
    )
  }
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}