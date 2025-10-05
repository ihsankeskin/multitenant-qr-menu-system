'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import LanguageSwitcher from '@/components/LanguageSwitcher'
import { useTranslation } from '@/contexts/LocalizationContext'
import { 
  BuildingStorefrontIcon, 
  EnvelopeIcon, 
  LockClosedIcon,
  EyeIcon,
  EyeSlashIcon
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

export default function TenantLoginPage() {
  const { t, isRTL } = useTranslation()
  const router = useRouter()
  const params = useParams()
  const slug = params.slug as string
  
  const [tenantInfo, setTenantInfo] = useState<TenantInfo | null>(null)
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    password: ''
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

  const handleQuickLogin = () => {
    setFormData({
      email: 'admin@demo-restaurant.com',
      password: 'DemoAdmin123!'
    })
    setErrors({})
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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

    if (!formData.password.trim()) {
      newErrors.password = 'Password is required'
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
      const response = await fetch(`/api/v1/tenant/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          tenantSlug: slug
        })
      })

      const data = await response.json()

      if (response.ok && data.success) {
        // Store authentication data with tenant-specific keys
        localStorage.setItem(`tenant_token_${slug}`, data.data.token)
        localStorage.setItem(`tenant_user_${slug}`, JSON.stringify(data.data.user))
        localStorage.setItem(`tenant_data_${slug}`, JSON.stringify(data.data.tenant))
        
        // Redirect to tenant dashboard
        router.push(`/tenant/${slug}/dashboard`)
      } else {
        setErrors({ 
          submit: data.message || 'Invalid email or password'
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
          {tenantInfo.businessName}
        </h2>
        {tenantInfo.businessNameAr && (
          <h3 className="mt-2 text-center text-xl font-medium text-gray-600" dir="rtl">
            {tenantInfo.businessNameAr}
          </h3>
        )}
        <p className="mt-4 text-center text-sm text-gray-600">
          {t('tenant.auth.login.description')}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-lg sm:rounded-lg sm:px-10">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                {t('common.email')}
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
                  placeholder={t('tenant.auth.login.emailPlaceholder')}
                />
              </div>
              {errors.email && (
                <p className="mt-2 text-sm text-red-600">{errors.email}</p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                {t('common.password')}
              </label>
              <div className="mt-1 relative">
                <div className={`absolute inset-y-0 ${isRTL ? 'right-0 pr-3' : 'left-0 pl-3'} flex items-center pointer-events-none`}>
                  <LockClosedIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className={`appearance-none block w-full ${isRTL ? 'pr-10 pl-10' : 'pl-10 pr-10'} py-2 border rounded-md placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 sm:text-sm ${
                    errors.password
                      ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                      : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                  }`}
                  placeholder={t('tenant.auth.login.passwordPlaceholder')}
                />
                <div className={`absolute inset-y-0 ${isRTL ? 'left-0 pl-3' : 'right-0 pr-3'} flex items-center`}>
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-gray-400 hover:text-gray-600"
                    title={showPassword ? t('tenant.auth.login.hidePassword') : t('tenant.auth.login.showPassword')}
                  >
                    {showPassword ? (
                      <EyeSlashIcon className="h-5 w-5" />
                    ) : (
                      <EyeIcon className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>
              {errors.password && (
                <p className="mt-2 text-sm text-red-600">{errors.password}</p>
              )}
            </div>

            <div className="flex items-center justify-between">
              <div className="text-sm">
                <Link
                  href={`/tenant/${slug}/forgot-password`}
                  className="font-medium hover:underline"
                  style={{ color: tenantInfo.primaryColor }}
                >
                  {t('tenant.auth.login.forgotPassword')}
                </Link>
              </div>
            </div>

            {errors.submit && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4">
                <p className="text-red-800 text-sm">{errors.submit}</p>
              </div>
            )}

            {/* Quick Login Button for Development - Show only for demo restaurant */}
            {slug === 'demo-restaurant' && (
              <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-800">{t('tenant.auth.login.demoQuickLogin', { default: 'Demo Quick Login' })}</p>
                    <p className="text-xs text-blue-600 mt-1">{t('tenant.auth.login.demoQuickLoginDescription', { default: 'Click to auto-fill demo admin credentials' })}</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleQuickLogin}
                    className="inline-flex items-center px-3 py-1 border border-blue-300 rounded-md text-sm font-medium text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {t('tenant.auth.login.quickLoginButton', { default: 'Quick Login' })}
                  </button>
                </div>
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
                {loading ? t('tenant.auth.login.signingIn') : t('tenant.auth.login.signIn')}
              </button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Need help?</span>
              </div>
            </div>

            <div className="mt-4 text-center">
              <p className="text-xs text-gray-500">
                Contact your system administrator for account access
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}