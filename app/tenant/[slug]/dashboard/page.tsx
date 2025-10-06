'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import ImageUpload from '@/components/ImageUpload'
import LanguageSwitcher from '@/components/LanguageSwitcher'
import { useTranslation } from '@/contexts/LocalizationContext'
import {
  HomeIcon,
  RectangleStackIcon,
  TagIcon,
  ChartBarIcon,
  CogIcon,
  ArrowRightOnRectangleIcon,
  UserCircleIcon,
  PlusIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon
} from '@heroicons/react/24/outline'
import {
  HomeIcon as HomeSolidIcon,
  RectangleStackIcon as RectangleStackSolidIcon,
  TagIcon as TagSolidIcon,
  ChartBarIcon as ChartBarSolidIcon,
  CogIcon as CogSolidIcon
} from '@heroicons/react/24/solid'

interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  role: string
  tenantRole: string
}

interface Tenant {
  id: string
  slug: string
  businessName: string
  businessNameAr: string
  nameEn: string
  nameAr: string
  primaryColor: string
  secondaryColor?: string
  accentColor?: string
  logoUrl?: string
  logoImage?: string
  phone?: string
  email: string
  address?: string
}

interface TenantSettings {
  nameEn?: string
  nameAr?: string
  phone?: string
  email?: string
  address?: string
  logoUrl?: string
  logoImage?: string
  coverImage?: string
  primaryColor?: string
  secondaryColor?: string
  accentColor?: string
  coverImageUrl?: string
  showPrices?: boolean
  showCalories?: boolean
  showDescriptions?: boolean
  showImages?: boolean
  defaultLanguage?: string
  enableBilingualMenu?: boolean
  currency?: string
  currencyPosition?: string
  businessHours?: {
    [key: string]: {
      isOpen: boolean
      open: string
      close: string
    }
  }
}

interface QRSettings {
  size: number
  includeLogo: boolean
}

interface AnalyticsData {
  overview: {
    totalCategories: number
    activeCategories: number
    totalProducts: number
    activeProducts: number
    outOfStockProducts: number
    featuredProducts: number
    menuHealthScore: number
  }
  pricing: {
    averagePrice: number
    minPrice: number
    maxPrice: number
    currency: string
  }
  insights: {
    recommendations: string[]
    alerts: Array<{ type: string; message: string }>
  }
}

interface Category {
  id: string
  nameEn: string
  nameAr: string
  descriptionEn?: string
  descriptionAr?: string
  imageUrl?: string
  imageData?: string
  isActive: boolean
  sortOrder: number
  showInMenu: boolean
  createdAt: string
  updatedAt: string
  createdBy?: string
  _count?: {
    products: number
  }
}

interface CategoryFormData {
  nameEn: string
  nameAr: string
  descriptionEn?: string
  descriptionAr?: string
  imageUrl?: string
  imageData?: string
  isActive: boolean
  showInMenu: boolean
  sortOrder: number
}

interface Product {
  id: string
  nameEn: string
  nameAr: string
  descriptionEn?: string
  descriptionAr?: string
  imageUrl?: string
  imageData?: string
  imageUrls?: string[]
  basePrice: number
  discountPrice?: number
  discountStartDate?: string
  discountEndDate?: string
  price?: number  // Deprecated - keeping for backward compatibility
  compareAtPrice?: number  // Deprecated - keeping for backward compatibility
  isActive: boolean
  isAvailable: boolean
  isFeatured: boolean
  isOutOfStock: boolean
  sortOrder: number
  calories?: number
  categoryId: string
  category?: {
    id: string
    nameEn: string
    nameAr: string
  }
  createdAt: string
  updatedAt: string
}

