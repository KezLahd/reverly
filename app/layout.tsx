import type React from "react"
import "./globals.css"
import { Inter } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { AuthListener } from "@/components/auth-listener"

const inter = Inter({ subsets: ["latin"] })

export const metadata = {
  title: "Reverly SaaS Landing Page",
  description: "A modern SaaS landing page built with Next.js and Tailwind CSS.",
    generator: 'v0.dev'
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  // Removed googlePlacesApiKey and the script tag
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <AuthListener />
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}
