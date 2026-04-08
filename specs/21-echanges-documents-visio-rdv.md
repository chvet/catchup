# 21 — Échanges de documents, visio et rendez-vous

> **Statut :** Implémenté  
> **Version :** 1.0.0  
> **Date :** 2026-03-23  
> **Dernière mise à jour spec :** 2026-04-07  
> **Fichiers clés :** `src/components/VisioCall.tsx` (WebRTC P2P), `src/hooks/useWebRTC.ts`, `src/app/api/visio/signal/`, `src/app/api/conseiller/file-active/[id]/rdv/`, `src/app/api/conseiller/file-active/[id]/documents/`  
> **Note :** La visio utilise WebRTC P2P avec signaling maison (SSE + POST), pas Jitsi Meet comme initialement prévu.

---

## Vue d'ensemble

L'accompagnement entre le conseiller, le bénéficiaire et les tiers s'appuie sur 3 canaux complémentaires au chat textuel :

1. **Échange de documents** — tout type de fichier (CV, attestations, photos, etc.)
2. **Visioconférence** — via Jitsi Meet (gratuit, sans installation)
3. **Prise de rendez-vous** — avec liens calendrier Google/Outlook

---

## 1. Échange de documents

### Fonctionnalité
Chaque participant peut envoyer et recevoir des documents directement dans le chat.

### Types de fichiers acceptés

