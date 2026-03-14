import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { AuthProvider } from '@/contexts/auth-context'
import { Toaster } from '@/components/ui/sonner'
import { ErrorBoundary } from '@/components/error-boundary'
import './globals.css'

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: 'KJ Textile ERP',
  description: 'Textile Business Management System',
  generator: 'v0.app',
  icons: {
    icon: [
      {
        url: '/kj-logo.svg',
        type: 'image/svg+xml',
      },
      {
        url: '/kj-logo.svg',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/kj-logo.svg',
        media: '(prefers-color-scheme: dark)',
      },
    ],
    apple: '/kj-logo.svg',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        <ErrorBoundary>
          <AuthProvider>
            {children}
          </AuthProvider>
        </ErrorBoundary>
        <Toaster position="top-right" richColors />
        <Analytics />
      </body>
    </html>
  )
}
