'use client'

import { useState, useMemo } from 'react'

// === Types ===

interface StructureMapData {
  id: string
  nom: string
  departements: string[]
  casEnAttente: number
  casPrisEnCharge: number
  casTermines: number
}

interface RegionData {
  nom: string
  slug: string
  beneficiaires: number
  structures: StructureMapData[]
  casEnAttente: number
}

interface FranceMapProps {
  structures: StructureMapData[]
}

// === Mapping département → région ===

const DEPARTEMENTS_PAR_REGION: Record<string, string[]> = {
  'ile-de-france': ['75', '77', '78', '91', '92', '93', '94', '95'],
  'hauts-de-france': ['02', '59', '60', '62', '80'],
  'grand-est': ['08', '10', '51', '52', '54', '55', '57', '67', '68', '88'],
  'normandie': ['14', '27', '50', '61', '76'],
  'bretagne': ['22', '29', '35', '56'],
  'pays-de-la-loire': ['44', '49', '53', '72', '85'],
  'centre-val-de-loire': ['18', '28', '36', '37', '41', '45'],
  'bourgogne-franche-comte': ['21', '25', '39', '58', '70', '71', '89', '90'],
  'nouvelle-aquitaine': ['16', '17', '19', '23', '24', '33', '40', '47', '64', '79', '86', '87'],
  'occitanie': ['09', '11', '12', '30', '31', '32', '34', '46', '48', '65', '66', '81', '82'],
  'auvergne-rhone-alpes': ['01', '03', '07', '15', '26', '38', '42', '43', '63', '69', '73', '74'],
  'provence-alpes-cote-d-azur': ['04', '05', '06', '13', '83', '84'],
  'corse': ['2A', '2B'],
}

const REGION_PAR_DEPARTEMENT: Record<string, string> = {}
for (const [region, deps] of Object.entries(DEPARTEMENTS_PAR_REGION)) {
  for (const dep of deps) {
    REGION_PAR_DEPARTEMENT[dep] = region
  }
}

// === Noms affichés ===

const REGION_NOMS: Record<string, string> = {
  'ile-de-france': 'Île-de-France',
  'hauts-de-france': 'Hauts-de-France',
  'grand-est': 'Grand Est',
  'normandie': 'Normandie',
  'bretagne': 'Bretagne',
  'pays-de-la-loire': 'Pays de la Loire',
  'centre-val-de-loire': 'Centre-Val de Loire',
  'bourgogne-franche-comte': 'Bourgogne-Franche-Comté',
  'nouvelle-aquitaine': 'Nouvelle-Aquitaine',
  'occitanie': 'Occitanie',
  'auvergne-rhone-alpes': 'Auvergne-Rhône-Alpes',
  'provence-alpes-cote-d-azur': 'Provence-Alpes-Côte d\'Azur',
  'corse': 'Corse',
}

// === Centre approximatif de chaque région (pour placer les markers) ===

const REGION_CENTERS: Record<string, [number, number]> = {
  'ile-de-france': [310, 195],
  'hauts-de-france': [305, 105],
  'grand-est': [420, 170],
  'normandie': [220, 155],
  'bretagne': [115, 195],
  'pays-de-la-loire': [170, 265],
  'centre-val-de-loire': [270, 265],
  'bourgogne-franche-comte': [400, 270],
  'nouvelle-aquitaine': [210, 370],
  'occitanie': [300, 440],
  'auvergne-rhone-alpes': [400, 370],
  'provence-alpes-cote-d-azur': [470, 420],
  'corse': [530, 470],
}

// === SVG Paths simplifiés pour les 13 régions métropolitaines ===

const REGION_PATHS: Record<string, string> = {
  'hauts-de-france':
    'M265,55 L290,50 L330,55 L355,70 L360,100 L345,130 L310,140 L280,135 L255,120 L250,90 Z',
  'normandie':
    'M165,110 L215,105 L255,120 L280,135 L275,165 L240,175 L205,185 L175,175 L150,155 L140,130 Z',
  'ile-de-france':
    'M280,165 L310,160 L335,170 L340,195 L330,215 L305,220 L280,210 L270,190 Z',
  'grand-est':
    'M355,100 L390,85 L430,90 L465,110 L470,150 L460,190 L435,215 L400,225 L370,215 L345,195 L340,165 L345,130 Z',
  'bretagne':
    'M60,165 L95,155 L135,160 L165,175 L170,200 L155,220 L120,230 L85,225 L55,210 L45,190 Z',
  'pays-de-la-loire':
    'M120,230 L155,220 L175,225 L205,235 L220,260 L215,290 L190,305 L155,300 L125,285 L110,260 Z',
  'centre-val-de-loire':
    'M220,210 L270,205 L305,220 L315,250 L305,280 L275,295 L245,300 L220,290 L215,260 Z',
  'bourgogne-franche-comte':
    'M340,215 L370,210 L400,225 L435,235 L450,260 L440,295 L415,310 L380,305 L355,290 L335,265 L330,240 Z',
  'nouvelle-aquitaine':
    'M130,305 L190,305 L220,310 L245,325 L260,360 L250,400 L235,430 L210,445 L175,440 L145,420 L125,390 L115,355 L120,330 Z',
  'occitanie':
    'M210,445 L250,430 L285,415 L320,420 L355,435 L365,465 L350,490 L310,500 L270,495 L235,480 L215,465 Z',
  'auvergne-rhone-alpes':
    'M335,290 L370,280 L415,295 L445,310 L460,340 L455,375 L435,400 L400,410 L365,405 L340,385 L320,355 L315,325 Z',
  'provence-alpes-cote-d-azur':
    'M400,410 L435,400 L465,385 L500,390 L520,410 L515,440 L490,460 L455,465 L425,455 L405,435 Z',
  'corse':
    'M520,440 L535,435 L545,450 L545,480 L535,505 L520,510 L510,495 L512,465 Z',
}

