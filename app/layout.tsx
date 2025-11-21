import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Survey App - Create & Analyze Surveys',
  description: 'A modern survey platform for creating, sharing, and analyzing surveys',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="h-full">
      <body className="flex flex-col min-h-screen h-full">
        <div className="flex-1">{children}</div>
        <footer className="bg-gray-800 text-white py-2 px-4 text-center text-xs border-t border-gray-700 sticky bottom-0 z-50 flex-shrink-0">
          <p>&copy; {new Date().getFullYear()} ClearPath Orthdontics Pvt Ltd. All rights reserved.</p>
        </footer>
      </body>
    </html>
  )
}

