'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  BanknotesIcon,
  CreditCardIcon,
  CalendarIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  ArrowLeftIcon,
  PencilIcon,
  TrashIcon
} from '@heroicons/react/24/outline'
import Link from 'next/link'

interface PaymentRecord {
  id: string
  tenantId: string
  amount: number
  method: string
  status: string
  description: string
  dueDate: string
  paidAt?: string
  invoiceNumber: string
  notes?: string
  createdAt: string
  updatedAt: string
  tenant: {
    id: string
    businessName: string
    slug: string
    ownerName: string
    email: string
    phone?: string
    address?: string
    subscriptionPlan: string
    subscriptionStatus: string
  }
  createdBy: {
    id: string
    name: string
    email: string
  }
}

export default function PaymentDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [payment, setPayment] = useState<PaymentRecord | null>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [error, setError] = useState('')
  const [editMode, setEditMode] = useState(false)
  const [editData, setEditData] = useState<any>({})

  useEffect(() => {
    if (params.id) {
      fetchPaymentDetails()
    }
  }, [params.id])

  const fetchPaymentDetails = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        router.push('/super-admin/login')
        return
      }

      const response = await fetch(`/api/v1/super-admin/financials/payments/${params.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setPayment(data.data)
          setEditData({
            amount: data.data.amount,
            method: data.data.method,
            status: data.data.status,
            description: data.data.description,
            dueDate: data.data.dueDate.split('T')[0],
            notes: data.data.notes || ''
          })
        } else {
          setError(data.error || 'Failed to fetch payment details')
        }
      } else {
        setError('Failed to fetch payment details')
      }
    } catch (error) {
      console.error('Error fetching payment details:', error)
      setError('Failed to load payment details')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdate = async () => {
    setUpdating(true)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/v1/super-admin/financials/payments/${params?.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(editData)
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setPayment(data.data)
          setEditMode(false)
          setError('')
        } else {
          setError(data.error || 'Failed to update payment')
        }
      } else {
        setError('Failed to update payment')
      }
    } catch (error) {
      console.error('Error updating payment:', error)
      setError('Failed to update payment')
    } finally {
      setUpdating(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this payment record? This action cannot be undone.')) {
      return
    }

    setUpdating(true)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/v1/super-admin/financials/payments/${params?.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (response.ok) {
        router.push('/super-admin/financials')
      } else {
        const data = await response.json()
        setError(data.error || 'Failed to delete payment')
      }
    } catch (error) {
      console.error('Error deleting payment:', error)
      setError('Failed to delete payment')
    } finally {
      setUpdating(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PAID':
        return <CheckCircleIcon className="h-8 w-8 text-green-600" />
      case 'PENDING':
        return <ClockIcon className="h-8 w-8 text-yellow-600" />
      case 'OVERDUE':
        return <ExclamationTriangleIcon className="h-8 w-8 text-red-600" />
      case 'CANCELLED':
        return <XCircleIcon className="h-8 w-8 text-gray-600" />
      default:
        return <ClockIcon className="h-8 w-8 text-gray-600" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PAID': return 'bg-green-100 text-green-800'
      case 'PENDING': return 'bg-yellow-100 text-yellow-800'
      case 'OVERDUE': return 'bg-red-100 text-red-800'
      case 'CANCELLED': return 'bg-gray-100 text-gray-800'
      case 'REFUNDED': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getMethodIcon = (method: string) => {
    switch (method) {
      case 'CREDIT_CARD': return <CreditCardIcon className="h-5 w-5" />
      case 'BANK_TRANSFER': return <BanknotesIcon className="h-5 w-5" />
      default: return <BanknotesIcon className="h-5 w-5" />
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error && !payment) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <ExclamationTriangleIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Payment</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <Link href="/super-admin/financials" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg">
            Back to Financials
          </Link>
        </div>
      </div>
    )
  }

  if (!payment) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Payment Not Found</h2>
          <Link href="/super-admin/financials" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg">
            Back to Financials
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
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link 
                href="/super-admin/financials"
                className="flex items-center text-gray-600 hover:text-gray-900"
              >
                <ArrowLeftIcon className="h-5 w-5 mr-2" />
                Back to Financials
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">Payment Details</h1>
            </div>
            <div className="flex space-x-3">
              {!editMode && (
                <>
                  <button
                    onClick={() => setEditMode(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
                  >
                    <PencilIcon className="h-4 w-4" />
                    <span>Edit</span>
                  </button>
                  {payment.status !== 'PAID' && (
                    <button
                      onClick={handleDelete}
                      disabled={updating}
                      className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 disabled:opacity-50"
                    >
                      <TrashIcon className="h-4 w-4" />
                      <span>Delete</span>
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex">
              <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <div className="mt-2 text-sm text-red-700">{error}</div>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Payment Information */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Payment Information</h2>
              </div>
              <div className="p-6">
                {editMode ? (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Amount
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={editData.amount}
                          onChange={(e) => setEditData({...editData, amount: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Payment Method
                        </label>
                        <select
                          value={editData.method}
                          onChange={(e) => setEditData({...editData, method: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="CREDIT_CARD">Credit Card</option>
                          <option value="BANK_TRANSFER">Bank Transfer</option>
                          <option value="CASH">Cash</option>
                          <option value="CHECK">Check</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Status
                        </label>
                        <select
                          value={editData.status}
                          onChange={(e) => setEditData({...editData, status: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="PENDING">Pending</option>
                          <option value="PAID">Paid</option>
                          <option value="OVERDUE">Overdue</option>
                          <option value="CANCELLED">Cancelled</option>
                          <option value="REFUNDED">Refunded</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Due Date
                        </label>
                        <input
                          type="date"
                          value={editData.dueDate}
                          onChange={(e) => setEditData({...editData, dueDate: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Description
                      </label>
                      <input
                        type="text"
                        value={editData.description}
                        onChange={(e) => setEditData({...editData, description: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Notes
                      </label>
                      <textarea
                        rows={3}
                        value={editData.notes}
                        onChange={(e) => setEditData({...editData, notes: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div className="flex justify-end space-x-3">
                      <button
                        onClick={() => setEditMode(false)}
                        className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleUpdate}
                        disabled={updating}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50"
                      >
                        {updating ? 'Updating...' : 'Update Payment'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Status and Amount */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        {getStatusIcon(payment.status)}
                        <div>
                          <h3 className="text-2xl font-bold text-gray-900">
                            ${payment.amount.toLocaleString()}
                          </h3>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(payment.status)}`}>
                            {payment.status}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-600">Invoice Number</p>
                        <p className="text-lg font-semibold text-gray-900">{payment.invoiceNumber}</p>
                      </div>
                    </div>

                    {/* Payment Details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="flex items-center space-x-3">
                        {getMethodIcon(payment.method)}
                        <div>
                          <p className="text-sm text-gray-600">Payment Method</p>
                          <p className="font-medium text-gray-900">{payment.method.replace('_', ' ')}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <CalendarIcon className="h-5 w-5 text-gray-400" />
                        <div>
                          <p className="text-sm text-gray-600">Due Date</p>
                          <p className="font-medium text-gray-900">
                            {new Date(payment.dueDate).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      {payment.paidAt && (
                        <div className="flex items-center space-x-3">
                          <CheckCircleIcon className="h-5 w-5 text-green-500" />
                          <div>
                            <p className="text-sm text-gray-600">Paid On</p>
                            <p className="font-medium text-gray-900">
                              {new Date(payment.paidAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    {payment.description && (
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Description</p>
                        <p className="text-gray-900">{payment.description}</p>
                      </div>
                    )}

                    {payment.notes && (
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Notes</p>
                        <p className="text-gray-900">{payment.notes}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Tenant Information */}
          <div>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Tenant Information</h3>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <p className="text-sm text-gray-600">Business Name</p>
                  <Link 
                    href={`/super-admin/tenants/${payment.tenant.id}`}
                    className="font-medium text-blue-600 hover:text-blue-900"
                  >
                    {payment.tenant.businessName}
                  </Link>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Owner</p>
                  <p className="font-medium text-gray-900">{payment.tenant.ownerName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Email</p>
                  <p className="font-medium text-gray-900">{payment.tenant.email}</p>
                </div>
                {payment.tenant.phone && (
                  <div>
                    <p className="text-sm text-gray-600">Phone</p>
                    <p className="font-medium text-gray-900">{payment.tenant.phone}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-gray-600">Subscription Plan</p>
                  <p className="font-medium text-gray-900">{payment.tenant.subscriptionPlan}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Subscription Status</p>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    payment.tenant.subscriptionStatus === 'ACTIVE' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {payment.tenant.subscriptionStatus}
                  </span>
                </div>
              </div>
            </div>

            {/* Audit Information */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 mt-6">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Audit Information</h3>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <p className="text-sm text-gray-600">Created By</p>
                  <p className="font-medium text-gray-900">{payment.createdBy.name}</p>
                  <p className="text-sm text-gray-500">{payment.createdBy.email}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Created At</p>
                  <p className="font-medium text-gray-900">
                    {new Date(payment.createdAt).toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Last Updated</p>
                  <p className="font-medium text-gray-900">
                    {new Date(payment.updatedAt).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}