export default function TenantDashboard() {
  const router = useRouter()
  const params = useParams()
  const slug = params.slug as string
  const { t, isRTL } = useTranslation()
  
  const [user, setUser] = useState<User | null>(null)
  const [tenant, setTenant] = useState<Tenant | null>(null)
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingAnalytics, setIsLoadingAnalytics] = useState(false)
  const [isLoadingCategories, setIsLoadingCategories] = useState(false)
  const [isLoadingProducts, setIsLoadingProducts] = useState(false)
  const [activeTab, setActiveTab] = useState('dashboard')
  const [showCategoryModal, setShowCategoryModal] = useState(false)
  // Note: Product modal functionality prepared for future implementation
  // const [showProductModal, setShowProductModal] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  // const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [categorySearchTerm, setCategorySearchTerm] = useState('')
  const [productSearchTerm, setProductSearchTerm] = useState('')
  const [selectedCategoryFilter] = useState('all')
  // setSelectedCategoryFilter available for future filtering features
  
  // Additional products state
  const [selectedCategoryId, setSelectedCategoryId] = useState('')
  const [productStatusFilter, setProductStatusFilter] = useState('')
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [isProductModalOpen, setIsProductModalOpen] = useState(false)

  // Settings state
  const [settingsTab, setSettingsTab] = useState('general')
  const [tenantSettings, setTenantSettings] = useState<TenantSettings>({})
  const [originalTenantSettings, setOriginalTenantSettings] = useState<TenantSettings>({})
  const [isSavingSettings, setIsSavingSettings] = useState(false)
  const [qrSettings, setQrSettings] = useState<QRSettings>({
    size: 300,
    includeLogo: true
  })
  const [qrCodeUrl, setQrCodeUrl] = useState('')
  const [isGeneratingQR, setIsGeneratingQR] = useState(false)

  // Constants
  const daysOfWeek = [
    t('days.monday'),
    t('days.tuesday'), 
    t('days.wednesday'),
    t('days.thursday'),
    t('days.friday'),
    t('days.saturday'),
    t('days.sunday')
  ]

  // Computed values
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.nameEn.toLowerCase().includes(productSearchTerm.toLowerCase()) ||
                         product.nameAr.toLowerCase().includes(productSearchTerm.toLowerCase())
    const matchesCategory = !selectedCategoryId || product.categoryId === selectedCategoryId
    const matchesStatus = !productStatusFilter || 
                         (productStatusFilter === 'active' && product.isActive) ||
                         (productStatusFilter === 'inactive' && !product.isActive) ||
                         (productStatusFilter === 'available' && !product.isOutOfStock) ||
                         (productStatusFilter === 'unavailable' && product.isOutOfStock)
    
    return matchesSearch && matchesCategory && matchesStatus
  })

  // Settings functions
  const updateTenantSetting = (key: string, value: any) => {
    setTenantSettings(prev => ({ ...prev, [key]: value }))
  }

  const updateBusinessHours = (day: string, field: string, value: any) => {
    setTenantSettings(prev => ({
      ...prev,
      businessHours: {
        ...prev.businessHours,
        [day]: {
          isOpen: prev.businessHours?.[day]?.isOpen || false,
          open: prev.businessHours?.[day]?.open || '09:00',
          close: prev.businessHours?.[day]?.close || '22:00',
          ...prev.businessHours?.[day],
          [field]: value
        }
      }
    }))
  }

  const saveSettings = async () => {
    if (!tenant) return
    
    setIsSavingSettings(true)
    try {
      const token = localStorage.getItem(`tenant_token_${slug}`)
      
      // Save tenant basic info
      const tenantResponse = await fetch(`/api/v1/tenant/settings`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          nameEn: tenant.nameEn,
          nameAr: tenant.nameAr,
          primaryColor: tenant.primaryColor,
          secondaryColor: tenant.secondaryColor,
          accentColor: tenant.accentColor,
          ...tenantSettings
        })
      })

      if (tenantResponse.ok) {
        const updatedTenant = await tenantResponse.json()
        setTenant(updatedTenant)
        localStorage.setItem(`tenant_data_${slug}`, JSON.stringify(updatedTenant))
        setOriginalTenantSettings({ ...tenantSettings })
      }
    } catch (error) {
      console.error('Error saving settings:', error)
    } finally {
      setIsSavingSettings(false)
    }
  }

  const resetSettings = () => {
    setTenantSettings({ ...originalTenantSettings })
    if (tenant) {
      // Reset tenant fields that might have changed
      const originalTenantData = localStorage.getItem(`tenant_data_${slug}`)
      if (originalTenantData) {
        const originalTenant = JSON.parse(originalTenantData)
        setTenant(originalTenant)
      }
    }
  }

  const generateQRCode = async () => {
    if (!tenant) return
    
    setIsGeneratingQR(true)
    try {
      const token = localStorage.getItem(`tenant_token_${slug}`)
      const response = await fetch(`/api/v1/tenant/qr-code`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json()
        // Create a QR code using the menuUrl
        const menuUrl = data.data.menuUrl
        const qrCodeDataUrl = await createQRCodeDataUrl(menuUrl)
        setQrCodeUrl(qrCodeDataUrl)
      }
    } catch (error) {
      console.error('Error generating QR code:', error)
    } finally {
      setIsGeneratingQR(false)
    }
  }

  const createQRCodeDataUrl = async (text: string): Promise<string> => {
    try {
      // Use the qrcode library to generate a proper QR code
      const QRCode = (await import('qrcode')).default
      
      const options = {
        width: qrSettings.size,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        },
        errorCorrectionLevel: 'M' as const
      }
      
      const qrCodeDataUrl = await QRCode.toDataURL(text, options)
      return qrCodeDataUrl
    } catch (error) {
      console.error('Error generating QR code:', error)
      return ''
    }
  }

  const downloadQRCode = () => {
    if (!qrCodeUrl) return
    
    const link = document.createElement('a')
    link.href = qrCodeUrl
    link.download = `${tenant?.businessName || 'menu'}-qr-code.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const printQRCode = () => {
    if (!qrCodeUrl) return
    
    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>QR Code - ${tenant?.businessName}</title>
            <style>
              body { margin: 0; padding: 20px; text-align: center; font-family: Arial, sans-serif; }
              img { max-width: 100%; height: auto; }
              h1 { margin-bottom: 20px; }
            </style>
          </head>
          <body>
            <h1>${tenant?.businessName} - Menu QR Code</h1>
            <img src="${qrCodeUrl}" alt="QR Code" />
            <p>Scan to view our menu</p>
          </body>
        </html>
      `)
      printWindow.document.close()
      printWindow.print()
    }
  }

  useEffect(() => {
    // Check for authentication token and user data
    const token = localStorage.getItem(`tenant_token_${slug}`)
    const userData = localStorage.getItem(`tenant_user_${slug}`)
    const tenantData = localStorage.getItem(`tenant_data_${slug}`)

    if (!token || !userData || !tenantData) {
      router.push(`/tenant/${slug}/login`)
      return
    }

    try {
      setUser(JSON.parse(userData))
      setTenant(JSON.parse(tenantData))
      setIsLoading(false)
    } catch (error) {
      console.error('Error parsing stored data:', error)
      router.push(`/tenant/${slug}/login`)
    }
  }, [slug, router])

  // Fetch data when tabs are accessed
  useEffect(() => {
    if (user && tenant && activeTab === 'analytics' && !analytics) {
      fetchAnalytics()
    }
  }, [user, tenant, activeTab, analytics])

  useEffect(() => {
    if (user && tenant && activeTab === 'categories') {
      fetchCategories()
    }
  }, [user, tenant, activeTab])

  useEffect(() => {
    if (user && tenant && activeTab === 'products') {
      fetchProducts()
    }
  }, [user, tenant, activeTab])

  // Initialize tenant settings when tenant is loaded
  useEffect(() => {
    if (tenant && Object.keys(tenantSettings).length === 0) {
      fetchTenantSettings()
    }
  }, [tenant, tenantSettings])

  const fetchTenantSettings = async () => {
    if (!tenant) return
    
    try {
      const token = localStorage.getItem(`tenant_token_${slug}`)
      if (!token) return

      const response = await fetch('/api/v1/tenant/settings', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success && data.data) {
          // Map the tenant data to settings format
          const settings: TenantSettings = {
            nameEn: data.data.businessName || '',
            nameAr: data.data.businessNameAr || '',
            logoUrl: data.data.logoUrl || data.data.logoImage || '',
            phone: data.data.phone || '',
            email: data.data.email || '',
            address: data.data.address || '',
            primaryColor: data.data.primaryColor || '#2563eb',
            secondaryColor: data.data.secondaryColor || '#1e40af',
            accentColor: data.data.accentColor || '#3b82f6',
            showPrices: true,
            showCalories: false,
            showDescriptions: true,
            showImages: true,
            defaultLanguage: data.data.defaultLanguage || 'en',
            enableBilingualMenu: true,
            currency: data.data.currency || 'EGP',
            currencyPosition: 'before',
            businessHours: {
              monday: { isOpen: true, open: '09:00', close: '22:00' },
              tuesday: { isOpen: true, open: '09:00', close: '22:00' },
              wednesday: { isOpen: true, open: '09:00', close: '22:00' },
              thursday: { isOpen: true, open: '09:00', close: '22:00' },
              friday: { isOpen: true, open: '09:00', close: '23:00' },
              saturday: { isOpen: true, open: '09:00', close: '23:00' },
              sunday: { isOpen: true, open: '10:00', close: '21:00' }
            }
          }
          setTenantSettings(settings)
          setOriginalTenantSettings(settings)
          
          // Also update the tenant state to reflect the most current data
          if (tenant) {
            const updatedTenant = {
              ...tenant,
              businessName: data.data.businessName || tenant.businessName,
              businessNameAr: data.data.businessNameAr || tenant.businessNameAr,
              phone: data.data.phone || tenant.phone,
              email: data.data.email || tenant.email,
              address: data.data.address || tenant.address,
              primaryColor: data.data.primaryColor || tenant.primaryColor,
              secondaryColor: data.data.secondaryColor || tenant.secondaryColor,
              accentColor: data.data.accentColor || tenant.accentColor,
              logoUrl: data.data.logoUrl || data.data.logoImage || tenant.logoUrl
            }
            setTenant(updatedTenant)
            // Update localStorage with fresh data
            localStorage.setItem(`tenant_data_${slug}`, JSON.stringify(updatedTenant))
          }
        }
      } else {
        // Fallback to default settings if fetch fails
        const defaultSettings: TenantSettings = {
          nameEn: tenant.businessName,
          nameAr: tenant.businessNameAr,
          logoUrl: tenant.logoUrl,
          phone: tenant.phone,
          email: tenant.email,
          address: tenant.address,
          primaryColor: tenant.primaryColor,
          secondaryColor: tenant.secondaryColor,
          accentColor: tenant.accentColor,
          showPrices: true,
          showCalories: false,
          showDescriptions: true,
          showImages: true,
          defaultLanguage: 'en',
          enableBilingualMenu: true,
          currency: 'USD',
          currencyPosition: 'before',
          businessHours: {
            monday: { isOpen: true, open: '09:00', close: '22:00' },
            tuesday: { isOpen: true, open: '09:00', close: '22:00' },
            wednesday: { isOpen: true, open: '09:00', close: '22:00' },
            thursday: { isOpen: true, open: '09:00', close: '22:00' },
            friday: { isOpen: true, open: '09:00', close: '23:00' },
            saturday: { isOpen: true, open: '09:00', close: '23:00' },
            sunday: { isOpen: true, open: '10:00', close: '21:00' }
          }
        }
        setTenantSettings(defaultSettings)
        setOriginalTenantSettings(defaultSettings)
      }
    } catch (error) {
      console.error('Error fetching tenant settings:', error)
      // Fallback to default settings
      const defaultSettings: TenantSettings = {
        nameEn: tenant.businessName,
        nameAr: tenant.businessNameAr,
        logoUrl: tenant.logoUrl,
        phone: tenant.phone,
        email: tenant.email,
        address: tenant.address,
        primaryColor: tenant.primaryColor,
        secondaryColor: tenant.secondaryColor,
        accentColor: tenant.accentColor,
        showPrices: true,
        showCalories: false,
        showDescriptions: true,
        showImages: true,
        defaultLanguage: 'en',
        enableBilingualMenu: true,
        currency: 'USD',
        currencyPosition: 'before',
        businessHours: {
          monday: { isOpen: true, open: '09:00', close: '22:00' },
          tuesday: { isOpen: true, open: '09:00', close: '22:00' },
          wednesday: { isOpen: true, open: '09:00', close: '22:00' },
          thursday: { isOpen: true, open: '09:00', close: '22:00' },
          friday: { isOpen: true, open: '09:00', close: '23:00' },
          saturday: { isOpen: true, open: '09:00', close: '23:00' },
          sunday: { isOpen: true, open: '10:00', close: '21:00' }
        }
      }
      setTenantSettings(defaultSettings)
      setOriginalTenantSettings(defaultSettings)
    }
  }

  const fetchAnalytics = async () => {
    if (!user || !tenant) return
    
    setIsLoadingAnalytics(true)
    try {
      const token = localStorage.getItem(`tenant_token_${slug}`)
      if (!token) return

      const response = await fetch('/api/v1/tenant/analytics', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setAnalytics(data.data)
        }
      }
    } catch (error) {
      console.error('Failed to fetch analytics:', error)
    }
    setIsLoadingAnalytics(false)
  }

  // Fetch analytics when component loads and when switching to dashboard/analytics tabs
  useEffect(() => {
    if (!isLoading && user && tenant && (activeTab === 'dashboard' || activeTab === 'analytics')) {
      fetchAnalytics()
    }
  }, [isLoading, user, tenant, activeTab])

  // Fetch categories and products when Dashboard tab is active (for product category display)
  useEffect(() => {
    if (!isLoading && user && tenant && activeTab === 'dashboard') {
      fetchCategories()  // Needed for product category lookup
      fetchProducts()    // Needed for dashboard display
    }
  }, [isLoading, user, tenant, activeTab])

  // Fetch categories when switching to categories tab
  useEffect(() => {
    if (!isLoading && user && tenant && activeTab === 'categories') {
      fetchCategories()
    }
  }, [isLoading, user, tenant, activeTab])

  // Fetch products when switching to products tab
  useEffect(() => {
    if (!isLoading && user && tenant && activeTab === 'products') {
      fetchProducts()
    }
  }, [isLoading, user, tenant, activeTab])

  // Format currency based on tenant settings
  const formatCurrency = (amount: number) => {
    const currency = tenantSettings.currency || 'USD'
    const currencySymbols: { [key: string]: string } = {
      'USD': '$',
      'EUR': '€', 
      'GBP': '£',
      'AED': 'د.إ',
      'SAR': 'ر.س',
      'EGP': 'ج.م',
      'JOD': 'د.أ',
      'KWD': 'د.ك',
      'QAR': 'ر.ق',
      'BHD': 'د.ب',
      'OMR': 'ر.ع'
    }
    
    const symbol = currencySymbols[currency] || currency
    const formattedAmount = amount.toFixed(2)
    
    if (tenantSettings.currencyPosition === 'after') {
      return `${formattedAmount} ${symbol}`
    } else {
      return `${symbol}${formattedAmount}`
    }
  }

  // Get currency-dependent labels
  const getCurrencyLabel = (baseLabel: string) => {
    const currency = tenantSettings.currency || 'EGP'
    const currencySymbols: { [key: string]: string } = {
      'USD': '$',
      'EUR': '€', 
      'GBP': '£',
      'AED': 'د.إ',
      'SAR': 'ر.س',
      'EGP': 'ج.م',
      'JOD': 'د.أ',
      'KWD': 'د.ك',
      'QAR': 'ر.ق',
      'BHD': 'د.ب',
      'OMR': 'ر.ع'
    }
    
    const symbol = currencySymbols[currency] || currency
    return `${baseLabel} (${symbol})`
  }

  const fetchCategories = async () => {
    if (!user || !tenant) return
    
    setIsLoadingCategories(true)
    try {
      const token = localStorage.getItem(`tenant_token_${slug}`)
      if (!token) return

      const searchParams = new URLSearchParams()
      if (categorySearchTerm) searchParams.append('search', categorySearchTerm)
      searchParams.append('limit', '50')

      const response = await fetch(`/api/v1/tenant/categories?${searchParams}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setCategories(data.data.categories || [])
        }
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error)
    }
    setIsLoadingCategories(false)
  }

  const fetchProducts = async () => {
    if (!user || !tenant) return
    
    setIsLoadingProducts(true)
    try {
      const token = localStorage.getItem(`tenant_token_${slug}`)
      if (!token) return

      const searchParams = new URLSearchParams()
      if (productSearchTerm) searchParams.append('search', productSearchTerm)
      if (selectedCategoryFilter !== 'all') searchParams.append('categoryId', selectedCategoryFilter)
      searchParams.append('limit', '50')

      const response = await fetch(`/api/v1/tenant/products?${searchParams}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setProducts(data.data.products || [])
        }
      }
    } catch (error) {
      console.error('Failed to fetch products:', error)
    }
    setIsLoadingProducts(false)
  }

  const saveCategory = async (categoryData: CategoryFormData) => {
    try {
      const token = localStorage.getItem(`tenant_token_${slug}`)
      if (!token) return false

      const url = editingCategory 
        ? `/api/v1/tenant/categories/${editingCategory.id}`
        : '/api/v1/tenant/categories'
      
      const method = editingCategory ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(categoryData)
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          await fetchCategories() // Refresh the list
          await fetchAnalytics() // Refresh analytics
          return true
        }
      }
      return false
    } catch (error) {
      console.error('Failed to save category:', error)
      return false
    }
  }

  const deleteCategory = async (categoryId: string) => {
    try {
      const token = localStorage.getItem(`tenant_token_${slug}`)
      if (!token) return false

      const response = await fetch(`/api/v1/tenant/categories/${categoryId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          await fetchCategories() // Refresh the list
          await fetchAnalytics() // Refresh analytics
          return true
        }
      }
      return false
    } catch (error) {
      console.error('Failed to delete category:', error)
      return false
    }
  }

  // Products functions
  const handleDeleteProduct = async (productId: string) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return

    try {
      const token = localStorage.getItem(`tenant_token_${slug}`)
      if (!token) return

      const response = await fetch(`/api/v1/tenant/products/${productId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          await fetchProducts() // Refresh the list
          await fetchAnalytics() // Refresh analytics
        }
      }
    } catch (error) {
      console.error('Failed to delete product:', error)
    }
  }

  const saveProduct = async (productData: ProductFormData): Promise<boolean> => {
    try {
      const token = localStorage.getItem(`tenant_token_${slug}`)
      if (!token) return false

      const url = selectedProduct 
        ? `/api/v1/tenant/products/${selectedProduct.id}`
        : '/api/v1/tenant/products'
      
      const method = selectedProduct ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(productData)
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          await fetchProducts() // Refresh the list
          await fetchAnalytics() // Refresh analytics
          return true
        }
      }
      return false
    } catch (error) {
      console.error('Failed to save product:', error)
      return false
    }
  }

  const handleLogout = () => {
    localStorage.removeItem(`tenant_token_${slug}`)
    localStorage.removeItem(`tenant_user_${slug}`)
    localStorage.removeItem(`tenant_data_${slug}`)
    router.push(`/tenant/${slug}/login`)
  }

  const navigation = [
    {
      id: 'dashboard',
      name: t('tenant.navigation.dashboard'),
      nameAr: t('tenant.navigation.dashboard'),
      icon: HomeIcon,
      iconSolid: HomeSolidIcon,
      href: '#dashboard'
    },
    {
      id: 'categories',
      name: t('tenant.navigation.categories'),
      nameAr: t('tenant.navigation.categories'),
      icon: RectangleStackIcon,
      iconSolid: RectangleStackSolidIcon,
      href: '#categories'
    },
    {
      id: 'products',
      name: t('tenant.navigation.products'),
      nameAr: t('tenant.navigation.products'),
      icon: TagIcon,
      iconSolid: TagSolidIcon,
      href: '#products'
    },
    {
      id: 'analytics',
      name: t('tenant.navigation.analytics'),
      nameAr: t('tenant.navigation.analytics'),
      icon: ChartBarIcon,
      iconSolid: ChartBarSolidIcon,
      href: '#analytics'
    },
    {
      id: 'settings',
      name: t('tenant.navigation.settings'),
      nameAr: t('tenant.navigation.settings'),
      icon: CogIcon,
      iconSolid: CogSolidIcon,
      href: '#settings'
    }
  ]

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!user || !tenant) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Header */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            {/* Logo and Business Name */}
            <div className="flex items-center">
              <div className="flex-shrink-0 flex items-center">
                {(tenant.logoImage || tenant.logoUrl) ? (
                  <img
                    src={tenant.logoImage || tenant.logoUrl}
                    alt={tenant.businessName || 'Restaurant Logo'}
                    className="h-10 w-auto"
                  />
                ) : (
                  <div 
                    className="h-10 w-10 rounded-lg flex items-center justify-center text-white font-bold text-lg"
                    style={{ backgroundColor: tenant.primaryColor }}
                  >
                    {tenant.businessName?.charAt(0)?.toUpperCase() || 'T'}
                  </div>
                )}
                <div className="ml-3">
                  <h1 className="text-lg font-semibold text-gray-900">
                    {tenant.businessName || 'Tenant'}
                  </h1>
                  {tenant.businessNameAr && (
                    <p className="text-sm text-gray-600 font-arabic">
                      {tenant.businessNameAr}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* User Menu */}
            <div className="flex items-center space-x-4">
              <LanguageSwitcher className="mr-4" variant="toggle" />
              <div className="flex items-center space-x-2">
                <UserCircleIcon className="h-8 w-8 text-gray-600" />
                <div className="text-sm">
                  <p className="font-medium text-gray-900">
                    {user.firstName} {user.lastName}
                  </p>
                  <p className="text-gray-600 capitalize">
                    {user.tenantRole.toLowerCase() === 'admin' ? t('common.admin') : user.tenantRole.toLowerCase()}
                  </p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition duration-150 ease-in-out"
              >
                <ArrowRightOnRectangleIcon className="h-4 w-4 mr-2" />
                {t('common.logout')}
              </button>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="border-t border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <nav className="-mb-px flex space-x-8" aria-label="Tabs">
              {navigation.map((item) => {
                const isActive = activeTab === item.id
                const Icon = isActive ? item.iconSolid : item.icon
                
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`
                      group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm
                      ${isActive 
                        ? 'border-blue-500 text-blue-600' 
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }
                    `}
                    style={isActive ? { borderColor: tenant.primaryColor, color: tenant.primaryColor } : {}}
                  >
                    <Icon className={`h-5 w-5 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                    <span>{item.name}</span>
                  </button>
                )
              })}
            </nav>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Dashboard Content */}
        {activeTab === 'dashboard' && (
          <div className="px-4 py-6 sm:px-0">
            <div className="border-4 border-dashed border-gray-200 rounded-lg p-8">
              <div className="text-center">
                <HomeSolidIcon 
                  className="mx-auto h-12 w-12 mb-4" 
                  style={{ color: tenant.primaryColor }}
                />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {t('tenant.dashboard.welcome', { restaurantName: tenant.businessName || 'Restaurant' })}
                </h3>
                <p className="text-gray-600 mb-6">
                  {t('tenant.dashboard.description')}
                </p>
                
                {/* Quick Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
                  <div className="bg-white p-6 rounded-lg shadow-sm border">
                    <div className="flex items-center">
                      <RectangleStackIcon 
                        className="h-8 w-8" 
                        style={{ color: tenant.primaryColor }}
                      />
                      <div className={`${isRTL ? 'mr-4' : 'ml-4'}`}>
                        <p className="text-sm font-medium text-gray-600">{t('tenant.dashboard.stats.categories')}</p>
                        <p className="text-2xl font-semibold text-gray-900">
                          {isLoadingAnalytics ? (
                            <span className="animate-pulse bg-gray-200 rounded w-8 h-8 block"></span>
                          ) : (
                            analytics?.overview?.totalCategories || 0
                          )}
                        </p>
                        {analytics?.overview?.activeCategories !== undefined && (
                          <p className="text-xs text-gray-500">
                            {analytics.overview.activeCategories} {t('common.active').toLowerCase()}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-white p-6 rounded-lg shadow-sm border">
                    <div className="flex items-center">
                      <TagIcon 
                        className="h-8 w-8" 
                        style={{ color: tenant.secondaryColor || '#6B7280' }}
                      />
                      <div className={`${isRTL ? 'mr-4' : 'ml-4'}`}>
                        <p className="text-sm font-medium text-gray-600">{t('tenant.dashboard.stats.products')}</p>
                        <p className="text-2xl font-semibold text-gray-900">
                          {isLoadingAnalytics ? (
                            <span className="animate-pulse bg-gray-200 rounded w-8 h-8 block"></span>
                          ) : (
                            analytics?.overview?.totalProducts || 0
                          )}
                        </p>
                        {analytics?.overview?.activeProducts !== undefined && (
                          <p className="text-xs text-gray-500">
                            {analytics.overview.activeProducts} {t('common.active').toLowerCase()}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-white p-6 rounded-lg shadow-sm border">
                    <div className="flex items-center">
                      <ChartBarIcon 
                        className="h-8 w-8" 
                        style={{ color: tenant.accentColor || '#3B82F6' }}
                      />
                      <div className={`${isRTL ? 'mr-4' : 'ml-4'}`}>
                        <p className="text-sm font-medium text-gray-600">{t('tenant.dashboard.stats.menuHealth')}</p>
                        <p className="text-2xl font-semibold text-gray-900">
                          {isLoadingAnalytics ? (
                            <span className="animate-pulse bg-gray-200 rounded w-8 h-8 block"></span>
                          ) : (
                            `${analytics?.overview?.menuHealthScore || 0}%`
                          )}
                        </p>
                        {analytics?.overview?.featuredProducts !== undefined && (
                          <p className="text-xs text-gray-500">
                            {analytics.overview.featuredProducts} {t('common.featured').toLowerCase()}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Insights and Alerts */}
                {analytics?.insights && (analytics.insights.recommendations.length > 0 || analytics.insights.alerts.length > 0) && (
                  <div className="mt-8">
                    <h4 className="text-lg font-medium text-gray-900 mb-4">{t('tenant.dashboard.insights.title')}</h4>
                    <div className="space-y-4">
                      {/* Alerts */}
                      {analytics.insights.alerts.map((alert, index) => (
                        <div
                          key={index}
                          className={`p-4 rounded-lg border-l-4 ${
                            alert.type === 'error' 
                              ? 'bg-red-50 border-red-400 text-red-800'
                              : alert.type === 'warning'
                              ? 'bg-yellow-50 border-yellow-400 text-yellow-800'
                              : 'bg-blue-50 border-blue-400 text-blue-800'
                          }`}
                        >
                          <p className="text-sm font-medium">{alert.message}</p>
                        </div>
                      ))}
                      
                      {/* Recommendations */}
                      {analytics.insights.recommendations.slice(0, 3).map((recommendation, index) => (
                        <div key={index} className="p-4 bg-green-50 rounded-lg border border-green-200">
                          <p className="text-sm text-green-800">💡 {recommendation}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Quick Actions */}
                <div className="mt-8">
                  <h4 className="text-lg font-medium text-gray-900 mb-4">{t('tenant.dashboard.quickActions.title')}</h4>
                  <div className="flex flex-wrap justify-center gap-4">
                    <button
                      onClick={() => setActiveTab('categories')}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white shadow-sm hover:opacity-90 transition duration-150 ease-in-out"
                      style={{ backgroundColor: tenant.primaryColor }}
                    >
                      <PlusIcon className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                      {t('tenant.dashboard.quickActions.addCategory')}
                    </button>
                    <button
                      onClick={() => setActiveTab('products')}
                      className="inline-flex items-center px-4 py-2 border text-sm font-medium rounded-md text-white shadow-sm hover:opacity-90 transition duration-150 ease-in-out"
                      style={{ 
                        backgroundColor: tenant.accentColor || '#3B82F6',
                        borderColor: tenant.accentColor || '#3B82F6' 
                      }}
                    >
                      <PlusIcon className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                      {t('tenant.dashboard.quickActions.addProduct')}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Categories Content */}
        {activeTab === 'categories' && (
          <div className="px-4 py-6 sm:px-0">
            <div className="mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{t('tenant.categories.title')}</h2>
                  <p className="text-gray-600">{t('tenant.categories.subtitle')}</p>
                </div>
                <button
                  onClick={() => {
                    setEditingCategory(null)
                    setShowCategoryModal(true)
                  }}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white shadow-sm hover:opacity-90 transition duration-150 ease-in-out"
                  style={{ backgroundColor: tenant.primaryColor }}
                >
                  <PlusIcon className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                  {t('tenant.categories.addCategory')}
                </button>
              </div>
            </div>

            {/* Search and Filters */}
            <div className="mb-6">
              <div className="flex items-center space-x-4">
                <div className="flex-1">
                  <input
                    type="text"
                    placeholder={t('tenant.categories.searchPlaceholder')}
                    value={categorySearchTerm}
                    onChange={(e) => setCategorySearchTerm(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:border-transparent"
                    style={{ 
                      '--tw-ring-color': tenant.primaryColor 
                    } as React.CSSProperties}
                  />
                </div>
                <button
                  onClick={fetchCategories}
                  className="px-4 py-2 border text-white rounded-md hover:opacity-90 transition-colors"
                  style={{ 
                    backgroundColor: tenant.secondaryColor || '#6B7280',
                    borderColor: tenant.secondaryColor || '#6B7280'
                  }}
                >
                  {t('common.search')}
                </button>
              </div>
            </div>

            {/* Categories List */}
            {isLoadingCategories ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading categories...</p>
              </div>
            ) : categories.length === 0 ? (
              <div className="text-center py-12">
                <RectangleStackIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-4 text-lg font-medium text-gray-900">No Categories</h3>
                <p className="mt-2 text-gray-600">Get started by creating your first category</p>
                <button
                  onClick={() => {
                    setEditingCategory(null)
                    setShowCategoryModal(true)
                  }}
                  className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white shadow-sm hover:opacity-90"
                  style={{ backgroundColor: tenant.primaryColor }}
                >
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Create First Category
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {categories.map((category) => (
                  <div key={category.id} className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow">
                    <div className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <h3 className="text-lg font-medium text-gray-900">{category.nameEn}</h3>
                            {!category.isActive && (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                {t('common.inactive')}
                              </span>
                            )}
                            {!category.showInMenu && (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                {t('common.hidden')}
                              </span>
                            )}
                          </div>
                          {category.nameAr && (
                            <p className="text-sm text-gray-600 mb-2 font-arabic">{category.nameAr}</p>
                          )}
                          {category.descriptionEn && (
                            <p className="text-sm text-gray-500 mb-3">{category.descriptionEn}</p>
                          )}
                          <div className="flex items-center text-sm text-gray-500">
                            <TagIcon className={`h-4 w-4 ${isRTL ? 'ml-1' : 'mr-1'}`} />
                            <span>{category._count?.products || 0} {t('tenant.categories.productCount')}</span>
                            <span className="mx-2">•</span>
                            <span>{t('tenant.categories.order')}: {category.sortOrder}</span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => {
                              setEditingCategory(category)
                              setShowCategoryModal(true)
                            }}
                            className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                            title="Edit Category"
                          >
                            <PencilIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => {
                              if (window.confirm(`Are you sure you want to delete "${category.nameEn}"?`)) {
                                deleteCategory(category.id)
                              }
                            }}
                            className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                            title="Delete Category"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Category Modal */}
            {showCategoryModal && (
              <CategoryModal
                category={editingCategory}
                onClose={() => {
                  setShowCategoryModal(false)
                  setEditingCategory(null)
                }}
                onSave={saveCategory}
                tenant={tenant}
              />
            )}
          </div>
        )}

        {/* Products Content */}
        {activeTab === 'products' && (
          <div className="px-4 py-6 sm:px-0">
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{t('tenant.products.title')}</h2>
                  <p className="text-gray-600">{t('tenant.products.subtitle')}</p>
                </div>
                <button
                  onClick={() => {
                    setSelectedProduct(null)
                    setIsProductModalOpen(true)
                  }}
                  className="px-4 py-2 rounded-md text-white shadow-sm hover:opacity-90"
                  style={{ backgroundColor: tenant.primaryColor }}
                >
                  {t('tenant.products.addProduct')}
                </button>
              </div>

              {/* Search and Filters */}
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <input
                    type="text"
                    placeholder={t('tenant.products.searchPlaceholder')}
                    value={productSearchTerm}
                    onChange={(e) => setProductSearchTerm(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <select
                  value={selectedCategoryId}
                  onChange={(e) => setSelectedCategoryId(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">{t('tenant.products.allCategories')}</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.nameEn}
                    </option>
                  ))}
                </select>
                <select
                  value={productStatusFilter}
                  onChange={(e) => setProductStatusFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">{t('tenant.products.allStatus')}</option>
                  <option value="active">{t('common.active')}</option>
                  <option value="inactive">{t('common.inactive')}</option>
                  <option value="available">{t('tenant.products.available')}</option>
                  <option value="unavailable">{t('tenant.products.unavailable')}</option>
                </select>
              </div>

              {/* Products List */}
              {isLoadingProducts ? (
                <div className="text-center py-12">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                  <p className="mt-2 text-gray-600">Loading products...</p>
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="text-center py-12">
                  <div className="max-w-md mx-auto">
                    <TagIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
                    <p className="text-gray-600 mb-4">
                      {productSearchTerm ? 'Try adjusting your search criteria.' : 'Get started by creating your first product.'}
                    </p>
                    <button
                      onClick={() => {
                        setSelectedProduct(null)
                        setIsProductModalOpen(true)
                      }}
                      className="px-4 py-2 rounded-md text-white"
                      style={{ backgroundColor: tenant.primaryColor }}
                    >
                      Add First Product
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {filteredProducts.map((product) => (
                    <div key={product.id} className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200">
                      {product.imageUrl && (
                        <div className="h-48 bg-gray-200">
                          <img
                            src={product.imageUrl}
                            alt={product.nameEn}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      <div className="p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-gray-900">{product.nameEn}</h3>
                            <p className="text-sm text-gray-600 font-arabic" dir="rtl">{product.nameAr}</p>
                          </div>
                          <div className="flex space-x-2">
                            {product.isActive ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                {t('common.active')}
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                {t('common.inactive')}
                              </span>
                            )}
                            {product.isAvailable ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                {t('tenant.products.available')}
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                {t('tenant.products.unavailable')}
                              </span>
                            )}
                          </div>
                        </div>
                        
                        <div className="mb-3">
                          <p className="text-sm text-gray-600 line-clamp-2">{product.descriptionEn}</p>
                          {product.descriptionAr && (
                            <p className="text-sm text-gray-600 font-arabic mt-1 line-clamp-2" dir="rtl">{product.descriptionAr}</p>
                          )}
                        </div>

                        <div className="mb-3">
                          <span className="text-lg font-bold" style={{ color: tenant.primaryColor }}>
                            {formatCurrency(product.basePrice || 0)}
                          </span>
                          {product.discountPrice && product.discountPrice < (product.basePrice || 0) && (
                            <span className="ml-2 text-sm text-gray-500 line-through">
                              {formatCurrency(product.basePrice)}
                            </span>
                          )}
                        </div>

                        <div className="mb-3">
                          <p className="text-xs text-gray-500">
                            {t('tenant.products.category')}: {categories.find(c => c.id === product.categoryId)?.nameEn || t('tenant.products.unknown')}
                          </p>
                          <p className="text-xs text-gray-500">
                            {t('tenant.products.sortOrderLabel')}: {product.sortOrder}
                          </p>
                          {product.calories && (
                            <p className="text-xs text-gray-500">
                              {t('tenant.products.calories')}: {product.calories}
                            </p>
                          )}
                        </div>

                        <div className="flex justify-between items-center pt-3 border-t border-gray-200">
                          <button
                            onClick={() => {
                              setSelectedProduct(product)
                              setIsProductModalOpen(true)
                            }}
                            className="text-sm font-medium hover:underline"
                            style={{ color: tenant.primaryColor }}
                          >
                            {t('common.edit')}
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(product.id)}
                            className="text-sm text-red-600 hover:text-red-900 font-medium"
                          >
                            {t('common.delete')}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Product Modal */}
              {isProductModalOpen && (
                <ProductModal
                  product={selectedProduct}
                  onClose={() => {
                    setIsProductModalOpen(false)
                    setSelectedProduct(null)
                  }}
                  onSave={saveProduct}
                  tenant={tenant}
                  categories={categories}
                />
              )}
            </div>
          </div>
        )}

        {/* Analytics Content */}
        {activeTab === 'analytics' && (
          <div className="px-4 py-6 sm:px-0">
            <div className="mb-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">{t('tenant.analytics.title')}</h2>
                <button
                  onClick={fetchAnalytics}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  <svg className={`w-4 h-4 ${isRTL ? 'ml-2' : 'mr-2'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  {t('tenant.analytics.refreshData')}
                </button>
              </div>
            </div>

            {isLoadingAnalytics ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">{t('common.loading')}</p>
              </div>
            ) : analytics ? (
              <div className="space-y-8">
                {/* Overview Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="bg-white p-6 rounded-lg shadow-sm border">
                    <div className="flex items-center">
                      <RectangleStackIcon className="h-8 w-8 text-blue-600" />
                      <div className={`${isRTL ? 'mr-4' : 'ml-4'}`}>
                        <p className="text-sm font-medium text-gray-600">{t('tenant.analytics.overview.totalCategories')}</p>
                        <p className="text-2xl font-semibold text-gray-900">{analytics.overview.totalCategories}</p>
                        <p className="text-xs text-green-600">{analytics.overview.activeCategories} {t('tenant.analytics.overview.active')}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-lg shadow-sm border">
                    <div className="flex items-center">
                      <TagIcon className="h-8 w-8 text-green-600" />
                      <div className={`${isRTL ? 'mr-4' : 'ml-4'}`}>
                        <p className="text-sm font-medium text-gray-600">{t('tenant.analytics.overview.totalProducts')}</p>
                        <p className="text-2xl font-semibold text-gray-900">{analytics.overview.totalProducts}</p>
                        <p className="text-xs text-green-600">{analytics.overview.activeProducts} {t('tenant.analytics.overview.active')}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-lg shadow-sm border">
                    <div className="flex items-center">
                      <EyeIcon className="h-8 w-8 text-purple-600" />
                      <div className={`${isRTL ? 'mr-4' : 'ml-4'}`}>
                        <p className="text-sm font-medium text-gray-600">{t('tenant.analytics.overview.featuredItems')}</p>
                        <p className="text-2xl font-semibold text-gray-900">{analytics.overview.featuredProducts}</p>
                        <p className="text-xs text-gray-500">{t('tenant.analytics.overview.highlightedForCustomers')}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-lg shadow-sm border">
                    <div className="flex items-center">
                      <ChartBarIcon className="h-8 w-8 text-red-600" />
                      <div className={`${isRTL ? 'mr-4' : 'ml-4'}`}>
                        <p className="text-sm font-medium text-gray-600">{t('tenant.analytics.overview.menuHealthScore')}</p>
                        <p className="text-2xl font-semibold text-gray-900">{analytics.overview.menuHealthScore}%</p>
                        <p className={`text-xs ${
                          analytics.overview.menuHealthScore >= 80 ? 'text-green-600' :
                          analytics.overview.menuHealthScore >= 60 ? 'text-yellow-600' : 'text-red-600'
                        }`}>
                          {analytics.overview.menuHealthScore >= 80 ? t('tenant.analytics.overview.excellent') :
                           analytics.overview.menuHealthScore >= 60 ? t('tenant.analytics.overview.good') : t('tenant.analytics.overview.needsImprovement')}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Pricing Analytics */}
                <div className="bg-white p-6 rounded-lg shadow-sm border">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">{t('tenant.analytics.pricing.title')}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="text-center">
                      <p className="text-sm font-medium text-gray-600">{t('tenant.analytics.pricing.averagePrice')}</p>
                      <p className="text-2xl font-semibold text-gray-900">
                        {analytics.pricing.averagePrice.toFixed(2)} {analytics.pricing.currency}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium text-gray-600">{t('tenant.analytics.pricing.lowestPrice')}</p>
                      <p className="text-2xl font-semibold text-green-600">
                        {analytics.pricing.minPrice.toFixed(2)} {analytics.pricing.currency}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium text-gray-600">{t('tenant.analytics.pricing.highestPrice')}</p>
                      <p className="text-2xl font-semibold text-blue-600">
                        {analytics.pricing.maxPrice.toFixed(2)} {analytics.pricing.currency}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Inventory Status */}
                <div className="bg-white p-6 rounded-lg shadow-sm border">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">{t('tenant.analytics.inventory.title')}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <div className="flex justify-between text-sm font-medium text-gray-600 mb-2">
                        <span>{t('tenant.analytics.inventory.availableItems')}</span>
                        <span>{analytics.overview.totalProducts - analytics.overview.outOfStockProducts} {t('tenant.analytics.inventory.of')} {analytics.overview.totalProducts}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-green-600 h-2 rounded-full" 
                          style={{ 
                            width: `${analytics.overview.totalProducts > 0 ? 
                              ((analytics.overview.totalProducts - analytics.overview.outOfStockProducts) / analytics.overview.totalProducts) * 100 : 0
                            }%` 
                          }}
                        ></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm font-medium text-gray-600 mb-2">
                        <span>{t('tenant.analytics.inventory.outOfStock')}</span>
                        <span>{analytics.overview.outOfStockProducts} {t('tenant.analytics.inventory.items')}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-red-600 h-2 rounded-full" 
                          style={{ 
                            width: `${analytics.overview.totalProducts > 0 ? 
                              (analytics.overview.outOfStockProducts / analytics.overview.totalProducts) * 100 : 0
                            }%` 
                          }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Alerts and Recommendations */}
                {(analytics.insights.alerts.length > 0 || analytics.insights.recommendations.length > 0) && (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Alerts */}
                    {analytics.insights.alerts.length > 0 && (
                      <div className="bg-white p-6 rounded-lg shadow-sm border">
                        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                          <svg className={`w-5 h-5 text-red-600 ${isRTL ? 'ml-2' : 'mr-2'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z" />
                          </svg>
                          {t('tenant.analytics.alerts.title')}
                        </h3>
                        <div className="space-y-3">
                          {analytics.insights.alerts.map((alert, index) => (
                            <div
                              key={index}
                              className={`p-3 rounded-lg border-l-4 ${
                                alert.type === 'error' 
                                  ? 'bg-red-50 border-red-400 text-red-800'
                                  : alert.type === 'warning'
                                  ? 'bg-yellow-50 border-yellow-400 text-yellow-800'
                                  : 'bg-blue-50 border-blue-400 text-blue-800'
                              }`}
                            >
                              <p className="text-sm font-medium">{alert.message}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Recommendations */}
                    {analytics.insights.recommendations.length > 0 && (
                      <div className="bg-white p-6 rounded-lg shadow-sm border">
                        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                          <svg className={`w-5 h-5 text-green-600 ${isRTL ? 'ml-2' : 'mr-2'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                          </svg>
                          {t('tenant.analytics.recommendations.title')}
                        </h3>
                        <div className="space-y-3">
                          {analytics.insights.recommendations.map((recommendation, index) => (
                            <div key={index} className="p-3 bg-green-50 rounded-lg border border-green-200">
                              <p className="text-sm text-green-800">💡 {recommendation}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12">
                <ChartBarSolidIcon 
                  className="mx-auto h-12 w-12 mb-4 text-gray-400" 
                />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Analytics Data Available</h3>
                <p className="text-gray-600 mb-4">Start by adding categories and products to see analytics.</p>
                <button
                  onClick={fetchAnalytics}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white shadow-sm hover:opacity-90"
                  style={{ backgroundColor: tenant.primaryColor }}
                >
                  Retry Loading
                </button>
              </div>
            )}
          </div>
        )}

        {/* Settings Content */}
        {activeTab === 'settings' && (
          <div className="px-4 py-6 sm:px-0">
            <div className="space-y-8">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{t('tenant.settings.title')}</h2>
                <p className="text-gray-600">{t('tenant.settings.subtitle')}</p>
              </div>

              {/* Settings Tabs */}
              <div className="bg-white shadow-sm rounded-lg">
                <div className="border-b border-gray-200">
                  <nav className={`flex space-x-8 px-6 ${isRTL ? 'space-x-reverse' : ''}`}>
                    {[
                      { id: 'general', name: t('tenant.settings.tabs.general'), icon: '🏪' },
                      { id: 'branding', name: t('tenant.settings.tabs.branding'), icon: '🎨' },
                      { id: 'menu', name: t('tenant.settings.tabs.menu'), icon: '📋' },
                      { id: 'qr', name: t('tenant.settings.tabs.qr'), icon: '📱' }
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setSettingsTab(tab.id)}
                        className={`py-4 px-1 border-b-2 font-medium text-sm ${
                          settingsTab === tab.id
                            ? 'border-blue-500 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                      >
                        <span className={`${isRTL ? 'ml-2' : 'mr-2'}`}>{tab.icon}</span>
                        {tab.name}
                      </button>
                    ))}
                  </nav>
                </div>

                <div className="p-6">
                  {/* General Settings */}
                  {settingsTab === 'general' && (
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-lg font-medium text-gray-900 mb-4">{t('tenant.settings.general.restaurantInformation')}</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              {t('tenant.settings.general.restaurantNameEn')}
                            </label>
                            <input
                              type="text"
                              value={tenantSettings.nameEn || ''}
                              onChange={(e) => updateTenantSetting('nameEn', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              {t('tenant.settings.general.restaurantNameAr')}
                            </label>
                            <input
                              type="text"
                              value={tenantSettings.nameAr || ''}
                              onChange={(e) => updateTenantSetting('nameAr', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-arabic"
                              dir="rtl"
                            />
                          </div>
                        </div>
                      </div>

                      <div>
                        <h3 className="text-lg font-medium text-gray-900 mb-4">{t('tenant.settings.general.menuUrl')}</h3>
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                {t('tenant.settings.general.publicMenuUrl')}
                              </label>
                              <div className={`flex items-center ${isRTL ? 'space-x-reverse' : ''} space-x-2`}>
                                <input
                                  type="text"
                                  value={`https://themenugenie.com/menu/${slug}`}
                                  readOnly
                                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-600"
                                />
                                <a
                                  href={`https://themenugenie.com/menu/${slug}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors whitespace-nowrap"
                                >
                                  {t('common.view', { default: 'View' })}
                                </a>
                                <button
                                  onClick={() => {
                                    const url = `https://themenugenie.com/menu/${slug}`;
                                    navigator.clipboard.writeText(url);
                                    // Show a quick feedback (you could add a toast notification here)
                                    const button = event?.target as HTMLButtonElement;
                                    const originalText = button.textContent;
                                    button.textContent = t('tenant.settings.general.copied');
                                    setTimeout(() => {
                                      button.textContent = originalText;
                                    }, 2000);
                                  }}
                                  className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
                                >
                                  {t('tenant.settings.general.copy')}
                                </button>
                              </div>
                            </div>
                          </div>
                          <p className="text-sm text-gray-500 mt-2">
                            {t('tenant.settings.general.shareUrlDescription')}
                          </p>
                        </div>
                      </div>

                      <div>
                        <h3 className="text-lg font-medium text-gray-900 mb-4">{t('tenant.settings.general.contactInformation')}</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              {t('tenant.settings.general.phoneNumber')}
                            </label>
                            <input
                              type="tel"
                              value={tenantSettings.phone || ''}
                              onChange={(e) => updateTenantSetting('phone', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              {t('tenant.settings.general.emailAddress')}
                            </label>
                            <input
                              type="email"
                              value={tenantSettings.email || ''}
                              onChange={(e) => updateTenantSetting('email', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          {t('tenant.settings.general.address')}
                        </label>
                        <textarea
                          value={tenantSettings.address || ''}
                          onChange={(e) => updateTenantSetting('address', e.target.value)}
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          {t('tenant.settings.general.businessHours')}
                        </label>
                        <div className="space-y-3">
                          {daysOfWeek.map((day) => (
                            <div key={day} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                              <span className="font-medium text-gray-900 w-20">{day}</span>
                              <div className={`flex items-center ${isRTL ? 'space-x-reverse' : ''} space-x-3`}>
                                <label className="flex items-center">
                                  <input
                                    type="checkbox"
                                    checked={tenantSettings.businessHours?.[day.toLowerCase()]?.isOpen || false}
                                    onChange={(e) => updateBusinessHours(day.toLowerCase(), 'isOpen', e.target.checked)}
                                    className="rounded border-gray-300"
                                  />
                                  <span className={`${isRTL ? 'mr-2' : 'ml-2'} text-sm text-gray-700`}>{t('tenant.settings.general.open')}</span>
                                </label>
                                {tenantSettings.businessHours?.[day.toLowerCase()]?.isOpen && (
                                  <>
                                    <input
                                      type="time"
                                      value={tenantSettings.businessHours[day.toLowerCase()].open || '09:00'}
                                      onChange={(e) => updateBusinessHours(day.toLowerCase(), 'open', e.target.value)}
                                      className="px-2 py-1 border border-gray-300 rounded text-sm"
                                    />
                                    <span className="text-gray-500">{t('tenant.settings.general.to')}</span>
                                    <input
                                      type="time"
                                      value={tenantSettings.businessHours[day.toLowerCase()].close || '22:00'}
                                      onChange={(e) => updateBusinessHours(day.toLowerCase(), 'close', e.target.value)}
                                      className="px-2 py-1 border border-gray-300 rounded text-sm"
                                    />
                                  </>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Branding Settings */}
                  {settingsTab === 'branding' && (
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Brand Colors</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Primary Color
                            </label>
                            <div className="flex items-center space-x-3">
                              <input
                                type="color"
                                value={tenantSettings.primaryColor || '#2563eb'}
                                onChange={(e) => updateTenantSetting('primaryColor', e.target.value)}
                                className="h-10 w-20 border border-gray-300 rounded-md"
                              />
                              <input
                                type="text"
                                value={tenantSettings.primaryColor || '#2563eb'}
                                onChange={(e) => updateTenantSetting('primaryColor', e.target.value)}
                                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Secondary Color
                            </label>
                            <div className="flex items-center space-x-3">
                              <input
                                type="color"
                                value={tenantSettings.secondaryColor || '#6B7280'}
                                onChange={(e) => updateTenantSetting('secondaryColor', e.target.value)}
                                className="h-10 w-20 border border-gray-300 rounded-md"
                              />
                              <input
                                type="text"
                                value={tenantSettings.secondaryColor || '#6B7280'}
                                onChange={(e) => updateTenantSetting('secondaryColor', e.target.value)}
                                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Accent Color
                            </label>
                            <div className="flex items-center space-x-3">
                              <input
                                type="color"
                                value={tenantSettings.accentColor || '#3B82F6'}
                                onChange={(e) => updateTenantSetting('accentColor', e.target.value)}
                                className="h-10 w-20 border border-gray-300 rounded-md"
                              />
                              <input
                                type="text"
                                value={tenantSettings.accentColor || '#3B82F6'}
                                onChange={(e) => updateTenantSetting('accentColor', e.target.value)}
                                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Logo & Images</h3>
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Logo
                            </label>
                            <ImageUpload
                              onImageUpload={(base64Image) => updateTenantSetting('logoImage', base64Image)}
                              currentImage={tenantSettings.logoImage || tenantSettings.logoUrl || ''}
                              placeholder="Upload restaurant logo"
                              className="w-full"
                              maxSizeMB={3}
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Cover Image
                            </label>
                            <ImageUpload
                              onImageUpload={(base64Image) => updateTenantSetting('coverImage', base64Image)}
                              currentImage={tenantSettings.coverImage || tenantSettings.coverImageUrl || ''}
                              placeholder="Upload cover image"
                              className="w-full"
                              maxSizeMB={3}
                            />
                          </div>
                        </div>
                      </div>

                      <div>
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Preview</h3>
                        <div className="p-4 border rounded-lg" style={{ backgroundColor: `${tenant.primaryColor}10` }}>
                          <div className="flex items-center space-x-3 mb-3">
                            {tenantSettings.logoUrl && (
                              <img
                                src={tenantSettings.logoUrl}
                                alt="Logo Preview"
                                className="h-8 w-8 rounded"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none'
                                }}
                              />
                            )}
                            <div>
                              <h4 className="font-semibold" style={{ color: tenant.primaryColor }}>
                                {tenant.nameEn}
                              </h4>
                              <p className="text-sm text-gray-600 font-arabic" dir="rtl">
                                {tenant.nameAr}
                              </p>
                            </div>
                          </div>
                          <button
                            className="px-4 py-2 rounded-md text-white text-sm"
                            style={{ backgroundColor: tenant.primaryColor }}
                          >
                            Sample Button
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Menu Settings */}
                  {settingsTab === 'menu' && (
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Menu Display Options</h3>
                        <div className="space-y-4">
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              checked={tenantSettings.showPrices !== false}
                              onChange={(e) => updateTenantSetting('showPrices', e.target.checked)}
                              className="rounded border-gray-300"
                            />
                            <span className="ml-3 text-gray-700">Show prices on menu</span>
                          </label>
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              checked={tenantSettings.showCalories || false}
                              onChange={(e) => updateTenantSetting('showCalories', e.target.checked)}
                              className="rounded border-gray-300"
                            />
                            <span className="ml-3 text-gray-700">Show calorie information</span>
                          </label>
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              checked={tenantSettings.showDescriptions !== false}
                              onChange={(e) => updateTenantSetting('showDescriptions', e.target.checked)}
                              className="rounded border-gray-300"
                            />
                            <span className="ml-3 text-gray-700">Show product descriptions</span>
                          </label>
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              checked={tenantSettings.showImages !== false}
                              onChange={(e) => updateTenantSetting('showImages', e.target.checked)}
                              className="rounded border-gray-300"
                            />
                            <span className="ml-3 text-gray-700">Show product images</span>
                          </label>
                        </div>
                      </div>

                      <div>
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Language Settings</h3>
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Default Language
                            </label>
                            <select
                              value={tenantSettings.defaultLanguage || 'en'}
                              onChange={(e) => updateTenantSetting('defaultLanguage', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                              <option value="en">English</option>
                              <option value="ar">Arabic</option>
                            </select>
                          </div>
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              checked={tenantSettings.enableBilingualMenu !== false}
                              onChange={(e) => updateTenantSetting('enableBilingualMenu', e.target.checked)}
                              className="rounded border-gray-300"
                            />
                            <span className="ml-3 text-gray-700">Enable bilingual menu (English & Arabic)</span>
                          </label>
                        </div>
                      </div>

                      <div>
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Currency Settings</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Currency
                            </label>
                            <select
                              value={tenantSettings.currency || 'EGP'}
                              onChange={(e) => updateTenantSetting('currency', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                              <option value="EGP">Egyptian Pound (EGP)</option>
                              <option value="USD">US Dollar ($)</option>
                              <option value="EUR">Euro (€)</option>
                              <option value="GBP">British Pound (£)</option>
                              <option value="AED">UAE Dirham (د.إ)</option>
                              <option value="SAR">Saudi Riyal (ر.س)</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Currency Symbol Position
                            </label>
                            <select
                              value={tenantSettings.currencyPosition || 'before'}
                              onChange={(e) => updateTenantSetting('currencyPosition', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                              <option value="before">Before amount ($10.00)</option>
                              <option value="after">After amount (10.00$)</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* QR Code Settings */}
                  {settingsTab === 'qr' && (
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-lg font-medium text-gray-900 mb-4">QR Code Management</h3>
                        <div className="bg-gray-50 p-4 rounded-lg mb-6">
                          <p className="text-sm text-gray-600 mb-2">
                            Your menu URL: <a 
                              href={`https://themenugenie.com/menu/${slug}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-mono bg-white px-2 py-1 rounded hover:bg-blue-50 hover:text-blue-600 transition-colors inline-flex items-center gap-1"
                            >
                              {`https://themenugenie.com/menu/${slug}`}
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                              </svg>
                            </a>
                          </p>
                          <p className="text-sm text-gray-500">
                            Customers can scan your QR code to access this menu directly.
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <div>
                          <h4 className="text-lg font-medium text-gray-900 mb-4">Generate QR Code</h4>
                          <div className="space-y-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                QR Code Size
                              </label>
                              <select
                                value={qrSettings.size}
                                onChange={(e) => setQrSettings({...qrSettings, size: parseInt(e.target.value)})}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              >
                                <option value={200}>Small (200x200)</option>
                                <option value={300}>Medium (300x300)</option>
                                <option value={400}>Large (400x400)</option>
                                <option value={500}>Extra Large (500x500)</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Include Logo
                              </label>
                              <label className="flex items-center">
                                <input
                                  type="checkbox"
                                  checked={qrSettings.includeLogo}
                                  onChange={(e) => setQrSettings({...qrSettings, includeLogo: e.target.checked})}
                                  className="rounded border-gray-300"
                                />
                                <span className="ml-3 text-gray-700">Include restaurant logo in QR code</span>
                              </label>
                            </div>
                            <button
                              onClick={generateQRCode}
                              disabled={isGeneratingQR}
                              className="w-full px-4 py-2 rounded-md text-white shadow-sm hover:opacity-90 disabled:opacity-50"
                              style={{ backgroundColor: tenant.primaryColor }}
                            >
                              {isGeneratingQR ? 'Generating...' : 'Generate QR Code'}
                            </button>
                          </div>
                        </div>

                        <div>
                          <h4 className="text-lg font-medium text-gray-900 mb-4">QR Code Preview</h4>
                          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                            {qrCodeUrl ? (
                              <div className="space-y-4">
                                <img
                                  src={qrCodeUrl}
                                  alt="QR Code"
                                  className="mx-auto rounded-lg"
                                  style={{ width: Math.min(qrSettings.size, 300) }}
                                />
                                <div className="space-y-2">
                                  <button
                                    onClick={downloadQRCode}
                                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                                  >
                                    Download PNG
                                  </button>
                                  <button
                                    onClick={() => printQRCode()}
                                    className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                                  >
                                    Print QR Code
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div>
                                <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 48 48">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 14v20c0 4.418 3.582 8 8 8h16c4.418 0 8-3.582 8-8V14m-4 6l-12-12-12 12" />
                                </svg>
                                <p className="text-gray-500">QR code will appear here</p>
                                <p className="text-sm text-gray-400 mt-2">Click "Generate QR Code" to create</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      <div>
                        <h4 className="text-lg font-medium text-gray-900 mb-4">QR Code Instructions</h4>
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                          <div className="space-y-2 text-sm text-blue-800">
                            <p>• Print the QR code and place it on tables, counters, or storefront</p>
                            <p>• Customers scan with their phone camera to view your menu instantly</p>
                            <p>• No app download required - works with all modern smartphones</p>
                            <p>• Menu updates automatically - no need to reprint QR codes</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className={`flex justify-end ${isRTL ? 'space-x-reverse' : ''} space-x-3 pt-6 border-t border-gray-200`}>
                  <button
                    onClick={resetSettings}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    {t('tenant.settings.actions.resetChanges')}
                  </button>
                  <button
                    onClick={saveSettings}
                    disabled={isSavingSettings}
                    className="px-6 py-2 rounded-md text-white shadow-sm hover:opacity-90 disabled:opacity-50"
                    style={{ backgroundColor: tenant.primaryColor }}
                  >
                    {isSavingSettings ? t('tenant.settings.actions.saving') : t('tenant.settings.actions.saveSettings')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

// CategoryModal Component
interface CategoryModalProps {
  category: Category | null
  onClose: () => void
  onSave: (data: CategoryFormData) => Promise<boolean>
  tenant: Tenant
}

function CategoryModal({ category, onClose, onSave, tenant }: CategoryModalProps) {
  const [formData, setFormData] = useState<CategoryFormData>({
    nameEn: category?.nameEn || '',
    nameAr: category?.nameAr || '',
    descriptionEn: category?.descriptionEn || '',
    descriptionAr: category?.descriptionAr || '',
    imageUrl: category?.imageUrl || '',
    imageData: category?.imageData || '',
    isActive: category?.isActive ?? true,
    showInMenu: category?.showInMenu ?? true,
    sortOrder: category?.sortOrder || 0
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validateForm = () => {
    const newErrors: Record<string, string> = {}
    
    if (!formData.nameEn.trim()) {
      newErrors.nameEn = 'English name is required'
    }
    if (!formData.nameAr.trim()) {
      newErrors.nameAr = 'Arabic name is required'
    }
    if (formData.sortOrder < 0) {
      newErrors.sortOrder = 'Sort order must be 0 or greater'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    setIsSubmitting(true)
    try {
      const success = await onSave(formData)
      if (success) {
        onClose()
      } else {
        setErrors({ general: 'Failed to save category. Please try again.' })
      }
    } catch (error) {
      setErrors({ general: 'An unexpected error occurred.' })
    }
    setIsSubmitting(false)
  }

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-screen overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            {category ? 'Edit Category' : 'Add New Category'}
          </h3>
        </div>
        
        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
          {errors.general && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-600">
              {errors.general}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              English Name *
            </label>
            <input
              type="text"
              value={formData.nameEn}
              onChange={(e) => setFormData({ ...formData, nameEn: e.target.value })}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.nameEn ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="Enter English name"
            />
            {errors.nameEn && (
              <p className="mt-1 text-sm text-red-600">{errors.nameEn}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Arabic Name *
            </label>
            <input
              type="text"
              value={formData.nameAr}
              onChange={(e) => setFormData({ ...formData, nameAr: e.target.value })}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-arabic ${
                errors.nameAr ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="ادخل الاسم بالعربية"
              dir="rtl"
            />
            {errors.nameAr && (
              <p className="mt-1 text-sm text-red-600">{errors.nameAr}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              English Description
            </label>
            <textarea
              value={formData.descriptionEn}
              onChange={(e) => setFormData({ ...formData, descriptionEn: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter English description"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Arabic Description
            </label>
            <textarea
              value={formData.descriptionAr}
              onChange={(e) => setFormData({ ...formData, descriptionAr: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-arabic"
              placeholder="ادخل الوصف بالعربية"
              dir="rtl"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category Image
            </label>
            <ImageUpload
              onImageUpload={(base64Image) => setFormData({ ...formData, imageData: base64Image })}
              currentImage={formData.imageData || formData.imageUrl || ''}
              placeholder="Upload category image"
              className="w-full"
              maxSizeMB={3}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Sort Order
            </label>
            <input
              type="number"
              value={formData.sortOrder}
              onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })}
              min="0"
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.sortOrder ? 'border-red-300' : 'border-gray-300'
              }`}
            />
            {errors.sortOrder && (
              <p className="mt-1 text-sm text-red-600">{errors.sortOrder}</p>
            )}
          </div>

          <div className="space-y-3">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">Active (available for use)</span>
            </label>

            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.showInMenu}
                onChange={(e) => setFormData({ ...formData, showInMenu: e.target.checked })}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">Show in menu (visible to customers)</span>
            </label>
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 rounded-md text-white shadow-sm hover:opacity-90 disabled:opacity-50"
              style={{ backgroundColor: tenant.primaryColor }}
            >
              {isSubmitting ? 'Saving...' : (category ? 'Update' : 'Create')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ProductModal Component
interface ProductFormData {
  nameEn: string
  nameAr: string
  descriptionEn?: string
  descriptionAr?: string
  imageUrl?: string
  imageData?: string
  price: number
  compareAtPrice?: number
  isActive: boolean
  isAvailable: boolean
  isFeatured: boolean
  sortOrder: number
  calories?: number
  categoryId: string
}

interface ProductModalProps {
  product: Product | null
  onClose: () => void
  onSave: (data: ProductFormData) => Promise<boolean>
  tenant: Tenant
  categories: Category[]
}

function ProductModal({ product, onClose, onSave, tenant, categories }: ProductModalProps) {
  const [formData, setFormData] = useState<ProductFormData>({
    nameEn: product?.nameEn || '',
    nameAr: product?.nameAr || '',
    descriptionEn: product?.descriptionEn || '',
    descriptionAr: product?.descriptionAr || '',
    imageUrl: product?.imageUrl || '',
    imageData: product?.imageData || '',
    price: product?.price || 0,
    compareAtPrice: product?.compareAtPrice || undefined,
    isActive: product?.isActive ?? true,
    isAvailable: product?.isAvailable ?? true,
    isFeatured: product?.isFeatured ?? false,
    sortOrder: product?.sortOrder || 0,
    calories: product?.calories || undefined,
    categoryId: product?.categoryId || ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validateForm = () => {
    const newErrors: Record<string, string> = {}
    
    if (!formData.nameEn.trim()) {
      newErrors.nameEn = 'English name is required'
    }
    if (!formData.nameAr.trim()) {
      newErrors.nameAr = 'Arabic name is required'
    }
    if (!formData.categoryId) {
      newErrors.categoryId = 'Category is required'
    }
    if (formData.price <= 0) {
      newErrors.price = 'Price must be greater than 0'
    }
    if (formData.compareAtPrice && formData.compareAtPrice <= formData.price) {
      newErrors.compareAtPrice = 'Compare price must be greater than regular price'
    }
    if (formData.sortOrder < 0) {
      newErrors.sortOrder = 'Sort order must be 0 or greater'
    }
    if (formData.calories && formData.calories < 0) {
      newErrors.calories = 'Calories must be 0 or greater'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    setIsSubmitting(true)
    try {
      const success = await onSave(formData)
      if (success) {
        onClose()
      } else {
        setErrors({ general: 'Failed to save product. Please try again.' })
      }
    } catch (error) {
      setErrors({ general: 'An unexpected error occurred.' })
    }
    setIsSubmitting(false)
  }

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-screen overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            {product ? 'Edit Product' : 'Add New Product'}
          </h3>
        </div>
        
        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
          {errors.general && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-600">
              {errors.general}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                English Name *
              </label>
              <input
                type="text"
                value={formData.nameEn}
                onChange={(e) => setFormData({ ...formData, nameEn: e.target.value })}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.nameEn ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Enter English name"
              />
              {errors.nameEn && (
                <p className="mt-1 text-sm text-red-600">{errors.nameEn}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Arabic Name *
              </label>
              <input
                type="text"
                value={formData.nameAr}
                onChange={(e) => setFormData({ ...formData, nameAr: e.target.value })}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-arabic ${
                  errors.nameAr ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="ادخل الاسم بالعربية"
                dir="rtl"
              />
              {errors.nameAr && (
                <p className="mt-1 text-sm text-red-600">{errors.nameAr}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category *
            </label>
            <select
              value={formData.categoryId}
              onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.categoryId ? 'border-red-300' : 'border-gray-300'
              }`}
            >
              <option value="">Select a category</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.nameEn}
                </option>
              ))}
            </select>
            {errors.categoryId && (
              <p className="mt-1 text-sm text-red-600">{errors.categoryId}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              English Description
            </label>
            <textarea
              value={formData.descriptionEn}
              onChange={(e) => setFormData({ ...formData, descriptionEn: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter English description"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Arabic Description
            </label>
            <textarea
              value={formData.descriptionAr}
              onChange={(e) => setFormData({ ...formData, descriptionAr: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-arabic"
              placeholder="ادخل الوصف بالعربية"
              dir="rtl"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Product Image
            </label>
            <ImageUpload
              onImageUpload={(base64Image) => setFormData({ ...formData, imageData: base64Image })}
              currentImage={formData.imageData || formData.imageUrl || ''}
              placeholder="Upload product image"
              className="w-full"
              maxSizeMB={3}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Price ($) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.price ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              {errors.price && (
                <p className="mt-1 text-sm text-red-600">{errors.price}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Compare Price ($)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.compareAtPrice || ''}
                onChange={(e) => setFormData({ ...formData, compareAtPrice: parseFloat(e.target.value) || undefined })}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.compareAtPrice ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Optional"
              />
              {errors.compareAtPrice && (
                <p className="mt-1 text-sm text-red-600">{errors.compareAtPrice}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sort Order
              </label>
              <input
                type="number"
                value={formData.sortOrder}
                onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })}
                min="0"
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.sortOrder ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              {errors.sortOrder && (
                <p className="mt-1 text-sm text-red-600">{errors.sortOrder}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Calories
              </label>
              <input
                type="number"
                value={formData.calories || ''}
                onChange={(e) => setFormData({ ...formData, calories: parseInt(e.target.value) || undefined })}
                min="0"
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.calories ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Optional"
              />
              {errors.calories && (
                <p className="mt-1 text-sm text-red-600">{errors.calories}</p>
              )}
            </div>
          </div>

          <div className="space-y-3">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">Active (available for ordering)</span>
            </label>

            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.isAvailable}
                onChange={(e) => setFormData({ ...formData, isAvailable: e.target.checked })}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">Available (in stock)</span>
            </label>

            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.isFeatured}
                onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">Featured (highlighted in menu)</span>
            </label>
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 rounded-md text-white shadow-sm hover:opacity-90 disabled:opacity-50"
              style={{ backgroundColor: tenant.primaryColor }}
            >
              {isSubmitting ? 'Saving...' : (product ? 'Update' : 'Create')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}