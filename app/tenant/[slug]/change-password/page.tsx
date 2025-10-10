'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams, useSearchParams } from 'next/navigation'
import LanguageSwitcher from '@/components/LanguageSwitcher'
import { useTranslation } from '@/contexts/LocalizationContext'
import { 
  BuildingStorefrontIcon, 
  LockClosedIcon,
  EyeIcon,
  EyeSlashIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon
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

export default function TenantChangePasswordPage() {
  const { t, isRTL } = useTranslation()
  const router = useRouter()
  const params = useParams()
  const searchParams = useSearchParams()
  const slug = params.slug as string
  const isFirstLogin = searchParams.get('firstLogin') === 'true'
  
  const [tenantInfo, setTenantInfo] = useState<TenantInfo | null>(null)
  const [loading, setLoading] = useState(false)
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    if (slug) {
      // Check if user is authenticated
      const token = localStorage.getItem(`tenant_token_${slug}`)
      const userData = localStorage.getItem(`tenant_user_${slug}`)
      
      if (!token || !userData) {
        router.push(`/tenant/${slug}/login`)
        return
      }
      
      setUser(JSON.parse(userData))
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
        }
      }
    } catch (error) {
      console.error('Error fetching tenant info:', error)
    }
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

    if (!formData.currentPassword.trim()) {
      newErrors.currentPassword = 'Current password is required'
    }

    if (!formData.newPassword.trim()) {
      newErrors.newPassword = 'New password is required'
    } else if (formData.newPassword.length < 8) {
      newErrors.newPassword = 'Password must be at least 8 characters long'
    } else if (!/(?=.*[a-z])/.test(formData.newPassword)) {
      newErrors.newPassword = 'Password must contain at least one lowercase letter'
    } else if (!/(?=.*[A-Z])/.test(formData.newPassword)) {
      newErrors.newPassword = 'Password must contain at least one uppercase letter'
    } else if (!/(?=.*\d)/.test(formData.newPassword)) {
      newErrors.newPassword = 'Password must contain at least one number'
    } else if (!/(?=.*[!@#$%^&*])/.test(formData.newPassword)) {
      newErrors.newPassword = 'Password must contain at least one special character (!@#$%^&*)'
    }

    if (!formData.confirmPassword.trim()) {
      newErrors.confirmPassword = 'Please confirm your new password'
    } else if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match'
    }

    if (formData.currentPassword === formData.newPassword) {
      newErrors.newPassword = 'New password must be different from current password'
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
      const token = localStorage.getItem(`tenant_token_${slug}`)
      const response = await fetch(`/api/v1/tenant/auth/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          currentPassword: formData.currentPassword,
          newPassword: formData.newPassword,
          tenantSlug: slug
        })
      })

      const data = await response.json()

      if (response.ok && data.success) {
        // Update user data to reflect password change
        if (user) {
          const updatedUser = { ...user, mustChangePassword: false }
          localStorage.setItem(`tenant_user_${slug}`, JSON.stringify(updatedUser))
        }
        
        // Show success message briefly before redirecting
        alert('Password changed successfully!')
        
        // Redirect to dashboard
        router.push(`/tenant/${slug}/dashboard`)
      } else {
        setErrors({ 
          submit: data.message || 'Failed to change password'
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

  const handleSkip = () => {
    if (isFirstLogin) {
      // User tried to skip, but they must change password
      setErrors({
        submit: 'You must change your password before continuing'
      })
      return
    }
    router.push(`/tenant/${slug}/dashboard`)
  }

  if (!tenantInfo || !user) {
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
          {isFirstLogin ? 'Change Your Password' : 'Update Password'}
        </h2>
        {tenantInfo.businessNameAr && (
          <h3 className="mt-2 text-center text-xl font-medium text-gray-600" dir="rtl">
            {isFirstLogin ? 'قم بتغيير كلمة المرور الخاصة بك' : 'تحديث كلمة المرور'}
          </h3>
        )}
        {isFirstLogin && (
          <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-md p-4">
            <div className="flex">
              <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600 mr-3" />
              <div>
                <p className="text-sm text-yellow-800">
                  For security reasons, you must change your password before accessing your account.
                </p>
                <p className="text-sm text-yellow-700 mt-1" dir="rtl">
                  لأسباب أمنية، يجب عليك تغيير كلمة المرور قبل الوصول إلى حسابك.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-lg sm:rounded-lg sm:px-10">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700">
                Current Password / كلمة المرور الحالية
              </label>
              <div className="mt-1 relative">
                <div className={`absolute inset-y-0 ${isRTL ? 'right-0 pr-3' : 'left-0 pl-3'} flex items-center pointer-events-none`}>
                  <LockClosedIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="currentPassword"
                  name="currentPassword"
                  type={showCurrentPassword ? 'text' : 'password'}
                  required
                  value={formData.currentPassword}
                  onChange={handleChange}
                  className={`appearance-none block w-full ${isRTL ? 'pr-10 pl-10' : 'pl-10 pr-10'} py-2 border rounded-md placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 sm:text-sm ${
                    errors.currentPassword
                      ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                      : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                  }`}
                  placeholder="Enter current password"
                />
                <div className={`absolute inset-y-0 ${isRTL ? 'left-0 pl-3' : 'right-0 pr-3'} flex items-center`}>
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    {showCurrentPassword ? (
                      <EyeSlashIcon className="h-5 w-5" />
                    ) : (
                      <EyeIcon className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>
              {errors.currentPassword && (
                <p className="mt-2 text-sm text-red-600">{errors.currentPassword}</p>
              )}
            </div>

            <div>
              <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">
                New Password / كلمة المرور الجديدة
              </label>
              <div className="mt-1 relative">
                <div className={`absolute inset-y-0 ${isRTL ? 'right-0 pr-3' : 'left-0 pl-3'} flex items-center pointer-events-none`}>
                  <LockClosedIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="newPassword"
                  name="newPassword"
                  type={showNewPassword ? 'text' : 'password'}
                  required
                  value={formData.newPassword}
                  onChange={handleChange}
                  className={`appearance-none block w-full ${isRTL ? 'pr-10 pl-10' : 'pl-10 pr-10'} py-2 border rounded-md placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 sm:text-sm ${
                    errors.newPassword
                      ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                      : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                  }`}
                  placeholder="Enter new password"
                />
                <div className={`absolute inset-y-0 ${isRTL ? 'left-0 pl-3' : 'right-0 pr-3'} flex items-center`}>
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    {showNewPassword ? (
                      <EyeSlashIcon className="h-5 w-5" />
                    ) : (
                      <EyeIcon className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>
              {errors.newPassword && (
                <p className="mt-2 text-sm text-red-600">{errors.newPassword}</p>
              )}
              <p className="mt-2 text-xs text-gray-500">
                Password must be at least 8 characters with uppercase, lowercase, number, and special character
              </p>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                Confirm New Password / تأكيد كلمة المرور الجديدة
              </label>
              <div className="mt-1 relative">
                <div className={`absolute inset-y-0 ${isRTL ? 'right-0 pr-3' : 'left-0 pl-3'} flex items-center pointer-events-none`}>
                  <LockClosedIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className={`appearance-none block w-full ${isRTL ? 'pr-10 pl-10' : 'pl-10 pr-10'} py-2 border rounded-md placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 sm:text-sm ${
                    errors.confirmPassword
                      ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                      : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                  }`}
                  placeholder="Confirm new password"
                />
                <div className={`absolute inset-y-0 ${isRTL ? 'left-0 pl-3' : 'right-0 pr-3'} flex items-center`}>
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    {showConfirmPassword ? (
                      <EyeSlashIcon className="h-5 w-5" />
                    ) : (
                      <EyeIcon className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>
              {errors.confirmPassword && (
                <p className="mt-2 text-sm text-red-600">{errors.confirmPassword}</p>
              )}
            </div>

            {errors.submit && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4">
                <p className="text-red-800 text-sm">{errors.submit}</p>
              </div>
            )}

            <div className="flex items-center space-x-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ 
                  backgroundColor: tenantInfo.primaryColor
                }}
              >
                {loading && (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                )}
                {loading ? 'Changing Password...' : 'Change Password'}
              </button>
              
              {!isFirstLogin && (
                <button
                  type="button"
                  onClick={handleSkip}
                  className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