// === Couleurs heatmap (violet clair → violet foncé) ===

function getHeatColor(value: number, max: number): string {
  if (max === 0 || value === 0) return '#F3E8FF' // purple-100
  const ratio = Math.min(value / max, 1)
  // Interpolation entre purple-100 (#F3E8FF) et purple-700 (#7C3AED)
  const r = Math.round(243 - ratio * (243 - 124))
  const g = Math.round(232 - ratio * (232 - 58))
  const b = Math.round(255 - ratio * (255 - 237))
  return `rgb(${r}, ${g}, ${b})`
}

function getHeatColorHover(value: number, max: number): string {
  if (max === 0 || value === 0) return '#E9D5FF' // purple-200
  const ratio = Math.min(value / max, 1)
  const r = Math.round(233 - ratio * (233 - 109))
  const g = Math.round(213 - ratio * (213 - 40))
  const b = Math.round(255 - ratio * (255 - 217))
  return `rgb(${r}, ${g}, ${b})`
}

// === Composant principal ===

export default function FranceMap({ structures }: FranceMapProps) {
  const [hoveredRegion, setHoveredRegion] = useState<string | null>(null)
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 })
  const [viewMode, setViewMode] = useState<'beneficiaires' | 'structures'>('beneficiaires')

  // Calculer les données par région
  const regionData = useMemo(() => {
    const data: Record<string, RegionData> = {}

    // Initialiser toutes les régions
    for (const slug of Object.keys(REGION_NOMS)) {
      data[slug] = {
        nom: REGION_NOMS[slug],
        slug,
        beneficiaires: 0,
        structures: [],
        casEnAttente: 0,
      }
    }

    // Répartir les structures dans les régions
    for (const s of structures) {
      const regionsVues = new Set<string>()
      for (const dep of s.departements) {
        const region = REGION_PAR_DEPARTEMENT[dep]
        if (region && data[region] && !regionsVues.has(region)) {
          regionsVues.add(region)
          data[region].structures.push(s)
          data[region].beneficiaires += s.casPrisEnCharge + s.casTermines
          data[region].casEnAttente += s.casEnAttente
        }
      }
    }

    return data
  }, [structures])

  // Max pour le heatmap
  const maxBeneficiaires = useMemo(() => {
    return Math.max(1, ...Object.values(regionData).map(r => r.beneficiaires))
  }, [regionData])

  const maxStructures = useMemo(() => {
    return Math.max(1, ...Object.values(regionData).map(r => r.structures.length))
  }, [regionData])

  const totalBeneficiaires = useMemo(() => {
    return Object.values(regionData).reduce((sum, r) => sum + r.beneficiaires, 0)
  }, [regionData])

  const totalStructures = useMemo(() => {
    return structures.length
  }, [structures])

  const hoveredData = hoveredRegion ? regionData[hoveredRegion] : null

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800">Carte de France</h3>
        <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-0.5">
          <button
            onClick={() => setViewMode('beneficiaires')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              viewMode === 'beneficiaires'
                ? 'bg-white text-purple-700 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Bénéficiaires
          </button>
          <button
            onClick={() => setViewMode('structures')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              viewMode === 'structures'
                ? 'bg-white text-purple-700 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Structures
          </button>
        </div>
      </div>

      <div className="flex justify-center">
        <div className="relative" style={{ maxWidth: 700, width: '100%' }}>
          <svg
            viewBox="0 0 580 530"
            className="w-full h-auto"
            style={{ maxHeight: 500 }}
          >
            {/* Régions */}
            {Object.entries(REGION_PATHS).map(([slug, path]) => {
              const rd = regionData[slug]
              const value = viewMode === 'beneficiaires' ? rd?.beneficiaires || 0 : rd?.structures.length || 0
              const max = viewMode === 'beneficiaires' ? maxBeneficiaires : maxStructures
              const isHovered = hoveredRegion === slug
              const fill = isHovered
                ? getHeatColorHover(value, max)
                : getHeatColor(value, max)

              return (
                <path
                  key={slug}
                  d={path}
                  fill={fill}
                  stroke="#9333EA"
                  strokeWidth={isHovered ? 2 : 1}
                  strokeOpacity={0.4}
                  className="cursor-pointer transition-all duration-200"
                  onMouseEnter={(e) => {
                    setHoveredRegion(slug)
                    const svgRect = (e.target as SVGElement).closest('svg')?.getBoundingClientRect()
                    if (svgRect) {
                      setTooltipPos({
                        x: e.clientX - svgRect.left,
                        y: e.clientY - svgRect.top,
                      })
                    }
                  }}
                  onMouseMove={(e) => {
                    const svgRect = (e.target as SVGElement).closest('svg')?.getBoundingClientRect()
                    if (svgRect) {
                      setTooltipPos({
                        x: e.clientX - svgRect.left,
                        y: e.clientY - svgRect.top,
                      })
                    }
                  }}
                  onMouseLeave={() => setHoveredRegion(null)}
                />
              )
            })}

            {/* Markers pour structures en mode structures */}
            {viewMode === 'structures' && Object.entries(regionData).map(([slug, rd]) => {
              const center = REGION_CENTERS[slug]
              if (!center || rd.structures.length === 0) return null

              // Placer les dots autour du centre
              return rd.structures.map((s, i) => {
                const angle = (2 * Math.PI * i) / Math.max(rd.structures.length, 1)
                const radius = rd.structures.length > 1 ? 12 : 0
                const cx = center[0] + Math.cos(angle) * radius
                const cy = center[1] + Math.sin(angle) * radius

                return (
                  <g key={s.id}>
                    <circle
                      cx={cx}
                      cy={cy}
                      r={5}
                      fill="#7C3AED"
                      stroke="white"
                      strokeWidth={1.5}
                      className="cursor-pointer"
                      opacity={0.9}
                    >
                      <title>{s.nom}</title>
                    </circle>
                  </g>
                )
              })
            })}

            {/* Labels des compteurs par région */}
            {Object.entries(REGION_CENTERS).map(([slug, [cx, cy]]) => {
              const rd = regionData[slug]
              if (!rd) return null
              const value = viewMode === 'beneficiaires' ? rd.beneficiaires : rd.structures.length
              if (value === 0) return null

              return (
                <text
                  key={`label-${slug}`}
                  x={cx}
                  y={cy}
                  textAnchor="middle"
                  dominantBaseline="central"
                  className="pointer-events-none select-none"
                  style={{
                    fontSize: 13,
                    fontWeight: 700,
                    fill: '#581C87',
                    paintOrder: 'stroke',
                    stroke: 'white',
                    strokeWidth: 3,
                    strokeLinecap: 'round',
                    strokeLinejoin: 'round',
                  }}
                >
                  {value}
                </text>
              )
            })}
          </svg>

          {/* Tooltip */}
          {hoveredData && hoveredRegion && (
            <div
              className="absolute z-10 bg-gray-900 text-white text-xs rounded-lg px-3 py-2 pointer-events-none shadow-lg"
              style={{
                left: tooltipPos.x + 12,
                top: tooltipPos.y - 10,
                transform: tooltipPos.x > 350 ? 'translateX(-110%)' : 'none',
                minWidth: 180,
              }}
            >
              <p className="font-semibold text-sm mb-1">{hoveredData.nom}</p>
              <div className="space-y-0.5">
                <p>
                  <span className="text-purple-300">Bénéficiaires :</span>{' '}
                  {hoveredData.beneficiaires}
                </p>
                <p>
                  <span className="text-purple-300">Structures :</span>{' '}
                  {hoveredData.structures.length}
                </p>
                <p>
                  <span className="text-purple-300">En attente :</span>{' '}
                  {hoveredData.casEnAttente}
                </p>
              </div>
              {hoveredData.structures.length > 0 && (
                <div className="mt-1.5 pt-1.5 border-t border-gray-700">
                  {hoveredData.structures.map(s => (
                    <p key={s.id} className="text-gray-300 truncate">{s.nom}</p>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Légende */}
      <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">Faible</span>
          <div
            className="h-3 rounded-full"
            style={{
              width: 120,
              background: 'linear-gradient(to right, #F3E8FF, #7C3AED)',
            }}
          />
          <span className="text-xs text-gray-500">Élevé</span>
        </div>
        <div className="flex items-center gap-4 text-xs text-gray-500">
          <span>
            Total bénéficiaires : <strong className="text-gray-800">{totalBeneficiaires}</strong>
          </span>
          <span>
            Total structures : <strong className="text-gray-800">{totalStructures}</strong>
          </span>
        </div>
      </div>
    </div>
  )
}
