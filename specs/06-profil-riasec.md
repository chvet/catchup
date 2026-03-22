# 06 — Profil RIASEC

## Principe directeur
**Le profil émerge de la conversation, jamais d'un questionnaire.** Le jeune ne sait pas qu'il passe un test. Il parle de lui, de ses passions, de son quotidien — et Catch'Up construit son profil en arrière-plan, comme un conseiller humain qui écoute et prend des notes mentales.

**Le mot "RIASEC" n'est JAMAIS prononcé devant le jeune.** On parle de "ton profil", "tes forces", "ce qui te ressemble".

---

## Le modèle RIASEC en bref

### Les 6 dimensions

| Code | Nom | Emoji | Couleur | Ce que ça veut dire |
|------|-----|-------|---------|-------------------|
| R | Réaliste | 🔧 | #E74C3C (rouge) | Aime construire, réparer, travailler avec les mains, être en extérieur |
| I | Investigateur | 🔬 | #3498DB (bleu) | Curieux, aime comprendre, analyser, résoudre des problèmes |
| A | Artiste | 🎨 | #9B59B6 (violet) | Créatif, imaginatif, aime s'exprimer, originalité |
| S | Social | 🤝 | #2ECC71 (vert) | Aime aider les autres, écouter, enseigner, travailler en équipe |
| E | Entreprenant | 🚀 | #F39C12 (orange) | Leader, aime convaincre, organiser, prendre des décisions |
| C | Conventionnel | 📊 | #1ABC9C (turquoise) | Organisé, méthodique, aime la précision, les chiffres, les règles |

### Pourquoi RIASEC ?
- Modèle validé scientifiquement (Holland, 1959 — utilisé mondialement)
- Simple (6 dimensions vs 16 pour MBTI)
- Directement lié aux métiers (chaque métier a un code RIASEC dans les bases ONISEP/ROME)
- Compatible avec Parcoureo (qui utilise déjà RIASEC)
- Facile à visualiser (6 barres, un hexagone, ou un radar)

---

## 2 sources de profil

### Source 1 — Le mini-quiz (estimation rapide)

Le quiz 3 questions (cf. spec 05) donne un profil **grossier** :
- Seules 2-3 dimensions scorées (les autres restent à 20)
- Scores fixes (+35 par choix)
- Pas de nuance, pas de traits ni d'intérêts

Ce profil sert de **point de départ** pour le chat, pas de résultat définitif.

### Source 2 — La conversation (profil affiné)

Le chat avec Catch'Up construit un profil **progressif et nuancé** :
- Les 6 dimensions scorées de 0 à 100
- Traits de personnalité extraits ("créatif", "empathique", "rêveur")
- Centres d'intérêt concrets ("musique", "dessin", "jeux vidéo")
- Forces identifiées ("imagination", "écoute", "persévérance")
- Suggestion de piste métier/domaine

**C'est cette source qui fait la valeur de Catch'Up.** Le quiz attire, le chat approfondit.

---

## Mécanisme d'extraction invisible

### Comment ça fonctionne

L'IA (GPT-4o) reçoit dans son `system prompt` l'instruction d'insérer un bloc JSON invisible dans chaque réponse :

```
<!--PROFILE:{"R":15,"I":25,"A":70,"S":55,"E":10,"C":5,"name":"Lucas","traits":["créatif","empathique"],"interests":["musique","dessin"],"strengths":["imagination","écoute"],"suggestion":"design graphique ou animation"}-->
```

Ce bloc est un **commentaire HTML** — invisible dans le rendu du chat. Le frontend le capture via regex, met à jour le profil en état React, puis supprime le bloc du texte affiché.

**Nettoyage pendant le streaming :** Comme la réponse IA arrive en flux continu (token par token), le bloc `<!--PROFILE:...-->` apparaît progressivement. La fonction `cleanMessageContent()` gère 3 cas :
1. Blocs complets (`<!--PROFILE:{...}-->`) → supprimés par regex standard
2. Blocs partiels en cours (`<!--PROFILE:{"R":25...` sans `-->`) → supprimés par regex fin de chaîne
3. Débuts de blocs très partiels (`<!--PR`, `<!--PROFI`) → supprimés pour éviter tout flash visuel

### Pourquoi cette approche ?