| Catégorie | Extensions | MIME type |
|-----------|-----------|-----------|
| Images | .jpg, .jpeg, .png, .gif, .webp | image/* |
| PDF | .pdf | application/pdf |
| Word | .doc, .docx | application/msword, application/vnd.openxmlformats-* |
| Excel | .xls, .xlsx | application/vnd.ms-excel, application/vnd.openxmlformats-* |
| PowerPoint | .ppt, .pptx | application/vnd.ms-powerpoint, application/vnd.openxmlformats-* |
| Texte | .txt, .csv | text/plain, text/csv |

**Taille max : 10 MB** par fichier. Les exécutables (.exe, .bat, .sh, etc.) sont refusés.

### Stockage
- Fichiers stockés dans `/app/data/uploads/{priseEnChargeId}/`
- Nommage : `{uuid}.{extension}` (noms originaux non exposés dans le système de fichiers)
- Persistés via Docker volume `catchup-data`
- Protection path traversal sur le endpoint de téléchargement

### Affichage dans le chat
Document affiché en carte inline :
```
┌──────────────────────────┐
│ 📄 rapport-stage.pdf     │
│ 2.4 MB                   │
│ [Télécharger]            │
└──────────────────────────┘
```
- Icône adaptée au type MIME (📄 PDF, 🖼️ image, 📊 tableur, 📝 texte)
- Nom original du fichier + taille
- Bouton de téléchargement

### API

| Endpoint | Méthode | Auth | Description |
|----------|---------|------|-------------|
| `/api/conseiller/file-active/[id]/documents` | POST | JWT | Upload par le conseiller |
| `/api/conseiller/file-active/[id]/documents` | GET | JWT | Liste des documents |
| `/api/accompagnement/documents` | POST | Bearer token | Upload par le bénéficiaire |
| `/api/accompagnement/documents` | GET | Bearer token | Liste des documents |
| `/api/tiers/documents` | POST | Bearer token | Upload par le tiers |
| `/api/tiers/documents` | GET | Bearer token | Liste des documents |
| `/api/documents/[...path]` | GET | Public (UUID) | Téléchargement d'un fichier |

### Sécurité
- Validation MIME type + extension (double vérification)
- Pas d'exécutables
- Noms de fichiers UUID (indevinables)
- Protection path traversal (blocage `..`, `~`)
- Cache client 24h sur les téléchargements

---

## 2. Visioconférence (WebRTC P2P)

> **Changement d'implémentation :** La spec initiale prévoyait Jitsi Meet (service tiers). L'implémentation finale utilise **WebRTC P2P** avec un signaling maison (SSE + POST) pour éviter la dépendance externe et réduire la latence.

### Fonctionnalité
Le conseiller peut proposer un appel visio. Le bénéficiaire accepte ou refuse.

### Flux

```
Conseiller                              Bénéficiaire
     |                                        |
     |-- [Clic 📹 Visio] ------------------>|
     |   POST /api/visio/signal               |
     |   → Offre WebRTC (SDP)                 |
     |                                        |
     |                                   [Voir VisioCall]
     |                                   [Accepter / Refuser]
     |                                        |
     |<-- POST /api/visio/signal (answer)     |
     |                                        |
     |-- [Connexion P2P établie] ------------|
     |   Audio + Vidéo en direct              |
```

### Détails techniques
- **Signaling :** SSE (GET `/api/visio/signal/stream`) + POST `/api/visio/signal` pour l'échange offer/answer/ICE candidates
- **STUN :** Google STUN servers (`stun:stun.l.google.com:19302`)
- **TURN :** Fallback via `turn:catchup.jaeprive.fr:3478` (pour les réseaux restrictifs)
- **Composant :** `src/components/VisioCall.tsx` + `src/hooks/useWebRTC.ts`
- **Optimisations :** Pause vidéo en arrière-plan (économie batterie iOS), toggle audio/vidéo
- Pas d'installation requise (WebRTC est natif dans tous les navigateurs modernes)

### API

| Endpoint | Méthode | Description |
|----------|---------|-------------|
| `/api/conseiller/file-active/[id]/video` | POST | Proposer un appel visio |
| `/api/accompagnement/video/reponse` | POST | Accepter/refuser un appel |

---

## 3. Prise de rendez-vous

### Fonctionnalité
Le conseiller planifie un rendez-vous visible par le bénéficiaire avec liens d'ajout au calendrier.

### Formulaire (côté conseiller)
- Titre du rendez-vous
- Date et heure
- Lieu (optionnel)
- Description (optionnel)

### Affichage dans le chat
```
┌──────────────────────────────────┐
│ 📅 Rendez-vous                   │
│ Entretien d'orientation          │
│ Lundi 24 mars 2026 à 14h30      │
│ Mission Locale Paris 15          │
│                                  │
│ [📅 Google Agenda] [📅 Outlook]  │
└──────────────────────────────────┘
```

### Liens calendrier
- **Google Calendar** : URL pré-remplie avec titre, date, lieu, description
- **Outlook / iCal** : fichier `.ics` téléchargeable

### Table `rendez_vous`

Depuis v1.1.0, les rendez-vous sont stockés dans une table dédiée (et non uniquement dans le journal) :

| Champ | Type | Description |
|-------|------|-------------|
| `id` | text PK | UUID |
| `prise_en_charge_id` | text FK | Lien avec la prise en charge |
| `titre` | text | Titre du rendez-vous |
| `description` | text | Description optionnelle |
| `date_heure` | text | Date/heure ISO 8601 |
| `duree_minutes` | integer | Durée (défaut 30) |
| `lieu` | text | 'visio' ou adresse physique |
| `lien_visio` | text | URL Jitsi si visio |
| `statut` | text | planifie / confirme / annule / termine |
| `organisateur_type` | text | conseiller / tiers |
| `organisateur_id` | text | ID de l'organisateur |
| `participants` | text | JSON array de participants |
| `rappel_envoye` | integer | Flag rappel envoyé |
| `cree_le` / `mis_a_jour_le` | text | Timestamps |

### API

| Endpoint | Méthode | Description |
|----------|---------|-------------|
| `/api/conseiller/file-active/[id]/rdv` | POST | Créer un rendez-vous (legacy, crée aussi dans la table) |
| `/api/conseiller/file-active/[id]/rdv/[rdvId]/ics` | GET | Télécharger le fichier ICS |
| `/api/conseiller/rdv` | GET | **Lister tous les RDV du conseiller** (vue agenda) |
| `/api/conseiller/rdv` | POST | **Créer un RDV** (avec message structuré auto) |
| `/api/conseiller/rdv/[rdvId]` | GET | Détail d'un RDV |
| `/api/conseiller/rdv/[rdvId]` | PATCH | Modifier un RDV |
| `/api/conseiller/rdv/[rdvId]` | DELETE | Annuler un RDV |
| `/api/accompagnement/rdv` | GET | **Prochains RDV du bénéficiaire** |

---

## 4. Vue Agenda intégrée

### Page Agenda Conseiller (`/conseiller/agenda`)

Accessible depuis la sidebar (icône 📅), cette page offre une **vue centralisée des rendez-vous** du conseiller.

#### 3 vues disponibles :
1. **Aujourd'hui** — Timeline verticale 8h-20h, blocs colorés par statut
2. **Semaine** — 7 colonnes (Lun→Dim), blocs compacts
3. **Liste** — Tableau filtrable et triable

#### Barre de stats :
- Nombre de RDV aujourd'hui, cette semaine, visios à venir

#### Sidebar détail :
- Clic sur un RDV → infos complètes + actions (lancer visio, modifier, annuler, lien calendrier)

#### Création rapide :
- Modale avec champs : Titre, Date, Heure, Durée, Lieu, Bénéficiaire (select depuis cas actifs)
- Auto-génération du lien Jitsi si visio

### Vue Bénéficiaire ("Mes rendez-vous")

Composant `MesRendezVous` intégré à la page d'accompagnement :
- Cards avec barre colorée latérale (statut)
- Formatage intelligent des dates ("Aujourd'hui", "Demain", "Lundi 24 mars")
- Countdown si RDV dans < 1h
- Bouton "Rejoindre" visible 15 min avant un RDV visio
- Liens Google Calendar + ICS
- Auto-refresh 60s

---

## Interface par rôle

### Conseiller (DirectChat)
Barre d'actions au-dessus du champ de saisie :
- 📎 **Document** — ouvre le sélecteur de fichier
- 📹 **Visio** — propose un appel vidéo
- 📅 **RDV** — ouvre le planificateur de rendez-vous

### Bénéficiaire (AccompagnementChat)
- 📎 **Document** — bouton à côté du champ de saisie
- Réception visio : carte avec boutons Accepter/Refuser
- Réception RDV : carte avec liens calendrier

### Tiers (TiersChat)
- 📎 **Document** — bouton à côté du champ de saisie
- Visio/RDV : affichage en lecture seule (ne peut pas initier)

---

## Composants

| Composant | Fichier | Rôle |
|-----------|---------|------|
| `DirectChat` | `src/components/conseiller/DirectChat.tsx` | Chat conseiller avec 📎📹📅 |
| `AccompagnementChat` | `src/components/AccompagnementChat.tsx` | Chat bénéficiaire avec 📎 + réponse visio |
| `TiersChat` | `src/components/TiersChat.tsx` | Chat tiers avec 📎 |
| `VideoCallCard` | `src/components/VideoCallCard.tsx` | Carte d'appel visio |
| `RdvCard` | `src/components/RdvCard.tsx` | Carte de rendez-vous |
| `PlanifierRdvModal` | `src/components/conseiller/PlanifierRdvModal.tsx` | Modale de planification |
| `AgendaPage` | `src/app/conseiller/agenda/page.tsx` | Vue agenda conseiller (3 vues) |
| `MesRendezVous` | `src/components/MesRendezVous.tsx` | Prochains RDV bénéficiaire (cards) |
| `documents.ts` | `src/lib/documents.ts` | Helpers upload/validation/stockage |
| `jitsi.ts` | `src/lib/jitsi.ts` | Génération URLs Jitsi |
| `calendar.ts` | `src/lib/calendar.ts` | Génération liens calendrier + ICS |
