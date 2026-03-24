# 17 — Dashboard conseiller

## Principe directeur
**Des données actionnables, pas des vanity metrics.** Le dashboard doit aider les conseillers et les responsables de structure à prendre des décisions concrètes : qui contacter en priorité ? Ma structure est-elle surchargée ? Quels profils arrivent le plus ?

---

## Accès par rôle

| Vue | Conseiller | Admin structure | Super admin |
|-----|:----------:|:---------------:|:-----------:|
| KPIs de ma structure | ❌ | ✅ | ✅ |
| KPIs globaux (toutes structures) | ❌ | ❌ | ✅ |
| Mes prises en charge | ✅ | ✅ | ✅ |
| Graphiques détaillés | ❌ | ✅ | ✅ |
| Export CSV | ❌ | ✅ | ✅ |

---

## Layout du dashboard

### Vue Admin structure / Super admin

```
┌──────────────────────────────────────────────────────────────┐
│  Dashboard Catch'Up          [Ma structure ▾]  [Période ▾]   │
│                                                              │
│  ── Indicateurs clés ────────────────────────────────────    │
│                                                              │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐       │
│  │    23     │ │    18     │ │   4h32   │ │   87%    │       │
│  │ Demandes  │ │ Prises en │ │  Temps   │ │  Taux    │       │
│  │ ce mois   │ │  charge   │ │  moyen   │ │ prise en │       │
│  │  +15% ▲   │ │  +12% ▲   │ │d'attente │ │  charge  │       │
│  │           │ │           │ │ -2h ▼ ✅  │ │  +5% ▲   │       │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘       │
│                                                              │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐       │
│  │     3     │ │    12     │ │    2     │ │   62%    │       │
│  │ Urgences  │ │ Terminées │ │Abandonnées│ │Remplissage│      │
│  │  en cours │ │ ce mois   │ │ ce mois  │ │ structure │       │
│  │  🔴       │ │  ✅       │ │  ⚠️      │ │  (31/50) │       │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘       │
│                                                              │
│  ── Graphiques ──────────────────────────────────────────    │
│                                                              │
│  ┌─────────────────────────┐  ┌─────────────────────────┐   │
│  │                         │  │                         │   │
│  │  Évolution des demandes │  │  Répartition urgences   │   │
│  │  (courbe sur 30 jours)  │  │  (donut chart)          │   │
│  │                         │  │                         │   │
│  │  📈                     │  │  🟢 68% Normale         │   │
│  │                         │  │  🟠 24% Haute           │   │
│  │                         │  │  🔴  8% Critique        │   │
│  └─────────────────────────┘  └─────────────────────────┘   │
│                                                              │
│  ┌─────────────────────────┐  ┌─────────────────────────┐   │
│  │                         │  │                         │   │
│  │  Distribution RIASEC    │  │  Temps d'attente moyen  │   │
│  │  (radar chart)          │  │  par structure          │   │
│  │                         │  │  (bar chart horizontal) │   │
│  │  🎯                     │  │                         │   │
│  │                         │  │  ML Paris 15   ██░ 3h   │   │
│  │                         │  │  CIDJ Paris    ███░ 6h  │   │
│  │                         │  │  E2C Marseille █████ 12h│   │
│  └─────────────────────────┘  └─────────────────────────┘   │
│                                                              │
│  ┌─────────────────────────┐  ┌─────────────────────────┐   │
│  │                         │  │                         │   │
│  │  Funnel de conversion   │  │  Prises en charge par   │   │
│  │  (entonnoir)            │  │  structure (empilé)     │   │
│  │                         │  │                         │   │
│  │  Chat      ████████ 412 │  │  📊                     │   │
│  │  Referral  ███░░░░░  67 │  │                         │   │
│  │  Pris      ██░░░░░░  52 │  │                         │   │
│  │  Terminé   █░░░░░░░  38 │  │                         │   │
│  └─────────────────────────┘  └─────────────────────────┘   │
│                                                              │
│  ── Alertes ─────────────────────────────────────────────    │
│                                                              │
│  🔴 2 urgences critiques non prises en charge                │
│  🟠 5 demandes en attente > 48h                             │
│  ⚠️ Structure E2C Marseille à 92% de capacité               │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

---

## Indicateurs clés (KPIs)

### KPIs opérationnels

| KPI | Calcul | Granularité | Objectif |
|-----|--------|-------------|----------|
| **Demandes reçues** | COUNT(referral) dans la période | Structure / Global | Indicateur de volume |
| **Prises en charge** | COUNT(prise_en_charge WHERE statut = 'prise_en_charge') | Structure / Global | Indicateur d'activité |
| **Temps d'attente moyen** | AVG(prise_en_charge.premiere_action_le - referral.cree_le) | Structure / Global | < 24h (normale), < 4h (haute), < 1h (critique) |
| **Taux de prise en charge** | Prises en charge / Demandes reçues × 100 | Structure / Global | > 90% |
| **Urgences en cours** | COUNT(referral WHERE priorite IN ('haute','critique') AND statut != 'terminee') | Structure / Global | Monitoring |
| **Terminées** | COUNT(prise_en_charge WHERE statut = 'terminee') | Structure / Global | Indicateur d'impact |
| **Abandonnées** | COUNT(prise_en_charge WHERE statut = 'abandonnee') | Structure / Global | < 20% |
| **Taux de remplissage** | Cas actifs / Capacité max × 100 | Structure | Alerte si > 80% |

### KPIs de qualité

| KPI | Calcul | Objectif |
|-----|--------|----------|
| **Délai de premier contact** | Temps entre prise en charge et premier contact effectif | < 48h |
| **Score moyen de matching** | AVG(prise_en_charge.score_matching) | > 75 |
| **Taux d'override matching** | % des assignations manuelles vs auto | < 30% |
| **Taux de réassignation** | % des cas transférés à une autre structure | < 10% |

### KPIs stratégiques (super admin)

| KPI | Calcul | Intérêt |
|-----|--------|---------|
| **Conversion chat → referral** | Referrals / Conversations (> 5 messages) × 100 | Efficacité du parcours IA |
| **Couverture géographique** | Départements avec structure / 101 départements | Déploiement territorial |
| **Charge par conseiller** | Cas actifs / Conseillers actifs | Équilibre de charge |
| **Durée moyenne de suivi** | AVG(terminee_le - cree_le) pour les prises en charge terminées | Benchmark |

---

## Graphiques détaillés

### 1. Évolution des demandes (LineChart)
- **Type** : Courbe
- **Axe X** : Temps (jours ou semaines selon la période)
- **Axe Y** : Nombre de demandes
- **Séries** : Total, Normale, Haute, Critique
- **Interactivité** : Tooltip au survol avec valeurs exactes
- **Période** : Configurable (7j, 30j, 90j, 12 mois)

### 2. Répartition des urgences (PieChart / DonutChart)
- **Type** : Donut
- **Segments** : Normale (vert), Haute (orange), Critique (rouge)
- **Centre** : Nombre total de demandes
- **Interactivité** : Clic sur un segment → filtre la file active

### 3. Distribution RIASEC (RadarChart)
- **Type** : Radar hexagonal
- **Axes** : R, I, A, S, E, C
- **Valeurs** : Score moyen de chaque dimension sur tous les bénéficiaires
- **Intérêt** : Comprendre quels profils arrivent le plus, adapter les spécialités
- **Comparaison** : Possibilité d'afficher 2 périodes superposées

### 4. Temps d'attente par structure (BarChart horizontal)
- **Type** : Barres horizontales
- **Axe Y** : Noms des structures
- **Axe X** : Temps moyen en heures
- **Couleur** : Vert (< 24h), Orange (24-48h), Rouge (> 48h)
- **Interactivité** : Clic → détail de la structure

### 5. Funnel de conversion (FunnelChart)
- **Type** : Entonnoir
- **Étapes** :
  1. Conversations engagées (> 5 messages)
  2. Profils stabilisés
  3. Referrals créés
  4. Prises en charge
  5. Terminées avec succès
- **Pourcentages** : Taux de passage à chaque étape
- **Intérêt** : Identifier les points de friction

### 6. Prises en charge par structure (StackedBarChart)
- **Type** : Barres empilées
- **Axe X** : Structures
- **Segments** : En cours (bleu), Terminées (vert), Abandonnées (gris)
- **Intérêt** : Comparer la performance des structures

### 7. Heatmap activité (optionnel)
- **Type** : Matrice jour × heure
- **Valeurs** : Nombre de demandes
- **Intérêt** : Identifier les pics d'activité pour dimensionner les équipes

---

## Filtres du dashboard

| Filtre | Options | Rôle minimum |
|--------|---------|--------------|
| **Période** | Aujourd'hui, 7 jours, 30 jours, 90 jours, 12 mois, personnalisé | Admin structure |
| **Structure** | Ma structure (défaut), Toutes (super admin) | Admin structure |
| **Urgence** | Toutes, Normale, Haute, Critique | Admin structure |
| **Statut** | Tous, En cours, Terminé, Abandonné | Admin structure |

Les filtres sont conservés dans l'URL (query params) pour permettre le partage de vues et le bookmark.

---

## Alertes visuelles

### Alertes sur le dashboard

| Alerte | Condition | Affichage |
|--------|-----------|-----------|
| 🔴 Urgence critique non prise en charge | referral WHERE priorite = 'critique' AND statut IN ('nouvelle', 'en_attente') | Badge rouge clignotant + ligne en haut du dashboard |
| 🟠 Demande en attente > 48h | referral WHERE cree_le < NOW() - 48h AND statut IN ('nouvelle', 'en_attente') | Badge orange |
| ⚠️ Structure surchargée | cas actifs > 80% capacité max | Badge jaune |
| ⚠️ Temps d'attente en hausse | Temps moyen cette semaine > +50% vs semaine précédente | Flèche rouge sur le KPI |

### Alertes dans la sidebar
- Nombre de notifications non lues (badge sur l'icône cloche)
- Nombre de demandes en attente dans la file active (badge sur "File active")

---

## Export des données

### Export CSV
- Disponible pour les admin structure et super admin
- Contient : date, bénéficiaire (pseudonymisé), âge, RIASEC dominant, urgence, structure, statut, temps d'attente, conseiller
- **Pas de données nominatives complètes** (RGPD) : prénom + initiale uniquement
- Bouton "Exporter" dans le header du dashboard

### Export PDF (futur)
- Rapport formaté avec graphiques
- Utile pour les bilans de structure ou les rapports à la Fondation JAE

---

## Requêtes SQL principales

### Temps d'attente moyen
```sql
SELECT
  s.nom AS structure_nom,
  AVG(
    CAST((julianday(pec.premiere_action_le) - julianday(r.cree_le)) * 24 AS REAL)
  ) AS attente_heures
