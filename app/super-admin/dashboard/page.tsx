'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import LanguageSwitcher from '@/components/LanguageSwitcher'
import { useTranslation } from '@/contexts/LocalizationContext'
import { 
  Building2, 
  Users, 
  DollarSign, 
  Activity,
  Plus,
  Search,
  Filter,
  MoreVertical,
  TrendingUp,
  TrendingDown
  // AlertCircle // Available for future error handling UI
} from 'lucide-react'

interface DashboardStats {
  totalTenants: number
  activeTenants: number
  totalUsers: number
  monthlyRevenue: number
  revenueGrowth: number
  expectedMonthlyRevenue: number
  totalCashCollected: number
}

interface RecentTenant {
  id: string
  name: string
  businessType: string
  status: 'active' | 'inactive' | 'suspended'
  createdAt: string
  subscriptionPlan: string
  revenue: number
}

export default function SuperAdminDashboard() {
  const { t, isRTL } = useTranslation()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [recentTenants, setRecentTenants] = useState<RecentTenant[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const [statsResponse, tenantsResponse] = await Promise.all([
        fetch('/api/v1/super-admin/dashboard/stats', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }),
        fetch('/api/v1/super-admin/tenants?limit=10', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        })
      ])

      if (!statsResponse.ok || !tenantsResponse.ok) {
        throw new Error('Failed to fetch dashboard data')
      }

      const statsData = await statsResponse.json()
      const tenantsData = await tenantsResponse.json()

      setStats(statsData.data)
      setRecentTenants(tenantsData.data.tenants)
    } catch (error) {
      console.error('Dashboard fetch error:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'inactive': return 'bg-gray-100 text-gray-800'
      case 'suspended': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const translateBusinessType = (businessType: string) => {
    switch (businessType.toLowerCase()) {
      case 'restaurant': return t('common.restaurant')
      case 'cafe': return t('common.cafe')
      default: return businessType
    }
  }

  const translateStatus = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active': return t('common.active')
      case 'inactive': return t('superAdmin.tenants.filters.inactive')
      case 'suspended': return t('superAdmin.tenants.filters.suspended')
      default: return status
    }
  }

  const translateSubscriptionPlan = (plan: string) => {
    switch (plan.toLowerCase()) {
      case 'basic': return t('common.basic')
      case 'premium': return t('common.premium')
      case 'enterprise': return t('common.enterprise')
      default: return plan
    }
  }

  const toggleDropdown = (tenantId: string) => {
    setOpenDropdownId(openDropdownId === tenantId ? null : tenantId)
  }

  const handleViewTenant = (tenantId: string) => {
    setOpenDropdownId(null)
    router.push(`/super-admin/tenants/${tenantId}`)
  }

  const handleEditTenant = (tenantId: string) => {
    setOpenDropdownId(null)
    router.push(`/super-admin/tenants/${tenantId}`)
  }

  const handleDeleteTenant = (tenantId: string) => {
    setOpenDropdownId(null)
    router.push(`/super-admin/tenants/${tenantId}`)
    // Could also open delete modal here if needed
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">{t('common.loading')}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{t('superAdmin.dashboard.title')}</h1>
              <p className="mt-1 text-sm text-gray-500">
                {t('superAdmin.dashboard.description')}
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <LanguageSwitcher variant="dropdown" />
              <button
                onClick={() => router.push('/super-admin/tenants/create')}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
              >
                <Plus size={20} />
                <span>{t('superAdmin.dashboard.addTenant')}</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Grid */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Building2 className="h-6 w-6 text-gray-400" />
                  </div>
                  <div className={`${isRTL ? 'mr-5' : 'ml-5'} w-0 flex-1`}>
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        {t('superAdmin.dashboard.stats.totalTenants')}
                      </dt>
                      <dd className="flex items-baseline">
                        <div className="text-2xl font-semibold text-gray-900">
                          {stats.totalTenants}
                        </div>
                        <div className={`${isRTL ? 'mr-2' : 'ml-2'} flex items-baseline text-sm font-semibold text-green-600`}>
                          <span className="sr-only">{t('superAdmin.dashboard.stats.active')}: </span>
                          {stats.activeTenants} {t('superAdmin.dashboard.stats.active').toLowerCase()}
                        </div>
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Users className="h-6 w-6 text-gray-400" />
                  </div>
                  <div className={`${isRTL ? 'mr-5' : 'ml-5'} w-0 flex-1`}>
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        {t('superAdmin.dashboard.stats.totalUsers')}
                      </dt>
                      <dd className="text-2xl font-semibold text-gray-900">
                        {stats.totalUsers}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <DollarSign className="h-6 w-6 text-emerald-600" />
                  </div>
                  <div className={`${isRTL ? 'mr-5' : 'ml-5'} w-0 flex-1`}>
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Expected Monthly Revenue
                      </dt>
                      <dd className="flex items-baseline">
                        <div className="text-2xl font-semibold text-gray-900">
                          {stats.expectedMonthlyRevenue.toLocaleString()} EGP
                        </div>
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <DollarSign className="h-6 w-6 text-green-600" />
                  </div>
                  <div className={`${isRTL ? 'mr-5' : 'ml-5'} w-0 flex-1`}>
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Cash Collected (Total)
                      </dt>
                      <dd className="flex items-baseline">
                        <div className="text-2xl font-semibold text-gray-900">
                          {stats.totalCashCollected.toLocaleString()} EGP
                        </div>
                        <div className={`${isRTL ? 'mr-2' : 'ml-2'} flex items-baseline text-sm font-semibold ${
                          stats.revenueGrowth >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {stats.revenueGrowth >= 0 ? (
                            <TrendingUp className={`h-4 w-4 ${isRTL ? 'ml-1' : 'mr-1'}`} />
                          ) : (
                            <TrendingDown className={`h-4 w-4 ${isRTL ? 'ml-1' : 'mr-1'}`} />
                          )}
                          {Math.abs(stats.revenueGrowth)}%
                        </div>
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Recent Tenants */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                {t('superAdmin.dashboard.recentTenants.title')}
              </h3>
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <div className={`absolute inset-y-0 ${isRTL ? 'right-0 pr-3' : 'left-0 pl-3'} flex items-center pointer-events-none`}>
                    <Search className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className={`block w-full ${isRTL ? 'pr-10 pl-3' : 'pl-10 pr-3'} py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500`}
                    placeholder={t('superAdmin.dashboard.recentTenants.searchPlaceholder')}
                  />
                </div>
                <button className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                  <Filter className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                  {t('common.filter')}
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('superAdmin.dashboard.recentTenants.tenant')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('superAdmin.dashboard.recentTenants.businessType')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('superAdmin.dashboard.recentTenants.status')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('superAdmin.dashboard.recentTenants.plan')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('superAdmin.dashboard.recentTenants.revenue')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('common.created')}
                    </th>
                    <th className="relative px-6 py-3">
                      <span className="sr-only">{t('common.actions')}</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {recentTenants.map((tenant) => (
                    <tr key={tenant.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {tenant.name}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {translateBusinessType(tenant.businessType)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(tenant.status)}`}>
                          {translateStatus(tenant.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {translateSubscriptionPlan(tenant.subscriptionPlan)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {tenant.revenue.toLocaleString()} EGP
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(tenant.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="relative">
                          <button 
                            onClick={() => toggleDropdown(tenant.id)}
                            className="text-gray-400 hover:text-gray-600 focus:outline-none focus:text-gray-600"
                          >
                            <MoreVertical className="h-5 w-5" />
                          </button>
                          
                          {openDropdownId === tenant.id && (
                            <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border border-gray-200">
                              <div className="py-1">
                                <button
                                  onClick={() => handleViewTenant(tenant.id)}
                                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                                >
                                  👁️ View Details
                                </button>
                                <button
                                  onClick={() => handleEditTenant(tenant.id)}
                                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                                >
                                  ✏️ Edit Tenant
                                </button>
                                <button
                                  onClick={() => handleDeleteTenant(tenant.id)}
                                  className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 hover:text-red-700"
                                >
                                  🗑️ Delete
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-6 flex justify-between items-center">
              <div className="text-sm text-gray-700">
                {t('superAdmin.dashboard.showingCount', { count: recentTenants.length, total: stats?.totalTenants || 0 })}
              </div>
              <button
                onClick={() => router.push('/super-admin/tenants')}
                className="text-indigo-600 hover:text-indigo-900 text-sm font-medium"
              >
                {t('superAdmin.dashboard.viewAllTenants')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}