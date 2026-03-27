'use client'

import { useEffect, useRef } from 'react'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'

// === Types ===

export interface MapMarker {
  lat: number
  lng: number
  color: 'red' | 'blue' | 'green'
  label: string
  popup?: string
}

interface MapViewProps {
  markers: MapMarker[]
  center?: [number, number]
  zoom?: number
  height?: string
}

// === Icônes colorées via divIcon (pas de dépendance à des images externes) ===

function createColorIcon(color: 'red' | 'blue' | 'green'): L.DivIcon {
  return L.divIcon({
    className: '',
    html: `<div class="marker-${color}"></div>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7],
    popupAnchor: [0, -10],
  })
}

const ICONS: Record<string, L.DivIcon> = {
  red: createColorIcon('red'),
  blue: createColorIcon('blue'),
  green: createColorIcon('green'),
}

// === Composant interne pour auto-fit bounds ===

function FitBounds({ markers }: { markers: MapMarker[] }) {
  const map = useMap()
  const fitted = useRef(false)

  useEffect(() => {
    if (markers.length > 0 && !fitted.current) {
      const bounds = L.latLngBounds(markers.map(m => [m.lat, m.lng]))
      map.fitBounds(bounds, { padding: [30, 30], maxZoom: 12 })
      fitted.current = true
    }
  }, [markers, map])

  return null
}

// === Composant MapView ===

export default function MapView({
  markers,
  center = [46.6, 2.3],
  zoom = 6,
  height = '400px',
}: MapViewProps) {
  return (
    <MapContainer
      center={center}
      zoom={zoom}
      style={{ height, width: '100%', borderRadius: '0.75rem', zIndex: 0 }}
      scrollWheelZoom={false}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {markers.map((marker, idx) => (
        <Marker
          key={`${marker.lat}-${marker.lng}-${idx}`}
          position={[marker.lat, marker.lng]}
          icon={ICONS[marker.color] || ICONS.blue}
        >
          {(marker.popup || marker.label) && (
            <Popup>
              <div className="text-sm">
                <strong>{marker.label}</strong>
                {marker.popup && <p className="mt-1 text-gray-600">{marker.popup}</p>}
              </div>
            </Popup>
          )}
        </Marker>
      ))}
      <FitBounds markers={markers} />
    </MapContainer>
  )
}