FROM prise_en_charge pec
JOIN referral r ON pec.referral_id = r.id
JOIN structure s ON pec.structure_id = s.id
WHERE r.cree_le >= :debut AND r.cree_le <= :fin
GROUP BY s.id
ORDER BY attente_heures ASC;
```

### Distribution RIASEC agrégée
```sql
SELECT
  AVG(pr.r) AS moy_r,
  AVG(pr.i) AS moy_i,
  AVG(pr.a) AS moy_a,
  AVG(pr.s) AS moy_s,
  AVG(pr.e) AS moy_e,
  AVG(pr.c) AS moy_c
FROM profil_riasec pr
JOIN referral ref ON pr.utilisateur_id = ref.utilisateur_id
WHERE ref.cree_le >= :debut AND ref.cree_le <= :fin;
```

### Funnel de conversion
```sql
-- Étape 1 : Conversations engagées
SELECT COUNT(*) FROM conversation WHERE nb_messages >= 5 AND cree_le >= :debut;

-- Étape 2 : Profils stabilisés
SELECT COUNT(*) FROM profil_riasec pr
JOIN conversation c ON pr.utilisateur_id = c.utilisateur_id
WHERE pr.est_stable = 1 AND c.cree_le >= :debut;

-- Étape 3 : Referrals
SELECT COUNT(*) FROM referral WHERE cree_le >= :debut;

