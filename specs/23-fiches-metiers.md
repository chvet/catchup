# Spec 23 — Fiches Métiers (API JAE)

> **Statut :** Implémenté  
> **Date :** 2026-03-25  
> **Dernière mise à jour spec :** 2026-04-07  
> **Priorité :** Haute  
> **Fichiers clés :** `src/app/api/fiches/`, `src/components/FicheMetierCard.tsx`, `src/components/FicheMetierModal.tsx`, `src/components/FichesSearchOverlay.tsx`

## Objectif

Integrer les fiches metiers de la Fondation JAE (Parcoureo) dans le chat beneficiaire, permettant aux jeunes d'explorer des metiers directement depuis la conversation.

## Source de donnees

API JAE : `https://agents.jaeprive.fr`

| Endpoint | Description |
|---|---|
| `GET /api/fiches?search={term}&limit=5` | Recherche de fiches par mot-cle |
| `GET /api/fiches/{code_rome}` | Fiche complete par code ROME |

Champs cles d'une fiche : `code_rome`, `nom_epicene`, `description_courte`, `description`, `competences`, `formations`, `salaires`, `perspectives`, `conditions_travail`, `profil_riasec`, `missions_principales`, `traits_personnalite`

## Architecture

### Routes API (proxy)

| Route interne | Proxy vers | Cache |
|---|---|---|
| `GET /api/fiches?search=X` | `/api/fiches?search=X&limit=5` | 1h |
| `GET /api/fiches/{code}` | `/api/fiches/{code}` | 24h |

Les routes proxy evitent l'exposition directe de l'API JAE au client et permettent le cache cote serveur.

### Composants UI

1. **FicheMetierCard** (`src/components/FicheMetierCard.tsx`)
   - Carte resume : nom (bold), description courte (3 lignes max), badge code ROME
   - Bouton "Voir la fiche complete"
   - Style : white card, catchup-primary accents, rounded-xl

2. **FicheMetierModal** (`src/components/FicheMetierModal.tsx`)
   - Modal plein ecran (slide-up mobile) / centree desktop
   - Fetch de la fiche complete a l'ouverture
   - Sections en accordeon : Description (ouvert), Missions, Competences (tags), Formations, Salaires, Conditions de travail, Perspectives, Profil RIASEC (badges), Traits de personnalite
   - Header : nom + code ROME + bouton fermer
   - Footer : bouton "Ca m'interesse !" + source JAE
   - Etats : chargement (spinner), erreur, contenu

3. **FichesSearchOverlay** (`src/components/FichesSearchOverlay.tsx`)
   - Overlay plein ecran avec barre de recherche
   - Recherche en temps reel (debounce 400ms)
   - Tags de suggestion rapide : Informatique, Sante, Art, Sport, Commerce
   - Affiche les resultats sous forme de FicheMetierCard
   - Clic sur une carte ouvre le FicheMetierModal
   - Bouton "Ca m'interesse !" envoie un message au chat IA

### Integration ChatApp

- Bouton "Explorer les metiers" visible des que la conversation a commence
- Place a cote du bouton "Parler a un conseiller"
- Le clic ouvre le FichesSearchOverlay
- "Ca m'interesse !" injecte un message user : `Le metier "X" m'interesse ! Tu peux m'en dire plus ?`

### Integration IA (system prompt)

Section `FICHES_METIERS` ajoutee au system prompt :
- L'IA suggere d'explorer les fiches metiers quand le jeune montre de l'interet pour un domaine
- Maximum 1-2 suggestions par conversation
- Si le jeune revient avec un interet pour un metier, l'IA enchaine naturellement

## Parcours utilisateur

1. Le jeune discute avec Catch'Up et evoque un domaine d'interet
2. L'IA suggere : "Tu peux utiliser le bouton Explorer les metiers"
3. Le jeune clique sur le bouton, tape "musique"
4. 5 fiches metiers s'affichent sous forme de cartes
5. Il clique sur "Compositeur" → modal avec tous les details
6. Il clique "Ca m'interesse !" → le chat recoit "Le metier Compositeur m'interesse !"
7. L'IA enchaine en faisant le lien avec son profil RIASEC

## Fichiers concernes

- `src/app/api/fiches/route.ts` — Proxy recherche
- `src/app/api/fiches/[code]/route.ts` — Proxy fiche complete
- `src/components/FicheMetierCard.tsx` — Carte resume
- `src/components/FicheMetierModal.tsx` — Modal fiche complete
- `src/components/FichesSearchOverlay.tsx` — Overlay de recherche
- `src/components/ChatApp.tsx` — Integration bouton + overlay
- `src/core/system-prompt.ts` — Instructions IA
