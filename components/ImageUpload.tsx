'use client'

import React, { useState, useRef } from 'react'
import { PhotoIcon, XMarkIcon, CloudArrowUpIcon } from '@heroicons/react/24/outline'

interface ImageUploadProps {
  onImageUpload: (base64Image: string) => void
  currentImage?: string
  placeholder?: string
  className?: string
  maxSizeMB?: number
  accept?: string
}

export default function ImageUpload({
  onImageUpload,
  currentImage,
  placeholder = "Click to upload image",
  className = "",
  maxSizeMB = 3,
  accept = "image/jpeg,image/png,image/webp,image/gif"
}: ImageUploadProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (file: File) => {
    setError(null)
    setIsUploading(true)

    try {
      // Validate file type
      const allowedTypes = accept.split(',').map(type => type.trim())
      if (!allowedTypes.includes(file.type)) {
        throw new Error('Invalid file type. Please upload a JPEG, PNG, WebP, or GIF image.')
      }

      // Validate file size
      const maxSizeBytes = maxSizeMB * 1024 * 1024
      if (file.size > maxSizeBytes) {
        throw new Error(`File too large. Maximum size is ${maxSizeMB}MB.`)
      }

      // Convert to base64
      const reader = new FileReader()
      reader.onload = (e) => {
        const base64String = e.target?.result as string
        onImageUpload(base64String)
        setIsUploading(false)
      }
      reader.onerror = () => {
        setError('Failed to read file')
        setIsUploading(false)
      }
      reader.readAsDataURL(file)

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
      setIsUploading(false)
    }
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFileSelect(file)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    
    const files = Array.from(e.dataTransfer.files)
    const imageFiles = files.filter(file => file.type.startsWith('image/'))
    
    if (imageFiles.length > 0) {
      handleFileSelect(imageFiles[0])
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleClick = () => {
    fileInputRef.current?.click()
  }

  const handleRemoveImage = (e: React.MouseEvent) => {
    e.stopPropagation()
    onImageUpload('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }


  return (
    <div className={`relative ${className}`}>
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileInputChange}
        className="hidden"
      />
      
      <div
        onClick={handleClick}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`
          relative border-2 border-dashed rounded-lg cursor-pointer transition-all duration-200
          ${isDragging 
            ? 'border-blue-400 bg-blue-50' 
            : 'border-gray-300 hover:border-gray-400'
          }
          ${currentImage ? 'aspect-video' : 'h-32'}
          ${isUploading ? 'pointer-events-none opacity-75' : ''}
        `}
      >
        {currentImage ? (
          <div className="relative w-full h-full">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={currentImage}
              alt="Uploaded image"
              className="w-full h-full object-cover rounded-lg"
            />
            <button
              onClick={handleRemoveImage}
              className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
              title="Remove image"
            >
              <XMarkIcon className="h-4 w-4" />
            </button>
            <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-20 transition-all duration-200 rounded-lg flex items-center justify-center">
              <div className="text-white opacity-0 hover:opacity-100 transition-opacity duration-200">
                <CloudArrowUpIcon className="h-8 w-8 mx-auto mb-2" />
                <p className="text-sm font-medium">Change Image</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full p-4">
            {isUploading ? (
              <div className="flex flex-col items-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2"></div>
                <p className="text-sm text-gray-600">Uploading...</p>
              </div>
            ) : (
              <>
                <PhotoIcon className="h-8 w-8 text-gray-400 mb-2" />
                <p className="text-sm text-gray-600 text-center">{placeholder}</p>
                <p className="text-xs text-gray-400 mt-1">
                  Maximum {maxSizeMB}MB • JPEG, PNG, WebP, GIF
                </p>
              </>
            )}
          </div>
        )}
      </div>

      {error && (
        <p className="mt-2 text-sm text-red-600">{error}</p>
      )}
    </div>
  )
}