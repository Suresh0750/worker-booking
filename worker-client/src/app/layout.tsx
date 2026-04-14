import type { Metadata } from 'next'
import { Plus_Jakarta_Sans, Sora } from 'next/font/google'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from '@/lib/auth-context'
import './globals.css'
import Providers from './Providers'

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-plus-jakarta',
  display: 'swap',
})

const sora = Sora({
  subsets: ['latin'],
  variable: '--font-sora',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'WorkerHub — Find Skilled Workers Near You',
  description: 'Connect with trusted carpenters, plumbers, electricians and more in your city.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${plusJakarta.variable} ${sora.variable}`}>
      <body className="font-sans bg-surface-secondary text-slate-900 antialiased">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}
