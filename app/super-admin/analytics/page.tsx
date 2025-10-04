'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  ChartBarIcon,
  BuildingStorefrontIcon,
  UserGroupIcon,
  CurrencyDollarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon
} from '@heroicons/react/24/outline'
import {
  ChartBarIcon as ChartBarSolidIcon,
  ArrowUpIcon,
  ArrowDownIcon
} from '@heroicons/react/24/solid'

interface AnalyticsData {
  overview: {
    totalTenants: number
    activeTenants: number
    inactiveTenants: number
    newTenantsThisMonth: number
    totalCategories: number
    totalProducts: number
    totalActiveProducts: number
    totalMenuViews: number
    averageMenusPerTenant: number
  }
  trends: {
    tenantGrowth: Array<{
      month: string
      count: number
      growth: number
    }>
    categoryGrowth: Array<{
      month: string
      count: number
    }>
    productGrowth: Array<{
      month: string
      count: number
    }>
    viewsGrowth: Array<{
      month: string
      count: number
    }>
  }
  tenants: Array<{
    id: string
    businessName: string
    slug: string
    isActive: boolean
    createdAt: string
    lastLoginAt?: string | null
    _count: {
      categories: number
      products: number
    }
    businessType: string
    status: string
    subscriptionStatus?: string
  }>
  topPerformers: {
    mostActiveMenus: Array<{
      tenantId: string
      businessName: string
      viewCount: number
      categoryCount: number
      productCount: number
    }>
    newestTenants: Array<{
      id: string
      businessName: string
      slug: string
      createdAt: string
      businessType: string
    }>
  }
  alerts: Array<{
    type: 'error' | 'warning' | 'info'
    message: string
    tenantId?: string
    businessName?: string
    createdAt: string
  }>
}