-- Étape 4 : Prises en charge
SELECT COUNT(*) FROM prise_en_charge WHERE cree_le >= :debut;

-- Étape 5 : Terminées
SELECT COUNT(*) FROM prise_en_charge WHERE statut = 'terminee' AND terminee_le >= :debut;
```

### Prises en charge par structure (empilé)
```sql
SELECT
  s.nom,
  SUM(CASE WHEN pec.statut IN ('nouvelle','en_attente','prise_en_charge') THEN 1 ELSE 0 END) AS en_cours,
  SUM(CASE WHEN pec.statut = 'terminee' THEN 1 ELSE 0 END) AS terminees,
  SUM(CASE WHEN pec.statut = 'abandonnee' THEN 1 ELSE 0 END) AS abandonnees
FROM prise_en_charge pec
JOIN structure s ON pec.structure_id = s.id
WHERE pec.cree_le >= :debut
GROUP BY s.id
ORDER BY en_cours DESC;
```

---

## Responsive design

### Desktop (> 1024px)
- Grille 4 colonnes pour les KPI cards
- 2 colonnes pour les graphiques
- Sidebar visible

### Tablette (768px - 1024px)
- Grille 2 colonnes pour les KPI cards
- 1 colonne pour les graphiques (scrollable)
- Sidebar rétractable (burger menu)

### Mobile (< 768px)
- 1 colonne pour tout
- KPI cards en scroll horizontal (swipe)
- Graphiques pleine largeur
- Navigation par onglets en bas

---

## Implémentation technique

### Bibliothèque de graphiques : Recharts

```typescript
// Exemple : RadarChart RIASEC
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Tooltip } from 'recharts'

