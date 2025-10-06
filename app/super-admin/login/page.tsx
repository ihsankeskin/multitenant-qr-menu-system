'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import LanguageSwitcher from '@/components/LanguageSwitcher'
import { useTranslation } from '@/contexts/LocalizationContext'

export default function SuperAdminLogin() {
  const { t, isRTL } = useTranslation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mfaCode, setMfaCode] = useState('')
  const [showMfa, setShowMfa] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleQuickLogin = () => {
    setEmail('admin@qrmenu.system')
    setPassword('SuperAdmin123!')
    setMfaCode('')
    setShowMfa(false)
    setError('')
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/v1/super-admin/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, mfaCode: showMfa ? mfaCode : undefined })
      })

      const data = await response.json()

      if (data.success) {
        if (data.requiresMfa && !showMfa) {
          setShowMfa(true)
        } else {
          localStorage.setItem('token', data.data.accessToken)
          localStorage.setItem('user', JSON.stringify(data.data.user))
          
          // Check if user must change password
          if (data.mustChangePassword || data.data.user.mustChangePassword) {
            router.push('/super-admin/change-password')
          } else {
            router.push('/super-admin/dashboard')
          }
        }
      } else {
        setError(data.message || 'Login failed')
      }
    } catch (error) {
      setError('Network error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="flex justify-end mb-4">
            <LanguageSwitcher variant="dropdown" />
          </div>
          <div className="flex justify-center mb-4">
            <img 
              src="/logo.jpg" 
              alt="The Menu Genie" 
              className="h-20 w-auto rounded-lg"
            />
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            {t('superAdmin.auth.login.title')}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {t('superAdmin.auth.login.description')}
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email" className="sr-only">{t('common.email')}</label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder={t('common.email')}
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">{t('common.password')}</label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 ${!showMfa ? 'rounded-b-md' : ''} focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm`}
                placeholder={t('common.password')}
              />
            </div>
            {showMfa && (
              <div>
                <label htmlFor="mfaCode" className="sr-only">{t('superAdmin.auth.login.mfaCode')}</label>
                <input
                  id="mfaCode"
                  name="mfaCode"
                  type="text"
                  required
                  value={mfaCode}
                  onChange={(e) => setMfaCode(e.target.value)}
                  className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                  placeholder={t('superAdmin.auth.login.mfaCodePlaceholder')}
                  maxLength={6}
                />
              </div>
            )}
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {/* Quick Login Button for Development */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-yellow-800">{t('superAdmin.auth.login.quickLogin')}</p>
                <p className="text-xs text-yellow-600 mt-1">{t('superAdmin.auth.login.quickLoginDescription')}</p>
              </div>
              <button
                type="button"
                onClick={handleQuickLogin}
                className="inline-flex items-center px-3 py-1 border border-yellow-300 rounded-md text-sm font-medium text-yellow-700 bg-yellow-100 hover:bg-yellow-200 focus:outline-none focus:ring-2 focus:ring-yellow-500"
              >
                {t('superAdmin.auth.login.quickLoginButton')}
              </button>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? t('superAdmin.auth.login.signingIn') : showMfa ? t('superAdmin.auth.login.verifyMfa') : t('superAdmin.auth.login.signIn')}
            </button>
          </div>

          {showMfa && (
            <div className="text-sm text-center text-gray-600">
              <p>{t('superAdmin.auth.login.mfaInstructions')}</p>
            </div>
          )}
        </form>
        
        <div className="text-center">
          <a href="/" className="text-indigo-600 hover:text-indigo-500 text-sm">
            ← {t('common.backToHome')}
          </a>
        </div>
      </div>
    </div>
  )
}