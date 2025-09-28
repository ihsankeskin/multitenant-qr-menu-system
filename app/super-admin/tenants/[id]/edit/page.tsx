'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { 
  ArrowLeftIcon,
  BuildingStorefrontIcon,
  ExclamationTriangleIcon 
} from '@heroicons/react/24/outline'

interface BusinessType {
  id: string
  nameEn: string
  nameAr: string
}

interface TenantData {
  id: string
  businessName: string
  businessNameAr?: string
  businessTypeId: string
  email: string
  phone?: string
  address?: string
  addressAr?: string
  ownerName: string
  ownerEmail: string
  ownerPhone?: string
  customDomain?: string
  subdomain?: string
  defaultLanguage: string
  currency: string
  timezone: string
  logoUrl?: string
  primaryColor?: string
  secondaryColor?: string
  accentColor?: string
  description?: string
  descriptionAr?: string
  subscriptionStatus: string
  subscriptionPlan: string
  monthlyFee: number
  isActive: boolean
}

export default function EditTenantPage() {
  const router = useRouter()
  const params = useParams()
  const tenantId = params.id as string

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [tenant, setTenant] = useState<TenantData | null>(null)
  const [businessTypes, setBusinessTypes] = useState<BusinessType[]>([])
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    fetchTenantData()
    fetchBusinessTypes()
  }, [tenantId])

  const fetchTenantData = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        router.push('/super-admin/login')
        return
      }

      const response = await fetch(`/api/v1/super-admin/tenants/${tenantId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setTenant(data.data)
        } else {
          setErrors({ general: data.message || 'Failed to fetch tenant data' })
        }
      } else {
        setErrors({ general: 'Failed to fetch tenant data' })
      }
    } catch (error) {
      setErrors({ general: 'Network error occurred' })
    } finally {
      setLoading(false)
    }
  }

  const fetchBusinessTypes = async () => {
    try {
      const response = await fetch('/api/v1/business-types')
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setBusinessTypes(data.data)
        }
      }
    } catch (error) {
      console.error('Error fetching business types:', error)
    }
  }

  const handleInputChange = (field: keyof TenantData, value: string | number | boolean) => {
    if (tenant) {
      setTenant({ ...tenant, [field]: value })
      // Clear field error when user starts typing
      if (errors[field]) {
        setErrors(prev => ({ ...prev, [field]: '' }))
      }
    }
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!tenant?.businessName?.trim()) {
      newErrors.businessName = 'Business name is required'
    }
    if (!tenant?.businessTypeId) {
      newErrors.businessTypeId = 'Business type is required'
    }
    if (!tenant?.ownerName?.trim()) {
      newErrors.ownerName = 'Owner name is required'
    }
    if (!tenant?.ownerEmail?.trim()) {
      newErrors.ownerEmail = 'Owner email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(tenant.ownerEmail)) {
      newErrors.ownerEmail = 'Please enter a valid email address'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm() || !tenant) return

    setSaving(true)
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        router.push('/super-admin/login')
        return
      }

      const response = await fetch(`/api/v1/super-admin/tenants/${tenantId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(tenant)
      })

      const data = await response.json()

      if (response.ok && data.success) {
        router.push(`/super-admin/tenants/${tenantId}`)
      } else {
        setErrors({ general: data.message || 'Failed to update tenant' })
      }
    } catch (error) {
      setErrors({ general: 'Network error occurred' })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!tenant) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <ExclamationTriangleIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Tenant Not Found</h2>
          <p className="text-gray-600 mb-4">The tenant you're looking for doesn't exist or has been removed.</p>
          <Link
            href="/super-admin/tenants"
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg inline-flex items-center space-x-2"
          >
            <ArrowLeftIcon className="h-5 w-5" />
            <span>Back to Tenants</span>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href={`/super-admin/tenants/${tenantId}`}
            className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4"
          >
            <ArrowLeftIcon className="h-5 w-5 mr-2" />
            Back to Tenant Details
          </Link>
          <div className="flex items-center space-x-3">
            <BuildingStorefrontIcon className="h-8 w-8 text-blue-600" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Edit Tenant</h1>
              <p className="text-gray-600">{tenant.businessName}</p>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Business Information */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Business Information</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Business Name *
                </label>
                <input
                  type="text"
                  value={tenant.businessName || ''}
                  onChange={(e) => handleInputChange('businessName', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.businessName ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Enter business name"
                />
                {errors.businessName && (
                  <p className="text-red-600 text-sm mt-1">{errors.businessName}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Business Name (Arabic)
                </label>
                <input
                  type="text"
                  value={tenant.businessNameAr || ''}
                  onChange={(e) => handleInputChange('businessNameAr', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter business name in Arabic"
                  dir="rtl"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Business Type *
                </label>
                <select
                  value={tenant.businessTypeId || ''}
                  onChange={(e) => handleInputChange('businessTypeId', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.businessTypeId ? 'border-red-300' : 'border-gray-300'
                  }`}
                >
                  <option value="">Select business type</option>
                  {businessTypes.map((type) => (
                    <option key={type.id} value={type.id}>
                      {type.nameEn}
                    </option>
                  ))}
                </select>
                {errors.businessTypeId && (
                  <p className="text-red-600 text-sm mt-1">{errors.businessTypeId}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Business Email
                </label>
                <input
                  type="email"
                  value={tenant.email || ''}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter business email"
                />
              </div>
            </div>
          </div>

          {/* Owner Information */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Owner Information</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Owner Name *
                </label>
                <input
                  type="text"
                  value={tenant.ownerName || ''}
                  onChange={(e) => handleInputChange('ownerName', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.ownerName ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Enter owner name"
                />
                {errors.ownerName && (
                  <p className="text-red-600 text-sm mt-1">{errors.ownerName}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Owner Email *
                </label>
                <input
                  type="email"
                  value={tenant.ownerEmail || ''}
                  onChange={(e) => handleInputChange('ownerEmail', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.ownerEmail ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Enter owner email"
                />
                {errors.ownerEmail && (
                  <p className="text-red-600 text-sm mt-1">{errors.ownerEmail}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Owner Phone
                </label>
                <input
                  type="text"
                  value={tenant.ownerPhone || ''}
                  onChange={(e) => handleInputChange('ownerPhone', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter owner phone"
                />
              </div>
            </div>
          </div>

          {/* Subscription Settings */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Subscription Settings</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Subscription Plan
                </label>
                <select
                  value={tenant.subscriptionPlan || 'BASIC'}
                  onChange={(e) => handleInputChange('subscriptionPlan', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="BASIC">Basic</option>
                  <option value="PREMIUM">Premium</option>
                  <option value="ENTERPRISE">Enterprise</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Monthly Fee (USD)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={tenant.monthlyFee || 0}
                  onChange={(e) => handleInputChange('monthlyFee', parseFloat(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  value={tenant.subscriptionStatus || 'ACTIVE'}
                  onChange={(e) => handleInputChange('subscriptionStatus', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="ACTIVE">Active</option>
                  <option value="GRACE_PERIOD">Grace Period</option>
                  <option value="SUSPENDED">Suspended</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              </div>
            </div>
          </div>

          {/* Error Display */}
          {errors.general && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <p className="text-red-800 text-sm">{errors.general}</p>
            </div>
          )}

          {/* Form Actions */}
          <div className="flex justify-end space-x-4">
            <Link
              href={`/super-admin/tenants/${tenantId}`}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}