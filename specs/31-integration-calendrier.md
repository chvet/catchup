# Spec 31 — Intégration Calendrier (Google Calendar + Outlook)

> **Statut :** Implémenté  
> **Version :** 1.0  
> **Date :** 2026-03-27  
> **Dernière mise à jour spec :** 2026-04-07  
> **Fichiers clés :** `src/app/api/calendar/google/route.ts`, `src/app/api/calendar/outlook/route.ts`, `src/app/api/calendar/status/route.ts`, `src/data/schema.ts` (calendarConnection, rendezVous.googleEventId/outlookEventId)

## Objectif

Permettre aux conseillers de connecter leur agenda Google Calendar ou Microsoft Outlook via OAuth2, afin de synchroniser automatiquement les rendez-vous crees dans Catch'Up vers leur calendrier externe.

## Fonctionnalites

### 1. Connexion OAuth2

- **Google Calendar** : OAuth2 avec scopes `calendar.events` + `userinfo.email`, access_type `offline` pour obtenir un refresh token
- **Microsoft Outlook** : OAuth2 via Azure AD avec scopes `Calendars.ReadWrite`, `User.Read`, `offline_access`
- Les tokens (access + refresh) sont stockes en base dans la table `calendar_connection`
- Le refresh est transparent : avant chaque operation calendrier, le token est verifie et rafraichi si necessaire

### 2. Schema

Nouvelle table `calendar_connection` :
- `id` (PK)
- `type` : `conseiller` | `beneficiaire`
- `userId` : ID du conseiller ou beneficiaire
- `provider` : `google` | `outlook`
- `accessToken`, `refreshToken`, `expiresAt`
- `email` : adresse email du compte calendrier
- `creeLe`, `misAJourLe`

Colonnes ajoutees a `rendez_vous` :
- `googleEventId` : ID de l'evenement Google Calendar cree
- `outlookEventId` : ID de l'evenement Outlook cree

### 3. Flux OAuth2

1. L'utilisateur clique sur "Connecter" dans Parametres
2. Redirection vers `/api/calendar/{provider}` qui encode un `state` (type, userId, returnUrl) et redirige vers le consent screen du provider
3. Apres consentement, le provider redirige vers `/api/calendar/{provider}/callback`
4. Le callback echange le code pour des tokens, sauvegarde la connexion, et redirige vers `returnUrl?calendar=connected`

### 4. Synchronisation automatique des RDV

Quand un conseiller cree un RDV via `POST /api/conseiller/rdv` :
1. Apres creation du RDV en base, on verifie si le conseiller a des connexions calendrier
2. Pour chaque connexion, on rafraichit le token si necessaire
3. On cree l'evenement sur le calendrier externe
4. On stocke l'ID de l'evenement externe (`googleEventId` / `outlookEventId`)
5. Si la synchro echoue, le RDV est quand meme cree — l'erreur est loguee mais ne bloque pas

### 5. API Routes

| Route | Methode | Description |
|-------|---------|-------------|
| `/api/calendar/google` | GET | Initie le flux OAuth Google |
| `/api/calendar/google/callback` | GET | Callback Google OAuth |
| `/api/calendar/outlook` | GET | Initie le flux OAuth Outlook |
| `/api/calendar/outlook/callback` | GET | Callback Outlook OAuth |
| `/api/calendar/status` | GET | Statut des connexions du conseiller |
| `/api/calendar/disconnect` | POST | Deconnecte un provider |

### 6. UI — Page Parametres

Section "Mes agendas" dans `/conseiller/parametres` :
- Affiche le statut de connexion pour Google Calendar et Outlook
- Bouton "Connecter" pour chaque provider non connecte
- Quand connecte : affiche l'email du compte + bouton "Deconnecter"
- Indicateur vert quand connecte
- Messages de succes/erreur apres OAuth

### 7. Variables d'environnement

| Variable | Description |
|----------|-------------|
| `GOOGLE_CALENDAR_CLIENT_ID` | Client ID Google OAuth |
| `GOOGLE_CALENDAR_CLIENT_SECRET` | Client Secret Google OAuth |
| `GOOGLE_CALENDAR_REDIRECT_URI` | URI de callback Google |
| `O365_CLIENT_ID` | Client ID Azure AD |
| `O365_CLIENT_SECRET` | Client Secret Azure AD |
| `O365_TENANT_ID` | Tenant ID Azure AD |
| `O365_CALENDAR_REDIRECT_URI` | URI de callback Outlook |

### 8. Securite

- Les callbacks OAuth sont exempts de verification JWT dans le middleware (le state encode contient les infos utilisateur)
- Les tokens sont stockes en base (SQLite chiffre le fichier sur le volume)
- Le refresh token est utilise automatiquement quand l'access token expire
- Aucune donnee sensible n'est exposee cote client

## Fichiers concernes

- `src/data/schema.ts` — table `calendarConnection` + colonnes RDV
- `src/lib/calendar-oauth.ts` — logique OAuth2 + CRUD calendrier
- `src/app/api/calendar/google/route.ts` — initiation OAuth Google
- `src/app/api/calendar/google/callback/route.ts` — callback Google
- `src/app/api/calendar/outlook/route.ts` — initiation OAuth Outlook
- `src/app/api/calendar/outlook/callback/route.ts` — callback Outlook
- `src/app/api/calendar/status/route.ts` — statut connexions
- `src/app/api/calendar/disconnect/route.ts` — deconnexion
- `src/app/api/conseiller/rdv/route.ts` — auto-sync lors de la creation
- `src/app/conseiller/parametres/page.tsx` — UI connexion calendrier
- `src/middleware.ts` — exemption JWT pour les callbacks
- `docker-compose.yml` — variables d'environnement
