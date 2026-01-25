"use client"

import { useEffect, useRef, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Loader2 } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { loadGoogleMaps } from "@/lib/google-maps"

interface Contact {
  id: string
  first_name: string
  last_name: string
  address: string
  readiness_score: number
  last_contacted: string
}

interface ContactsMapProps {
  contacts: Contact[]
  className?: string
  defaultLocation?: {
    lat: number
    lng: number
    zoom?: number
  }
  fullControls?: boolean
}

interface GeocodingResult {
  geometry: {
    location: {
      lat: () => number
      lng: () => number
    }
  }
}

// Sydney coordinates as fallback
const SYDNEY_COORDS = { lat: -33.8688, lng: 151.2093, zoom: 12 }

// Light map style with purple accents, POI and transit hidden, custom water/land/park colors
const PURPLE_LIGHT_MAP_STYLE = [
  { elementType: 'labels.text.stroke', stylers: [{ color: '#ffffff' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#000000' }] },
  {
    featureType: 'administrative',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#bcb3e6' }],
  },
  // Hide all POI (places, businesses, parks, etc.)
  {
    featureType: 'poi',
    stylers: [{ visibility: 'off' }],
  },
  // Hide transit lines and stations
  {
    featureType: 'transit',
    stylers: [{ visibility: 'off' }],
  },
  // Urban areas: white
  {
    featureType: 'landscape.man_made',
    elementType: 'geometry',
    stylers: [{ color: '#ffffff' }],
  },
  // Grass/parks: a little less dark
  {
    featureType: 'landscape.natural',
    elementType: 'geometry',
    stylers: [{ color: '#e1c8fa' }],
  },
  {
    featureType: 'landscape.natural.terrain',
    elementType: 'geometry',
    stylers: [{ color: '#e1c8fa' }],
  },
  {
    featureType: 'poi.park',
    elementType: 'geometry',
    stylers: [{ color: '#e1c8fa' }],
  },
  // Roads
  {
    featureType: 'road',
    elementType: 'geometry',
    stylers: [{ color: '#e5e0f6' }],
  },
  {
    featureType: 'road',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#d1c4e9' }],
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry',
    stylers: [{ color: '#d1c4e9' }],
  },
  // Water: slightly darker purple
  {
    featureType: 'water',
    elementType: 'geometry',
    stylers: [{ color: '#a78bfa' }],
  },
  {
    featureType: 'water',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#000000' }],
  },
]

declare global {
  interface Window {
    google: any
    initMap: () => void
  }
}

export function ContactsMap({ contacts, className, defaultLocation, fullControls }: ContactsMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const [markers, setMarkers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [geocodingCache, setGeocodingCache] = useState<Record<string, { lat: number; lng: number }>>({})
  const [error, setError] = useState<string | null>(null)
  const [containerReady, setContainerReady] = useState(false)

  // Check if container is ready and visible
  useEffect(() => {
    let mounted = true
    let checkInterval: NodeJS.Timeout

    const checkContainer = () => {
      if (!mounted || !mapRef.current) return
      const rect = mapRef.current.getBoundingClientRect()
      const isVisible = rect.width > 0 && rect.height > 0
      if (isVisible) {
        setContainerReady(true)
        clearInterval(checkInterval)
      }
    }
    checkContainer()
    checkInterval = setInterval(checkContainer, 100)
    return () => {
      mounted = false
      clearInterval(checkInterval)
    }
  }, [])

  // Build map style based on fullControls
  const mapStyle = fullControls
    ? [
        { elementType: 'labels.text.stroke', stylers: [{ color: '#ffffff' }] },
        { elementType: 'labels.text.fill', stylers: [{ color: '#000000' }] },
        { featureType: 'administrative', elementType: 'geometry.stroke', stylers: [{ color: '#bcb3e6' }] },
        // Urban areas: bright white
        { featureType: 'landscape.man_made', elementType: 'geometry', stylers: [{ color: '#ffffff' }] },
        // Hide all POIs except parks
        { featureType: 'poi.business', stylers: [{ visibility: 'off' }] },
        { featureType: 'poi.attraction', stylers: [{ visibility: 'off' }] },
        { featureType: 'poi.medical', stylers: [{ visibility: 'off' }] },
        { featureType: 'poi.place_of_worship', stylers: [{ visibility: 'off' }] },
        { featureType: 'poi.school', stylers: [{ visibility: 'off' }] },
        { featureType: 'poi.sports_complex', stylers: [{ visibility: 'off' }] },
        // Water: purple
        { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#a78bfa' }] },
        { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#ffffff' }] },
      ]
    : [
        { elementType: 'labels.text.stroke', stylers: [{ color: '#ffffff' }] },
        { elementType: 'labels.text.fill', stylers: [{ color: '#000000' }] },
        { featureType: 'administrative', elementType: 'geometry.stroke', stylers: [{ color: '#bcb3e6' }] },
        // Urban areas: bright white
        { featureType: 'landscape.man_made', elementType: 'geometry', stylers: [{ color: '#ffffff' }] },
        // Hide all POIs
        { featureType: 'poi', stylers: [{ visibility: 'off' }] },
        // Water: purple
        { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#a78bfa' }] },
        { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#ffffff' }] },
      ]

  // Initialize Google Maps ONCE per mount
  useEffect(() => {
    let mounted = true
    async function initializeMap() {
      if (!mapRef.current || mapInstanceRef.current || !containerReady) return
      try {
        await loadGoogleMaps()
        if (!mounted || !mapRef.current) return
        const location = defaultLocation || SYDNEY_COORDS
        mapInstanceRef.current = new window.google.maps.Map(mapRef.current, {
          center: { lat: location.lat, lng: location.lng },
          zoom: location.zoom || 12,
          styles: mapStyle,
          zoomControl: true,
          mapTypeControl: !!fullControls,
          mapTypeId: fullControls ? 'roadmap' : undefined,
          streetViewControl: !!fullControls,
          fullscreenControl: !!fullControls,
        })
        setLoading(false)
      } catch (error) {
        setError(error instanceof Error ? error.message : "Failed to initialize map")
        setLoading(false)
      }
    }
    if (containerReady) {
      initializeMap()
    }
    return () => {
      mounted = false
      // Clean up map instance and markers
      if (mapInstanceRef.current) {
        // Remove all markers
        markers.forEach(marker => marker.setMap(null))
        mapInstanceRef.current = null
      }
    }
  }, [containerReady, defaultLocation, fullControls])

  // Geocode addresses and add markers (only after map is ready)
  useEffect(() => {
    if (!mapInstanceRef.current) return
    // Clear existing markers
    markers.forEach(marker => marker.setMap(null))
    setMarkers([])
    if (!contacts.length) {
      setLoading(false)
      return
    }
    const geocoder = new window.google.maps.Geocoder()
    const bounds = new window.google.maps.LatLngBounds()
    const newMarkers: any[] = []
    const processContact = async (contact: Contact) => {
      if (!contact.address) return
      if (geocodingCache[contact.address]) {
        const { lat, lng } = geocodingCache[contact.address]
        addMarker(contact, lat, lng)
        return
      }
      try {
        const result = await new Promise<GeocodingResult>((resolve, reject) => {
          geocoder.geocode({ address: contact.address }, (results: GeocodingResult[], status: string) => {
            if (status === "OK") resolve(results[0])
            else reject(status)
          })
        })
        const location = result.geometry.location
        const lat = location.lat()
        const lng = location.lng()
        setGeocodingCache(prev => ({ ...prev, [contact.address]: { lat, lng } }))
        addMarker(contact, lat, lng)
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error(`Geocoding failed for ${contact.address}:`, error)
      }
    }
    const addMarker = (contact: Contact, lat: number, lng: number) => {
      const position = { lat, lng }
      bounds.extend(position)
      const getMarkerColor = (score: number) => {
        if (score >= 80) return "#22c55e"
        if (score >= 50) return "#eab308"
        return "#ef4444"
      }
      const marker = new window.google.maps.Marker({
        position,
        map: mapInstanceRef.current,
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 8,
          fillColor: getMarkerColor(contact.readiness_score),
          fillOpacity: 0.7,
          strokeWeight: 2,
          strokeColor: "#ffffff",
        },
      })
      const infoWindow = new window.google.maps.InfoWindow({
        content: `
          <div class="p-2">
            <h3 class="font-semibold">${contact.first_name} ${contact.last_name}</h3>
            <p class="text-sm">Readiness: ${contact.readiness_score}/100</p>
            <p class="text-sm">Last Contacted: ${new Date(contact.last_contacted).toLocaleDateString()}</p>
          </div>
        `,
      })
      marker.addListener("click", () => {
        infoWindow.open(mapInstanceRef.current, marker)
      })
      newMarkers.push(marker)
    }
    const processContacts = async () => {
      for (const contact of contacts) {
        await new Promise(resolve => setTimeout(resolve, 100))
        await processContact(contact)
      }
      setMarkers(newMarkers)
      if (contacts.length > 0) {
        mapInstanceRef.current.fitBounds(bounds)
      }
      setLoading(false)
    }
    processContacts()
    // Cleanup markers on unmount
    return () => {
      newMarkers.forEach(marker => marker.setMap(null))
    }
  }, [contacts, geocodingCache])

  return (
    <Card className={className}>
      <CardContent className="p-0 h-full w-full">
        <div 
          ref={mapRef} 
          className="h-full w-full rounded-lg relative"
          style={{ position: 'relative' }}
        />
        {/* Overlay loading spinner or error as siblings, not children, of the map container */}
        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-10 rounded-lg">
            <p className="text-red-500">Error loading map: {error}</p>
          </div>
        )}
        {loading && !error && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-10 rounded-lg">
            <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
            <span className="ml-2 text-sm text-gray-500">Loading map...</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
} 