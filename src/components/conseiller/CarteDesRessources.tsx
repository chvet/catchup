'use client'

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { DEPARTMENT_COORDS } from '@/lib/geo-departments'
import type { MapMarker } from '@/components/MapView'

const MapView = dynamic(() => import('@/components/MapView'), { ssr: false })

interface StructureInfo {
  id: string
  nom: string
  departements?: string[]
  conseillersActifs: number
  casPrisEnCharge: number
  casEnAttente: number
}

interface BeneficiaireGeo {
  id: string
  prenom: string
  localisation: string
  statut: string
  priorite: string
}

interface Props {
  structures: StructureInfo[]
}

export default function CarteDesRessources({ structures }: Props) {
  const [showStructures, setShowStructures] = useState(true)
  const [showBeneficiaires, setShowBeneficiaires] = useState(true)
  const [beneficiaires, setBeneficiaires] = useState<BeneficiaireGeo[]>([])
  const [loading, setLoading] = useState(true)

  // Charger les bénéficiaires avec localisation
  useEffect(() => {
    fetch('/api/conseiller/file-active?page=1&limit=500')
      .then(r => r.json())
      .then(data => {
        const refs = (data.data || []).filter((r: { localisation?: string }) => r.localisation)
        setBeneficiaires(refs.map((r: { id: string; prenom?: string; beneficiaire?: { prenom?: string }; localisation: string; statut: string; priorite: string }) => ({
          id: r.id,
          prenom: r.prenom || r.beneficiaire?.prenom || 'Anonyme',
          localisation: r.localisation,
          statut: r.statut,
          priorite: r.priorite,
        })))
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  // Construire les marqueurs
  const markers: MapMarker[] = []

  if (showStructures) {
    structures.forEach(s => {
      const deps = s.departements || []
      if (deps.length > 0) {
        const coord = DEPARTMENT_COORDS[deps[0]]
        if (coord) {
          markers.push({
            lat: coord.lat,
            lng: coord.lng,
            color: 'blue',
            label: s.nom,
            popup: `<strong>${s.nom}</strong><br/>${s.conseillersActifs} conseiller(s)<br/>${s.casPrisEnCharge} cas actifs<br/>${s.casEnAttente} en attente`,
          })
        }
      }
    })
  }

  if (showBeneficiaires) {
    beneficiaires.forEach(b => {
      const coord = DEPARTMENT_COORDS[b.localisation]
      if (coord) {
        // Décaler légèrement pour éviter la superposition
        const jitter = (Math.random() - 0.5) * 0.3
        const color = b.priorite === 'critique' ? 'red' : b.priorite === 'haute' ? 'red' : 'green'
        markers.push({
          lat: coord.lat + jitter,
          lng: coord.lng + jitter,
          color,
          label: b.prenom,
          popup: `<strong>${b.prenom}</strong><br/>Dept. ${b.localisation}<br/>Statut : ${b.statut}<br/>Priorité : ${b.priorite}`,
        })
      }
    })
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <h3 className="text-lg font-semibold text-gray-800">🗺️ Carte des ressources</h3>
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={showStructures}
              onChange={e => setShowStructures(e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
            />
            <span className="flex items-center gap-1 text-sm text-gray-600">
              <span className="inline-block w-3 h-3 rounded-full bg-blue-500 border border-white shadow-sm" />
              Structures ({structures.length})
            </span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={showBeneficiaires}
              onChange={e => setShowBeneficiaires(e.target.checked)}
              className="w-4 h-4 text-green-600 rounded border-gray-300 focus:ring-green-500"
            />
            <span className="flex items-center gap-1 text-sm text-gray-600">
              <span className="inline-block w-3 h-3 rounded-full bg-green-500 border border-white shadow-sm" />
              Bénéficiaires ({beneficiaires.length})
            </span>
          </label>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-[400px]">
          <div className="w-8 h-8 border-3 border-catchup-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <MapView markers={markers} height="400px" />
      )}

      <div className="flex items-center gap-4 mt-3 text-xs text-gray-400">
        <span className="flex items-center gap-1">
          <span className="inline-block w-2.5 h-2.5 rounded-full bg-blue-500" /> Structure
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-2.5 h-2.5 rounded-full bg-green-500" /> Bénéficiaire (normal)
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-2.5 h-2.5 rounded-full bg-red-500" /> Bénéficiaire (urgent)
        </span>
      </div>
    </div>
  )
}
