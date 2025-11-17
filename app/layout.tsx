import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { UserProvider } from '@auth0/nextjs-auth0/client'
import { Toaster } from 'react-hot-toast'
import { ThemeProvider } from '@/components/ThemeProvider'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'ProductBee - AI Roadmap Collaboration',
  description: 'AI-powered roadmap dashboard for product development',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ThemeProvider>
          <UserProvider> 
            {children}
            <Toaster position="top-right" />
          </UserProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}

