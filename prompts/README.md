# Prompts Catch'Up — Guide d'utilisation

## Ordre d'exécution

Exécuter **dans l'ordre**, chaque prompt part de l'état laissé par le précédent.

| # | Fichier | Description | Dépend de |
|---|---------|-------------|-----------|
| 00 | `00-architecture.md` | Référence centrale (stack, conventions, couches) | — |
| 01 | `01-projet-init.md` | Init Next.js, Tailwind, dépendances, configs | 00 |
| 02 | `02-core.md` | Logique métier : types, RIASEC, prompts, fragilité | 01 |
| 03 | `03-chat-api.md` | Route streaming OpenAI GPT-4o | 01, 02 |
| 04 | `04-chat-ui.md` | Interface WhatsApp-like complète | 01, 02, 03 |
| 05 | `05-profil-riasec.md` | Panel profil, barres, extraction temps réel | 02, 04 |
| 06 | `06-vocal.md` | TTS voix masculine, STT dictée, mode RGAA | 04 |
| 07 | `07-promotion.md` | Smart banner, interstitiel, feature teaser | 04 |
| 08 | `08-pwa-offline.md` | Manifest, service worker, cache, offline | 01, 04 |
| 09 | `09-database.md` | Turso + Drizzle, persistance, repositories | 03 |

## Comment utiliser

### Avec un outil IA (Cursor, Bolt, Claude, V0...)

1. Colle le contenu de `00-architecture.md` en premier message (ou dans les instructions système)
2. Puis colle `01-projet-init.md` et demande à l'IA de l'exécuter
3. Vérifie que tout fonctionne avant de passer au suivant
4. Continue avec 02, 03, etc.

### Tips
- **Ne pas tout envoyer d'un coup** : un prompt à la fois, vérifier entre chaque
- **Si erreur** : copier l'erreur et demander à l'IA de corriger avant de continuer
- **Si contexte saturé** : ouvrir une nouvelle conversation, recoller 00 + rappeler ce qui est déjà fait
- **Pour modifier une feature** : relancer uniquement le prompt concerné

### Groupements possibles
Si ton outil a un contexte large, tu peux grouper :
- **Groupe 1** : 01 + 02 + 03 (base technique)
- **Groupe 2** : 04 + 05 + 06 (interface complète)
- **Groupe 3** : 07 + 08 (PWA + promotion)
- **Groupe 4** : 09 (database, à brancher en dernier)
