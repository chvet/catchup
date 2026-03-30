'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  ResponsiveContainer, Tooltip
} from 'recharts'
import DirectChat from '@/components/conseiller/DirectChat'
import JournalEvenements from '@/components/conseiller/JournalEvenements'
import BrisDeGlaceModal from '@/components/conseiller/BrisDeGlaceModal'
import OnlineDot from '@/components/OnlineDot'
import { useIsOnline } from '@/hooks/useOnlineStatus'
import dynamic from 'next/dynamic'
import { getDepartmentCoords } from '@/lib/geo-departments'
import type { MapMarker } from '@/components/MapView'

const MapView = dynamic(() => import('@/components/MapView'), { ssr: false })

interface CaseDetail {
  referral: {
    id: string
    priorite: string
    niveauDetection: number
    statut: string
    motif: string | null
    resumeConversation: string | null
    moyenContact: string | null
    typeContact: string | null
    localisation: string | null
    genre: string | null
    creeLe: string
  }
  beneficiaire: {
    prenom: string | null
    age: number | null
    situation: string | null
  } | null
  profil: {
    r: number; i: number; a: number; s: number; e: number; c: number
    dimensionsDominantes: string[]
    traits: string[]
    interets: string[]
    forces: string[]
    suggestion: string | null
  } | null
  confiance: {
    scoreGlobal: number
    niveau: string
  } | null
  conversation: {
    id: string
    nbMessages: number
    phase: string
    dureeSecondes: number
  } | null
  priseEnCharge: {
    id: string
    statut: string
    conseillerId: string
    notes: string | null
  } | null
  structureAssignee: {
    id: string
    nom: string
    adresse: string | null
    codePostal: string | null
    ville: string | null
    latitude: number | null
    longitude: number | null
  } | null
  matching: {
    structureId: string
    structureNom: string
    score: number
    raisons: string[]
    tauxRemplissage: number
  }[]
  attente: { heures: number; label: string }
  distance: { km: number; label: string } | null
}

interface ConversationMessage {
  id: string
  role: string
  contenu: string
  fragiliteDetectee: boolean
  niveauFragilite: string | null
  horodatage: string
}

const RIASEC_LABELS: Record<string, string> = {
  R: 'Réaliste', I: 'Investigateur', A: 'Artiste',
  S: 'Social', E: 'Entreprenant', C: 'Conventionnel',
}

const RIASEC_ORIENTATIONS: Record<string, { metiers: string[]; description: string }> = {
  R: { description: 'Aime les activités concrètes, manuelles et physiques', metiers: ['BTP / Construction', 'Mécanique / Maintenance', 'Agriculture / Nature', 'Artisanat', 'Industrie / Production', 'Logistique / Transport', 'Sport / Animation sportive'] },
  I: { description: 'Aime comprendre, analyser et résoudre des problèmes', metiers: ['Sciences / Recherche', 'Informatique / Développement', 'Santé / Médical', 'Ingénierie', 'Data / IA', 'Environnement', 'Biologie / Chimie'] },
  A: { description: 'Aime créer, imaginer et s\'exprimer', metiers: ['Arts visuels / Design', 'Communication / Médias', 'Mode / Textile', 'Musique / Audiovisuel', 'Écriture / Journalisme', 'Architecture / Décoration', 'Spectacle vivant'] },
  S: { description: 'Aime aider, écouter et accompagner les autres', metiers: ['Enseignement / Formation', 'Social / Éducation spécialisée', 'Santé / Paramédical', 'Animation / Jeunesse', 'Médiation / Justice', 'Ressources humaines', 'Psychologie / Coaching'] },
  E: { description: 'Aime diriger, convaincre et entreprendre', metiers: ['Commerce / Vente', 'Management / Direction', 'Entrepreneuriat', 'Marketing / Publicité', 'Droit / Juridique', 'Finance / Banque', 'Immobilier'] },
  C: { description: 'Aime organiser, structurer et gérer avec précision', metiers: ['Comptabilité / Gestion', 'Administration / Secrétariat', 'Banque / Assurance', 'Qualité / Audit', 'Logistique / Supply chain', 'Informatique de gestion', 'Fonction publique'] },
}

