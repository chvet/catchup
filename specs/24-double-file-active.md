# 24 - Double file active (sourcee / generique)

## Objectif

Permettre aux conseillers de distinguer deux types de referrals dans leur file active :

- **File sourcee** : beneficiaires orientes directement vers la structure du conseiller (via un lien avec `structureSlug`, QR code structure, prescripteur). Ces cas sont prioritaires car la structure a ete explicitement choisie.
- **File generique** : beneficiaires orientes par l'algorithme de matching global, sans ciblage structure. Ces cas sont disponibles pour toutes les structures compatibles.

## Schema

### Table `referral`

Ajout de la colonne `source` :

| Colonne  | Type | Default     | Valeurs possibles       |
|----------|------|-------------|------------------------|
| `source` | TEXT | `generique` | `sourcee`, `generique` |

Positionnee apres `statut`.

## Logique de creation du referral

Dans `POST /api/referrals` :

- Si `structureSlug` est fourni dans le body → `source = 'sourcee'`
- Sinon → `source = 'generique'`

La valeur `source` est inseree dans le referral lors de sa creation.

## API File active

### `GET /api/conseiller/file-active`

#### Nouveau parametre `source`

| Valeur      | Comportement |
|-------------|-------------|
| `sourcee`   | Filtre `referral.source = 'sourcee' AND referral.structureSuggereId = structureId du conseiller` |
| `generique` | Filtre `referral.source = 'generique'` |
| `tous`      | Pas de filtre source (comportement existant, defaut) |

#### Enrichissement matching

Chaque referral retourne est enrichi avec un score de matching calcule par rapport a la structure du conseiller connecte :

| Champ             | Type       | Description |
|-------------------|------------|-------------|
| `matchScore`      | `number`   | Score 0-100 de compatibilite avec la structure |
| `horsChamp`       | `boolean`  | `true` si le referral echoue aux filtres eliminatoires |
| `raisonsHorsChamp`| `string[]` | Raisons d'exclusion (geo, age, capacite) |
| `raisonsMatch`    | `string[]` | Raisons positives du matching (departement, age, specialite) |

Le calcul reutilise `matcherStructures` de `src/core/matching.ts` en passant uniquement la structure du conseiller.

## API Transfert

### `POST /api/conseiller/file-active/[id]/transfer`

Permet de transferer un referral entre files.

#### Body

```json
{
  "destination": "generique" | "structure",
  "structureId": "uuid (requis si destination=structure)",
  "motif": "string (obligatoire)"
}
```

#### Comportement

- **`destination = 'generique'`** : Met a jour `source = 'generique'`, `structureSuggereId = null`
- **`destination = 'structure'`** : Verifie que la structure existe et est active, met a jour `source = 'sourcee'`, `structureSuggereId = structureId`

#### Tracabilite

- Log dans `evenement_journal` (types : `transfert_generique`, `transfert_structure`)
- Log dans `evenement_audit`

### `GET /api/conseiller/file-active/[id]/transfer`

Retourne la liste des structures actives disponibles pour un transfert (exclut la structure du conseiller connecte).

#### Reponse

```json
{
  "structures": [
    { "id": "...", "nom": "...", "slug": "...", "departements": ["75", "92"] }
  ]
}
```

## Seed

- La colonne `source` est ajoutee au CREATE TABLE (`source TEXT DEFAULT 'generique'`)
- ~60% des referrals seed sont `sourcee` (avec `structure_suggeree_id` correspondant a la structure du conseiller associe)
- ~40% sont `generique` (sans structure suggeree)

## Types journal

Deux nouveaux types ajoutes a `JournalEventType` :

- `transfert_generique`
- `transfert_structure`

## Fichiers modifies

- `src/data/schema.ts` — colonne `source` dans la table `referral`
- `src/app/api/referrals/route.ts` — logique de source a la creation
- `src/app/api/conseiller/file-active/route.ts` — filtre source + enrichissement matching
- `src/app/api/conseiller/file-active/[id]/transfer/route.ts` — nouveau endpoint transfert
- `src/lib/journal.ts` — types transfert
- `scripts/seed.ts` — colonne source + repartition sourcee/generique
