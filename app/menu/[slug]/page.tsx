'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { 
  MagnifyingGlassIcon, 
  PhoneIcon, 
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
  accentColor?: string
  logoUrl?: string
  logoImage?: string
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
  const [language, setLanguage] = useState<'en' | 'ar'>('ar')
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
        
        // Default to "All" category (empty string shows all products)
        setSelectedCategory('')
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
      'EGP': 'ج.م',
      'USD': '$',
      'EUR': '€',
      'GBP': '£',
      'AED': 'د.إ',
      'SAR': 'ر.س'
    }[settings?.currency || 'EGP'] || 'ج.م'

    const formattedPrice = price.toFixed(2)
    
    if (settings?.currencyPosition === 'after') {
      return `${formattedPrice} ${currencySymbol}`
    }
    return `${currencySymbol} ${formattedPrice}`
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
          <div 
            className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4"
            style={{ borderBottomColor: tenant?.primaryColor || '#3B82F6' }}
          ></div>
          <p className="text-gray-600 font-medium">
            {tenant?.businessName ? `Loading ${tenant.businessName}...` : 'Loading menu...'}
          </p>
          {(tenant?.logoImage || tenant?.logoUrl) && (
            <img
              src={tenant.logoImage || tenant.logoUrl}
              alt="Restaurant Logo"
              className="h-8 w-8 rounded-full mx-auto mt-2"
              onError={(e) => {
                e.currentTarget.style.display = 'none'
              }}
            />
          )}
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
  const accentColor = tenant.accentColor || '#3B82F6'

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
              {(tenant.logoImage || tenant.logoUrl) && (
                <img
                  src={tenant.logoImage || tenant.logoUrl}
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
                {tenant.phone && (
                  <a
                    href={`tel:${tenant.phone}`}
                    className="flex items-center space-x-2 mt-2 text-white/90 hover:text-white transition-colors"
                  >
                    <PhoneIcon className="h-4 w-4" />
                    <span className="text-sm font-medium">{tenant.phone}</span>
                  </a>
                )}
              </div>
            </div>

            {/* Language Toggle & Contact */}
            <div className="flex items-center space-x-3">
              {settings?.enableBilingualMenu && (
                <button
                  onClick={() => setLanguage(language === 'en' ? 'ar' : 'en')}
                  className="flex items-center space-x-1 px-4 py-2 rounded-full backdrop-blur-sm hover:shadow-lg transition-all duration-200 font-medium"
                  style={{
                    backgroundColor: `${accentColor}20`,
                    color: 'white',
                    borderWidth: '2px',
                    borderColor: accentColor
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = accentColor
                    e.currentTarget.style.transform = 'scale(1.05)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = `${accentColor}20`
                    e.currentTarget.style.transform = 'scale(1)'
                  }}
                >
                  <LanguageIcon className="h-4 w-4" />
                  <span className="text-sm">{language === 'en' ? 'عربي' : 'EN'}</span>
                </button>
              )}
              
              {tenant.phone && (
                <a
                  href={`tel:${tenant.phone}`}
                  className="p-3 rounded-full backdrop-blur-sm hover:shadow-lg transition-all duration-200"
                  style={{
                    backgroundColor: `${secondaryColor}20`,
                    borderWidth: '2px',
                    borderColor: secondaryColor
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = secondaryColor
                    e.currentTarget.style.transform = 'scale(1.05)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = `${secondaryColor}20`
                    e.currentTarget.style.transform = 'scale(1)'
                  }}
                >
                  <PhoneIcon className="h-5 w-5 text-white" />
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="sticky top-0 bg-white border-b z-40" style={{ borderBottomColor: `${primaryColor}20` }}>
        <div className="container mx-auto px-4 py-3">
          <div className="relative">
            <MagnifyingGlassIcon 
              className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2" 
              style={{ color: secondaryColor }}
            />
            <input
              type="text"
              placeholder={language === 'ar' ? 'ابحث في القائمة...' : 'Search menu...'}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border-2 rounded-lg focus:outline-none transition-colors"
              style={{ 
                borderColor: searchTerm ? accentColor : '#E5E7EB',
                '--tw-ring-color': primaryColor 
              } as React.CSSProperties}
              dir={language === 'ar' ? 'rtl' : 'ltr'}
            />
            {searchTerm && (
              <div 
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs px-2 py-1 rounded-full text-white font-medium"
                style={{ backgroundColor: accentColor }}
              >
                {filteredProducts.length}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Categories Navigation */}
      <div className="sticky top-16 bg-white border-b z-30" style={{ borderBottomColor: `${secondaryColor}20` }}>
        <div className="container mx-auto">
          <div className="flex overflow-x-auto scrollbar-hide py-3 px-4 space-x-4">
            <button
              onClick={() => setSelectedCategory('')}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 shadow-sm ${
                !selectedCategory 
                  ? 'text-white transform scale-105'
                  : 'text-gray-600 hover:text-white hover:scale-105'
              }`}
              style={{ 
                backgroundColor: !selectedCategory ? primaryColor : 'transparent',
                borderColor: primaryColor,
                borderWidth: '2px',
                boxShadow: !selectedCategory ? `0 4px 12px ${primaryColor}40` : 'none'
              }}
              onMouseEnter={(e) => {
                if (!selectedCategory) return
                e.currentTarget.style.backgroundColor = `${primaryColor}20`
              }}
              onMouseLeave={(e) => {
                if (!selectedCategory) return
                e.currentTarget.style.backgroundColor = 'transparent'
              }}
            >
              {language === 'ar' ? 'الكل' : 'All'}
            </button>
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 shadow-sm whitespace-nowrap flex items-center space-x-2 ${
                  selectedCategory === category.id 
                    ? 'text-white transform scale-105'
                    : 'text-gray-600 hover:text-white hover:scale-105'
                }`}
                style={{ 
                  backgroundColor: selectedCategory === category.id ? primaryColor : 'transparent',
                  borderColor: primaryColor,
                  borderWidth: '2px',
                  boxShadow: selectedCategory === category.id ? `0 4px 12px ${primaryColor}40` : 'none'
                }}
                onMouseEnter={(e) => {
                  if (selectedCategory === category.id) return
                  e.currentTarget.style.backgroundColor = `${primaryColor}20`
                }}
                onMouseLeave={(e) => {
                  if (selectedCategory === category.id) return
                  e.currentTarget.style.backgroundColor = 'transparent'
                }}
              >
                {category.imageUrl && (
                  <img 
                    src={category.imageUrl} 
                    alt={language === 'ar' ? category.nameAr : category.nameEn}
                    className="h-5 w-5 rounded-full object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none'
                    }}
                  />
                )}
                <span>{language === 'ar' ? category.nameAr : category.nameEn}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Menu Content */}
      <div className="container mx-auto px-4 py-6">
        {searchTerm && (
          <div className="mb-6 p-4 rounded-lg" style={{ backgroundColor: `${accentColor}10`, borderLeft: `4px solid ${accentColor}` }}>
            <p className="font-medium" style={{ color: accentColor }}>
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
            <h3 className="text-xl font-bold mb-2" style={{ color: primaryColor }}>
              {language === 'ar' ? 'لا توجد منتجات' : 'No items found'}
            </h3>
            <p className="text-gray-600 mb-4">
              {language === 'ar' 
                ? 'جرب البحث بكلمات مختلفة أو تصفح الفئات'
                : 'Try searching with different keywords or browse categories'
              }
            </p>
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="px-6 py-2 rounded-full text-white font-medium hover:shadow-lg transition-all duration-200"
                style={{ backgroundColor: accentColor }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.05)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)'
                }}
              >
                {language === 'ar' ? 'مسح البحث' : 'Clear Search'}
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map((product) => (
              <div
                key={product.id}
                className="bg-white rounded-lg shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden border-2 border-transparent hover:border-opacity-30 group"
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = `${primaryColor}30`
                  e.currentTarget.style.transform = 'translateY(-2px)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'transparent'
                  e.currentTarget.style.transform = 'translateY(0px)'
                }}
              >
                {/* Product Image */}
                {settings?.showImages && product.imageUrl && (
                  <div className="relative h-48 overflow-hidden">
                    <img
                      src={product.imageUrl}
                      alt={language === 'ar' ? product.nameAr : product.nameEn}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none'
                      }}
                    />
                    {/* Favorite Button */}
                    <button
                      onClick={() => toggleFavorite(product.id)}
                      className="absolute top-3 right-3 p-2 rounded-full bg-white/90 backdrop-blur-sm hover:bg-white transition-all duration-200 shadow-lg"
                      style={{
                        boxShadow: favorites.has(product.id) ? `0 4px 12px ${accentColor}40` : '0 2px 8px rgba(0,0,0,0.15)'
                      }}
                    >
                      {favorites.has(product.id) ? (
                        <HeartSolidIcon className="h-5 w-5" style={{ color: accentColor }} />
                      ) : (
                        <HeartIcon className="h-5 w-5 text-gray-600" />
                      )}
                    </button>
                    
                    {/* Featured Badge */}
                    {product.isFeatured && (
                      <div 
                        className="absolute top-3 left-3 px-3 py-1 rounded-full text-white text-xs font-bold flex items-center space-x-1 shadow-lg"
                        style={{ 
                          backgroundColor: accentColor,
                          boxShadow: `0 4px 12px ${accentColor}40`
                        }}
                      >
                        <StarIcon className="h-3 w-3" />
                        <span>{language === 'ar' ? 'مميز' : 'Featured'}</span>
                      </div>
                    )}

                    {/* Discount Badge */}
                    {product.hasDiscount && (
                      <div 
                        className="absolute bottom-3 left-3 px-2 py-1 rounded-full text-white text-xs font-bold shadow-lg"
                        style={{ backgroundColor: secondaryColor }}
                      >
                        {language === 'ar' ? 'خصم' : 'Sale'}
                      </div>
                    )}
                  </div>
                )}

                {/* Featured Badge for products without images */}
                {product.isFeatured && (!settings?.showImages || !product.imageUrl) && (
                  <div className="p-4 pb-0">
                    <div 
                      className="inline-flex items-center space-x-1 px-3 py-1 rounded-full text-white text-xs font-bold shadow-lg"
                      style={{ 
                        backgroundColor: accentColor,
                        boxShadow: `0 4px 12px ${accentColor}40`
                      }}
                    >
                      <StarIcon className="h-3 w-3" />
                      <span>{language === 'ar' ? 'مميز' : 'Featured'}</span>
                    </div>
                  </div>
                )}

                {/* Product Content */}
                <div className="p-4">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="text-lg font-bold text-gray-900 group-hover:text-opacity-80 transition-colors" dir={language === 'ar' ? 'rtl' : 'ltr'}>
                      {language === 'ar' ? product.nameAr : product.nameEn}
                    </h3>
                    
                    {settings?.showPrices && (
                      <div className="flex flex-col items-end">
                        <span 
                          className="text-lg font-bold transition-colors"
                          style={{ color: primaryColor }}
                        >
                          {formatPrice(product.currentPrice)}
                        </span>
                        {product.hasDiscount && (
                          <span className="text-sm line-through" style={{ color: secondaryColor }}>
                            {formatPrice(product.basePrice)}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Product Description */}
                  {settings?.showDescriptions && (product.descriptionEn || product.descriptionAr) && (
                    <p className="text-gray-600 text-sm mb-3 line-clamp-2" dir={language === 'ar' ? 'rtl' : 'ltr'}>
                      {language === 'ar' ? product.descriptionAr : product.descriptionEn}
                    </p>
                  )}

                  {/* Product Details */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {settings?.showCalories && product.calories && (
                        <span 
                          className="text-xs text-white px-2 py-1 rounded-full font-medium shadow-sm"
                          style={{ backgroundColor: secondaryColor }}
                        >
                          {product.calories} cal
                        </span>
                      )}
                      
                      {product.isOutOfStock && (
                        <span 
                          className="text-xs text-white px-2 py-1 rounded-full font-medium"
                          style={{ backgroundColor: '#EF4444' }}
                        >
                          {language === 'ar' ? 'غير متوفر' : 'Unavailable'}
                        </span>
                      )}
                    </div>

                    {!product.isOutOfStock && (
                      <div className="flex items-center text-sm font-medium" style={{ color: accentColor }}>
                        <div 
                          className="w-2 h-2 rounded-full mr-2 animate-pulse" 
                          style={{ backgroundColor: accentColor }}
                        ></div>
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
      <footer className="bg-white border-t-4 mt-12" style={{ borderTopColor: primaryColor }}>
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            {/* Business Info */}
            <div className="flex justify-center items-center space-x-4 mb-6">
              {(tenant.logoImage || tenant.logoUrl) && (
                <img
                  src={tenant.logoImage || tenant.logoUrl}
                  alt="Restaurant Logo"
                  className="h-12 w-12 rounded-full"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none'
                  }}
                />
              )}
              <div>
                <h3 className="text-lg font-bold" style={{ color: primaryColor }}>
                  {language === 'ar' ? tenant.businessNameAr || tenant.businessName : tenant.businessName}
                </h3>
                {tenant.address && (
                  <p className="text-sm" style={{ color: secondaryColor }}>
                    {tenant.address}
                  </p>
                )}
              </div>
            </div>

            {/* Contact Information */}
            {tenant.phone && (
              <div className="flex justify-center mb-6">
                <a
                  href={`tel:${tenant.phone}`}
                  className="flex items-center space-x-2 px-6 py-3 rounded-full transition-all duration-200 hover:shadow-lg"
                  style={{ 
                    backgroundColor: `${primaryColor}10`,
                    color: primaryColor
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = `${primaryColor}20`
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = `${primaryColor}10`
                  }}
                >
                  <PhoneIcon className="h-5 w-5" />
                  <span className="text-sm font-medium">{tenant.phone}</span>
                </a>
              </div>
            )}

            {/* Copyright */}
            <div className="border-t pt-4" style={{ borderTopColor: `${primaryColor}20` }}>
              <p className="text-gray-500 text-sm">
                {language === 'ar' 
                  ? `© ${new Date().getFullYear()} ${tenant.businessNameAr || tenant.businessName}. جميع الحقوق محفوظة.`
                  : `© ${new Date().getFullYear()} ${tenant.businessName}. All rights reserved.`
                }
              </p>
              <p className="mt-2 text-xs font-medium" style={{ color: accentColor }}>
                {language === 'ar' 
                  ? 'تم إنشاؤها بواسطة Menu App'
                  : 'Powered by Menu App'
                }
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}