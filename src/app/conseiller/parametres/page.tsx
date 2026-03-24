'use client'

import { useConseiller } from '@/components/conseiller/ConseillerProvider'

export default function ParametresPage() {
  const conseiller = useConseiller()

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Paramètres</h1>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 max-w-2xl">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Mon profil</h2>

        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-catchup-primary text-white flex items-center justify-center text-xl font-bold">
              {conseiller?.prenom?.[0]}{conseiller?.nom?.[0]}
            </div>
            <div>
              <p className="text-lg font-semibold text-gray-800">
                {conseiller?.prenom} {conseiller?.nom}
              </p>
              <p className="text-gray-500">{conseiller?.email}</p>
            </div>
          </div>

          <div className="border-t border-gray-100 pt-4 space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Rôle</span>
              <span className="text-sm font-medium text-gray-800">
                {conseiller?.role === 'super_admin' ? 'Super Administrateur' :
                 conseiller?.role === 'admin_structure' ? 'Administrateur structure' :
                 'Conseiller'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Structure</span>
              <span className="text-sm font-medium text-gray-800">
                {conseiller?.structure?.nom || '—'}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 max-w-2xl mt-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Informations</h2>
        <div className="space-y-2 text-sm text-gray-600">
          <p>Version : <span className="font-mono">2.0.0</span> (Espace Conseiller)</p>
          <p>Plateforme : Catch&apos;Up — Fondation JAE</p>
          <p className="text-gray-400 mt-4">
            Pour modifier votre mot de passe ou vos informations, contactez votre administrateur de structure.
          </p>
        </div>
      </div>
    </div>
  )
}
