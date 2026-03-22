# 00 — Architecture Catch'Up

> Ce fichier est la référence centrale. Tous les autres prompts y font référence.

## Projet
**Catch'Up** — Conseiller orientation IA pour jeunes 16-25 ans (Fondation JAE).
L'IA dialogue avec le bénéficiaire, détecte son profil RIASEC en quelques questions naturelles, et propose des métiers/formations.

## Stack
- **Framework** : Next.js 14 (App Router, TypeScript)
- **Styling** : Tailwind CSS, mobile-first
- **IA** : Vercel AI SDK (`ai/react` useChat) + OpenAI GPT-4o (streaming)
- **DB** : Turso (SQLite edge) + Drizzle ORM (à brancher, MVP sans DB d'abord)
- **Déploiement** : Vercel (web), puis React Native + Expo (natif)
- **Auth** : aucune pour le MVP

## Architecture en 7 couches

```
PROMOTION   → web-only : banner, interstitiel, teaser, QR
UI          → composants React (web) / React Native (natif)
DEVICE      → adapters capteurs (accéléro, AR, haptics, géoloc...) + fallback web
PLATFORM    → adapters services (TTS, STT, caméra, notifs, stockage)
API         → routes streaming OpenAI, endpoints REST
DATA        → Drizzle schema, repositories, sync engine
CORE        → logique RIASEC, parsing profil, system prompt, fragilité, suggestions
```

Règle : chaque couche ne dépend QUE des couches en dessous.

## Arborescence cible

```
src/
  core/           → 100% partagé web+natif (types, riasec, prompts, fragilité)
  data/           → Drizzle schema, repos, adapters Turso/SQLite, sync
  api/            → services réseau abstraits
  platform/       → interfaces/ + web/ + native/ (TTS, STT, caméra, stockage)
  device/         → interfaces/ + web/ + native/ (capteurs hardware)
  promotion/      → SmartBanner, AppInterstitial, FeatureTeaser, QR (web-only)
  components/     → composants UI React
  app/            → Next.js App Router (layout, pages, API routes)
```

## Conventions
- TypeScript strict, pas de `any` sauf nécessité absolue
- Mobile-first (80% du public sur smartphone)
- L'IA s'appelle **Catch'Up** (jamais "conseiller", "assistant" ou "IA")
- Tutoiement systématique dans l'UI
- Emojis dans l'UI et les réponses IA
- Le curseur est toujours positionné dans le champ de saisie par défaut
- Les suggestion chips ENVOIENT directement le message (pas juste remplir l'input)
- Pas d'authentification
- Palette : `#6C63FF` (primaire), `#FF6584` (accent), `#00D2FF` (cyan), `#F0F2F5` (fond)
- Police : Inter

## Migration native (à prévoir)
- La couche Core/Data/API = 100% réutilisable (TypeScript partagé)
- Seule la couche UI sera réécrite en React Native
- Les adapters Platform/Device ont une interface abstraite + implémentation par env
- La version web pousse vers le téléchargement de l'app native (banner, interstitiel, teasing features verrouillées)
