# Spec 27 — Suivi d'activités hebdomadaire

> **Statut :** Implémenté  
> **Dernière mise à jour spec :** 2026-04-07  
> **Fichiers clés :** `src/components/conseiller/ActivitesTab.tsx`, `src/app/api/conseiller/file-active/[id]/activites/`, `src/app/api/conseiller/file-active/[id]/objectifs/`, `src/app/api/conseiller/activites/categories/`, `src/data/schema.ts` (categorieActivite, declarationActivite, objectifHebdomadaire, alerteDecrochage)

## Contexte

Inspiré de l'analyse du Céreq sur le CEJ (Contrat d'Engagement Jeune), cette feature ajoute un système de suivi d'activités hebdomadaire orienté **aide à l'accompagnement** (pas contrôle/sanction).

## Nouvelles tables

### `categorie_activite` (référentiel)
- `id`, `code` (unique), `label`, `icone`, `couleur`, `ordre`, `actif`

### `declaration_activite`
- `id`, `priseEnChargeId`, `utilisateurId`
- `categorieCode` — ref vers categorie_activite.code
- `description` — texte libre
- `dureeMinutes` — durée déclarée
- `dateSemaine` — lundi de la semaine (ISO)
- `dateActivite` — date réelle
- `source` — 'manuel' | 'chat_auto'
- `messageDirectId` — nullable, lien vers message si auto-déclaré
- `statut` — 'en_attente' | 'validee' | 'refusee'
- `valideePar`, `valideLe`, `commentaireConseiller`
- `creeLe`, `misAJourLe`

### `objectif_hebdomadaire`
- `id`, `priseEnChargeId`
- `semaine` — lundi ISO
- `cibleHeures` — objectif en heures (ex: 5.0)
- `cibleRecommandeeIA` — suggestion IA
- `ajusteParConseiller` — boolean
- `commentaire`
- `creeLe`, `misAJourLe`

### `alerte_decrochage`
- `id`, `priseEnChargeId`, `conseillerId`
- `type` — 'activite_baisse' | 'silence_prolonge' | 'ton_negatif' | 'objectif_non_atteint'
- `severite` — 'info' | 'attention' | 'critique'
- `signaux` — JSON array
- `resumeIA` — résumé IA lisible
- `lue`, `traitee`, `actionPrise`
- `creeLe`, `traiteeLe`

## Catégories d'activités

| Code | Label | Icône |
|------|-------|-------|
| recherche_emploi | Recherche d'emploi | 💼 |
| formation | Formation | 📚 |
| permis | Permis de conduire | 🚗 |
| sante | Santé / bien-être | 🏥 |
| sport | Sport / activité physique | ⚽ |
| benevolat | Bénévolat / engagement | 🤝 |
| dev_perso | Développement personnel | 🌱 |

## API Routes

### Phase 1 (CRUD + catégories)
- `GET /api/conseiller/activites/categories`
- `GET/POST /api/conseiller/file-active/[id]/activites`
- `PATCH /api/conseiller/file-active/[id]/activites/[actId]`
- `GET /api/conseiller/file-active/[id]/activites/semaine`
- `GET/POST /api/accompagnement/activites`

### Phase 2 (objectifs progressifs)
- `GET/POST /api/conseiller/file-active/[id]/objectifs`
- `GET /api/conseiller/file-active/[id]/objectifs/recommandation`

### Phase 3 (auto-déclaration chat)
- `POST /api/accompagnement/activites/parse`

### Phase 4 (dashboard portefeuille)
- `GET /api/conseiller/dashboard/portefeuille`

### Phase 5 (alertes décrochage)
- `GET/PATCH /api/conseiller/alertes-decrochage`
- `GET /api/cron/decrochage`

## Principes
- Pas de quota rigide, objectifs progressifs et personnalisés
- Le conseiller valide les déclarations (pas de sanction automatique)
- Orienté détection de décrochage, pas contrôle
- Aucune modification des tables existantes