const NIVEAU_LABELS: Record<string, string> = {
  debut: 'Début', emergent: 'Émergent', precis: 'Précis', fiable: 'Fiable',
}

const PHASE_LABELS: Record<string, string> = {
  accroche: 'Accroche',
  decouverte: 'Découverte',
  exploration: 'Exploration',
  projection: 'Projection',
  action: 'Action',
}

type TabType = 'resume' | 'conversation' | 'accompagnement' | 'profil' | 'notes' | 'journal'

interface TiersInfo {
  id: string
  nom: string
  prenom: string
  role: string
  statut: string
}

export default function CaseDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const [data, setData] = useState<CaseDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [claiming, setClaiming] = useState(false)
  const [newNote, setNewNote] = useState('')
  const [notes, setNotes] = useState<{ id: string; contenu: string; horodatage: string }[]>([])
  const [statusUpdating, setStatusUpdating] = useState(false)
  const [activeTab, setActiveTab] = useState<TabType>('resume')

  // État pour l'historique de conversation (chargement à la demande)
  const [messages, setMessages] = useState<ConversationMessage[]>([])
  const [messagesLoading, setMessagesLoading] = useState(false)
  const [messagesLoaded, setMessagesLoaded] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)

  // État tiers + bris de glace
  const [tiersList, setTiersList] = useState<TiersInfo[]>([])
  const [bdgTiers, setBdgTiers] = useState<TiersInfo | null>(null)
  const [bdgOpen, setBdgOpen] = useState(false)

  // Online status of the beneficiary (using referral ID as heartbeat userId)
  const beneficiaireOnline = useIsOnline(id)

  useEffect(() => {
    fetch(`/api/conseiller/file-active/${id}`)
      .then(r => r.json())
      .then(d => {
        setData(d)
        setLoading(false)
      })
      .catch(err => {
        console.error(err)
        setLoading(false)
      })

    // Charger les notes
    fetch(`/api/conseiller/file-active/${id}/notes`)
      .then(r => r.json())
      .then(d => setNotes(d.notes || []))
      .catch(() => {})

    // Charger les tiers intervenants
    fetch(`/api/conseiller/file-active/${id}/tiers`)
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.tiers) setTiersList(d.tiers) })
      .catch(() => {})
  }, [id])

  // Charger l'historique de conversation quand l'onglet est activé (lazy loading)
  useEffect(() => {
    if (activeTab === 'conversation' && !messagesLoaded && !messagesLoading) {
      setMessagesLoading(true)
      fetch(`/api/conseiller/file-active/${id}/conversation`)
        .then(r => r.json())
        .then(d => {
          setMessages(d.messages || [])
          setMessagesLoaded(true)
          setMessagesLoading(false)
        })
        .catch(() => {
          setMessagesLoading(false)
        })
    }
  }, [activeTab, id, messagesLoaded, messagesLoading])

  // Auto-scroll vers le bas quand les messages sont chargés
  useEffect(() => {
    if (messagesLoaded && chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messagesLoaded, messages])

  const handleClaim = async () => {
    setClaiming(true)
    const res = await fetch(`/api/conseiller/file-active/${id}`, { method: 'POST' })
    if (res.ok) {
      const d = await fetch(`/api/conseiller/file-active/${id}`).then(r => r.json())
      setData(d)
    } else {
      const err = await res.json().catch(() => ({ error: 'Erreur inconnue' }))
      alert(err.error || 'Erreur lors de la prise en charge')
    }
    setClaiming(false)
  }

  const handleStatusChange = async (newStatut: string) => {
    setStatusUpdating(true)
    await fetch(`/api/conseiller/file-active/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ statut: newStatut }),
    })
    const d = await fetch(`/api/conseiller/file-active/${id}`).then(r => r.json())
    setData(d)
    setStatusUpdating(false)
  }

  const handleAddNote = async () => {
    if (!newNote.trim()) return
    const res = await fetch(`/api/conseiller/file-active/${id}/notes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contenu: newNote }),
    })
    if (res.ok) {
      const { note } = await res.json()
      setNotes(prev => [...prev, note])
      setNewNote('')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-10 h-10 border-4 border-catchup-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!data) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Cas non trouvé</p>
        <Link href="/conseiller/file-active" className="text-catchup-primary mt-2 inline-block">
          Retour à la file active
        </Link>
      </div>
    )
  }

  const { referral: ref, beneficiaire, profil, confiance, conversation: conv, priseEnCharge: pec, matching, attente, distance } = data

  const riasecData = profil ? [
    { dim: 'R', label: 'Réaliste', score: profil.r },
    { dim: 'I', label: 'Investigateur', score: profil.i },
    { dim: 'A', label: 'Artiste', score: profil.a },
    { dim: 'S', label: 'Social', score: profil.s },
    { dim: 'E', label: 'Entreprenant', score: profil.e },
    { dim: 'C', label: 'Conventionnel', score: profil.c },
  ] : []

  const isPrisEnCharge = !!pec
  const tabs: { key: TabType; label: string; icon: string; badge?: string }[] = [
    { key: 'resume', label: 'Résumé', icon: '📋' },
    { key: 'conversation', label: 'Historique IA', icon: '🤖', badge: conv ? `${conv.nbMessages}` : undefined },
    { key: 'accompagnement', label: 'Accompagnement', icon: '💬', badge: isPrisEnCharge ? '●' : undefined },
    { key: 'profil', label: 'Profil RIASEC', icon: '🎯' },
    { key: 'notes', label: 'Notes', icon: '📝', badge: notes.length > 0 ? `${notes.length}` : undefined },
    { key: 'journal', label: 'Journal', icon: '📋' },
  ]

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-3">
        <div className="flex items-center gap-3 md:gap-4 min-w-0">
          <Link href="/conseiller/file-active" className="text-gray-400 hover:text-gray-600 shrink-0">
            ← Retour
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              {beneficiaire?.prenom || 'Anonyme'}
              {beneficiaire?.age && <span className="text-gray-400 font-normal ml-2">{beneficiaire.age} ans</span>}
              <OnlineDot online={beneficiaireOnline} showLabel />
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                ref.priorite === 'critique' ? 'bg-red-100 text-red-800' :
                ref.priorite === 'haute' ? 'bg-orange-100 text-orange-800' :
                'bg-green-100 text-green-800'
              }`}>
                {ref.priorite === 'critique' ? '🔴 Critique' : ref.priorite === 'haute' ? '🟠 Haute' : '🟢 Normale'}
              </span>
              <span className="text-sm text-gray-400">Attente : {attente.label}</span>
              {distance && (
                <span className={`text-sm font-medium ${distance.km <= 30 ? 'text-green-600' : distance.km <= 80 ? 'text-orange-500' : 'text-red-500'}`}>
                  📏 {distance.label}
                </span>
              )}
              {ref.localisation && <span className="text-sm text-gray-400">📍 {ref.localisation}</span>}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          {!pec && (
            <button
              onClick={handleClaim}
              disabled={claiming}
              className="px-4 py-2 bg-catchup-primary text-white rounded-lg font-medium hover:bg-catchup-primary/90 disabled:opacity-50 transition-colors"
            >
              {claiming ? 'En cours...' : '🤝 Prendre en charge'}
            </button>
          )}
          {pec && pec.statut === 'prise_en_charge' && (
            <>
              <button
                onClick={() => handleStatusChange('terminee')}
                disabled={statusUpdating}
                className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 disabled:opacity-50 transition-colors"
              >
                ✅ Terminer
              </button>
              <button
                onClick={() => handleStatusChange('abandonnee')}
                disabled={statusUpdating}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm hover:bg-gray-300 disabled:opacity-50 transition-colors"
              >
                Abandonner
              </button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Colonne gauche — Onglets */}
        <div className="lg:col-span-2 space-y-0">
          {/* Barre d'onglets */}
          <div className="bg-white rounded-t-xl border border-gray-100 border-b-0 flex overflow-x-auto scrollbar-hide">
            {tabs.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === tab.key
                    ? 'border-catchup-primary text-catchup-primary bg-catchup-primary/5'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span aria-hidden="true">{tab.icon}</span>
                <span>{tab.label}</span>
                {tab.badge && (
                  <span className={`px-1.5 py-0.5 rounded-full text-xs font-bold ${
                    activeTab === tab.key
                      ? 'bg-catchup-primary text-white'
                      : 'bg-gray-200 text-gray-600'
                  }`}>
                    {tab.badge}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Contenu de l'onglet */}
          <div className="bg-white rounded-b-xl shadow-sm border border-gray-100">

            {/* ═══ ONGLET RÉSUMÉ ═══ */}
            {activeTab === 'resume' && (
              <div className="p-6 space-y-4">
                <h3 className="text-lg font-semibold text-gray-800">Résumé de la conversation</h3>
                {ref.resumeConversation ? (
                  <p className="text-gray-700 leading-relaxed">{ref.resumeConversation}</p>
                ) : (
                  <p className="text-gray-400 italic">Résumé non disponible</p>
                )}
                {ref.motif && (
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-800"><strong>Motif :</strong> {ref.motif}</p>
                  </div>
                )}
                {conv && (
                  <div className="flex flex-wrap gap-4 text-sm text-gray-500 pt-2 border-t border-gray-100">
                    <span>💬 {conv.nbMessages} messages</span>
                    <span>⏱️ {Math.round((conv.dureeSecondes || 0) / 60)} min</span>
                    <span>📍 Phase : {PHASE_LABELS[conv.phase] || conv.phase}</span>
                  </div>
                )}

                {/* Bouton pour aller consulter la conversation */}
                {conv && conv.nbMessages > 0 && (
                  <button
                    onClick={() => setActiveTab('conversation')}
                    className="mt-2 inline-flex items-center gap-2 px-4 py-2 bg-catchup-primary/10 text-catchup-primary rounded-lg text-sm font-medium hover:bg-catchup-primary/20 transition-colors"
                  >
                    💬 Consulter l&apos;historique complet de la conversation
                  </button>
                )}

                {/* Carte de localisation */}
                {ref.localisation && getDepartmentCoords(ref.localisation) && (() => {
                  const benefCoords = getDepartmentCoords(ref.localisation!)!
                  const benefPrenom = data.beneficiaire?.prenom || 'Bénéficiaire'
                  const structAssignee = data.structureAssignee
                  const mapMarkers: MapMarker[] = [
                    {
                      lat: benefCoords.lat,
                      lng: benefCoords.lng,
                      color: 'red',
                      label: `Bénéficiaire : ${benefPrenom}`,
                      popup: `${benefPrenom} - ${benefCoords.name} (${ref.localisation})`,
                    },
                  ]
                  // Ajouter la structure assignée avec coordonnées précises si disponibles
                  if (structAssignee && structAssignee.latitude && structAssignee.longitude) {
                    const adresseLabel = [structAssignee.adresse, structAssignee.ville].filter(Boolean).join(', ')
                    mapMarkers.push({
                      lat: structAssignee.latitude,
                      lng: structAssignee.longitude,
                      color: 'blue',
                      label: `Structure : ${structAssignee.nom}`,
                      popup: `${structAssignee.nom} - ${adresseLabel}`,
                    })
                  }
                  return (
                    <div className="pt-4 border-t border-gray-100">
                      <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                        🗺️ Localisation
                      </h4>
                      <MapView markers={mapMarkers} height="200px" />
                      <div className="flex flex-col gap-0.5 mt-1">
                        <p className="text-xs text-gray-400">
                          📍 {benefPrenom} — {benefCoords.name} ({ref.localisation})
                        </p>
                        {structAssignee && structAssignee.adresse && (
                          <p className="text-xs text-gray-400">
                            🏢 {structAssignee.nom} — {structAssignee.adresse}, {structAssignee.codePostal} {structAssignee.ville}
                          </p>
                        )}
                      </div>
                    </div>
                  )
                })()}
              </div>
            )}

            {/* ═══ ONGLET CONVERSATION ═══ */}
            {activeTab === 'conversation' && (
              <div className="flex flex-col" style={{ minHeight: '500px' }}>
                {/* En-tête de la conversation */}
                {conv && (
                  <div className="px-6 py-3 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-catchup-primary/20 flex items-center justify-center">
                        <span className="text-sm" aria-hidden="true">🤖</span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-700">
                          Conversation avec l&apos;IA Catch&apos;Up
                        </p>
                        <p className="text-xs text-gray-400">
                          {conv.nbMessages} messages &middot; {Math.round((conv.dureeSecondes || 0) / 60)} min &middot; Phase : {PHASE_LABELS[conv.phase] || conv.phase}
                        </p>
                      </div>
                    </div>
                    <span className="text-xs text-gray-400 bg-white px-2 py-1 rounded border border-gray-200">
                      Lecture seule
                    </span>
                  </div>
                )}

                {/* Zone de messages style chat */}
                <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4" style={{ maxHeight: '600px' }}>
                  {messagesLoading && (
                    <div className="flex items-center justify-center py-12">
                      <div className="text-center">
                        <div className="w-8 h-8 border-3 border-catchup-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                        <p className="text-sm text-gray-400">Chargement de la conversation...</p>
                      </div>
                    </div>
                  )}

                  {messagesLoaded && messages.length === 0 && (
                    <div className="text-center py-12">
                      <p className="text-4xl mb-3">💬</p>
                      <p className="text-gray-400">Aucun message enregistré pour cette conversation</p>
                    </div>
                  )}

                  {messages.map((msg, idx) => (
                    <ChatBubble
                      key={msg.id}
                      message={msg}
                      beneficiairePrenom={beneficiaire?.prenom || 'Bénéficiaire'}
                      showTimestamp={
                        idx === 0 ||
                        // Afficher l'heure si > 5 min depuis le message précédent
                        (idx > 0 && (
                          new Date(msg.horodatage).getTime() -
                          new Date(messages[idx - 1].horodatage).getTime()
                        ) > 5 * 60 * 1000)
                      }
                    />
                  ))}
                  <div ref={chatEndRef} />
                </div>

                {/* Footer info */}
                {messagesLoaded && messages.length > 0 && (
                  <div className="px-6 py-3 border-t border-gray-100 bg-gray-50/50">
                    <p className="text-xs text-gray-400 text-center">
                      Historique de la conversation entre le bénéficiaire et l&apos;IA Catch&apos;Up — {messages.length} message{messages.length > 1 ? 's' : ''}
                      {messages.some(m => m.fragiliteDetectee) && (
                        <span className="ml-2 text-orange-500 font-medium">
                          ⚠️ Fragilité détectée dans cette conversation
                        </span>
                      )}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* ═══ ONGLET ACCOMPAGNEMENT ═══ */}
            {activeTab === 'accompagnement' && (
              <DirectChat
                referralId={ref.id}
                beneficiairePrenom={beneficiaire?.prenom || 'Bénéficiaire'}
                beneficiaireAge={beneficiaire?.age}
                priseEnChargeStatut={pec?.statut || ''}
              />
            )}

            {/* ═══ ONGLET PROFIL RIASEC ═══ */}
            {activeTab === 'profil' && (
              <div className="p-6">
                {profil ? (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Profil RIASEC</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Radar */}
                      <ResponsiveContainer width="100%" height={250}>
                        <RadarChart data={riasecData}>
                          <PolarGrid />
                          <PolarAngleAxis dataKey="label" tick={{ fontSize: 11 }} />
                          <PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                          <Radar dataKey="score" stroke="#6C63FF" fill="#6C63FF" fillOpacity={0.3} />
                          <Tooltip />
                        </RadarChart>
                      </ResponsiveContainer>

                      {/* Détails */}
                      <div className="space-y-3">
                        <div>
                          <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Dimensions dominantes</p>
                          <div className="flex gap-2">
                            {profil.dimensionsDominantes.map(d => (
                              <span key={d} className="px-2 py-1 bg-catchup-primary/10 text-catchup-primary rounded text-sm font-medium">
                                {RIASEC_LABELS[d] || d}
                              </span>
                            ))}
                          </div>
                        </div>

                        {confiance && (
                          <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Indice de confiance</p>
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-catchup-primary rounded-full"
                                  style={{ width: `${Math.round(confiance.scoreGlobal * 100)}%` }}
                                />
                              </div>
                              <span className="text-sm font-medium text-gray-700">
                                {Math.round(confiance.scoreGlobal * 100)}% — {NIVEAU_LABELS[confiance.niveau] || confiance.niveau}
                              </span>
                            </div>
                          </div>
                        )}

                        {profil.traits.length > 0 && (
                          <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Traits</p>
                            <div className="flex flex-wrap gap-1">
                              {profil.traits.map(t => (
                                <span key={t} className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">{t}</span>
                              ))}
                            </div>
                          </div>
                        )}

                        {profil.interets.length > 0 && (
                          <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Centres d&apos;intérêt</p>
                            <div className="flex flex-wrap gap-1">
                              {profil.interets.map(i => (
                                <span key={i} className="px-2 py-0.5 bg-purple-50 text-purple-600 rounded text-xs">{i}</span>
                              ))}
                            </div>
                          </div>
                        )}

                        {profil.suggestion && (
                          <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Piste métier</p>
                            <p className="text-sm text-gray-700">💡 {profil.suggestion}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Orientations métiers basées sur les dimensions dominantes */}
                    {profil.dimensionsDominantes.length > 0 && (
                      <div className="mt-6 pt-6 border-t border-gray-100">
                        <h4 className="text-sm font-semibold text-gray-700 mb-3">🧭 Orientations possibles</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {profil.dimensionsDominantes.map(dim => {
                            const ori = RIASEC_ORIENTATIONS[dim]
                            if (!ori) return null
                            return (
                              <div key={dim} className="p-3 rounded-lg bg-gray-50 border border-gray-100">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="px-2 py-0.5 bg-catchup-primary/10 text-catchup-primary rounded text-xs font-bold">
                                    {RIASEC_LABELS[dim] || dim}
                                  </span>
                                </div>
                                <p className="text-xs text-gray-500 italic mb-2">{ori.description}</p>
                                <div className="flex flex-wrap gap-1">
                                  {ori.metiers.map(m => (
                                    <span key={m} className="px-2 py-0.5 bg-white border border-gray-200 text-gray-600 rounded-full text-xs">
                                      {m}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <p className="text-4xl mb-3">🎯</p>
                    <p className="text-gray-400">Profil RIASEC non encore établi</p>
                  </div>
                )}
              </div>
            )}

            {/* ═══ ONGLET NOTES ═══ */}
            {activeTab === 'notes' && (
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Notes du conseiller</h3>

                {notes.length > 0 ? (
                  <div className="space-y-3 mb-4">
                    {notes.map(note => (
                      <div key={note.id} className="p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-700">{note.contenu}</p>
                        <p className="text-xs text-gray-400 mt-1">
                          {new Date(note.horodatage).toLocaleString('fr-FR')}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-400 text-sm mb-4">Aucune note pour le moment</p>
                )}

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newNote}
                    onChange={e => setNewNote(e.target.value)}
                    placeholder="Ajouter une note..."
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-catchup-primary outline-none"
                    onKeyDown={e => e.key === 'Enter' && handleAddNote()}
                  />
                  <button
                    onClick={handleAddNote}
                    disabled={!newNote.trim()}
                    className="px-4 py-2 bg-catchup-primary text-white rounded-lg text-sm hover:bg-catchup-primary/90 disabled:opacity-50 transition-colors"
                  >
                    Ajouter
                  </button>
                </div>
              </div>
            )}
            {/* ═══ ONGLET JOURNAL ═══ */}
            {activeTab === 'journal' && (
              <JournalEvenements referralId={ref.id} />
            )}
          </div>
        </div>

        {/* Colonne droite — Matching + Contact + Tiers */}
        <div className="space-y-6">
          {/* Intervenants tiers */}
          {tiersList.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Intervenants</h3>
              <div className="space-y-2">
                {tiersList.map(t => (
                  <div key={t.id} className="flex items-center justify-between p-2 rounded-lg bg-gray-50">
                    <div>
                      <p className="text-sm font-medium text-gray-800">{t.prenom} {t.nom}</p>
                      <p className="text-xs text-gray-500">{t.role}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        t.statut === 'approuve' ? 'bg-green-100 text-green-700' :
                        t.statut === 'en_attente' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {t.statut === 'approuve' ? 'Actif' : t.statut === 'en_attente' ? 'En attente' : t.statut}
                      </span>
                      {t.statut === 'approuve' && (
                        <button
                          onClick={() => { setBdgTiers(t); setBdgOpen(true) }}
                          className="text-xs text-red-500 hover:text-red-700 font-medium"
                          title="Accéder aux échanges (bris de glace)"
                        >
                          🔓
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Contact */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">Contact</h3>
            {ref.moyenContact ? (
              <div className="space-y-2">
                <p className="text-sm">
                  <span className="text-gray-500">{ref.typeContact === 'telephone' ? '📞' : '📧'}</span>{' '}
                  <span className="font-medium text-gray-800">{ref.moyenContact}</span>
                </p>
                {ref.genre && (
                  <p className="text-sm text-gray-500">Genre : {ref.genre === 'M' ? 'Masculin' : ref.genre === 'F' ? 'Féminin' : 'Autre'}</p>
                )}
                {beneficiaire?.situation && (
                  <p className="text-sm text-gray-500">Situation : {beneficiaire.situation}</p>
                )}
              </div>
            ) : (
              <p className="text-gray-400 text-sm">Moyen de contact non renseigné</p>
            )}
          </div>

          {/* Chronologie */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">Chronologie</h3>
            <div className="space-y-3">
              <TimelineItem
                label="Demande créée"
                date={ref.creeLe}
                icon="📨"
              />
              {pec?.statut && (
                <TimelineItem
                  label={`Statut : ${pec.statut.replace('_', ' ')}`}
                  date={pec.conseillerId ? 'Conseiller assigné' : ''}
                  icon="🤝"
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal bris de glace */}
      {bdgTiers && (
        <BrisDeGlaceModal
          referralId={ref.id}
          tiers={bdgTiers}
          isOpen={bdgOpen}
          onClose={() => { setBdgOpen(false); setBdgTiers(null) }}
        />
      )}
    </div>
  )
}

// ─── Composant bulle de chat (affichage style WhatsApp) ───

function ChatBubble({
  message,
  beneficiairePrenom,
  showTimestamp,
}: {
  message: ConversationMessage
  beneficiairePrenom: string
  showTimestamp: boolean
}) {
  const isUser = message.role === 'user'
  const time = new Date(message.horodatage)

  return (
    <>
      {/* Séparateur temporel */}
      {showTimestamp && (
        <div className="flex justify-center">
          <span className="text-xs text-gray-400 bg-gray-100 px-3 py-1 rounded-full">
            {time.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })}
            {' '}
            {time.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      )}

      <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
        <div className={`max-w-[85%] md:max-w-[75%] ${isUser ? 'order-2' : 'order-1'}`}>
          {/* Nom expéditeur */}
          <p className={`text-xs mb-1 ${isUser ? 'text-right text-gray-400' : 'text-left text-catchup-primary/70'}`}>
            {isUser ? beneficiairePrenom : 'IA Catch\'Up'}
          </p>

          {/* Bulle */}
          <div className={`
            px-4 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap
            ${isUser
              ? 'bg-catchup-primary text-white rounded-tr-md'
              : 'bg-gray-100 text-gray-800 rounded-tl-md'
            }
            ${message.fragiliteDetectee ? 'ring-2 ring-orange-300' : ''}
          `}>
            {message.contenu}
          </div>

          {/* Indicateurs */}
          <div className={`flex items-center gap-2 mt-1 ${isUser ? 'justify-end' : 'justify-start'}`}>
            <span className="text-[10px] text-gray-400">
              {time.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
            </span>
            {message.fragiliteDetectee && (
              <span className="text-[10px] text-orange-500 font-medium" title={`Niveau : ${message.niveauFragilite || 'non précisé'}`}>
                ⚠️ Fragilité{message.niveauFragilite ? ` (${message.niveauFragilite})` : ''}
              </span>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

// ─── Composant timeline ───

function TimelineItem({ label, date, icon }: { label: string; date: string; icon: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="text-lg" aria-hidden="true">{icon}</span>
      <div>
        <p className="text-sm font-medium text-gray-700">{label}</p>
        <p className="text-xs text-gray-400">
          {date && date.includes('T') ? new Date(date).toLocaleString('fr-FR') : date}
        </p>
      </div>
    </div>
  )
}
