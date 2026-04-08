# 16 — Algorithme de matching bénéficiaire ↔ structure

> **Statut :** Implémenté  
> **Dernière mise à jour spec :** 2026-04-07  
> **Fichiers clés :** `src/matching.ts` (algorithme complet), `src/core/matching.ts` (types et utilitaires)

## Principe directeur
**Le bon conseiller pour le bon jeune.** Le matching automatique optimise l'affectation des bénéficiaires aux structures en fonction de critères objectifs. Le conseiller garde toujours la main : le matching est une **suggestion**, pas une obligation.

---

## Vue d'ensemble

```
Bénéficiaire (referral)          Algorithme            Structure(s)
┌─────────────────────┐                               ┌──────────────────┐
│ Âge : 19            │                               │ Mission Locale   │
│ Genre : M           │         Score = 87%           │ Paris 15         │
│ Département : 75    │ ─────────────────────────────> │ 16-25 ans        │
│ RIASEC : A-S        │   "âge + géo + spécialité"    │ Dép: 75,92,93    │
│ Urgence : haute     │                               │ Spé: insertion   │
│ Fragilité : medium  │                               │ Capacité: 12/50  │
└─────────────────────┘                               └──────────────────┘
```

---

## Critères de matching

### Critères obligatoires (filtres éliminatoires)

Ces critères **éliminent** les structures non compatibles avant le scoring :

| Critère | Règle | Exemple |
|---------|-------|---------|
| **Géolocalisation** | Le département du bénéficiaire doit être dans la liste des départements couverts par la structure | Bénéficiaire dép. 75 → structure couvrant [75, 92, 93] ✅ |
| **Âge** | L'âge du bénéficiaire doit être dans la tranche [age_min, age_max] de la structure | Bénéficiaire 19 ans → structure 16-25 ✅ |
| **Structure active** | La structure doit être active (`actif = 1`) | — |

**Si aucune structure ne passe les filtres :** le referral est marqué comme "sans match" et visible par les super admins pour traitement manuel.

### Critères pondérés (scoring)

Après filtrage, chaque structure restante reçoit un **score de 0 à 100** :

| Critère | Poids | Description | Calcul |
|---------|-------|-------------|--------|
| **Géolocalisation** | 40% | Proximité géographique | 40 pts si département exact match. Bonus si même région (cas où bénéficiaire est en zone limitrophe). |
| **Âge** | 25% | Adéquation à la tranche d'âge | 25 pts si dans la tranche. Malus progressif si proche des bornes (±1 an = 20 pts, ±2 ans = 15 pts). |
| **Spécialité** | 20% | Adéquation entre le profil/situation du bénéficiaire et les spécialités de la structure | Voir matrice de correspondance ci-dessous. |
| **Capacité disponible** | 10% | Place restante dans la structure | `10 × (1 - cas_actifs / capacite_max)`. Structure pleine = 0 pts. |
| **Genre** | 5% | Correspondance genre si la structure a une préférence | 5 pts si match ou pas de préférence. 0 pts si mismatch. |

---

## Matrice de correspondance spécialités

Le score de spécialité (20 pts max) est calculé en croisant les caractéristiques du bénéficiaire avec les spécialités de la structure :

### Par situation du bénéficiaire

| Situation bénéficiaire | Spécialités valorisées | Points |
|------------------------|----------------------|--------|
| Décrocheur / sans diplôme | `decrochage`, `insertion` | 20 |
| En recherche d'emploi | `insertion`, `reconversion` | 20 |
| Lycéen / étudiant | `orientation` | 20 |
| En situation de handicap | `handicap` | 20 |
| Autre / inconnu | Toute spécialité | 10 |

### Par niveau de fragilité

| Fragilité | Bonus | Structures prioritaires |
|-----------|-------|------------------------|
| `high` (urgence) | +5 pts aux structures avec spécialité `decrochage` ou `insertion` | Favorise les structures avec accompagnement renforcé |
| `medium` | +3 pts | — |
| `low` / `none` | 0 | — |

### Par profil RIASEC dominant

| Dimension dominante | Spécialités affinitaires | Bonus |
|--------------------|-----------------------|-------|
| R (Réaliste) | `insertion`, `reconversion` | +2 |
| I (Investigateur) | `orientation` | +2 |
| A (Artiste) | `orientation` | +2 |
| S (Social) | `insertion`, `orientation` | +2 |
| E (Entreprenant) | `insertion`, `reconversion` | +2 |
| C (Conventionnel) | `insertion` | +2 |

