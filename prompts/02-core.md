# 02 — Couche Core (logique métier partagée)

> Contexte : voir `00-architecture.md`. Ce code sera réutilisé tel quel dans l'app native.
> Prérequis : `01-projet-init.md` exécuté.

## Objectif
Créer toute la logique métier dans `src/core/`. Aucune dépendance React, Next.js, ou navigateur. Uniquement du TypeScript pur.

## Fichiers à créer

### src/core/types.ts
Toutes les interfaces partagées :

- **Message** : `id, conversationId, role ('user'|'assistant'), content, rawContent?, audioUrl?, timestamp, metadata?`
- **MessageMetadata** : `fragilityDetected?, fragilityLevel? ('low'|'medium'|'high'), profileExtracted?`
- **UserProfile** : `id, name?, R, I, A, S, E, C` (scores 0-100), `traits[], interests[], strengths[], suggestion, updatedAt`
- **ConversationState** : `id, title, messages[], status, startedAt, lastMessageAt, messageCount`
- **AppSettings** : `ttsEnabled, ttsVoice ('male'|'female'), rgaaMode, locale, theme`
- **PromotionState** : `bannerDismissed, bannerDismissedAt?, interstitialShown, sessionCount, conversationCount, lastVisit, platform, context`
- **DeviceCapabilities** : booléens pour chaque capteur (motion, haptics, location, AR, biometrics, camera, contacts, calendar, widget, voiceAssistant, pushNotifications, isNative)
- **OfflineQueueItem** : `id, action, table, payload, createdAt, syncedAt?, retries`

Constantes exportées :
- `RIASEC_LABELS` : `{ R: 'Réaliste', I: 'Investigateur', A: 'Artiste', S: 'Social', E: 'Entreprenant', C: 'Conventionnel' }`
- `RIASEC_COLORS` : `{ R: '#E74C3C', I: '#3498DB', A: '#9B59B6', S: '#2ECC71', E: '#F39C12', C: '#1ABC9C' }`
- `RIASEC_ICONS` : `{ R: '🔧', I: '🔬', A: '🎨', S: '🤝', E: '🚀', C: '📊' }`
- `EMPTY_PROFILE` : profil vide avec tous les scores à 0

### src/core/profile-parser.ts
- `extractProfileFromMessage(content: string): UserProfile | null` — Parse le bloc `<!--PROFILE:{...}-->` inséré par l'IA. JSON.parse le contenu, clamp les scores 0-100, retourne null si pas de match.
- `cleanMessageContent(content: string): string` — Supprime les blocs `<!--PROFILE:...-->` du texte affiché.
- `getTopDimensions(profile, count): { key, score }[]` — Les N dimensions les plus fortes, triées.
- `mergeProfiles(prev, next): UserProfile` — Fusionne en gardant le name de prev si next n'en a pas.
- `hasSignificantProfile(profile): boolean` — true si la somme des scores > 0.

### src/core/system-prompt.ts
Construit le system prompt dynamique envoyé à GPT-4o.

Le prompt est composé de :
1. **Base persona** : Catch'Up, tutoiement, chaleureux, emojis modérés, 3-4 phrases max, jamais se présenter comme IA
2. **Instructions RIASEC** : les 6 dimensions expliquées (pour l'IA, pas le jeune), objectif de détection en minimum de questions
3. **Contexte profil** (si existant) : scores actuels, traits, intérêts, forces — pour que l'IA affine ses questions
4. **Instructions par stage** :
   - Découverte (0-5 messages) : questions ouvertes, créer le lien, demander le prénom
   - Exploration (6-15 messages) : questions ciblées RIASEC, technique du miroir, premières pistes
   - Décision (16+ messages) : 2-3 métiers concrets, pourquoi ça correspond, prochaines étapes
5. **Règles fragilité** : valider les émotions, ne pas minimiser, orienter vers 3114 si détresse forte
6. **Règles extraction profil** : OBLIGATOIRE dès le 3ème échange, bloc `<!--PROFILE:{"R":0,...,"name":"","traits":[],"interests":[],"strengths":[],"suggestion":""}-->` en fin de message, mis à jour à chaque réponse

Exporter : `buildSystemPrompt(profile?: UserProfile, messageCount?: number): string`

### src/core/fragility-detector.ts
Détection par mots-clés en français, répartis en catégories :
- **découragement** : "rien ne marche", "je suis nul", "j'abandonne", "à quoi bon"...
- **isolement** : "tout seul", "personne me comprend", "rejeté", "invisible"...
- **détresse** : "mourir", "suicide", "en finir", "déprimé", "angoisse"...
- **rupture** : "viré", "décrochage", "sans diplôme", "la rue"...

Exporter :
- `detectFragility(text): boolean`
- `getFragilityLevel(text): 'none' | 'low' | 'medium' | 'high'` (détresse = +3, isolement = +2, découragement = +1, rupture = +1)

### src/core/suggestions.ts
Chips contextuelles pour les jeunes.

**Suggestions initiales** (avant tout échange) :
- "Je sais pas quoi faire plus tard 🤷"
- "J'ai une passion mais est-ce un métier ? 💡"
- "Je veux changer de voie 🔄"
- "Aide-moi à me connaître 🪞"
- "J'ai peur de me tromper 😰"
- "C'est quoi les métiers d'avenir ? 🔮"

**Suggestions découverte** (< 6 messages) :
- "Je kiffe créer des trucs 🎨", "J'aime aider les gens 🤝", "La tech me fascine 💻"...

**Suggestions exploration** (6-15 messages) :
- "Quels métiers me correspondraient ? 🎯", "Et niveau salaire ? 💶", "Quelles études ? 📚"...

**Suggestions décision** (16+ messages) :
- "Comment je commence concrètement ? 🚀", "Y'a des stages ? 🏢"...

Exporter : `getSuggestions(messageCount): Suggestion[]` et `INITIAL_SUGGESTIONS`

### src/core/riasec.ts
- `getAllDimensions(profile): DimensionInfo[]` — Les 6 dimensions avec label, color, icon, score
- `getTopDimensions(profile, count): DimensionInfo[]` — Top N triées par score
- `getProfileSummary(profile): string` — Ex: "Profil dominant : Artiste & Social"

## Contraintes
- Zéro import de React, Next.js, window, document, navigator
- Uniquement du TypeScript pur, exécutable dans n'importe quel runtime
- Tests possibles avec un simple `ts-node`
