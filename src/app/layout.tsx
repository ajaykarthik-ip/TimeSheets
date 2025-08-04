import './globals.css'
import { ReactNode } from 'react'

export const metadata = {
  title: 'My Frontend App',
  description: 'A simple Next.js application',
}

interface RootLayoutProps {
  children: ReactNode
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}