| Approche alternative | Problème |
|---------------------|----------|
| Appel API séparé pour l'extraction | Double coût, latence, risque de désynchronisation |
| Analyse côté serveur après le message | Idem + complexité serveur |
| Extraction côté client (traitement local) | Trop imprécis, pas de contexte conversationnel |
| **Bloc invisible dans la réponse IA** ✅ | Zéro coût supplémentaire, synchrone, contextualisé |

### Flux technique

```
Le jeune envoie un message
  │
  ▼
Le frontend envoie à l'API : { messages, profil (actuel), nbMessages }
  │
  ▼
L'API construit le prompt système avec le profil actuel injecté
  │
  ▼
GPT-4o répond en flux continu (streaming) avec le texte + <!--PROFILE:{...}-->
  │
  ▼
Le frontend reçoit la réponse complète
  │
  ├── extraireProfilDepuisMessage(contenu) → nouveau profil
  │   └── fusionnerProfils(ancien, nouveau) → profil fusionné
  │       └── miseÀJourÉtat(profilFusionné)
  │           └── Mise à jour des barres RIASEC en temps réel
  │
  └── nettoyerContenuMessage(contenu) → texte sans le bloc
      └── Affichage dans la bulle de message
```

---

## Règles d'évolution des scores

### Principe : progressivité
Les scores ne sautent pas de 0 à 80 en un message. L'IA doit être progressive :

| Phase conversation | Scores typiques | Comportement attendu |
|-------------------|----------------|---------------------|
| Messages 1-3 | Tous à 0 | Pas encore assez d'info, l'IA ne score pas |
| Messages 3-6 | 10-35 max | Premiers signaux, scores prudents |
| Messages 6-10 | 20-60 | Le profil se dessine, 2-3 dimensions émergent |
| Messages 10-16 | 30-80 | Profil clair, dimensions dominantes stables |
| Messages 16+ | 40-95 | Profil affiné, nuances entre dimensions proches |

### Règles pour l'IA (dans le system prompt)

1. **Pas de score avant le 3ème échange** — trop tôt pour juger
2. **Commencer bas** — premier score d'une dimension ≤ 35
3. **Incrémenter par paliers de 5-15** — pas de saut de +30 en un message
4. **Ne jamais baisser un score de plus de 10 en un message** — le profil se construit, ne se déconstruit pas (sauf contradiction explicite du jeune)
5. **La somme des 6 dimensions n'a pas à faire 100** — chaque dimension est indépendante (un jeune peut être à la fois très Artiste ET très Social)
6. **Minimum 2 dimensions > 30 avant de suggérer des pistes** — sinon trop vague

### Signaux de détection par dimension

L'IA évalue les scores à partir des signaux suivants (non exhaustif) :

**R (Réaliste) ↑ quand le jeune parle de :**
- Bricolage, mécanique, construction, jardinage
- Sport physique, nature, plein air
- "Je préfère faire que parler", "j'aime le concret"
- Travail manuel, outils, machines

**I (Investigateur) ↑ quand le jeune parle de :**
- Sciences, techno, maths, puzzles, enquêtes
- "Je veux comprendre comment ça marche"
- Lecture, recherche, curiosité, expérimentation
- Jeux de stratégie, programmation

**A (Artiste) ↑ quand le jeune parle de :**
- Musique, dessin, écriture, photo, vidéo
- Mode, déco, design, artisanat créatif
- "J'aime créer", "j'ai besoin de m'exprimer"
- Imaginaire, rêverie, originalité

**S (Social) ↑ quand le jeune parle de :**
- Aider les autres, écouter, enseigner
- Bénévolat, association, vie de groupe
- "Les gens comptent pour moi", "j'aime travailler en équipe"
- Empathie, soins, service aux autres

**E (Entreprenant) ↑ quand le jeune parle de :**
- Organiser, diriger, convaincre, négocier
- Projets, entrepreneuriat, commerce, vente
- "J'aime être en charge", "j'ai des idées"
- Compétition, influence, leadership

**C (Conventionnel) ↑ quand le jeune parle de :**
- Organisation, rangement, méthode, planification
- Chiffres, comptabilité, bureautique
- "J'aime que ce soit clair et structuré"
- Règles, procédures, précision, fiabilité

---

## Stabilisation du profil

### Quand le profil est-il "stable" ?

Le profil est considéré **stabilisé** quand :
1. Au moins 2 dimensions > 40
2. Les 2 dimensions dominantes n'ont pas changé depuis 3 messages consécutifs
3. Au moins 8 messages échangés

