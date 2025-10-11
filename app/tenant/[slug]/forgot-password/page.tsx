'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import LanguageSwitcher from '@/components/LanguageSwitcher'
import { useTranslation } from '@/contexts/LocalizationContext'
import { 
  BuildingStorefrontIcon,
  EnvelopeIcon,
  CheckCircleIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline'

interface TenantInfo {
  id: string
  businessName: string
  businessNameAr: string | null
  primaryColor: string
  secondaryColor: string
  accentColor?: string
  logoUrl: string | null
}

export default function TenantForgotPasswordPage() {
  const { t, isRTL } = useTranslation()
  const router = useRouter()
  const params = useParams()
  const slug = params.slug as string
  
  const [tenantInfo, setTenantInfo] = useState<TenantInfo | null>(null)
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    message: ''
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (slug) {
      fetchTenantInfo()
    }
  }, [slug])

  const fetchTenantInfo = async () => {
    try {
      const response = await fetch(`/api/v1/public/tenant/${slug}`)
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setTenantInfo(data.data.tenant)
          // Apply tenant branding
          document.documentElement.style.setProperty('--tenant-primary', data.data.tenant.primaryColor)
          document.documentElement.style.setProperty('--tenant-secondary', data.data.tenant.secondaryColor)
          if (data.data.tenant.accentColor) {
            document.documentElement.style.setProperty('--tenant-accent', data.data.tenant.accentColor)
          }
        } else {
          router.push('/404')
        }
      } else {
        router.push('/404')
      }
    } catch (error) {
      console.error('Error fetching tenant info:', error)
      router.push('/404')
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }))
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`/api/v1/tenant/auth/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          message: formData.message,
          tenantSlug: slug
        })
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setSubmitted(true)
      } else {
        setErrors({ 
          submit: data.message || 'An error occurred. Please try again.'
        })
      }
    } catch (error) {
      setErrors({ 
        submit: 'An error occurred. Please try again.'
      })
    } finally {
      setLoading(false)
    }
  }

  if (!tenantInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8" dir={isRTL ? 'rtl' : 'ltr'}>
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="flex justify-end mb-4">
            <LanguageSwitcher variant="dropdown" />
          </div>
          <div className="bg-white py-8 px-4 shadow-lg sm:rounded-lg sm:px-10">
            <div className="text-center">
              <CheckCircleIcon className="mx-auto h-16 w-16 text-green-600" />
              <h2 className="mt-4 text-2xl font-bold text-gray-900">
                Request Submitted
              </h2>
              <p className="mt-4 text-sm text-gray-600">
                Your password reset request has been submitted to The Menu Genie support team.
              </p>
              <p className="mt-2 text-sm text-gray-600">
                A support representative will contact you shortly at <span className="font-medium">{formData.email}</span> to assist with your password reset.
              </p>
              <div className="mt-6 space-y-3">
                <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                  <p className="text-sm text-blue-800">
                    <strong>Support Contact:</strong><br />
                    Email: support@themenugenie.com<br />
                    Phone: +20 XXX XXX XXXX
                  </p>
                </div>
                <Link
                  href={`/tenant/${slug}/login`}
                  className="inline-flex items-center justify-center w-full px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white focus:outline-none focus:ring-2 focus:ring-offset-2"
                  style={{ backgroundColor: tenantInfo.primaryColor }}
                >
                  <ArrowLeftIcon className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                  Back to Login
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-end mb-4">
          <LanguageSwitcher variant="dropdown" />
        </div>
        <div className="flex justify-center">
          {tenantInfo.logoUrl ? (
            <img
              className="h-16 w-auto"
              src={tenantInfo.logoUrl}
              alt={tenantInfo.businessName}
            />
          ) : (
            <BuildingStorefrontIcon 
              className="h-16 w-16"
              style={{ color: tenantInfo.primaryColor }}
            />
          )}
        </div>
        <h2 className="mt-6 text-center text-3xl font-bold text-gray-900">
          Reset Your Password
        </h2>
        <p className="mt-4 text-center text-sm text-gray-600">
          Contact The Menu Genie support team for password assistance
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-lg sm:rounded-lg sm:px-10">
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-6">
            <p className="text-sm text-yellow-800">
              <strong>Important:</strong> For security reasons, password resets must be handled by The Menu Genie support team. Please provide your information below and our team will contact you shortly.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Your Email Address *
              </label>
              <div className="mt-1 relative">
                <div className={`absolute inset-y-0 ${isRTL ? 'right-0 pr-3' : 'left-0 pl-3'} flex items-center pointer-events-none`}>
                  <EnvelopeIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className={`appearance-none block w-full ${isRTL ? 'pr-10 pl-3' : 'pl-10 pr-3'} py-2 border rounded-md placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 sm:text-sm ${
                    errors.email
                      ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                      : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                  }`}
                  placeholder="your.email@example.com"
                />
              </div>
              {errors.email && (
                <p className="mt-2 text-sm text-red-600">{errors.email}</p>
              )}
            </div>

            <div>
              <label htmlFor="message" className="block text-sm font-medium text-gray-700">
                Additional Information (Optional)
              </label>
              <div className="mt-1">
                <textarea
                  id="message"
                  name="message"
                  rows={3}
                  value={formData.message}
                  onChange={handleChange}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Any additional information that might help us verify your identity..."
                />
              </div>
            </div>

            {errors.submit && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4">
                <p className="text-red-800 text-sm">{errors.submit}</p>
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ 
                  backgroundColor: tenantInfo.primaryColor
                }}
              >
                {loading && (
                  <div className={`animate-spin rounded-full h-4 w-4 border-b-2 border-white ${isRTL ? 'ml-2' : 'mr-2'}`}></div>
                )}
                {loading ? 'Submitting...' : 'Submit Request'}
              </button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Or</span>
              </div>
            </div>

            <div className="mt-6">
              <Link
                href={`/tenant/${slug}/login`}
                className="w-full inline-flex justify-center items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <ArrowLeftIcon className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                Back to Login
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
