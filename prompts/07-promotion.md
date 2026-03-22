# 07 — Promotion (passerelle web → app native)

> Contexte : voir `00-architecture.md`. Prérequis : `01` à `06` exécutés.

## Objectif
Implémenter le système qui pousse intelligemment les utilisateurs web vers le téléchargement de l'app native, sans être intrusif.

## Arbre de décision

```
Utilisateur arrive
  │
  ├── App native ? → NE RIEN AFFICHER
  ├── PWA installée ? → Bannière légère "Passe à l'app complète"
  ├── Mobile browser ?
  │   ├── Banner déjà fermé < 5 jours ? → Rien
  │   ├── Banner jamais fermé → Smart Banner
  │   └── Banner fermé > 5 jours → Ré-afficher
  └── Desktop ? → QR Code en bas d'écran

Après 4+ conversations → Interstitiel (1 seule fois)

Pendant le chat → Feature teasers (cadenas "dispo dans l'app")
```

## Composants à créer

### src/components/promotion/SmartBanner.tsx

Bannière style App Store/Play Store en haut de l'écran.

**Détection de contexte** :
- `detectPlatform()` : iOS (`/iphone|ipad|ipod/`), Android (`/android/`), desktop (reste)
- `isStandalone()` : `window.matchMedia('(display-mode: standalone)')` ou `navigator.standalone`

**Logique d'affichage** :
- Ne PAS afficher si desktop, PWA installée, ou app native
- Ne PAS afficher si fermé depuis moins de 5 jours (`localStorage 'catchup_banner_dismissed'`)
- Afficher avec délai de 2 secondes (pas au chargement brutal)
- Animation : slide-down depuis le haut

**Contenu** :
- Bouton fermer ✕ (gauche)
- Icône app 🚀 dans un carré arrondi gradient
- Nom "Catch'Up" + "Sur l'App Store / Google Play · Gratuit"
- 4.5 étoiles (★★★★½)
- Bouton "OBTENIR" (pilule violette)

**Fermeture** :
- Clic ✕ → `localStorage.setItem('catchup_banner_dismissed', Date.now())`
- Disparaît

### src/components/promotion/AppInterstitial.tsx

Écran plein modal après 4+ conversations, montré UNE SEULE FOIS.

**Logique** :
- Se déclenche quand `conversationCount >= 4`
- Vérifie `localStorage 'catchup_interstitial_shown'`
- Si déjà montré → ne plus jamais montrer

**Design** :
- Overlay fond noir 60% + backdrop-blur
- Carte blanche centrée, max-w-sm, rounded-3xl
- Header gradient violet : icône 🚀, "Passe à la vitesse supérieure", sous-titre
- Liste des features exclusives (6 items avec emoji) :
  - 📱 Secoue pour un métier surprise
  - 📸 Filtre AR "moi en tant que..."
  - 📍 Formations & stages à côté de chez toi
  - 🏠 Widget motivation quotidien
  - ✈️ Exercices d'orientation hors-ligne
  - 🔔 Rappels bienveillants
- Bouton "Télécharger l'app" (violet, pleine largeur)
- Bouton "Plus tard" (texte gris, discret)

**Fermeture** :
- "Plus tard" → `localStorage.setItem('catchup_interstitial_shown', 'true')`
- Disparaît pour toujours

### src/components/promotion/FeatureTeaser.tsx

Mini composant "cadenas" affiché inline dans le chat quand une feature est réservée à l'app.

**Props** : `feature: 'ar' | 'shake' | 'location' | 'widget' | 'offline'`

**Contenu par feature** :
- `ar` : 📸 "Filtre AR «moi en tant que...»"
- `shake` : 📱 "Secoue pour un métier surprise"
- `location` : 📍 "Formations à proximité"
- `widget` : 🏠 "Widget motivation"
- `offline` : ✈️ "Mode hors-ligne complet"

**Design** :
- Inline-flex, pilule grise avec bordure
- 🔒 + emoji feature + label + "Dispo dans l'app" (texte violet petit)
- Curseur default (pas cliquable pour l'instant)

**Usage futur** :
Quand l'IA suggère un métier, afficher sous le message :
```tsx
<FeatureTeaser feature="location" />
<FeatureTeaser feature="ar" />
```

### src/components/promotion/QRDownload.tsx (optionnel, pour desktop)

QR code fixé en bas à droite sur desktop uniquement.
- Visible seulement si `platform === 'desktop'`
- Petit widget : "📱 Télécharge l'app" + QR code (image placeholder pour l'instant)
- Fermable

## Intégration

**src/app/page.tsx** :
```tsx
<>
  <SmartBanner />
  <ChatApp />
</>
```

L'interstitiel sera déclenché depuis ChatApp quand le compteur de conversations atteint le seuil.

## Vérification
- [ ] Sur mobile (Chrome DevTools) : la bannière apparaît après 2s
- [ ] Fermer la bannière → elle ne réapparaît pas pendant 5 jours
- [ ] Après 4 conversations (simuler) → l'interstitiel apparaît
- [ ] "Plus tard" → l'interstitiel ne réapparaît jamais
- [ ] Sur desktop : pas de bannière
- [ ] Le FeatureTeaser s'affiche correctement inline
