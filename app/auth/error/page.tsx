"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { AlertCircle, RefreshCw } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function AuthErrorPage() {
  const searchParams = useSearchParams()
  const [email, setEmail] = useState<string | null>(null)
  const [isResending, setIsResending] = useState(false)
  const [resendMessage, setResendMessage] = useState("")
  
  const error = searchParams.get("error")
  const errorCode = searchParams.get("error_code")
  const errorDescription = searchParams.get("error_description")

  useEffect(() => {
    // Try to get the email from the URL if it exists
    const emailParam = searchParams.get("email")
    if (emailParam) {
      setEmail(emailParam)
    }
  }, [searchParams])

  const handleResendEmail = async () => {
    if (!email) return
    
    setIsResending(true)
    setResendMessage("")
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: email,
        options: {
          emailRedirectTo: 'https://reverly.mjsons.net/auth/signup/completeselection',
        },
      })
      
      if (error) {
        if (error.message.includes('Too Many Requests')) {
          setResendMessage("Too many attempts. Please wait a few minutes before trying again.")
        } else {
          setResendMessage("Failed to resend email. Please try again.")
        }
      } else {
        setResendMessage("New confirmation email sent! Please check your inbox.")
      }
    } catch (err) {
      setResendMessage("An error occurred. Please try again.")
    } finally {
      setIsResending(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 via-purple-50 to-purple-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Verification Link Expired</h1>
          
          {errorCode === "otp_expired" ? (
            <>
              <p className="text-gray-600 mb-6">
                The verification link in your email has expired. This usually happens if the link is more than 24 hours old.
              </p>
              {email ? (
                <div className="space-y-4">
                  <Button
                    onClick={handleResendEmail}
                    disabled={isResending}
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                  >
                    {isResending ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Sending New Email...
                      </>
                    ) : (
                      "Send New Verification Email"
                    )}
                  </Button>
                  {resendMessage && (
                    <p className={`text-sm ${resendMessage.includes("sent") ? "text-green-600" : "text-red-600"}`}>
                      {resendMessage}
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-gray-600 mb-4">
                  Please try signing up again to receive a new verification email.
                </p>
              )}
            </>
          ) : (
            <p className="text-gray-600 mb-6">
              {errorDescription || "An error occurred during the verification process."}
            </p>
          )}
          
          <div className="mt-6 space-y-3">
            <Link 
              href="/auth/signup"
              className="block w-full px-4 py-2 text-center text-purple-600 hover:text-purple-700 font-medium"
            >
              Back to Sign Up
            </Link>
            <Link 
              href="/auth/signin"
              className="block w-full px-4 py-2 text-center text-purple-600 hover:text-purple-700 font-medium"
            >
              Go to Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
} 