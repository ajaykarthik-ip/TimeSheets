import './globals.css'
import { ReactNode } from 'react'
import { AuthProvider } from './context/AuthContext'

export const metadata = {
  title: 'Timesheet Management System',
  description: 'A secure timesheet application',
}

interface RootLayoutProps {
  children: ReactNode
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}