'use client'

// Page de declaration d'accessibilite RGAA 4.1
// Accessible publiquement sans authentification

import { RGAA_SCORE } from '@/components/RgaaPanel'

const CONFORMITE_NIVEAU = RGAA_SCORE >= 100 ? 'totalement conforme' : RGAA_SCORE >= 50 ? 'partiellement conforme' : 'non conforme'

export default function AccessibilitePage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-gradient-to-r from-catchup-dark to-[#16213E] text-white py-8 px-4">
        <div className="max-w-3xl mx-auto">
          <a href="/" className="text-sm text-white/60 hover:text-white/90 transition mb-4 inline-block">
            &larr; Retour a Catch&apos;Up
          </a>
          <h1 className="text-2xl sm:text-3xl font-bold mb-2">Declaration d&apos;accessibilite</h1>
          <p className="text-white/70 text-sm">
            Referentiel general d&apos;amelioration de l&apos;accessibilite (RGAA 4.1)
          </p>
        </div>
      </header>

      {/* Contenu */}
      <main className="max-w-3xl mx-auto px-4 py-8 sm:py-12 space-y-10">

        {/* Etat de conformite */}
        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-4 border-b border-gray-200 pb-2">
            Etat de conformite
          </h2>
          <p className="text-gray-700 leading-relaxed">
            La plateforme <strong>Catch&apos;Up</strong> (catchup.jaeprive.fr) est{' '}
            <strong className="text-catchup-primary">{CONFORMITE_NIVEAU}</strong> avec le
            referentiel general d&apos;amelioration de l&apos;accessibilite (RGAA) version 4.1.
          </p>
          <div className="mt-4 inline-flex items-center gap-3 bg-catchup-primary/5 border border-catchup-primary/20 rounded-xl px-5 py-3">
            <span className="text-3xl font-bold text-catchup-primary">{RGAA_SCORE}%</span>
            <div>
              <p className="text-sm font-medium text-gray-800">Taux de conformite</p>
              <p className="text-xs text-gray-500">Derniere evaluation : avril 2026</p>
            </div>
          </div>
        </section>

        {/* Resultats des tests */}
        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-4 border-b border-gray-200 pb-2">
            Resultats des tests
          </h2>
          <p className="text-gray-700 leading-relaxed mb-4">
            L&apos;audit de conformite realise en avril 2026 revele que sur les 14 criteres evalues :
          </p>

          <div className="grid sm:grid-cols-3 gap-4 mb-6">
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-green-600">12</p>
              <p className="text-sm text-green-800">Criteres conformes</p>
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-amber-600">1</p>
              <p className="text-sm text-amber-800">Critere partiel</p>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-red-500">1</p>
              <p className="text-sm text-red-800">Critere manquant</p>
            </div>
          </div>

          {/* Tableau detaille */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left py-2.5 px-3 font-semibold text-gray-700">Critere</th>
                  <th className="text-center py-2.5 px-3 font-semibold text-gray-700 w-28">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {[
                  { label: 'Navigation au clavier', status: 'ok', detail: 'Tous les elements interactifs sont accessibles au clavier (Tab, Entree, Echap). Ordre de tabulation logique.' },
                  { label: 'Attributs ARIA (roles, labels)', status: 'ok', detail: 'Roles ARIA sur les dialogues, panneaux, boutons. Labels descriptifs sur les elements interactifs. aria-expanded sur les menus deroulants.' },
                  { label: 'Contraste des textes (AA)', status: 'ok', detail: 'Ratio de contraste minimum 4.5:1 pour le texte normal, 3:1 pour le texte agrandi, conforme au niveau AA des WCAG 2.1.' },
                  { label: 'Taille de texte ajustable', status: 'ok', detail: 'Trois niveaux de taille de police (normal, grand, tres grand) accessibles depuis le panneau d\'accessibilite dans le header.' },
                  { label: 'Interligne ajustable', status: 'ok', detail: 'L\'espacement entre les lignes peut etre augmente via le panneau d\'accessibilite pour ameliorer la lisibilite.' },
                  { label: 'Mode contraste renforce', status: 'ok', detail: 'Un mode haut contraste est disponible, augmentant la differenciation des couleurs pour les utilisateurs malvoyants.' },
                  { label: 'Animations reductibles', status: 'ok', detail: 'Respecte la preference systeme prefers-reduced-motion. Les animations peuvent etre desactivees depuis le panneau d\'accessibilite.' },
                  { label: 'Lecture vocale (TTS)', status: 'ok', detail: 'Chaque message de l\'assistant IA dispose d\'un bouton de lecture vocale. Synthese vocale via Google TTS ou Web Speech API, disponible en 10 langues.' },
                  { label: 'Support multilingue', status: 'ok', detail: '10 langues supportees : francais, anglais, arabe, portugais, turc, italien, espagnol, allemand, roumain, chinois. Changement instantane en cours de conversation.' },
                  { label: 'Formulaires accessibles', status: 'ok', detail: 'Tous les champs de formulaire ont des labels associes (htmlFor/id). Messages d\'erreur lies aux champs via role="alert". Placeholder descriptifs.' },
                  { label: 'Textes alternatifs images et icones', status: 'ok', detail: 'Toutes les images significatives ont un attribut alt descriptif. Les emojis decoratifs ont role="img" et aria-label. Les icones SVG decoratives ont aria-hidden="true".' },
                  { label: 'Sous-titres / transcriptions audio', status: 'ok', detail: 'Les messages vocaux sont automatiquement transcrits par l\'IA (OpenAI Whisper). La transcription est affichee par defaut sous le lecteur audio, avec un bouton CC pour la masquer/afficher.' },
                  { label: 'Compatible lecteurs d\'ecran', status: 'partial', detail: 'Compatible avec NVDA et VoiceOver pour la navigation principale. Tests en cours sur les composants complexes (profil RIASEC, gamification). Regions ARIA et landmarks en place.' },
                  { label: 'Documentation accessibilite', status: 'ok', detail: 'Cette page constitue la declaration d\'accessibilite conforme au RGAA 4.1, incluant le detail des criteres, les moyens de contact et le plan d\'amelioration.' },
                ].map((item, i) => (
                  <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                    <td className="py-3 px-3">
                      <p className="font-medium text-gray-800">{item.label}</p>
                      <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{item.detail}</p>
                    </td>
                    <td className="py-3 px-3 text-center">
                      {item.status === 'ok' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-green-100 text-green-700 text-xs font-medium">
                          <span aria-hidden="true">&#10003;</span> Conforme
                        </span>
                      )}
                      {item.status === 'partial' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-100 text-amber-700 text-xs font-medium">
                          ~ Partiel
                        </span>
                      )}
                      {item.status === 'missing' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-red-100 text-red-600 text-xs font-medium">
                          <span aria-hidden="true">&#10007;</span> Manquant
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Technologies utilisees */}
        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-4 border-b border-gray-200 pb-2">
            Technologies utilisees
          </h2>
          <ul className="space-y-2 text-gray-700 text-sm">
            <li className="flex items-start gap-2">
              <span className="text-catchup-primary mt-0.5">&#8226;</span>
              <span>HTML5 semantique (header, main, nav, section, article, dialog)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-catchup-primary mt-0.5">&#8226;</span>
              <span>WAI-ARIA 1.2 (roles, labels, expanded, live regions, progressbar)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-catchup-primary mt-0.5">&#8226;</span>
              <span>CSS : Tailwind CSS avec media queries prefers-reduced-motion et prefers-contrast</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-catchup-primary mt-0.5">&#8226;</span>
              <span>JavaScript / TypeScript (React 18, Next.js 14)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-catchup-primary mt-0.5">&#8226;</span>
              <span>Web Speech API et Google TTS pour la synthese vocale</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-catchup-primary mt-0.5">&#8226;</span>
              <span>OpenAI Whisper pour la transcription automatique des messages vocaux</span>
            </li>
          </ul>
        </section>

        {/* Contenus non accessibles */}
        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-4 border-b border-gray-200 pb-2">
            Contenus non accessibles
          </h2>
          <h3 className="text-base font-semibold text-gray-800 mb-2">Non-conformites</h3>
          <ul className="space-y-2 text-gray-700 text-sm mb-4">
            <li className="flex items-start gap-2">
              <span className="text-amber-500 mt-0.5">&#8226;</span>
              <span>
                <strong>Compatibilite lecteurs d&apos;ecran</strong> : les composants complexes
                (graphique radar RIASEC, systeme de gamification, editeur de waveform audio)
                ne sont pas encore pleinement accessibles avec NVDA/VoiceOver/TalkBack.
                Des tests complementaires sont en cours.
              </span>
            </li>
          </ul>
          <h3 className="text-base font-semibold text-gray-800 mb-2">Ameliorations prevues</h3>
          <ul className="space-y-2 text-gray-700 text-sm">
            <li className="flex items-start gap-2">
              <span className="text-catchup-primary mt-0.5">&#8226;</span>
              <span>Tests complets avec NVDA, VoiceOver (macOS/iOS) et TalkBack (Android)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-catchup-primary mt-0.5">&#8226;</span>
              <span>Ajout de descriptions ARIA detaillees pour le graphique radar RIASEC</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-catchup-primary mt-0.5">&#8226;</span>
              <span>Navigation par raccourcis clavier dans le chat (messages precedents/suivants)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-catchup-primary mt-0.5">&#8226;</span>
              <span>Mode lecture simplifiee pour les contenus longs</span>
            </li>
          </ul>
        </section>

        {/* Environnement de test */}
        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-4 border-b border-gray-200 pb-2">
            Environnement de test
          </h2>
          <p className="text-gray-700 text-sm mb-3">
            Les verifications d&apos;accessibilite ont ete realisees avec les combinaisons suivantes :
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse border border-gray-200 rounded-lg overflow-hidden">
              <thead>
                <tr className="bg-gray-50">
                  <th className="text-left py-2 px-3 border-b border-gray-200 font-semibold text-gray-700">Navigateur</th>
                  <th className="text-left py-2 px-3 border-b border-gray-200 font-semibold text-gray-700">Systeme</th>
                  <th className="text-left py-2 px-3 border-b border-gray-200 font-semibold text-gray-700">Technologie assistive</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                <tr><td className="py-2 px-3">Chrome 125+</td><td className="py-2 px-3">Windows 11</td><td className="py-2 px-3">NVDA 2024.1</td></tr>
                <tr className="bg-gray-50/50"><td className="py-2 px-3">Safari 17+</td><td className="py-2 px-3">macOS / iOS 17+</td><td className="py-2 px-3">VoiceOver</td></tr>
                <tr><td className="py-2 px-3">Chrome 125+</td><td className="py-2 px-3">Android 14+</td><td className="py-2 px-3">TalkBack</td></tr>
                <tr className="bg-gray-50/50"><td className="py-2 px-3">Firefox 126+</td><td className="py-2 px-3">Windows 11</td><td className="py-2 px-3">NVDA 2024.1</td></tr>
                <tr><td className="py-2 px-3">Samsung Internet</td><td className="py-2 px-3">Android (Z Fold 7)</td><td className="py-2 px-3">TalkBack</td></tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Droit a la compensation */}
        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-4 border-b border-gray-200 pb-2">
            Retour d&apos;information et contact
          </h2>
          <p className="text-gray-700 text-sm leading-relaxed mb-4">
            Si vous n&apos;arrivez pas a acceder a un contenu ou un service de cette plateforme,
            vous pouvez nous contacter pour etre oriente vers une alternative accessible ou
            obtenir le contenu sous une autre forme.
          </p>
          <div className="bg-gray-50 rounded-xl p-5 space-y-3">
            <div className="flex items-start gap-3">
              <span className="text-catchup-primary font-bold text-sm">Email</span>
              <a href="mailto:dpo@fondation-jae.org" className="text-sm text-catchup-primary hover:underline">
                dpo@fondation-jae.org
              </a>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-catchup-primary font-bold text-sm">Editeur</span>
              <span className="text-sm text-gray-700">Fondation JAE</span>
            </div>
          </div>
        </section>

        {/* Voies de recours */}
        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-4 border-b border-gray-200 pb-2">
            Voies de recours
          </h2>
          <p className="text-gray-700 text-sm leading-relaxed mb-3">
            Si vous constatez un defaut d&apos;accessibilite vous empechant d&apos;acceder
            a un contenu ou une fonctionnalite du site, que vous nous le signalez et que
            vous ne parvenez pas a obtenir une reponse de notre part, vous etes en droit
            de faire parvenir vos doleances ou une demande de saisine au Defenseur des droits.
          </p>
          <ul className="space-y-2 text-gray-700 text-sm">
            <li className="flex items-start gap-2">
              <span className="text-catchup-primary mt-0.5">&#8226;</span>
              <span>
                Ecrire un message au{' '}
                <a href="https://formulaire.defenseurdesdroits.fr/" target="_blank" rel="noopener noreferrer" className="text-catchup-primary hover:underline">
                  Defenseur des droits
                </a>
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-catchup-primary mt-0.5">&#8226;</span>
              <span>Contacter le delegue du Defenseur des droits dans votre region</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-catchup-primary mt-0.5">&#8226;</span>
              <span>
                Envoyer un courrier (gratuit, ne pas mettre de timbre) :{' '}
                <em>Defenseur des droits, Libre reponse 71120, 75342 Paris CEDEX 07</em>
              </span>
            </li>
          </ul>
        </section>

        {/* Mentions */}
        <section className="border-t border-gray-200 pt-8">
          <p className="text-xs text-gray-400 text-center">
            Cette declaration d&apos;accessibilite a ete etablie le 5 avril 2026.
            <br />
            Catch&apos;Up &mdash; Version {RGAA_SCORE}% RGAA 4.1 &mdash; Fondation JAE
          </p>
        </section>

      </main>
    </div>
  )
}
