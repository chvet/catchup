'use client'

import { useState, useEffect } from 'react'
import { useConseiller } from '@/components/conseiller/ConseillerProvider'

export default function ParametresPage() {
  const conseiller = useConseiller()
  const [slug, setSlug] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (conseiller?.structure?.id) {
      fetch(`/api/conseiller/structures/${conseiller.structure.id}`)
        .then(r => r.ok ? r.json() : null)
        .then(data => {
          // L'API retourne { structure: { slug, ... }, conseillers: [...] }
          const s = data?.structure?.slug || data?.slug
          if (s) setSlug(s)
        })
        .catch(() => {})
    }
  }, [conseiller?.structure?.id])

  const beneficiaireUrl = slug ? `https://catchup.jaeprive.fr/?s=${slug}` : null
  const conseillerUrl = slug ? `https://catchup.jaeprive.fr/conseiller/login?s=${slug}` : null
  const qrCodeUrl = beneficiaireUrl
    ? `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(beneficiaireUrl)}`
    : null
  const qrCodeUrlLarge = beneficiaireUrl
    ? `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(beneficiaireUrl)}`
    : null

  const handleCopy = (url: string) => {
    navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handlePrint = () => {
    if (!beneficiaireUrl || !qrCodeUrlLarge) return
    const w = window.open('', '_blank')
    if (!w) return
    w.document.write(`
      <html><head><title>QR Code — ${conseiller?.structure?.nom}</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; text-align: center; padding: 60px 40px; }
        h1 { font-size: 28px; color: #1a1a2e; margin-bottom: 8px; }
        h2 { font-size: 18px; color: #6C63FF; font-weight: 500; margin-bottom: 40px; }
        img { margin: 0 auto; display: block; }
        .url { font-size: 14px; color: #666; margin-top: 30px; word-break: break-all; }
        .cta { font-size: 20px; color: #333; margin-top: 30px; font-weight: 600; }
      </style></head><body>
        <h1>${conseiller?.structure?.nom || 'Catch\'Up'}</h1>
        <h2>Catch'Up — Orientation professionnelle</h2>
        <img src="${qrCodeUrlLarge}" width="300" height="300" />
        <p class="cta">📱 Scannez pour accéder à Catch'Up</p>
        <p class="url">${beneficiaireUrl}</p>
      </body></html>
    `)
    w.document.close()
    w.onload = () => { w.print() }
  }

  const handleDownloadQR = () => {
    if (!qrCodeUrlLarge) return
    const a = document.createElement('a')
    a.href = qrCodeUrlLarge
    a.download = `qrcode-catchup-${slug}.png`
    a.target = '_blank'
    a.click()
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Paramètres</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-4xl">
        {/* Profil */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
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

        {/* QR Code & Liens */}
        {slug && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">🔗 Lien & QR Code de ma structure</h2>

            <div className="flex flex-col items-center gap-4">
              {/* QR Code */}
              {qrCodeUrl && (
                <div className="p-3 bg-white border-2 border-gray-200 rounded-xl">
                  <img src={qrCodeUrl} alt="QR Code" width={180} height={180} />
                </div>
              )}

              {/* Lien bénéficiaire */}
              <div className="w-full">
                <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Lien bénéficiaire</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    readOnly
                    value={beneficiaireUrl || ''}
                    className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700 font-mono"
                  />
                  <button
                    onClick={() => beneficiaireUrl && handleCopy(beneficiaireUrl)}
                    className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                      copied ? 'bg-green-100 text-green-700' : 'bg-catchup-primary text-white hover:bg-catchup-primary/90'
                    }`}
                  >
                    {copied ? '✓' : 'Copier'}
                  </button>
                </div>
              </div>

              {/* Lien conseiller */}
              <div className="w-full">
                <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Lien conseiller</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    readOnly
                    value={conseillerUrl || ''}
                    className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700 font-mono"
                  />
                  <button
                    onClick={() => conseillerUrl && handleCopy(conseillerUrl)}
                    className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                      copied ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    {copied ? '✓' : 'Copier'}
                  </button>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 w-full">
                <button
                  onClick={handleDownloadQR}
                  className="flex-1 px-3 py-2 text-sm font-medium bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  ⬇️ Télécharger
                </button>
                <button
                  onClick={handlePrint}
                  className="flex-1 px-3 py-2 text-sm font-medium bg-catchup-primary/10 text-catchup-primary rounded-lg hover:bg-catchup-primary/20 transition-colors"
                >
                  🖨️ Imprimer
                </button>
              </div>

              {/* Partage réseaux sociaux */}
              <div className="w-full">
                <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Partager</p>
                <div className="flex gap-2">
                  {/* Facebook */}
                  <a
                    href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(beneficiaireUrl || '')}&quote=${encodeURIComponent(`Découvre Catch'Up, ton guide d'orientation professionnelle ! ${conseiller?.structure?.nom || ''}`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 bg-[#1877F2] text-white text-sm font-medium rounded-lg hover:bg-[#1877F2]/90 transition-colors"
                  >
                    <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                    Facebook
                  </a>
                  {/* LinkedIn */}
                  <a
                    href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(beneficiaireUrl || '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 bg-[#0A66C2] text-white text-sm font-medium rounded-lg hover:bg-[#0A66C2]/90 transition-colors"
                  >
                    <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                    LinkedIn
                  </a>
                  {/* X / Twitter */}
                  <a
                    href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(beneficiaireUrl || '')}&text=${encodeURIComponent(`Découvre Catch'Up, ton guide d'orientation ! 🚀 ${conseiller?.structure?.nom || ''}`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 bg-black text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors"
                  >
                    <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                    X
                  </a>
                </div>
                {/* WhatsApp + Email + Copier le lien — ligne 2 */}
                <div className="flex gap-2 mt-2">
                  <a
                    href={`https://wa.me/?text=${encodeURIComponent(`Découvre Catch'Up pour ton orientation ! 🚀 ${beneficiaireUrl}`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 bg-[#25D366] text-white text-sm font-medium rounded-lg hover:bg-[#25D366]/90 transition-colors"
                  >
                    <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                    WhatsApp
                  </a>
                  <a
                    href={`mailto:?subject=${encodeURIComponent(`Catch'Up — Orientation professionnelle`)}&body=${encodeURIComponent(`Bonjour,\n\nDécouvrez Catch'Up, la plateforme d'orientation professionnelle de ${conseiller?.structure?.nom || 'notre structure'}.\n\nAccédez directement : ${beneficiaireUrl}\n\nBonne découverte !`)}`}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 bg-gray-600 text-white text-sm font-medium rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current"><path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/></svg>
                    Email
                  </a>
                  <button
                    onClick={() => beneficiaireUrl && handleCopy(beneficiaireUrl)}
                    className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                      copied ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current"><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg>
                    {copied ? 'Copie !' : 'Copier le lien'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Infos */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 lg:col-span-2">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Informations</h2>
          <div className="space-y-2 text-sm text-gray-600">
            <p>Version : <span className="font-mono">2.0.0</span> (Espace Conseiller)</p>
            <p>Plateforme : Catch&apos;Up — Fondation JAE</p>
            {slug && <p>Identifiant structure : <span className="font-mono text-catchup-primary">{slug}</span></p>}
            <p className="text-gray-400 mt-4">
              Pour modifier votre mot de passe ou vos informations, contactez votre administrateur de structure.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
