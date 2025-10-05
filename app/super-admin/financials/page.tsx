'use client'

import { useState, useEffect } from 'react'
import { useTranslation } from '../../../contexts/LocalizationContext'
import { 
  BanknotesIcon,
  CreditCardIcon,
  ChartBarIcon,
  CalendarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ExclamationTriangleIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  XMarkIcon,
  CheckIcon
} from '@heroicons/react/24/outline'
import Link from 'next/link'

interface PaymentRecord {
  id: string
  tenantId: string
  tenant: {
    businessName: string
    slug: string
  }
  amount: number
  method: string
  status: string
  paidAt?: string
  dueDate: string
  description: string
  invoiceNumber: string
}

interface FinancialStats {
  totalRevenue: number
  monthlyRevenue: number
  totalTenants: number
  activeTenants: number
  overduePayments: number
  pendingPayments: number
  averagePayment: number
  revenueGrowth: number
}

interface Tenant {
  id: string
  businessName: string
  slug: string
  subscriptionPlan: string
  status: string
}

export default function FinancialManagementPage() {
  const { t } = useTranslation()
  const [stats, setStats] = useState<FinancialStats | null>(null)
  const [payments, setPayments] = useState<PaymentRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [methodFilter, setMethodFilter] = useState('all')
  const [error, setError] = useState('')
  
  // Payment Modal States
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [selectedTenants, setSelectedTenants] = useState<string[]>([])
  const [tenantSearchQuery, setTenantSearchQuery] = useState('')
  const [paymentMonth, setPaymentMonth] = useState('')
  const [paymentAmount, setPaymentAmount] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('BANK_TRANSFER')
  const [paymentNotes, setPaymentNotes] = useState('')
  const [processingPayment, setProcessingPayment] = useState(false)
  const [paymentError, setPaymentError] = useState('')
  const [paymentSuccess, setPaymentSuccess] = useState('')

  useEffect(() => {
    fetchFinancialData()
    fetchTenants()
  }, [])
  
  // Generate current month as default
  useEffect(() => {
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    setPaymentMonth(`${year}-${month}`)
  }, [])

  const fetchFinancialData = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        window.location.href = '/super-admin/login'
        return
      }

      // Fetch financial stats
      const statsResponse = await fetch('/api/v1/super-admin/financials/stats', {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      // Fetch payment records
      const paymentsResponse = await fetch('/api/v1/super-admin/financials/payments', {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (statsResponse.ok && paymentsResponse.ok) {
        const statsData = await statsResponse.json()
        const paymentsData = await paymentsResponse.json()
        
        if (statsData.success && paymentsData.success) {
          setStats(statsData.data)
          setPayments(paymentsData.data.payments || [])
        }
      }
    } catch (error) {
      console.error('Error fetching financial data:', error)
      setError('Failed to load financial data')
    } finally {
      setLoading(false)
    }
  }
  
  const fetchTenants = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) return

      const response = await fetch('/api/v1/super-admin/tenants', {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setTenants(data.data.tenants || [])
        }
      }
    } catch (error) {
      console.error('Error fetching tenants:', error)
    }
  }
  
  const handleTenantSelection = (tenantId: string) => {
    setSelectedTenants(prev => {
      if (prev.includes(tenantId)) {
        return prev.filter(id => id !== tenantId)
      } else {
        return [...prev, tenantId]
      }
    })
  }
  
  const handleSelectAll = () => {
    const filteredTenantIds = filteredTenantsList.map(t => t.id)
    setSelectedTenants(filteredTenantIds)
  }
  
  const handleDeselectAll = () => {
    setSelectedTenants([])
  }
  
  const handleRegisterPayment = async () => {
    // Validation
    if (selectedTenants.length === 0) {
      setPaymentError(t('superAdmin.financials.paymentModal.noTenantsSelected'))
      return
    }
    
    if (!paymentMonth || !paymentAmount || !paymentMethod) {
      setPaymentError(t('superAdmin.financials.paymentModal.requiredFields'))
      return
    }
    
    setProcessingPayment(true)
    setPaymentError('')
    setPaymentSuccess('')
    
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        window.location.href = '/super-admin/login'
        return
      }

      const response = await fetch('/api/v1/super-admin/financials/register-payment', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          tenantIds: selectedTenants,
          month: paymentMonth,
          amount: parseFloat(paymentAmount),
          method: paymentMethod,
          notes: paymentNotes
        })
      })

      const data = await response.json()
      
      if (response.ok && data.success) {
        setPaymentSuccess(t('superAdmin.financials.paymentModal.paymentSuccess'))
        // Reset form
        setTimeout(() => {
          setShowPaymentModal(false)
          setSelectedTenants([])
          setPaymentAmount('')
          setPaymentNotes('')
          setPaymentError('')
          setPaymentSuccess('')
          // Refresh financial data
          fetchFinancialData()
        }, 2000)
      } else {
        setPaymentError(data.error || t('superAdmin.financials.paymentModal.paymentError'))
      }
    } catch (error) {
      console.error('Error registering payment:', error)
      setPaymentError(t('superAdmin.financials.paymentModal.paymentError'))
    } finally {
      setProcessingPayment(false)
    }
  }
  
  const filteredTenantsList = tenants.filter(tenant =>
    tenant?.businessName?.toLowerCase().includes(tenantSearchQuery.toLowerCase()) ||
    tenant?.slug?.toLowerCase().includes(tenantSearchQuery.toLowerCase())
  )

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'PAID': 'bg-green-100 text-green-800',
      'PENDING': 'bg-yellow-100 text-yellow-800', 
      'OVERDUE': 'bg-red-100 text-red-800',
      'CANCELLED': 'bg-gray-100 text-gray-800',
      'REFUNDED': 'bg-blue-100 text-blue-800'
    }
    return statusConfig[status as keyof typeof statusConfig] || 'bg-gray-100 text-gray-800'
  }

  const getMethodIcon = (method: string) => {
    switch (method) {
      case 'CREDIT_CARD': return <CreditCardIcon className="h-4 w-4" />
      case 'BANK_TRANSFER': return <BanknotesIcon className="h-4 w-4" />
      default: return <BanknotesIcon className="h-4 w-4" />
    }
  }

  const filteredPayments = payments.filter(payment => {
    const matchesSearch = payment.tenant.businessName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         payment.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === 'all' || payment.status === statusFilter
    const matchesMethod = methodFilter === 'all' || payment.method === methodFilter
    return matchesSearch && matchesStatus && matchesMethod
  })

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <ExclamationTriangleIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Financial Data</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={fetchFinancialData}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{t('superAdmin.financials.title')}</h1>
              <p className="text-gray-600 mt-2">{t('superAdmin.financials.description')}</p>
            </div>
            <div className="flex space-x-4">
              <button 
                onClick={() => setShowPaymentModal(true)}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
              >
                <BanknotesIcon className="h-5 w-5" />
                <span>{t('superAdmin.financials.registerPayment')}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Financial Statistics */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <BanknotesIcon className="h-8 w-8 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">{t('superAdmin.financials.totalRevenue')}</p>
                  <p className="text-2xl font-semibold text-gray-900">${stats.totalRevenue.toLocaleString()}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <CalendarIcon className="h-8 w-8 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">{t('superAdmin.financials.monthlyRevenue')}</p>
                  <p className="text-2xl font-semibold text-gray-900">${stats.monthlyRevenue.toLocaleString()}</p>
                  <div className="flex items-center mt-1">
                    {stats.revenueGrowth >= 0 ? (
                      <ArrowTrendingUpIcon className="h-4 w-4 text-green-500" />
                    ) : (
                      <ArrowTrendingDownIcon className="h-4 w-4 text-red-500" />
                    )}
                    <span className={`text-sm ml-1 ${stats.revenueGrowth >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {Math.abs(stats.revenueGrowth)}%
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ExclamationTriangleIcon className="h-8 w-8 text-red-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">{t('superAdmin.financials.overduePayments')}</p>
                  <p className="text-2xl font-semibold text-gray-900">{stats.overduePayments}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <CreditCardIcon className="h-8 w-8 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">{t('superAdmin.financials.pendingPayments')}</p>
                  <p className="text-2xl font-semibold text-gray-900">{stats.pendingPayments}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder={t('superAdmin.financials.searchPlaceholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">{t('superAdmin.financials.allStatuses')}</option>
                <option value="PAID">{t('superAdmin.financials.paid')}</option>
                <option value="PENDING">{t('superAdmin.financials.pending')}</option>
                <option value="OVERDUE">{t('superAdmin.financials.overdue')}</option>
                <option value="CANCELLED">{t('superAdmin.financials.cancelled')}</option>
                <option value="REFUNDED">{t('superAdmin.financials.refunded')}</option>
              </select>
            </div>

            <div>
              <select
                value={methodFilter}
                onChange={(e) => setMethodFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">{t('superAdmin.financials.allMethods')}</option>
                <option value="CREDIT_CARD">{t('superAdmin.financials.creditCard')}</option>
                <option value="BANK_TRANSFER">{t('superAdmin.financials.bankTransfer')}</option>
                <option value="CASH">{t('superAdmin.financials.cash')}</option>
                <option value="CHECK">{t('superAdmin.financials.check')}</option>
              </select>
            </div>

            <div className="flex items-center">
              <FunnelIcon className="h-5 w-5 text-gray-400 mr-2" />
              <span className="text-sm text-gray-600">
                {t('superAdmin.financials.paymentsCount', { count: filteredPayments.length, total: payments.length })}
              </span>
            </div>
          </div>
        </div>

        {/* Payment Records Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">{t('superAdmin.financials.paymentRecords')}</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('superAdmin.financials.tenant')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('superAdmin.financials.invoice')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('superAdmin.financials.amount')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('superAdmin.financials.method')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('superAdmin.financials.status')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('superAdmin.financials.dueDate')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('superAdmin.financials.actions')}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredPayments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {payment.tenant.businessName}
                        </div>
                        <div className="text-sm text-gray-500">
                          {payment.tenant.slug}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {payment.invoiceNumber}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      ${payment.amount.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-900">
                        {getMethodIcon(payment.method)}
                        <span className="ml-2">{payment.method.replace('_', ' ')}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(payment.status)}`}>
                        {payment.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(payment.dueDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <Link
                        href={`/super-admin/financials/${payment.id}`}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        {t('superAdmin.financials.viewDetails')}
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredPayments.length === 0 && (
            <div className="text-center py-12">
              <BanknotesIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No payment records found</h3>
              <p className="text-gray-500">
                {searchQuery || statusFilter !== 'all' || methodFilter !== 'all'
                  ? 'Try adjusting your filters'
                  : 'Payment records will appear here when tenants make payments'}
              </p>
            </div>
          )}
        </div>

        {/* Payment Registration Modal */}
        {showPaymentModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              {/* Modal Header */}
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    {t('superAdmin.financials.paymentModal.title')}
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">
                    {t('superAdmin.financials.paymentModal.description')}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowPaymentModal(false)
                    setPaymentError('')
                    setPaymentSuccess('')
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="px-6 py-4">
                {/* Info Banner */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                  <p className="text-sm text-blue-800">
                    {t('superAdmin.financials.paymentModal.multipleTenantsNote')}
                  </p>
                </div>

                {/* Error/Success Messages */}
                {paymentError && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                    <p className="text-sm text-red-800">{paymentError}</p>
                  </div>
                )}
                
                {paymentSuccess && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                    <p className="text-sm text-green-800">{paymentSuccess}</p>
                  </div>
                )}

                {/* Form Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Left Column - Payment Details */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      {t('superAdmin.financials.paymentModal.paymentMonth')}
                    </h3>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t('superAdmin.financials.paymentModal.paymentMonth')} *
                      </label>
                      <input
                        type="month"
                        value={paymentMonth}
                        onChange={(e) => setPaymentMonth(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t('superAdmin.financials.paymentModal.paymentAmount')} *
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={paymentAmount}
                          onChange={(e) => setPaymentAmount(e.target.value)}
                          className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="0.00"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t('superAdmin.financials.paymentModal.paymentMethod')} *
                      </label>
                      <select
                        value={paymentMethod}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      >
                        <option value="BANK_TRANSFER">{t('superAdmin.financials.bankTransfer')}</option>
                        <option value="CREDIT_CARD">{t('superAdmin.financials.creditCard')}</option>
                        <option value="CASH">{t('superAdmin.financials.cash')}</option>
                        <option value="CHECK">{t('superAdmin.financials.check')}</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t('superAdmin.financials.paymentModal.notes')}
                      </label>
                      <textarea
                        value={paymentNotes}
                        onChange={(e) => setPaymentNotes(e.target.value)}
                        rows={4}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Add any additional notes..."
                      />
                    </div>
                  </div>

                  {/* Right Column - Tenant Selection */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {t('superAdmin.financials.paymentModal.selectTenants')}
                      </h3>
                      <div className="flex space-x-2">
                        <button
                          onClick={handleSelectAll}
                          className="text-sm text-blue-600 hover:text-blue-800"
                        >
                          {t('superAdmin.financials.paymentModal.selectAll')}
                        </button>
                        <span className="text-gray-400">|</span>
                        <button
                          onClick={handleDeselectAll}
                          className="text-sm text-red-600 hover:text-red-800"
                        >
                          {t('superAdmin.financials.paymentModal.deselectAll')}
                        </button>
                      </div>
                    </div>

                    <div className="relative">
                      <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        placeholder={t('superAdmin.financials.paymentModal.searchTenants')}
                        value={tenantSearchQuery}
                        onChange={(e) => setTenantSearchQuery(e.target.value)}
                        className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    {/* Selected Count Badge */}
                    {selectedTenants.length > 0 && (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                        <p className="text-sm font-medium text-green-800">
                          {selectedTenants.length} {t('superAdmin.financials.paymentModal.selectedTenants')}
                        </p>
                      </div>
                    )}

                    {/* Tenant List */}
                    <div className="border border-gray-200 rounded-lg max-h-96 overflow-y-auto">
                      {filteredTenantsList.length === 0 ? (
                        <div className="text-center py-8">
                          <p className="text-gray-500">
                            {t('superAdmin.financials.paymentModal.noTenantsSelected')}
                          </p>
                        </div>
                      ) : (
                        <div className="divide-y divide-gray-200">
                          {filteredTenantsList.map((tenant) => (
                            <label
                              key={tenant.id}
                              className="flex items-center p-4 hover:bg-gray-50 cursor-pointer"
                            >
                              <input
                                type="checkbox"
                                checked={selectedTenants.includes(tenant.id)}
                                onChange={() => handleTenantSelection(tenant.id)}
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                              />
                              <div className="ml-3 flex-1">
                                <p className="text-sm font-medium text-gray-900">
                                  {tenant.businessName}
                                </p>
                                <p className="text-xs text-gray-500">
                                  /{tenant.slug} • {tenant.subscriptionPlan}
                                </p>
                              </div>
                              {selectedTenants.includes(tenant.id) && (
                                <CheckIcon className="h-5 w-5 text-green-600" />
                              )}
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex items-center justify-end space-x-4">
                <button
                  onClick={() => {
                    setShowPaymentModal(false)
                    setPaymentError('')
                    setPaymentSuccess('')
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100"
                  disabled={processingPayment}
                >
                  {t('common.cancel')}
                </button>
                <button
                  onClick={handleRegisterPayment}
                  disabled={processingPayment || selectedTenants.length === 0}
                  className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {processingPayment ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>{t('superAdmin.financials.paymentModal.processingPayment')}</span>
                    </>
                  ) : (
                    <>
                      <BanknotesIcon className="h-5 w-5" />
                      <span>{t('superAdmin.financials.registerPayment')}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}