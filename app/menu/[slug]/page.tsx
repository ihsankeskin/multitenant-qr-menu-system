'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { 
  MagnifyingGlassIcon, 
  PhoneIcon, 
  EnvelopeIcon, 
  ClockIcon,
  MapPinIcon,
  LanguageIcon,
  HeartIcon,
  StarIcon
} from '@heroicons/react/24/outline'
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid'

interface Tenant {
  id: string
  slug: string
  businessName: string
  businessNameAr: string
  primaryColor: string
  secondaryColor?: string
  logoUrl?: string
  phone?: string
  email?: string
  address?: string
  coverImageUrl?: string
}

interface Category {
  id: string
  nameEn: string
  nameAr: string
  descriptionEn?: string
  descriptionAr?: string
  imageUrl?: string
  sortOrder: number
  showInMenu: boolean
  products: Product[]
}

interface Product {
  id: string
  nameEn: string
  nameAr: string
  descriptionEn?: string
  descriptionAr?: string
  imageUrl?: string
  basePrice: number
  discountPrice?: number
  currentPrice: number
  hasDiscount: boolean
  isOutOfStock: boolean
  isFeatured: boolean
  calories?: number
}

interface MenuSettings {
  showPrices: boolean
  showCalories: boolean
  showDescriptions: boolean
  showImages: boolean
  defaultLanguage: string
  enableBilingualMenu: boolean
  currency: string
  currencyPosition: string
  businessHours?: {
    [key: string]: {
      isOpen: boolean
      open: string
      close: string
    }
  }
}

