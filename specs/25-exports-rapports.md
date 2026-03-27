# Spec 25 — Exports et rapports d'activite

## Contexte

Les conseillers admin_structure et super_admin ont besoin de generer des rapports d'activite et d'exporter des listes pour le suivi, le reporting et la coordination.

## Endpoint API

**GET** `/api/conseiller/export`

### Parametres (query string)

| Parametre     | Type   | Requis | Description |
|---------------|--------|--------|-------------|
| `format`      | string | oui    | `pdf` ou `xlsx` |
| `type`        | string | oui    | `activite`, `beneficiaires` ou `structures` |
| `from`        | string | non    | Date ISO debut (defaut : 30 jours avant) |
| `to`          | string | non    | Date ISO fin (defaut : aujourd'hui) |
| `structureId` | string | non    | Filtre par structure (super_admin uniquement) |

### Authentification

- Via `getConseillerFromHeaders()` (middleware JWT)
- **admin_structure** : voit uniquement sa structure
- **super_admin** : voit tout, ou filtre avec `structureId`

### Types d'export

#### 1. Rapport d'activite (`type=activite`)

**PDF (A4 paysage)** :
- En-tete : titre + periode
- Section 1 : KPIs (total demandes, PEC, terminees, ruptures, taux PEC, temps moyen attente)
- Section 2 : Repartition par statut (tableau)
- Section 3 : Repartition par urgence (tableau)
- Section 4 : Top 5 structures (super_admin sans filtre uniquement)
- Section 5 : Resume evolution sur la periode
- Pied de page : "Genere par Catch'Up — {date}"

**Excel** :
- Feuille 1 "Synthese" : KPIs en cellules avec labels
- Feuille 2 "Detail beneficiaires" : 1 ligne par referral (prenom, age, departement, date demande, statut, structure, conseiller, duree attente)
- Feuille 3 "Par structure" : 1 ligne par structure (nom, nb demandes, nb PEC, nb terminees, taux, temps moyen)
- Colonnes auto-dimensionnees, en-tetes en gras avec fond colore

#### 2. Liste beneficiaires (`type=beneficiaires`)

Excel uniquement :
- 1 ligne par referral : prenom, age, genre, localisation, situation, date demande, statut, priorite, structure suggeree, conseiller assigne, score matching

#### 3. Liste structures (`type=structures`)

Excel uniquement :
- 1 ligne par structure : nom, type, slug, departements, specialites, nb conseillers, nb cas actifs, capacite max, taux remplissage

## Interface utilisateur

### Dashboard admin (`/conseiller/admin`)

- Bouton "Exporter" dans l'en-tete (coin superieur droit)
- Dropdown avec selecteur de periode (date debut / date fin)
- 4 options : Rapport PDF, Rapport Excel, Liste beneficiaires, Liste structures
- Chaque option ouvre l'URL d'export dans un nouvel onglet

### File active (`/conseiller/file-active`)

- Bouton "Exporter" a cote des filtres (visible pour admin_structure et super_admin)
- Exporte la liste des beneficiaires en Excel
- Utilise les dates du filtre avance si renseignees

## Stack technique

- **PDF** : `jspdf` (deja installe)
- **Excel** : `exceljs` (ajoute en dependance)
- Generation cote serveur (Node.js)
- Reponse avec `Content-Type` et `Content-Disposition` corrects
- Texte en francais, nombres formates en locale francaise

## Permissions

| Role             | activite | beneficiaires | structures |
|------------------|----------|---------------|------------|
| conseiller       | -        | -             | -          |
| admin_structure  | sa structure | sa structure | sa structure |
| super_admin      | tout ou filtre | tout ou filtre | tout ou filtre |