export default function SuperAdminAnalytics() {
  const router = useRouter()
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [selectedTimeframe, setSelectedTimeframe] = useState('30d')

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/super-admin/login')
      return
    }
    fetchAnalytics()
  }, [selectedTimeframe])

  const fetchAnalytics = async () => {
    setIsLoading(true)
    try {
      const token = localStorage.getItem('token')
      if (!token) return

      const response = await fetch(`/api/v1/super-admin/analytics?timeframe=${selectedTimeframe}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setAnalytics(data.data)
          setLastUpdated(new Date())
        }
      }
    } catch (error) {
      console.error('Failed to fetch analytics:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
    return num.toString()
  }

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString()
  }

  const getGrowthColor = (growth: number): string => {
    if (growth > 0) return 'text-green-600'
    if (growth < 0) return 'text-red-600'
    return 'text-gray-500'
  }

  const getGrowthIcon = (growth: number) => {
    if (growth > 0) return <ArrowUpIcon className="h-4 w-4" />
    if (growth < 0) return <ArrowDownIcon className="h-4 w-4" />
    return null
  }

  const getStatusColor = (status: string | undefined): string => {
    if (!status) return 'bg-gray-100 text-gray-800'
    
    switch (status.toLowerCase()) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'inactive': return 'bg-red-100 text-red-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'suspended': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'error': return <ExclamationTriangleIcon className="h-5 w-5 text-red-600" />
      case 'warning': return <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600" />
      case 'info': return <CheckCircleIcon className="h-5 w-5 text-blue-600" />
      default: return <CheckCircleIcon className="h-5 w-5 text-gray-600" />
    }
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

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                <ChartBarSolidIcon className="h-8 w-8 mr-3 text-blue-600" />
                Platform Analytics
              </h1>
              <p className="text-gray-600 mt-2">
                Comprehensive insights into platform usage and tenant activity
              </p>
              {lastUpdated && (
                <p className="text-sm text-gray-500 mt-1 flex items-center">
                  <ClockIcon className="h-4 w-4 mr-1" />
                  Last updated: {lastUpdated.toLocaleString()}
                </p>
              )}
            </div>
            <div className="flex items-center space-x-4">
              <select
                value={selectedTimeframe}
                onChange={(e) => setSelectedTimeframe(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="90d">Last 3 months</option>
                <option value="1y">Last year</option>
              </select>
              <button
                onClick={fetchAnalytics}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <ArrowPathIcon className="h-4 w-4 mr-2" />
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <BuildingStorefrontIcon className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Tenants</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {analytics?.overview.totalTenants || 0}
                </p>
                <div className="flex items-center text-sm">
                  <span className="text-green-600 mr-1">
                    {analytics?.overview.activeTenants || 0} active
                  </span>
                  <span className="text-gray-400">•</span>
                  <span className="text-red-600 ml-1">
                    {analytics?.overview.inactiveTenants || 0} inactive
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <UserGroupIcon className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">New This Month</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {analytics?.overview.newTenantsThisMonth || 0}
                </p>
                <p className="text-xs text-gray-500">Recently joined tenants</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <ChartBarIcon className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Products</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {formatNumber(analytics?.overview.totalProducts || 0)}
                </p>
                <p className="text-xs text-green-600">
                  {formatNumber(analytics?.overview.totalActiveProducts || 0)} active
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <CurrencyDollarIcon className="h-8 w-8 text-yellow-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Menu Views</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {formatNumber(analytics?.overview.totalMenuViews || 0)}
                </p>
                <p className="text-xs text-gray-500">
                  Avg {(analytics?.overview.averageMenusPerTenant || 0).toFixed(1)} per tenant
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Platform Health */}
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <ArrowTrendingUpIcon className="h-5 w-5 mr-2 text-green-600" />
              Platform Health
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                <span className="text-sm font-medium text-gray-700">Active Tenants</span>
                <div className="flex items-center">
                  <span className="text-lg font-semibold text-green-700">
                    {analytics?.overview.activeTenants || 0}
                  </span>
                  <span className="text-xs text-green-600 ml-2">
                    ({((analytics?.overview.activeTenants || 0) / Math.max(analytics?.overview.totalTenants || 1, 1) * 100).toFixed(1)}%)
                  </span>
                </div>
              </div>
              
              <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                <span className="text-sm font-medium text-gray-700">Categories Created</span>
                <span className="text-lg font-semibold text-blue-700">
                  {formatNumber(analytics?.overview.totalCategories || 0)}
                </span>
              </div>
              
              <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                <span className="text-sm font-medium text-gray-700">Products Listed</span>
                <span className="text-lg font-semibold text-purple-700">
                  {formatNumber(analytics?.overview.totalProducts || 0)}
                </span>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Activity</h3>
            <div className="space-y-3">
              {analytics?.topPerformers.newestTenants.slice(0, 5).map((tenant) => (
                <div key={tenant.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{tenant.businessName}</p>
                    <p className="text-sm text-gray-600">
                      {tenant.businessType} • Joined {formatDate(tenant.createdAt)}
                    </p>
                  </div>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    New
                  </span>
                </div>
              )) || (
                <p className="text-gray-500 text-center py-4">No recent activity</p>
              )}
            </div>
          </div>
        </div>

        {/* Top Performers */}
        <div className="bg-white p-6 rounded-lg shadow-sm border mb-8">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Top Performing Menus</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Restaurant
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Menu Views
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Categories
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Products
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Engagement
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {analytics?.topPerformers.mostActiveMenus.slice(0, 10).map((tenant, index) => (
                  <tr key={tenant.tenantId}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-blue-600">
                            {index + 1}
                          </span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {tenant.businessName}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatNumber(tenant.viewCount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {tenant.categoryCount}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {tenant.productCount}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-16 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-green-600 h-2 rounded-full" 
                            style={{ width: `${Math.min((tenant.viewCount / 1000) * 100, 100)}%` }}
                          ></div>
                        </div>
                        <span className="ml-2 text-sm text-gray-600">
                          {((tenant.viewCount / 1000) * 100).toFixed(0)}%
                        </span>
                      </div>
                    </td>
                  </tr>
                )) || (
                  <tr>
                    <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                      No data available
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Alerts & Notifications */}
        {analytics?.alerts && analytics.alerts.length > 0 && (
          <div className="bg-white p-6 rounded-lg shadow-sm border mb-8">
            <h3 className="text-lg font-medium text-gray-900 mb-4">System Alerts</h3>
            <div className="space-y-3">
              {analytics.alerts.slice(0, 10).map((alert, index) => (
                <div key={index} className="flex items-start p-4 border rounded-lg">
                  <div className="flex-shrink-0">
                    {getAlertIcon(alert.type)}
                  </div>
                  <div className="ml-3 flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      {alert.message}
                    </p>
                    <div className="mt-1 flex items-center text-xs text-gray-500">
                      <span>{formatDate(alert.createdAt)}</span>
                      {alert.businessName && (
                        <>
                          <span className="mx-1">•</span>
                          <span>{alert.businessName}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* All Tenants */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">All Tenants</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Restaurant
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Business Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Categories
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Products
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
                {analytics?.tenants.map((tenant) => (
                  <tr key={tenant.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {tenant.businessName}
                        </div>
                        <div className="text-sm text-gray-500">/{tenant.slug}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 capitalize">
                      {tenant.businessType}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(tenant.status)}`}>
                        {tenant.status || (tenant.isActive ? 'active' : 'inactive')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {tenant._count.categories}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {tenant._count.products}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(tenant.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {tenant.lastLoginAt ? formatDate(tenant.lastLoginAt) : 'Never'}
                    </td>
                  </tr>
                )) || (
                  <tr>
                    <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                      No tenants found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}