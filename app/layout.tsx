import type { Metadata } from 'next'
import './globals.css'
import { ToastProvider } from '@/contexts/ToastContext'

const appName = process.env.NEXT_PUBLIC_APP_NAME || 'Survey Platform';
const appDescription = process.env.NEXT_PUBLIC_APP_DESCRIPTION || 'A modern survey platform for creating, sharing, and analyzing surveys';

export const metadata: Metadata = {
  title: `${appName} - Create & Analyze Surveys`,
  description: appDescription,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="h-full">
      <body className="flex flex-col min-h-screen h-full">
        <ToastProvider>
          <div className="flex-1">{children}</div>
          <footer className="bg-gray-800 text-white py-2 px-4 text-center text-xs border-t border-gray-700 sticky bottom-0 z-50 flex-shrink-0">
            <p>&copy; {new Date().getFullYear()} ClearPath Orthdontics Pvt Ltd. All rights reserved.</p>
          </footer>
        </ToastProvider>
      </body>
    </html>
  )
}

