'use client'

import React from 'react'
import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { 
  HomeIcon, 
  BuildingStorefrontIcon, 
  ChartBarIcon,
  BanknotesIcon,
  CogIcon,
  ArrowRightOnRectangleIcon,
  UserCircleIcon,
  UserGroupIcon,
  Bars3Icon,
  XMarkIcon
} from '@heroicons/react/24/outline'
import { useTranslation } from '@/contexts/LocalizationContext'
import LanguageSwitcher from '@/components/LanguageSwitcher'

export default function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const [user, setUser] = useState<any>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { t, isRTL } = useTranslation()

  useEffect(() => {
    checkAuth()
  }, [pathname])

  const checkAuth = () => {
    // Allow access to login page without authentication
    if (pathname === '/super-admin/login') {
      setIsAuthenticated(false)
      return
    }

    const token = localStorage.getItem('token')
    const userData = localStorage.getItem('user')
    
    if (!token || !userData) {
      setIsAuthenticated(false)
      if (pathname !== '/super-admin/login') {
        router.push('/super-admin/login')
      }
      return
    }

    try {
      const parsedUser = JSON.parse(userData)
      // Allow both SUPER_ADMIN and ADMIN roles to access super admin panel
      if (parsedUser.role !== 'SUPER_ADMIN' && parsedUser.role !== 'ADMIN') {
        setIsAuthenticated(false)
        if (pathname !== '/super-admin/login') {
          router.push('/super-admin/login')
        }
        return
      }
      
      setUser(parsedUser)
      setIsAuthenticated(true)
    } catch (error) {
      setIsAuthenticated(false)
      if (pathname !== '/super-admin/login') {
        router.push('/super-admin/login')
      }
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    router.push('/super-admin/login')
  }

  const navigation = [
    { name: t('superAdmin.navigation.dashboard'), href: '/super-admin/dashboard', icon: HomeIcon },
    { name: t('superAdmin.navigation.tenants'), href: '/super-admin/tenants', icon: BuildingStorefrontIcon },
    { name: t('superAdmin.navigation.admins'), href: '/super-admin/admins', icon: UserGroupIcon },
    { name: t('superAdmin.navigation.financials'), href: '/super-admin/financials', icon: BanknotesIcon },
    { name: t('superAdmin.navigation.analytics'), href: '/super-admin/analytics', icon: ChartBarIcon },
    { name: t('superAdmin.navigation.settings'), href: '/super-admin/settings', icon: CogIcon },
  ]

  if (isAuthenticated === null) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!isAuthenticated) {
    // For login page, render without layout
    if (pathname === '/super-admin/login') {
      return children
    }
    return null
  }

  return (
    <div className={`min-h-screen bg-gray-100 flex ${isRTL ? 'rtl' : 'ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 flex z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        >
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75" />
          <div className={`relative flex-1 flex flex-col max-w-xs w-full bg-white ${isRTL ? 'mr-auto' : 'ml-auto'}`}>
            <div className={`absolute top-0 ${isRTL ? 'left-0 -ml-12' : 'right-0 -mr-12'} pt-2`}>
              <button
                type="button"
                className={`${isRTL ? 'mr-1' : 'ml-1'} flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white`}
                onClick={() => setSidebarOpen(false)}
              >
                <XMarkIcon className="h-6 w-6 text-white" />
              </button>
            </div>
            {/* Mobile navigation */}
            <div className="flex-1 h-0 pt-5 pb-4 overflow-y-auto">
              <div className="flex-shrink-0 flex items-center px-4">
                <h1 className="text-xl font-bold text-gray-900">{t('superAdmin.menuAdmin')}</h1>
              </div>
              <nav className="mt-5 px-2 space-y-1">
                {navigation.map((item) => {
                  const isActive = pathname === item.href
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`${
                        isActive
                          ? 'bg-blue-100 text-blue-900'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      } group flex items-center px-2 py-2 text-sm font-medium rounded-md ${isRTL ? 'text-right' : 'text-left'}`}
                    >
                      <item.icon
                        className={`${
                          isActive ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-500'
                        } ${isRTL ? 'ml-3' : 'mr-3'} h-6 w-6`}
                      />
                      {item.name}
                    </Link>
                  )
                })}
              </nav>
            </div>
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <div className={`hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 ${isRTL ? 'lg:right-0' : 'lg:left-0'}`}>
        <div className={`flex flex-col flex-grow bg-white pt-5 pb-4 overflow-y-auto ${isRTL ? 'border-l' : 'border-r'} border-gray-200`}>
          <div className="flex items-center flex-shrink-0 px-4">
            <h1 className={`text-xl font-bold text-gray-900 ${isRTL ? 'text-right' : 'text-left'}`}>{t('superAdmin.menuAdmin')}</h1>
          </div>
          <div className="mt-5 flex-grow flex flex-col">
            <nav className="flex-1 px-2 space-y-1">
              {navigation.map((item) => {
                const isActive = pathname === item.href || (item.href === '/super-admin/tenants' && pathname?.startsWith('/super-admin/tenants'))
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`${
                      isActive
                        ? 'bg-blue-100 text-blue-900'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    } group flex items-center px-2 py-2 text-sm font-medium rounded-md ${isRTL ? 'text-right' : 'text-left'}`}
                  >
                    <item.icon
                      className={`${
                        isActive ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-500'
                      } ${isRTL ? 'ml-3' : 'mr-3'} h-6 w-6`}
                    />
                    {item.name}
                  </Link>
                )
              })}
            </nav>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className={`lg:flex lg:flex-col lg:flex-1 ${isRTL ? 'lg:pr-64' : 'lg:pl-64'}`}>
        {/* Top navigation */}
        <div className="relative z-10 flex-shrink-0 flex h-16 bg-white shadow-sm border-b border-gray-200">
          <button
            type="button"
            className={`px-4 ${isRTL ? 'border-l' : 'border-r'} border-gray-200 text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 lg:hidden`}
            onClick={() => setSidebarOpen(true)}
          >
            <Bars3Icon className="h-6 w-6" />
          </button>
          
          <div className="flex-1 px-4 flex justify-between items-center">
            <div className="flex-1 flex">
              {/* Breadcrumb or page title could go here */}
            </div>
            
            <div className={`${isRTL ? 'mr-4' : 'ml-4'} flex items-center space-x-4 ${isRTL ? 'space-x-reverse' : ''}`}>
              {/* Language switcher */}
              <LanguageSwitcher />
              
              <div className={`flex items-center ${isRTL ? 'space-x-2 space-x-reverse' : 'space-x-2'}`}>
                <UserCircleIcon className="h-8 w-8 text-gray-400" />
                <div className="hidden md:block">
                  <div className={`text-sm font-medium text-gray-900 ${isRTL ? 'text-right' : 'text-left'}`}>
                    {user?.firstName} {user?.lastName}
                  </div>
                  <div className={`text-xs text-gray-500 ${isRTL ? 'text-right' : 'text-left'}`}>{t('common.admin')}</div>
                </div>
              </div>
              
              <button
                onClick={handleLogout}
                className={`flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md ${isRTL ? 'space-x-reverse' : ''}`}
              >
                <ArrowRightOnRectangleIcon className={`h-5 w-5 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                <span className="hidden md:inline">{t('common.logout')}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1 relative overflow-y-auto focus:outline-none">
          {children}
        </main>
      </div>
    </div>
  )
}