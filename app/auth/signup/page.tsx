"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Building2,
  BarChart3,
  PieChart,
  LineChart,
  Loader2,
  AlertCircle,
  CheckCircle2,
  ArrowLeft,
} from "lucide-react"
import { getSupabase } from "@/lib/supabase"
import Link from "next/link"
import { GlowButton } from "@/components/glow-button"

interface UserStatus {
  exists: boolean;
  is_verified: boolean;
}

function getResendAttempts(email: string) {
  if (!email) return 0;
  const key = `resendAttempts_${email}`;
  const attempts = localStorage.getItem(key);
  return attempts ? parseInt(attempts, 10) : 0;
}

function setResendAttempts(email: string, count: number) {
  if (!email) return;
  const key = `resendAttempts_${email}`;
  localStorage.setItem(key, count.toString());
}

export default function SignUpPage() {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    agreedToTerms: false,
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [showSuccess, setShowSuccess] = useState(false)
  const [successType, setSuccessType] = useState<'new' | 'unverified' | 'verified' | null>(null)
  const [resendLoading, setResendLoading] = useState(false)
  const [resendMessage, setResendMessage] = useState("")
  const router = useRouter()

  // Reset success states when email changes
  useEffect(() => {
    if (formData.email) {
      setShowSuccess(false);
      setSuccessType(null);
      setResendMessage("");
    }
  }, [formData.email]);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Reset states
    setError("")
    setShowSuccess(false)
    setSuccessType(null)
    setResendMessage("")

    // Validation checks
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.password || !formData.confirmPassword) {
      setError("Please fill in all required fields")
      return
    }
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match")
      return
    }
    if (formData.password.length < 8) {
      setError("Password must be at least 8 characters long")
      return
    }
    if (!formData.agreedToTerms) {
      setError("Please agree to the Terms & Conditions")
      return
    }
    
    setIsLoading(true)
    
    try {
      const supabase = getSupabase()
      // Note: Skipping RPC check - auth will handle duplicate emails
      // Proceed directly with sign up
      const { error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (signUpError) {
        console.error("[v0] Sign up error:", signUpError);
        // Handle specific errors
        if (signUpError.message.includes('User already registered')) {
          setSuccessType('unverified');
          setShowSuccess(true);
        } else {
          setError(signUpError.message || "An unknown error occurred.");
      }
      } else {
        // New user created successfully
        setSuccessType('new');
        setShowSuccess(true);
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const clearForm = () => {
    setFormData({
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      confirmPassword: "",
      agreedToTerms: false,
    });
    setShowSuccess(false);
    setSuccessType(null);
    setResendMessage("");
  };

  const handleResendEmail = async () => {
    const attempts = getResendAttempts(formData.email);
    if (attempts >= 2) {
      setResendMessage("Maximum resend attempts reached. Please try a different email address.");
      setTimeout(clearForm, 2000); // Clear form after 2 seconds
      return;
    }

    setResendLoading(true);
    setResendMessage("");
    
    try {
      const supabase = getSupabase()
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: formData.email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      
      if (error) {
        console.error("[v0] Resend error:", error);
        if (error.message.includes('Too Many Requests')) {
          setResendMessage("Too many attempts. Please wait a few minutes before trying again.");
        } else {
          setResendMessage("Failed to resend email. Please try again.");
        }
      } else {
        const currentAttempts = getResendAttempts(formData.email);
        setResendAttempts(formData.email, currentAttempts + 1);
        setResendMessage("New confirmation email sent! Check your inbox.");
        
        // If this was the second attempt, clear the form after a delay
        if (currentAttempts + 1 >= 2) {
          setTimeout(clearForm, 2000);
    }
  }
    } catch (err) {
      setResendMessage("Failed to resend email. Please try again.");
    } finally {
      setResendLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 flex items-center justify-center p-4">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none select-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-400/10 rounded-full animate-pulse"></div>
        <div className="absolute top-40 -left-40 w-60 h-60 bg-indigo-400/10 rounded-full animate-pulse" style={{ animationDelay: "1s" }}></div>
        <div className="absolute bottom-40 right-20 w-40 h-40 bg-purple-400/15 rounded-full animate-pulse" style={{ animationDelay: "2s" }}></div>
      </div>
      <div className="relative w-full max-w-4xl z-10">
        <div className="grid md:grid-cols-2 gap-6 items-center">
          {/* Left Side - Analytics/Branding */}
          <div className="hidden md:flex flex-col justify-center items-center bg-gradient-to-br from-purple-800 to-indigo-800 rounded-2xl shadow-2xl p-6 min-h-[540px] max-h-[600px]">
            <div className="flex flex-col items-center mb-6">
              <Building2 className="h-10 w-10 text-white mb-2" />
              <span className="text-3xl font-bold text-white">Reverly</span>
              <div className="text-lg font-semibold text-white mt-2">Real Estate, Cleverly.</div>
          </div>
            <div className="w-full flex flex-col gap-4">
              {/* Bar Chart */}
              <div className="bg-white/10 rounded-2xl p-4 shadow-lg flex flex-col items-center">
                <div className="flex items-center mb-1">
                  <BarChart3 className="h-6 w-6 text-white mr-2" />
                  <span className="text-base font-bold tracking-tight text-white">Market Activity</span>
        </div>
                <svg width="140" height="40" viewBox="0 0 180 60" fill="none">
                  <rect x="10" y="30" width="15" height="20" rx="4" fill="#a78bfa" />
                  <rect x="35" y="20" width="15" height="30" rx="4" fill="#c4b5fd" />
                  <rect x="60" y="10" width="15" height="40" rx="4" fill="#818cf8" />
                  <rect x="85" y="25" width="15" height="25" rx="4" fill="#a5b4fc" />
                  <rect x="110" y="35" width="15" height="15" rx="4" fill="#6366f1" />
                  <rect x="135" y="18" width="15" height="32" rx="4" fill="#7c3aed" />
                </svg>
                <div className="text-xs text-white mt-1">Weekly Sales Volume</div>
                  </div>
              {/* Line Chart */}
              <div className="bg-white/10 rounded-2xl p-4 shadow-lg flex flex-col items-center">
                <div className="flex items-center mb-1">
                  <LineChart className="h-6 w-6 text-white mr-2" />
                  <span className="text-base font-bold tracking-tight text-white">Price Trends</span>
                </div>
                <svg width="140" height="40" viewBox="0 0 180 60" fill="none">
                  <polyline points="0,50 20,40 40,45 60,30 80,35 100,15 120,25 140,10 160,20 180,5" stroke="#fff" strokeWidth="3" fill="none" />
                  <circle cx="180" cy="5" r="4" fill="#a78bfa" />
                </svg>
                <div className="text-xs text-white mt-1">12-Month Median</div>
                    </div>
              {/* Donut Chart */}
              <div className="bg-white/10 rounded-2xl p-4 shadow-lg flex flex-col items-center">
                <div className="flex items-center mb-1">
                  <PieChart className="h-6 w-6 text-white mr-2" />
                  <span className="text-base font-bold tracking-tight text-white">Buyer Types</span>
                    </div>
                <svg width="60" height="60" viewBox="0 0 80 80">
                  <circle r="32" cx="40" cy="40" fill="#ede9fe" />
                  <path d="M40 8 A32 32 0 0 1 72 40" stroke="#a78bfa" strokeWidth="12" fill="none" />
                  <path d="M72 40 A32 32 0 0 1 40 72" stroke="#818cf8" strokeWidth="12" fill="none" />
                  <path d="M40 72 A32 32 0 0 1 8 40" stroke="#6366f1" strokeWidth="12" fill="none" />
                  <path d="M8 40 A32 32 0 0 1 40 8" stroke="#7c3aed" strokeWidth="12" fill="none" />
                </svg>
                <div className="flex gap-2 text-xs text-white mt-1">
                  <span className="inline-block w-2 h-2 rounded-full bg-[#a78bfa] mr-1" /> Investors
                  <span className="inline-block w-2 h-2 rounded-full bg-[#818cf8] mr-1" /> First Home
                  <span className="inline-block w-2 h-2 rounded-full bg-[#6366f1] mr-1" /> Upsizers
                  <span className="inline-block w-2 h-2 rounded-full bg-[#7c3aed] mr-1" /> Downsizers
                </div>
              </div>
            </div>
        </div>
          {/* Right Side - Sign Up Form */}
          <div className="bg-white rounded-2xl shadow-2xl p-6 md:p-8 relative min-h-[540px] max-h-[600px] flex flex-col justify-center">
            {/* Back Button */}
            <Link href="/" className="absolute top-4 left-4 p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors">
              <ArrowLeft className="h-5 w-5 text-gray-600" />
            </Link>
            {/* Header */}
            <div className="text-center mb-4 mt-8">
              <h1 className="text-2xl font-bold text-gray-900 mb-1">Create your account</h1>
              <p className="text-gray-600">Start your real estate journey</p>
            </div>
            <form onSubmit={handleSignUp} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="firstName" className="text-sm font-medium text-gray-700">First Name</Label>
                  <Input id="firstName" type="text" placeholder="First name" value={formData.firstName} onChange={e => setFormData({ ...formData, firstName: e.target.value })} className="h-10 border-gray-300 focus:border-purple-500 focus:ring-purple-500" disabled={isLoading} />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="lastName" className="text-sm font-medium text-gray-700">Last Name</Label>
                  <Input id="lastName" type="text" placeholder="Last name" value={formData.lastName} onChange={e => setFormData({ ...formData, lastName: e.target.value })} className="h-10 border-gray-300 focus:border-purple-500 focus:ring-purple-500" disabled={isLoading} />
                </div>
              </div>
              <div className="space-y-1">
                <Label htmlFor="email" className="text-sm font-medium text-gray-700">Email</Label>
                <Input id="email" type="email" placeholder="Enter your email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} className="h-10 border-gray-300 focus:border-purple-500 focus:ring-purple-500" disabled={isLoading} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="password" className="text-sm font-medium text-gray-700">Password</Label>
                  <Input id="password" type="password" placeholder="Password" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} className="h-10 border-gray-300 focus:border-purple-500 focus:ring-purple-500" disabled={isLoading} />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">Confirm Password</Label>
                  <Input id="confirmPassword" type="password" placeholder="Confirm password" value={formData.confirmPassword} onChange={e => setFormData({ ...formData, confirmPassword: e.target.value })} className="h-10 border-gray-300 focus:border-purple-500 focus:ring-purple-500" disabled={isLoading} />
                </div>
              </div>
              <div className="flex items-center space-x-2 mt-1">
                <Checkbox id="terms" checked={formData.agreedToTerms} onCheckedChange={checked => setFormData({ ...formData, agreedToTerms: checked as boolean })} disabled={isLoading} />
                <Label htmlFor="terms" className="text-sm text-gray-600">
                  I agree to the {" "}
                  <Link href="/terms" className="text-purple-600 hover:underline">Terms & Conditions</Link>
                </Label>
              </div>
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              <GlowButton type="submit" disabled={isLoading} className="w-full h-11 font-semibold text-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-md rounded-lg transition mt-1">
                {isLoading ? (<><Loader2 className="h-4 w-4 mr-2 animate-spin" />Creating Account...</>) : ("Sign up")}
              </GlowButton>
              <div className="text-center text-sm text-gray-600 mt-1">
                Already have an account? {" "}
                <Link href="/auth/signin" className="text-purple-600 hover:underline font-medium">Sign in</Link>
              </div>
            </form>
            {/* Success Modal Popup */}
            {showSuccess && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full flex flex-col items-center animate-fade-in">
                  {successType === 'new' && (
                    <>
                      <CheckCircle2 className="h-12 w-12 text-green-500 mb-4 animate-bounce-in" />
                      <h2 className="text-2xl font-bold mb-2 text-gray-900">Email Sent! 🎉</h2>
                      <p className="mb-4 text-center text-gray-700">We've sent you an email with a confirmation link. Please check your inbox and click the link to activate your account.</p>
                      <button onClick={() => setShowSuccess(false)} className="mt-2 px-6 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold rounded hover:from-purple-700 hover:to-indigo-700 transition">
                        Close
                      </button>
                      <div className="mt-4 text-sm text-gray-700 text-center">
                        {getResendAttempts(formData.email) < 2 ? (
                          <>
                            Didn't receive an email?{' '}
                            <button
                              onClick={handleResendEmail}
                              className="underline text-purple-600 hover:text-purple-800 disabled:opacity-60"
                              disabled={resendLoading}
                            >
                              {resendLoading ? 'Resending...' : 'Resend'}
                            </button>
                            {resendMessage && <div className="mt-2 text-xs text-purple-700">{resendMessage}</div>}
                          </>
                        ) : (
                          <div className="space-y-2">
                            <p className="text-red-600">Maximum resend attempts reached.</p>
                            <button 
                              onClick={clearForm}
                              className="text-purple-600 hover:text-purple-800 font-medium"
                            >
                              Try a different email address
                            </button>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                  
                  {successType === 'unverified' && (
                    <>
                      <AlertCircle className="h-12 w-12 text-yellow-500 mb-4" />
                      <h2 className="text-2xl font-bold mb-2 text-gray-900">Account Pending</h2>
                      <p className="mb-4 text-center text-gray-700">
                        We found an unverified account with this email. Please check your inbox for a previous confirmation email and follow the instructions to complete your signup.
                      </p>
                      <button onClick={() => setShowSuccess(false)} className="mt-2 px-6 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold rounded hover:from-purple-700 hover:to-indigo-700 transition">
                        Close
                      </button>
                      <div className="mt-4 text-sm text-gray-700 text-center">
                        {getResendAttempts(formData.email) < 2 ? (
                          <>
                            Can't find the email?{' '}
                            <button
                              onClick={handleResendEmail}
                              className="underline text-purple-600 hover:text-purple-800 disabled:opacity-60"
                              disabled={resendLoading}
                            >
                              {resendLoading ? 'Sending...' : 'Request New Email'}
                            </button>
                            {resendMessage && (
                              <p className={`mt-2 text-xs ${resendMessage.includes("sent") ? "text-green-600" : "text-red-600"}`}>
                                {resendMessage}
                              </p>
                            )}
                          </>
                        ) : (
                          <div className="space-y-2">
                            <p className="text-red-600">Maximum resend attempts reached.</p>
                            <Link 
                              href="/auth/signup" 
                              className="text-purple-600 hover:text-purple-800 font-medium"
                              onClick={() => setShowSuccess(false)}
                            >
                              Try a different email address
            </Link>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                  
                  {successType === 'verified' && (
                    <>
                      <AlertCircle className="h-12 w-12 text-blue-500 mb-4" />
                      <h2 className="text-2xl font-bold mb-2 text-gray-900">Account Exists</h2>
                      <p className="mb-4 text-center text-gray-700">
                        An account with this email already exists.<br />
                        If you haven't verified your email, check your inbox or resend the confirmation email.<br />
                        Otherwise, please sign in to access your account.
                      </p>
                      <div className="flex flex-col gap-2 w-full">
                        <Link href="/auth/signin" className="px-6 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold rounded hover:from-purple-700 hover:to-indigo-700 transition text-center">
                          Go to Sign In
                        </Link>
                        <button
                          onClick={handleResendEmail}
                          className="px-6 py-2 bg-white border border-purple-300 text-purple-700 font-semibold rounded hover:bg-purple-50 transition disabled:opacity-60"
                          disabled={resendLoading}
                        >
                          {resendLoading ? 'Resending...' : 'Resend Confirmation Email'}
                        </button>
                        {resendMessage && <div className="mt-2 text-xs text-purple-700 text-center">{resendMessage}</div>}
                        <button onClick={() => setShowSuccess(false)} className="mt-2 text-sm text-gray-600 hover:text-gray-800">
                          Close
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      <style jsx global>{`
        @keyframes fade-in {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease;
        }
        @keyframes bounce-in {
          0% { transform: scale(0.5); }
          60% { transform: scale(1.2); }
          100% { transform: scale(1); }
        }
        .animate-bounce-in {
          animation: bounce-in 0.5s cubic-bezier(.68,-0.55,.27,1.55);
        }
      `}</style>
    </div>
  )
}
