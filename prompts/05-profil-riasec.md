# 05 — Profil RIASEC (extraction, affichage, panel)

> Contexte : voir `00-architecture.md`. Prérequis : `01` à `04` exécutés.

## Objectif
Extraire en temps réel le profil RIASEC des réponses de l'IA, le stocker côté client, et l'afficher dans un panneau latéral interactif.

## Flux de données

```
IA répond "Ah tu aimes bricoler ! <!--PROFILE:{"R":60,"I":20,...}-->"
  │
  ▼ onFinish (useChat)
extractProfileFromMessage(rawContent)
  │
  ▼ profil extrait
setProfile(mergeProfiles(prev, next))
  │
  ▼
cleanMessageContent(rawContent) → supprime <!--PROFILE:...-->
  │
  ▼
MessageBubble affiche le texte propre
ProfilePanel affiche les barres mises à jour
```

## Ce qui existe déjà (dans core/)
- `profile-parser.ts` : `extractProfileFromMessage`, `cleanMessageContent`, `mergeProfiles`, `hasSignificantProfile`
- `riasec.ts` : `getAllDimensions`, `getTopDimensions`, `getProfileSummary`
- `types.ts` : `UserProfile`, `RIASEC_LABELS`, `RIASEC_COLORS`, `RIASEC_ICONS`, `EMPTY_PROFILE`

## Composant à créer/compléter

### src/components/ProfilePanel.tsx

Panneau latéral qui slide depuis la droite (animation `slide-in-right`).

**Layout** :
- Position : absolute, inset-y-0 right-0, largeur 320px (mobile) / 384px (desktop)
- Fond blanc, shadow-2xl, z-40
- Par-dessus la zone de chat (pas de push)

**Header du panel** :
- Gradient `from-catchup-primary to-indigo-600`, texte blanc
- Titre "Mon profil" + bouton fermer (✕)
- Afficher le prénom si connu
- Sous-titre : résumé du profil (`getProfileSummary`) ou "Continue la conversation pour découvrir ton profil !"

**Section barres RIASEC** :
- Titre "Dimensions d'orientation"
- 6 barres horizontales, une par dimension :
  - Gauche : emoji + label (ex: 🔧 Réaliste)
  - Droite : score numérique
  - Barre de progression colorée (couleur de `RIASEC_COLORS[key]`)
  - Largeur proportionnelle au score (0-100)
  - Transition animée (duration-700, ease-out)
- Les barres avec score 0 restent visibles mais vides (gris clair)

**Section traits de personnalité** :
- Tags en pilules violet clair (`bg-purple-50 text-purple-700`)
- Affiché seulement si `traits.length > 0`

**Section centres d'intérêt** :
- Tags en pilules bleu clair (`bg-blue-50 text-blue-700`)
- Affiché seulement si `interests.length > 0`

**Section points forts** :
- Tags en pilules vert clair (`bg-green-50 text-green-700`)
- Affiché seulement si `strengths.length > 0`

**Section piste suggérée** :
- Encadré gradient léger (`from-catchup-primary/5 to-indigo-50`)
- Icône 💡 + titre "Piste suggérée"
- Texte de la suggestion
- Affiché seulement si `suggestion` non vide

**État vide** (aucun score) :
- Icône 🔍 dans un cercle gris
- "Ton profil se remplit au fur et à mesure de notre conversation. Plus on discute, plus je te connais !"

## Intégration dans ChatApp

- Bouton profil dans le header (icône 👤)
- Pastille verte si `hasSignificantProfile(profile) === true`
- Clic → `setShowProfile(!showProfile)`
- Le panel s'affiche par-dessus la zone de chat
- Clic sur ✕ ou clic en dehors → ferme le panel

## System prompt (rappel)

Le prompt dans `system-prompt.ts` OBLIGE l'IA à insérer le bloc `<!--PROFILE:...-->` à chaque message dès le 3ème échange. Les scores doivent être progressifs : commencer bas et augmenter.

Format attendu :
```
<!--PROFILE:{"R":0,"I":45,"A":70,"S":30,"E":10,"C":5,"name":"Lucas","traits":["créatif","curieux"],"interests":["musique","dessin"],"strengths":["imagination","écoute"],"suggestion":"design graphique ou métiers de la création"}-->
```

## Vérification
- [ ] Après 3-4 échanges, le panel profil montre des scores > 0
- [ ] Les barres s'animent quand les scores changent
- [ ] Le prénom apparaît quand l'IA l'a capté
- [ ] Les traits/intérêts/forces se remplissent progressivement
- [ ] La suggestion de métier apparaît quand l'IA a assez d'infos
- [ ] Le texte du chat ne montre JAMAIS le bloc <!--PROFILE:...-->
- [ ] La pastille verte apparaît sur le bouton profil dès qu'il y a des scores
