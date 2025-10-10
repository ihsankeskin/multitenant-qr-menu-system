'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import {
  BuildingStorefrontIcon,
  ArrowLeftIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  UserGroupIcon,
  ChartBarIcon,
  CogIcon,
  PlusIcon,
  XMarkIcon
} from '@heroicons/react/24/outline'
import {
  BuildingStorefrontIcon as BuildingStorefrontSolidIcon
} from '@heroicons/react/24/solid'

interface Tenant {
  id: string
  slug: string
  businessName: string
  businessNameAr: string
  primaryColor: string
  secondaryColor?: string
  accentColor?: string
  logoUrl?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
  businessType: string
  currency: string
  defaultLanguage: string
  phone?: string
  email?: string
  address?: string
  coverImageUrl?: string
  _count: {
    categories: number
    products: number
    users: number
  }
}

interface TenantUser {
  id: string
  email: string
  firstName: string
  lastName: string
  role: string
  isActive: boolean
  createdAt: string
  lastLoginAt?: string
}

interface TenantStats {
  totalCategories: number
  totalProducts: number
  activeProducts: number
  totalUsers: number
  activeUsers: number
  menuViews: number
  lastActivity?: string
}

export default function SuperAdminTenantDetail() {
  const router = useRouter()
  const params = useParams()
  const tenantId = params?.id as string

  const [tenant, setTenant] = useState<Tenant | null>(null)
  const [tenantUsers, setTenantUsers] = useState<TenantUser[]>([])
  const [tenantStats, setTenantStats] = useState<TenantStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [isSaving, setSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'success' | 'error' | null>(null)
  const [showAddUserModal, setShowAddUserModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteConfirmName, setDeleteConfirmName] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)
  const [userFormData, setUserFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    role: 'admin',
    password: '',
    confirmPassword: ''
  })

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/super-admin/login')
      return
    }
    
    if (tenantId) {
      fetchTenantDetails()
      fetchTenantUsers()
      fetchTenantStats()
    }
  }, [tenantId])

  const fetchTenantDetails = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) return

      const response = await fetch(`/api/v1/super-admin/tenants/${tenantId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setTenant(data.data)
        }
      }
    } catch (error) {
      console.error('Failed to fetch tenant details:', error)
    }
  }

  const fetchTenantUsers = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) return

      const response = await fetch(`/api/v1/super-admin/tenants/${tenantId}/users`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setTenantUsers(data.data)
        }
      }
    } catch (error) {
      console.error('Failed to fetch tenant users:', error)
    }
  }

  const fetchTenantStats = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) return

      const response = await fetch(`/api/v1/super-admin/tenants/${tenantId}/stats`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setTenantStats(data.data)
        }
      }
    } catch (error) {
      console.error('Failed to fetch tenant stats:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const toggleTenantStatus = async () => {
    if (!tenant) return

    setSaving(true)
    try {
      const token = localStorage.getItem('token')
      if (!token) return

      const response = await fetch(`/api/v1/super-admin/tenants/${tenantId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          isActive: !tenant.isActive
        })
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setTenant({ ...tenant, isActive: !tenant.isActive })
          setSaveStatus('success')
          setTimeout(() => setSaveStatus(null), 3000)
        }
      } else {
        setSaveStatus('error')
      }
    } catch (error) {
      console.error('Failed to toggle tenant status:', error)
      setSaveStatus('error')
    } finally {
      setSaving(false)
    }
  }

  const deleteTenant = async () => {
    if (!tenant || deleteConfirmName !== tenant.businessName) return
    
    setIsDeleting(true)
    try {
      const token = localStorage.getItem('token')
      if (!token) return

      const response = await fetch(`/api/v1/super-admin/tenants/${tenantId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        router.push('/super-admin/tenants?deleted=true')
      } else {
        const data = await response.json()
        alert(`Failed to delete tenant: ${data.message || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Failed to delete tenant:', error)
      alert('Failed to delete tenant. Please try again.')
    } finally {
      setIsDeleting(false)
    }
  }

  const openDeleteModal = () => {
    setDeleteConfirmName('')
    setShowDeleteModal(true)
  }

  const closeDeleteModal = () => {
    setDeleteConfirmName('')
    setShowDeleteModal(false)
  }

  const createTenantUser = async () => {
    if (!validateUserForm()) return

    setSaving(true)
    try {
      const token = localStorage.getItem('token')
      if (!token) return

      const response = await fetch(`/api/v1/super-admin/tenants/${tenantId}/users`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: userFormData.email,
          firstName: userFormData.firstName,
          lastName: userFormData.lastName,
          password: userFormData.password,
          role: userFormData.role
        })
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setShowAddUserModal(false)
          setUserFormData({
            email: '',
            firstName: '',
            lastName: '',
            role: 'admin',
            password: '',
            confirmPassword: ''
          })
          await fetchTenantUsers() // Refresh users list
          setSaveStatus('success')
          setTimeout(() => setSaveStatus(null), 3000)
        } else {
          setSaveStatus('error')
        }
      } else {
        setSaveStatus('error')
      }
    } catch (error) {
      console.error('Failed to create user:', error)
      setSaveStatus('error')
    } finally {
      setSaving(false)
    }
  }

  const validateUserForm = (): boolean => {
    if (!userFormData.email || !userFormData.firstName || !userFormData.lastName || !userFormData.password) {
      alert('Please fill in all required fields')
      return false
    }
    
    if (userFormData.password !== userFormData.confirmPassword) {
      alert('Passwords do not match')
      return false
    }
    
    if (userFormData.password.length < 6) {
      alert('Password must be at least 6 characters long')
      return false
    }
    
    return true
  }

  const getStatusColor = (status: boolean): string => {
    return status ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
  }

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString()
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    )
  }

  if (!tenant) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Tenant not found</h3>
            <p className="mt-1 text-sm text-gray-500">
              The tenant you're looking for doesn't exist or has been removed.
            </p>
            <div className="mt-6">
              <button
                onClick={() => router.push('/super-admin/tenants')}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                <ArrowLeftIcon className="mr-2 h-4 w-4" />
                Back to Tenants
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <button
                onClick={() => router.push('/super-admin/tenants')}
                className="mr-4 inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                <ArrowLeftIcon className="h-4 w-4 mr-2" />
                Back
              </button>
              <div className="flex items-center">
                {tenant.logoUrl ? (
                  <img
                    src={tenant.logoUrl}
                    alt={tenant.businessName}
                    className="h-12 w-12 rounded-lg mr-4"
                  />
                ) : (
                  <BuildingStorefrontSolidIcon className="h-12 w-12 text-blue-600 mr-4" />
                )}
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">{tenant.businessName}</h1>
                  <p className="text-gray-600">/{tenant.slug}</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(tenant.isActive)}`}>
                {tenant.isActive ? 'Active' : 'Inactive'}
              </span>
              
              <button
                onClick={toggleTenantStatus}
                disabled={isSaving}
                className={`inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white ${
                  tenant.isActive 
                    ? 'bg-red-600 hover:bg-red-700' 
                    : 'bg-green-600 hover:bg-green-700'
                } disabled:opacity-50`}
              >
                {isSaving ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                ) : null}
                {tenant.isActive ? 'Deactivate' : 'Activate'}
              </button>
              
              <button
                onClick={openDeleteModal}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
              >
                <TrashIcon className="h-4 w-4 mr-2" />
                Delete
              </button>
            </div>
          </div>
          
          {/* Status Messages */}
          {saveStatus === 'success' && (
            <div className="mt-4 flex items-center p-4 bg-green-50 border border-green-200 rounded-md">
              <CheckCircleIcon className="h-5 w-5 text-green-600 mr-2" />
              <span className="text-green-800">Status updated successfully!</span>
            </div>
          )}
          
          {saveStatus === 'error' && (
            <div className="mt-4 flex items-center p-4 bg-red-50 border border-red-200 rounded-md">
              <ExclamationTriangleIcon className="h-5 w-5 text-red-600 mr-2" />
              <span className="text-red-800">Failed to update status. Please try again.</span>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-8">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'overview', name: 'Overview', icon: BuildingStorefrontIcon },
              { id: 'users', name: 'Users', icon: UserGroupIcon },
              { id: 'stats', name: 'Statistics', icon: ChartBarIcon },
              { id: 'settings', name: 'Settings', icon: CogIcon }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="h-5 w-5 mr-2" />
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Basic Information */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h3>
              <dl className="space-y-4">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Business Name (English)</dt>
                  <dd className="mt-1 text-sm text-gray-900">{tenant.businessName}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Business Name (Arabic)</dt>
                  <dd className="mt-1 text-sm text-gray-900">{tenant.businessNameAr || 'Not set'}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">URLs</dt>
                  <dd className="mt-1 space-y-2">
                    <div className="text-sm">
                      <span className="font-medium text-gray-900">Admin:</span>{' '}
                      <a 
                        href={`https://themenugenie.com/tenant/${tenant.slug}/dashboard`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 hover:underline"
                      >
                        themenugenie.com/tenant/{tenant.slug}/dashboard
                      </a>
                    </div>
                    <div className="text-sm">
                      <span className="font-medium text-gray-900">Menu:</span>{' '}
                      <a 
                        href={`https://themenugenie.com/menu/${tenant.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 hover:underline"
                      >
                        themenugenie.com/menu/{tenant.slug}
                      </a>
                    </div>
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Slug</dt>
                  <dd className="mt-1 text-sm text-gray-900">/{tenant.slug}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Business Type</dt>
                  <dd className="mt-1 text-sm text-gray-900 capitalize">{tenant.businessType}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Currency</dt>
                  <dd className="mt-1 text-sm text-gray-900">{tenant.currency || 'Not set'}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Default Language</dt>
                  <dd className="mt-1 text-sm text-gray-900">{tenant.defaultLanguage === 'ar' ? 'Arabic' : 'English'}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Brand Colors</dt>
                  <dd className="mt-1 space-y-2">
                    <div className="flex items-center">
                      <div 
                        className="w-6 h-6 rounded-full mr-2 border" 
                        style={{ backgroundColor: tenant.primaryColor }}
                      ></div>
                      <span className="text-sm text-gray-900">
                        <span className="font-medium">Primary:</span> {tenant.primaryColor}
                      </span>
                    </div>
                    {tenant.secondaryColor && (
                      <div className="flex items-center">
                        <div 
                          className="w-6 h-6 rounded-full mr-2 border" 
                          style={{ backgroundColor: tenant.secondaryColor }}
                        ></div>
                        <span className="text-sm text-gray-900">
                          <span className="font-medium">Secondary:</span> {tenant.secondaryColor}
                        </span>
                      </div>
                    )}
                    {tenant.accentColor && (
                      <div className="flex items-center">
                        <div 
                          className="w-6 h-6 rounded-full mr-2 border" 
                          style={{ backgroundColor: tenant.accentColor }}
                        ></div>
                        <span className="text-sm text-gray-900">
                          <span className="font-medium">Accent:</span> {tenant.accentColor}
                        </span>
                      </div>
                    )}
                  </dd>
                </div>
                {tenant.email && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Email</dt>
                    <dd className="mt-1 text-sm text-gray-900">{tenant.email}</dd>
                  </div>
                )}
                {tenant.phone && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Phone</dt>
                    <dd className="mt-1 text-sm text-gray-900">{tenant.phone}</dd>
                  </div>
                )}
                {tenant.address && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Address</dt>
                    <dd className="mt-1 text-sm text-gray-900">{tenant.address}</dd>
                  </div>
                )}
                <div>
                  <dt className="text-sm font-medium text-gray-500">Created</dt>
                  <dd className="mt-1 text-sm text-gray-900">{formatDate(tenant.createdAt)}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Last Updated</dt>
                  <dd className="mt-1 text-sm text-gray-900">{formatDate(tenant.updatedAt)}</dd>
                </div>
              </dl>
            </div>

            {/* Quick Stats */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Stats</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="text-2xl font-semibold text-blue-600">{tenant._count.categories}</div>
                  <div className="text-sm text-blue-800">Categories</div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="text-2xl font-semibold text-green-600">{tenant._count.products}</div>
                  <div className="text-sm text-green-800">Products</div>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <div className="text-2xl font-semibold text-purple-600">{tenant._count.users}</div>
                  <div className="text-sm text-purple-800">Users</div>
                </div>
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <div className="text-2xl font-semibold text-yellow-600">
                    {tenantStats?.menuViews || 0}
                  </div>
                  <div className="text-sm text-yellow-800">Menu Views</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">Tenant Users</h3>
              <button
                onClick={() => setShowAddUserModal(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                Add User
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Joined
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Last Login
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {tenantUsers.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center">
                        <UserGroupIcon className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-2 text-sm font-medium text-gray-900">No users</h3>
                        <p className="mt-1 text-sm text-gray-500">Get started by creating a new user for this tenant.</p>
                        <div className="mt-6">
                          <button
                            onClick={() => setShowAddUserModal(true)}
                            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                          >
                            <PlusIcon className="h-4 w-4 mr-2" />
                            Add User
                          </button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    tenantUsers.map((user) => (
                      <tr key={user.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {user.firstName} {user.lastName}
                            </div>
                            <div className="text-sm text-gray-500">{user.email}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 capitalize">
                            {user.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(user.isActive)}`}>
                            {user.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(user.createdAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {user.lastLoginAt ? formatDate(user.lastLoginAt) : 'Never'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'stats' && (
          <>
            {!tenantStats ? (
              <div className="bg-white rounded-lg shadow-sm border p-12">
                <div className="text-center">
                  <ChartBarIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No statistics available</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Statistics data could not be loaded. Please try refreshing the page.
                  </p>
                  <div className="mt-6">
                    <button
                      onClick={fetchTenantStats}
                      className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                    >
                      Retry
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-lg shadow-sm border">
                  <h4 className="text-lg font-medium text-gray-900 mb-4">Content Statistics</h4>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Categories:</span>
                      <span className="font-medium">{tenantStats.totalCategories}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Products:</span>
                      <span className="font-medium">{tenantStats.totalProducts}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Active Products:</span>
                      <span className="font-medium text-green-600">{tenantStats.activeProducts}</span>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white p-6 rounded-lg shadow-sm border">
                  <h4 className="text-lg font-medium text-gray-900 mb-4">User Statistics</h4>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Users:</span>
                      <span className="font-medium">{tenantStats.totalUsers}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Active Users:</span>
                      <span className="font-medium text-green-600">{tenantStats.activeUsers}</span>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white p-6 rounded-lg shadow-sm border">
                  <h4 className="text-lg font-medium text-gray-900 mb-4">Engagement</h4>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Menu Views:</span>
                      <span className="font-medium">{tenantStats.menuViews}</span>
                    </div>
                    {tenantStats.lastActivity && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Last Activity:</span>
                        <span className="font-medium">{formatDate(tenantStats.lastActivity)}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {activeTab === 'settings' && (
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-6">Tenant Settings</h3>
            <div className="space-y-6">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h4 className="text-sm font-medium text-gray-900">Account Status</h4>
                  <p className="text-sm text-gray-500">
                    {tenant.isActive ? 'This tenant account is currently active' : 'This tenant account is currently inactive'}
                  </p>
                </div>
                <button
                  onClick={toggleTenantStatus}
                  disabled={isSaving}
                  className={`inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white ${
                    tenant.isActive 
                      ? 'bg-red-600 hover:bg-red-700' 
                      : 'bg-green-600 hover:bg-green-700'
                  } disabled:opacity-50`}
                >
                  {tenant.isActive ? 'Deactivate Account' : 'Activate Account'}
                </button>
              </div>
              
              <div className="flex items-center justify-between p-4 border border-red-200 rounded-lg bg-red-50">
                <div>
                  <h4 className="text-sm font-medium text-red-900">Delete Tenant</h4>
                  <p className="text-sm text-red-700">
                    Permanently delete this tenant and all associated data. This action cannot be undone.
                  </p>
                </div>
                <button
                  onClick={openDeleteModal}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
                >
                  <TrashIcon className="h-4 w-4 mr-2" />
                  Delete Tenant
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Add User Modal */}
      {showAddUserModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-medium text-gray-900">Add New User</h3>
              <button
                onClick={() => setShowAddUserModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    First Name *
                  </label>
                  <input
                    type="text"
                    value={userFormData.firstName}
                    onChange={(e) => setUserFormData({ ...userFormData, firstName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter first name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    value={userFormData.lastName}
                    onChange={(e) => setUserFormData({ ...userFormData, lastName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter last name"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address *
                </label>
                <input
                  type="email"
                  value={userFormData.email}
                  onChange={(e) => setUserFormData({ ...userFormData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter email address"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Role *
                </label>
                <select
                  value={userFormData.role}
                  onChange={(e) => setUserFormData({ ...userFormData, role: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="admin">Admin</option>
                  <option value="manager">Manager</option>
                  <option value="staff">Staff</option>
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Password *
                  </label>
                  <input
                    type="password"
                    value={userFormData.password}
                    onChange={(e) => setUserFormData({ ...userFormData, password: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter password (min 6 characters)"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Confirm Password *
                  </label>
                  <input
                    type="password"
                    value={userFormData.confirmPassword}
                    onChange={(e) => setUserFormData({ ...userFormData, confirmPassword: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Confirm password"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
                <button
                  onClick={() => setShowAddUserModal(false)}
                  className="px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                  disabled={isSaving}
                >
                  Cancel
                </button>
                <button
                  onClick={createTenantUser}
                  disabled={isSaving}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                >
                  {isSaving && (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  )}
                  {isSaving ? 'Creating...' : 'Create User'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && tenant && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <ExclamationTriangleIcon className="h-6 w-6 text-red-600 mr-2" />
                <h3 className="text-lg font-medium text-gray-900">Delete Tenant</h3>
              </div>
              <button
                onClick={closeDeleteModal}
                className="text-gray-400 hover:text-gray-600"
                disabled={isDeleting}
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-red-50 border border-red-200 rounded-md p-4">
                <p className="text-sm text-red-800 mb-2">
                  <strong>Warning:</strong> This action cannot be undone.
                </p>
                <p className="text-sm text-red-700">
                  This will permanently delete:
                </p>
                <ul className="text-sm text-red-700 mt-2 ml-4 list-disc">
                  <li>Tenant account and all settings</li>
                  <li>All users and their access</li>
                  <li>All categories and products</li>
                  <li>All payment records and billing history</li>
                  <li>All audit logs and activity data</li>
                </ul>
              </div>

              <div>
                <p className="text-sm text-gray-700 mb-2">
                  To confirm deletion, please type the tenant name:{' '}
                  <span className="font-medium text-gray-900">{tenant.businessName}</span>
                </p>
                <input
                  type="text"
                  value={deleteConfirmName}
                  onChange={(e) => setDeleteConfirmName(e.target.value)}
                  placeholder={`Type "${tenant.businessName}" to confirm`}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500"
                  disabled={isDeleting}
                />
              </div>
            </div>

            <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200 mt-6">
              <button
                onClick={closeDeleteModal}
                className="px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                onClick={deleteTenant}
                disabled={isDeleting || deleteConfirmName !== tenant.businessName}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isDeleting && (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                )}
                {isDeleting ? 'Deleting...' : 'Delete Tenant'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}