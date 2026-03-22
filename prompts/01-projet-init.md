# 01 — Initialisation du projet

> Contexte : voir `00-architecture.md` pour la stack et les conventions.

## Objectif
Créer le squelette du projet Next.js 14 avec toutes les dépendances et configurations.

## Ce que tu dois faire

### 1. Initialiser le projet
- Next.js 14 avec App Router, TypeScript, Tailwind CSS, ESLint
- Répertoire `src/` pour le code source

### 2. Installer les dépendances

```json
{
  "dependencies": {
    "@ai-sdk/openai": "^1.0.0",
    "@libsql/client": "^0.14.0",
    "ai": "^4.0.0",
    "drizzle-orm": "^0.36.0",
    "emoji-picker-react": "^4.9.0",
    "next": "14.2.35",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-dropzone": "^14.2.3",
    "uuid": "^9.0.0"
  },
  "devDependencies": {
    "@types/uuid": "^9.0.0",
    "drizzle-kit": "^0.28.0"
  }
}
```

### 3. Fichiers de configuration

**tailwind.config.ts** — Couleurs custom :
- `catchup-primary: '#6C63FF'`
- `catchup-secondary: '#FF6584'`
- `catchup-accent: '#00D2FF'`
- `catchup-bg: '#F0F2F5'`
- `catchup-dark: '#1A1A2E'`
- Police : `Inter, Segoe UI, Roboto, sans-serif`

**tsconfig.json** — Path alias `@/*` → `./src/*`

**.env.local** :
```
OPENAI_API_KEY=<ta clé>
TURSO_DATABASE_URL=
TURSO_AUTH_TOKEN=
```

**.gitignore** : `node_modules/`, `.next/`, `.env.local`, `*.tsbuildinfo`, `next-env.d.ts`

### 4. Structure de dossiers vide

Créer les dossiers (vides pour l'instant, remplis par les prompts suivants) :
```
src/core/
src/data/
src/platform/interfaces/
src/platform/web/
src/device/interfaces/
src/device/web/
src/components/
src/components/promotion/
src/app/api/chat/
public/icons/
```

### 5. Layout minimal

**src/app/layout.tsx** :
- `<html lang="fr">`, police Inter (Google Fonts)
- Viewport mobile : `width=device-width, initialScale=1, maximumScale=1, userScalable=false`
- Theme color : `#6C63FF`
- Meta PWA : `manifest="/manifest.json"`, `apple-mobile-web-app-capable`

**src/app/page.tsx** :
- Juste un `<h1>Catch'Up</h1>` centré (placeholder)

**src/app/globals.css** :
- Directives Tailwind
- `html, body { height: 100%; overflow: hidden; }`
- Variables CSS custom pour la palette

**public/manifest.json** :
- PWA manifest avec nom "Catch'Up", standalone, portrait, theme_color #6C63FF

## Vérification
- `npm run dev` démarre sans erreur
- `localhost:3000` affiche le placeholder
- `npm run build` compile sans erreur TypeScript