### Pourquoi c'est important ?

La stabilisation déclenche :
- La **suggestion de pistes métiers** plus affirmées (phase Projection)
- La possibilité de **proposer un conseiller** (spec 02, niveau 1)
- La **proposition de sauvegarde email** (spec 01, phase 2)
- Le déblocage du **partage de profil** (visuel story)

### Détection technique

```typescript
function estProfilStable(
  profilActuel: UserProfile,
  historique: UserProfile[],  // les 3 derniers profils extraits
  nbMessages: number
): boolean {
  if (nbMessages < 8) return false

  const top2Actuel = obtenirDimensionsDominantes(profilActuel, 2).map(d => d.cle)

  // Vérifier que les 2 dimensions dominantes sont les mêmes sur les 3 derniers messages
  const estCoherent = historique.length >= 3 && historique.every(p => {
    const top2 = obtenirDimensionsDominantes(p, 2).map(d => d.cle)
    return top2[0] === top2Actuel[0] && top2[1] === top2Actuel[1]
  })

  const aScoreMinimum = top2Actuel.length >= 2

  return estCoherent && aScoreMinimum
}
```

---

## Fusion quiz → chat

Quand le jeune arrive du mini-quiz avec un profil pré-rempli :

### Règles de fusion
1. Le profil quiz est utilisé comme **point de départ** (pas écrasé immédiatement)
2. L'IA reçoit le profil quiz dans son contexte et sait qu'il est "approximatif"
3. Dès le 3ème message du chat, l'IA commence à **ajuster** les scores quiz
4. Les dimensions non scorées par le quiz (restées à 20) peuvent monter librement
5. Les dimensions scorées par le quiz (+35) peuvent baisser si la conversation le justifie
6. Après ~5 messages de chat, le profil reflète la conversation, plus le quiz

### Exemple de progression

```
Après quiz (A+35, S choisi) :
  R=20, I=20, A=55, S=55, E=20, C=20

Après message chat 3 (le jeune parle de musique et de solitude) :
  R=20, I=20, A=60, S=45, E=20, C=20
  traits: ["musicien", "introverti"]

Après message chat 7 (le jeune mentionne le code et les jeux vidéo) :
  R=20, I=45, A=65, S=40, E=20, C=20
  interests: ["musique", "jeux vidéo", "programmation"]

Après message chat 12 (profil stabilisé) :
  R=15, I=50, A=70, S=35, E=15, C=20
  traits: ["créatif", "analytique", "indépendant"]
  interests: ["musique", "jeux vidéo", "programmation", "design sonore"]
  strengths: ["imagination", "concentration", "autodidacte"]
  suggestion: "sound design, game design, développement de jeux"
```

---

## Affichage du profil

### Panel latéral (slide-in depuis la droite)

Le jeune accède à son profil via l'icône 📊 dans le header du chat. Le panel glisse depuis la droite.

```
┌──────────────────────────────┐
│  ← Mon profil                │
│                              │
│  Ton profil se précise 🎯    │
│  ███░ 3/4                    │
│  Plus on discute, plus c'est │
│  précis 😊                   │
│                              │
│  🎨 Artiste      ██████░ 70 │
│  🔬 Investigateur ████░░░ 50 │
│  🤝 Social       ███░░░░ 35 │
│  📊 Conventionnel ██░░░░░ 20 │
│  🔧 Réaliste     █░░░░░░ 15 │
│  🚀 Entreprenant  █░░░░░░ 15 │
│                              │
│  ─── Ce qui te ressemble ─── │
│                              │
│  💡 Traits                   │
│  ┌────┐ ┌──────┐ ┌────────┐ │
│  │créa│ │analy.│ │indépen.│ │
│  └────┘ └──────┘ └────────┘ │
│                              │
│  ❤️ Ce qui te plaît          │
│  ┌──────┐ ┌────┐ ┌───────┐  │
│  │musiq.│ │code│ │design │  │
│  └──────┘ └────┘ └───────┘  │
│                              │
│  💪 Tes forces               │
│  ┌───────┐ ┌──────────────┐  │
│  │imagin.│ │concentration │  │
│  └───────┘ └──────────────┘  │
│                              │
│  ─── Piste explorée ──────── │
│  ┌──────────────────────┐    │
│  │ 🎯 Sound design,     │    │
│  │    game design        │    │
│  └──────────────────────┘    │
│                              │
│  [📱 Partager mon profil]    │
│                              │
└──────────────────────────────┘
```