---

## Algorithme détaillé

### Pseudo-code

```typescript
function matcherStructures(referral: Referral, structures: Structure[]): MatchingResult[] {
  const resultats: MatchingResult[] = []

  for (const structure of structures) {
    // === FILTRES ÉLIMINATOIRES ===

    // 1. Structure active ?
    if (!structure.actif) continue

    // 2. Géolocalisation compatible ?
    if (referral.departement && !structure.departements.includes(referral.departement)) {
      // Vérifier si même région (tolérance géographique)
      if (!memeRegion(referral.departement, structure.regions)) continue
    }

    // 3. Âge compatible ?
    if (referral.age !== null) {
      if (referral.age < structure.ageMin - 2 || referral.age > structure.ageMax + 2) continue
    }

    // === SCORING ===
    let score = 0
    const raisons: string[] = []

    // Géolocalisation (40 pts)
    if (referral.departement) {
      if (structure.departements.includes(referral.departement)) {
        score += 40
        raisons.push('département couvert')
      } else if (memeRegion(referral.departement, structure.regions)) {
        score += 25  // même région mais pas même département
        raisons.push('même région')
      }
    } else {
      score += 20  // pas de localisation connue → score neutre
    }

    // Âge (25 pts)
    if (referral.age !== null) {
      if (referral.age >= structure.ageMin && referral.age <= structure.ageMax) {
        score += 25
        raisons.push('tranche d\'âge')
      } else {
        const ecart = Math.min(
          Math.abs(referral.age - structure.ageMin),
          Math.abs(referral.age - structure.ageMax)
        )
        score += Math.max(0, 25 - ecart * 5)
        raisons.push('âge proche')
      }
    } else {
      score += 12  // pas d'âge connu → score neutre
    }

    // Spécialité (20 pts)
    const scoreSpec = calculerScoreSpecialite(referral, structure)
    score += scoreSpec.points
    if (scoreSpec.raison) raisons.push(scoreSpec.raison)

    // Capacité (10 pts)
    const casActifs = compterCasActifs(structure.id)
    const tauxRemplissage = casActifs / structure.capaciteMax
    const scoreCapa = Math.round(10 * (1 - tauxRemplissage))
    score += scoreCapa
    if (tauxRemplissage < 0.5) raisons.push('bonne disponibilité')

    // Genre (5 pts)
    if (!structure.genrePreference || structure.genrePreference === referral.genre) {
      score += 5
    }

    resultats.push({
      structureId: structure.id,
      structureNom: structure.nom,
      score: Math.min(100, score),
      raisons,
      tauxRemplissage: Math.round(tauxRemplissage * 100),
    })
  }

  // Trier par score décroissant
  return resultats.sort((a, b) => b.score - a.score)
}
```

### Interface de résultat

```typescript
interface MatchingResult {
  structureId: string
  structureNom: string
  score: number              // 0-100
  raisons: string[]          // ["département couvert", "tranche d'âge", "bonne disponibilité"]
  tauxRemplissage: number    // 0-100 (% de la capacité utilisée)
}

interface MatchingCriteria {
  age: number | null
  genre: string | null        // 'M', 'F', 'autre', null
  departement: string | null  // code département (ex: "75")
  situation: string | null    // 'decrocheur', 'lyceen', 'etudiant', 'emploi', 'recherche'
  riasecDominant: string[]    // top 2 dimensions (ex: ["A", "S"])
  urgence: 'normale' | 'haute' | 'critique'
  fragilite: 'none' | 'low' | 'medium' | 'high'
}
```

---

## Mapping départements ↔ régions

Pour la tolérance géographique (même région), une table de correspondance est utilisée :

```typescript
const DEPARTEMENTS_PAR_REGION: Record<string, string[]> = {
  'ile-de-france': ['75', '77', '78', '91', '92', '93', '94', '95'],
  'auvergne-rhone-alpes': ['01', '03', '07', '15', '26', '38', '42', '43', '63', '69', '73', '74'],
  'nouvelle-aquitaine': ['16', '17', '19', '23', '24', '33', '40', '47', '64', '79', '86', '87'],
  'occitanie': ['09', '11', '12', '30', '31', '32', '34', '46', '48', '65', '66', '81', '82'],
  'hauts-de-france': ['02', '59', '60', '62', '80'],
  'provence-alpes-cote-d-azur': ['04', '05', '06', '13', '83', '84'],
  'grand-est': ['08', '10', '51', '52', '54', '55', '57', '67', '68', '88'],
  'pays-de-la-loire': ['44', '49', '53', '72', '85'],
  'bretagne': ['22', '29', '35', '56'],
  'normandie': ['14', '27', '50', '61', '76'],
  'bourgogne-franche-comte': ['21', '25', '39', '58', '70', '71', '89', '90'],
  'centre-val-de-loire': ['18', '28', '36', '37', '41', '45'],
  'corse': ['2A', '2B'],
  // DOM-TOM
  'guadeloupe': ['971'],
  'martinique': ['972'],
  'guyane': ['973'],
  'la-reunion': ['974'],
  'mayotte': ['976'],
}
```