export default function PublicMenu() {
  const params = useParams()
  const slug = params.slug as string
  
  const [tenant, setTenant] = useState<Tenant | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [settings, setSettings] = useState<MenuSettings | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [searchTerm, setSearchTerm] = useState('')
  const [language, setLanguage] = useState<'en' | 'ar'>('en')
  const [favorites, setFavorites] = useState<Set<string>>(new Set())
  // Note: Menu open state available for future mobile menu functionality
  // const [isMenuOpen, setIsMenuOpen] = useState(false)

  useEffect(() => {
    fetchMenuData()
  }, [slug])

  const fetchMenuData = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/v1/public/menu/${slug}`)
      
      if (response.ok) {
        const data = await response.json()
        setTenant(data.tenant)
        setCategories(data.categories)
        setSettings(data.settings)
        setLanguage(data.settings?.defaultLanguage === 'ar' ? 'ar' : 'en')
        
        // Set first category as selected
        if (data.categories.length > 0) {
          setSelectedCategory(data.categories[0].id)
        }
      } else if (response.status === 404) {
        // Restaurant not found
        setTenant(null)
      }
    } catch (error) {
      console.error('Error fetching menu data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const formatPrice = (price: number) => {
    if (!settings?.showPrices) return ''
    
    const currencySymbol = {
      'USD': '$',
      'EUR': '€',
      'GBP': '£',
      'AED': 'د.إ',
      'SAR': 'ر.س'
    }[settings?.currency || 'USD'] || '$'

    const formattedPrice = price.toFixed(2)
    
    if (settings?.currencyPosition === 'after') {
      return `${formattedPrice}${currencySymbol}`
    }
    return `${currencySymbol}${formattedPrice}`
  }

  const toggleFavorite = (productId: string) => {
    const newFavorites = new Set(favorites)
    if (newFavorites.has(productId)) {
      newFavorites.delete(productId)
    } else {
      newFavorites.add(productId)
    }
    setFavorites(newFavorites)
    
    // Store in localStorage
    localStorage.setItem(`favorites_${slug}`, JSON.stringify(Array.from(newFavorites)))
  }

  // Load favorites from localStorage
  useEffect(() => {
    const savedFavorites = localStorage.getItem(`favorites_${slug}`)
    if (savedFavorites) {
      try {
        const parsed = JSON.parse(savedFavorites)
        setFavorites(new Set(parsed))
      } catch (e) {
        console.error('Error parsing favorites:', e)
      }
    }
  }, [slug])

  const filteredProducts = categories
    .filter(category => !selectedCategory || category.id === selectedCategory)
    .flatMap(category => category.products)
    .filter(product => {
      if (!searchTerm) return true
      const searchLower = searchTerm.toLowerCase()
      const nameEn = product.nameEn?.toLowerCase() || ''
      const nameAr = product.nameAr?.toLowerCase() || ''
      const descEn = product.descriptionEn?.toLowerCase() || ''
      const descAr = product.descriptionAr?.toLowerCase() || ''
      
      return nameEn.includes(searchLower) || 
             nameAr.includes(searchLower) ||
             descEn.includes(searchLower) ||
             descAr.includes(searchLower)
    })

  const getCurrentDayHours = () => {
    if (!settings?.businessHours) return null
    
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
    const today = days[new Date().getDay()]
    return settings.businessHours[today]
  }

  const todayHours = getCurrentDayHours()

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading menu...</p>
        </div>
      </div>
    )
  }

  if (!tenant) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🍽️</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Restaurant Not Found</h1>
          <p className="text-gray-600">The restaurant you're looking for doesn't exist or is no longer available.</p>
        </div>
      </div>
    )
  }

  const primaryColor = tenant.primaryColor || '#3B82F6'
  const secondaryColor = tenant.secondaryColor || '#6B7280'

  return (
    <div className="min-h-screen bg-gray-50" style={{ fontFamily: language === 'ar' ? 'system-ui' : 'inherit' }}>
      {/* Header */}
      <div 
        className="relative bg-gradient-to-r text-white"
        style={{ 
          backgroundImage: tenant.coverImageUrl ? `linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), url(${tenant.coverImageUrl})` : `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)`,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      >
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4" dir={language === 'ar' ? 'rtl' : 'ltr'}>
              {tenant.logoUrl && (
                <img
                  src={tenant.logoUrl}
                  alt="Restaurant Logo"
                  className="h-16 w-16 rounded-full bg-white p-1"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none'
                  }}
                />
              )}
              <div>
                <h1 className="text-3xl font-bold">
                  {language === 'ar' ? tenant.businessNameAr : tenant.businessName}
                </h1>
                {todayHours && (
                  <div className="flex items-center space-x-2 mt-2 text-white/80">
                    <ClockIcon className="h-4 w-4" />
                    <span className="text-sm">
                      {todayHours.isOpen 
                        ? `Open: ${todayHours.open} - ${todayHours.close}`
                        : 'Closed Today'
                      }
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Language Toggle & Contact */}
            <div className="flex items-center space-x-3">
              {settings?.enableBilingualMenu && (
                <button
                  onClick={() => setLanguage(language === 'en' ? 'ar' : 'en')}
                  className="flex items-center space-x-1 px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/30 transition-colors"
                >
                  <LanguageIcon className="h-4 w-4" />
                  <span className="text-sm">{language === 'en' ? 'عربي' : 'EN'}</span>
                </button>
              )}
              
              {tenant.phone && (
                <a
                  href={`tel:${tenant.phone}`}
                  className="p-2 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/30 transition-colors"
                >
                  <PhoneIcon className="h-5 w-5" />
                </a>
              )}
            </div>
          </div>

          {/* Restaurant Info */}
          {(tenant.address || tenant.email) && (
            <div className="mt-6 flex flex-wrap gap-4 text-white/80">
              {tenant.address && (
                <div className="flex items-center space-x-2">
                  <MapPinIcon className="h-4 w-4" />
                  <span className="text-sm">{tenant.address}</span>
                </div>
              )}
              {tenant.email && (
                <div className="flex items-center space-x-2">
                  <EnvelopeIcon className="h-4 w-4" />
                  <span className="text-sm">{tenant.email}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Search Bar */}
      <div className="sticky top-0 bg-white border-b border-gray-200 z-40">
        <div className="container mx-auto px-4 py-3">
          <div className="relative">
            <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder={language === 'ar' ? 'ابحث في القائمة...' : 'Search menu...'}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-opacity-50"
              style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
              dir={language === 'ar' ? 'rtl' : 'ltr'}
            />
          </div>
        </div>
      </div>

      {/* Categories Navigation */}
      <div className="sticky top-16 bg-white border-b border-gray-200 z-30">
        <div className="container mx-auto">
          <div className="flex overflow-x-auto scrollbar-hide py-3 px-4 space-x-4">
            <button
              onClick={() => setSelectedCategory('')}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                !selectedCategory 
                  ? 'text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              style={{ 
                backgroundColor: !selectedCategory ? primaryColor : 'transparent',
                borderColor: primaryColor,
                borderWidth: '1px'
              }}
            >
              {language === 'ar' ? 'الكل' : 'All'}
            </button>
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
                  selectedCategory === category.id 
                    ? 'text-white shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
                style={{ 
                  backgroundColor: selectedCategory === category.id ? primaryColor : 'transparent',
                  borderColor: primaryColor,
                  borderWidth: '1px'
                }}
              >
                {language === 'ar' ? category.nameAr : category.nameEn}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Menu Content */}
      <div className="container mx-auto px-4 py-6">
        {searchTerm && (
          <div className="mb-6">
            <p className="text-gray-600">
              {language === 'ar' 
                ? `${filteredProducts.length} نتائج للبحث "${searchTerm}"`
                : `${filteredProducts.length} results for "${searchTerm}"`
              }
            </p>
          </div>
        )}

        {filteredProducts.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {language === 'ar' ? 'لا توجد منتجات' : 'No items found'}
            </h3>
            <p className="text-gray-600">
              {language === 'ar' 
                ? 'جرب البحث بكلمات مختلفة أو تصفح الفئات'
                : 'Try searching with different keywords or browse categories'
              }
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map((product) => (
              <div
                key={product.id}
                className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden border border-gray-100"
              >
                {/* Product Image */}
                {settings?.showImages && product.imageUrl && (
                  <div className="relative h-48">
                    <img
                      src={product.imageUrl}
                      alt={language === 'ar' ? product.nameAr : product.nameEn}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none'
                      }}
                    />
                    {/* Favorite Button */}
                    <button
                      onClick={() => toggleFavorite(product.id)}
                      className="absolute top-3 right-3 p-2 rounded-full bg-white/80 backdrop-blur-sm hover:bg-white transition-colors"
                    >
                      {favorites.has(product.id) ? (
                        <HeartSolidIcon className="h-5 w-5 text-red-500" />
                      ) : (
                        <HeartIcon className="h-5 w-5 text-gray-600" />
                      )}
                    </button>
                    
                    {/* Featured Badge */}
                    {product.isFeatured && (
                      <div className="absolute top-3 left-3 px-2 py-1 rounded-full bg-yellow-500 text-white text-xs font-medium flex items-center space-x-1">
                        <StarIcon className="h-3 w-3" />
                        <span>{language === 'ar' ? 'مميز' : 'Featured'}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Product Content */}
                <div className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-lg font-semibold text-gray-900" dir={language === 'ar' ? 'rtl' : 'ltr'}>
                      {language === 'ar' ? product.nameAr : product.nameEn}
                    </h3>
                    
                    {settings?.showPrices && (
                      <div className="flex flex-col items-end">
                        <span 
                          className="text-lg font-bold"
                          style={{ color: primaryColor }}
                        >
                          {formatPrice(product.currentPrice)}
                        </span>
                        {product.hasDiscount && (
                          <span className="text-sm text-gray-500 line-through">
                            {formatPrice(product.basePrice)}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Product Description */}
                  {settings?.showDescriptions && (product.descriptionEn || product.descriptionAr) && (
                    <p className="text-gray-600 text-sm mb-3" dir={language === 'ar' ? 'rtl' : 'ltr'}>
                      {language === 'ar' ? product.descriptionAr : product.descriptionEn}
                    </p>
                  )}

                  {/* Product Details */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {settings?.showCalories && product.calories && (
                        <span className="text-xs text-gray-500 px-2 py-1 bg-gray-100 rounded-full">
                          {product.calories} cal
                        </span>
                      )}
                      
                      {product.isOutOfStock && (
                        <span className="text-xs text-red-600 px-2 py-1 bg-red-100 rounded-full">
                          {language === 'ar' ? 'غير متوفر' : 'Unavailable'}
                        </span>
                      )}
                    </div>

                    {!product.isOutOfStock && (
                      <div className="flex items-center text-sm text-green-600">
                        <div className="w-2 h-2 bg-green-500 rounded-full mr-1"></div>
                        {language === 'ar' ? 'متوفر' : 'Available'}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="container mx-auto px-4 py-6">
          <div className="text-center text-gray-500 text-sm">
            <p>
              {language === 'ar' 
                ? `© ${new Date().getFullYear()} ${tenant.businessNameAr || tenant.businessName}. جميع الحقوق محفوظة.`
                : `© ${new Date().getFullYear()} ${tenant.businessName}. All rights reserved.`
              }
            </p>
            <p className="mt-2 text-xs">
              {language === 'ar' 
                ? 'تم إنشاؤها بواسطة Menu App'
                : 'Powered by Menu App'
              }
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}