### Règles d'affichage

1. **Les barres sont triées par score décroissant** (la dimension la plus forte en haut)
2. **Les barres s'animent** quand le profil change (transition CSS 500ms ease-out)
3. **La couleur de chaque barre** correspond à la dimension (cf. `RIASEC_COLORS`)
4. **Le score numérique** est affiché à droite de la barre (pas en pourcentage, juste le nombre)
5. **Les dimensions à 0** ne sont pas affichées (pas de barre vide)
6. **Les tags** (traits, intérêts, forces) apparaissent progressivement au fil de la conversation
7. **La suggestion** n'apparaît que quand le profil est stabilisé
8. **Le bouton "Partager"** n'apparaît que quand le profil a au moins 2 dimensions > 30

### Indicateur dans le header

Un petit point vert (●) apparaît à côté de l'icône 📊 quand :
- Le profil a été mis à jour dans le dernier message
- Animation : pulse 2 fois puis fixe

---

## Mise à jour en temps réel

### Ce que le jeune voit

Pendant qu'il discute, le profil se met à jour **silencieusement**. Si le panel est ouvert, les barres bougent en live. Si le panel est fermé, le point vert pulse dans le header.

**Le jeune ne reçoit JAMAIS un message du type "ton profil a été mis à jour"** — c'est implicite, naturel, comme un conseiller qui prend des notes.

### Moments où Catch'Up mentionne le profil dans la conversation

L'IA peut faire référence au profil **sans le nommer comme tel** :

- "D'après ce que tu me dis, t'as un vrai côté créatif 🎨" (≠ "ton score Artiste est à 70")
- "Tu m'as l'air de quelqu'un qui aime comprendre comment ça fonctionne" (≠ "ton Investigateur monte")
- "Avec ton profil, je verrais bien des trucs comme..." (OK, "profil" est acceptable)
- "Tu veux voir ce que j'ai compris de toi ? Ouvre ton profil 📊" (OK après 8+ messages)

### Ce que l'IA ne dit JAMAIS

- "Ton score RIASEC..."
- "Ta dimension Artiste est à 70..."
- "D'après le modèle de Holland..."
- "Le test montre que..."
- Tout jargon psychométrique

---

## Historique des profils

### Pourquoi garder l'historique ?

1. **Visualiser l'évolution** — le jeune voit comment son profil a bougé (futur : graphique d'évolution)
2. **Détecter la stabilisation** — comparer les 3 derniers profils
3. **Revenir en arrière** — si un message bizarre fausse le profil, ne pas perdre l'historique
4. **Analytics** — comprendre comment les profils évoluent en moyenne

### Stockage

Chaque extraction de profil est sauvegardée avec :
```typescript
interface InstantaneProfil {
  idConversation: string
  indexMessage: number        // numéro du message qui a généré cet instantané
  profil: UserProfile
  horodatage: number
}
```

