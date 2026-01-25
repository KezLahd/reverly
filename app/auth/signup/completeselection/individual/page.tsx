"use client"

import type React from "react"
import { Fragment } from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Toast } from "@/components/ui/toast"
import { Building2, Eye, EyeOff, Check, ChevronsUpDown, Loader2, AlertCircle, ArrowLeft } from "lucide-react"
import { getSupabase } from "@/lib/supabase"
import Link from "next/link"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Dialog, Transition } from "@headlessui/react"
import { v4 as uuidv4 } from "uuid"

export default function IndividualSignUpPage() {
  const [formData, setFormData] = useState({
    phoneNumber: "",
    marketingOptIn: false,
  })
  const [userInfo, setUserInfo] = useState<{ firstName: string; email: string } | null>(null);
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [agencies, setAgencies] = useState<any[]>([])
  const [selectedAgency, setSelectedAgency] = useState<any>(null)
  const [agencySearchOpen, setAgencySearchOpen] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const router = useRouter()

  useEffect(() => {
    // Check if user is already logged in and has confirmed email
    const checkUser = async () => {
      const supabase = getSupabase()
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Get first name and email for greeting
        setUserInfo({
          firstName: user.user_metadata?.first_name || '',
          email: user.email || '',
        });
        // Check if email is confirmed
        if (user.email_confirmed_at) {
          // Check if user_profiles row exists
          const { data: profile } = await supabase
            .from('reverly_user_profiles')
            .select('id')
            .eq('id', user.id)
            .single();
          const pathname = window.location.pathname;
          const isOnCompletion = pathname.startsWith('/auth/signup/completeselection');
          if (!profile && !isOnCompletion) {
            router.replace('/auth/signup/completeselection');
          } else if (profile) {
            // You may want to check payment status here and redirect accordingly
            router.replace('/dashboard');
          }
        }
      }
    };
    checkUser();

    // Fetch agencies
    const fetchAgencies = async () => {
      const { data, error } = await supabase.from("real_estate_agencies").select("*").order("name")
      if (data && !error) {
        setAgencies(data)
      }
    }
    fetchAgencies()
  }, [router])

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.phoneNumber) {
      setError("Please enter your phone number")
      return
    }
    setIsLoading(true)
    setError("")
    try {
      // Get the current user (should be confirmed)
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !user.email_confirmed_at) {
        setError("Please confirm your email before completing signup.");
        setIsLoading(false);
        return;
      }
      // Upsert into user_profiles
      const upsertData = {
        id: user.id,
        first_name: user.user_metadata?.first_name || '',
        last_name: user.user_metadata?.last_name || '',
        email: user.email,
        phone_number: formData.phoneNumber,
        user_type: "individual",
        selected_agency: selectedAgency?.name || null,
        agency_id: selectedAgency?.id || null,
        marketing_opt_in: formData.marketingOptIn,
        updated_at: new Date().toISOString(),
      };
      console.log("[v0] Individual upsert data:", upsertData);
      const { error: upsertError } = await supabase.from('user_profiles').upsert([upsertData]);
      if (upsertError) {
        console.error("[v0] Upsert error details:", upsertError);
        setError(`Database error: ${upsertError.message || "Failed to complete signup. Please try again."}`);
        setIsLoading(false);
        return;
      }
      // Always redirect to billing after successful upsert
      router.replace('/billing');
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <>
      {/* Success Modal Popup */}
      <Transition.Root show={showSuccessModal} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={setShowSuccessModal}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100"
            leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black bg-opacity-70 transition-opacity" />
          </Transition.Child>
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100"
              leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="bg-purple-600 text-white rounded-2xl shadow-2xl p-8 max-w-md w-full flex flex-col items-center">
                <h2 className="text-2xl font-bold mb-2">Email Sent! 🎉</h2>
                <p className="mb-4 text-center">We've sent you an email with a login link. Please check your inbox and click the link to access your account.</p>
                <button
                  onClick={() => setShowSuccessModal(false)}
                  className="mt-2 px-6 py-2 bg-white text-purple-700 font-semibold rounded hover:bg-purple-100 transition"
                >
                  Close
                </button>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition.Root>

      <div className="min-h-screen bg-gradient-to-br from-purple-100 via-purple-50 to-purple-100 flex items-center justify-center p-4">
        {/* Animated background elements - adjusted for lighter background */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-200/30 rounded-full animate-pulse"></div>
          <div
            className="absolute top-40 -left-40 w-60 h-60 bg-purple-300/20 rounded-full animate-pulse"
            style={{ animationDelay: "1s" }}
          ></div>
          <div
            className="absolute bottom-40 right-20 w-40 h-40 bg-purple-200/40 rounded-full animate-pulse"
            style={{ animationDelay: "2s" }}
          ></div>
        </div>

        <div className="relative w-full max-w-md">
          <div className="bg-purple-700 rounded-2xl shadow-2xl p-8 text-white">
            {/* Header */}
            <div className="text-center mb-8">
              <Button
                variant="ghost"
                onClick={() => router.push("/auth/signup/completeselection")}
                className="absolute top-4 left-4 p-2 text-white hover:bg-purple-600"
              >
                <ArrowLeft className="h-4 w-4 text-white" />
              </Button>

              <div className="flex items-center justify-center mb-4">
                <Building2 className="h-10 w-10 text-white mr-3" />
                <span className="text-3xl font-bold">Reverly</span>
              </div>
              <h1 className="text-2xl font-bold mb-4">Complete Your Profile</h1>
              {/* Greeting in white container */}
              {userInfo && (
                <div className="mb-4 bg-white rounded-xl px-4 py-3 shadow text-center">
                  <div className="text-lg font-semibold text-purple-700">Hi {userInfo.firstName || 'there'},</div>
                  <div className="text-sm text-purple-600">Your email <span className="font-mono font-semibold">{userInfo.email}</span> has been confirmed.</div>
                </div>
              )}
              <div className="mb-6"></div>
            </div>

            {/* Complete Profile Form */}
            <form onSubmit={handleSignUp} className="space-y-4">
              <p className="text-white mb-2 -mt-4">Add your phone number and select an agency.</p>
              {/* Phone */}
              <div className="space-y-1 mt-2">
                <Label htmlFor="phoneNumber" className="text-sm font-medium">
                  Phone Number
                </Label>
                <Input
                  id="phoneNumber"
                  type="tel"
                  placeholder="Phone number"
                  value={formData.phoneNumber}
                  onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                  className="h-10 border-purple-400 bg-white text-purple-900 placeholder:text-purple-400 focus:border-purple-500 focus:ring-purple-500"
                  disabled={isLoading}
                />
              </div>

              {/* Agency */}
              <div className="space-y-1">
                <Label className="text-sm font-medium">Agency <span className="text-xs text-purple-200 font-normal">(Optional)</span></Label>
                <Popover open={agencySearchOpen} onOpenChange={setAgencySearchOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      className={`w-full h-10 justify-between border-purple-400 bg-white text-purple-900 hover:bg-purple-100 hover:text-purple-900 ${!selectedAgency ? 'placeholder:text-purple-400 text-purple-400' : ''}`}
                      disabled={isLoading}
                    >
                      <span className={!selectedAgency ? 'text-purple-400' : 'truncate'}>{selectedAgency ? selectedAgency.name : "Select agency"}</span>
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[--radix-popover-trigger-width] p-0 bg-white text-purple-900 border-purple-400">
                    <Command className="bg-white text-purple-900">
                      <CommandInput placeholder="Search agencies..." className="placeholder:text-purple-400" />
                      <CommandList>
                        <CommandEmpty>No agency found.</CommandEmpty>
                        <CommandGroup>
                          {agencies.map((agency) => (
                            <CommandItem
                              key={agency.id}
                              value={agency.name}
                              onSelect={() => {
                                setSelectedAgency(agency)
                                setAgencySearchOpen(false)
                              }}
                              className="hover:bg-purple-100 data-[selected=true]:bg-purple-100"
                            >
                              <Check
                                className={`mr-2 h-4 w-4 ${
                                  selectedAgency?.id === agency.id ? "opacity-100" : "opacity-0"
                                }`}
                              />
                              <div>
                                <div className="font-medium text-purple-900">{agency.name}</div>
                                <div className="text-xs text-purple-500">{agency.location}</div>
                              </div>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              {/* Marketing Opt-In Checkbox */}
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="marketingOptIn"
                  checked={formData.marketingOptIn}
                  onCheckedChange={(checked) => setFormData({ ...formData, marketingOptIn: checked as boolean })}
                  disabled={isLoading}
                  className="bg-white border-white focus:ring-2 focus:ring-purple-300 data-[state=checked]:bg-white data-[state=checked]:text-purple-600"
                />
                <Label htmlFor="marketingOptIn" className="text-xs text-white leading-tight">
                  I would like to receive updates, news, and special offers via email.
                </Label>
              </div>

              {/* Error Alert */}
              {error && (
                <Alert variant="destructive" className="bg-red-500/20 border-red-400 text-white">
                  <AlertCircle className="h-4 w-4 text-red-300" />
                  <AlertDescription className="text-red-100">{error}</AlertDescription>
                </Alert>
              )}

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-12 bg-white hover:bg-purple-100 text-purple-800 font-semibold"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Completing Signup...
                  </>
                ) : (
                  "Complete Signup"
                )}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </>
  )
}