---

## Affichage du matching dans l'interface

### Sur la page détail d'un cas

```
┌──────────────────────────────────────────────────┐
│  🤝 Structures suggérées                         │
│                                                  │
│  1. Mission Locale Paris 15          ████░ 87%   │
│     ✅ Département couvert                       │
│     ✅ Tranche d'âge (16-25)                     │
│     ✅ Spécialité insertion                      │
│     📊 Remplissage : 24% (12/50)                │
│     [Assigner à cette structure]                 │
│                                                  │
│  2. CIDJ Paris                       ███░░ 72%   │
│     ✅ Département couvert                       │
│     ✅ Tranche d'âge                             │
│     ⚠️ Pas de spécialité insertion               │
│     📊 Remplissage : 68% (34/50)                │
│     [Assigner]                                   │
│                                                  │
│  3. Mission Locale Boulogne          ██░░░ 58%   │
│     ⚠️ Même région (92)                          │
│     ✅ Tranche d'âge                             │
│     ✅ Spécialité insertion                      │
│     📊 Remplissage : 45% (23/50)                │
│     [Assigner]                                   │
│                                                  │
│  [Assigner manuellement à une autre structure ▾] │
└──────────────────────────────────────────────────┘
```

### Sur la file active (colonne "Match")
- Icône colorée : 🟢 > 80%, 🟡 50-80%, 🔴 < 50%, ⚪ pas de données

---

## Auto-assignation

### Quand un referral est créé :
1. L'algorithme de matching tourne automatiquement
2. Le résultat est stocké dans `referral.structure_suggeree_id` (meilleur score)
3. Le referral apparaît dans la file active de la structure suggérée
4. Si le score > 80% et la structure a de la capacité → pré-assignation automatique (statut reste "nouvelle" mais la structure est notifiée)
5. Si aucune structure ne match → visible uniquement par les super admins

### Override manuel
- Un admin peut réassigner un cas à n'importe quelle structure
- L'action est loggée dans `evenement_audit`
- Le champ `assignee_manuellement` passe à `1` dans `prise_en_charge`

---

## Cas limites

| Situation | Comportement |
|-----------|-------------|
| Bénéficiaire sans localisation | Le filtre géo est désactivé, score géo = 20/40 |
| Bénéficiaire sans âge | Le filtre âge est désactivé, score âge = 12/25 |
| Toutes les structures pleines | Alerte aux super admins + referral en attente |
| Aucune structure dans le département | Élargir à la région, puis alerte si toujours rien |
| Urgence critique | Ignorer le critère de capacité (forcer l'assignation) |
| Plusieurs structures à score égal | Départager par capacité restante (la plus disponible gagne) |

---

## Évolution prévue

### Phase 2 — Apprentissage
- Historiser les résultats de matching (structure suggérée vs structure choisie)
- Si un admin override systématiquement le matching pour un certain profil → ajuster les poids
- Dashboard d'efficacité du matching : % d'auto-assignations confirmées vs overridées

### Phase 3 — Géolocalisation fine
- Passer des départements aux codes postaux ou coordonnées GPS
- Calculer la distance réelle entre le bénéficiaire et la structure
- Intégrer le temps de trajet (API transport)

### Phase 4 — Matching par compétences conseiller
- Chaque conseiller a un profil de compétences (pas juste la structure)
- Le matching descend au niveau du conseiller, pas juste de la structure
- Prise en compte de la charge de travail individuelle

---

## Métriques du matching

| Métrique | Description | Objectif |
|----------|-------------|----------|
| Score moyen de matching | Score moyen de la structure choisie | > 75 |
| Taux d'auto-assignation confirmée | % des suggestions acceptées sans override | > 70% |
| Taux de "sans match" | % des referrals sans structure compatible | < 5% |
| Temps de matching | Durée du calcul | < 200ms |
| Couverture géographique | % des départements avec au moins 1 structure | 100% (objectif long terme) |
