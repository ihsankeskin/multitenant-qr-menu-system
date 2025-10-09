import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { LocalizationProvider } from '@/contexts/LocalizationContext'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'The Menu Genie - Digital Menu & QR Code System',
  description: 'A comprehensive multi-tenant QR menu system with Super Admin management',
  keywords: ['restaurant', 'menu', 'qr code', 'multi-tenant', 'saas', 'digital menu'],
  icons: {
    icon: '/favicon.ico',
    apple: '/logo.jpg',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head />
      <body className={inter.className} suppressHydrationWarning>
        <LocalizationProvider defaultLanguage="ar">
          <div id="root">{children}</div>
        </LocalizationProvider>
      </body>
    </html>
  )
}