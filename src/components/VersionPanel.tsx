'use client'

import { useState } from 'react'

export const APP_VERSION = 'V2.0 Beta 009'
export const APP_VERSION_DATE = '2026-04-05'

const CHANGELOG = [
  {
    version: 'V2.0 Beta 009',
    date: '05/04/2026',
    items: [
      'Compatible lecteurs d\'ecran NVDA/VoiceOver (RGAA 100%)',
      'Lien "Aller au contenu principal" (skip navigation)',
      'Zone de messages aria-live pour lecteurs d\'ecran',
      'Focus trap dans les panneaux modaux (Profil, Accessibilite)',
      'Label associe au champ de saisie du chat',
      'Titres h1 masques sur toutes les pages conseiller',
      'Role status sur l\'indicateur de frappe',
      'Fermeture par Echap sur tous les dialogues',
    ],
  },
  {
    version: 'V2.0 Beta 008',
    date: '03/04/2026',
    items: [
      'Textes alternatifs complets sur toutes les images, icones et emojis (RGAA 79%)',
      'Correction lecture messages vocaux sur smartphone (upload audio serveur)',
      'Support types audio : webm, mp4, ogg, wav, mp3',
      'Saisie code PIN : champ unique compatible auto-fill SMS iOS/Android',
      'Format SMS WebOTP pour auto-remplissage Android natif',
      'Lien cliquable https:// dans les SMS',
      'Auto-focus et scroll formulaire PIN sur mobile',
    ],
  },
  {
    version: 'V2.0 Beta 007',
    date: '03/04/2026',
    items: [
      'Header compact : selecteur de langue en dropdown (10 langues)',
      'Panneau RGAA cliquable avec detail des criteres',
      'Ecran CGU bloquant pour les beneficiaires',
      'Bulle IA deplacable (drag & drop)',
      'Detection automatique de mise a jour',
      'Logo structure sur fond transparent',
      'Responsive design ameliore (Z Fold, petits ecrans)',
      'Filtre campagne dans la file active',
      'Suivi de delivrance SMS/Email (webhooks Vonage + Brevo)',
      'Badge version et panneau info sur espace conseiller',
    ],
  },
  {
    version: 'V2.0 Beta 006',
    date: '01/04/2026',
    items: [
      'Accessibilite dans le header (TTS, contraste, taille texte)',
      'Drapeaux SVG inline (compatibilite Windows)',
      'Correction logo login conseiller',
      'Correction affichage drapeaux EN/AR',
    ],
  },
] as const

export default function VersionPanel() {
  const [open, setOpen] = useState(false)

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        className={`px-2 py-1 rounded-md text-[11px] font-medium tracking-wide transition-colors ${
          open ? 'bg-catchup-primary/10 text-catchup-primary' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
        }`}
        title="Informations de version"
        aria-expanded={open}
      >
        {APP_VERSION}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} aria-hidden="true" />
          <div className="absolute top-full right-0 mt-1 z-50 w-96 max-w-[calc(100vw-1rem)] bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden"
            role="dialog" aria-label="Informations de version">
            {/* Header */}
            <div className="px-4 py-3 bg-gradient-to-r from-catchup-primary to-indigo-600 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold">Catch&apos;Up {APP_VERSION}</h3>
                  <p className="text-[11px] text-white/70">Fondation JAE — Plateforme d&apos;orientation</p>
                </div>
                <div className="text-right">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-white/20 text-[10px] font-semibold">
                    Beta
                  </span>
                </div>
              </div>
            </div>

            {/* Changelog */}
            <div className="max-h-80 overflow-y-auto px-4 py-3 space-y-4">
              {CHANGELOG.map((release, i) => (
                <div key={i}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-semibold text-catchup-primary">{release.version}</span>
                    <span className="text-[10px] text-gray-400">{release.date}</span>
                  </div>
                  <ul className="space-y-1">
                    {release.items.map((item, j) => (
                      <li key={j} className="flex items-start gap-1.5 text-xs text-gray-600">
                        <span className="text-catchup-primary mt-0.5 shrink-0">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            {/* Footer avec liens ressources */}
            <div className="px-4 py-2.5 border-t border-gray-100 bg-gray-50 space-y-1.5">
              <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">Ressources</p>
              <div className="flex flex-wrap gap-2">
                <a href="mailto:support@fondation-jae.org" className="text-[11px] text-catchup-primary hover:underline">
                  Support
                </a>
                <span className="text-gray-300">|</span>
                <a href="mailto:dpo@fondation-jae.org" className="text-[11px] text-catchup-primary hover:underline">
                  DPO
                </a>
                <span className="text-gray-300">|</span>
                <span className="text-[11px] text-gray-400">Documentation (a venir)</span>
              </div>
              <button onClick={() => setOpen(false)} className="text-xs text-catchup-primary hover:underline mt-1">
                Fermer
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
