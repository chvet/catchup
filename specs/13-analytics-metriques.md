# 13 — Analytics & Métriques

> **Statut :** Partiellement implémenté (événements métier stockés en base via tables dédiées — Plausible Analytics non encore intégré)  
> **Dernière mise à jour spec :** 2026-04-07  
> **Fichiers clés :** `src/app/api/conseiller/dashboard/stats/route.ts`, `src/app/api/conseiller/dashboard/usage/route.ts`

## Principe directeur
**Mesurer pour améliorer, pas pour surveiller.** Les analytics servent à comprendre si Catch'Up aide réellement les jeunes, pas à traquer leur comportement. On mesure l'impact (le jeune a-t-il avancé ?) et la qualité (l'IA était-elle pertinente ?), pas l'attention (combien de temps est-il resté scotché ?).

**Pas de :** fingerprinting, tracking publicitaire, revente de données, cookies tiers, intégration Google Analytics (trop intrusif, non conforme RGPD sans consentement).

---

## Architecture analytics

### Choix technique

| Critère | Choix | Justification |
|---------|-------|---------------|
| Outil principal | **Plausible Analytics** (auto-hébergé ou cloud) | Léger (< 1 Ko), sans cookies, conforme RGPD sans bannière, open source |
| Alternative | **Umami** (auto-hébergé) | Même philosophie, gratuit si auto-hébergé |
| Événements métier | **Base PostgreSQL interne** | Les événements spécifiques Catch'Up (profil, quiz, referral) sont dans nos propres tables |
| Tableau de bord | **Tableau de bord interne** (page `/admin`) | Pour les métriques métier, pas besoin d'un outil externe |

### Pourquoi pas Google Analytics ?
- Nécessite un bandeau de consentement cookies (friction pour le jeune)
- Envoie les données à Google (problème RGPD + éthique)
- Surdimensionné pour nos besoins
- Script lourd (~45 Ko) qui ralentit la page

### Flux des données

```
Navigateur du jeune
  │
  ├── Événements de page (visite, navigation)
  │   └── → Plausible (script < 1 Ko, sans cookies)
  │         └── → Tableau de bord Plausible
  │
  └── Événements métier (quiz, profil, referral, chat)
      └── → API interne (/api/evenements)
            └── → Tables PostgreSQL (evenement_quiz, source_captation, etc.)
                  └── → Tableau de bord interne (/admin)
```

---

## Les 3 niveaux de métriques

### Niveau 1 — Acquisition (les jeunes arrivent-ils ?)

| Métrique | Source | Calcul | Objectif |
|----------|--------|--------|----------|
| Visiteurs uniques | Plausible | Comptage par jour/semaine/mois | 500/mois (M1) → 10 000 (M6) |
| Sources de trafic | Plausible | Répartition par canal (direct, réseaux, prescripteur, SEO) | Diversification |
| Taux de rebond | Plausible | % visiteurs qui partent sans interaction | < 40% |
| Quiz démarrés | PostgreSQL (`evenement_quiz`) | Comptage des quiz avec au moins 1 réponse | 60% des visiteurs /quiz |
| Quiz complétés | PostgreSQL (`evenement_quiz`) | Comptage des quiz terminés | 85% des démarrés |
| Conversion quiz → chat | PostgreSQL (`evenement_quiz.a_continue_chat`) | % de quiz terminés suivis d'un chat | > 40% |
| Efficacité par prescripteur | PostgreSQL (`source_captation`) | Visites / quiz / chats par code prescripteur | > 5 jeunes/prescripteur/mois |
| Coût par acquisition (si pub) | Externe (Meta/Google Ads) | Budget / nombre de quiz complétés | < 1€ |

### Niveau 2 — Engagement (les jeunes restent-ils ?)

| Métrique | Source | Calcul | Objectif |
|----------|--------|--------|----------|
| Messages par conversation | PostgreSQL (`conversation.nb_messages`) | Moyenne | > 8 |
| Durée de conversation | PostgreSQL (`conversation.duree_secondes`) | Moyenne | 5-15 minutes |
| Conversations par utilisateur | PostgreSQL | `COUNT(conversation) GROUP BY utilisateur_id` | > 1.5 |
| Taux de retour J+1 | PostgreSQL | % utilisateurs revenus le lendemain | > 25% |
| Taux de retour J+7 | PostgreSQL | % utilisateurs revenus dans les 7 jours | > 15% |
| Taux de retour J+30 | PostgreSQL | % utilisateurs revenus dans les 30 jours | > 8% |
| Phase atteinte | PostgreSQL (`conversation.phase`) | Répartition : accroche/découverte/exploration/projection/action | > 30% atteignent "exploration" |
| Streak moyen | PostgreSQL (`progression.streak_actuel`) | Moyenne des streaks actifs | > 3 jours |
| Emails collectés | PostgreSQL (`utilisateur.email IS NOT NULL`) | Taux de conversion anonyme → authentifié | > 15% des engagés |
| PWA installées | Événement interne | Comptage des `appinstalled` | > 10% des récurrents |

### Niveau 3 — Impact (Catch'Up aide-t-il vraiment ?)

| Métrique | Source | Calcul | Objectif |
|----------|--------|--------|----------|
| Profils stabilisés | PostgreSQL (`profil_riasec.est_stable`) | % des utilisateurs avec 8+ messages ayant un profil stable | > 60% |
| Indice de confiance moyen | PostgreSQL (`indice_confiance.score_global`) | Moyenne au moment de la stabilisation | > 0.60 |
| Pistes métiers explorées | PostgreSQL (`progression.nb_metiers_explores`) | Moyenne par utilisateur engagé | > 2 |
| Mises en relation demandées | PostgreSQL (`referral`) | Nombre total et % des conversations éligibles | > 20% des profils stables |
| Mises en relation abouties | PostgreSQL (`referral.statut = 'recontacte'`) | % des referrals effectivement recontactés | > 80% |
| Délai moyen de recontact | PostgreSQL (`referral`) | Temps entre création et `recontacte_le` | < 48h |
| Détection de fragilité | PostgreSQL (`message.fragilite_detectee`) | Nombre de conversations flaggées | Monitoring |
| Urgences (niveau 3) | PostgreSQL (`referral.niveau_detection = 3`) | Nombre d'alertes 3114 déclenchées | Monitoring critique |
| Satisfaction (futur) | Enquête in-app | Note 1-5 proposée après 10+ messages | > 4/5 |

---

## Événements trackés

### Événements Plausible (navigation)

| Événement | Quand | Propriétés |
|-----------|-------|-----------|
| Visite de page | Chaque chargement de page | URL, référent, appareil, pays |
| Quiz démarré | Clic "C'est parti" | source (direct, prescripteur, parrainage) |
| Quiz terminé | Affichage du résultat | résultat (A-S, I-E...), durée |
| Chat ouvert | Premier message envoyé | origine (direct, quiz, retour) |
| Profil consulté | Ouverture du panel profil | — |
| PWA installée | Événement `appinstalled` | — |
| Partage effectué | Clic sur un bouton de partage | type (profil, quiz, défi) |

**Implémentation Plausible :**

```html
<!-- Dans le <head> -->
<script defer data-domain="catchup.jaeprive.fr" src="https://plausible.io/js/script.js"></script>
```

```typescript
// Événement personnalisé
declare global {
  interface Window {
    plausible?: (evenement: string, options?: { props: Record<string, string> }) => void
  }
}

function trackerEvenement(nom: string, proprietes?: Record<string, string>) {
  window.plausible?.(nom, proprietes ? { props: proprietes } : undefined)
}

// Exemples d'utilisation
trackerEvenement('quiz_termine', { resultat: 'A-S', duree: '18s' })
trackerEvenement('chat_ouvert', { origine: 'quiz' })
trackerEvenement('pwa_installee')
```

### Événements internes (tables PostgreSQL)

Les événements métier sont déjà stockés dans les tables définies dans la spec 07. Pas de table séparée "événements" — les données sont dans leurs tables métier :

| Événement | Table source | Champ |
|-----------|-------------|-------|
| Quiz complété | `evenement_quiz` | Ligne complète |
| Profil mis à jour | `instantane_profil` | Nouvelle ligne à chaque extraction |
| Profil stabilisé | `profil_riasec` | `est_stable = 1` |
| Indice de confiance calculé | `indice_confiance` | Mis à jour à chaque extraction |
| Referral créé | `referral` | Nouvelle ligne |
| Referral recontacté | `referral` | `statut = 'recontacte'` |
| Fragilité détectée | `message` | `fragilite_detectee = 1` |
| Email collecté | `utilisateur` | `email` passe de NULL à une valeur |
| Badge débloqué | `badge` | Nouvelle ligne |
| Source captation | `source_captation` | Compteurs incrémentés |

---

## Tableau de bord interne — `/admin`

### Accès
- Protégé par mot de passe (authentification basique ou magic link vers email admin)
- Accessible uniquement aux administrateurs Catch'Up (équipe JAE)
- URL : `catchup.jaeprive.fr/admin`

### Structure

```
┌──────────────────────────────────────────────────┐
│  Catch'Up — Tableau de bord          [Période ▾] │
│                                                  │
│  ── Vue d'ensemble ───────────────────────────   │
│                                                  │
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐   │
│  │  1 247  │ │   834  │ │   412  │ │    67  │   │
│  │visiteurs│ │  quiz  │ │ chats  │ │referral│   │
│  │ ce mois │ │complétés│ │ouverts │ │  créés │   │
│  │ +23% ▲  │ │ +15% ▲ │ │ +8% ▲  │ │ +45% ▲ │   │
│  └────────┘ └────────┘ └────────┘ └────────┘   │
│                                                  │
│  ── Entonnoir de conversion ──────────────────   │
│                                                  │
│  Visiteurs    ████████████████████ 1 247 (100%)  │
│  Quiz démarré ██████████████░░░░░   812 (65%)   │
│  Quiz fini    ████████████░░░░░░░   690 (85%*)  │
│  Chat ouvert  ████████░░░░░░░░░░░   412 (60%*)  │
│  4+ messages  ██████░░░░░░░░░░░░░   289 (70%*)  │
│  Profil stable ███░░░░░░░░░░░░░░░   156 (54%*)  │
│  Email donné  ██░░░░░░░░░░░░░░░░░    89 (57%*)  │
│  Referral     █░░░░░░░░░░░░░░░░░░    67 (43%*)  │
│                                     * du palier  │
│                                       précédent  │
│  ── Qualité IA ───────────────────────────────   │
│                                                  │
│  Taux d'extraction profil    97%  ✅              │
│  Indice de confiance moyen   0.64 ✅              │
│  Messages avant stabilisation 11  ✅              │
│  Fragilités détectées         23  ⚠️              │
│  Urgences (niveau 3)           1  🔴              │
│                                                  │
│  ── Sources d'acquisition ────────────────────   │
│                                                  │
│  Direct           ████████░░ 412 (33%)           │
│  Prescripteurs    ██████░░░░ 298 (24%)           │
│  Réseaux sociaux  █████░░░░░ 245 (20%)           │
│  SEO              ████░░░░░░ 178 (14%)           │
│  Parrainage       ██░░░░░░░░  89 (7%)            │
│  Parents          █░░░░░░░░░  25 (2%)            │
│                                                  │
│  ── Top prescripteurs ────────────────────────   │
│                                                  │
│  1. ML-PARIS15     47 jeunes  23 quiz  3 referral│
│  2. CIO-LYON3      31 jeunes  18 quiz  5 referral│
│  3. E2C-MARSEILLE  28 jeunes  12 quiz  2 referral│
│                                                  │
│  ── Profils RIASEC (distribution) ────────────   │
│                                                  │
│  Artiste        ████████░░ 28%                   │
│  Social         ███████░░░ 24%                   │
│  Investigateur  █████░░░░░ 18%                   │
│  Entreprenant   ████░░░░░░ 14%                   │
│  Réaliste       ███░░░░░░░ 10%                   │
│  Conventionnel  ██░░░░░░░░  6%                   │
│                                                  │
│  ── Alertes ──────────────────────────────────   │
│                                                  │
│  🔴 1 urgence (niveau 3) non traitée — J+0      │
│  🟠 3 referrals en attente > 48h                 │
│  ⚠️ Taux d'extraction profil < 95% sur 24h       │
│                                                  │
└──────────────────────────────────────────────────┘
```

### Filtres disponibles

| Filtre | Options |
|--------|---------|
| Période | Aujourd'hui, 7 jours, 30 jours, 90 jours, personnalisé |
| Source | Toutes, Direct, Prescripteur, Réseaux, SEO, Parrainage, Parents |
| Prescripteur | Tous, ou sélection par code |
| Plateforme | Toutes, Web, PWA, App native |

---

## Alertes automatiques

### Alertes critiques (notification immédiate)

| Alerte | Condition | Canal |
|--------|-----------|-------|
| Urgence niveau 3 | `referral.niveau_detection = 3` créé | Email + SMS à l'admin |
| API IA indisponible | 3 erreurs consécutives sur `/api/chat` | Email à l'admin |
| Taux d'extraction < 80% | Sur les 20 derniers messages IA | Email à l'admin |

### Alertes opérationnelles (rapport quotidien)

| Alerte | Condition | Inclus dans le rapport |
|--------|-----------|----------------------|
| Referrals en attente > 48h | `referral.statut = 'en_attente'` depuis > 48h | Liste des referrals concernés |
| Prescripteur inactif | Prescripteur sans visite depuis 30 jours | Liste des prescripteurs |
| Chute de trafic | Visiteurs < 50% de la moyenne mobile 7 jours | Graphique comparatif |
| Profils plats | > 30% des profils stabilisés avec écart-type < 10 | Alerte qualité IA |

### Rapport hebdomadaire

Email envoyé chaque lundi à l'équipe Catch'Up :

> **Catch'Up — Bilan semaine 12 (17-23 mars 2026)**
>
> 📊 **312 visiteurs** (+18% vs sem. précédente)
> ✅ **198 quiz complétés** (taux complétion : 87%)
> 💬 **94 conversations engagées** (moy. 11 messages)
> 🎯 **38 profils stabilisés** (indice confiance moy. : 0.67)
> 🤝 **12 mises en relation** (10 recontactés, délai moy. : 36h)
> 🔴 **0 urgence niveau 3**
>
> **Top source :** Prescripteurs (32%)
> **Top profil :** Artiste-Social (26%)
>
> **Points d'attention :**
> - 2 referrals non recontactés > 72h (ML-PARIS15)
> - Taux de conversion quiz→chat en baisse (58% → 52%)

---

## Cohortes et rétention

### Tableau de rétention

Suivi de la rétention par cohorte hebdomadaire :

```
          Sem 0  Sem 1  Sem 2  Sem 3  Sem 4
Sem 10    100%   32%    18%    12%    9%
Sem 11    100%   28%    15%    10%    —
Sem 12    100%   35%    20%    —      —
Sem 13    100%   30%    —      —      —
```

- **Sem 0** : semaine d'inscription (premier message)
- **Sem 1** : % revenus la semaine suivante
- **Objectif Sem 1** : > 30%
- **Objectif Sem 4** : > 10%

### Segmentation des cohortes

| Segment | Définition | Intérêt |
|---------|-----------|---------|
| Par source | Direct vs Prescripteur vs Quiz | Quelle source génère les jeunes les plus engagés ? |
| Par profil | Par dimension dominante | Les profils Artiste restent-ils plus longtemps ? |
| Par indice de confiance | < 50% vs > 50% à la fin de la 1ère session | Un profil fiable prédit-il le retour ? |
| Par gamification | Avec streak vs sans streak | La gamification impacte-t-elle la rétention ? |

---

## Qualité de l'IA

### Métriques spécifiques à l'IA

| Métrique | Calcul | Seuil d'alerte | Action |
|----------|--------|---------------|--------|
| Taux d'extraction profil | % messages IA (après msg 3) contenant un bloc PROFILE valide | < 90% | Vérifier le prompt système |
| Taux de fragilité faux positifs | Estimé par revue manuelle d'un échantillon | > 20% | Ajuster les mots-clés dans `fragility-detector.ts` |
| Diversité des profils | Écart-type de la distribution des dimensions dominantes | Si une dimension > 35% | Vérifier que le prompt ne biaise pas |
| Longueur moyenne des réponses IA | Nombre de mots par message assistant | > 100 mots (trop long) | Ajuster le prompt ("3-4 phrases max") |
| Concordance quiz/chat | % des profils quiz dont le top 2 correspond au top 2 chat | < 50% | Le quiz ou le chat est biaisé |
| Temps de réponse IA | Temps entre l'envoi du message et la fin du streaming | > 5 secondes | Vérifier la latence OpenAI |

### Revue qualitative mensuelle

Chaque mois, l'équipe Catch'Up lit **20 conversations anonymisées** sélectionnées aléatoirement pour évaluer :

1. **Ton** : Catch'Up était-il bienveillant ? Pas condescendant ?
2. **Pertinence** : Les pistes proposées correspondaient-elles au profil ?
3. **Détection** : Les fragilités ont-elles été correctement identifiées ?
4. **Progression** : Le profil RIASEC a-t-il évolué logiquement ?
5. **Mise en relation** : A-t-elle été proposée au bon moment ?

Grille de notation : 1 (mauvais) à 5 (excellent) sur chaque critère. Objectif moyen : > 4/5.

---

## Respect de la vie privée

### Ce qu'on collecte

| Donnée | Stockage | Finalité | Base légale RGPD |
|--------|----------|----------|-----------------|
| Pages visitées (sans cookies) | Plausible | Comprendre le trafic | Intérêt légitime |
| Événements quiz (anonymes) | PostgreSQL | Mesurer la conversion | Intérêt légitime |
| Messages de conversation | PostgreSQL | Fonctionnement du service | Intérêt légitime (anonyme) / Consentement (si email) |
| Profil RIASEC | PostgreSQL | Fonctionnement du service | Idem |
| Email (si fourni) | PostgreSQL | Persistance et relances | Consentement explicite |
| Données prescripteur | PostgreSQL | Tableau de bord pro | Contrat (inscription volontaire) |

### Ce qu'on ne collecte JAMAIS

- Adresse IP (Plausible ne la stocke pas)
- Fingerprint navigateur
- Cookies tiers
- Géolocalisation précise
- Historique de navigation externe
- Contacts, photos, ou données du téléphone
- Données revendues ou partagées avec des tiers

### Anonymisation pour les analytics

- Les conversations lues en revue qualitative sont **anonymisées** : prénom remplacé par un code, pas d'email, pas de localisation
- Les métriques du tableau de bord sont **agrégées** : jamais de données individuelles visibles (sauf les referrals, avec consentement du jeune)
- Les données Plausible sont **agrégées par défaut** (pas de suivi individuel possible)

---

## Implémentation technique

### Service d'événements internes

```typescript
// src/services/analytics.ts

interface Evenement {
  type: string
  utilisateurId?: string
  proprietes?: Record<string, string | number>
  horodatage: string
}

// Tracker un événement côté client (envoyé à Plausible)
export function trackerPage(proprietes?: Record<string, string>) {
  window.plausible?.('pageview', proprietes ? { props: proprietes } : undefined)
}

export function trackerAction(nom: string, proprietes?: Record<string, string>) {
  window.plausible?.(nom, proprietes ? { props: proprietes } : undefined)
}

// Les événements métier sont gérés directement dans les routes API
// (pas de table "événements" séparée — les données sont dans les tables métier)
```

### Route API du tableau de bord

```typescript
// src/app/api/admin/stats/route.ts

// GET /api/admin/stats?periode=30j
// → Retourne les métriques agrégées pour le tableau de bord

// Protégé par authentification admin
// Les requêtes SQL agrègent les données des tables métier
```

### Variables d'environnement

```
PLAUSIBLE_DOMAINE=catchup.jaeprive.fr
PLAUSIBLE_URL=https://plausible.io       # ou URL auto-hébergée
ADMIN_EMAIL=admin@fondation-jae.org       # pour les alertes
ADMIN_MOT_DE_PASSE_HASH=...              # accès /admin
RAPPORT_HEBDO_DESTINATAIRES=equipe@fondation-jae.org
```

---

## Dashboard Conseiller (cf. spec 17)

En plus du dashboard admin interne, un **dashboard dédié aux conseillers** est disponible sur `/conseiller` (cf. spec 17 — Dashboard conseiller).

Ce dashboard ajoute des métriques spécifiques à la prise en charge :

| Métrique | Description |
|----------|-------------|
| Temps d'attente moyen par structure | Délai entre création referral et première action conseiller |
| Taux de prise en charge | % des referrals effectivement pris en charge |
| Distribution RIASEC des bénéficiaires | Radar chart des profils reçus |
| Funnel chat → referral → prise en charge → terminé | Conversion à chaque étape |
| Prises en charge par structure (empilé) | En cours / terminées / abandonnées |
| Taux de remplissage des structures | Capacité utilisée vs max |

Les données du dashboard conseiller proviennent des mêmes tables PostgreSQL, enrichies par les tables `structure`, `conseiller`, `prise_en_charge` et `evenement_audit` (cf. spec 07).

---

## Métriques des métriques

| Métrique | Description | Objectif |
|----------|-------------|----------|
| Couverture analytics | % des pages et actions couvertes par un événement | 100% |
| Taux de perte d'événements | % d'événements non enregistrés (erreurs réseau, bloqueurs) | < 5% |
| Temps de chargement Plausible | Impact du script sur le temps de chargement | < 50ms |
| Fraîcheur du tableau de bord | Délai entre un événement et son apparition dans /admin | < 1h |
| Taux de lecture du rapport hebdomadaire | % de l'équipe qui ouvre le rapport | 100% (c'est une équipe petite) |
