# 17 — Dashboard conseiller

## Principe directeur
**Des donnees actionnables, pas des vanity metrics.** Le dashboard doit aider les conseillers et les responsables de structure a prendre des decisions concretes : qui contacter en priorite ? Ma structure est-elle surchargee ? Quels profils arrivent le plus ?

---

## Acces par role

| Vue | Conseiller | Admin structure | Super admin |
|-----|:----------:|:---------------:|:-----------:|
| KPIs de ma structure | ✅ | ✅ | ✅ |
| KPIs globaux (toutes structures) | ❌ | ❌ | ✅ |
| Mes prises en charge | ✅ | ✅ | ✅ |
| Graphiques detailles | ✅ | ✅ | ✅ |
| Export CSV | ❌ | ✅ | ✅ |
| Raccourcis rapides | ✅ | ✅ | ✅ |
| Flux d'activite recente | ✅ | ✅ | ✅ |

> **Changement v2.2** : les conseillers et admin_structure voient desormais les KPIs filtres par leur structure. Seul le super_admin voit les donnees agregees globales.

---

## Layout du dashboard

### KPIs principaux (6 cartes)

| KPI | Description | Tous roles |
|-----|-------------|:----------:|
| **Cas en attente** | Referrals en_attente dans ma structure | ✅ |
| **Mes accompagnements actifs** | Prises en charge actives du conseiller connecte | ✅ |
| **Termines ce mois** | Prises en charge terminees depuis le 1er du mois | ✅ |
| **Temps moyen d'attente** | AVG(premiere_action - cree_le) en heures | ✅ |
| **Taux de prise en charge** | % referrals pris vs total | ✅ |
| **Satisfaction NPS** | Moyenne noteRecommandation (0-10) si enquete_satisfaction existe | ✅ |

### KPIs secondaires (4 cartes)

| KPI | Description |
|-----|-------------|
| **Urgences en cours** | Referrals haute/critique non resolus |
| **Demandes totales** | Volume total de referrals sur la periode |
| **Abandonnees** | Prises en charge abandonnees |
| **Remplissage** | % capacite structure (actifs/max) |

---

## Raccourcis rapides

Section "Raccourcis" avec boutons d'action :
- **File active** → `/conseiller/file-active`
- **Mon agenda** → `/conseiller/agenda`
- **Exporter** → `/conseiller/admin` (admin_structure et super_admin uniquement)
- **Ma structure** → `/conseiller/structures/{structureId}`

---

## Graphiques

### 1. Cas par statut (BarChart)
- **Type** : Barres verticales
- **Axe X** : Statuts (en_attente, prise_en_charge, terminee, abandonnee, rupture)
- **Axe Y** : Nombre de cas
- **Couleurs** : Jaune (attente), Indigo (prise en charge), Vert (terminee), Gris (abandonnee), Rouge (rupture)
- **Filtre** : Structure du conseiller connecte

### 2. Evolution sur 30 jours (LineChart)
- **Type** : Courbe
- **Axe X** : Dates (30 derniers jours, jours manquants remplis avec 0)
- **Axe Y** : Nombre de nouveaux cas
- **Couleur** : Violet (#6C63FF)
- **Interactivite** : Tooltip au survol

### 3. Repartition des urgences (PieChart / DonutChart)
- **Type** : Donut
- **Segments** : Normale (vert), Haute (orange), Critique (rouge)
- **Interactivite** : Tooltip + legende

### 4. Distribution RIASEC (BarChart horizontal)
- **Type** : Barres horizontales
- **Axes** : R, I, A, S, E, C avec scores en %
- **Orientations** : Les 3 dimensions dominantes affichent les metiers associes

---

## Flux d'activite recente

Affiche les 5 derniers evenements :
- Source primaire : table `evenement_journal` filtree par structure
- Fallback : derniers changements de statut des referrals
- Icones par type d'evenement
- Format temporel relatif ("Il y a 2h", "Hier", etc.)

---

## Alertes visuelles

| Alerte | Condition | Affichage |
|--------|-----------|-----------|
| Urgences non prises en charge | urgencesEnCours > 0 | Badge rouge anime |
| Temps d'attente eleve | tempsMoyenAttente > 48h | Message orange |
| Structure surchargee | capacite.taux > 80% | Message jaune |

---

## API Routes

### GET `/api/conseiller/dashboard/stats?periode=30`

Retourne :
```json
{
  "periode": 30,
  "kpis": {
    "demandes": 23,
    "prisesEnCharge": 18,
    "terminees": 12,
    "abandonnees": 2,
    "tauxPriseEnCharge": 87,
    "tempsMoyenAttente": 4,
    "urgencesEnCours": 3,
    "capacite": { "max": 50, "actifs": 31, "taux": 62 },
    "mesAccompagnementsActifs": 8,
    "terminesCeMois": 5,
    "satisfactionMoyenne": 7.8,
    "enAttente": 7
  },
  "repartitionUrgences": { "normale": 15, "haute": 6, "critique": 2 },
  "repartitionStatut": [
    { "statut": "en_attente", "count": 7 },
    { "statut": "prise_en_charge", "count": 11 },
    { "statut": "terminee", "count": 12 },
    { "statut": "abandonnee", "count": 2 }
  ],
  "evolution30j": [
    { "date": "2026-02-25", "count": 1 },
    { "date": "2026-02-26", "count": 0 }
  ],
  "recentActivity": [
    { "type": "nouvelle_demande", "resume": "Nouvelle demande (priorite haute)", "acteurType": "systeme", "horodatage": "2026-03-26T10:00:00Z" }
  ]
}
```

**Filtrage par structure** :
- `super_admin` : donnees globales (toutes structures)
- `admin_structure` / `conseiller` : filtre par `structureSuggereId` ou `priseEnCharge.structureId`

### GET `/api/conseiller/dashboard/riasec?periode=30`
Distribution RIASEC agregee des beneficiaires orientes.

---

## Responsive design

### Desktop (> 1024px)
- Grille 6 colonnes pour les KPI cards principaux
- 2 colonnes pour les graphiques
- Sidebar visible

### Tablette (640px - 1024px)
- Grille 3 colonnes pour les KPI cards
- 1 colonne pour les graphiques
- Sidebar retractable

### Mobile (< 640px)
- 2 colonnes pour les KPI cards
- 1 colonne pour les graphiques
- Textes reduits (text-xs/text-xl au lieu de text-sm/text-2xl)

---

## Implementation technique

- **Bibliotheque graphiques** : Recharts (LineChart, BarChart, PieChart, RadarChart)
- **Hook** : `useConseiller()` pour role et structure
- **Donnees** : Fetch au mount + changement de periode
- **Rafraichissement** : Manuel via changement de periode (pas de polling)

---

## Performance

| Contrainte | Objectif |
|------------|----------|
| Temps de chargement initial du dashboard | < 2 secondes |
| Temps de recalcul apres changement de filtre | < 500ms |
| Taille du bundle Recharts (tree-shaked) | < 50kb gzip |
| Nombre max de points de donnees par graphique | 365 (1 an en jours) |
