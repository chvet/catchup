# 05 — Mini-quiz d'orientation

> **Statut :** Implémenté  
> **Dernière mise à jour spec :** 2026-04-07  
> **Fichiers clés :** `src/core/quiz-data.ts`, `src/app/quiz/page.tsx`

## Principe directeur
**30 secondes pour accrocher, pas pour étiqueter.** Le mini-quiz est un outil de captation, pas un test psychométrique. Il donne un résultat assez juste pour intriguer, assez flou pour donner envie d'aller plus loin dans le chat. C'est le Spotify Wrapped de l'orientation : rapide, visuel, partageable.

---

## Objectif stratégique

Le quiz est la **porte d'entrée n°1** de Catch'Up. C'est lui qu'on partage sur TikTok, qu'on colle sur les flyers, qu'on envoie par SMS. Il doit :
1. **Convertir en 30 secondes** — un jeune qui arrive du scroll infini n'a pas 5 minutes
2. **Donner un résultat valorisant** — le jeune doit se sentir compris, pas jugé
3. **Créer l'envie de continuer** — "tu veux en savoir plus ? Parle avec moi"
4. **Être viral** — le résultat doit donner envie d'être partagé ("et toi t'es quoi ?")

---

## URL et accès

**URL principale :** `catchup.jaeprive.fr/quiz`
**URL avec parrainage :** `catchup.jaeprive.fr/quiz?ref=LUCAS`
**URL avec source prescripteur :** `catchup.jaeprive.fr/quiz?src=ML-PARIS15`

Les paramètres `ref` et `src` sont stockés en `localStorage` pour le tracking, mais n'affectent pas le quiz lui-même.

---

## Parcours écran par écran

### Écran 1 — Splash (accroche)

```
┌────────────────────────────────┐
│                                │
│         🚀                     │
│                                │
│   Découvre qui tu es           │
│   en 30 secondes               │
│                                │
│   3 questions, 0 prise de tête │
│                                │
│   ┌──────────────────────┐     │
│   │    C'est parti ! →   │     │
│   └──────────────────────┘     │
│                                │
│   Déjà 12 847 jeunes l'ont    │
│   fait cette semaine           │
│                                │
└────────────────────────────────┘
```

