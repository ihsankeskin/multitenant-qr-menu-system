import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { LocalizationProvider } from '@/contexts/LocalizationContext'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Multi-Tenant QR Menu System',
  description: 'A comprehensive multi-tenant QR menu system with Super Admin management',
  keywords: ['restaurant', 'menu', 'qr code', 'multi-tenant', 'saas'],
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
        <LocalizationProvider>
          <div id="root">{children}</div>
        </LocalizationProvider>
      </body>
    </html>
  )
}