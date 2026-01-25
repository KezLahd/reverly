"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Toast } from "@/components/ui/toast"
import { Building2, Eye, EyeOff, Loader2, AlertCircle, ArrowLeft, Users, Plus, Minus, ChevronsUpDown, Check } from "lucide-react" // Removed MapPin
import { getSupabase } from "@/lib/supabase"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { v4 as uuidv4 } from "uuid"
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Command, CommandInput, CommandList, CommandItem, CommandEmpty, CommandGroup } from '@/components/ui/command';

// Removed Google Places types declaration

// TypeScript declaration for window.google
// @ts-ignore
declare global {
  interface Window {
    google: any;
  }
}

export default function AgencySignUpForm() {
  const [formData, setFormData] = useState({
    phoneNumber: "",
    agencyName: "",
    agencyLocation: "",
    numberOfUsers: 2,
    agreedToTerms: false,
    selectedAgencyId: "",
    marketingOptIn: false,
  })
  const [userInfo, setUserInfo] = useState<{ firstName: string; email: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false)
  const [agencies, setAgencies] = useState<{ id: string; name: string; location: string }[]>([])
  const [showManualAgency, setShowManualAgency] = useState(false)
  const locationInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const { toast } = useToast()
  const [agencySearchOpen, setAgencySearchOpen] = useState(false);
  const [selectedAgency, setSelectedAgency] = useState<{ id: string; name: string; location: string } | null>(null);

  // Get the Google Places API key from the environment
  const GOOGLE_PLACES_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY

  const pricePerUser = 11.95
  const totalWeeklyPrice = formData.numberOfUsers * pricePerUser
  const totalMonthlyPrice = totalWeeklyPrice * 4.33 // Average weeks per month

  // Fetch agencies on mount
  useEffect(() => {
    const fetchAgencies = async () => {
      const { data, error } = await supabase
        .from('real_estate_agencies')
        .select('id, name, location')
        .order('name', { ascending: true })
      if (!error && data) setAgencies(data as { id: string; name: string; location: string }[])
    }
    fetchAgencies()
  }, [])

  useEffect(() => {
    // Check if user is already logged in and has confirmed email
    const checkUser = async () => {
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

    // Google Places Autocomplete logic
    function initAutocomplete() {
      if (window.google && locationInputRef.current) {
        const autocomplete = new window.google.maps.places.Autocomplete(locationInputRef.current, {
          types: ["(cities)"]
        })
        autocomplete.addListener("place_changed", () => {
          const place = autocomplete.getPlace()
          if (place && place.formatted_address) {
            setFormData((prev) => ({ ...prev, agencyLocation: place.formatted_address }))
          } else if (place && place.name) {
            setFormData((prev) => ({ ...prev, agencyLocation: place.name }))
          }
        })
      }
    }

    if (!window.google) {
      // Only add script if not already present
      const script = document.createElement("script")
      script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_PLACES_API_KEY}&libraries=places`;
      script.async = true
      script.onload = initAutocomplete
      document.body.appendChild(script)
    } else {
      initAutocomplete()
    }
  }, [router, GOOGLE_PLACES_API_KEY])

  // Removed initializeAutocomplete function

  const handleAgencySelect = (agency: { id: string; name: string; location: string } | null) => {
    if (!agency) {
      setShowManualAgency(true);
      setSelectedAgency(null);
      setFormData({ ...formData, selectedAgencyId: '', agencyName: '', agencyLocation: '' });
    } else {
      setShowManualAgency(false);
      setSelectedAgency(agency);
      setFormData({
        ...formData,
        selectedAgencyId: agency.id,
        agencyName: agency.name,
        agencyLocation: agency.location,
      });
    }
    setAgencySearchOpen(false);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.selectedAgencyId && !showManualAgency) {
      toast({
        title: "Select your agency",
        description: "Please select your agency or choose 'My agency isn't listed'.",
        variant: "destructive",
      });
      return;
    }
    if (showManualAgency && (!formData.agencyName || !formData.agencyLocation)) {
      toast({
        title: "Enter agency details",
        description: "Please enter your agency name and location.",
        variant: "destructive",
      });
      return;
    }
    if (formData.numberOfUsers < 2) {
      toast({
        title: "Not enough users",
        description: "Agency accounts require a minimum of 2 users.",
        variant: "destructive",
      });
      return;
    }
    setIsLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !user.email_confirmed_at) {
        toast({
          title: "Please confirm your email before completing signup.",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }
      let agencyIdToUse = formData.selectedAgencyId || null;
      // If manual agency, insert into real_estate_agencies and use new UUID
      if (showManualAgency && formData.agencyName && formData.agencyLocation) {
        const newAgencyId = uuidv4();
        const { error: agencyInsertError } = await supabase.from('real_estate_agencies').insert([
          {
            id: newAgencyId,
            name: formData.agencyName,
            location: formData.agencyLocation,
          }
        ]);
        if (agencyInsertError) {
          toast({
            title: "Failed to create agency.",
            description: agencyInsertError.message,
            variant: "destructive",
          });
          setIsLoading(false);
          return;
        }
        agencyIdToUse = newAgencyId;
      }
      // Prepare upsert object
      const upsertObj = {
        id: user.id,
        first_name: user.user_metadata?.first_name || 'Agency',
        last_name: user.user_metadata?.last_name || 'Owner',
        email: user.email,
        phone_number: formData.phoneNumber || null,
        user_type: "agency_member",
        agency_id: agencyIdToUse,
        agency_name: formData.agencyName || null,
        agency_location: formData.agencyLocation || null,
        is_agency_owner: true,
        number_of_users: Number(formData.numberOfUsers),
        marketing_opt_in: formData.marketingOptIn,
        updated_at: new Date().toISOString(),
      };
      console.log('Upsert object:', upsertObj);
      // Upsert into user_profiles
      const { error: upsertError } = await supabase.from('reverly_user_profiles').upsert([
        upsertObj
      ]);
      if (upsertError) {
        console.error("[v0] Upsert error details:", upsertError);
        toast({
          title: "Database error saving profile",
          description: upsertError.message || "Failed to complete signup. Please try again.",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }
      // Always redirect to billing after successful upsert
      router.replace('/billing');
    } catch (err) {
      toast({
        title: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  const adjustUserCount = (increment: boolean) => {
    const newCount = increment ? formData.numberOfUsers + 1 : formData.numberOfUsers - 1
    if (newCount >= 2 && newCount <= 100) {
      setFormData({ ...formData, numberOfUsers: newCount })
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
          <div className="grid md:grid-cols-2 gap-8">
            {/* Left Side - Form */}
            <div className="bg-white rounded-2xl shadow-2xl p-8">
              {/* Header */}
              <div className="text-center mb-8">
                <Button
                  variant="ghost"
                onClick={() => router.push("/auth/signup/completeselection")}
                  className="absolute top-4 left-4 p-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>

                <div className="flex items-center justify-center mb-4">
                  <Building2 className="h-10 w-10 text-purple-600 mr-3" />
                  <span className="text-3xl font-bold text-gray-900">Reverly</span>
                </div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Agency Account</h1>
              {/* Greeting in purple container */}
              {userInfo && (
                <div className="mb-4 bg-purple-700 rounded-xl px-4 py-3 shadow text-center">
                  <div className="text-lg font-semibold text-white">Hi {userInfo.firstName || 'there'},</div>
                  <div className="text-sm text-white">Your email <span className="font-mono font-semibold">{userInfo.email}</span> has been confirmed.</div>
                </div>
              )}
              </div>

              {/* Sign Up Form */}
              <form onSubmit={handleSignUp} className="space-y-4">
              <p className="text-black text-center mb-2">Create your enterprise real estate solution</p>
                {/* Phone */}
                <div className="space-y-2">
                  <Label htmlFor="phoneNumber" className="text-sm font-medium text-gray-700">
                    Phone Number
                  </Label>
                  <Input
                    id="phoneNumber"
                    type="tel"
                    placeholder="Phone number"
                    value={formData.phoneNumber}
                    onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                    className="h-10 border-gray-300 focus:border-purple-500 focus:ring-purple-500"
                    disabled={isLoading}
                  />
                </div>

              {/* Select Agency Searchable Popover */}
              <div className="space-y-2">
                <Label htmlFor="selectAgency" className="text-sm font-medium text-gray-700">
                  Select Agency
                </Label>
                <Popover open={agencySearchOpen} onOpenChange={setAgencySearchOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      className="w-full h-10 justify-between border-gray-300 bg-white text-black hover:border-purple-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 rounded-md shadow-sm"
                      disabled={isLoading}
                    >
                      <span className={`truncate text-left ${!selectedAgency && !showManualAgency ? 'text-gray-600' : 'text-black'}`}>
                        {selectedAgency
                          ? selectedAgency.name
                          : showManualAgency
                            ? "My agency isn't listed"
                            : "Select agency"}
                      </span>
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[--radix-popover-trigger-width] p-0 bg-white text-purple-700 rounded-lg shadow-lg border border-purple-100">
                    <Command>
                      <CommandInput placeholder="Search agencies..." className="text-purple-700 placeholder:text-purple-500" />
                      <CommandList>
                        <CommandEmpty>No agency found.</CommandEmpty>
                        <CommandGroup>
                          <CommandItem
                            value="manual"
                            onSelect={() => handleAgencySelect(null)}
                            className="cursor-pointer hover:bg-purple-50 text-purple-700"
                          >
                            <Check className={`mr-2 h-4 w-4 ${showManualAgency ? "opacity-100" : "opacity-0"}`} />
                            <div>
                              <div className="font-medium">My agency isn't listed</div>
                            </div>
                          </CommandItem>
                          {agencies.map((agency) => (
                            <CommandItem
                              key={agency.id}
                              value={agency.name}
                              onSelect={() => handleAgencySelect(agency)}
                              className="cursor-pointer hover:bg-gray-100 text-purple-800"
                            >
                              <Check
                                className={`mr-2 h-4 w-4 ${selectedAgency?.id === agency.id ? "opacity-100" : "opacity-0"}`}
                              />
                              <div>
                                <div className="font-medium">{agency.name}</div>
                                <div className="text-xs text-purple-400">{agency.location}</div>
                              </div>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              {/* Manual Agency Fields (only if not listed) */}
              {showManualAgency && (
                <>
                <div className="space-y-2">
                  <Label htmlFor="agencyName" className="text-sm font-medium text-gray-700">
                    Agency Name
                  </Label>
                  <Input
                    id="agencyName"
                    type="text"
                    placeholder="Your agency name"
                    value={formData.agencyName}
                    onChange={(e) => setFormData({ ...formData, agencyName: e.target.value })}
                    className="h-10 border-gray-300 focus:border-purple-500 focus:ring-purple-500"
                    disabled={isLoading}
                  />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="agencyLocation" className="text-sm font-medium text-gray-700">
                      Agency Location
                    </Label>
                    <Input
                      id="agencyLocation"
                      type="text"
                      placeholder="Enter suburb or address"
                      value={formData.agencyLocation}
                      onChange={(e) => setFormData({ ...formData, agencyLocation: e.target.value })}
                      className="h-10 border-gray-300 focus:border-purple-500 focus:ring-purple-500"
                      disabled={isLoading}
                    />
                  </div>
                </>
              )}

                {/* Number of Users */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">Number of Users (Minimum 2)</Label>
                  <div className="flex items-center space-x-4">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => adjustUserCount(false)}
                      disabled={formData.numberOfUsers <= 2 || isLoading}
                      className="h-10 w-10 p-0"
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <div className="flex-1 text-center">
                      <Input
                        type="number"
                        min="2"
                        max="100"
                        value={formData.numberOfUsers}
                        onChange={(e) => {
                          const value = Number.parseInt(e.target.value) || 2
                          if (value >= 2 && value <= 100) {
                            setFormData({ ...formData, numberOfUsers: value })
                          }
                        }}
                        className="h-10 text-center border-gray-300 focus:border-purple-500 focus:ring-purple-500"
                        disabled={isLoading}
                      />
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => adjustUserCount(true)}
                      disabled={formData.numberOfUsers >= 100 || isLoading}
                      className="h-10 w-10 p-0"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

              {/* Marketing Opt-In Checkbox */}
                <div className="flex items-center space-x-2">
                  <Checkbox
                  id="marketingOptIn"
                  checked={formData.marketingOptIn}
                  onCheckedChange={(checked) => setFormData({ ...formData, marketingOptIn: checked as boolean })}
                    disabled={isLoading}
                  />
                <Label htmlFor="marketingOptIn" className="text-xs text-gray-700 leading-tight">
                  I would like to receive updates, news, and special offers via email.
                  </Label>
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-12 bg-purple-600 hover:bg-purple-700 text-white font-semibold"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Creating Agency...
                    </>
                  ) : (
                    "Create Agency Account"
                  )}
                </Button>
              </form>
            </div>

            {/* Right Side - Pricing Summary */}
            <div className="space-y-6">
              <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white">
                <CardHeader>
                  <CardTitle className="flex items-center text-white">
                    <Users className="h-5 w-5 mr-2" />
                    Agency Pricing Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Price per user/week:</span>
                    <span className="font-semibold">${pricePerUser}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Number of users:</span>
                    <span className="font-semibold">{formData.numberOfUsers}</span>
                  </div>
                  <div className="border-t border-white/20 pt-4">
                    <div className="flex justify-between items-center text-lg">
                      <span>Weekly total:</span>
                      <span className="font-bold">${totalWeeklyPrice.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm text-white/80">
                      <span>Monthly estimate:</span>
                      <span>${totalMonthlyPrice.toFixed(2)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white">
                <CardHeader>
                  <CardTitle className="text-white">Agency Features</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3 text-sm">
                    <li className="flex items-center">
                      <div className="w-2 h-2 bg-purple-400 rounded-full mr-3"></div>
                      <span className="font-bold">Multi-user management dashboard</span>
                    </li>
                    <li className="flex items-center">
                      <div className="w-2 h-2 bg-purple-400 rounded-full mr-3"></div>
                      <span className="font-bold">Team performance analytics</span>
                    </li>
                    <li className="flex items-center">
                      <div className="w-2 h-2 bg-purple-400 rounded-full mr-3"></div>
                      <span className="font-bold">Centralized reporting & Agency-wide insights</span>
                    </li>
                    <li className="flex items-center">
                      <div className="w-2 h-2 bg-purple-400 rounded-full mr-3"></div>
                      User role & permission management
                    </li>
                    <li className="flex items-center">
                      <div className="w-2 h-2 bg-purple-400 rounded-full mr-3"></div>
                      Agency-wide client database access
                    </li>
                    <li className="flex items-center">
                      <div className="w-2 h-2 bg-purple-400 rounded-full mr-3"></div>
                      Admin-controlled data visibility
                    </li>
                    <li className="flex items-center">
                      <div className="w-2 h-2 bg-purple-400 rounded-full mr-3"></div>
                      Cross-agency contact tracking
                    </li>
                  </ul>
                </CardContent>
              </Card>

              <div className="text-center">
                <p className="text-white/80 text-sm">
                  Need help with setup?{" "}
                  <Link href="/contact" className="text-white hover:underline">
                    Contact our team
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
  )
}