En `localStorage` (MVP) puis en base Turso (quand le jeune s'authentifie par email).

On garde les **20 derniers instantanés** par conversation (pas besoin de tout garder).

---

## Profil et mise en relation conseiller

Quand le jeune accepte la mise en relation (spec 02), le profil RIASEC est inclus dans le dossier de transmission :

```json
{
  "profil_riasec": {
    "R": 15, "I": 50, "A": 70, "S": 35, "E": 15, "C": 20,
    "top_dimensions": ["Artiste", "Investigateur"],
    "traits": ["créatif", "analytique", "indépendant"],
    "interests": ["musique", "jeux vidéo", "programmation", "design sonore"],
    "strengths": ["imagination", "concentration", "autodidacte"],
    "suggestion": "sound design, game design, développement de jeux"
  }
}
```

Le conseiller reçoit un profil **exploitable immédiatement** — il n'a pas besoin de refaire un bilan d'orientation. C'est le gain de temps principal de Catch'Up pour les professionnels.

---

## Compatibilité Parcoureo

Le modèle RIASEC utilisé par Catch'Up est **compatible avec Parcoureo** (Fondation JAE) :
- Mêmes 6 dimensions (R, I, A, S, E, C)
- Mêmes codes
- Scores normalisés 0-100 (Parcoureo utilise aussi une échelle 0-100)

**Différence clé :** Parcoureo score via un questionnaire formel (60+ items). Catch'Up score via l'IA conversationnelle. Les deux sont complémentaires :
- Un jeune qui a fait Catch'Up puis passe le test Parcoureo → le conseiller compare les deux résultats
- Un jeune qui a fait Parcoureo puis utilise Catch'Up → le profil Parcoureo peut être importé comme point de départ (futur)

---

## Indice de confiance du profil

### Pourquoi un indice de confiance ?

Le profil Catch'Up n'est pas issu d'un test standardisé — il est extrait d'une conversation libre. Sa fiabilité varie énormément selon que le jeune a échangé 3 messages ou 20, s'il a été cohérent ou contradictoire, si son profil s'est stabilisé ou bouge encore.

L'indice de confiance permet :
- **Au jeune** : de comprendre que plus il parle, plus le profil est précis (incitation à continuer)
- **Au conseiller** : de savoir s'il peut s'appuyer sur le profil ou s'il doit approfondir
- **Au système** : de conditionner certaines actions (pas de suggestion métier si confiance < 25%)

### Les 4 facteurs

#### 1. Volume conversationnel (poids 30%)
Plus le jeune a parlé, plus on a de matière pour scorer.

| Messages échangés | Score |
|---|---|
| < 3 | 0% |
| 3-6 | 25% |
| 6-10 | 50% |
| 10-16 | 75% |
| 16+ | 100% |

#### 2. Stabilité temporelle (poids 35%)
Est-ce que les dimensions dominantes bougent encore ? C'est le facteur le plus important.

On compare les 5 derniers snapshots de profil. Si le top 2 n'a pas changé et que les scores n'ont pas varié de plus de 10 points → score élevé.

| Variation des 5 derniers snapshots | Score |
|---|---|
| Top 2 change à chaque message | 10% |
| Top 2 change 1 fois sur 5 | 50% |
| Top 2 stable, écarts > 10 points | 75% |
| Top 2 stable, écarts ≤ 5 points | 100% |

#### 3. Différenciation du profil (poids 20%)
Un profil où toutes les dimensions sont à 40 n'est pas exploitable. Un bon profil a des pics et des creux.

On calcule l'**écart-type** des 6 scores :

| Écart-type | Interprétation | Score |
|---|---|---|
| < 5 | Profil plat, aucune dimension ne ressort | 10% |
| 5-15 | Légèrement différencié | 40% |
| 15-25 | Bien différencié, 2-3 dimensions émergent | 75% |
| > 25 | Très contrasté, profil clair | 100% |

#### 4. Cohérence des signaux (poids 15%)
Est-ce que le jeune a donné des signaux **convergents** ou **contradictoires** au fil de la conversation ?

L'IA est la mieux placée pour évaluer ça — on lui demande d'ajouter un champ `coherence_signaux` dans le bloc PROFILE :

```
<!--PROFILE:{..., "coherence_signaux": "convergent"}-->
```

| Signaux | Signification | Score |
|---|---|---|
| `contradictoire` | Le jeune dit une chose puis son contraire | 20% |
| `mixte` | Signaux variés, pas de pattern clair | 50% |
| `convergent` | Tout pointe dans la même direction | 90% |

### Calcul du score final

```
Confiance = 0.30 × Volume + 0.35 × Stabilité + 0.20 × Différenciation + 0.15 × Cohérence
```

Résultat : un nombre entre 0 et 100%.

### Affichage pour le jeune

Pas de pourcentage brut (trop clinique). Un **indicateur qualitatif** avec 4 niveaux :

| Score | Label affiché | Visuel |
|---|---|---|
| 0-25% | "On commence à peine 😊" | 1 barre sur 4, gris clair |
| 25-50% | "Je commence à te cerner" | 2 barres sur 4, jaune |
| 50-75% | "Ton profil se précise 🎯" | 3 barres sur 4, vert clair |
| 75-100% | "Je te connais bien !" | 4 barres sur 4, vert vif |

**Placement :** En haut du panel profil, au-dessus des barres RIASEC.

**Sous-texte :** "Plus on discute, plus c'est précis. Continue à me parler de toi 😊"

**Animation :** Quand l'indice passe au niveau supérieur, une micro-animation de célébration (le texte change avec un léger bounce).

### Affichage pour le conseiller

Dans le dossier de transmission (cf. spec 02), l'indice est envoyé en **détail complet** :

```json
{
  "indice_confiance": {
    "score_global": 0.72,
    "niveau": "bon",
    "detail": {
      "volume": 0.75,
      "stabilite": 0.80,
      "differenciation": 0.60,
      "coherence": 0.90
    },
    "nb_messages": 14,
    "nb_snapshots": 12
  }
}
```

Le conseiller voit d'un coup d'œil si le profil est fiable ou s'il doit creuser.

### Seuils déclencheurs

L'indice de confiance conditionne certaines actions du système :

| Action | Seuil minimum |
|---|---|
| Afficher les barres RIASEC dans le panel | 10% (dès qu'il y a des scores) |
| Proposer des pistes métiers dans le chat | 40% |
| Afficher le bouton "Partager mon profil" | 50% |
| Proposer la mise en relation conseiller (niveau 1) | 50% |
| Proposer la sauvegarde email | 30% |
| Inclure le profil dans le dossier de transmission | 25% (avec mention "profil préliminaire" si < 50%) |

### Implémentation technique

```typescript
interface IndiceConfiance {
  scoreGlobal: number          // 0-1
  niveau: 'debut' | 'emergent' | 'precis' | 'fiable'
  volume: number               // 0-1
  stabilite: number            // 0-1
  differenciation: number      // 0-1
  coherence: number            // 0-1
  nbMessages: number
  nbSnapshots: number
}

function calculerIndiceConfiance(
  profil: UserProfile,
  historique: ProfileSnapshot[],
  nbMessages: number,
  coherenceSignaux: 'contradictoire' | 'mixte' | 'convergent'
): IndiceConfiance {
  const volume = calculerScoreVolume(nbMessages)
  const stabilite = calculerScoreStabilite(historique)
  const differenciation = calculerScoreDifferenciation(profil)
  const coherence = calculerScoreCoherence(coherenceSignaux)

  const scoreGlobal = 0.30 * volume + 0.35 * stabilite + 0.20 * differenciation + 0.15 * coherence

  const niveau = scoreGlobal < 0.25 ? 'debut'
    : scoreGlobal < 0.50 ? 'emergent'
    : scoreGlobal < 0.75 ? 'precis'
    : 'fiable'

  return { scoreGlobal, niveau, volume, stabilite, differenciation, coherence, nbMessages, nbSnapshots: historique.length }
}
```

---

## Limites et honnêteté

### Ce que le profil Catch'Up est
- Une **estimation conversationnelle** du profil RIASEC
- Un **outil d'exploration** — pour ouvrir des pistes, pas pour décider d'un avenir
- Un **facilitateur** pour le conseiller humain

### Ce que le profil Catch'Up n'est PAS
- Un **test psychométrique validé** (pas de score de fiabilité, pas d'étalonnage)
- Un **diagnostic** — aucune dimension n'est "bonne" ou "mauvaise"
- Un **résultat définitif** — le profil évolue à chaque conversation

### Mentions à afficher (en petit, accessible)
- Dans le panel profil : "Ce profil est une estimation basée sur notre conversation. Pour un bilan complet, parle avec un conseiller 😊"
- Pas de disclaimer juridique lourd — un simple rappel humain

---

## Métriques

| Métrique | Description | Objectif |
|----------|-------------|----------|
| Taux d'extraction | % de messages IA contenant un bloc PROFILE valide (après message 3) | > 95% |
| Temps moyen de stabilisation | Nombre de messages avant profil stable | 8-12 messages |
| Concordance quiz/chat | Corrélation entre le profil quiz et le profil chat stabilisé | > 60% (les 2 dimensions dominantes matchent) |
| Taux de consultation profil | % de jeunes qui ouvrent le panel profil au moins 1 fois | > 50% |
| Taux de partage profil | % de jeunes qui partagent leur profil (parmi ceux avec profil stable) | > 10% |
| Score moyen max | Score moyen de la dimension la plus haute au profil stabilisé | 60-80 |
| Diversité des profils | Distribution des profils dominants (pas tous "Artiste-Social") | Pas de dimension > 30% des profils |
| Indice de confiance moyen | Indice moyen au moment de la stabilisation | > 60% |
| Taux de confiance "fiable" | % de profils atteignant le niveau "fiable" (> 75%) | > 30% des conversations de 15+ messages |
