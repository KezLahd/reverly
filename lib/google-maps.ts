let isLoading = false
let isLoaded = false
let loadPromise: Promise<void> | null = null

export function loadGoogleMaps(): Promise<void> {
  if (isLoaded) {
    return Promise.resolve()
  }

  if (loadPromise) {
    return loadPromise
  }

  loadPromise = new Promise((resolve, reject) => {
    if (isLoading) {
      return
    }

    isLoading = true

    if (window.google?.maps) {
      isLoaded = true
      isLoading = false
      resolve()
      return
    }

    window.initMap = () => {
      isLoaded = true
      isLoading = false
      resolve()
    }

    const script = document.createElement("script")
    script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY}&callback=initMap`
    script.async = true
    script.defer = true
    script.onerror = () => {
      isLoading = false
      loadPromise = null
      reject(new Error("Failed to load Google Maps"))
    }
    document.head.appendChild(script)
  })

  return loadPromise
}

declare global {
  interface Window {
    google: any
    initMap: () => void
  }
} 