const data = [
  { dimension: 'R', score: 35 },
  { dimension: 'I', score: 42 },
  { dimension: 'A', score: 68 },
  { dimension: 'S', score: 55 },
  { dimension: 'E', score: 28 },
  { dimension: 'C', score: 15 },
]

<RadarChart width={300} height={300} data={data}>
  <PolarGrid />
  <PolarAngleAxis dataKey="dimension" />
  <PolarRadiusAxis domain={[0, 100]} />
  <Radar dataKey="score" stroke="#6C63FF" fill="#6C63FF" fillOpacity={0.3} />
  <Tooltip />
</RadarChart>
```

### API routes

```
GET /api/conseiller/dashboard/stats?periode=30j&structure_id=xxx
  → KPIs agrégés

GET /api/conseiller/dashboard/riasec?periode=30j&structure_id=xxx
  → Distribution RIASEC

GET /api/conseiller/dashboard/structures?periode=30j
  → Métriques par structure (temps d'attente, prises en charge, remplissage)

GET /api/conseiller/dashboard/evolution?periode=30j&structure_id=xxx
  → Série temporelle des demandes

GET /api/conseiller/dashboard/funnel?periode=30j&structure_id=xxx
  → Données du funnel de conversion

GET /api/conseiller/dashboard/export?format=csv&periode=30j&structure_id=xxx
  → Téléchargement CSV
```

### Caching
- Les données du dashboard sont mises en cache côté serveur (**5 minutes**)
- Le cache est invalidé quand un referral change de statut
- Côté client : `stale-while-revalidate` pour un chargement instantané au retour sur la page

---

## Performance

| Contrainte | Objectif |
|------------|----------|
| Temps de chargement initial du dashboard | < 2 secondes |
| Temps de recalcul après changement de filtre | < 500ms |
| Taille du bundle Recharts (tree-shaked) | < 50kb gzip |
| Nombre max de points de données par graphique | 365 (1 an en jours) |
