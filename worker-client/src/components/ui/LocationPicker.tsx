'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import {
  MapPin, Loader2, CheckCircle2, Search,
  Navigation, Maximize2, Minimize2, X, Check,
} from 'lucide-react'
import { Location } from '@/types'
import { cn } from '@/lib/utils'

interface LocationPickerProps {
  onSelect: (location: Location) => void
  defaultLocation?: Location
}

// ── Reverse geocode ──────────────────────────────────────
async function reverseGeocode(lat: number, lng: number): Promise<Location> {
  const res = await fetch(
    `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&zoom=18&addressdetails=1`,
    { headers: { 'Accept-Language': 'en' } }
  )
  const data = await res.json()
  return {
    lat,
    lng,
    address: data.display_name ?? `${lat.toFixed(5)}, ${lng.toFixed(5)}`,
    city:
      data.address?.city ??
      data.address?.town ??
      data.address?.village ??
      data.address?.county ??
      '',
  }
}

// ── Search suggestions ───────────────────────────────────
async function fetchSuggestions(q: string): Promise<any[]> {
  const res = await fetch(
    `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=5&countrycodes=in&addressdetails=1`,
    { headers: { 'Accept-Language': 'en' } }
  )
  return res.json()
}

// ── Build a Leaflet marker icon ──────────────────────────
function buildIcon(L: any) {
  return L.divIcon({
    className: '',
    html: `<div style="
      width:32px;height:32px;
      background:#16a34a;
      border-radius:50% 50% 50% 0;
      transform:rotate(-45deg);
      border:3px solid #fff;
      box-shadow:0 2px 8px rgba(0,0,0,0.3);
    "></div>`,
    iconSize:   [32, 32],
    iconAnchor: [16, 32],
  })
}

// ── Ensure Leaflet is loaded ─────────────────────────────
function ensureLeaflet(): Promise<any> {
  return new Promise((resolve) => {
    if ((window as any).L) { resolve((window as any).L); return }

    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link')
      link.id = 'leaflet-css'; link.rel = 'stylesheet'
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
      document.head.appendChild(link)
    }

    const script = document.createElement('script')
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
    script.onload = () => {
      const L = (window as any).L
      delete (L.Icon.Default.prototype as any)._getIconUrl
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      })
      resolve(L)
    }
    document.head.appendChild(script)
  })
}

// ════════════════════════════════════════════════════════
// Shared MapInstance — used by both inline and fullscreen
// ════════════════════════════════════════════════════════
interface MapInstanceProps {
  containerRef: React.RefObject<HTMLDivElement>
  defaultCenter: [number, number]
  defaultZoom: number
  onMapReady: (map: any, L: any) => void
  onCleanup?: () => void
}