**Règles :**
- Fond : dégradé violet-rose (identité Catch'Up)
- Le compteur "12 847 jeunes" est **réel** (compteur global stocké en base, actualisé toutes les heures)
- Animation d'entrée : le texte apparaît mot par mot (typewriter léger, 300ms total)
- Le bouton pulse doucement (scale animation 1.0→1.05, 2s loop) pour attirer le tap
- Pas de logo en gros, pas de texte légal, pas de mention JAE — c'est fun, pas corporate

### Écran 2 — Question 1 (R vs A : Réaliste vs Artiste)

```
┌────────────────────────────────┐
│  ● ○ ○           1/3          │
│                                │
│  Le week-end, tu préfères...   │
│                                │
│  ┌─────────┐  ┌─────────┐     │
│  │         │  │         │     │
│  │  🔧     │  │  🎨     │     │
│  │         │  │         │     │
│  │Construire│  │ Créer   │     │
│  │ réparer  │  │quelque  │     │
│  │ un truc  │  │ chose   │     │
│  └─────────┘  └─────────┘     │
│                                │
│  ← swipe ou tape              │
│                                │
└────────────────────────────────┘
```

**Mapping RIASEC :**
- Gauche → R (Réaliste) +35
- Droite → A (Artiste) +35

### Écran 3 — Question 2 (S vs E : Social vs Entreprenant)

```
┌────────────────────────────────┐
│  ● ● ○           2/3          │
│                                │
│  Avec les autres, t'es         │
│  plutôt...                     │
│                                │
│  ┌─────────┐  ┌─────────┐     │
│  │         │  │         │     │
│  │  🤝     │  │  🚀     │     │
│  │         │  │         │     │
│  │ Celui   │  │ Celui   │     │
│  │   qui   │  │   qui   │     │
│  │ écoute  │  │  mène   │     │
│  └─────────┘  └─────────┘     │
│                                │
└────────────────────────────────┘
```

**Mapping RIASEC :**
- Gauche → S (Social) +35
- Droite → E (Entreprenant) +35

### Écran 4 — Question 3 (I vs C : Investigateur vs Conventionnel)

```
┌────────────────────────────────┐
│  ● ● ●           3/3          │
│                                │
│  Ce qui te fait kiffer...      │
│                                │
│  ┌─────────┐  ┌─────────┐     │
│  │         │  │         │     │
│  │  🔬     │  │  📊     │     │
│  │         │  │         │     │
│  │Comprendre│  │Que tout │     │
│  │ comment  │  │soit bien│     │
│  │ça marche │  │  carré  │     │
│  └─────────┘  └─────────┘     │
│                                │
└────────────────────────────────┘
```

**Mapping RIASEC :**
- Gauche → I (Investigateur) +35
- Droite → C (Conventionnel) +35

### Écran 5 — Résultat

```
┌────────────────────────────────┐
│                                │
│   Tu es plutôt...              │
│                                │
│   🎨🤝 Artiste-Social          │
│                                │
│   ┌──────────────────────┐     │
│   │ Tu es créatif et tu  │     │
│   │ aimes les gens.      │     │
│   │ Tu pourrais t'éclater│     │
│   │ dans le design,      │     │
│   │ l'animation, l'éduc  │     │
│   │ ou le social.        │     │
│   └──────────────────────┘     │
│                                │
│   🎨 Artiste      ████░░ 73   │
│   🤝 Social       ███░░░ 58   │
│                                │
│  ┌──────────────────────┐      │
│  │ 🚀 Découvre tes      │      │
│  │    métiers →          │      │
│  └──────────────────────┘      │
│                                │
│  ┌──────────────────────┐      │
│  │ 📱 Partage ton       │      │
│  │    résultat           │      │
│  └──────────────────────┘      │
│                                │
│  🔄 Refaire le test            │
│                                │
└────────────────────────────────┘
```

---

## Logique de scoring

### Scores initiaux
Chaque dimension RIASEC démarre à **20** (pas à 0 — pour qu'aucune dimension ne soit "vide" visuellement).

### Attribution des points

| Question | Choix gauche | Choix droite |
|----------|-------------|-------------|
| Q1 | R +35 | A +35 |
| Q2 | S +35 | E +35 |
| Q3 | I +35 | C +35 |

### Résultat final
Les 2 dimensions avec les scores les plus élevés forment le profil affiché.

**Exemple :** Le jeune choisit 🎨 (A+35), 🤝 (S+35), 🔬 (I+35)
→ Scores finaux : R=20, I=55, A=55, S=55, E=20, C=20
→ Profil affiché : "Artiste-Social-Investigateur" → on affiche les 2 premiers par ordre alpha → "Artiste-Investigateur" (ou les 2 plus hauts si différenciés)

**Règle de départage :** Si 3 dimensions sont ex-aequo (le cas quand les 3 choix donnent chacun +35), prendre les 2 premières dans cet ordre de priorité : A > S > I > E > R > C (les dimensions les plus "inspirantes" d'abord, pour maximiser l'effet positif du résultat).

### Ce que le score n'est PAS
- Ce n'est **pas** un test RIASEC valide (3 questions binaires ≠ 60 items Likert)
- C'est une **estimation grossière** — le vrai travail se fait dans le chat
- Le profil est **valorisant quoi qu'il arrive** — il n'y a pas de "mauvais" résultat

---

## Les 15 combinaisons possibles de résultat

Chaque paire de dimensions dominantes a une description personnalisée :

| Profil | Emoji | Description courte | Pistes métiers |
|--------|-------|-------------------|---------------|
| R-I | 🔧🔬 | Concret et curieux | Ingénieur, technicien labo, mécatronicien |
| R-A | 🔧🎨 | Habile et créatif | Artisan, ébéniste, designer produit |
| R-S | 🔧🤝 | Concret et humain | Éducateur technique, ergothérapeute |
| R-E | 🔧🚀 | Bâtisseur et leader | Chef de chantier, entrepreneur BTP |
| R-C | 🔧📊 | Méthodique et concret | Topographe, contrôleur qualité |
| I-A | 🔬🎨 | Curieux et créatif | Architecte, UX designer, chercheur en art |
| I-S | 🔬🤝 | Curieux et humain | Médecin, psychologue, chercheur social |
| I-E | 🔬🚀 | Stratège et analytique | Data scientist, consultant, entrepreneur tech |
| I-C | 🔬📊 | Rigoureux et curieux | Comptable expert, auditeur, actuaire |
| A-S | 🎨🤝 | Créatif et humain | Designer, animateur, art-thérapeute |
| A-E | 🎨🚀 | Créatif et entrepreneur | Directeur artistique, créateur de contenu |
| A-C | 🎨📊 | Créatif et organisé | Graphiste, webdesigner, architecte d'intérieur |
| S-E | 🤝🚀 | Leader et humain | Manager, RH, directeur associatif |
| S-C | 🤝📊 | Humain et organisé | Assistant social, gestionnaire de paie |
| E-C | 🚀📊 | Leader et organisé | Chef de projet, gestionnaire, banquier |

### Description longue (affichée sur l'écran résultat)

Chaque description suit la même structure :
1. **Validation** : "Tu es [qualité 1] et [qualité 2]."
2. **Projection** : "Tu pourrais t'éclater dans [3-4 domaines]."
3. **Curiosité** : Sous-entendu qu'il y a plus à découvrir.

**Exemple A-S :**
> "Tu es créatif et tu aimes les gens. Tu pourrais t'éclater dans le design, l'animation, l'éducation ou le social. Y'a plein de métiers qui mélangent les deux — viens en discuter !"

**Exemple I-E :**
> "T'es du genre à comprendre comment ça marche ET à vouloir en faire quelque chose. Data, consulting, entrepreneuriat tech... les possibilités sont larges !"

---

## Interactions et animations

### Swipe
- Les cartes de choix sont **swipeable** sur mobile (gesture horizontale)
- Swipe gauche = choix gauche, swipe droite = choix droite
- Le tap sur une carte fonctionne aussi (accessibilité + desktop)
- Animation : la carte non choisie s'efface (fade + scale down), la carte choisie grossit brièvement (scale 1.1) puis transition vers la question suivante

### Transitions entre questions
- Slide horizontal (la question suivante arrive de la droite)
- Durée : 300ms, ease-out
- La barre de progression (● ● ○) se met à jour en temps réel

### Écran résultat — Animations
- Les barres RIASEC s'animent de 0 à leur valeur finale (500ms, ease-out)
- L'emoji du profil fait un petit bounce à l'apparition
- Confettis légers (optionnel, 1.5s) pour le côté festif
- Le bouton "Découvre tes métiers" pulse comme le bouton splash

### Retour en arrière
- **Pas de bouton retour** entre les questions (3 questions = trop court pour revenir, et ça empêche l'over-thinking)
- Seul "Refaire le test" sur l'écran résultat permet de recommencer

---

## Partage du résultat

### Visuel partageable (story/post)

Généré côté client en canvas → export PNG :

```
┌──────────────────────────────┐
│          CATCH'UP            │
│     Mon profil orientation   │
│                              │
│   🎨🤝 Artiste-Social        │
│                              │
│   🎨 Artiste      ████░ 73  │
│   🤝 Social       ███░░ 58  │
│   🔬 Investigateur ██░░░ 35  │
│   🚀 Entreprenant  █░░░░ 20  │
│   🔧 Réaliste     █░░░░ 20  │
│   📊 Conventionnel █░░░░ 20  │
│                              │
│   "Et toi t'es quoi ? 👀"   │
│                              │
│   catchup.jaeprive.fr/quiz   │
│                              │
└──────────────────────────────┘
```

**Règles du visuel :**
- Format : 1080x1920 (ratio story Instagram/TikTok)
- Fond : dégradé violet-rose (marque Catch'Up)
- Toutes les 6 dimensions affichées (même celles à 20), la dominante en premier
- URL en bas pour que quiconque voit la story puisse aller faire le test
- **Pas de données personnelles** sur le visuel (pas de prénom, pas d'email)

### Mécanisme de partage
1. **Bouton "Partage ton résultat"** sur l'écran résultat
2. Génère le visuel PNG via `<canvas>` → `canvas.toBlob()`
3. Utilise **Web Share API** (`navigator.share()`) si dispo :
   - Partage natif vers Instagram Stories, Snapchat, WhatsApp, SMS, etc.
   - Inclut le fichier image + le texte "Découvre ton profil orientation → catchup.jaeprive.fr/quiz"
4. **Fallback** si Web Share API indisponible :
   - Bouton "Télécharger l'image" (download du PNG)
   - Bouton "Copier le lien" → copie `catchup.jaeprive.fr/quiz?ref={CODE}` dans le presse-papier

### Code de parrainage
- Chaque résultat génère un code de parrainage court (6 caractères alphanumériques, ex: `LUCAS7`)
- Stocké dans le `localStorage` (associé à l'`anonymous_id`)
- Le lien partagé inclut ce code : `catchup.jaeprive.fr/quiz?ref=LUCAS7`
- Quand un ami arrive via ce lien, le `ref` est stocké pour le tracking
- **Futur** : "Lucas t'a envoyé ce test ! Compare vos profils après"

---

## Transition quiz → chat

Quand le jeune clique **"Découvre tes métiers"** :

### Ce qui se passe techniquement
1. Le profil RIASEC simplifié est stocké en `localStorage` :
   ```json
   {
     "source": "quiz",
     "scores": { "R": 20, "I": 20, "A": 55, "S": 55, "E": 20, "C": 20 },
     "topDimensions": ["Artiste", "Social"],
     "timestamp": "2026-03-20T10:30:00Z"
   }
   ```
2. Redirection vers `/` (page chat principale)
3. Le composant chat détecte le profil quiz dans le `localStorage`
4. Le `system prompt` est enrichi avec le contexte quiz
5. Le premier message de Catch'Up est adapté (cf. spec 04, contexte "arrivée depuis le mini-quiz")

### Premier message adapté
> "Hey ! J'ai vu ton résultat du quiz — Artiste-Social, c'est cool 🎨🤝
> Mais 3 questions c'est un peu court pour vraiment te cerner 😄
> Dis-moi un truc : dans ton quotidien, c'est quoi le moment où tu te sens le plus à ta place ?"

### Ce que le chat sait
- Le jeune vient du quiz (pas besoin de phase d'accroche longue)
- Les 2 dimensions dominantes (à affiner, pas à repartir de zéro)
- Le chat démarre en **phase 2 (Découverte)** directement, pas en phase 1 (Accroche)

### Ce que le chat ne sait PAS
- Le prénom (pas demandé dans le quiz — le chat le demandera naturellement)
- Les centres d'intérêt précis
- La situation du jeune (lycéen, décrocheur, en reconversion...)

---

## Variantes de quiz (futur)

### Quiz étendu (10 questions)
- Débloqué après le premier quiz 3 questions
- Proposé dans le chat : "Tu veux un profil plus précis ? J'ai un test en 10 questions 🎯"
- 10 questions = 2 par dimension RIASEC (pas binaire mais échelle 1-5)
- Résultat beaucoup plus fin, avec les 6 dimensions scorées
- Temps estimé : 2-3 minutes

### Quiz thématique
- "Quel créatif es-tu ?" (pour les profils A dominants)
- "Quel leader es-tu ?" (pour les profils E dominants)
- Affinage de la dimension dominante en sous-catégories
- Proposé par le chat quand le profil est stabilisé

### Quiz entre amis
- "Compare ton profil avec tes potes"
- Le jeune envoie un lien, l'ami fait le quiz
- Écran de comparaison : "Vous êtes compatibles à 72% !"
- Gamification légère pour le partage viral

---

## Accessibilité (RGAA)

- Les cartes de choix ont un `aria-label` descriptif
- Navigation au clavier : Tab pour sélectionner, Entrée pour valider
- Les emojis ont un `aria-hidden="true"` avec un texte alternatif à côté
- Les animations respectent `prefers-reduced-motion` (si activé : transitions instantanées, pas de confettis)
- Contraste suffisant (AA minimum) sur tous les textes
- Le swipe a une alternative tap (les deux fonctionnent toujours)

---

## Performances

- **Pas de requête serveur** pendant le quiz (tout est côté client)
- Le résultat est calculé localement (JavaScript pur)
- Le visuel partageable est généré localement (canvas)
- **Seule requête réseau** : à la fin, un POST analytics avec :
  ```json
  {
    "event": "quiz_completed",
    "answers": [1, 0, 1],
    "result": "A-S",
    "ref": "LUCAS7",
    "src": "ML-PARIS15",
    "duration_ms": 18500,
    "timestamp": "2026-03-20T10:30:00Z"
  }
  ```
- Le quiz entier pèse **< 50 Ko** (JS + CSS), chargement instantané
- Fonctionne offline si la PWA est installée (le quiz est dans le cache service worker)

---

## Métriques

| Métrique | Description | Objectif |
|----------|-------------|----------|
| Taux de démarrage | % visiteurs /quiz qui cliquent "C'est parti" | > 70% |
| Taux de complétion | % qui finissent les 3 questions (parmi ceux qui commencent) | > 85% |
| Taux de partage | % qui partagent leur résultat | > 15% |
| Taux de conversion chat | % qui cliquent "Découvre tes métiers" | > 40% |
| Durée moyenne | Temps entre "C'est parti" et résultat | 15-30s |
| Viralité (K-factor) | Nombre moyen de nouveaux quizzeurs générés par partage | > 0.3 |
| Taux de refaire | % qui refont le quiz immédiatement | < 20% (si trop haut = le résultat ne convainc pas) |

---

## Implémentation technique

### Composants React nécessaires

| Composant | Rôle |
|-----------|------|
| `QuizPage` | Page `/quiz`, gère l'état global du quiz (step, answers, scores) |
| `QuizSplash` | Écran d'accroche avec bouton "C'est parti" |
| `QuizQuestion` | Carte de question avec 2 choix swipeables |
| `QuizResult` | Écran résultat avec barres RIASEC, description, boutons d'action |
| `QuizShareImage` | Génération du visuel PNG via canvas (composant invisible) |
| `QuizProgressBar` | Indicateur ● ● ○ avec animation |

### Données statiques (pas de CMS, pas de base)

```typescript
// src/core/quiz-data.ts

export const QUIZ_QUESTIONS = [
  {
    id: 1,
    question: "Le week-end, tu préfères...",
    left: { emoji: "🔧", label: "Construire / réparer un truc", dimension: "R" },
    right: { emoji: "🎨", label: "Créer quelque chose", dimension: "A" },
  },
  {
    id: 2,
    question: "Avec les autres, t'es plutôt...",
    left: { emoji: "🤝", label: "Celui qui écoute et aide", dimension: "S" },
    right: { emoji: "🚀", label: "Celui qui mène et organise", dimension: "E" },
  },
  {
    id: 3,
    question: "Ce qui te fait kiffer...",
    left: { emoji: "🔬", label: "Comprendre comment ça marche", dimension: "I" },
    right: { emoji: "📊", label: "Que tout soit bien rangé et carré", dimension: "C" },
  },
];

export const QUIZ_RESULTS: Record<string, QuizResult> = {
  "A-S": {
    emoji: "🎨🤝",
    title: "Artiste-Social",
    description: "Tu es créatif et tu aimes les gens. Tu pourrais t'éclater dans le design, l'animation, l'éducation ou le social.",
    pistes: ["Design graphique", "Animation", "Éducateur", "Art-thérapeute"],
  },
  // ... 14 autres combinaisons
};
```

### État du quiz

```typescript
interface QuizState {
  step: 'splash' | 'q1' | 'q2' | 'q3' | 'result';
  answers: (0 | 1)[];  // 0 = gauche, 1 = droite
  scores: Record<string, number>;
  startedAt: number | null;
  completedAt: number | null;
  ref: string | null;   // code parrainage entrant
  src: string | null;   // source prescripteur
}
```
