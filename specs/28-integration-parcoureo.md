# Spec 28 — Intégration Parcoureo (SSO + API bidirectionnelle)

> **Statut :** Implémenté (stubs — en attente du token API Parcoureo)  
> **Date :** 2026-03-26  
> **Dernière mise à jour spec :** 2026-04-07  
> **Priorité :** Haute  
> **Fichiers clés :** `src/app/api/conseiller/auth/parcoureo/route.ts`, `src/app/api/conseiller/auth/parcoureo/callback/route.ts`, `src/app/api/conseiller/auth/parcoureo/status/route.ts`  
> **Variables env :** `PARCOUREO_API_URL`, `PARCOUREO_API_KEY` (non-breaking : fonctionne normalement si non configuré)

## Contexte

Parcoureo est la plateforme existante de la Fondation JAE pour l'orientation professionnelle. Les conseillers disposent deja d'un compte Parcoureo. Cette integration permet :

1. **SSO** : Se connecter a Catch'Up/Wesh avec ses identifiants Parcoureo
2. **Sync push** : Envoyer les profils beneficiaires vers Parcoureo apres creation d'un referral
3. **Sync pull** : Recuperer un profil beneficiaire depuis Parcoureo (reserve pour usage futur)

## Architecture

### Architecture stub

Toutes les fonctions d'integration sont implementees comme des **stubs** qui retournent `null` ou `false` quand `PARCOUREO_API_KEY` n'est pas configure. L'application fonctionne normalement sans Parcoureo — l'integration est 100% non-breaking.

Pour activer l'integration, il suffit de renseigner les variables d'environnement :
- `PARCOUREO_API_URL` — URL de base de l'API Parcoureo (defaut : `https://api.parcoureo.fr`)
- `PARCOUREO_API_KEY` — Cle d'API pour l'authentification

### Fichiers crees/modifies

| Fichier | Role |
|---------|------|
| `src/lib/parcoureo.ts` | Module d'integration (SSO + sync) |
| `src/app/api/conseiller/auth/parcoureo/route.ts` | Endpoint SSO (GET redirect + POST validation) |
| `src/app/api/conseiller/auth/parcoureo/callback/route.ts` | Callback SSO (retour de Parcoureo) |
| `src/app/api/conseiller/auth/parcoureo/status/route.ts` | Statut de l'integration (pour UI) |
| `src/app/conseiller/login/page.tsx` | Bouton "Se connecter avec Parcoureo" |
| `src/app/conseiller/parametres/page.tsx` | Section Parcoureo (statut + liaison) |
| `src/app/api/referrals/route.ts` | Sync beneficiaire apres creation referral |
| `src/middleware.ts` | Routes Parcoureo publiques |
| `src/data/schema.ts` | Champ `parcoureoId` sur table `conseiller` |
| `docker-compose.yml` | Variables d'environnement |

## Flux SSO

```
Conseiller          Catch'Up                    Parcoureo
    |                   |                           |
    |-- Clic bouton --> |                           |
    |                   |-- GET /auth/parcoureo ---> |
    |                   |   (redirect 302)          |
    |   <-------------- |                           |
    |                                               |
    |-- Login -------> |                            |
    |                  (page login Parcoureo)        |
    |                                               |
    |   <-- Redirect /callback?token=xxx -----------|
    |                   |                           |
    |                   |-- validateToken(xxx) ---> |
    |                   |   <-- { email, nom... } --|
    |                   |                           |
    |                   |-- Find/Create conseiller  |
    |                   |-- Create JWT + cookie     |
    |                   |-- Redirect /conseiller    |
    |   <-------------- |                           |
```

## Endpoints API

### GET `/api/conseiller/auth/parcoureo`
Redirige vers la page de login Parcoureo avec le callback URL.

### POST `/api/conseiller/auth/parcoureo`
Validation directe d'un token (pour usage programmatique).
- Body : `{ token: string }`
- Retour : `{ success: true, slug: string | null }`

### GET `/api/conseiller/auth/parcoureo/callback`
Callback OAuth-like. Parcoureo redirige ici apres authentification.
- Query : `?token=xxx`
- Action : valide le token, cree/retrouve le conseiller, cree la session, redirige vers `/conseiller`

### GET `/api/conseiller/auth/parcoureo/status`
Verifie si l'integration est configuree (route publique).
- Retour : `{ configured: boolean, provider: string | null, baseUrl: string | null }`

## Synchronisation des profils

### Push (Catch'Up -> Parcoureo)

Apres chaque creation de referral (`POST /api/referrals`), si Parcoureo est configure :
- Les donnees du beneficiaire (prenom, email, age, RIASEC, interets, traits) sont envoyees de maniere **asynchrone et non-bloquante** (`catch(() => {})`)
- Un echec de sync n'impacte pas la creation du referral

### Pull (Parcoureo -> Catch'Up)

Fonction `getBeneficiaireFromParcoureo(email)` disponible mais non encore appelee automatiquement. Reservee pour :
- Import de profils existants
- Enrichissement lors de la prise en charge

## Schema base de donnees

### Table `conseiller` — nouveau champ

| Colonne | Type | Description |
|---------|------|-------------|
| `parcoureo_id` | TEXT | Identifiant Parcoureo du conseiller (nullable) |

### Table `structure` — champ existant

| Colonne | Type | Description |
|---------|------|-------------|
| `parcoureo_id` | TEXT | Identifiant Parcoureo de la structure (pour le mapping) |

## Configuration

### Variables d'environnement

| Variable | Defaut | Description |
|----------|--------|-------------|
| `PARCOUREO_API_URL` | `https://api.parcoureo.fr` | URL de base de l'API Parcoureo |
| `PARCOUREO_API_KEY` | (vide) | Cle API — si vide, l'integration est desactivee |

### docker-compose.yml

Les deux variables sont ajoutees aux services `wesh` et `catchup` avec des valeurs vides par defaut.

## Remplacement des stubs

Pour activer la vraie integration, modifier `src/lib/parcoureo.ts` :

1. **`validateParcoureoToken()`** : Decommenter le `fetch` vers `GET /api/auth/validate`
2. **`syncBeneficiaireToParcoureo()`** : Decommenter le `fetch` vers `POST /api/beneficiaires/sync`
3. **`getBeneficiaireFromParcoureo()`** : Decommenter le `fetch` vers `GET /api/beneficiaires?email=...`

Chaque fonction contient le code commente pret a etre active.

## Securite

- Les routes SSO Parcoureo sont ajoutees a `PUBLIC_ROUTES` dans le middleware (pas besoin de JWT pour y acceder)
- Le rate limiting existant s'applique (200 req/min par IP sur `/api/*`)
- Les tokens Parcoureo sont valides cote serveur uniquement
- Les conseillers crees par SSO n'ont pas de mot de passe (connexion SSO uniquement)
- Un conseiller existant peut lier son compte Parcoureo depuis les parametres
