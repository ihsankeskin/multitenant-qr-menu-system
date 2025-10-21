'use client'

import React from 'react'
import { useLocalization, Language } from '@/contexts/LocalizationContext'
import { LanguageIcon } from '@heroicons/react/24/outline'

interface LanguageSwitcherProps {
  className?: string
  showLabel?: boolean
  variant?: 'dropdown' | 'toggle'
}

export default function LanguageSwitcher({ 
  className = '', 
  showLabel = true, 
  variant = 'dropdown' 
}: LanguageSwitcherProps) {
  const { language, setLanguage, t } = useLocalization()

  if (variant === 'toggle') {
    return (
      <button
        onClick={() => {
          if (language === 'tr') setLanguage('en')
          else if (language === 'en') setLanguage('ar')
          else setLanguage('tr')
        }}
        className={`flex items-center space-x-2 px-3 py-2 rounded-md border border-gray-300 bg-white hover:bg-gray-50 transition-colors ${className}`}
        title={t('common.language')}
      >
        <LanguageIcon className="w-4 h-4" />
        {showLabel && (
          <span className="text-sm font-medium">
            {language === 'tr' ? 'EN' : language === 'en' ? 'عربي' : 'TR'}
          </span>
        )}
      </button>
    )
  }

  return (
    <div className={`relative ${className}`}>
      <select
        value={language}
        onChange={(e) => setLanguage(e.target.value as Language)}
        className="appearance-none bg-white border border-gray-300 rounded-md px-3 py-2 pr-8 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      >
        <option value="tr">{t('common.turkish')}</option>
        <option value="en">{t('common.english')}</option>
        <option value="ar">{t('common.arabic')}</option>
      </select>
      <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
        <LanguageIcon className="w-4 h-4 text-gray-400" />
      </div>
    </div>
  )
}