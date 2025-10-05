'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'

// Import translations
import enTranslations from '@/locales/en.json'
import arTranslations from '@/locales/ar.json'

export type Language = 'en' | 'ar'

interface LocalizationContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: string, params?: Record<string, string | number>) => string
  dir: 'ltr' | 'rtl'
  isRTL: boolean
}

const LocalizationContext = createContext<LocalizationContextType | undefined>(undefined)

const translations = {
  en: enTranslations,
  ar: arTranslations
}

interface LocalizationProviderProps {
  children: ReactNode
  defaultLanguage?: Language
}

export function LocalizationProvider({ children, defaultLanguage = 'en' }: LocalizationProviderProps) {
  const [language, setLanguageState] = useState<Language>(defaultLanguage)

  // Load language from localStorage on mount
  useEffect(() => {
    const storedLanguage = localStorage.getItem('language') as Language
    if (storedLanguage && (storedLanguage === 'en' || storedLanguage === 'ar')) {
      setLanguageState(storedLanguage)
    }
  }, [])

  // Save language to localStorage when it changes
  const setLanguage = (lang: Language) => {
    setLanguageState(lang)
    localStorage.setItem('language', lang)
    
    // Update document direction
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr'
    document.documentElement.lang = lang
  }

  // Function to get nested translation keys
  const getNestedValue = (obj: any, path: string): string => {
    return path.split('.').reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : null
    }, obj)
  }

  // Translation function with parameter substitution
  const t = (key: string, params?: Record<string, string | number>): string => {
    const translation = getNestedValue(translations[language], key)
    
    if (!translation) {
      console.warn(`Translation missing for key: ${key} in language: ${language}`)
      return key
    }

    // Replace parameters in the translation
    if (params) {
      return Object.entries(params).reduce((text, [param, value]) => {
        return text.replace(new RegExp(`{{${param}}}`, 'g'), String(value))
      }, translation)
    }

    return translation
  }

  const dir = language === 'ar' ? 'rtl' : 'ltr'
  const isRTL = language === 'ar'

  // Set initial direction
  useEffect(() => {
    document.documentElement.dir = dir
    document.documentElement.lang = language
  }, [dir, language])

  const value: LocalizationContextType = {
    language,
    setLanguage,
    t,
    dir,
    isRTL
  }

  return (
    <LocalizationContext.Provider value={value}>
      {children}
    </LocalizationContext.Provider>
  )
}

export function useLocalization() {
  const context = useContext(LocalizationContext)
  if (context === undefined) {
    throw new Error('useLocalization must be used within a LocalizationProvider')
  }
  return context
}

// Hook specifically for translations
export function useTranslation() {
  const { t, language, isRTL } = useLocalization()
  return { t, language, isRTL }
}