// ════════════════════════════════════════════════════════
// Main component
// ════════════════════════════════════════════════════════
export function LocationPicker({ onSelect, defaultLocation }: LocationPickerProps) {
  // ── Inline map refs ──────────────────────────────────
  const inlineMapRef   = useRef<HTMLDivElement>(null)
  const inlineMap      = useRef<any>(null)
  const inlineMarker   = useRef<any>(null)

  // ── Fullscreen map refs ──────────────────────────────
  const fsMapRef       = useRef<HTMLDivElement>(null)
  const fsMap          = useRef<any>(null)
  const fsMarker       = useRef<any>(null)

  // ── State ────────────────────────────────────────────
  const [confirmed, setConfirmed]             = useState<Location | null>(defaultLocation ?? null)
  const [pending, setPending]                 = useState<Location | null>(defaultLocation ?? null)
  const [query, setQuery]                     = useState(defaultLocation?.address ?? '')
  const [suggestions, setSuggestions]         = useState<any[]>([])
  const [isLocating, setIsLocating]           = useState(false)
  const [isGeocoding, setIsGeocoding]         = useState(false)
  const [isFsGeocoding, setIsFsGeocoding]     = useState(false)
  const [isSearching, setIsSearching]         = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [mapReady, setMapReady]               = useState(false)
  const [isFullscreen, setIsFullscreen]       = useState(false)
  const [fsQuery, setFsQuery]                 = useState(defaultLocation?.address ?? '')
  const [fsSuggestions, setFsSuggestions]     = useState<any[]>([])
  const [showFsSuggestions, setShowFsSuggestions] = useState(false)
  const [isFsSearching, setIsFsSearching]     = useState(false)
  const searchTimer    = useRef<ReturnType<typeof setTimeout>>()
  const fsSearchTimer  = useRef<ReturnType<typeof setTimeout>>()

  const defaultCenter: [number, number] = defaultLocation
    ? [defaultLocation.lat, defaultLocation.lng]
    : [13.0827, 80.2707]

  // ── Place marker on a given map instance ─────────────
  const placeMarkerOn = useCallback(async (
    map: any,
    markerRef: React.MutableRefObject<any>,
    lat: number,
    lng: number,
    setGeocoding: (v: boolean) => void,
    onLocated: (loc: Location) => void,
  ) => {
    if (!map) return
    setGeocoding(true)
    try {
      const loc = await reverseGeocode(lat, lng)
      const L = (window as any).L
      if (markerRef.current) {
        markerRef.current.setLatLng([lat, lng])
      } else {
        markerRef.current = L.marker([lat, lng], { icon: buildIcon(L) }).addTo(map)
      }
      map.setView([lat, lng], 16, { animate: true })
      onLocated(loc)
    } catch { /* silent */ }
    finally { setGeocoding(false) }
  }, [])

  // ── Inline map: place marker + update confirmed ───────
  const placeInline = useCallback((lat: number, lng: number) => {
    placeMarkerOn(
      inlineMap.current, inlineMarker,
      lat, lng,
      setIsGeocoding,
      (loc) => { setConfirmed(loc); setPending(loc); setQuery(loc.address); onSelect(loc) },
    )
  }, [placeMarkerOn, onSelect])

  // ── Fullscreen map: place marker + update pending ─────
  const placeFullscreen = useCallback((lat: number, lng: number) => {
    placeMarkerOn(
      fsMap.current, fsMarker,
      lat, lng,
      setIsFsGeocoding,
      (loc) => { setPending(loc); setFsQuery(loc.address) },
    )
  }, [placeMarkerOn])

  // ── Init inline map ───────────────────────────────────
  useEffect(() => {
    if (inlineMap.current || !inlineMapRef.current) return
    ensureLeaflet().then((L) => {
      if (inlineMap.current || !inlineMapRef.current) return
      const map = L.map(inlineMapRef.current, {
        center: defaultCenter,
        zoom: defaultLocation ? 15 : 11,
        zoomControl: true,
        attributionControl: false,
      })
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(map)
      map.on('click', (e: any) => placeInline(e.latlng.lat, e.latlng.lng))
      inlineMap.current = map
      setMapReady(true)
      if (defaultLocation) placeInline(defaultLocation.lat, defaultLocation.lng)
    })
    return () => {
      inlineMap.current?.remove()
      inlineMap.current = null
      inlineMarker.current = null
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Init fullscreen map when modal opens ─────────────
  useEffect(() => {
    if (!isFullscreen) {
      fsMap.current?.remove()
      fsMap.current = null
      fsMarker.current = null
      return
    }

    const tryInit = () => {
      if (!fsMapRef.current || fsMap.current) return
      ensureLeaflet().then((L) => {
        if (!fsMapRef.current || fsMap.current) return
        const center = pending
          ? [pending.lat, pending.lng] as [number, number]
          : defaultCenter
        const map = L.map(fsMapRef.current, {
          center,
          zoom: pending ? 16 : 11,
          zoomControl: true,
          attributionControl: false,
        })
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(map)
        map.on('click', (e: any) => placeFullscreen(e.latlng.lat, e.latlng.lng))
        fsMap.current = map
        if (pending) {
          const m = L.marker([pending.lat, pending.lng], { icon: buildIcon(L) }).addTo(map)
          fsMarker.current = m
          setFsQuery(pending.address)
        }
      })
    }

    // Small delay so portal DOM is ready
    const t = setTimeout(tryInit, 80)
    return () => {
      clearTimeout(t)
      fsMap.current?.remove()
      fsMap.current = null
      fsMarker.current = null
    }
  }, [isFullscreen]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Confirm selection from fullscreen ─────────────────
  const handleFsConfirm = () => {
    if (!pending) return
    setConfirmed(pending)
    setQuery(pending.address)
    onSelect(pending)
    // Sync inline map marker
    if (inlineMap.current) {
      const L = (window as any).L
      if (inlineMarker.current) {
        inlineMarker.current.setLatLng([pending.lat, pending.lng])
      } else {
        inlineMarker.current = L.marker([pending.lat, pending.lng], { icon: buildIcon(L) }).addTo(inlineMap.current)
      }
      inlineMap.current.setView([pending.lat, pending.lng], 16, { animate: false })
    }
    setIsFullscreen(false)
  }

  // ── GPS ───────────────────────────────────────────────
  const handleGeolocate = (fullscreen = false) => {
    if (!navigator.geolocation) return
    setIsLocating(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocating(false)
        if (fullscreen) placeFullscreen(pos.coords.latitude, pos.coords.longitude)
        else placeInline(pos.coords.latitude, pos.coords.longitude)
      },
      () => setIsLocating(false),
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  // ── Inline search ─────────────────────────────────────
  const handleSearchInput = (val: string) => {
    setQuery(val)
    clearTimeout(searchTimer.current)
    if (val.length < 3) { setSuggestions([]); return }
    setIsSearching(true)
    searchTimer.current = setTimeout(async () => {
      try { const r = await fetchSuggestions(val); setSuggestions(r); setShowSuggestions(true) }
      catch { /* silent */ } finally { setIsSearching(false) }
    }, 400)
  }

  // ── Fullscreen search ─────────────────────────────────
  const handleFsSearchInput = (val: string) => {
    setFsQuery(val)
    clearTimeout(fsSearchTimer.current)
    if (val.length < 3) { setFsSuggestions([]); return }
    setIsFsSearching(true)
    fsSearchTimer.current = setTimeout(async () => {
      try { const r = await fetchSuggestions(val); setFsSuggestions(r); setShowFsSuggestions(true) }
      catch { /* silent */ } finally { setIsFsSearching(false) }
    }, 400)
  }

  // ── Shared suggestion click ───────────────────────────
  const pickSuggestion = (place: any, fullscreen: boolean) => {
    const lat = parseFloat(place.lat)
    const lng = parseFloat(place.lon)
    if (fullscreen) {
      setFsSuggestions([]); setShowFsSuggestions(false)
      placeFullscreen(lat, lng)
    } else {
      setSuggestions([]); setShowSuggestions(false)
      placeInline(lat, lng)
    }
  }

  // ── Search bar UI (reused in both modes) ──────────────
  const SearchBar = ({
    value, onChange, onFocus, onBlur,
    suggestions: suggs, showSugg, onSuggClick,
    searching, locating, onGps, fullscreen = false,
  }: {
    value: string
    onChange: (v: string) => void
    onFocus: () => void
    onBlur: () => void
    suggestions: any[]
    showSugg: boolean
    onSuggClick: (p: any) => void
    searching: boolean
    locating: boolean
    onGps: () => void
    fullscreen?: boolean
  }) => (
    <div className="flex gap-2">
      <div className="relative flex-1">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
        <input
          value={value}
          onChange={e => onChange(e.target.value)}
          onFocus={onFocus}
          onBlur={onBlur}
          placeholder="Search city, area or landmark..."
          className={cn(
            'w-full rounded-xl border border-slate-200 bg-white pl-10 pr-10 py-3 text-sm',
            'text-slate-900 placeholder:text-slate-400',
            'focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent',
            fullscreen && 'shadow-sm'
          )}
        />
        {searching && (
          <Loader2 className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 animate-spin pointer-events-none" />
        )}
        {showSugg && suggs.length > 0 && (
          <div className="absolute z-[99999] top-full left-0 right-0 mt-1 bg-white rounded-xl border border-slate-200 shadow-xl overflow-hidden">
            {suggs.map((s, i) => (
              <button
                key={i}
                type="button"
                onMouseDown={() => onSuggClick(s)}
                className="w-full text-left px-4 py-3 text-sm hover:bg-slate-50 flex items-start gap-2 border-b border-slate-100 last:border-0 transition-colors"
              >
                <MapPin className="w-3.5 h-3.5 text-brand-500 mt-0.5 shrink-0" />
                <span className="text-slate-700 leading-snug line-clamp-2">{s.display_name}</span>
              </button>
            ))}
          </div>
        )}
      </div>
      <button
        type="button"
        onClick={onGps}
        disabled={locating}
        title="Use GPS location"
        className="flex items-center gap-2 px-4 py-3 rounded-xl border border-slate-200 text-sm font-medium hover:bg-slate-50 transition-all whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed bg-white"
      >
        {locating
          ? <Loader2 className="w-4 h-4 animate-spin text-brand-600" />
          : <Navigation className="w-4 h-4 text-brand-600" />
        }
        <span className="hidden sm:inline">My location</span>
      </button>
    </div>
  )

  return (
    <>
      <div className="space-y-2">
        {/* ── Inline search bar ── */}
        <SearchBar
          value={query}
          onChange={handleSearchInput}
          onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          suggestions={suggestions}
          showSugg={showSuggestions}
          onSuggClick={p => pickSuggestion(p, false)}
          searching={isSearching}
          locating={isLocating}
          onGps={() => handleGeolocate(false)}
        />

        {/* ── Inline map ── */}
        <div className="relative rounded-xl overflow-hidden border border-slate-200" style={{ height: 240 }}>
          {/* Loading */}
          {!mapReady && (
            <div className="absolute inset-0 bg-slate-100 flex flex-col items-center justify-center z-10 gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-brand-500" />
              <p className="text-xs text-slate-500">Loading map...</p>
            </div>
          )}

          {/* Geocoding toast */}
          {isGeocoding && (
            <div className="absolute top-2 left-1/2 -translate-x-1/2 z-[1000] bg-white/95 border border-slate-200 rounded-lg px-3 py-1.5 flex items-center gap-2 shadow-sm">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-brand-600" />
              <span className="text-xs font-medium text-slate-700">Getting address...</span>
            </div>
          )}

          {/* Click-to-pin hint */}
          {mapReady && !confirmed && !isGeocoding && (
            <div className="absolute top-2 left-1/2 -translate-x-1/2 z-[1000] bg-white/95 border border-slate-200 rounded-lg px-3 py-1.5 shadow-sm pointer-events-none">
              <p className="text-xs font-medium text-slate-600 flex items-center gap-1.5 whitespace-nowrap">
                <MapPin className="w-3.5 h-3.5 text-brand-500" />
                Click on map to pin location
              </p>
            </div>
          )}

          {/* Fullscreen button */}
          {mapReady && (
            <button
              type="button"
              onClick={() => setIsFullscreen(true)}
              title="Open fullscreen map"
              className="absolute bottom-2 right-2 z-[1000] bg-white border border-slate-200 rounded-lg p-2 shadow-sm hover:bg-slate-50 transition-colors"
            >
              <Maximize2 className="w-4 h-4 text-slate-600" />
            </button>
          )}

          <div ref={inlineMapRef} style={{ width: '100%', height: '100%' }} />
        </div>

        {/* ── Confirmed location badge ── */}
        {confirmed && (
          <div className="flex items-start gap-2.5 px-3.5 py-3 bg-brand-50 rounded-xl border border-brand-100">
            <CheckCircle2 className="w-4 h-4 text-brand-600 mt-0.5 shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-brand-700">{confirmed.city || 'Location pinned'}</p>
              <p className="text-xs text-brand-600 mt-0.5 leading-relaxed line-clamp-2">{confirmed.address}</p>
              <p className="text-xs text-brand-400 mt-1 font-mono">{confirmed.lat.toFixed(6)}, {confirmed.lng.toFixed(6)}</p>
            </div>
            <button
              type="button"
              onClick={() => setIsFullscreen(true)}
              className="text-xs text-brand-600 font-medium hover:underline shrink-0 mt-0.5"
            >
              Change
            </button>
          </div>
        )}
      </div>

      {/* ════════════════════════════════════════════════
          Fullscreen modal — rendered via portal
      ════════════════════════════════════════════════ */}
      {isFullscreen && typeof document !== 'undefined' && createPortal(
        <div
          className="fixed inset-0 z-[99999] flex flex-col bg-white"
          style={{ animation: 'fadeIn 0.18s ease' }}
        >
          <style>{`@keyframes fadeIn{from{opacity:0}to{opacity:1}}`}</style>

          {/* ── Header bar ── */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-200 bg-white shrink-0 z-10">
            <div className="flex-1">
              <SearchBar
                value={fsQuery}
                onChange={handleFsSearchInput}
                onFocus={() => fsSuggestions.length > 0 && setShowFsSuggestions(true)}
                onBlur={() => setTimeout(() => setShowFsSuggestions(false), 200)}
                suggestions={fsSuggestions}
                showSugg={showFsSuggestions}
                onSuggClick={p => pickSuggestion(p, true)}
                searching={isFsSearching}
                locating={isLocating}
                onGps={() => handleGeolocate(true)}
                fullscreen
              />
            </div>
            <button
              type="button"
              onClick={() => { setPending(confirmed); setIsFullscreen(false) }}
              className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors shrink-0"
              title="Close"
            >
              <X className="w-5 h-5 text-slate-600" />
            </button>
          </div>

          {/* ── Instruction strip ── */}
          <div className="px-4 py-2 bg-brand-50 border-b border-brand-100 shrink-0 flex items-center gap-2">
            <MapPin className="w-3.5 h-3.5 text-brand-600 shrink-0" />
            <p className="text-xs font-medium text-brand-700">
              Click anywhere on the map to pin your exact location, then tap <strong>Confirm location</strong>
            </p>
          </div>

          {/* ── Map (fills remaining height) ── */}
          <div className="relative flex-1 min-h-0">
            {/* Geocoding overlay */}
            {isFsGeocoding && (
              <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[1000] bg-white/95 border border-slate-200 rounded-lg px-3 py-2 flex items-center gap-2 shadow-md">
                <Loader2 className="w-4 h-4 animate-spin text-brand-600" />
                <span className="text-sm font-medium text-slate-700">Getting address...</span>
              </div>
            )}
            <div ref={fsMapRef} style={{ width: '100%', height: '100%' }} />
          </div>

          {/* ── Bottom confirm bar ── */}
          <div className="px-4 py-4 border-t border-slate-200 bg-white shrink-0">
            {pending ? (
              <div className="flex items-start gap-3 mb-3">
                <CheckCircle2 className="w-4 h-4 text-brand-600 mt-0.5 shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-900">{pending.city || 'Location selected'}</p>
                  <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{pending.address}</p>
                  <p className="text-xs text-slate-400 mt-0.5 font-mono">{pending.lat.toFixed(6)}, {pending.lng.toFixed(6)}</p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-slate-400 mb-3 text-center">No location selected yet — tap the map</p>
            )}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => { setPending(confirmed); setIsFullscreen(false) }}
                className="flex-1 py-3 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleFsConfirm}
                disabled={!pending}
                className="flex-1 py-3 rounded-xl bg-brand-600 text-white text-sm font-medium hover:bg-brand-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Check className="w-4 h-4" />
                Confirm location
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  )
}
